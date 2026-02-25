<p align="center">
  <img src="https://img.shields.io/badge/HASHER-v2.0-00f0ff?style=for-the-badge&labelColor=0c0c1d" alt="Version"/>
  <img src="https://img.shields.io/badge/License-MIT-a855f7?style=for-the-badge&labelColor=0c0c1d" alt="License"/>
  <img src="https://img.shields.io/badge/Vanilla-JS-f5c542?style=for-the-badge&logo=javascript&labelColor=0c0c1d" alt="JS"/>
</p>

# 🔒 HASHER

> **Encrypt, hash, and crack** — a premium web-based cryptography toolkit built with zero dependencies.

---

## ✨ Features

### ⚡ Hasher
- Hash **text or any file** (drag-and-drop supported)
- Algorithms: **SHA-256 · SHA-384 · SHA-512 · SHA-1 · MD5**
- Generate **HMAC secret keys** (256-bit) for authenticated hashing
- Download results as `.hash` files
- Auto-save every hash to records + Supabase cloud sync

### 🔓 De-Hasher
- Reverse/crack hashes back to plaintext
- **Combined cracking** — runs Dictionary (530+ common passwords) then Brute Force automatically
- **HMAC key support** — paste the secret key to crack HMAC-signed hashes
- **Auto-detects** hash algorithm from hash length
- Configurable brute-force: max length (3–6 chars), charset (a–z / alphanumeric / full)
- Live progress: attempts, speed (hashes/sec), elapsed time
- Stop/resume cracking at any time

### 📋 Records
- Full history of all hashing operations
- Export records as **CSV**
- Cloud-synced to **Supabase** (PostgreSQL)
- Delete individual records or clear all

### 🎨 Design
- Dark mode + Light mode toggle
- Animated particle background
- Glassmorphism cards with glow effects
- Fully responsive (mobile + desktop)

---

## 🚀 Quick Start

```bash
# Option 1: Open directly
open index.html

# Option 2: Local server
python3 -m http.server 8000
# → http://localhost:8000
```

---

## 📁 Project Structure

```
HASHER/
├── index.html    # Page structure & all sections
├── style.css     # Design system (dark/light themes, animations)
├── app.js        # Core logic — hashing, cracking, Supabase sync
└── README.md
```

---

## 🛠 Tech Stack

| Technology | Usage |
|:--|:--|
| **HTML5 + CSS3** | Semantic structure, CSS variables, animations |
| **Vanilla JavaScript** | Zero-dependency, pure ES6+ |
| **Web Crypto API** | `crypto.subtle` for SHA family hashing + HMAC |
| **Custom MD5** | Pure JS implementation (since Web Crypto doesn't support MD5) |
| **Supabase** | Cloud PostgreSQL via REST API for record persistence |
| **Google Fonts** | Inter + JetBrains Mono typography |

---

## 🔐 How Hashing Works

```
Input  →  Hash Function  →  Fixed-length hex string
"hello"    SHA-256          "2cf24dba5fb0a30e26e83b2ac5b9e29e..."
```

- **One-way**: You can't reverse a hash mathematically
- **Deterministic**: Same input always produces the same hash
- **Avalanche effect**: A tiny change in input changes the entire hash
- **HMAC mode**: Combines a secret key with the hash for authentication

---

## 👤 Author

**Jitraj** · 2026

---

<p align="center">
  <sub>Built with ☕ and <code>crypto.subtle</code></sub>
</p>
