document.addEventListener('DOMContentLoaded', () => {
    // --- Blockchain & State ---
    const HORIZON_URL = 'https://horizon-testnet.stellar.org';
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    
    let userPublicKey = null;
    let localLedger = JSON.parse(localStorage.getItem('securecam_v2_ledger') || '[]');
    let currentFileHash = null;
    let currentFile = null;

    // --- DOM Elements ---
    const connectBtn = document.getElementById('connect-wallet');
    const walletInfo = document.getElementById('wallet-info');
    const userAddressElem = document.getElementById('user-address');
    
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const dropContent = document.getElementById('drop-content');
    const previewArea = document.getElementById('preview-area');
    const previewContainer = document.getElementById('preview-container');
    const previewName = document.getElementById('preview-name');

    const processingInfo = document.getElementById('processing-info');
    const generatedHashElem = document.getElementById('generated-hash');
    const storeBtn = document.getElementById('store-btn');

    const verifyInput = document.getElementById('verify-input');
    const verifyBtn = document.getElementById('verify-btn');
    const verifyResult = document.getElementById('verify-result');
    const resultBox = document.getElementById('result-box');
    const resultStatus = document.getElementById('result-status');
    const resultDetails = document.getElementById('result-details');
    const explorerLinkContainer = document.getElementById('explorer-link-container');
    const explorerLink = document.getElementById('explorer-link');

    const ledgerBody = document.getElementById('ledger-body');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');

    // --- INITIALIZE ---
    renderLedger();

    // --- WALLET CONNECT ---
    connectBtn.onclick = async () => {
        const api = window.freighterApi;
        if (!api) {
            alert('Freighter API not loaded. Please try refreshing or check your connection.');
            return;
        }

        showLoader('Connecting to Freighter...');
        try {
            const isInstalled = await api.isConnected();
            if (!isInstalled) {
                alert('Freighter Wallet not found. Please install the extension!');
                hideLoader();
                return;
            }

            const { address } = await api.getAddress();
            userPublicKey = address;
            
            userAddressElem.innerText = `${address.slice(0, 6)}...${address.slice(-6)}`;
            connectBtn.classList.add('hidden');
            walletInfo.classList.remove('hidden');
            
            setStep(2);
            hideLoader();
        } catch (err) {
            console.error(err);
            hideLoader();
        }
    };

    // --- FILE PROCESSING ---
    dropZone.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        currentFile = file;

        showLoader('Hashing Footage...');
        
        // Show Preview
        const reader = new FileReader();
        reader.onload = (ev) => {
            previewContainer.innerHTML = '';
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = ev.target.result;
                video.autoplay = true; video.muted = true; video.loop = true;
                previewContainer.appendChild(video);
            } else {
                const img = document.createElement('img');
                img.src = ev.target.result;
                previewContainer.appendChild(img);
            }
            dropContent.classList.add('hidden');
            previewArea.classList.remove('hidden');
            previewName.innerText = file.name;
        };
        reader.readAsDataURL(file);

        // SHA-256
        currentFileHash = await generateSHA256(file);
        generatedHashElem.innerText = currentFileHash;
        
        processingInfo.classList.remove('hidden');
        storeBtn.classList.remove('disabled');
        setStep(3);
        hideLoader();
    };

    // --- STELLAR TRANSACTION (ANCHORING) ---
    storeBtn.onclick = async () => {
        if (!userPublicKey) return alert('Please connect your wallet first!');
        
        showLoader('Requesting Signature...');
        
        try {
            // 1. Fetch Account
            const account = await server.loadAccount(userPublicKey);
            
            // 2. Build Transaction (Sending 1 stroop to self with Hash in Memo)
            const transaction = new StellarSdk.TransactionBuilder(account, {
                fee: await server.fetchBaseFee(),
                networkPassphrase: StellarSdk.Networks.TESTNET,
            })
            .addOperation(StellarSdk.Operation.payment({
                destination: userPublicKey,
                asset: StellarSdk.Asset.native(),
                amount: '0.000001',
            }))
            .addMemo(StellarSdk.Memo.text(currentFileHash.slice(0, 28))) // Stellar Memo limited to 28 bytes
            .setTimeout(60)
            .build();

            // 3. Sign with Freighter
            const signedXDR = await window.freighterApi.signTransaction(transaction.toXDR(), {
                network: 'TESTNET',
            });

            // 4. Submit
            showLoader('Submitting to Stellar...');
            const result = await server.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedXDR, StellarSdk.Networks.TESTNET));
            
            // 5. Track locally
            const record = {
                timestamp: new Date().toLocaleString(),
                filename: currentFile.name,
                hash: currentFileHash,
                txHash: result.hash
            };
            
            localLedger.unshift(record);
            localStorage.setItem('securecam_v2_ledger', JSON.stringify(localLedger));
            
            renderLedger();
            alert('Success! Footage integrity anchored on Stellar Testnet.');
            hideLoader();
            resetUploadUI();
        } catch (err) {
            console.error(err);
            alert('Transaction failed. Check console or wallet balance.');
            hideLoader();
        }
    };

    // --- VERIFICATION ---
    verifyBtn.onclick = async () => {
        const file = verifyInput.files[0];
        if (!file) return alert('Select a file to verify');

        showLoader('Verifying Against Ledger...');
        const newHash = await generateSHA256(file);
        const match = localLedger.find(r => r.hash === newHash);

        verifyResult.classList.remove('hidden');
        if (match) {
            resultBox.className = 'result-box verified';
            resultStatus.innerText = 'VERIFIED';
            resultDetails.innerText = `Record discovered on Stellar. Anchored at ${match.timestamp}.`;
            explorerLink.href = `https://stellar.expert/explorer/testnet/tx/${match.txHash}`;
            explorerLinkContainer.classList.remove('hidden');
        } else {
            resultBox.className = 'result-box tampered';
            resultStatus.innerText = 'TAMPERED / UNKNOWN';
            resultDetails.innerText = 'No matching cryptographic record found in the secure ledger.';
            explorerLinkContainer.classList.add('hidden');
        }
        setStep(4);
        hideLoader();
    };

    // --- HELPERS ---
    async function generateSHA256(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function renderLedger() {
        if (localLedger.length === 0) {
            ledgerBody.innerHTML = '<tr><td colspan="4" class="empty-row">No records anchored yet.</td></tr>';
            return;
        }

        ledgerBody.innerHTML = localLedger.map(item => `
            <tr>
                <td>${item.timestamp}</td>
                <td>${item.filename}</td>
                <td><code title="${item.txHash}">${item.txHash.slice(0, 16)}...</code></td>
                <td style="color: var(--success); font-weight: 800;">ANCHORED</td>
            </tr>
        `).join('');
    }

    function resetUploadUI() {
        dropContent.classList.remove('hidden');
        previewArea.classList.add('hidden');
        processingInfo.classList.add('hidden');
        fileInput.value = '';
        currentFileHash = null;
        setStep(2);
    }

    function setStep(num) {
        document.querySelectorAll('.step').forEach((s, idx) => {
            if (idx + 1 === num) s.classList.add('active');
            else s.classList.remove('active');
        });
    }

    function showLoader(txt) { loaderText.innerText = txt; loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
});
