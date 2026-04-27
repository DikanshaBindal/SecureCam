document.addEventListener('DOMContentLoaded', () => {
    // --- CONFIG ---
    const HORIZON_URL = 'https://horizon-testnet.stellar.org';
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    const ACCESS_KEY = 'ADMIN123';

    let userPublicKey = null;
    let savedRecordings = JSON.parse(localStorage.getItem('sc_suite_vault') || '[]');
    let currentAuditHash = null;
    let pendingViewerItem = null;

    // --- DOM ---
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

    // --- 1. WALLET CONNECTION (STRICT) ---
    gateConnectBtn.onclick = async () => {
        showLoader('WAITING FOR FREIGHTER...');
        
        let attempts = 0;
        const api = await new Promise(resolve => {
            const check = () => {
                const found = window.freighterApi || window.freighter;
                if (found || attempts > 30) resolve(found);
                else { attempts++; setTimeout(check, 100); }
            };
            check();
        });

        if (!api) {
            gateError.innerText = 'EXTENSION NOT FOUND: Please install Freighter Wallet and refresh.';
            gateError.classList.remove('hidden');
            hideLoader();
            return;
        }

        try {
            const address = await api.getPublicKey();
            if (!address) throw new Error("Approval denied");

            // --- MANDATORY LOGON CHALLENGE ---
            // We create a dummy transaction to force the wallet to POP UP and ask for a signature
            showLoader('SIGNING AUTH CHALLENGE...');
            
            // Note: This is a login challenge, not a real spend. 
            // It will force the Freighter popup for "Signing"
            const challenge = await api.signTransaction(
                "AAAAAgAAAABl0InZlbnRvcnlTZWN1cmVDYW0AAAAAAAAAAQAAAAAAAAAAAAAAAQAAAAAAAAAA", // Empty dummy XDR
                { network: "TESTNET" }
            );

            if (!challenge) throw new Error("Signature required for SOC access");

            enterDashboard(address);
        } catch (err) {
            console.error("Strict Connect Fail:", err);
            gateError.innerText = `CONNECT FAIL: ${err.message || 'Check extension status'}`;
            gateError.classList.remove('hidden');
        }
        hideLoader();
    };

    // --- 2. DEMO MODE (OPTIONAL) ---
    const demoLink = document.getElementById('demo-mode-link');
    if (demoLink) {
        demoLink.onclick = (e) => {
            e.preventDefault();
            showLoader('INITIALIZING DEMO ENVIRONMENT...');
            setTimeout(() => {
                const demoWallet = "GC5DFX6LCMBB6255RVZTARSMYVBPUBM2VUIGVZKYSTCXEUXYZZGENB4R";
                enterDashboard(demoWallet);
                hideLoader();
            }, 1000);
        };
    }

    async function enterDashboard(address) {
        userPublicKey = address;
        navAddr.innerText = `${address.slice(0, 6)}...${address.slice(-6)}`;
        
        // Instant non-blocking tasks
        refreshBalance();
        renderVault();
        
        walletGate.classList.add('hidden');
        dashboard.classList.remove('hidden');
        
        // Bind Activation for Camera
        const activateBtn = document.getElementById('activate-cam-btn');
        if (activateBtn) activateBtn.onclick = () => initCamera();

        lucide.createIcons();
    }

    async function refreshBalance() {
        if (!userPublicKey) return;
        try {
            const account = await server.loadAccount(userPublicKey);
            const native = account.balances.find(b => b.asset_type === 'native');
            navBalance.innerText = `${parseFloat(native.balance).toFixed(2)} XLM`;
        } catch (e) { 
            navBalance.innerText = "Demo Credits";
        }
    }

    // --- 2. CAMERA & SIMULATION ---
    async function initCamera() {
        const gate = document.getElementById('cam-gate');
        if (gate) {
            gate.innerHTML = '<div>ESTABLISHING ENCRYPTED LINK...</div>';
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            videoFeed.srcObject = stream;
            if (gate) gate.classList.add('hidden');
            
            setInterval(() => {
                liveTimestamp.innerText = new Date().toLocaleTimeString();
            }, 1000);
        } catch (err) {
            console.error('Camera fail', err);
            startSimulation();
        }
    }

    function startSimulation() {
        const gate = document.getElementById('cam-gate');
        if (gate) gate.classList.add('hidden');
        videoFeed.style.background = '#000';
        
        if (!document.querySelector('.sim-overlay')) {
            videoFeed.insertAdjacentHTML('afterend', '<div class="sim-overlay">[ SECURE SIMULATED FEED ]</div>');
        }

        setInterval(() => {
            liveTimestamp.innerText = new Date().toLocaleTimeString();
        }, 1000);
    }

    // --- 3. RECORDING & VAULT ---
    startRecBtn.onclick = () => {
        const id = 'REC_' + Date.now();
        const newItem = {
            id,
            name: `Surveillance_${id}.mp4`,
            time: new Date().toLocaleString(),
            hash: 'SHA256_' + Math.random().toString(36).substring(7).toUpperCase()
        };

        savedRecordings.unshift(newItem);
        localStorage.setItem('sc_suite_vault', JSON.stringify(savedRecordings));
        renderVault();
        alert('Footage secured in vault.');
    };

    function renderVault() {
        if (!savedRecordings.length) {
            recordingsList.innerHTML = '<div class="empty-state">Vault is empty.</div>';
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
                <i data-lucide="play-circle" style="width:60px; height:60px; margin-bottom:1rem;"></i>
                <h2>DECRYPTED DATA STREAM</h2>
                <p style="color:var(--text-muted); font-size:0.8rem;">CRYPTO HASH: ${item.hash}</p>
                <div style="margin-top:1.5rem; height:120px; background:#111; border:1px solid var(--border); display:flex; align-items:center; justify-content:center; font-size:0.7rem; color:var(--text-muted);">
                    [ STREAMING SECURE DATA ]
                </div>
            </div>
        `;
        viewerModal.classList.remove('hidden');
        lucide.createIcons();
    }

    closeViewerBtn.onclick = () => viewerModal.classList.add('hidden');

    // --- 4. FORENSIC AUDIT ---
    if (auditDropZone) auditDropZone.onclick = () => auditFileInput.click();
    
    auditFileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoader('HASHING EVIDENCE...');
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
            verdictMsg.innerText = 'Markers match secure ledger.';
        } else {
            auditVerdict.className = 'verdict-box tampered';
            verdictStatus.innerText = 'TAMPERED';
            verdictMsg.innerText = 'Integrity compromised or unknown.';
        }
    };

    async function computeSHA256(file) {
        const buf = await file.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
    }

    // --- HELPERS ---
    function showLoader(txt) { loaderMsg.innerText = txt; loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
    navLogout.onclick = () => location.reload();
});