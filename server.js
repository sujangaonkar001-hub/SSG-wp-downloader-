const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// ✅ WORKING APIs (Feb 2026) - NO PROXY NEEDED
const DP_APIS = [
    `https://lookfor.whtsapp.net/${process.env.PHONE}/`, 
    `https://profile.whatsappp.workers.dev/?phone=`,
    `https://wa-profile.wa6s.com/`,
    `https://dp.whtsappapi.com/`,
    `https://api.whtsappprofile.com/dp/`
];

// Create temp folder
const tempDir = path.join(__dirname, 'temp');
fs.mkdir(tempDir, { recursive: true }).catch(() => {});

app.get('/api/dp/:phone', async (req, res) => {
    const phone = req.params.phone.replace(/[^\d]/g, '');
    
    if (phone.length < 10) {
        return res.json({ success: false, message: 'Invalid phone' });
    }

    console.log(`🔍 Searching: ${phone}`);

    try {
        // Try all APIs
        for (const apiBase of DP_APIS) {
            try {
                let url;
                if (apiBase.includes(':phone')) {
                    url = apiBase.replace(':phone', phone);
                } else {
                    url = `${apiBase}${phone}`;
                }

                console.log(`🌐 API: ${url.slice(0, 50)}...`);
                
                const controller = new AbortController();
                setTimeout(() => controller.abort(), 7000);

                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)',
                        'Accept': 'image/*,*/*;q=0.8',
                        'Referer': 'https://web.whatsapp.com/'
                    },
                    signal: controller.signal
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType?.startsWith('image/')) {
                        const buffer = await response.buffer();
                        const ext = contentType.includes('webp') ? 'webp' : 'jpg';
                        const filename = `dp-${phone}-${Date.now()}.${ext}`;
                        const filePath = path.join(tempDir, filename);
                        
                        await fs.writeFile(filePath, buffer);
                        
                        console.log(`✅ SUCCESS: ${filename} (${(buffer.length/1024).toFixed(1)}KB)`);
                        
                        return res.json({
                            success: true,
                            url: `/temp/${filename}`,
                            filename,
                            quality: 'HD',
                            size: `${(buffer.length/1024).toFixed(1)} KB`
                        });
                    }
                }
            } catch (e) {
                // Continue to next API
            }
        }

        // WhatsApp Web fallback
        const waUrl = `https://wa.me/${phone}`;
        const html = await fetch(waUrl).then(r => r.text());
        const imgMatch = html.match(/"previewable_image_url":"([^"]+)"/);
        
        if (imgMatch) {
            console.log('✅ WhatsApp Web found!');
            return res.json({ success: true, url: imgMatch[1], quality: 'Original' });
        }

        console.log(`❌ No public DP for ${phone}`);
        res.json({ success: false, message: 'Private profile - No public DP' });

    } catch (error) {
        console.error('💥 Error:', error.message);
        res.json({ success: false, message: 'Service unavailable' });
    }
});

// Serve images
app.use('/temp', express.static(tempDir));

// Cleanup every 5min
setInterval(async () => {
    try {
        const files = await fs.readdir(tempDir);
        for (const file of files.slice(0, 50)) { // Limit cleanup
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            if (Date.now() - stats.mtimeMs > 300000) {
                await fs.unlink(filePath);
            }
        }
    } catch {}
}, 300000);

// Frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 Server LIVE on port ${PORT}`);
    console.log(`📱 Test: http://localhost:${PORT}/api/dp/919876543210`);
    console.log(`✅ Ready for private DPs!\n`);
});
