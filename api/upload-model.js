import { put } from "@vercel/blob"
import formidable from "formidable"
import { createReadStream, readFileSync } from "fs"
import { extname } from "path"

export const config = {
    api: { bodyParser: false },
}

const ALLOWED = [".glb", ".gltf"]
const MAX_BYTES = 100 * 1024 * 1024

function cors(res) {
    res.setHeader("Access-Control-Allow-Origin", "*")
    res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS")
    res.setHeader("Access-Control-Allow-Headers", "Content-Type")
}

function parseForm(req) {
    return new Promise((resolve, reject) => {
        const form = formidable({ maxFileSize: MAX_BYTES, keepExtensions: true })
        form.parse(req, (err, _fields, files) => {
            if (err) reject(err)
            else resolve(files)
        })
    })
}

export default async function handler(req, res) {
    cors(res)

    if (req.method === "OPTIONS") return res.status(200).end()
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Use POST with multipart/form-data, field name: model" })
    }

    let files
    try {
        files = await parseForm(req)
    } catch (err) {
        const tooLarge = err.code === 1009 || err.message?.includes("maxFileSize")
        return res.status(tooLarge ? 413 : 400).json({
            error: tooLarge ? `File exceeds ${MAX_BYTES / 1024 / 1024}MB limit` : "Failed to parse upload",
        })
    }

    const file = Array.isArray(files.model) ? files.model[0] : files.model
    if (!file) {
        return res.status(400).json({ error: "No file received. Use field name: model" })
    }

    const ext = extname(file.originalFilename || "").toLowerCase()
    if (!ALLOWED.includes(ext)) {
        return res.status(400).json({ error: `Only ${ALLOWED.join(", ")} files allowed` })
    }

    const contentType = ext === ".glb" ? "model/gltf-binary" : "model/gltf+json"

    // Use Vercel Blob if token is set (persistent URLs)
    if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
            const blob = await put(
                `models/${Date.now()}-${file.originalFilename}`,
                createReadStream(file.filepath),
                { access: "public", contentType, addRandomSuffix: false }
            )
            return res.status(200).json({
                success: true,
                url: blob.url,
                filename: file.originalFilename,
                size: file.size,
                storage: "vercel-blob",
            })
        } catch (err) {
            console.error("Blob upload failed:", err.message)
        }
    }

    // Fallback: base64 data URL (no storage setup needed, works for files < ~5MB)
    try {
        const buf = readFileSync(file.filepath)
        return res.status(200).json({
            success: true,
            url: `data:${contentType};base64,${buf.toString("base64")}`,
            filename: file.originalFilename,
            size: buf.length,
            storage: "base64",
            ...(file.size > 5 * 1024 * 1024 && {
                warning: "Large file as base64. Add BLOB_READ_WRITE_TOKEN for better performance.",
            }),
        })
    } catch (err) {
        return res.status(500).json({ error: "Failed to process file", message: err.message })
    }
}
