document.addEventListener('DOMContentLoaded', () => {
    const startTestBtn = document.getElementById('startTest');
    const pingDisplay = document.getElementById('ping');
    const downloadDisplay = document.getElementById('download');
    const uploadDisplay = document.getElementById('upload');
    const progressBar = document.getElementById('progressBar');
    const historyList = document.getElementById('historyList');

    let testInProgress = false;

    // Load previous test results
    loadHistory();

    // Start speed test when button clicked
    startTestBtn.addEventListener('click', async () => {
        if (testInProgress) return;
        
        testInProgress = true;
        startTestBtn.disabled = true;
        startTestBtn.textContent = 'Testing...';
        
        resetUI();
        
        try {
            // Run all tests sequentially
            await runPingTest();
            await runDownloadTest();
            await runUploadTest();
            
            // Save successful test
            saveTestResult(
                parseInt(pingDisplay.textContent),
                parseFloat(downloadDisplay.textContent),
                parseFloat(uploadDisplay.textContent)
            );
            
        } catch (error) {
            console.error("Test failed:", error);
            alert("Speed test failed. Please check your connection and try again.");
        } finally {
            testInProgress = false;
            startTestBtn.disabled = false;
            startTestBtn.textContent = 'Start Test';
        }
    });

    function resetUI() {
        pingDisplay.textContent = '—';
        downloadDisplay.textContent = '—';
        uploadDisplay.textContent = '—';
        progressBar.style.width = '0%';
    }

    async function runPingTest() {
        const start = performance.now();
        try {
            // Use a reliable ping target
            await fetch('https://www.google.com', {
                mode: 'no-cors',
                cache: 'no-store'
            });
        } catch {
            // Even if fails, we get timing
        }
        const end = performance.now();
        pingDisplay.textContent = Math.round(end - start);
    }

    async function runDownloadTest() {
        const testDataUrl = 'https://httpbin.org/bytes/5000000'; // 5MB test file
        let startTime, endTime;
        
        progressBar.style.backgroundColor = '#4CAF50';
        
        startTime = performance.now();
        try {
            await fetch(testDataUrl, { cache: 'no-store' });
        } finally {
            endTime = performance.now();
        }
        
        const durationSeconds = (endTime - startTime) / 1000;
        const bitsLoaded = 5000000 * 8; // 5MB in bits
        const speedMbps = (bitsLoaded / durationSeconds) / 1000000;
        
        downloadDisplay.textContent = speedMbps.toFixed(2);
        progressBar.style.width = '50%';
    }

    async function runUploadTest() {
        // Create 2MB test data to upload
        const testData = new Blob([new ArrayBuffer(2000000)]);
        let startTime, endTime;
        
        progressBar.style.backgroundColor = '#2196F3';
        
        startTime = performance.now();
        try {
            await fetch('https://httpbin.org/post', {
                method: 'POST',
                body: testData,
                cache: 'no-store'
            });
        } finally {
            endTime = performance.now();
        }
        
        const durationSeconds = (endTime - startTime) / 1000;
        const bitsSent = 2000000 * 8; // 2MB in bits
        const speedMbps = (bitsSent / durationSeconds) / 1000000;
        
        uploadDisplay.textContent = speedMbps.toFixed(2);
        progressBar.style.width = '100%';
    }

    function saveTestResult(ping, download, upload) {
        const testResult = {
            date: new Date().toLocaleString(),
            ping,
            download,
            upload
        };
        
        let history = JSON.parse(localStorage.getItem('speedTestHistory') || '[]');
        history.unshift(testResult);
        if (history.length > 5) history = history.slice(0, 5);
        
        localStorage.setItem('speedTestHistory', JSON.stringify(history));
        loadHistory();
    }

    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('speedTestHistory') || '[]');
        historyList.innerHTML = '';
        
        history.forEach(result => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${result.date}</span>
                <span>Ping: ${result.ping}ms</span>
                <span>↓ ${result.download.toFixed(2)} Mbps</span>
                <span>↑ ${result.upload.toFixed(2)} Mbps</span>
            `;
            historyList.appendChild(li);
        });
    }
});
