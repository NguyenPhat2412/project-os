#!/usr/bin/env node
/**
 * fetch-avatars.js
 * Download avatar images from uifaces.co API
 *
 * Usage (run from project root):
 *   node .claude/agents/scripts/fetch-avatars.js
 *   AVATAR_COUNT=50 node .claude/agents/scripts/fetch-avatars.js
 *   UIFACES_API_KEY=your_key node .claude/agents/scripts/fetch-avatars.js
 *
 * Env vars:
 *   UIFACES_API_KEY   - API key from uifaces.co (get free key at https://uifaces.co/register)
 *   AVATAR_COUNT      - Number of avatars to fetch (default: 30)
 *   AVATAR_OUTPUT_DIR - Output directory (default: public/avatars)
 */

const https = require("https");
const http = require("http");
const fs = require("fs");
const path = require("path");

// ── Config ────────────────────────────────────────────────────────────────────
const API_KEY = process.env.UIFACES_API_KEY || "";
const COUNT = parseInt(process.env.AVATAR_COUNT || "30", 10);
const OUTPUT_DIR = path.resolve(
  process.env.AVATAR_OUTPUT_DIR || "public/avatars"
);
const API_BASE = "https://api.uifaces.co";

// ── Helpers ───────────────────────────────────────────────────────────────────
function get(requestUrl, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(requestUrl);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        "User-Agent": "ProjectOS-AvatarFetcher/1.0",
        Accept: "application/json",
        ...headers,
      },
    };

    const req = client.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return resolve(get(res.headers.location, headers));
      }

      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => resolve({ status: res.statusCode, body: data, headers: res.headers }));
    });

    req.on("error", reject);
    req.setTimeout(15000, () => {
      req.destroy();
      reject(new Error(`Timeout: ${requestUrl}`));
    });
  });
}

function downloadFile(fileUrl, destPath) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(fileUrl);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const file = fs.createWriteStream(destPath);

    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: { "User-Agent": "ProjectOS-AvatarFetcher/1.0" },
    };

    const req = client.get(options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        file.close();
        fs.unlink(destPath, () => {});
        return resolve(downloadFile(res.headers.location, destPath));
      }

      if (res.statusCode !== 200) {
        file.close();
        fs.unlink(destPath, () => {});
        return reject(new Error(`HTTP ${res.statusCode} for ${fileUrl}`));
      }

      res.pipe(file);
      file.on("finish", () => file.close(() => resolve(destPath)));
      file.on("error", (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });

    req.on("error", (err) => {
      fs.unlink(destPath, () => {});
      reject(err);
    });

    req.setTimeout(20000, () => {
      req.destroy();
      reject(new Error(`Download timeout: ${fileUrl}`));
    });
  });
}

function getExtension(photoUrl) {
  const parsed = new URL(photoUrl);
  const ext = path.extname(parsed.pathname);
  return ext || ".jpg";
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── Fetch avatar list ─────────────────────────────────────────────────────────
async function fetchAvatarList(count) {
  const perPage = Math.min(count, 50); // API max per page
  const pages = Math.ceil(count / perPage);
  const avatars = [];

  const headers = {};
  if (API_KEY) {
    headers["X-API-KEY"] = API_KEY;
  }

  for (let page = 1; page <= pages && avatars.length < count; page++) {
    const remaining = count - avatars.length;
    const limit = Math.min(perPage, remaining);
    const apiUrl = `${API_BASE}/?limit=${limit}&page=${page}`;

    console.log(`  Fetching page ${page}/${pages} (limit=${limit})...`);

    const res = await get(apiUrl, headers);

    if (res.status === 401) {
      console.warn("  ⚠ No API key or invalid key — uifaces.co may limit results.");
      console.warn("  Get a free API key at: https://uifaces.co/register");
    }

    if (res.status === 429) {
      console.warn("  ⚠ Rate limited. Waiting 5 seconds...");
      await sleep(5000);
      page--; // retry
      continue;
    }

    let data;
    try {
      data = JSON.parse(res.body);
    } catch {
      console.error("  ✗ Failed to parse response:", res.body.slice(0, 200));
      break;
    }

    const items = Array.isArray(data) ? data : data.data || [];
    if (items.length === 0) {
      console.log("  No more avatars available.");
      break;
    }

    avatars.push(...items);

    if (page < pages) await sleep(300); // polite delay
  }

  return avatars.slice(0, count);
}

// ── Fallback: use randomuser.me ───────────────────────────────────────────────
async function fetchAvatarsFallback(count) {
  console.log("  Using fallback: randomuser.me API...");
  const results = [];
  const perPage = Math.min(count, 100);
  const pages = Math.ceil(count / perPage);

  for (let page = 1; page <= pages && results.length < count; page++) {
    const remaining = count - results.length;
    const limit = Math.min(perPage, remaining);
    const apiUrl = `https://randomuser.me/api/?results=${limit}&inc=name,gender,picture&noinfo`;

    const res = await get(apiUrl);
    let data;
    try {
      data = JSON.parse(res.body);
    } catch {
      break;
    }

    const users = data.results || [];
    for (const u of users) {
      results.push({
        id: results.length + 1,
        name: `${u.name.first} ${u.name.last}`,
        gender: u.gender,
        photo: u.picture.large,
      });
    }

    if (page < pages) await sleep(300);
  }

  return results.slice(0, count);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log("╔══════════════════════════════════════╗");
  console.log("║       Avatar Fetcher — ProjectOS     ║");
  console.log("╚══════════════════════════════════════╝");
  console.log(`Target: ${COUNT} avatars → ${OUTPUT_DIR}`);
  if (!API_KEY) {
    console.log("Tip: Set UIFACES_API_KEY for higher rate limits\n");
  }

  // Create output directory
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  // Fetch avatar list
  console.log("\n[1/3] Fetching avatar list from uifaces.co...");
  let avatars = [];

  try {
    avatars = await fetchAvatarList(COUNT);
    if (avatars.length === 0) throw new Error("Empty response from uifaces.co");
    console.log(`  ✓ Got ${avatars.length} avatars from uifaces.co`);
  } catch (err) {
    console.warn(`  ✗ uifaces.co failed: ${err.message}`);
    console.log("  Trying fallback source (randomuser.me)...");
    try {
      avatars = await fetchAvatarsFallback(COUNT);
      console.log(`  ✓ Got ${avatars.length} avatars from randomuser.me`);
    } catch (fallbackErr) {
      console.error(`  ✗ Fallback also failed: ${fallbackErr.message}`);
      process.exit(1);
    }
  }

  // Download images
  console.log(`\n[2/3] Downloading ${avatars.length} images...`);
  const downloaded = [];
  const failed = [];

  for (let i = 0; i < avatars.length; i++) {
    const avatar = avatars[i];
    const photoUrl = avatar.photo || avatar.image || avatar.avatar;

    if (!photoUrl) {
      failed.push({ index: i, reason: "no photo URL" });
      continue;
    }

    const ext = getExtension(photoUrl);
    const filename = `avatar-${String(i + 1).padStart(3, "0")}${ext}`;
    const destPath = path.join(OUTPUT_DIR, filename);

    process.stdout.write(`  [${i + 1}/${avatars.length}] ${filename}... `);

    try {
      await downloadFile(photoUrl, destPath);
      const stats = fs.statSync(destPath);
      console.log(`✓ (${Math.round(stats.size / 1024)}KB)`);
      downloaded.push({
        filename,
        name: avatar.name || `User ${i + 1}`,
        gender: avatar.gender || "unknown",
        path: `/avatars/${filename}`,
      });
    } catch (err) {
      console.log(`✗ ${err.message}`);
      failed.push({ filename, reason: err.message });
    }

    // Small delay to be polite
    if (i < avatars.length - 1) await sleep(100);
  }

  // Summary
  console.log("\n[3/3] Summary");
  console.log("─".repeat(40));
  console.log(`  ✓ Downloaded: ${downloaded.length}`);
  if (failed.length > 0) {
    console.log(`  ✗ Failed:     ${failed.length}`);
  }
  console.log(`  📁 Saved to:  ${OUTPUT_DIR}`);

  // Output avatar paths for copy-paste into seed files
  if (downloaded.length > 0) {
    console.log("\n// Avatar paths for seed data:");
    console.log("const AVATAR_URLS = [");
    for (const av of downloaded) {
      console.log(`  "${av.path}", // ${av.name}`);
    }
    console.log("];");

    // Save manifest JSON
    const manifestPath = path.join(OUTPUT_DIR, "manifest.json");
    fs.writeFileSync(manifestPath, JSON.stringify(downloaded, null, 2));
    console.log(`\n📄 Manifest saved: ${manifestPath}`);
  }

  if (failed.length > 0) {
    console.log("\nFailed downloads:");
    for (const f of failed) {
      console.log(`  - ${f.filename || "unknown"}: ${f.reason}`);
    }
  }

  process.exit(downloaded.length > 0 ? 0 : 1);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
