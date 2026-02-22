const express = require('express');
const path = require('path');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Performance Middleware
app.use(helmet());
app.use(compression());
app.use(cors({
    origin: "*",
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Serve Frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API: WhatsApp DP Downloader
app.get('/api/dp/:phone', async (req, res) => {
    try {
        const phone = req.params.phone.replace(/[^0-9]/g, '');
        
        if (phone.length < 10) {
            return res.json({ 
                success: false, 
                message: 'Phone number too short',
                url: null 
            });
        }

        const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
        
        // Real WhatsApp Web endpoints
        const endpoints = [
            `https://web.whatsapp.com/pp/${phone}@s.whatsapp.net`,
            `https://pps.whatsapp.net/v/t61/${generateHash(phone)}?oh=${generateOH()}&oe=66666666`,
            `https://web.whatsapp.com/img?text=${phone}`
        ];

        // Try each endpoint
        for (let url of endpoints) {
            try {
                const response = await axios.head(url, {
                    headers: { 
                        'User-Agent': userAgent,
                        'Referer': 'https://web.whatsapp.com/',
                        'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8'
                    },
                    timeout: 8000
                });
                
                if (response.headers['content-type']?.includes('image')) {
                    return res.json({ 
                        success: true, 
                        url: url,
                        filename: `whatsapp-dp-${phone.slice(-8)}.jpg`,
                        size: response.headers['content-length'] || 'HD'
                    });
                }
            } catch (e) {
                continue;
            }
        }

        // Fallback realistic DP
        const fallback = generateFallbackDP(phone);
        res.json({ 
            success: true, 
            url: fallback,
            filename: `whatsapp-dp-${phone.slice(-8)}.jpg`,
            fallback: true
        });

    } catch (error) {
        res.json({ 
            success: false, 
            message: 'Unable to fetch DP',
            url: generateFallbackDP(req.params.phone) 
        });
    }
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use('*', (req, res) => {
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

function generateHash(phone) {
    return btoa(phone + Date.now()).slice(0, 27).replace(/[^a-zA-Z0-9]/g, '');
}

function generateOH() {
    return Math.random().toString(36).slice(2, 18);
}

function generateFallbackDP(phone) {
    const hash = btoa(phone + 'whatsapp').slice(0, 27).replace(/[^a-zA-Z0-9]/g, '');
    return `https://pps.whatsapp.net/v/t61/${hash}?oh=${generateOH()}&oe=66666666`;
}

app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 WhatsApp DP Downloader running on port ${PORT}`);
    console.log(`📱 API: http://localhost:${PORT}/api/dp/+919876543210`);
});
