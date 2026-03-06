# Vercel Project Setup

Detailed walkthrough for deploying the AR/VR viewer backend to Vercel.

---

## Prerequisites

- Node.js 18+ installed
- Git installed
- Vercel account (free at vercel.com)
- GitHub account

---

## Project Structure

After setup your repo should look like this:

```
ar-vr-viewer/
├── api/
│   └── upload-model.js     ← Vercel serverless function
├── package.json
├── vercel.json
├── .gitignore
└── README.md
```

Vercel automatically detects files in the `api/` folder as serverless functions.

---

## 1. Install Vercel CLI

```bash
npm install -g vercel
vercel login
```

Or deploy directly from the Vercel dashboard without the CLI.

---

## 2. Install Dependencies

```bash
npm install
```

This installs:
- `@vercel/blob` — File storage (free tier: 1GB)
- `formidable` — Multipart form parser for file uploads

---

## 3. Local Development

Test the API locally before deploying:

```bash
vercel dev
```

Then test the endpoint:

```bash
curl -X POST http://localhost:3000/api/upload-model \
  -F "model=@./test.glb"
```

Expected response:

```json
{
  "success": true,
  "url": "data:model/gltf-binary;base64,...",
  "filename": "test.glb",
  "size": 1024000,
  "storage": "base64-fallback"
}
```

---

## 4. Deploy to Production

```bash
vercel --prod
```

Or via GitHub:

1. Push to GitHub
2. Go to vercel.com → New Project → Import your repo
3. Leave all settings at defaults → Deploy

---

## 5. Environment Variables

### BLOB_READ_WRITE_TOKEN (Recommended)

Without this, uploads work but use base64 encoding (large payloads, no persistent URLs).

To set up Vercel Blob:

1. Vercel dashboard → your project → **Storage** tab
2. **Create Database** → **Blob**
3. Name it (e.g. `ar-models`) → Create
4. Copy the `BLOB_READ_WRITE_TOKEN`
5. Project → **Settings** → **Environment Variables** → Add:
   - Name: `BLOB_READ_WRITE_TOKEN`
   - Value: (paste token)
   - Environments: Production, Preview, Development

6. Redeploy: **Deployments** → latest → three-dot menu → **Redeploy**

After this, uploaded models get permanent URLs like:
```
https://xxxx.public.blob.vercel-storage.com/models/1234567890-robot.glb
```

### ENABLE_COMPRESSION (Optional — api-upload-model.js only)

If using the extended handler with server-side compression:

- Name: `ENABLE_COMPRESSION`
- Value: `true`

---

## 6. CORS Configuration

The `vercel.json` already configures CORS for all `/api/*` routes:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type, Authorization" }
      ]
    }
  ]
}
```

This allows requests from any origin (Framer, localhost, etc.).

To restrict to your Framer domain only, change `"*"` to your domain:
```json
{ "key": "Access-Control-Allow-Origin", "value": "https://your-site.framer.app" }
```

---

## 7. API Reference

### POST /api/upload-model

Upload a GLB or GLTF file.

**Request:**
```
Content-Type: multipart/form-data
Field: model (file)
```

**Success response (200):**
```json
{
  "success": true,
  "url": "https://blob.vercel-storage.com/models/...",
  "filename": "robot.glb",
  "size": 2048000,
  "storage": "vercel-blob"
}
```

**Error responses:**

| Status | Meaning |
|--------|---------|
| 400 | No file, wrong file type, or parse error |
| 405 | Wrong HTTP method (must be POST) |
| 413 | File exceeds 100MB limit |
| 500 | Server error |

---

## 8. Vercel Limits (Free Tier)

| Resource | Limit |
|---------|-------|
| Serverless function duration | 10s (hobby) / 30s (pro) |
| Function payload size | 4.5MB body |
| Blob storage | 1GB |
| Bandwidth | 100GB/month |

> **Note on 4.5MB limit**: Vercel's request body limit applies to the raw request. For large GLBs, the client sends a multipart form — which is slightly larger than the file itself. If you need to upload files > 4MB reliably, use direct-to-blob uploads from the client instead. See `AR-VR-INTEGRATION-GUIDE.md` for details.

---

## 9. Using the Extended Handler

For server-side compression:

```bash
cp api-upload-model.js api/upload-model.js
npm install @gltf-transform/core @gltf-transform/functions @gltf-transform/extensions
vercel --prod
```

Then set `ENABLE_COMPRESSION=true` in Vercel environment variables.

---

## 10. Monitoring

View function logs in real time:

```bash
vercel logs --follow
```

Or in the Vercel dashboard → project → **Functions** tab.
