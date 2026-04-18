        let filename = '';
        let currentResultFile = '';
        let currentBgType = 'solid';
        let currentBgData = { color: '#FFFFFF' };
        let currentResultUrl = '';
        const solidColors = [
            { name: 'White', color: '#FFFFFF' },
            { name: 'Black', color: '#000000' },
            { name: 'Gray', color: '#F5F5F5' },
            { name: 'Blue', color: '#4169E1' },
            { name: 'Green', color: '#50C878' },
            { name: 'Pink', color: '#FF69B4' },
            { name: 'Purple', color: '#8B5CF6' },
            { name: 'Orange', color: '#FF7F50' },
            { name: 'Red', color: '#FF4444' },
            { name: 'Cyan', color: '#00CED1' },
            { name: 'Yellow', color: '#FFD700' },
            { name: 'Brown', color: '#8B4513' }
        ];
        const gradients = [
            { name: 'Sunset', colors: ['#f12711', '#f5af19'] },
            { name: 'Ocean', colors: ['#667eea', '#764ba2'] },
            { name: 'Forest', colors: ['#11998e', '#38ef7d'] },
            { name: 'Midnight', colors: ['#0f2027', '#203a43', '#2c5364'] },
            { name: 'Candy', colors: ['#ee9ca7', '#ffdde1'] },
            { name: 'Royal', colors: ['#141e30', '#243b55'] }
        ];
        function loadSolidColors() {
            const container = document.getElementById('solidBgGrid');
            container.innerHTML = '';
            solidColors.forEach(color => {
                const div = document.createElement('div');
                div.className = 'bg-option';
                div.onclick = (e) => {
                    e.stopPropagation();
                    selectBackground('solid', { color: color.color }, div);
                };
                div.innerHTML = `
                    <div class="bg-preview" style="background: ${color.color}; border: 1px solid #e2e8f0;"></div>
                    <div class="bg-name">${color.name}</div>
                `;
                container.appendChild(div);
            });
        }
        function loadGradients() {
            const container = document.getElementById('gradientBgGrid');
            container.innerHTML = '';
            gradients.forEach(grad => {
                const div = document.createElement('div');
                div.className = 'bg-option';
                div.onclick = (e) => {
                    e.stopPropagation();
                    selectBackground('gradient', { colors: grad.colors }, div);
                };
                div.innerHTML = `
                    <div class="bg-preview" style="background: linear-gradient(135deg, ${grad.colors.join(', ')});"></div>
                    <div class="bg-name">${grad.name}</div>
                `;
                container.appendChild(div);
            });
        }
        document.querySelectorAll('.bg-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.bg-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                const type = tab.dataset.bg;
                document.getElementById('solidBgGrid').style.display = type === 'solid' ? 'grid' : 'none';
                document.getElementById('gradientBgGrid').style.display = type === 'gradient' ? 'grid' : 'none';
            });
        });
        async function selectBackground(type, data, element) {
            currentBgType = type;
            currentBgData = data;
            document.querySelectorAll('.bg-option').forEach(opt => opt.classList.remove('selected'));
            if (element) element.classList.add('selected');
            
            if (filename && currentResultFile) {
                await applyBackground();
            }
        }
        async function applyBackground() {
            if (!filename) return;
            showLoading(true, 'Applying background...');
            try {
                const response = await fetch(`/add_background/${filename}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: currentBgType, data: currentBgData })
                });
                const blob = await response.blob();
                if (currentResultUrl) URL.revokeObjectURL(currentResultUrl);
                currentResultUrl = URL.createObjectURL(blob);
                document.getElementById('resultImage').src = currentResultUrl;
                currentResultFile = `bg_${filename}`;
                showLoading(false);
            } catch (error) {
                console.error('Background error:', error);
                showLoading(false);
            }
        }
        document.getElementById('sharpness').oninput = () => {
            document.getElementById('sharpVal').innerText = document.getElementById('sharpness').value + 'x';
        };
        document.getElementById('contrast').oninput = () => {
            document.getElementById('contVal').innerText = document.getElementById('contrast').value + 'x';
        };
        document.getElementById('brightness').oninput = () => {
            document.getElementById('brightVal').innerText = document.getElementById('brightness').value + 'x';
        };
        async function applyEnhancement() {
            if (!filename) return;
            showLoading(true, 'Enhancing image...');
            try {
                const response = await fetch(`/enhance/${filename}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        settings: {
                            sharpness: parseFloat(document.getElementById('sharpness').value),
                            contrast: parseFloat(document.getElementById('contrast').value),
                            brightness: parseFloat(document.getElementById('brightness').value)
                        }
                    })
                });
                const blob = await response.blob();
                if (currentResultUrl) URL.revokeObjectURL(currentResultUrl);
                currentResultUrl = URL.createObjectURL(blob);
                document.getElementById('resultImage').src = currentResultUrl;
                currentResultFile = `enhanced_${filename}`;
                showLoading(false);
            } catch (error) {
                showLoading(false);
            }
        }
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#667eea';
        });
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#e2e8f0';
        });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#e2e8f0';
            const file = e.dataTransfer.files[0];
            if (file && file.type.startsWith('image/')) uploadFile(file);
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) uploadFile(e.target.files[0]);
        });
        async function uploadFile(file) {
            if (file.size > 10 * 1024 * 1024) {
                alert('File too large! Max 10MB');
                return;
            }
            const formData = new FormData();
            formData.append('photo', file);
            showLoading(true, 'Uploading...');
            try {
                const response = await fetch('/upload', { method: 'POST', body: formData });
                const data = await response.json();
                filename = data.filename;
                const originalUrl = URL.createObjectURL(file);
                document.getElementById('originalImage').src = originalUrl;
                await processBackground();
            } catch (error) {
                alert('Upload failed: ' + error.message);
                showLoading(false);
            }
        }
        async function uploadFromUrl() {
            const url = document.getElementById('urlInput').value.trim();
            if (!url) {
                alert('Please enter image URL');
                return;
            }
            showLoading(true, 'Loading from URL...');
            try {
                const response = await fetch('/upload', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data = await response.json();
                if (data.error) throw new Error(data.error);
                filename = data.filename;
                document.getElementById('originalImage').src = url;
                await processBackground();
            } catch (error) {
                alert('Failed: ' + error.message);
                showLoading(false);
            }
        }
        async function processBackground() {
            showLoading(true, 'Removing background with AI...');   
            try {
                const response = await fetch(`/remove_bg/${filename}`);
                if (!response.ok) throw new Error('Processing failed');
                const blob = await response.blob();
                if (currentResultUrl) URL.revokeObjectURL(currentResultUrl);
                currentResultUrl = URL.createObjectURL(blob);
                document.getElementById('resultImage').src = currentResultUrl;
                currentResultFile = `nobg_${filename}`;
                document.getElementById('resultSection').style.display = 'block';
                showLoading(false);
                setTimeout(() => {
                    applyBackground();
                }, 100);
                document.getElementById('resultSection').scrollIntoView({ behavior: 'smooth' });  
            } catch (error) {
                alert('Background removal failed: ' + error.message);
                showLoading(false);
            }
        }
        function downloadImage() {
            if (!currentResultFile) {
                alert('No image to download');
                return;
            }
            const a = document.createElement('a');
            a.href = `/download/${currentResultFile}`;
            a.download = 'removed_bg.png';
            a.click();
        }
        function showLoading(show, message = 'Processing...') {
            const loadingDiv = document.getElementById('loading');
            const loadingMsg = document.getElementById('loadingMessage');
            if (loadingMsg) loadingMsg.textContent = message;
            if (show) {
                loadingDiv.classList.add('active');
            } else {
                loadingDiv.classList.remove('active');
            }
        }
        loadSolidColors();
        loadGradients();
        setTimeout(() => {
            const firstSolid = document.querySelector('#solidBgGrid .bg-option');
            if (firstSolid) {
                firstSolid.click();
            }
        }, 100);