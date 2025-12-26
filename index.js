const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// قائمة متصفحات وهمية (User Agents) لخداع الحماية
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1"
];

// نقطة الفحص الرئيسية
app.get('/check/:username', async (req, res) => {
    const { username } = req.params;
    
    // نستخدم V1 API لأنه أحياناً أسهل في السيرفرات
    // أو V2/livestream حسب الاستجابة
    const targetUrl = `https://kick.com/api/v1/channels/${username}`;
    
    // اختيار متصفح عشوائي
    const randomAgent = userAgents[Math.floor(Math.random() * userAgents.length)];

    try {
        const response = await axios.get(targetUrl, {
            headers: {
                'User-Agent': randomAgent,
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Cache-Control': 'no-cache'
            },
            timeout: 5000 // مهلة 5 ثواني
        });

        const data = response.data;

        // تحليل الرد
        if (data && data.livestream && data.livestream.is_live) {
            return res.json({ 
                isLive: true, 
                viewers: data.livestream.viewer_count 
            });
        } else {
            return res.json({ isLive: false, viewers: 0 });
        }

    } catch (error) {
        // في حالة الخطأ (404 يعني أوفلاين غالباً، 403 يعني حظر)
        if (error.response && error.response.status === 404) {
            return res.json({ isLive: false, viewers: 0 });
        }
        
        console.error(`Error checking ${username}: ${error.message}`);
        // نرجع أوفلاين مؤقتاً عشان ما يعلق الموقع
        return res.json({ isLive: false, viewers: 0, error: true });
    }
});

app.get('/', (req, res) => {
    res.send('Respect API is Running! 🚀');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

