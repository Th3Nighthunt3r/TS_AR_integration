# AR/VR Integration Guide

Technical reference for the AR/VR model viewer.

---

## How It Works

```
User uploads GLB
      ↓
FileReader → Blob URL        ← local preview (instant, no backend)
      ↓  (if Upload to Vercel is enabled)
POST /api/upload-model
      ↓
Vercel Blob Storage
      ↓
Persistent CDN URL
      ↓
<model-viewer src="...">    ← renders 3D + AR
```

---

## The model-viewer Web Component

The viewer uses [Google's `<model-viewer>`](https://modelviewer.dev), a web component that:

- Renders GLTF 2.0 / GLB using WebGL
- Handles AR via three different APIs depending on device:
  - **iOS Safari**: USDZ Quick Look (converts GLB automatically)
  - **Android Chrome**: Scene Viewer (native Google AR)
  - **WebXR browsers**: Immersive WebXR session

### Key attributes used

```html
<model-viewer
  src="model.glb"
  ar
  ar-modes="webxr scene-viewer quick-look"
  camera-controls
  auto-rotate
  shadow-intensity="1"
>
```

| Attribute | Effect |
|-----------|--------|
| `ar` | Enables the AR button |
| `ar-modes` | Priority order of AR APIs to try |
| `camera-controls` | Enables orbit controls |
| `auto-rotate` | Slowly rotates the model |
| `shadow-intensity` | Drop shadow under model (0 = off) |
| `environment-image` | Lighting environment (`legacy`, `neutral`, custom HDR URL) |

Full attribute reference: https://modelviewer.dev/docs/index.html

---

## AR Platform Requirements

### iOS (Quick Look)
- iPhone 12 or newer (A14 chip minimum for reliable AR)
- iOS 13+ (iOS 15+ recommended)
- Safari browser (Chrome on iOS works but uses Safari's engine)
- The component uses model-viewer's built-in USDZ conversion

### Android (Scene Viewer)
- Android 7.0+ with ARCore installed
- Google Play Services for AR (auto-installed on most devices)
- Chrome 81+

### WebXR
- Chrome 79+ on Android
- Requires device-level WebXR support
- Not available on iOS (Apple hasn't implemented WebXR)

---

## File Format Requirements

### GLB (preferred)
- Binary GLTF 2.0 format
- Single file (textures embedded)
- Supported by all AR platforms

### GLTF
- JSON-based GLTF 2.0
- Can reference external texture files
- Works for 3D preview; GLB is better for AR

### File size guidelines

| Size | Recommendation |
|------|---------------|
| < 5MB | Ideal for AR. Load fast, great experience. |
| 5–20MB | Acceptable. Enable Vercel Blob for storage. |
| 20–50MB | Compress with `optimize-models.js` first. |
| > 50MB | Must compress. AR will time out on slow connections. |

---

## Optimization Pipeline

### Local compression with optimize-models.js

```bash
# Install
npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions

# Compress single file
node optimize-models.js model.glb

# Compress all GLBs in a folder
node optimize-models.js --dir ./models
```

**What the optimizer does:**

| Transform | Effect |
|-----------|--------|
| `prune()` | Removes unreferenced materials, textures, nodes |
| `dedup()` | Merges byte-identical resources |
| `flatten()` | Removes unnecessary parent nodes |
| `join()` | Merges meshes sharing the same material |
| `weld()` | Merges vertices within 0.0001 tolerance |
| `quantize()` | Compresses float32 to int16 (major size win) |
| `sparse()` | Sparse encoding for morph targets |
| `resample()` | Removes redundant animation keyframes |

### External tools

- **gltf-transform CLI**: `gltf-transform optimize model.glb model-opt.glb`
- **Draco compression**: `gltf-transform compress draco model.glb model-opt.glb` (requires Draco decoder in viewer)
- **Meshopt**: Better compression ratio than Draco, growing support
- **Blender**: Re-export with "Apply Modifiers" and "Merge Vertices"

---

## Large File Uploads

Vercel's serverless functions have a 4.5MB request body limit (hobby plan). For files larger than ~4MB:

### Option 1: Direct-to-blob upload from client

Bypass the API entirely and upload straight to Vercel Blob from the browser:

```js
import { upload } from "@vercel/blob/client"

const blob = await upload(file.name, file, {
    access: "public",
    handleUploadUrl: "/api/blob-upload-token",
})

setModelUrl(blob.url)
```

This requires a token endpoint (`/api/blob-upload-token`) that generates a client token. See [Vercel Blob client upload docs](https://vercel.com/docs/storage/vercel-blob/client-upload).

### Option 2: Use external storage

- **Cloudinary**: Free tier 25GB. Good CDN, auto-transcodes.
- **AWS S3**: Free tier 5GB/year. Standard choice for production.
- **Cloudflare R2**: Free 10GB. No egress fees. Recommended for heavy use.

---

## Performance Optimization

### Loading

- Host GLBs on a CDN close to your users (Cloudflare, Fastly, AWS CloudFront)
- Use HTTP `Cache-Control: public, max-age=31536000` for GLB files
- For galleries, lazy-load models (only load `src` when in viewport)

### Rendering

- Use LOD (Level of Detail) models: high-poly for desktop, low-poly for mobile
- Keep texture resolution at 1024×1024 or lower for AR
- Avoid more than 4 texture maps per material if possible
- Target < 100k triangles for smooth AR on mid-range phones

### AR startup

- AR sessions take 3–10 seconds to initialize (surface detection)
- Show instructions during this time (the component does this automatically)
- Models under 5MB start AR much faster than large files

---

## VR Support

The `<model-viewer>` component supports basic VR via WebXR Immersive mode.

To enable:

```js
// In ar-vr-viewer.jsx, add to model-viewer attributes:
"xr-environment": ""
```

And add a VR button to the toolbar:

```js
<button onClick={() => modelViewerRef.current?.activateXR?.()}>
    Enter VR
</button>
```

Full VR support requires a WebXR-compatible browser and headset (Meta Quest, etc.).

---

## Security Considerations

- The upload endpoint accepts only `.glb` and `.gltf` extensions
- Files are validated by extension (not MIME type sniffing, which is bypassable)
- Vercel Blob URLs are public — do not store sensitive models
- CORS is set to `*` (all origins) — restrict to your domain in production
- Maximum file size is enforced server-side (100MB default)

---

## Browser Compatibility

| Feature | Chrome | Firefox | Safari | Edge |
|---------|--------|---------|--------|------|
| 3D preview | ✓ | ✓ | ✓ | ✓ |
| AR (WebXR) | ✓ (Android) | — | — | — |
| AR (Quick Look) | — | — | ✓ (iOS) | — |
| AR (Scene Viewer) | ✓ (Android) | — | — | — |
| VR (WebXR) | ✓ | ✓ | — | ✓ |

---

## Debugging

### Check model-viewer is loading

Open browser DevTools → Network tab → filter by `model-viewer` — should see a 200 from Google CDN.

### Check AR availability

```js
const mv = document.querySelector('model-viewer')
console.log('AR available:', mv.canActivateAR)
```

### Check Vercel function logs

```bash
vercel logs --follow
```

Or in the Vercel dashboard → project → **Functions** tab → click a function invocation.

### Common errors

| Error | Cause | Fix |
|-------|-------|-----|
| `405 Method Not Allowed` | Wrong URL or OPTIONS not handled | Check VERCEL_URL in the component |
| `413 Request Entity Too Large` | File > 4.5MB | Use client-side blob upload or compress file |
| `CORS error` | Missing CORS headers | Check `vercel.json` headers config, redeploy |
| `model-viewer: src not set` | Model URL is null | Check file loaded correctly, no validateFile rejection |
| `AR session failed` | Device doesn't support AR or HTTPS required | Ensure site is on HTTPS, check device compatibility |
