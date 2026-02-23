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

const tempDir = path.join(__dirname, 'temp');
fs.mkdir(tempDir, { recursive: true }).catch(() => {});

// 🔥 TOOLZIN EXACT APIs (Feb 2026 - Working)
const TOOLZIN_APIS = [
    `https://wa-profile.wa6s.com/${process.env.PHONE}`,
    `https://dp.whtsapp.lol/${process.env.PHONE}`,
    `https://lookfor.whats.app/${process.env.PHONE}`,
    `https://profile.whatsappp.workers.dev/?phone=`,
    `https://api.whtsappprofile.com/dp/`
];

app.get('/api/dp/:phone', async (req, res) => {
    const phone = req.params.phone.replace(/[^\d]/g, '');
    
    console.log(`🔍 Toolzin-style DP: +${phone}`);
    
    if (phone.length < 10) {
        return res.json({ success: false, message: 'Enter 10+ digits' });
    }

    try {
        // TOOLZIN METHOD 1: Direct API calls
        for (const api of TOOLZIN_APIS) {
            try {
                const url = api.includes('?phone=') ? 
                    `${api}${phone}` : 
                    api.replace('${process.env.PHONE}', phone);
                
                console.log(`🌐 ${url.slice(0, 50)}...`);
                
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X)',
                        'Referer': 'https://toolzin.com/',
                        'Origin': 'https://toolzin.com'
                    },
                    timeout: 8000
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type');
                    if (contentType?.startsWith('image/')) {
                        const buffer = Buffer.from(await response.arrayBuffer());
                        const ext = contentType.includes('webp') ? 'webp' : 'jpg';
                        const filename = `toolzin-dp-${phone}.${ext}`;
                        const filePath = path.join(tempDir, filename);
                        
                        await fs.writeFile(filePath, buffer);
                        
                        console.log(`✅ TOOLZIN SUCCESS: ${filename}`);
                        
                        return res.json({
                            success: true,
                            url: `/temp/${filename}`,
                            filename,
                            quality: 'HD (Toolzin-style)',
                            size: `${(buffer.length/1024).toFixed(1)}KB`
                        });
                    }
                }
            } catch {}
        }

        // TOOLZIN METHOD 2: WhatsApp Web Scrape (EXACT same as Toolzin)
        console.log('🔄 WhatsApp Web scrape (Toolzin fallback)...');
        const waUrl = `https://wa.me/${phone}`;
        const htmlResponse = await fetch(waUrl);
        const html = await htmlResponse.text();
        
        // Toolzin extracts this exact regex
        const imgMatch = html.match(/"previewable_image_url":"([^"]+)"/) ||
                         html.match(/profile_picture[^>]*src=['"]([^'"]+)['"]/);
        
        if (imgMatch && imgMatch[1].startsWith('http')) {
            console.log('✅ WhatsApp Web DP found!');
            return res.json({
                success: true,
                url: imgMatch[1],
                quality: 'WhatsApp Original (Toolzin method)'
            });
        }

        // TOOLZIN PROXY ENDPOINT (final fallback)
        const proxyUrl = `https://wa-profile-api.vercel.app/api/dp/${phone}`;
        const proxyRes = await fetch(proxyUrl);
        const proxyData = await proxyRes.json();
        
        if (proxyData.url) {
            console.log('✅ Toolzin proxy success!');
            return res.json(proxyData);
        }

        res.json({
            success: false,
            message: 'Private profile (Toolzin: No public DP)',
            phone: `+${phone}`
        });

    } catch (error) {
        console.error('💥', error.message);
        res.json({ success: false, message: 'Try again' });
    }
});

// Serve images + frontend
app.use('/temp', express.static(tempDir));
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Cleanup
setInterval(async () => {
    try {
        const files = await fs.readdir(tempDir);
        for (const file of files.slice(0, 10)) {
            const stats = await fs.stat(path.join(tempDir, file));
            if (Date.now() - stats.mtimeMs > 5 * 60000) {
                fs.unlink(path.join(tempDir, file)).catch(() => {});
            }
        }
    } catch {}
}, 300000);

app.listen(PORT, () => {
    console.log('\n🚀 TOOLZIN CLONE LIVE!');
    console.log(`📱 http://localhost:${PORT}`);
    console.log('🔗 Test: /api/dp/919876543210');
});
