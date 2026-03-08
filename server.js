import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '100mb' }));

const db = new Database('dashboard.db');

// DB 초기화 (테이블 생성)
db.exec(`
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );

  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    pw TEXT,
    name TEXT,
    permissions TEXT
  );

  CREATE TABLE IF NOT EXISTS logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    user_name TEXT,
    event TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    ip TEXT
  );
`);

// 기본 관리자 생성 (없는 경우)
const insertUser = db.prepare('INSERT OR IGNORE INTO users (id, pw, name, permissions) VALUES (?, ?, ?, ?)');
insertUser.run('admin', '123123', '관리자', JSON.stringify(['dashboard_team', 'dashboard_type', 'settings']));

// --- API Endpoints ---

// 1. 설정 가져오기
app.get('/api/settings', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM settings').all();
        const settings = {};
        rows.forEach(row => {
            try {
                settings[row.key] = JSON.parse(row.value);
            } catch (e) {
                settings[row.key] = row.value;
            }
        });
        res.json(settings);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: 'DB 조회 실패' });
    }
});

// 2. 설정 저장
app.post('/api/settings', (req, res) => {
    const { key, value } = req.body;
    if (!key) return res.status(400).json({ error: 'Key가 필요합니다.' });

    try {
        const insert = db.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)');
        insert.run(key, JSON.stringify(value));
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '저장 실패' });
    }
});

// 3. 접속 로그 기록
app.post('/api/logs', (req, res) => {
    const { user_id, user_name, event } = req.body;
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    try {
        const insert = db.prepare('INSERT INTO logs (user_id, user_name, event, ip) VALUES (?, ?, ?, ?)');
        insert.run(user_id, user_name, event, ip);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '로그 기록 실패' });
    }
});

// 4. 접속 로그 조회
app.get('/api/logs', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM logs ORDER BY timestamp DESC LIMIT 500').all();
        res.json(rows);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '로그 조회 실패' });
    }
});

// 5. 로그인 검증 (DB 기반)
app.post('/api/login', (req, res) => {
    const { id, password } = req.body;
    try {
        const user = db.prepare('SELECT * FROM users WHERE id = ? AND pw = ?').get(id, password);
        if (user) {
            const permissions = JSON.parse(user.permissions);
            res.json({ success: true, user: { id: user.id, name: user.name, permissions } });
        } else {
            res.status(401).json({ success: false, message: '아이디 또는 비밀번호가 틀렸습니다.' });
        }
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '로그인 도중 오류 발생' });
    }
});

// 6. 사용자 전체 동기화 (불러오기)
app.get('/api/users', (req, res) => {
    try {
        const rows = db.prepare('SELECT * FROM users').all();
        const users = rows.map(row => ({
            ...row,
            permissions: JSON.parse(row.permissions)
        }));
        res.json(users);
    } catch (e) {
        res.status(500).json({ error: '사용자 조회 실패' });
    }
});

// 7. 사용자 전체 동기화 (저장)
app.post('/api/users/sync', (req, res) => {
    const users = req.body; // Array of users
    try {
        const deleteStmt = db.prepare('DELETE FROM users');
        const insertStmt = db.prepare('INSERT INTO users (id, pw, name, permissions) VALUES (?, ?, ?, ?)');

        const transaction = db.transaction((userList) => {
            deleteStmt.run();
            for (const user of userList) {
                insertStmt.run(user.id, user.pw, user.name, JSON.stringify(user.permissions));
            }
        });

        transaction(users);
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '사용자 동기화 실패' });
    }
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
    console.log(`\x1b[32m%s\x1b[0m`, `🚀 로컬 DB 서버 (SQLite) 가 가동되었습니다!`);
    console.log(`📡 서버 주소: http://localhost:${PORT}`);
    console.log(`📂 데이터 파일: ${path.join(__dirname, 'dashboard.db')}`);
    console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
});
