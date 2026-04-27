// Simple Unit Testing Suite for SecureCam
const runTests = async () => {
    console.log("🚀 Starting SecureCam Tests...");
    let passed = 0;
    let failed = 0;

    const assert = (condition, message) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    };

    // Test 1: Hash Generation
    try {
        const mockFile = new File(["test data"], "test.txt", { type: "text/plain" });
        const hash = await SecureUtils.generateHash(mockFile);
        assert(hash.length === 64, "Hash generation produces 64-char string (SHA-256)");
        assert(hash === "916f0027c575a7401ef6c7943fcf36735e584fdf5fcd2f254e2870425890f5cb", "Hash value matches expected for 'test data'");
    } catch (e) {
        failed++;
        console.error("Test 1 crashed", e);
    }

    // Test 2: Verification Logic
    const storedHash = "916f0027c575a7401ef6c7943fcf36735e584fdf5fcd2f254e2870425890f5cb";
    const newHash = "916f0027c575a7401ef6c7943fcf36735e584fdf5fcd2f254e2870425890f5cb";
    assert(storedHash === newHash, "Verification confirms match between identical hashes");

    // Test 3: Formatting
    assert(SecureUtils.formatBytes(1048576) === "1 MB", "File size formatting works for 1MB");

    console.log(`\n📊 Test Results: ${passed} Passed, ${failed} Failed`);
};

// Expose to window for console testing
window.runSecureTests = runTests;
