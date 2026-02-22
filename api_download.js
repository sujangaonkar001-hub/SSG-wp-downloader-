const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

app.get('/api/dp/:phone', async (req, res) => {
    try {
        const phone = req.params.phone.replace(/[^0-9]/g, '');
        
        // Real WhatsApp Web endpoints
        const endpoints = [
            `https://web.whatsapp.com/pp/${phone}@s.whatsapp.net`,
            // Add more WhatsApp Web scraping endpoints here
        ];

        for (let url of endpoints) {
            try {
                const response = await axios.get(url, {
                    headers: {
                        'User-Agent': 'WhatsApp-DP-Downloader/1.0',
                        'Referer': 'https://web.whatsapp.com/'
                    },
                    timeout: 5000,
                    responseType: 'stream'
                });
                
                if (response.headers['content-type']?.includes('image')) {
                    res.set({
                        'Content-Type': response.headers['content-type'],
                        'Content-Disposition': `attachment; filename="whatsapp-dp-${phone}.jpg"`
                    });
                    response.data.pipe(res);
                    return;
                }
            } catch (e) {
                continue;
            }
        }
        
        res.status(404).json({ error: 'Profile picture not found' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

app.listen(3000, () => {
    console.log('WhatsApp DP Downloader running on port 3000');
});
