export default function handler(req, res) {
    if (req.method === "OPTIONS") {
        res.setHeader("Access-Control-Allow-Origin", "*")
        return res.status(200).end()
    }

    res.setHeader("Content-Type", "text/html; charset=utf-8")
    res.status(200).end(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>AR/VR Viewer API</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#0f0f23;color:#fff;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px}
    .card{max-width:460px;width:100%;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:40px 32px;text-align:center}
    h1{font-size:22px;font-weight:700;background:linear-gradient(135deg,#06b6d4,#a855f7);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;margin-bottom:8px}
    p{font-size:14px;color:rgba(255,255,255,.5);line-height:1.6;margin-bottom:28px}
    .badge{display:inline-flex;align-items:center;gap:8px;background:rgba(34,197,94,.1);border:1px solid rgba(34,197,94,.3);color:#86efac;font-size:13px;font-weight:500;padding:8px 18px;border-radius:50px;margin-bottom:28px}
    .dot{width:7px;height:7px;background:#22c55e;border-radius:50%;animation:pulse 1.5s ease-in-out infinite}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}
    .endpoint{background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:10px;padding:14px 16px;text-align:left}
    .label{color:rgba(255,255,255,.35);text-transform:uppercase;letter-spacing:.05em;font-size:10px;margin-bottom:6px}
    .url{color:#06b6d4;font-family:'SF Mono','Fira Code',monospace;font-size:13px;word-break:break-all}
    .method{display:inline-block;background:rgba(168,85,247,.15);color:#d8b4fe;font-size:10px;font-weight:700;padding:2px 7px;border-radius:4px;margin-right:6px;font-family:monospace}
  </style>
</head>
<body>
  <div class="card">
    <h1>AR/VR Viewer API</h1>
    <p>Backend for the AR/VR Model Viewer Framer component.<br>Upload your GLB models and view them in AR.</p>
    <div class="badge"><div class="dot"></div>API is running</div>
    <div class="endpoint">
      <div class="label">Upload endpoint</div>
      <div class="url"><span class="method">POST</span>/api/upload-model</div>
    </div>
  </div>
</body>
</html>`)
}
