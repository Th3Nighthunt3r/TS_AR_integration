/**
 * AR/VR Model Viewer — Framer Code Component
 *
 * Paste this entire file into a Framer Code Component.
 *
 * SETUP:
 *   1. Deploy the api/ folder to Vercel
 *   2. Update VERCEL_URL below with your actual Vercel deployment URL
 *   3. Paste into Framer → Assets → Code → New Component
 *
 * FEATURES:
 *   - Drag & drop or browse to upload GLB/GLTF files
 *   - 3D preview with rotate, zoom, pan controls
 *   - AR mode on iOS (Quick Look) and Android (Scene Viewer / WebXR)
 *   - Step-by-step AR instructions overlay
 *   - Optional upload to Vercel for persistent model URLs
 *   - Fully configurable via Framer property controls
 */

import { useState, useEffect, useRef, useCallback } from "react"
import { addPropertyControls, ControlType } from "framer"

// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURATION — Update VERCEL_URL after deploying to Vercel
// ─────────────────────────────────────────────────────────────────────────────

const VERCEL_URL = "https://YOUR-VERCEL-URL.vercel.app"
const MODEL_VIEWER_CDN = "https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js"

// ─────────────────────────────────────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────────────────────────────────────

function getStyles(primaryColor, backgroundColor, isDragging) {
    const gradient = `linear-gradient(135deg, ${primaryColor}, #a855f7)`

    return {
        container: {
            width: "100%",
            height: "100%",
            minHeight: "500px",
            backgroundColor,
            borderRadius: "16px",
            overflow: "hidden",
            position: "relative",
            display: "flex",
            flexDirection: "column",
            fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            color: "#ffffff",
            boxSizing: "border-box",
        },
        header: {
            padding: "16px 20px",
            background: "linear-gradient(135deg, rgba(6,182,212,0.08), rgba(168,85,247,0.08))",
            borderBottom: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
        },
        headerTitle: {
            fontSize: "16px",
            fontWeight: "700",
            background: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            margin: 0,
        },
        dropZone: {
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "20px",
            padding: "40px 24px",
            cursor: "pointer",
            border: `2px dashed ${isDragging ? primaryColor : "rgba(255,255,255,0.15)"}`,
            borderRadius: "12px",
            margin: "16px",
            transition: "border-color 0.2s ease, background-color 0.2s ease",
            backgroundColor: isDragging ? `${primaryColor}0d` : "transparent",
            outline: "none",
        },
        uploadIcon: {
            fontSize: "60px",
            lineHeight: 1,
            opacity: isDragging ? 1 : 0.8,
            transition: "opacity 0.2s ease",
            userSelect: "none",
        },
        uploadTitle: {
            fontSize: "20px",
            fontWeight: "600",
            margin: "0 0 6px",
            textAlign: "center",
        },
        uploadSubtitle: {
            fontSize: "13px",
            color: "rgba(255,255,255,0.45)",
            margin: 0,
            textAlign: "center",
            lineHeight: "1.5",
        },
        uploadBtn: {
            padding: "12px 28px",
            background: gradient,
            color: "white",
            border: "none",
            borderRadius: "50px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: `0 4px 20px ${primaryColor}40`,
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
        },
        viewer: {
            flex: 1,
            position: "relative",
            overflow: "hidden",
            minHeight: "0",
        },
        modelViewer: {
            width: "100%",
            height: "100%",
            minHeight: "350px",
            backgroundColor: "transparent",
            "--progress-bar-color": primaryColor,
            "--progress-mask": "transparent",
        },
        toolbar: {
            padding: "10px 14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(12px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            flexShrink: 0,
            flexWrap: "wrap",
        },
        fileInfo: {
            fontSize: "12px",
            color: "rgba(255,255,255,0.5)",
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            minWidth: 0,
        },
        btn: {
            padding: "7px 14px",
            borderRadius: "8px",
            fontSize: "12px",
            fontWeight: "500",
            cursor: "pointer",
            border: "none",
            transition: "opacity 0.15s ease",
            flexShrink: 0,
            whiteSpace: "nowrap",
        },
        btnPrimary: {
            background: gradient,
            color: "white",
            boxShadow: `0 2px 10px ${primaryColor}30`,
        },
        btnSecondary: {
            backgroundColor: "rgba(255,255,255,0.08)",
            color: "rgba(255,255,255,0.8)",
            border: "1px solid rgba(255,255,255,0.15)",
        },
        errorBanner: {
            margin: "0 16px 8px",
            padding: "10px 14px",
            backgroundColor: "rgba(239,68,68,0.12)",
            border: "1px solid rgba(239,68,68,0.25)",
            borderRadius: "8px",
            fontSize: "12px",
            color: "#fca5a5",
            display: "flex",
            alignItems: "flex-start",
            gap: "8px",
            flexShrink: 0,
        },
        overlay: {
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.82)",
            backdropFilter: "blur(10px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 20,
            padding: "24px",
        },
        card: {
            maxWidth: "340px",
            width: "100%",
            backgroundColor: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "20px",
            padding: "28px 24px",
            textAlign: "center",
        },
        dots: {
            display: "flex",
            justifyContent: "center",
            gap: "6px",
            marginBottom: "20px",
        },
        loadingOverlay: {
            position: "absolute",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.55)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
            gap: "14px",
        },
        spinner: {
            width: "44px",
            height: "44px",
            border: "3px solid rgba(255,255,255,0.15)",
            borderTopColor: primaryColor,
            borderRadius: "50%",
            animation: "arvrSpin 0.75s linear infinite",
        },
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// INSTRUCTIONS DATA
// ─────────────────────────────────────────────────────────────────────────────

const INSTRUCTIONS = [
    {
        icon: "📁",
        title: "Upload Your Model",
        description: "Drag & drop or tap to select a GLB or GLTF 3D model file from your device.",
    },
    {
        icon: "🔄",
        title: "Preview in 3D",
        description: "Rotate with mouse or touch, scroll to zoom, right-click to pan around the model.",
    },
    {
        icon: "📱",
        title: "Launch AR Mode",
        description: 'Tap "View in AR" to place the model in your real space. Requires iPhone 12+ or Android with ARCore.',
    },
    {
        icon: "✋",
        title: "Place & Interact",
        description: "Point at a flat surface, tap to place, pinch to scale, and drag to rotate.",
    },
]

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight any
 */
export default function ARVRViewer({
    initialModelUrl = "",
    primaryColor = "#06b6d4",
    backgroundColor = "#0f0f23",
    maxFileSizeMB = 50,
    autoRotate = true,
    shadowIntensity = "1",
    enableVercelUpload = false,
    style,
    ...props
}) {
    const [modelUrl, setModelUrl] = useState(initialModelUrl || null)
    const [fileName, setFileName] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [isDragging, setIsDragging] = useState(false)
    const [showInstructions, setShowInstructions] = useState(false)
    const [step, setStep] = useState(0)
    const [uploadProgress, setUploadProgress] = useState(0)

    const fileInputRef = useRef(null)
    const modelViewerRef = useRef(null)
    const objectUrlRef = useRef(null)

    const isMobile =
        typeof navigator !== "undefined" && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

    const s = getStyles(primaryColor, backgroundColor, isDragging)

    // Load model-viewer web component and inject spinner keyframe
    useEffect(() => {
        if (typeof window === "undefined") return

        if (!customElements.get("model-viewer")) {
            const script = document.createElement("script")
            script.type = "module"
            script.src = MODEL_VIEWER_CDN
            document.head.appendChild(script)
        }

        if (!document.getElementById("arvr-spin-style")) {
            const styleEl = document.createElement("style")
            styleEl.id = "arvr-spin-style"
            styleEl.textContent = "@keyframes arvrSpin { to { transform: rotate(360deg) } }"
            document.head.appendChild(styleEl)
        }

        return () => {
            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current)
            }
        }
    }, [])

    // Sync model-viewer attributes when props change
    useEffect(() => {
        const mv = modelViewerRef.current
        if (!mv || !modelUrl) return

        if (autoRotate) {
            mv.setAttribute("auto-rotate", "")
        } else {
            mv.removeAttribute("auto-rotate")
        }
        mv.setAttribute("shadow-intensity", shadowIntensity)
    }, [autoRotate, shadowIntensity, modelUrl])

    function validateFile(file) {
        if (!file.name.match(/\.(glb|gltf)$/i)) {
            return "Please upload a GLB or GLTF file."
        }
        if (file.size > maxFileSizeMB * 1024 * 1024) {
            const sizeMB = (file.size / 1024 / 1024).toFixed(1)
            return `File is ${sizeMB}MB — max is ${maxFileSizeMB}MB. Run optimize-models.js to compress it.`
        }
        return null
    }

    const loadModel = useCallback(
        async (file) => {
            const validationError = validateFile(file)
            if (validationError) {
                setError(validationError)
                return
            }

            setLoading(true)
            setError(null)
            setFileName(file.name)

            if (objectUrlRef.current) {
                URL.revokeObjectURL(objectUrlRef.current)
                objectUrlRef.current = null
            }

            const canUpload =
                enableVercelUpload && VERCEL_URL !== "https://YOUR-VERCEL-URL.vercel.app"

            if (canUpload) {
                try {
                    const formData = new FormData()
                    formData.append("model", file)

                    const persistentUrl = await new Promise((resolve, reject) => {
                        const xhr = new XMLHttpRequest()
                        xhr.upload.addEventListener("progress", (e) => {
                            if (e.lengthComputable) {
                                setUploadProgress(Math.round((e.loaded / e.total) * 100))
                            }
                        })
                        xhr.addEventListener("load", () => {
                            if (xhr.status === 200) {
                                resolve(JSON.parse(xhr.responseText).url)
                            } else {
                                reject(new Error(`Upload failed with status ${xhr.status}`))
                            }
                        })
                        xhr.addEventListener("error", () => reject(new Error("Network error")))
                        xhr.open("POST", `${VERCEL_URL}/api/upload-model`)
                        xhr.send(formData)
                    })

                    setModelUrl(persistentUrl)
                } catch (err) {
                    console.warn("Vercel upload failed, using local preview:", err)
                    const localUrl = URL.createObjectURL(file)
                    objectUrlRef.current = localUrl
                    setModelUrl(localUrl)
                    setError(`Upload failed: ${err.message}. Showing local preview instead.`)
                }
            } else {
                // Use local object URL for immediate preview (no backend needed)
                const localUrl = URL.createObjectURL(file)
                objectUrlRef.current = localUrl
                setModelUrl(localUrl)
            }

            setLoading(false)
            setUploadProgress(0)
        },
        [maxFileSizeMB, enableVercelUpload]
    )

    function handleFileSelect(e) {
        const file = e.target.files?.[0]
        if (file) loadModel(file)
        e.target.value = ""
    }

    function handleDrop(e) {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files?.[0]
        if (file) loadModel(file)
    }

    function handleReset() {
        if (objectUrlRef.current) {
            URL.revokeObjectURL(objectUrlRef.current)
            objectUrlRef.current = null
        }
        setModelUrl(null)
        setFileName("")
        setError(null)
        setShowInstructions(false)
        setStep(0)
    }

    const instruction = INSTRUCTIONS[step]

    // ── Instructions Overlay ───────────────────────────────────────────────────

    function InstructionsOverlay({ onClose }) {
        return (
            <div style={s.overlay} onClick={onClose}>
                <div style={s.card} onClick={(e) => e.stopPropagation()}>
                    <div style={s.dots}>
                        {INSTRUCTIONS.map((_, i) => (
                            <div
                                key={i}
                                style={{
                                    width: "7px",
                                    height: "7px",
                                    borderRadius: "50%",
                                    backgroundColor: i === step ? primaryColor : "rgba(255,255,255,0.2)",
                                    cursor: "pointer",
                                    transition: "background-color 0.25s ease",
                                }}
                                onClick={() => setStep(i)}
                            />
                        ))}
                    </div>

                    <div style={{ fontSize: "52px", lineHeight: 1, marginBottom: "14px" }}>
                        {instruction.icon}
                    </div>
                    <h3
                        style={{
                            fontSize: "18px",
                            fontWeight: "700",
                            margin: "0 0 10px",
                        }}
                    >
                        {instruction.title}
                    </h3>
                    <p
                        style={{
                            fontSize: "13px",
                            color: "rgba(255,255,255,0.6)",
                            lineHeight: "1.6",
                            margin: "0 0 24px",
                        }}
                    >
                        {instruction.description}
                    </p>

                    <div style={{ display: "flex", gap: "10px", justifyContent: "center" }}>
                        {step > 0 && (
                            <button
                                style={{ ...s.btn, ...s.btnSecondary }}
                                onClick={() => setStep((i) => i - 1)}
                            >
                                Back
                            </button>
                        )}
                        {step < INSTRUCTIONS.length - 1 ? (
                            <button
                                style={{ ...s.btn, ...s.btnPrimary }}
                                onClick={() => setStep((i) => i + 1)}
                            >
                                Next →
                            </button>
                        ) : (
                            <button
                                style={{ ...s.btn, ...s.btnPrimary }}
                                onClick={() => {
                                    setShowInstructions(false)
                                    setStep(0)
                                }}
                            >
                                Got it!
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // ── Upload Screen ─────────────────────────────────────────────────────────

    if (!modelUrl) {
        return (
            <div style={{ ...s.container, ...style }}>
                <div style={s.header}>
                    <h2 style={s.headerTitle}>AR / VR Model Viewer</h2>
                    <button
                        style={{ ...s.btn, ...s.btnSecondary }}
                        onClick={(e) => {
                            e.stopPropagation()
                            setShowInstructions(true)
                        }}
                    >
                        How it works
                    </button>
                </div>

                {error && (
                    <div style={s.errorBanner}>
                        <span style={{ flexShrink: 0 }}>⚠️</span>
                        <span>{error}</span>
                    </div>
                )}

                <div
                    style={s.dropZone}
                    onDrop={handleDrop}
                    onDragOver={(e) => {
                        e.preventDefault()
                        setIsDragging(true)
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
                >
                    <div style={s.uploadIcon}>{isDragging ? "📥" : "🎯"}</div>
                    <div>
                        <h3 style={s.uploadTitle}>
                            {isDragging ? "Drop your model here" : "Upload 3D Model"}
                        </h3>
                        <p style={s.uploadSubtitle}>
                            {isMobile
                                ? "Tap to select a GLB or GLTF file"
                                : "Drag & drop or click · GLB or GLTF · Max " + maxFileSizeMB + "MB"}
                        </p>
                    </div>
                    <button
                        style={s.uploadBtn}
                        onClick={(e) => {
                            e.stopPropagation()
                            fileInputRef.current?.click()
                        }}
                    >
                        {isMobile ? "Select File" : "Browse Files"}
                    </button>
                    {!isMobile && (
                        <p style={{ ...s.uploadSubtitle, fontSize: "11px" }}>
                            Compatible with Blender, Sketchfab, and any GLTF 2.0 export
                        </p>
                    )}
                </div>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept=".glb,.gltf"
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                />

                {showInstructions && (
                    <InstructionsOverlay onClose={() => setShowInstructions(false)} />
                )}
            </div>
        )
    }

    // ── Viewer Screen ─────────────────────────────────────────────────────────

    return (
        <div style={{ ...s.container, ...style }}>
            <div style={s.header}>
                <h2 style={s.headerTitle}>AR / VR Model Viewer</h2>
                <button
                    style={{ ...s.btn, ...s.btnSecondary }}
                    onClick={() => setShowInstructions(true)}
                >
                    AR guide
                </button>
            </div>

            {error && (
                <div style={s.errorBanner}>
                    <span style={{ flexShrink: 0 }}>⚠️</span>
                    <span>{error}</span>
                </div>
            )}

            <div style={s.viewer}>
                {React.createElement("model-viewer", {
                    ref: modelViewerRef,
                    src: modelUrl,
                    alt: fileName || "3D model",
                    ar: "",
                    "ar-modes": "webxr scene-viewer quick-look",
                    "camera-controls": "",
                    "auto-rotate": autoRotate ? "" : undefined,
                    "shadow-intensity": shadowIntensity,
                    style: s.modelViewer,
                    onError: () =>
                        setError(
                            "Failed to load model. Make sure the file is a valid GLB or GLTF."
                        ),
                })}

                {loading && (
                    <div style={s.loadingOverlay}>
                        <div style={s.spinner} />
                        <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.6)", margin: 0 }}>
                            {uploadProgress > 0
                                ? `Uploading… ${uploadProgress}%`
                                : "Loading model…"}
                        </p>
                    </div>
                )}

                {showInstructions && (
                    <InstructionsOverlay onClose={() => setShowInstructions(false)} />
                )}
            </div>

            <div style={s.toolbar}>
                <span style={s.fileInfo}>{fileName && `📦 ${fileName}`}</span>

                {isMobile && (
                    <button
                        style={{ ...s.btn, ...s.btnPrimary }}
                        onClick={() => modelViewerRef.current?.activateAR?.()}
                    >
                        View in AR
                    </button>
                )}

                <button
                    style={{ ...s.btn, ...s.btnSecondary }}
                    onClick={() => fileInputRef.current?.click()}
                >
                    Change Model
                </button>

                <button style={{ ...s.btn, ...s.btnSecondary }} onClick={handleReset}>
                    Reset
                </button>
            </div>

            <input
                ref={fileInputRef}
                type="file"
                accept=".glb,.gltf"
                onChange={handleFileSelect}
                style={{ display: "none" }}
            />
        </div>
    )
}

// ─────────────────────────────────────────────────────────────────────────────
// FRAMER PROPERTY CONTROLS
// ─────────────────────────────────────────────────────────────────────────────

addPropertyControls(ARVRViewer, {
    initialModelUrl: {
        type: ControlType.String,
        title: "Model URL",
        placeholder: "https://example.com/model.glb",
        defaultValue: "",
    },
    primaryColor: {
        type: ControlType.Color,
        title: "Primary Color",
        defaultValue: "#06b6d4",
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Background",
        defaultValue: "#0f0f23",
    },
    maxFileSizeMB: {
        type: ControlType.Number,
        title: "Max File Size (MB)",
        defaultValue: 50,
        min: 1,
        max: 500,
        step: 1,
    },
    autoRotate: {
        type: ControlType.Boolean,
        title: "Auto Rotate",
        defaultValue: true,
    },
    shadowIntensity: {
        type: ControlType.String,
        title: "Shadow Intensity",
        defaultValue: "1",
    },
    enableVercelUpload: {
        type: ControlType.Boolean,
        title: "Upload to Vercel",
        defaultValue: false,
    },
})
