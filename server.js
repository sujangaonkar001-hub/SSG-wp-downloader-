const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static('public'));
app.use(express.json());

// ✅ PRIVATE DP BYPASS - Multiple WhatsApp APIs
const WHATSAPP_APIS = [
    'https://api.wati.io/api/v1/getProfilePicture',
    'https://profile.wapp.dynv6.net',
    'https://dp.wapp.dynv6.net',
    'https://api.whatsapp-profile.com',
    'https://wapp-profile.wapp.dynv6.net'
];

app.get('/api/dp/:phone', async (req, res) => {
    const phone = req.params.phone.replace(/[^\d]/g, '');
    
    if (phone.length < 10) {
        return res.json({ success: false, message: 'Invalid phone number' });
    }

    try {
        // Try multiple WhatsApp DP endpoints
        for (const api of WHATSAPP_APIS) {
            try {
                const url = `${api}/${phone}`;
                const response = await fetch(url, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                        'Accept': 'image/*'
                    },
                    timeout: 5000
                });

                if (response.ok && response.headers.get('content-type')?.includes('image')) {
                    const buffer = await response.buffer();
                    const filename = `dp-${phone}-${Date.now()}.jpg`;
                    
                    // Save image temporarily
                    const imagePath = path.join(__dirname, 'temp', filename);
                    fs.writeFileSync(imagePath, buffer);
                    
                    return res.json({
                        success: true,
                        url: `/temp/${filename}`,
                        filename: filename,
                        quality: 'HD',
                        size: `${(buffer.length / 1024).toFixed(1)} KB`
                    });
                }
            } catch (apiError) {
                console.log(`API ${api} failed:`, apiError.message);
                continue;
            }
        }

        // Fallback: WhatsApp Web scraping
        const fallbackUrl = `https://wa.me/${phone}`;
        const html = await fetch(fallbackUrl).then(r => r.text());
        
        // Extract DP from WhatsApp Web
        const dpMatch = html.match(/"profile_picture":"([^"]+)"/);
        if (dpMatch) {
            return res.json({
                success: true,
                url: dpMatch[1],
                quality: 'Original'
            });
        }

        // Final fallback - Generate placeholder
        res.json({
            success: false,
            message: 'Private profile or no DP available',
            placeholder: true
        });

    } catch (error) {
        console.error('DP Search Error:', error);
        res.json({
            success: false,
            message: 'Unable to fetch profile picture'
        });
    }
});

// Serve temp images
app.use('/temp', express.static(path.join(__dirname, 'temp')));

// Cleanup temp files every 10 minutes
setInterval(() => {
    const tempDir = path.join(__dirname, 'temp');
    if (fs.existsSync(tempDir)) {
        fs.readdirSync(tempDir).forEach(file => {
            const filePath = path.join(tempDir, file);
            if (Date.now() - fs.statSync(filePath).mtime.getTime() > 10 * 60 * 1000) {
                fs.unlinkSync(filePath);
            }
        });
    }
}, 10 * 60 * 1000);

// Create temp dir
const tempDir = path.join(__dirname, 'temp');
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir);
}

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Test: http://localhost:${PORT}`);
});
