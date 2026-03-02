import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));

const DATA_FILE = path.resolve('server-data.json');

// 기본 데이터 스키마
const getInitialData = () => ({
    holidayNames_2026: {},
    toggledDays_2026: {},
    holidayNames_2025: {},
    toggledDays_2025: {}
});

app.get('/api/settings', (req, res) => {
    try {
        if (!fs.existsSync(DATA_FILE)) {
            return res.json(getInitialData());
        }
        const data = fs.readFileSync(DATA_FILE, 'utf-8');
        res.json(JSON.parse(data));
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

app.post('/api/settings', (req, res) => {
    try {
        let data = getInitialData();
        if (fs.existsSync(DATA_FILE)) {
            data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
        }

        // req.body has key and value from frontend
        // e.g., { key: 'holidayNames_2026', value: { ... } }
        const { key, value } = req.body;
        if (key) {
            data[key] = value;
            fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
            res.json({ success: true, message: 'Saved successfully' });
        } else {
            res.status(400).json({ error: 'Invalid payload' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// 간단한 관리자 로그인 검증 기능
app.post('/api/login', (req, res) => {
    const { id, password } = req.body;
    // 관리자 아이디 "admin", 비밀번호 "admin1234" (예시)
    if (id === 'admin' && password === 'admin1234') {
        res.json({ success: true, token: 'fake-admin-token' });
    } else {
        res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 올바르지 않습니다.' });
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Backend Server API is running on http://0.0.0.0:${PORT}`);
    console.log(`Data will be stored in ${DATA_FILE}`);
});
