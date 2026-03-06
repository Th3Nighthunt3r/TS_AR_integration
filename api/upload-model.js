/**
 * Vercel Serverless Function: Upload GLB/GLTF Model
 *
 * Accepts multipart/form-data with a field named "model".
 * Stores files using Vercel Blob (free tier: up to 1GB).
 *
 * Required environment variable:
 *   BLOB_READ_WRITE_TOKEN  — set this in Vercel project settings
 *
 * Falls back to base64 data URL if BLOB_READ_WRITE_TOKEN is not set.
 */

import { put } from "@vercel/blob"
import formidable from "formidable"
import { createReadStream, readFileSync } from "fs"
import { extname } from "path"

export const config = {
    api: {
        bodyParser: false,
    },
}

const ALLOWED_EXTENSIONS = [".glb", ".gltf"]
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024 // 100MB

function setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

async function parseForm(req) {
    const form = formidable({
        maxFileSize: MAX_FILE_SIZE_BYTES,
        keepExtensions: true,
    })
    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err)
            else resolve({ fields, files })
        })
    })
}

export default async function handler(req, res) {
    setCorsHeaders(res)

    if (req.method === "OPTIONS") {
        return res.status(200).end()
    }

    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." })
    }

    let parsed
    try {
        parsed = await parseForm(req)
    } catch (err) {
        if (err.code === 1009) {
            return res.status(413).json({
                error: `File too large. Maximum allowed size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
            })
        }
        return res.status(400).json({ error: "Failed to parse upload.", message: err.message })
    }

    const { files } = parsed
    const file = Array.isArray(files.model) ? files.model[0] : files.model

    if (!file) {
        return res.status(400).json({
            error: "No file received. POST a multipart/form-data body with field name 'model'.",
        })
    }

    const ext = extname(file.originalFilename || "").toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({
            error: `File type '${ext}' not allowed. Accepted types: ${ALLOWED_EXTENSIONS.join(", ")}`,
        })
    }

    const contentType = ext === ".glb" ? "model/gltf-binary" : "model/gltf+json"

    // If Vercel Blob token is configured, use persistent cloud storage
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const blobPath = `models/${Date.now()}-${file.originalFilename}`
            const blob = await put(blobPath, createReadStream(file.filepath), {
                access: "public",
                contentType,
                addRandomSuffix: false,
            })

            return res.status(200).json({
                success: true,
                url: blob.url,
                filename: file.originalFilename,
                size: file.size,
                storage: "vercel-blob",
            })
        } catch (err) {
            console.error("Vercel Blob upload failed:", err)
            // Fall through to base64 fallback
        }
    }

    // Fallback: return base64 data URL (works without Blob token, best for files < 5MB)
    try {
        const fileBuffer = readFileSync(file.filepath)
        const base64 = fileBuffer.toString("base64")
        const dataUrl = `data:${contentType};base64,${base64}`

        const warningMsg =
            file.size > 5 * 1024 * 1024
                ? "File is large for a data URL. Set BLOB_READ_WRITE_TOKEN for persistent storage."
                : null

        return res.status(200).json({
            success: true,
            url: dataUrl,
            filename: file.originalFilename,
            size: file.size,
            storage: "base64-fallback",
            ...(warningMsg && { warning: warningMsg }),
        })
    } catch (err) {
        console.error("Base64 fallback failed:", err)
        return res.status(500).json({ error: "Upload processing failed.", message: err.message })
    }
}
