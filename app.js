document.addEventListener('DOMContentLoaded', () => {
    // --- State & Config ---
    const HORIZON_URL = 'https://horizon-testnet.stellar.org';
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    const ACCESS_KEY = 'ADMIN123'; // Default Demo Key

    let userPublicKey = null;
    let savedRecordings = JSON.parse(localStorage.getItem('sc_suite_vault') || '[]');
    let currentAuditHash = null;
    let pendingViewerItem = null;

    // --- DOM Elements ---
    const walletGate = document.getElementById('wallet-gate');
    const gateConnectBtn = document.getElementById('gate-connect-btn');
    const gateError = document.getElementById('gate-error');
    
    const dashboard = document.getElementById('main-dashboard');
    const navAddr = document.getElementById('nav-addr');
    const navBalance = document.getElementById('nav-balance');
    const navLogout = document.getElementById('nav-logout');

    const videoFeed = document.getElementById('webcam-feed');
    const startRecBtn = document.getElementById('start-rec-btn');
    const recordingsList = document.getElementById('recordings-list');
    const liveTimestamp = document.getElementById('live-timestamp');

    const auditDropZone = document.getElementById('audit-drop-zone');
    const auditFileInput = document.getElementById('audit-file-input');
    const auditReport = document.getElementById('audit-report');
    const auditHashDisplay = document.getElementById('audit-hash-display');
    const auditVerifyBtn = document.getElementById('audit-verify-btn');
    const auditVerdict = document.getElementById('audit-verdict');
    const verdictStatus = document.getElementById('verdict-status');
    const verdictMsg = document.getElementById('verdict-msg');

    const keyModal = document.getElementById('key-modal');
    const keyInput = document.getElementById('access-key-input');
    const confirmKeyBtn = document.getElementById('confirm-key');
    const cancelModalBtn = document.getElementById('cancel-modal');
    const keyError = document.getElementById('key-error');

    const viewerModal = document.getElementById('viewer-modal');
    const viewerBody = document.getElementById('viewer-body');
    const viewerTitle = document.getElementById('viewer-title');
    const closeViewerBtn = document.getElementById('close-viewer');

    const loader = document.getElementById('sc-loader');
    const loaderMsg = document.getElementById('loader-msg');

    // --- 1. WALLET GATE LOGIC ---
    gateConnectBtn.onclick = async () => {
        const api = window.freighterApi;
        
        if (!api) {
            gateError.innerText = 'EXTENSION NOT FOUND: Please install Freighter Wallet from freighter.app and refresh.';
            gateError.classList.remove('hidden');
            hideLoader();
            return;
        }

        showLoader('CONNECTING TO FREIGHTER...');
        
        let authTimeout = setTimeout(() => {
            hideLoader();
            gateError.innerText = 'CONNECTION TIMEOUT: Please ensure Freighter is unlocked and your browser allows popups.';
            gateError.classList.remove('hidden');
        }, 15000);

        try {
            const address = await api.getPublicKey();
            clearTimeout(authTimeout);
            
            if (!address) throw new Error('No address returned');
            
            enterDashboard(address);
        } catch (err) {
            clearTimeout(authTimeout);
            console.error(err);
            gateError.innerText = `AUTH ERROR: ${err.message || 'Verification failed'}. Refresh and try again.`;
            gateError.classList.remove('hidden');
            hideLoader();
        }
    };

    async function enterDashboard(address) {
        userPublicKey = address;
        navAddr.innerText = `${address.slice(0, 6)}...${address.slice(-6)}`;
        
        await refreshBalance();
        initCamera();
        renderVault();
        
        walletGate.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
        // Bind Activation
        document.getElementById('activate-cam-btn').onclick = () => initCamera();
        
        lucide.createIcons();
        hideLoader();
    }

    async function refreshBalance() {
        if (!userPublicKey || userPublicKey.includes('DEMO')) return;
        try {
            const account = await server.loadAccount(userPublicKey);
            const native = account.balances.find(b => b.asset_type === 'native');
            navBalance.innerText = `${parseFloat(native.balance).toFixed(2)} XLM`;
        } catch (e) { console.error('Balance fetch failed'); }
    }

    // --- 2. LIVE CAMERA LOGIC ---
    async function initCamera() {
        const loader = document.getElementById('cam-gate');
        loader.innerHTML = `
            <div>ESTABLISHING SECURE COMM LINK...</div>
            <button id="skip-cam-btn" class="btn-cyan-outline mt-4" style="font-size:0.6rem; padding:0.4rem 0.8rem;">USE SIMULATED FEED</button>
        `;

        const skipBtn = document.getElementById('skip-cam-btn');
        skipBtn.onclick = (e) => {
            e.stopPropagation();
            clearTimeout(timeout);
            startSimulation();
        };

        const timeout = setTimeout(() => {
            if (loader) {
                loader.innerText = 'HARDWARE DELAY - SWITCHING TO SIMULATED FEED';
                setTimeout(() => startSimulation(), 1000);
            }
        }, 5000);

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
            clearTimeout(timeout);
            videoFeed.srcObject = stream;
            const gate = document.getElementById('cam-gate');
            if (gate) gate.classList.add('hidden');
            
            // Start Clock
            setInterval(() => {
                const now = new Date();
                liveTimestamp.innerText = now.toLocaleTimeString();
            }, 1000);
        } catch (err) {
            console.error('Camera access denied or hardware busy', err);
            startSimulation();
        }
    }

    function startSimulation() {
        document.getElementById('cam-gate').classList.add('hidden');
        videoFeed.style.backgroundColor = '#000';
        // Prevent double injection
        if (!document.querySelector('.sim-overlay')) {
            videoFeed.insertAdjacentHTML('afterend', '<div class="sim-overlay">[ SECURE SIMULATED FEED - TEST MODE ]</div>');
        }
        
        setInterval(() => {
            const now = new Date();
            liveTimestamp.innerText = now.toLocaleTimeString();
        }, 1000);
    }

    startRecBtn.onclick = () => {
        const timestamp = new Date().toLocaleString();
        const id = 'REC_' + Date.now();
        const newItem = {
            id: id,
            name: `Surveillance_${id}.mp4`,
            time: timestamp,
            hash: 'SIMULATED_HASH_' + Math.random().toString(36).substring(7).toUpperCase()
        };

        savedRecordings.unshift(newItem);
        localStorage.setItem('sc_suite_vault', JSON.stringify(savedRecordings));
        renderVault();
        alert('Footage captured and secured in vault.');
    };

    // --- 3. VAULT & ACCESS CONTROL ---
    function renderVault() {
        if (savedRecordings.length === 0) {
            recordingsList.innerHTML = '<div class="empty-state">No recordings archived.</div>';
            return;
        }

        recordingsList.innerHTML = savedRecordings.map(item => `
            <div class="vault-item" onclick="requestAccess('${item.id}')">
                <i data-lucide="video"></i>
                <div class="vault-info">
                    <span class="name">${item.name}</span>
                    <span class="time">${item.time}</span>
                </div>
            </div>
        `).join('');
        lucide.createIcons();
    }

    window.requestAccess = (id) => {
        pendingViewerItem = savedRecordings.find(r => r.id === id);
        keyModal.classList.remove('hidden');
        keyInput.value = '';
        keyError.classList.add('hidden');
    };

    confirmKeyBtn.onclick = () => {
        if (keyInput.value === ACCESS_KEY) {
            openViewer(pendingViewerItem);
            keyModal.classList.add('hidden');
        } else {
            keyError.classList.remove('hidden');
        }
    };

    cancelModalBtn.onclick = () => keyModal.classList.add('hidden');

    function openViewer(item) {
        viewerTitle.innerText = item.name;
        viewerBody.innerHTML = `
            <div style="text-align:center; color:var(--cyan)">
                <i data-lucide="play-circle" style="width:80px; height:80px; margin-bottom:1rem;"></i>
                <h2>DECRYPTED DATA STREAM</h2>
                <p style="color:var(--text-muted); margin-top:0.5rem;">Cryptographic Hash: ${item.hash}</p>
                <div style="margin-top:2rem; width:300px; height:150px; background:#111; border:1px solid var(--border); display:flex; align-items:center; justify-content:center;">
                    <span style="font-size:0.7rem; letter-spacing:0.1em;">[ SIMULATED VIDEO FEED ]</span>
                </div>
            </div>
        `;
        viewerModal.classList.remove('hidden');
        lucide.createIcons();
    }

    closeViewerBtn.onclick = () => viewerModal.classList.add('hidden');

    // --- 4. VERIFICATION LOGIC ---
    auditDropZone.onclick = () => auditFileInput.click();
    auditFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoader('ANALYZING CRYPTOGRAPHY...');
        currentAuditHash = await computeSHA256(file);
        auditHashDisplay.innerText = currentAuditHash;
        auditReport.classList.remove('hidden');
        auditVerdict.classList.add('hidden');
        hideLoader();
    };

    auditVerifyBtn.onclick = () => {
        const match = savedRecordings.find(r => r.hash === currentAuditHash);
        
        auditVerdict.classList.remove('hidden');
        if (match) {
            auditVerdict.className = 'verdict-box verified';
            verdictStatus.innerText = 'VERIFIED';
            verdictMsg.innerText = 'Evidence markers match secure ledger signature.';
        } else {
            auditVerdict.className = 'verdict-box tampered';
            verdictStatus.innerText = 'TAMPERED / UNKNOWN';
            verdictMsg.innerText = 'No matching signature found. Possible data corruption.';
        }
    };

    // --- HELPERS ---
    async function computeSHA256(file) {
        const buf = await file.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    function showLoader(txt) { loaderMsg.innerText = txt; loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
    navLogout.onclick = () => location.reload();
});
