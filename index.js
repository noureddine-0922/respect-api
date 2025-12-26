const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

// قائمة متصفحات وهمية (User Agents) لتجنب كشف البوت
const userAgents = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
];

// دالة مساعدة لجلب البيانات برؤوس مزيفة
async function fetchKickData(url) {
    const randomAgent = userAgents[Math.floor(Math.random() * userAgents.length)];
    try {
        const response = await axios.get(url, {
            headers: {
                'User-Agent': randomAgent,
                'Accept': 'application/json',
                'Accept-Language': 'en-US,en;q=0.9',
                'Referer': 'https://kick.com/',
                'Origin': 'https://kick.com'
            },
            timeout: 5000
        });
        return response.data;
    } catch (error) {
        return null;
    }
}

app.get('/check/:username', async (req, res) => {
    const { username } = req.params;
    
    // --- الحيلة الأولى: البحث (Search API) ---
    // هذه الواجهة نادراً ما يتم حظرها لأنها أساسية للموقع
    const searchUrl = `https://kick.com/api/search/channel?q=${username}`;
    const searchData = await fetchKickData(searchUrl);

    if (searchData && Array.isArray(searchData)) {
        // البحث يرجع مصفوفة، لازم نلاقي اليوزر الصح
        const target = searchData.find(u => u.slug.toLowerCase() === username.toLowerCase());
        
        if (target && target.livestream && target.livestream.is_live) {
            console.log(`[Search API] ${username} is LIVE`);
            return res.json({ isLive: true, viewers: target.livestream.viewer_count });
        } else if (target) {
            // وجدنا اليوزر لكنه أوفلاين
            return res.json({ isLive: false, viewers: 0 });
        }
    }

    // --- الحيلة الثانية: API V1 (احتياطية) ---
    // إذا فشل البحث، نجرب الرابط القديم
    const v1Url = `https://kick.com/api/v1/channels/${username}`;
    const v1Data = await fetchKickData(v1Url);

    if (v1Data && v1Data.livestream && v1Data.livestream.is_live) {
        console.log(`[V1 API] ${username} is LIVE`);
        return res.json({ isLive: true, viewers: v1Data.livestream.viewer_count });
    }

    // إذا فشل الكل، نعتبره أوفلاين
    return res.json({ isLive: false, viewers: 0 });
});

app.get('/', (req, res) => {
    res.send('Respect API (Lightweight) is Running! ⚡');
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

