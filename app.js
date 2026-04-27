document.addEventListener('DOMContentLoaded', () => {
    // --- State & Constants ---
    let blockchainLedger = JSON.parse(localStorage.getItem('sc_ledger') || '[]');
    let currentHash = null;
    let currentFile = null;

    // --- DOM Elements ---
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const dropContent = document.getElementById('drop-content');
    const previewArea = document.getElementById('preview-area');
    const previewContainer = document.getElementById('preview-container');
    const previewName = document.getElementById('preview-name');
    
    const processingInfo = document.getElementById('processing-info');
    const generatedHashElem = document.getElementById('generated-hash');
    const storeBtn = document.getElementById('store-btn');
    const resetBtn = document.getElementById('reset-btn');

    const verifyInput = document.getElementById('verify-input');
    const verifyBtn = document.getElementById('verify-btn');
    const verifyResult = document.getElementById('verify-result');
    const resultBox = document.getElementById('result-box');
    const resultStatus = document.getElementById('result-status');
    const resultDetails = document.getElementById('result-details');

    const ledgerBody = document.getElementById('ledger-body');
    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');

    // --- INITIALIZATION ---
    renderLedger();

    // --- STEP 1: UPLOAD & PREVIEW ---
    dropZone.onclick = () => fileInput.click();

    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        currentFile = file;
        await processFile(file);
    };

    async function processFile(file) {
        setStep(2);
        showLoader('Generating Cryptographic Hash...');
        
        // Show Preview
        const reader = new FileReader();
        reader.onload = (e) => {
            previewContainer.innerHTML = '';
            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = e.target.result;
                video.autoplay = true;
                video.muted = true;
                video.loop = true;
                previewContainer.appendChild(video);
            } else if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src = e.target.result;
                previewContainer.appendChild(img);
            }
            
            dropContent.classList.add('hidden');
            previewArea.classList.remove('hidden');
            previewName.innerText = file.name;
        };
        reader.readAsDataURL(file);

        // Generate Hash
        try {
            const hash = await generateSHA256(file);
            currentHash = hash;
            generatedHashElem.innerText = hash;
            processingInfo.classList.remove('hidden');
            hideLoader();
        } catch (err) {
            console.error(err);
            alert('Hash generation failed.');
            hideLoader();
        }
    }

    // --- STEP 2: STORE (SIMULATED BLOCKCHAIN) ---
    storeBtn.onclick = () => {
        if (!currentHash) return;
        
        setStep(3);
        showLoader('Securing in Ledger...');
        
        setTimeout(() => {
            const record = {
                timestamp: new Date().toLocaleTimeString(),
                filename: currentFile.name,
                hash: currentHash,
                status: 'SECURE'
            };

            blockchainLedger.unshift(record);
            localStorage.setItem('sc_ledger', JSON.stringify(blockchainLedger));
            
            renderLedger();
            hideLoader();
            alert('CCTV Integrity Verified & Record Stored Successfully.');
            resetUI();
        }, 1500);
    };

    // --- STEP 3: VERIFY ---
    verifyBtn.onclick = async () => {
        const file = verifyInput.files[0];
        if (!file) return alert('Please upload a file to audit.');

        showLoader('Auditing Digital Fingerprint...');
        setStep(4);

        const newHash = await generateSHA256(file);
        const match = blockchainLedger.find(r => r.hash === newHash);

        verifyResult.classList.remove('hidden');
        
        if (match) {
            resultBox.className = 'result-box verified';
            resultStatus.innerText = 'VERIFIED (Untampered)';
            resultDetails.innerText = `Matching record found: Identical to footage stored at ${match.timestamp}`;
        } else {
            resultBox.className = 'result-box tampered';
            resultStatus.innerText = 'TAMPERED / UNKNOWN';
            resultDetails.innerText = 'The cryptographic signature of this file does not match any entry in the secure ledger.';
        }
        
        hideLoader();
    };

    resetBtn.onclick = resetUI;

    // --- CORE LOGIC ---
    async function generateSHA256(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }

    function renderLedger() {
        if (blockchainLedger.length === 0) {
            ledgerBody.innerHTML = '<tr><td colspan="4" class="empty-row">No records secured yet.</td></tr>';
            return;
        }

        ledgerBody.innerHTML = blockchainLedger.map(item => `
            <tr>
                <td>${item.timestamp}</td>
                <td>${item.filename}</td>
                <td><code>${item.hash.slice(0, 24)}...</code></td>
                <td style="color: var(--success); font-weight: 700;">${item.status}</td>
            </tr>
        `).join('');
    }

    function setStep(num) {
        document.querySelectorAll('.step').forEach((s, idx) => {
            if (idx + 1 === num) s.classList.add('active');
            else s.classList.remove('active');
        });
    }

    function resetUI() {
        currentHash = null;
        currentFile = null;
        fileInput.value = '';
        dropContent.classList.remove('hidden');
        previewArea.classList.add('hidden');
        processingInfo.classList.add('hidden');
        setStep(1);
    }

    function showLoader(text) {
        loaderText.innerText = text;
        loader.classList.remove('hidden');
    }

    function hideLoader() {
        loader.classList.add('hidden');
    }
});
