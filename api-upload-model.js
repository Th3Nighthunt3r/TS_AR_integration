/**
 * Extended Upload Handler with Server-Side Compression
 *
 * This is the extended version of api/upload-model.js.
 * It adds optional server-side GLB compression using @gltf-transform.
 *
 * To use this instead of the standard handler:
 *   cp api-upload-model.js api/upload-model.js
 *
 * Additional dependencies required:
 *   npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions draco3dgltf
 *
 * Environment variables:
 *   BLOB_READ_WRITE_TOKEN  — Vercel Blob token (required for persistent storage)
 *   ENABLE_COMPRESSION     — set to "true" to enable server-side compression (default: false)
 */

import { put } from "@vercel/blob"
import formidable from "formidable"
import { createReadStream, readFileSync, writeFileSync } from "fs"
import { extname, join } from "path"
import { tmpdir } from "os"

export const config = {
    api: {
        bodyParser: false,
    },
}

const ALLOWED_EXTENSIONS = [".glb", ".gltf"]
const MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024

function setCorsHeaders(res) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

async function parseForm(req) {
    const form = formidable({ maxFileSize: MAX_FILE_SIZE_BYTES, keepExtensions: true })
    return new Promise((resolve, reject) => {
        form.parse(req, (err, fields, files) => {
            if (err) reject(err)
            else resolve({ fields, files })
        })
    })
}

/**
 * Compress a GLB file using @gltf-transform.
 * Reduces file size by deduplicating, quantizing, and welding geometry.
 * Returns path to compressed file, or original path if compression fails.
 */
async function compressGlb(inputPath, originalFilename) {
    try {
        const { NodeIO } = await import("@gltf-transform/core")
        const { dedup, flatten, join, quantize, sparse, weld } = await import("@gltf-transform/functions")
        const { KHRONOS_EXTENSIONS } = await import("@gltf-transform/extensions")

        const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS)
        const document = await io.read(inputPath)

        await document.transform(
            dedup(),
            flatten(),
            join(),
            weld({ tolerance: 0.0001 }),
            quantize(),
            sparse()
        )

        const outputPath = join(tmpdir(), `compressed-${Date.now()}-${originalFilename}`)
        await io.write(outputPath, document)
        return outputPath
    } catch (err) {
        console.warn("Compression failed, using original file:", err.message)
        return inputPath
    }
}

export default async function handler(req, res) {
    setCorsHeaders(res)

    if (req.method === "OPTIONS") return res.status(200).end()
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed. Use POST." })
    }

    let parsed
    try {
        parsed = await parseForm(req)
    } catch (err) {
        if (err.code === 1009) {
            return res.status(413).json({
                error: `File too large. Max size is ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB.`,
            })
        }
        return res.status(400).json({ error: "Failed to parse upload.", message: err.message })
    }

    const { files, fields } = parsed
    const file = Array.isArray(files.model) ? files.model[0] : files.model

    if (!file) {
        return res.status(400).json({ error: "No file received. Use field name 'model'." })
    }

    const ext = extname(file.originalFilename || "").toLowerCase()
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
        return res.status(400).json({
            error: `File type '${ext}' not allowed. Accepted: ${ALLOWED_EXTENSIONS.join(", ")}`,
        })
    }

    const contentType = ext === ".glb" ? "model/gltf-binary" : "model/gltf+json"
    const enableCompression =
        process.env.ENABLE_COMPRESSION === "true" ||
        fields.compress?.[0] === "true"

    let filePath = file.filepath
    let compressed = false
    const originalSize = file.size

    // Optionally compress GLB server-side
    if (enableCompression && ext === ".glb") {
        filePath = await compressGlb(file.filepath, file.originalFilename)
        compressed = filePath !== file.filepath
    }

    // Upload to Vercel Blob if token is available
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const blobPath = `models/${Date.now()}-${file.originalFilename}`
            const blob = await put(blobPath, createReadStream(filePath), {
                access: "public",
                contentType,
                addRandomSuffix: false,
            })

            const compressedSize = compressed
                ? (await import("fs")).statSync(filePath).size
                : originalSize

            return res.status(200).json({
                success: true,
                url: blob.url,
                filename: file.originalFilename,
                originalSize,
                size: compressedSize,
                compressed,
                ...(compressed && {
                    compressionRatio: `${((1 - compressedSize / originalSize) * 100).toFixed(1)}%`,
                }),
                storage: "vercel-blob",
            })
        } catch (err) {
            console.error("Blob upload error:", err)
        }
    }

    // Fallback: base64 data URL
    const fileBuffer = readFileSync(filePath)
    const base64 = fileBuffer.toString("base64")
    const dataUrl = `data:${contentType};base64,${base64}`

    return res.status(200).json({
        success: true,
        url: dataUrl,
        filename: file.originalFilename,
        size: fileBuffer.length,
        originalSize,
        compressed,
        storage: "base64-fallback",
        ...(file.size > 5 * 1024 * 1024 && {
            warning: "Large file returned as base64. Set BLOB_READ_WRITE_TOKEN for better performance.",
        }),
    })
}
