# AR/VR Model Viewer

A production-ready AR/VR 3D model viewer with a Framer component frontend and a Vercel serverless backend.

## What's Included

| File | Purpose |
|------|---------|
| `ar-vr-viewer.jsx` | Framer Code Component — paste directly into Framer |
| `api/upload-model.js` | Vercel serverless upload endpoint |
| `api-upload-model.js` | Extended endpoint with server-side compression |
| `optimize-models.js` | CLI tool to compress GLB files locally |
| `package.json` | Project dependencies |
| `vercel.json` | Vercel function configuration and CORS headers |

## Quick Start (15 minutes)

### 1. Deploy to Vercel

```bash
git clone https://github.com/YOUR-USERNAME/ar-vr-viewer.git
cd ar-vr-viewer
npm install
vercel --prod
```

Copy the deployment URL (e.g. `https://ar-vr-viewer-abc123.vercel.app`).

### 2. (Optional) Enable persistent storage

In your Vercel project → Settings → Environment Variables, add:
```
BLOB_READ_WRITE_TOKEN=<token from Vercel Storage → Blob>
```

Without this, uploaded files are returned as base64 data URLs (works fine for files under ~5MB).

### 3. Add to Framer

1. Open your Framer project
2. Assets → Code → New Component
3. Paste the entire contents of `ar-vr-viewer.jsx`
4. Find line: `const VERCEL_URL = "https://YOUR-VERCEL-URL.vercel.app"`
5. Replace with your actual Vercel URL
6. Publish

## Features

- Upload GLB/GLTF files via drag & drop or file picker
- 3D preview with orbit controls (rotate, zoom, pan)
- AR on iOS via Quick Look (iPhone 12+)
- AR on Android via Scene Viewer / WebXR (ARCore required)
- Step-by-step AR instructions overlay
- Optional persistent upload to Vercel Blob
- Fully configurable via Framer property controls

## Compress Your Models

```bash
npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions

node optimize-models.js model.glb
# Output: model-optimized.glb (typically 30–60% smaller)

node optimize-models.js --dir ./models
# Optimize all GLBs in a directory
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| 405 error on upload | Check VERCEL_URL in the component matches your deployment |
| AR button missing | Need iPhone 12+ or Android with ARCore; desktop shows 3D only |
| Model won't load | File must be `.glb` or `.gltf`, under 50MB |
| CORS error | Vercel CORS headers are in `vercel.json` — re-deploy if missing |
| Component not showing | Paste the **entire** `ar-vr-viewer.jsx` into the Framer Code editor |

## File Size Guide

| Model Size | Experience |
|-----------|-----------|
| < 5MB | Excellent — fast load, works as base64 |
| 5–20MB | Good — use Vercel Blob for storage |
| 20–50MB | Compress first with `optimize-models.js` |
| > 50MB | Must compress — AR will be slow |

## Guides

- [QUICK-START-CHECKLIST.md](QUICK-START-CHECKLIST.md) — Step-by-step with checkboxes
- [vercel-project-setup.md](vercel-project-setup.md) — Detailed Vercel setup
- [FRAMER-SETUP-GUIDE.md](FRAMER-SETUP-GUIDE.md) — Framer integration details
- [AR-VR-INTEGRATION-GUIDE.md](AR-VR-INTEGRATION-GUIDE.md) — Technical deep-dive
