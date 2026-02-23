/* ============================================================
   HASHER — app.js
   Pure vanilla JS: hashing, file handling, Supabase REST, UI
   ============================================================ */

(function () {
    'use strict';

    // ───────── State ─────────
    const state = {
        mode: 'text',           // 'text' | 'file'
        file: null,             // File object
        fileBytes: null,        // ArrayBuffer of file
        secretKey: null,        // hex string
        cryptoKey: null,        // CryptoKey for HMAC
        records: [],            // { id, timestamp, inputType, inputName, algorithm, hashValue, hmac }
        supabase: {
            url: 'https://uskdpkjyiljjjzqluxle.supabase.co',
            key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVza2Rwa2p5aWxqamp6cWx1eGxlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NjI4MTQsImV4cCI6MjA4NzQzODgxNH0.nVhIZhgggruFWXI3G_injRXUA6WeWvMaSyf5nphVaFg'
        },
    };

    // ───────── DOM refs ─────────
    const $ = (id) => document.getElementById(id);

    const dom = {
        // Nav
        navHasher: $('navHasher'),
        navRecords: $('navRecords'),
        sectionHasher: $('sectionHasher'),
        sectionRecords: $('sectionRecords'),

        // Input
        toggleText: $('toggleText'),
        toggleFile: $('toggleFile'),
        textInputArea: $('textInputArea'),
        fileInputArea: $('fileInputArea'),
        textInput: $('textInput'),
        charCount: $('charCount'),
        dropZone: $('dropZone'),
        fileInput: $('fileInput'),
        fileInfo: $('fileInfo'),
        fileName: $('fileName'),
        fileSize: $('fileSize'),
        fileRemove: $('fileRemove'),

        // Algo
        hashAlgorithm: $('hashAlgorithm'),

        // Buttons
        hashBtn: $('hashBtn'),
        hashLoading: $('hashLoading'),
        secretKeyBtn: $('secretKeyBtn'),

        // Output
        algoBadge: $('algoBadge'),
        secretKeyPanel: $('secretKeyPanel'),
        secretKeyValue: $('secretKeyValue'),
        regenerateKey: $('regenerateKey'),
        removeKey: $('removeKey'),
        resultPlaceholder: $('resultPlaceholder'),
        resultContent: $('resultContent'),
        resultAlgo: $('resultAlgo'),
        resultMode: $('resultMode'),
        resultTime: $('resultTime'),
        hashOutput: $('hashOutput'),
        copyBtn: $('copyBtn'),
        downloadBtn: $('downloadBtn'),
        saveRecordBtn: $('saveRecordBtn'),

        // Records
        recordCount: $('recordCount'),
        recordsBody: $('recordsBody'),
        recordsEmpty: $('recordsEmpty'),
        exportRecordsBtn: $('exportRecordsBtn'),
        clearRecordsBtn: $('clearRecordsBtn'),

        // Theme
        themeToggle: $('themeToggle'),
        themeIcon: $('themeIcon'),

        // Toast
        toastContainer: $('toastContainer'),

        // BG
        bgParticles: $('bgParticles'),
    };

    // ───────── Init ─────────
    function init() {
        initTheme();
        createParticles();
        loadSettings();
        loadRecords();
        bindEvents();
        renderRecords();
    }

    // ───────── Background Particles ─────────
    function createParticles() {
        const count = 30;
        for (let i = 0; i < count; i++) {
            const p = document.createElement('div');
            p.className = 'particle';
            const size = Math.random() * 3 + 1;
            const x = Math.random() * 100;
            const dur = Math.random() * 20 + 15;
            const delay = Math.random() * 20;
            const hue = Math.random() > 0.5 ? '180' : '270';
            Object.assign(p.style, {
                width: size + 'px',
                height: size + 'px',
                left: x + '%',
                background: `hsla(${hue}, 80%, 60%, ${Math.random() * 0.3 + 0.1})`,
                animationDuration: dur + 's',
                animationDelay: delay + 's',
                boxShadow: `0 0 ${size * 3}px hsla(${hue}, 80%, 60%, 0.3)`,
            });
            dom.bgParticles.appendChild(p);
        }
    }

    // ───────── Navigation ─────────
    function switchSection(name) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        $('nav' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
        $('section' + name.charAt(0).toUpperCase() + name.slice(1)).classList.add('active');
    }

    // ───────── Events ─────────
    function bindEvents() {
        // Nav
        dom.navHasher.onclick = () => switchSection('hasher');
        dom.navRecords.onclick = () => { switchSection('records'); renderRecords(); };

        // Input toggle
        dom.toggleText.onclick = () => setInputMode('text');
        dom.toggleFile.onclick = () => setInputMode('file');

        // Textarea
        dom.textInput.oninput = () => { dom.charCount.textContent = dom.textInput.value.length; };

        // Drop zone
        dom.dropZone.onclick = () => dom.fileInput.click();
        dom.fileInput.onchange = (e) => handleFile(e.target.files[0]);
        dom.dropZone.ondragover = (e) => { e.preventDefault(); dom.dropZone.classList.add('drag-over'); };
        dom.dropZone.ondragleave = () => dom.dropZone.classList.remove('drag-over');
        dom.dropZone.ondrop = (e) => { e.preventDefault(); dom.dropZone.classList.remove('drag-over'); handleFile(e.dataTransfer.files[0]); };
        dom.fileRemove.onclick = removeFile;

        // Algo change
        dom.hashAlgorithm.onchange = () => { dom.algoBadge.textContent = dom.hashAlgorithm.value; };

        // Hash
        dom.hashBtn.onclick = doHash;

        // Secret key
        dom.secretKeyBtn.onclick = generateSecretKey;
        dom.regenerateKey.onclick = generateSecretKey;
        dom.removeKey.onclick = removeSecretKey;

        // Copy
        dom.copyBtn.onclick = copyHash;

        // Download
        dom.downloadBtn.onclick = downloadHash;

        // Save record
        dom.saveRecordBtn.onclick = saveCurrentRecord;

        // Records
        dom.exportRecordsBtn.onclick = exportCSV;
        dom.clearRecordsBtn.onclick = clearRecords;

        // Settings
        // Theme toggle
        dom.themeToggle.onclick = toggleTheme;
    }

    // ───────── Input Mode ─────────
    function setInputMode(mode) {
        state.mode = mode;
        dom.toggleText.classList.toggle('active', mode === 'text');
        dom.toggleFile.classList.toggle('active', mode === 'file');
        dom.textInputArea.classList.toggle('hidden', mode !== 'text');
        dom.fileInputArea.classList.toggle('hidden', mode !== 'file');
    }

    // ───────── File Handling ─────────
    function handleFile(file) {
        if (!file) return;
        state.file = file;
        dom.dropZone.style.display = 'none';
        dom.fileInfo.classList.remove('hidden');
        dom.fileName.textContent = file.name;
        dom.fileSize.textContent = formatBytes(file.size);

        const reader = new FileReader();
        reader.onload = (e) => { state.fileBytes = e.target.result; };
        reader.readAsArrayBuffer(file);
    }

    function removeFile() {
        state.file = null;
        state.fileBytes = null;
        dom.fileInput.value = '';
        dom.dropZone.style.display = '';
        dom.fileInfo.classList.add('hidden');
    }

    function formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    // ───────── Hashing ─────────
    async function doHash() {
        let data;
        let inputType = state.mode;
        let inputName = '';

        if (state.mode === 'text') {
            const text = dom.textInput.value.trim();
            if (!text) { toast('Please enter some text to hash.', 'error'); return; }
            data = new TextEncoder().encode(text);
            inputName = text.substring(0, 50) + (text.length > 50 ? '…' : '');
        } else {
            if (!state.fileBytes) { toast('Please upload a file first.', 'error'); return; }
            data = new Uint8Array(state.fileBytes);
            inputName = state.file.name;
            inputType = state.file.name.split('.').pop().toUpperCase() + ' file';
        }

        const algo = dom.hashAlgorithm.value;
        showLoading(true);

        try {
            const start = performance.now();
            let hashHex;

            if (algo === 'MD5') {
                hashHex = md5(data);
            } else if (state.cryptoKey) {
                // HMAC mode
                const webAlgo = algo === 'SHA-1' ? 'SHA-1' : algo;
                hashHex = await hmacHash(webAlgo, state.cryptoKey, data);
            } else {
                // Simple digest
                const buf = await crypto.subtle.digest(algo, data);
                hashHex = bufToHex(buf);
            }

            const elapsed = (performance.now() - start).toFixed(1);
            showResult(hashHex, algo, state.secretKey ? 'HMAC' : 'Digest', elapsed + ' ms', inputType, inputName);
        } catch (err) {
            toast('Hashing failed: ' + err.message, 'error');
        } finally {
            showLoading(false);
        }
    }

    function bufToHex(buf) {
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    async function hmacHash(algo, key, data) {
        const sig = await crypto.subtle.sign('HMAC', key, data);
        return bufToHex(sig);
    }

    // ───────── MD5 (pure JS) ─────────
    function md5(data) {
        // Accepts Uint8Array, returns hex string
        const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);

        function md5cycle(x, k) {
            let a = x[0], b = x[1], c = x[2], d = x[3];
            a = ff(a, b, c, d, k[0], 7, -680876936); d = ff(d, a, b, c, k[1], 12, -389564586);
            c = ff(c, d, a, b, k[2], 17, 606105819); b = ff(b, c, d, a, k[3], 22, -1044525330);
            a = ff(a, b, c, d, k[4], 7, -176418897); d = ff(d, a, b, c, k[5], 12, 1200080426);
            c = ff(c, d, a, b, k[6], 17, -1473231341); b = ff(b, c, d, a, k[7], 22, -45705983);
            a = ff(a, b, c, d, k[8], 7, 1770035416); d = ff(d, a, b, c, k[9], 12, -1958414417);
            c = ff(c, d, a, b, k[10], 17, -42063); b = ff(b, c, d, a, k[11], 22, -1990404162);
            a = ff(a, b, c, d, k[12], 7, 1804603682); d = ff(d, a, b, c, k[13], 12, -40341101);
            c = ff(c, d, a, b, k[14], 17, -1502002290); b = ff(b, c, d, a, k[15], 22, 1236535329);

            a = gg(a, b, c, d, k[1], 5, -165796510); d = gg(d, a, b, c, k[6], 9, -1069501632);
            c = gg(c, d, a, b, k[11], 14, 643717713); b = gg(b, c, d, a, k[0], 20, -373897302);
            a = gg(a, b, c, d, k[5], 5, -701558691); d = gg(d, a, b, c, k[10], 9, 38016083);
            c = gg(c, d, a, b, k[15], 14, -660478335); b = gg(b, c, d, a, k[4], 20, -405537848);
            a = gg(a, b, c, d, k[9], 5, 568446438); d = gg(d, a, b, c, k[14], 9, -1019803690);
            c = gg(c, d, a, b, k[3], 14, -187363961); b = gg(b, c, d, a, k[8], 20, 1163531501);
            a = gg(a, b, c, d, k[13], 5, -1444681467); d = gg(d, a, b, c, k[2], 9, -51403784);
            c = gg(c, d, a, b, k[7], 14, 1735328473); b = gg(b, c, d, a, k[12], 20, -1926607734);

            a = hh(a, b, c, d, k[5], 4, -378558); d = hh(d, a, b, c, k[8], 11, -2022574463);
            c = hh(c, d, a, b, k[11], 16, 1839030562); b = hh(b, c, d, a, k[14], 23, -35309556);
            a = hh(a, b, c, d, k[1], 4, -1530992060); d = hh(d, a, b, c, k[4], 11, 1272893353);
            c = hh(c, d, a, b, k[7], 16, -155497632); b = hh(b, c, d, a, k[10], 23, -1094730640);
            a = hh(a, b, c, d, k[13], 4, 681279174); d = hh(d, a, b, c, k[0], 11, -358537222);
            c = hh(c, d, a, b, k[3], 16, -722521979); b = hh(b, c, d, a, k[6], 23, 76029189);
            a = hh(a, b, c, d, k[9], 4, -640364487); d = hh(d, a, b, c, k[12], 11, -421815835);
            c = hh(c, d, a, b, k[15], 16, 530742520); b = hh(b, c, d, a, k[2], 23, -995338651);

            a = ii(a, b, c, d, k[0], 6, -198630844); d = ii(d, a, b, c, k[7], 10, 1126891415);
            c = ii(c, d, a, b, k[14], 15, -1416354905); b = ii(b, c, d, a, k[5], 21, -57434055);
            a = ii(a, b, c, d, k[12], 6, 1700485571); d = ii(d, a, b, c, k[3], 10, -1894986606);
            c = ii(c, d, a, b, k[10], 15, -1051523); b = ii(b, c, d, a, k[1], 21, -2054922799);
            a = ii(a, b, c, d, k[8], 6, 1873313359); d = ii(d, a, b, c, k[15], 10, -30611744);
            c = ii(c, d, a, b, k[6], 15, -1560198380); b = ii(b, c, d, a, k[13], 21, 1309151649);
            a = ii(a, b, c, d, k[4], 6, -145523070); d = ii(d, a, b, c, k[11], 10, -1120210379);
            c = ii(c, d, a, b, k[2], 15, 718787259); b = ii(b, c, d, a, k[9], 21, -343485551);

            x[0] = add32(a, x[0]); x[1] = add32(b, x[1]); x[2] = add32(c, x[2]); x[3] = add32(d, x[3]);
        }

        function cmn(q, a, b, x, s, t) {
            a = add32(add32(a, q), add32(x, t));
            return add32((a << s) | (a >>> (32 - s)), b);
        }

        function ff(a, b, c, d, x, s, t) { return cmn((b & c) | ((~b) & d), a, b, x, s, t); }
        function gg(a, b, c, d, x, s, t) { return cmn((b & d) | (c & (~d)), a, b, x, s, t); }
        function hh(a, b, c, d, x, s, t) { return cmn(b ^ c ^ d, a, b, x, s, t); }
        function ii(a, b, c, d, x, s, t) { return cmn(c ^ (b | (~d)), a, b, x, s, t); }

        function add32(a, b) {
            return (a + b) & 0xFFFFFFFF;
        }

        // Pad
        const n = bytes.length;
        let i;
        const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
        const state = [1732584193, -271733879, -1732584194, 271733878];
        let len = n;

        for (i = 64; i <= n; i += 64) {
            const w = new Array(16);
            for (let j = 0; j < 16; j++) {
                const off = i - 64 + j * 4;
                w[j] = bytes[off] | (bytes[off + 1] << 8) | (bytes[off + 2] << 16) | (bytes[off + 3] << 24);
            }
            md5cycle(state, w);
        }

        for (i = 0; i < 16; i++) tail[i] = 0;
        const rem = n % 64;
        const startOff = n - rem;
        for (i = 0; i < rem; i++) {
            tail[i >> 2] |= bytes[startOff + i] << ((i % 4) << 3);
        }
        tail[i >> 2] |= 0x80 << ((i % 4) << 3);

        if (i > 55) {
            md5cycle(state, tail);
            for (i = 0; i < 16; i++) tail[i] = 0;
        }

        tail[14] = n * 8;
        tail[15] = 0;
        md5cycle(state, tail);

        const hex_chr = '0123456789abcdef';
        let s = '';
        for (i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                const byte_val = (state[i] >> (j * 8)) & 0xFF;
                s += hex_chr.charAt((byte_val >> 4) & 0x0f) + hex_chr.charAt(byte_val & 0x0f);
            }
        }
        return s;
    }

    // ───────── Secret Key ─────────
    async function generateSecretKey() {
        const raw = new Uint8Array(32);
        crypto.getRandomValues(raw);
        state.secretKey = bufToHex(raw.buffer);

        // Import as CryptoKey for HMAC
        const algo = dom.hashAlgorithm.value === 'MD5' ? 'SHA-256' : dom.hashAlgorithm.value;
        state.cryptoKey = await crypto.subtle.importKey(
            'raw', raw, { name: 'HMAC', hash: algo }, false, ['sign']
        );

        dom.secretKeyPanel.classList.remove('hidden');
        dom.secretKeyValue.textContent = state.secretKey;
        toast('🔑 Secret HMAC key generated!', 'success');
    }

    function removeSecretKey() {
        state.secretKey = null;
        state.cryptoKey = null;
        dom.secretKeyPanel.classList.add('hidden');
        toast('Key removed — back to plain digest mode.', 'info');
    }

    // ───────── Show Result ─────────
    let lastResult = null;

    function showResult(hash, algo, mode, elapsed, inputType, inputName) {
        dom.resultPlaceholder.classList.add('hidden');
        dom.resultContent.classList.remove('hidden');

        dom.resultAlgo.textContent = '🔒 ' + algo;
        dom.resultMode.textContent = mode === 'HMAC' ? '🔑 HMAC' : '⚡ Digest';
        dom.resultTime.textContent = '⏱ ' + elapsed;
        dom.hashOutput.textContent = hash;
        dom.algoBadge.textContent = algo;

        lastResult = { hash, algo, mode, inputType, inputName, hmac: mode === 'HMAC' };

        // Auto-save record locally + to Supabase
        const record = {
            id: crypto.randomUUID ? crypto.randomUUID() : 'r-' + Date.now(),
            timestamp: new Date().toISOString(),
            inputType: inputType,
            inputName: inputName,
            algorithm: algo,
            hashValue: hash,
            hmac: mode === 'HMAC',
        };
        state.records.unshift(record);
        persistRecords();
        renderRecords();
        supabaseInsert(record);
    }

    function showLoading(on) {
        dom.hashLoading.classList.toggle('hidden', !on);
        dom.hashBtn.querySelector('.btn-label').textContent = on ? 'Hashing…' : 'Hash It';
        dom.hashBtn.disabled = on;
    }

    // ───────── Copy ─────────
    async function copyHash() {
        if (!lastResult) return;
        try {
            await navigator.clipboard.writeText(lastResult.hash);
            dom.copyBtn.querySelector('.copy-label').textContent = 'Copied!';
            setTimeout(() => { dom.copyBtn.querySelector('.copy-label').textContent = 'Copy'; }, 1500);
            toast('Hash copied to clipboard!', 'success');
        } catch {
            toast('Failed to copy.', 'error');
        }
    }

    // ───────── Download ─────────
    function downloadHash() {
        if (!lastResult) return;
        const content = [
            '# HASHER — Hash Output',
            '# Generated: ' + new Date().toISOString(),
            '# Algorithm: ' + lastResult.algo,
            '# Mode: ' + lastResult.mode,
            '# Input: ' + lastResult.inputType + (lastResult.inputName ? ' (' + lastResult.inputName + ')' : ''),
            '',
            lastResult.hash,
            '',
        ].join('\n');

        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hashvault_' + lastResult.algo.toLowerCase().replace('-', '') + '_' + Date.now() + '.hash';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('Hash file downloaded!', 'success');
    }

    // ───────── Records ─────────
    function saveCurrentRecord() {
        if (!lastResult) return;
        toast('Records are auto-saved on every hash!', 'info');
    }

    function renderRecords() {
        dom.recordCount.textContent = state.records.length;
        dom.recordsEmpty.classList.toggle('hidden', state.records.length > 0);
        dom.recordsBody.innerHTML = '';

        state.records.forEach((r, idx) => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${idx + 1}</td>
                <td>${formatDate(r.timestamp)}</td>
                <td>${escapeHtml(r.inputType)}</td>
                <td>${r.algorithm}</td>
                <td title="${r.hashValue}">${r.hashValue}</td>
                <td>${r.hmac ? '<span class="hmac-badge">HMAC</span>' : '—'}</td>
                <td><button class="delete-record-btn" data-id="${r.id}">Delete</button></td>
            `;
            dom.recordsBody.appendChild(tr);
        });

        // Bind delete buttons
        document.querySelectorAll('.delete-record-btn').forEach(btn => {
            btn.onclick = () => deleteRecord(btn.dataset.id);
        });
    }

    function deleteRecord(id) {
        state.records = state.records.filter(r => r.id !== id);
        persistRecords();
        renderRecords();
        supabaseDelete(id);
    }

    function clearRecords() {
        if (!confirm('Clear all records?')) return;
        state.records = [];
        persistRecords();
        renderRecords();
        toast('All records cleared.', 'info');
    }

    function exportCSV() {
        if (state.records.length === 0) { toast('No records to export.', 'error'); return; }
        const header = 'ID,Timestamp,InputType,InputName,Algorithm,Hash,HMAC';
        const rows = state.records.map(r =>
            `"${r.id}","${r.timestamp}","${r.inputType}","${escapeHtml(r.inputName)}","${r.algorithm}","${r.hashValue}",${r.hmac}`
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'hashvault_records_' + Date.now() + '.csv';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        toast('CSV exported!', 'success');
    }

    // ───────── Local Persistence ─────────
    function persistRecords() {
        try { localStorage.setItem('hv_records', JSON.stringify(state.records)); } catch { }
    }

    function loadRecords() {
        try {
            const raw = localStorage.getItem('hv_records');
            if (raw) state.records = JSON.parse(raw);
        } catch { }
    }

    // ───────── Settings / Supabase ─────────
    function loadSettings() {
        // Credentials are hardcoded in state — nothing to load
    }

    async function supabaseInsert(record) {
        if (!state.supabase.url || !state.supabase.key) return;
        try {
            const res = await fetch(state.supabase.url + '/rest/v1/hash_records', {
                method: 'POST',
                headers: {
                    'apikey': state.supabase.key,
                    'Authorization': 'Bearer ' + state.supabase.key,
                    'Content-Type': 'application/json',
                    'Prefer': 'return=minimal',
                },
                body: JSON.stringify({
                    input_type: record.inputType,
                    input_name: record.inputName,
                    algorithm: record.algorithm,
                    hash_value: record.hashValue,
                    secret_key_used: record.hmac,
                }),
            });
            if (!res.ok) {
                const errBody = await res.text();
                console.error('Supabase INSERT failed:', res.status, errBody);
                toast('⚠️ Supabase save failed: HTTP ' + res.status, 'error');
            } else {
                toast('☁️ Saved to Supabase!', 'success');
            }
        } catch (err) {
            console.error('Supabase INSERT error:', err);
            toast('⚠️ Supabase save failed: ' + err.message, 'error');
        }
    }

    async function supabaseDelete(id) {
        if (!state.supabase.url || !state.supabase.key) return;
        try {
            await fetch(state.supabase.url + '/rest/v1/hash_records?id=eq.' + id, {
                method: 'DELETE',
                headers: {
                    'apikey': state.supabase.key,
                    'Authorization': 'Bearer ' + state.supabase.key,
                },
            });
        } catch { }
    }

    // ───────── Toast ─────────
    function toast(msg, type) {
        type = type || 'info';
        const icons = { success: '✅', error: '❌', info: 'ℹ️' };
        const t = document.createElement('div');
        t.className = 'toast ' + type;
        t.innerHTML = `<span class="toast-icon">${icons[type]}</span><span>${msg}</span>`;
        dom.toastContainer.appendChild(t);
        setTimeout(() => { t.remove(); }, 3000);
    }

    // ───────── Helpers ─────────
    function escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str || '';
        return d.innerHTML;
    }

    function formatDate(iso) {
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' +
            d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    // ───────── Theme Toggle ─────────
    function initTheme() {
        const saved = localStorage.getItem('hv_theme');
        if (saved === 'light') {
            document.documentElement.setAttribute('data-theme', 'light');
            dom.themeIcon.textContent = '☀️';
        }
    }

    function toggleTheme() {
        const current = document.documentElement.getAttribute('data-theme');
        if (current === 'light') {
            document.documentElement.removeAttribute('data-theme');
            dom.themeIcon.textContent = '🌙';
            localStorage.setItem('hv_theme', 'dark');
        } else {
            document.documentElement.setAttribute('data-theme', 'light');
            dom.themeIcon.textContent = '☀️';
            localStorage.setItem('hv_theme', 'light');
        }
    }

    // ───────── Boot ─────────
    document.addEventListener('DOMContentLoaded', init);
})();
