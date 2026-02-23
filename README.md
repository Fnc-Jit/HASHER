# HASHER 🔒

A simple web-based text and file hashing tool built with **HTML, CSS, and JavaScript** — no external libraries.

## What It Does

- Type text or upload any file → get its cryptographic hash instantly
- Supports **SHA-256, SHA-384, SHA-512, SHA-1, and MD5**
- Generate a **secret HMAC key** for authenticated hashing
- Download the hash result as a `.hash` file
- Records history of all hashing operations
- Dark and Light mode toggle
- Connected to **Supabase** database to store hash records

## How To Run

1. Open `index.html` in any browser  
   **or**  
   run a local server:
   ```
   npx serve .
   ```
2. Type text or drag-and-drop a file
3. Pick a hash algorithm from the dropdown
4. Click **Hash It** — done!

## Files

| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `style.css` | Styling (dark/light themes) |
| `app.js` | All logic — hashing, downloads, Supabase sync |

## Tech Used

- HTML5, CSS3, Vanilla JavaScript
- Web Crypto API (`crypto.subtle`)
- Supabase (PostgreSQL database via REST API)

## Made By

**Jitraj** — 2026
