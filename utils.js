const SecureUtils = {
    // SHA-256 Hashing using Web Crypto API
    async generateHash(file) {
        const arrayBuffer = await file.arrayBuffer();
        const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    },

    // Format file size
    formatBytes(bytes, decimals = 2) {
        if (!+bytes) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
    },

    // Local Storage Helpers
    saveToHistory(record) {
        const history = JSON.parse(localStorage.getItem('securecam_history') || '[]');
        history.unshift(record);
        localStorage.setItem('securecam_history', JSON.stringify(history.slice(0, 10)));
    },

    getHistory() {
        return JSON.parse(localStorage.getItem('securecam_history') || '[]');
    }
};

const StellarHelper = {
    network: 'TESTNET',
    horizonUrl: 'https://horizon-testnet.stellar.org',

    async getAccountBalance(address) {
        try {
            const server = new StellarSdk.Horizon.Server(this.horizonUrl);
            const account = await server.loadAccount(address);
            const native = account.balances.find(b => b.asset_type === 'native');
            return native ? native.balance : '0';
        } catch (e) {
            console.error(e);
            return '0';
        }
    },

    // Transaction to store Hash in Memo
    async storeHashOnChain(address, hash) {
        // This is a mock-friendly flow for demo
        // In real use, it would trigger Freighter to sign a tx with the hash in memo
        console.log(`Sending hash ${hash} to Stellar Testnet...`);
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    success: true,
                    hash: 'abc123def456...', // Simulation
                    explorer: 'https://stellar.expert/explorer/testnet/tx/...'
                });
            }, 2000);
        });
    }
};
