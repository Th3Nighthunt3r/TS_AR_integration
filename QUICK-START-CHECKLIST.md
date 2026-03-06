# Quick Start Checklist

Complete these steps in order to go live in ~15 minutes.

---

## Step 1 — GitHub (2 min)

- [ ] Go to github.com → New repository
- [ ] Name it `ar-vr-viewer`
- [ ] Set to Public (required for free Vercel deploys)
- [ ] Copy the repo clone URL

```bash
git clone https://github.com/YOUR-USERNAME/ar-vr-viewer.git
cd ar-vr-viewer
```

---

## Step 2 — Push Files (2 min)

All project files are already in this folder. Push them to GitHub:

```bash
git add .
git commit -m "Initial setup"
git push origin main
```

- [ ] Files pushed to GitHub

---

## Step 3 — Deploy to Vercel (5 min)

- [ ] Go to vercel.com → Log in (use GitHub)
- [ ] Click **Add New Project**
- [ ] Select your `ar-vr-viewer` repository
- [ ] Leave all settings as default
- [ ] Click **Deploy**
- [ ] Wait for green checkmark ✓
- [ ] **Copy your deployment URL** — looks like: `https://ar-vr-viewer-abc123.vercel.app`

---

## Step 4 — (Optional) Enable Persistent Storage (3 min)

Skip this if you just want a demo. Models will still work via local preview.

- [ ] In Vercel: go to **Storage** tab → Create **Blob** store
- [ ] Go to project **Settings** → **Environment Variables**
- [ ] Add: `BLOB_READ_WRITE_TOKEN` = (token from the Blob store)
- [ ] **Redeploy** the project (Deployments → three-dot menu → Redeploy)

---

## Step 5 — Add to Framer (3 min)

- [ ] Open your Framer project
- [ ] **Assets** panel → **Code** tab → **+ New Component**
- [ ] Delete the placeholder code
- [ ] Open `ar-vr-viewer.jsx` from this folder
- [ ] **Select all** → **Copy** → **Paste** into Framer
- [ ] Find this line near the top:
  ```js
  const VERCEL_URL = "https://YOUR-VERCEL-URL.vercel.app"
  ```
- [ ] Replace `https://YOUR-VERCEL-URL.vercel.app` with your actual Vercel URL
- [ ] Click **Publish** (or Ctrl/Cmd+S to save)
- [ ] Drag the component onto a frame in your site

---

## Step 6 — Test (2 min)

### Desktop
- [ ] Site loads
- [ ] Upload button is visible
- [ ] Can select a `.glb` file
- [ ] Model appears in the 3D viewer
- [ ] Can rotate with mouse
- [ ] Can zoom with scroll wheel

### Mobile (iOS)
- [ ] Site loads on iPhone
- [ ] Can upload a file
- [ ] **View in AR** button appears
- [ ] AR session starts (camera permission dialog)
- [ ] Can tap a surface to place the model
- [ ] Model appears in the room
- [ ] Can pinch to scale, drag to rotate

### Mobile (Android)
- [ ] Same as iOS above (requires ARCore)

---

## Done!

Your AR/VR viewer is live. Share the Framer site URL with anyone — no app download needed.

---

## What's Next

- **Customize colors**: Change `primaryColor` and `backgroundColor` in Framer's property panel
- **Pre-load a model**: Set `initialModelUrl` in Framer properties to a CDN-hosted GLB
- **Compress models**: Run `node optimize-models.js model.glb` before uploading

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| Upload returns 405 | VERCEL_URL is wrong or still has `YOUR-VERCEL-URL` placeholder |
| "AR not available" | iPhone 12+ or Android with ARCore required |
| Model is huge/slow | Run `optimize-models.js` to compress |
| Framer shows error | Make sure you pasted the **entire** file |
