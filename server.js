/**
 * Local development server
 * Mimics Vercel's serverless function environment
 *
 * Usage: node server.js
 * Then open: http://localhost:3000
 */

import { createServer } from "http"
import uploadHandler from "./api/upload-model.js"
import indexHandler from "./api/index.js"

const PORT = 3000

// Wrap Node's native response to match Vercel/Express API
function wrapRes(nodeRes) {
    const res = nodeRes

    const wrapped = {
        _headers: {},
        statusCode: 200,

        status(code) {
            res.statusCode = code
            return wrapped
        },
        setHeader(key, value) {
            res.setHeader(key, value)
            return wrapped
        },
        getHeader(key) {
            return res.getHeader(key)
        },
        json(data) {
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify(data))
        },
        send(body) {
            res.end(body)
        },
        end(body) {
            res.end(body)
        },
    }

    return wrapped
}

const server = createServer(async (req, res) => {
    const url = req.url.split("?")[0]
    const wrappedRes = wrapRes(res)

    console.log(`${req.method} ${url}`)

    try {
        if (url === "/") {
            await indexHandler(req, wrappedRes)
        } else if (url === "/api/upload-model") {
            await uploadHandler(req, wrappedRes)
        } else if (url === "/api/index" || url === "/api") {
            await indexHandler(req, wrappedRes)
        } else {
            res.statusCode = 404
            res.setHeader("Content-Type", "application/json")
            res.end(JSON.stringify({ error: "Not found", path: url }))
        }
    } catch (err) {
        console.error("Handler error:", err)
        res.statusCode = 500
        res.setHeader("Content-Type", "application/json")
        res.end(JSON.stringify({ error: err.message }))
    }
})

server.listen(PORT, () => {
    console.log("\n========================================")
    console.log(`  Local AR/VR API Server`)
    console.log("========================================")
    console.log(`  Landing page:  http://localhost:${PORT}/`)
    console.log(`  Upload API:    http://localhost:${PORT}/api/upload-model`)
    console.log("========================================")
    console.log("  Press Ctrl+C to stop\n")
})
