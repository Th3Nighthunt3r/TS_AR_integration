# Framer Setup Guide

How to add the AR/VR viewer to your Framer site.

---

## Adding the Component

1. Open your Framer project
2. In the left panel, click **Assets** → **Code**
3. Click **+ New Component** (top right of the code panel)
4. Delete all the placeholder code in the editor
5. Open `ar-vr-viewer.jsx` from this folder, select all, copy
6. Paste into the Framer code editor
7. Save (Ctrl+S / Cmd+S)

The component will appear under **Assets → Code** as `ARVRViewer`.

---

## Connecting to Your Vercel Backend

Near the top of the component, find and update this line:

```js
const VERCEL_URL = "https://YOUR-VERCEL-URL.vercel.app"
```

Replace the URL with your actual Vercel deployment URL. Example:

```js
const VERCEL_URL = "https://ar-vr-viewer-abc123.vercel.app"
```

**Important:** This only matters if you enable "Upload to Vercel" in the property panel. For local preview (the default), no backend is needed.

---

## Property Controls

Once added to a frame, these controls appear in Framer's right panel:

| Property | Default | Description |
|----------|---------|-------------|
| **Model URL** | (empty) | Pre-load a specific GLB from a URL |
| **Primary Color** | `#06b6d4` | Accent color (buttons, gradient) |
| **Background** | `#0f0f23` | Viewer background color |
| **Max File Size (MB)** | `50` | Reject files larger than this |
| **Auto Rotate** | On | Slowly rotate the model automatically |
| **Shadow Intensity** | `1` | Model drop shadow strength (0–2) |
| **Upload to Vercel** | Off | Send files to your Vercel backend for persistent URLs |

---

## Pre-Loading a Model

To display a model automatically (no upload required), set **Model URL** to a public GLB URL:

```
https://modelviewer.dev/shared-assets/models/Astronaut.glb
```

Or host your own GLB on a CDN (Cloudflare R2, AWS S3, Cloudinary) and paste the URL.

---

## Customizing Colors

### Quick change via property panel
Select the component → right panel → change **Primary Color** and **Background**.

### Code customization
To use a different gradient, find this line in the component:

```js
const gradient = `linear-gradient(135deg, ${primaryColor}, #a855f7)`
```

Change `#a855f7` to any color. Example for orange/red:

```js
const gradient = `linear-gradient(135deg, ${primaryColor}, #ef4444)`
```

---

## Customizing AR Instructions

Find `INSTRUCTIONS` near the top of the component:

```js
const INSTRUCTIONS = [
    {
        icon: "📁",
        title: "Upload Your Model",
        description: "Drag & drop or tap to select a GLB or GLTF 3D model file from your device.",
    },
    // ... more steps
]
```

Edit the `title`, `description`, and `icon` for each step to match your brand.

---

## Responsive Layout

The component fills its parent container (`width: 100%`, `height: 100%`). To control its size:

1. Drag `ARVRViewer` onto a frame
2. Set the **frame** dimensions (e.g. 800×600 on desktop, full-width on mobile)
3. The viewer will fill the frame

For mobile-only AR experience, you can use Framer's breakpoint system to show different layouts.

---

## Embedding Without Upload

If you want to skip file uploads and just display a pre-defined model:

1. Set **Model URL** to your GLB URL in the property panel
2. The upload screen will be skipped entirely
3. The model loads immediately on page visit

---

## Testing in Framer

### Desktop preview
- Click the play button in Framer
- Drag a GLB file onto the viewer
- Rotate with mouse, scroll to zoom

### Mobile preview
- In Framer, click **Preview** → open on your phone
- Or publish to a staging URL and open on your phone
- The **View in AR** button appears only on mobile

### AR testing
- **iOS**: Requires an actual iOS device (iPhone 12+). Simulators do not support AR.
- **Android**: Requires a device with ARCore installed (most Android 7+ phones).
- Desktop browsers show 3D only — no AR button.

---

## Common Issues

**Component shows a blank frame**
- Make sure you pasted the entire file, including the `addPropertyControls` block at the bottom.
- Check the Framer code editor for red error indicators.

**"How it works" button doesn't open overlay**
- This can happen if Framer's preview mode intercepts click events on nested buttons. Works correctly when published.

**Model-viewer not rendering**
- The `<model-viewer>` web component loads from Google CDN. Ensure your Framer preview isn't blocking external scripts.

**AR session fails immediately**
- Confirm the device has camera permission enabled for the browser.
- On iOS, the file must be served over HTTPS (Framer published URLs are HTTPS).
