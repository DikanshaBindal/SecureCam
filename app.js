document.addEventListener('DOMContentLoaded', () => {
    // UI Elements
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');
    const fileDetails = document.getElementById('file-details');
    const fileHashElem = document.getElementById('file-hash');
    const fileNameElem = document.getElementById('file-name');
    const fileSizeElem = document.getElementById('file-size');
    const registerBtn = document.getElementById('register-btn');
    
    const verifyFileInput = document.getElementById('verify-file-input');
    const verifyBtn = document.getElementById('verify-btn');
    const verifyResult = document.getElementById('verify-result');
    const resultText = document.getElementById('result-text');
    const resultBadge = document.getElementById('result-badge');

    const loader = document.getElementById('loader');
    const loaderText = document.getElementById('loader-text');
    const activityList = document.getElementById('activity-list');

    let currentFileHash = '';

    // Init UI
    renderHistory();

    // --- Upload Logic ---
    dropZone.onclick = () => fileInput.click();
    
    fileInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        showLoader('Computing SHA-256 Hash...');
        
        try {
            const hash = await SecureUtils.generateHash(file);
            currentFileHash = hash;
            
            fileNameElem.innerText = file.name;
            fileSizeElem.innerText = SecureUtils.formatBytes(file.size);
            fileHashElem.innerText = hash;
            
            fileDetails.classList.remove('hidden');
            registerBtn.classList.remove('disabled');
            
            hideLoader();
        } catch (err) {
            alert('Error hashing file');
            hideLoader();
        }
    };

    registerBtn.onclick = async () => {
        showLoader('Stellar Transaction in Progress...');
        
        const result = await StellarHelper.storeHashOnChain(null, currentFileHash);
        
        if (result.success) {
            SecureUtils.saveToHistory({
                name: fileNameElem.innerText,
                hash: currentFileHash,
                tx: result.hash,
                date: new Date().toLocaleString()
            });
            renderHistory();
            alert('Success! Hash committed to Stellar Testnet.');
        }
        
        hideLoader();
    };

    // --- Verification Logic ---
    verifyBtn.onclick = async () => {
        const file = verifyFileInput.files[0];
        if (!file) return alert('Select a file to verify');

        showLoader('Verifying Integrity...');
        
        const hash = await SecureUtils.generateHash(file);
        const history = SecureUtils.getHistory();
        
        const match = history.find(h => h.hash === hash);

        verifyResult.classList.remove('hidden');
        if (match) {
            resultText.innerText = 'Verified (Untampered)';
            resultBadge.className = 'result-badge success';
        } else {
            resultText.innerText = 'Tampered / Unknown';
            resultBadge.className = 'result-badge error';
        }
        
        hideLoader();
    };

    // --- Helpers ---
    function showLoader(text) {
        loaderText.innerText = text;
        loader.classList.remove('hidden');
    }

    function hideLoader() {
        loader.classList.add('hidden');
    }

    function renderHistory() {
        const history = SecureUtils.getHistory();
        if (history.length === 0) return;

        activityList.innerHTML = history.map(item => `
            <li class="activity-item">
                <div class="activity-info">
                    <strong>${item.name}</strong>
                    <span class="activity-hash">${item.hash.slice(0, 16)}...</span>
                </div>
                <span class="activity-date">${item.date}</span>
            </li>
        `).join('');
    }
});
