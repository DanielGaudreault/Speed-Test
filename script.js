document.addEventListener('DOMContentLoaded', () => {
    const startTestBtn = document.getElementById('startTest');
    const pingDisplay = document.getElementById('ping');
    const downloadDisplay = document.getElementById('download');
    const uploadDisplay = document.getElementById('upload');
    const progressBar = document.getElementById('progressBar');
    const historyList = document.getElementById('historyList');

    let testInProgress = false;

    // Load previous test results from localStorage
    loadHistory();

    // Start speed test
    startTestBtn.addEventListener('click', () => {
        if (testInProgress) return;
        
        testInProgress = true;
        startTestBtn.disabled = true;
        startTestBtn.textContent = 'Testing...';
        
        resetUI();
        runSpeedTest();
    });

    function resetUI() {
        pingDisplay.textContent = '—';
        downloadDisplay.textContent = '—';
        uploadDisplay.textContent = '—';
        progressBar.style.width = '0%';
    }

    async function runSpeedTest() {
        try {
            // Measure ping first
            const ping = await measurePing();
            pingDisplay.textContent = ping;
            
            // Measure download speed
            progressBar.style.backgroundColor = '#4CAF50';
            const downloadSpeed = await measureSpeed('download');
            downloadDisplay.textContent = downloadSpeed.toFixed(2);
            
            // Measure upload speed
            progressBar.style.backgroundColor = '#2196F3';
            const uploadSpeed = await measureSpeed('upload');
            uploadDisplay.textContent = uploadSpeed.toFixed(2);
            
            // Save results
            saveTestResult(ping, downloadSpeed, uploadSpeed);
            
        } catch (error) {
            console.error('Speed test failed:', error);
            alert('Speed test failed. Please try again.');
        } finally {
            testInProgress = false;
            startTestBtn.disabled = false;
            startTestBtn.textContent = 'Start Test';
        }
    }

    // Measure ping (latency)
    async function measurePing() {
        const start = performance.now();
        await fetch('https://httpbin.org/get?cachebuster=' + Math.random(), {
            mode: 'no-cors',
            cache: 'no-store'
        });
        const end = performance.now();
        return Math.round(end - start);
    }

    // Measure download/upload speed
    async function measureSpeed(type = 'download') {
        const fileSizeMB = 10; // Size of test data in MB
        const url = `https://httpbin.org/bytes/${fileSizeMB * 1024 * 1024}`;
        
        let startTime, endTime;
        let speed = 0;
        
        if (type === 'download') {
            startTime = performance.now();
            await fetch(url, { cache: 'no-store' });
            endTime = performance.now();
            
            const durationSec = (endTime - startTime) / 1000;
            const bitsLoaded = fileSizeMB * 8 * 1024 * 1024;
            speed = bitsLoaded / durationSec / 1e6; // Convert to Mbps
            
            // Update progress bar
            progressBar.style.width = '50%';
            
        } else if (type === 'upload') {
            // Simulate upload by sending random data
            const dummyData = new ArrayBuffer(fileSizeMB * 1024 * 1024);
            
            startTime = performance.now();
            await fetch('https://httpbin.org/post', {
                method: 'POST',
                body: dummyData,
                cache: 'no-store'
            });
            endTime = performance.now();
            
            const durationSec = (endTime - startTime) / 1000;
            const bitsSent = fileSizeMB * 8 * 1024 * 1024;
            speed = bitsSent / durationSec / 1e6; // Convert to Mbps
            
            // Update progress bar
            progressBar.style.width = '100%';
        }
        
        return speed;
    }

    // Save test results to localStorage
    function saveTestResult(ping, download, upload) {
        const testResult = {
            date: new Date().toLocaleString(),
            ping,
            download,
            upload
        };
        
        let history = JSON.parse(localStorage.getItem('speedTestHistory') || [];
        history.unshift(testResult); // Add new result to beginning
        if (history.length > 5) history = history.slice(0, 5); // Keep only last 5
        
        localStorage.setItem('speedTestHistory', JSON.stringify(history));
        loadHistory();
    }

    // Load and display test history
    function loadHistory() {
        const history = JSON.parse(localStorage.getItem('speedTestHistory') || [];
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
