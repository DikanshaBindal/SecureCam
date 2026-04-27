document.addEventListener('DOMContentLoaded', () => {
    // --- Stellar Setup ---
    const HORIZON_URL = 'https://horizon-testnet.stellar.org';
    const server = new StellarSdk.Horizon.Server(HORIZON_URL);
    
    let userPublicKey = localStorage.getItem('sc_wallet_address');
    let localHistory = JSON.parse(localStorage.getItem('sc_v3_history') || '[]');

    // --- DOM Elements ---
    const connectBtn = document.getElementById('connect-wallet');
    const disconnectBtn = document.getElementById('disconnect-wallet');
    const walletInfo = document.getElementById('wallet-info');
    const userAddressElem = document.getElementById('user-address');
    const xlmBalanceElem = document.getElementById('xlm-balance');
    
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const previewArea = document.getElementById('preview-area');
    const hashInfo = document.getElementById('hash-info');
    const generatedHashElem = document.getElementById('generated-hash');
    const secureBtn = document.getElementById('secure-btn');

    const testTxBtn = document.getElementById('test-tx-btn');
    const txFeedback = document.getElementById('tx-feedback');
    const txResultBox = document.getElementById('tx-result-box');
    const txResultText = document.getElementById('tx-result-text');

    const ledgerBody = document.getElementById('ledger-body');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');

    // --- INITIALIZE ---
    if (userPublicKey) {
        setupAuthenticatedUI(userPublicKey);
        fetchBalance(userPublicKey);
    }
    renderHistory();

    // --- 1. CONNECT WALLET ---
    connectBtn.onclick = async () => {
        const api = window.freighterApi;
        if (!api) return alert('Freighter not found!');

        showLoader('Connecting...');
        try {
            const address = await api.getPublicKey();
            userPublicKey = address;
            localStorage.setItem('sc_wallet_address', address);
            
            setupAuthenticatedUI(address);
            await fetchBalance(address);
            hideLoader();
        } catch (err) {
            console.error(err);
            hideLoader();
        }
    };

    // --- 2. DISCONNECT WALLET ---
    disconnectBtn.onclick = () => {
        userPublicKey = null;
        localStorage.removeItem('sc_wallet_address');
        location.reload();
    };

    // --- 3. FETCH BALANCE ---
    async function fetchBalance(address) {
        try {
            const account = await server.loadAccount(address);
            const native = account.balances.find(b => b.asset_type === 'native');
            xlmBalanceElem.innerText = `${parseFloat(native.balance).toFixed(2)} XLM`;
        } catch (e) {
            xlmBalanceElem.innerText = '0.00 XLM';
        }
    }

    // --- 4. SEND TRANSACTION (Level 1 Requirement) ---
    testTxBtn.onclick = async () => {
        showLoader('Signing Test Transaction...');
        try {
            const result = await sendStellarTransaction(userPublicKey, '1', 'Level 1 Test');
            showTxFeedback(true, 'Test Transaction Sent!');
            addToHistory('Transfer', result.hash);
            await fetchBalance(userPublicKey);
            hideLoader();
        } catch (err) {
            showTxFeedback(false, 'Transaction Failed');
            hideLoader();
        }
    };

    // --- CCTV LOGIC ---
    dropZone.onclick = () => fileInput.click();
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoader('Generating Hash...');
        const hash = await generateHash(file);
        generatedHashElem.innerText = hash;
        
        previewArea.classList.remove('hidden');
        hashInfo.classList.remove('hidden');
        hideLoader();
    };

    secureBtn.onclick = async () => {
        const hash = generatedHashElem.innerText;
        showLoader('Anchoring Footage...');
        try {
            const result = await sendStellarTransaction(userPublicKey, '0.00001', hash.slice(0, 28));
            addToHistory('CCTV Anchor', result.hash);
            await fetchBalance(userPublicKey);
            alert('Footage integrity anchored on Stellar!');
            hideLoader();
        } catch (err) {
            alert('Anchoring failed');
            hideLoader();
        }
    };

    // --- CORE BLOCKCHAIN LOGIC ---
    async function sendStellarTransaction(address, amount, memo) {
        const account = await server.loadAccount(address);
        const transaction = new StellarSdk.TransactionBuilder(account, {
            fee: await server.fetchBaseFee(),
            networkPassphrase: StellarSdk.Networks.TESTNET,
        })
        .addOperation(StellarSdk.Operation.payment({
            destination: address,
            asset: StellarSdk.Asset.native(),
            amount: amount,
        }))
        .addMemo(StellarSdk.Memo.text(memo))
        .setTimeout(60)
        .build();

        const signedXDR = await window.freighterApi.signTransaction(transaction.toXDR(), { network: 'TESTNET' });
        return await server.submitTransaction(StellarSdk.TransactionBuilder.fromXDR(signedXDR, StellarSdk.Networks.TESTNET));
    }

    async function generateHash(file) {
        const buffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
        return Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    }

    // --- UI HELPERS ---
    function setupAuthenticatedUI(address) {
        userAddressElem.innerText = `${address.slice(0, 4)}...${address.slice(-4)}`;
        connectBtn.classList.add('hidden');
        walletInfo.classList.remove('hidden');
        testTxBtn.classList.remove('disabled');
    }

    function showTxFeedback(success, msg) {
        txFeedback.classList.remove('hidden');
        txResultBox.className = success ? 'result-box' : 'result-box error';
        txResultText.innerText = msg;
    }

    function addToHistory(type, hash) {
        localHistory.unshift({ type, hash, date: new Date().toLocaleTimeString() });
        localStorage.setItem('sc_v3_history', JSON.stringify(localHistory));
        renderHistory();
    }

    function renderHistory() {
        if (localHistory.length === 0) return;
        ledgerBody.innerHTML = localHistory.map(item => `
            <tr>
                <td><strong>${item.type}</strong></td>
                <td><code>${item.hash.slice(0, 12)}...</code></td>
                <td><span style="color: var(--success)">Success</span></td>
                <td><a href="https://stellar.expert/explorer/testnet/tx/${item.hash}" target="_blank" class="link-btn">View Explorer</a></td>
            </tr>
        `).join('');
    }

    function showLoader(txt) { loaderText.innerText = txt; loader.classList.remove('hidden'); }
    function hideLoader() { loader.classList.add('hidden'); }
});
