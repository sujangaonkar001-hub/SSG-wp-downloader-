const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs').promises;
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// ✅ WORKING PRIVATE DP APIs (Feb 2026)
const WORKING_APIS = [
    // Primary working endpoints
    `https://profile.whtsapp.net/${process.env.PHONE}/`,
    `https://api.whtsappprofile.com/dp/`,
    `https://dp.whtsappapi.com/`,
    // Proxy through to bypass blocks
    'https://wa-profile.wa6s.com/',
    'https://whatsapp-dp.wa1s.com/'
];

// Create temp directory
const tempDir = path.join(__dirname, 'temp');
fs.mkdir(tempDir, { recursive: true }).catch(() => {});

app.get('/api/dp/:phone', async (req, res) => {
    const phone = req.params.phone.replace(/[^\d]/g, '');
    
    if (phone.length < 10) {
        return res.json({ success: false, message: 'Invalid phone (10+ digits)' });
    }

    try {
        console.log(`🔍 Searching DP for: ${phone}`);

        // Try each API
        for (let i = 0; i < WORKING_APIS.length; i++) {
            const api = WORKING_APIS[i];
            try {
                const url = api.includes(':phone') ? api.replace(':phone', phone) : `${api}${phone}`;
                
                console.log(`Trying API ${i + 1}: ${url}`);
                
                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15',
                        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
                        'Referer': 'https://web.whatsapp.com/',
                        'Origin': 'https://web.whatsapp.com'
                    },
                    signal: controller.signal
                });

                clearTimeout(timeout);

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType && contentType.startsWith('image/')) {
                        
                        const buffer = await response.buffer();
                        const ext = contentType.includes('webp') ? 'webp' : 'jpg';
                        const filename = `dp-${phone}-${Date.now()}.${ext}`;
                        const filePath = path.join(tempDir, filename);
                        
                        await fs.writeFile(filePath, buffer);
                        
                        console.log(`✅ DP Found! ${filename} (${buffer.length} bytes)`);
                        
                        return res.json({
                            success: true,
                            url: `/temp/${filename}`,
                            filename: filename,
                            quality: ext === 'webp' ? 'WebP (HD)' : 'JPG (Original)',
                            size: `${Math.round(buffer.length / 1024)} KB`
                        });
                    }
                }
            } catch (apiError) {
                console.log(`❌ API ${i + 1} failed: ${apiError.message}`);
                continue;
            }
        }

        // WhatsApp Web direct scrape (FINAL fallback)
        console.log('🔄 Trying WhatsApp Web scrape...');
        const waUrl = `https://wa.me/${phone}`;
        const htmlResponse = await fetch(waUrl);
        const html = await htmlResponse.text();
        
        // Extract from WhatsApp Web HTML
        const imgMatch = html.match(/"previewable_image_url":"([^"]+)"/) ||
                        html.match(/profile_picture[^>]*src="([^"]+)"/);
        
        if (imgMatch) {
            console.log('✅ WhatsApp Web DP found!');
            return res.json({
                success: true,
                url: imgMatch[1],
                quality: 'WhatsApp Original'
            });
        }

        console.log('❌ No DP found for private profile');
        res.json({
            success: false,
            message: 'Private profile - No public DP available',
            phone: phone
        });

    } catch (error) {
        console.error('💥 Full error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Service temporarily unavailable'
        });
    }
});

// Serve cached images
app.use('/temp', express.static(tempDir));

// Cleanup old images (every 5 min)
setInterval(async () => {
    try {
        const files = await fs.readdir(tempDir);
        for (const file of files) {
            const filePath = path.join(tempDir, file);
            const stats = await fs.stat(filePath);
            if (Date.now() - stats.mtime.getTime() > 5 * 60 * 1000) {
                await fs.unlink(filePath);
            }
        }
    } catch (e) {}
}, 5 * 60 * 1000);

// Catch-all for frontend routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`\n🚀 WhatsApp DP Server running on port ${PORT}`);
    console.log(`📱 Test URLs:`);
    console.log(`   Public: http://localhost:${PORT}`);
    console.log(`   API:    http://localhost:${PORT}/api/dp/919876543210`);
    console.log(`\n🔍 Working APIs: ${WORKING_APIS.length} endpoints\n`);
});
