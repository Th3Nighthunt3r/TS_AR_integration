#!/usr/bin/env node
/**
 * GLB Optimizer — Compress 3D models for AR/VR
 *
 * Reduces file size by deduplicating resources, welding vertices,
 * quantizing geometry data, and removing redundant scene graph nodes.
 * Typical result: 30–70% size reduction.
 *
 * Usage:
 *   node optimize-models.js model.glb
 *   node optimize-models.js model.glb --output model-compressed.glb
 *   node optimize-models.js --dir ./models
 *   node optimize-models.js --dir ./models --suffix -opt
 *
 * Install dependencies first:
 *   npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions
 */

import { NodeIO } from "@gltf-transform/core"
import {
    dedup,
    flatten,
    join,
    quantize,
    sparse,
    weld,
    instance,
    prune,
    resample,
} from "@gltf-transform/functions"
import { KHRONOS_EXTENSIONS } from "@gltf-transform/extensions"
import { promises as fs, statSync } from "fs"
import path from "path"

const args = process.argv.slice(2)

// ─────────────────────────────────────────────────────────────────────────────
// ARGUMENT PARSING
// ─────────────────────────────────────────────────────────────────────────────

function parseArgs(argv) {
    const result = {
        input: null,
        output: null,
        dir: null,
        suffix: "-optimized",
        verbose: false,
        help: false,
    }

    for (let i = 0; i < argv.length; i++) {
        switch (argv[i]) {
            case "--output":
            case "-o":
                result.output = argv[++i]
                break
            case "--dir":
            case "-d":
                result.dir = argv[++i]
                break
            case "--suffix":
            case "-s":
                result.suffix = argv[++i]
                break
            case "--verbose":
            case "-v":
                result.verbose = true
                break
            case "--help":
            case "-h":
                result.help = true
                break
            default:
                if (!argv[i].startsWith("--")) {
                    result.input = argv[i]
                }
        }
    }

    return result
}

// ─────────────────────────────────────────────────────────────────────────────
// OPTIMIZATION
// ─────────────────────────────────────────────────────────────────────────────

async function createIO() {
    const io = new NodeIO().registerExtensions(KHRONOS_EXTENSIONS)
    return io
}

async function optimizeFile(io, inputPath, outputPath, verbose = false) {
    const sizeBefore = statSync(inputPath).size

    if (verbose) {
        console.log(`  Reading: ${inputPath}`)
    }

    const document = await io.read(inputPath)

    await document.transform(
        // Remove unused resources (images, accessors, materials)
        prune(),
        // Remove duplicate resources that are byte-for-byte identical
        dedup(),
        // Flatten unnecessary parent/child node relationships
        flatten(),
        // Merge meshes that share the same material (reduces draw calls)
        join(),
        // Merge vertices that are close enough to be considered identical
        weld({ tolerance: 0.0001 }),
        // Compress float32 geometry data to int16 (smaller, barely perceptible quality loss)
        quantize(),
        // Use sparse encoding for morph target data
        sparse(),
        // Smooth animation curves by removing redundant keyframes
        resample()
    )

    if (verbose) {
        const root = document.getRoot()
        const meshCount = root.listMeshes().length
        const materialCount = root.listMaterials().length
        const textureCount = root.listTextures().length
        console.log(`  Meshes: ${meshCount}, Materials: ${materialCount}, Textures: ${textureCount}`)
    }

    await io.write(outputPath, document)

    const sizeAfter = statSync(outputPath).size
    const savedBytes = sizeBefore - sizeAfter
    const savedPercent = ((savedBytes / sizeBefore) * 100).toFixed(1)

    return {
        sizeBefore,
        sizeAfter,
        savedBytes,
        savedPercent,
    }
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1024 / 1024).toFixed(2)}MB`
}

function printResult(inputPath, outputPath, stats) {
    const name = path.basename(inputPath)
    const arrow = stats.savedPercent > 0 ? "✓" : "~"
    console.log(
        `  ${arrow} ${name}: ${formatBytes(stats.sizeBefore)} → ${formatBytes(stats.sizeAfter)} ` +
        `(${stats.savedPercent > 0 ? "-" : ""}${Math.abs(stats.savedPercent)}%)`
    )
    if (outputPath !== inputPath) {
        console.log(`    Saved to: ${outputPath}`)
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────────────────────────────────────

const HELP_TEXT = `
GLB Optimizer — Compress 3D models for AR/VR use

Usage:
  node optimize-models.js <input.glb> [options]
  node optimize-models.js --dir <directory> [options]

Options:
  -o, --output <path>    Output file (default: <input>-optimized.glb)
  -d, --dir <path>       Optimize all GLBs in a directory
  -s, --suffix <string>  Suffix for batch output files (default: -optimized)
  -v, --verbose          Show detailed transform info
  -h, --help             Show this help

Examples:
  node optimize-models.js robot.glb
  node optimize-models.js robot.glb -o robot-small.glb
  node optimize-models.js --dir ./models
  node optimize-models.js --dir ./models --suffix -v2

Install dependencies:
  npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions

Typical results:
  - Geometry-heavy models: 30–60% smaller
  - Models with animations: 20–40% smaller
  - Already-optimized models: 5–15% smaller
`

async function main() {
    const opts = parseArgs(args)

    if (opts.help || args.length === 0) {
        console.log(HELP_TEXT)
        process.exit(0)
    }

    let io
    try {
        io = await createIO()
    } catch (err) {
        console.error(
            "Failed to initialize. Make sure dependencies are installed:\n" +
            "  npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions\n"
        )
        process.exit(1)
    }

    // Batch mode: optimize all GLBs in a directory
    if (opts.dir) {
        const dirPath = path.resolve(opts.dir)

        let entries
        try {
            entries = await fs.readdir(dirPath)
        } catch {
            console.error(`Error: Directory not found — ${dirPath}`)
            process.exit(1)
        }

        const glbFiles = entries.filter((f) => f.toLowerCase().endsWith(".glb"))

        if (glbFiles.length === 0) {
            console.log("No GLB files found in directory:", dirPath)
            process.exit(0)
        }

        console.log(`\nOptimizing ${glbFiles.length} file(s) in: ${dirPath}\n`)

        let totalBefore = 0
        let totalAfter = 0

        for (const file of glbFiles) {
            const inputPath = path.join(dirPath, file)
            const baseName = file.slice(0, -4) // strip .glb
            const outputPath = path.join(dirPath, `${baseName}${opts.suffix}.glb`)

            try {
                const stats = await optimizeFile(io, inputPath, outputPath, opts.verbose)
                printResult(inputPath, outputPath, stats)
                totalBefore += stats.sizeBefore
                totalAfter += stats.sizeAfter
            } catch (err) {
                console.error(`  ✗ ${file}: ${err.message}`)
            }
        }

        const totalSaved = ((1 - totalAfter / totalBefore) * 100).toFixed(1)
        console.log(
            `\nTotal: ${formatBytes(totalBefore)} → ${formatBytes(totalAfter)} (-${totalSaved}%)\n`
        )
        return
    }

    // Single file mode
    if (!opts.input) {
        console.error("Error: No input file specified. Use --help for usage.")
        process.exit(1)
    }

    const inputPath = path.resolve(opts.input)

    try {
        await fs.access(inputPath)
    } catch {
        console.error(`Error: File not found — ${inputPath}`)
        process.exit(1)
    }

    if (!inputPath.toLowerCase().endsWith(".glb")) {
        console.error("Error: Only GLB files are supported.")
        process.exit(1)
    }

    let outputPath
    if (opts.output) {
        outputPath = path.resolve(opts.output)
    } else {
        const base = inputPath.slice(0, -4)
        outputPath = `${base}${opts.suffix}.glb`
    }

    console.log(`\nOptimizing: ${path.basename(inputPath)}`)

    try {
        const stats = await optimizeFile(io, inputPath, outputPath, opts.verbose)
        printResult(inputPath, outputPath, stats)
        console.log("")
    } catch (err) {
        console.error(`Error: ${err.message}`)
        process.exit(1)
    }
}

main().catch((err) => {
    console.error("Unexpected error:", err.message)
    process.exit(1)
})
