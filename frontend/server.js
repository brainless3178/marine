/**
 * Frontend Server Entry Point — Hostinger "Application root: frontend" app
 *
 * Panel settings for this app (alkatraders.co):
 *   Framework preset:   Vite  (NOT Express — Express only serves the build here)
 *   Application root:   frontend
 *   Build command:      npm install && npm run build
 *   Start command:      npm start
 *   Output directory:   dist
 *   Entry file:         server.js
 *
 * frontend/package.json's "build" script runs Vite from the repository root
 * (where index.html, src/, public/ and vite.config.ts live); vite.config.ts
 * outputs to frontend/dist/. This server serves exactly that dist folder with
 * an SPA fallback.
 *
 * Self-healing: if the build output is missing at startup (e.g. the deploy
 * build step was skipped or failed), we run the Vite build on the fly and,
 * only if that fails too, serve a clear diagnostic page instead of crashing.
 */
const express = require("express");
const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");

const app = express();
const PORT = process.env.PORT || 3000;
const distPath = path.join(__dirname, "dist");
const indexPath = path.join(distPath, "index.html");
const projectRoot = path.join(__dirname, "..");
const buildTimeoutMs = 300 * 1000;

// ─── Ensure the production build exists ──────────────────────────
if (!fs.existsSync(indexPath)) {
  console.error(`✖ Build not found at ${distPath}`);
  console.error("  Attempting on-the-fly build...");
  try {
    // If dependencies are missing at the repo root, install them first so the
    // Vite build (run from the root) can execute.
    if (!fs.existsSync(path.join(projectRoot, "node_modules", "vite", "bin", "vite.js"))) {
      console.error("  vite not installed — running npm install (may take a few minutes)...");
      execSync("npm install --no-audit --no-fund", {
        cwd: projectRoot,
        stdio: "inherit",
        timeout: buildTimeoutMs,
      });
    }
    execSync("node ./node_modules/vite/bin/vite.js build", {
      cwd: projectRoot,
      stdio: "inherit",
      timeout: buildTimeoutMs,
    });
  } catch (err) {
    console.error("  On-the-fly build failed:", err.message);
  }
}

if (!fs.existsSync(indexPath)) {
  // Serve a diagnostic page instead of crash-looping, so the site is never
  // a confusing 404/500 and the cause is visible in the browser.
  console.error(`✖ Build still missing at ${distPath}`);
  app.get("*", (_req, res) => {
    res.status(503).type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Build missing</title></head>
<body style="font-family:system-ui;max-width:640px;margin:80px auto;padding:0 20px">
<h1>Frontend build not found</h1>
<p>The production build is missing at <code>${distPath}</code>.</p>
<p>Check the Hostinger deployment log for build errors, then redeploy.</p>
</body></html>`);
  });
} else {
  // Serve the built SPA with cache headers that match Vite's hashed output:
  //  - /assets/* (content-hashed js/css) + hashed root files: immutable, 1 year
  //    (the hash changes on every deploy, so a long maxAge is safe — repeat
  //    visits never re-download unchanged bundles)
  //  - index.html / sw.js: no-cache (must revalidate so updates ship instantly)
  const HASHED_FILE = /[0-9a-f]{8}/i;
  const ONE_YEAR = 60 * 60 * 24 * 365;
  app.use(
    express.static(distPath, {
      etag: true,
      lastModified: true,
      index: false, // index.html is handled below with a no-cache header
      setHeaders(res, filePath) {
        if (filePath.endsWith("index.html") || filePath.endsWith("sw.js")) {
          // Shell + service worker gate updates — never long-cache them.
          res.setHeader("Cache-Control", "no-cache");
        } else if (filePath.includes("/assets/") || HASHED_FILE.test(filePath)) {
          // Content-hashed bundles/images are immutable by design.
          res.setHeader("Cache-Control", `public, max-age=${ONE_YEAR}, immutable`);
        } else {
          // Un-hashed static files (manifest, icons): short cache + ETag.
          res.setHeader("Cache-Control", "public, max-age=3600");
        }
      },
    })
  );

  // SPA fallback — any non-asset route returns index.html so client-side
  // routing (e.g. /products, /admin) works on refresh / deep links.
  app.get("*", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache");
    res.sendFile(indexPath);
  });
}

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Frontend serving ${distPath} on port ${PORT}`);
});
