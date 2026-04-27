document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    const HORIZON_URL = 'https://horizon-testnet.stellar.org';
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    
    let userPublicKey = localStorage.getItem('sc_wallet_addr');
    let activityLog = JSON.parse(localStorage.getItem('sc_pro_ledger') || '[]');
    let activeFile = null;
    let activeHash = null;

    // --- Selectors ---
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const walletConnectedUI = document.getElementById('wallet-connected');
    const addrDisplay = document.getElementById('addr-display');
    const balanceDisplay = document.getElementById('balance-display');

    const uploadZone = document.getElementById('upload-zone');
    const footageInput = document.getElementById('footage-input');
    const uploadPrompt = document.getElementById('upload-prompt');
    const previewBox = document.getElementById('preview-box');
    const previewMedia = document.getElementById('preview-media');
    const fileNameElem = document.getElementById('file-name');
    const fileSizeElem = document.getElementById('file-size');

    const genHashBtn = document.getElementById('gen-hash-btn');
    const hashReveal = document.getElementById('hash-reveal');
    const displayHash = document.getElementById('display-hash');
    const secureOnChainBtn = document.getElementById('secure-on-chain-btn');

    const auditInput = document.getElementById('audit-input');
    const runAuditBtn = document.getElementById('run-audit-btn');
    const auditResult = document.getElementById('audit-result');
    const resultDisplay = document.getElementById('result-display');
    const resultTitle = document.getElementById('result-title');
    const resultMsg = document.getElementById('result-msg');
    const auditExplorerLink = document.getElementById('audit-explorer-link');

    const ledgerEntries = document.getElementById('ledger-entries');
    const loader = document.getElementById('sc-loader');
    const loaderMsg = document.getElementById('loader-msg');

    // --- Init ---
    if (userPublicKey) {
        setAuthUI(userPublicKey);
        refreshBalance(userPublicKey);
    }
    refreshLedger();

    // --- Authentication ---
    loginBtn.onclick = async () => {
        const api = window.freighterApi;
        if (!api) return alert('Freighter Extension not detected.');

        showLoader('Synchronizing Wallet...');
        try {
            const address = await api.getPublicKey();
            userPublicKey = address;
            localStorage.setItem('sc_wallet_addr', address);
            setAuthUI(address);
            await refreshBalance(address);
            hideLoader();
        } catch (err) {
            console.error(err);
            hideLoader();
        }
    };

    logoutBtn.onclick = () => {
        localStorage.removeItem('sc_wallet_addr');
        location.reload();
    };

    async function refreshBalance(address) {
        try {
            const account = await server.loadAccount(address);
            const native = account.balances.find(b => b.asset_type === 'native');
            balanceDisplay.innerText = `${parseFloat(native.balance).toFixed(2)} XLM`;
        } catch (e) {
            balanceDisplay.innerText = '0.00 XLM';
        }
    }

    // --- Upload & Hash ---
    uploadZone.onclick = () => footageInput.click();

    footageInput.onchange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        activeFile = file;

        // Show Preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            previewMedia.innerHTML = '';
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = ev.target.result;
                video.autoplay = true; video.muted = true; video.loop = true;
                previewMedia.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = ev.target.result;
                previewMedia.appendChild(img);
            }
            uploadPrompt.classList.add('hidden');
            previewBox.classList.remove('hidden');
            fileNameElem.innerText = file.name;
            fileSizeElem.innerText = formatSize(file.size);
            genHashBtn.classList.remove('disabled');
        };
        reader.readAsDataURL(file);
    };

    genHashBtn.onclick = async () => {
        if (!activeFile) return;
        showLoader('Generating SHA-256 Fingerprint...');
        activeHash = await computeHash(activeFile);
        displayHash.innerText = activeHash;
        hashReveal.classList.remove('hidden');
        hideLoader();
    };

    // --- Commit Logic ---
    secureOnChainBtn.onclick = async () => {
        if (!userPublicKey) return alert('Please connect system wallet first.');
        showLoader('Awaiting Digital Signature...');
        
        try {
            const account = await server.loadAccount(userPublicKey);
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: await server.fetchBaseFee(),
                networkPassphrase: StellarSdk.Networks.TESTNET,
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: userPublicKey,
                asset: StellarSdk.Asset.native(),
                amount: '0.000001',
            }))
            .addMemo(StellarSdk.Memo.text(activeHash.slice(0, 28)))
            .setTimeout(60)
            .build();

            const signedXDR = await window.freighterApi.signTransaction(transaction.toXDR(), { network: 'TESTNET' });
            showLoader('Anchoring to Blockchain...');
            const result = await server.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedXDR, StellarSdk.Networks.TESTNET));
            
            activityLog.unshift({
                time: new Date().toLocaleString(),
                name: activeFile.name,
                hash: activeHash,
                tx: result.hash
            });
            localStorage.setItem('sc_pro_ledger', JSON.stringify(activityLog));
            
            refreshLedger();
            alert('Success: Evidence anchored on Stellar Testnet.');
            hideLoader();
            resetWorkflow();
        } catch (err) {
            console.error(err);
            alert('Security anchoring failed.');
            hideLoader();
        }
    };

    // --- Audit Logic ---
    runAuditBtn.onclick = async () => {
        const file = auditInput.files[0];
        if (!file) return alert('Select evidence to audit.');

        showLoader('Verifying Cryptographic Markers...');
        const newHash = await computeHash(file);
        const record = activityLog.find(r => r.hash === newHash);

        auditResult.classList.remove('hidden');
        if (record) {
            resultDisplay.className = 'result-display verified';
            resultTitle.innerText = 'VERIFIED';
            resultMsg.innerText = `Evidence matches digital signature anchored on blockchain at ${record.time}.`;
            auditExplorerLink.href = `https://stellar.expert/explorer/testnet/tx/${record.tx}`;
            auditExplorerLink.classList.remove('hidden');
        } else {
            resultDisplay.className = 'result-display tampered';
            resultTitle.innerText = 'TAMPERED / UNKNOWN';
            resultMsg.innerText = 'No matching cryptographic proof discovered in the secure ledger.';
            auditExplorerLink.classList.add('hidden');
        }
        hideLoader();
    };

    // --- Helpers ---
    async function computeHash(file) {
        const buf = await file.arrayBuffer();
        const hashBuf = await crypto.subtle.digest('SHA-256', buf);
        return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function setAuthUI(address) {
        addrDisplay.innerText = `${address.slice(0, 4)}...${address.slice(-4)}`;
        loginBtn.classList.add('hidden');
        walletConnectedUI.classList.remove('hidden');
    }

    function refreshLedger() {
        if (activityLog.length === 0) return;
        ledgerEntries.innerHTML = activityLog.map(item => `
            <tr>
                <td><strong>${item.time}</strong></td>
                <td>${item.name}</td>
                <td><code>${item.hash.slice(0, 18)}...</code></td>
                <td><span style="color: var(--cyan); font-weight: 700;">ANCHORED</span></td>
            </tr>
        `).join('');
    }

    function resetWorkflow() {
        activeFile = null; activeHash = null;
        footageInput.value = '';
        uploadPrompt.classList.remove('hidden');
        previewBox.classList.add('hidden');
        hashReveal.classList.add('hidden');
        genHashBtn.classList.add('disabled');
    }

    function formatSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + ['Bytes', 'KB', 'MB', 'GB'][i];
    }

    function showLoader(txt) { loaderMsg.innerText = txt; loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
});
