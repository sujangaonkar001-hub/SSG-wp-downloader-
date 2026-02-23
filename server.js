const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.static('public'));

// 🔥 YOUR PRIVATE PROXY ENDPOINTS (Rotate daily)
const PROXY_APIS = [
    'https://wa-profile.wa6s.com',
    'https://dp.whtsapp.lol',
    'https://lookfor.whats.app',
    'https://profile.whatsappp.workers.dev/?phone=',
    'https://api.whtsappprofile.com/dp/',
    'https://whtsapp-dp-api.replit.app',
    'https://whatsapp-profile.fly.dev',
    // ADD YOUR CUSTOM ONES HERE ↓
];

// Custom UA rotation (Toolzin-style)
const USER_AGENTS = [
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 WhatsApp/2.2419.11',
    'Mozilla/5.0 (Linux; Android 13; SM-G998B) AppleWebKit/537.36 Chrome/120.0.0.0'
];

app.post('/api/proxy-dp', async (req, res) => {
    const { phone } = req.body;
    const cleanPhone = phone.replace(/[^\d]/g, '');
    
    console.log(`🔄 PROXY: +${cleanPhone}`);
    
    // Rotate UA
    const ua = USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
    
    for (const baseApi of PROXY_APIS) {
        try {
            const url = baseApi.includes('?phone=') ? 
                `${baseApi}${cleanPhone}` : 
                `${baseApi}/${cleanPhone}`;
            
            const proxyRes = await fetch(url, {
                headers: {
                    'User-Agent': ua,
                    'Referer': 'https://toolzin.com/',
                    'Origin': 'https://toolzin.com',
                    'X-Forwarded-For': `${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`
                },
                timeout: 7000
            });

            if (proxyRes.ok) {
                const contentType = proxyRes.headers.get('content-type');
                if (contentType?.includes('image')) {
                    const buffer = Buffer.from(await proxyRes.arrayBuffer());
                    return res.json({
                        success: true,
                        image: buffer.toString('base64'),
                        contentType,
                        source: baseApi
                    });
                }
            }
        } catch (e) {
            console.log(`⏭️ ${baseApi} failed`);
        }
    }
    
    // WhatsApp fallback (YOUR custom)
    try {
        const waRes = await fetch(`https://wa.me/${cleanPhone}`);
        const html = await waRes.text();
        const imgUrl = html.match(/"previewable_image_url":"([^"]+)"/)?.[1];
        if (imgUrl) {
            return res.json({ success: true, url: imgUrl, source: 'wa.me' });
        }
    } catch {}

    res.json({ success: false, message: 'Private/No DP' });
});

// YOUR MAIN DP endpoint (frontend calls this)
app.get('/api/dp/:phone', async (req, res) => {
    const phone = req.params.phone;
    const proxyResult = await fetch(`http://localhost:${PORT}/api/proxy-dp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
    });
    
    const data = await proxyResult.json();
    res.json(data);
});

app.listen(PORT, () => {
    console.log(`🚀 YOUR PROXY LIVE: http://localhost:${PORT}`);
});
