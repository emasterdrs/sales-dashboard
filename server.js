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

  CREATE TABLE IF NOT EXISTS sales_actual (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_month TEXT,
    team TEXT,
    sp_name TEXT,
    cust_code TEXT,
    cust_name TEXT,
    item_type TEXT,
    item_code TEXT,
    item_name TEXT,
    amount REAL,
    weight REAL
  );

  CREATE TABLE IF NOT EXISTS sales_target (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    year_month TEXT,
    team TEXT,
    sp_name TEXT,
    cust_code TEXT,
    cust_name TEXT,
    item_type TEXT,
    amount REAL
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

// 8. 매출 데이터 동기화 (업로드 시 호출)
app.post('/api/sales/sync', (req, res) => {
    const { months, data } = req.body; // data is array of sales rows, months is array of YYYYMM update target
    try {
        const deleteStmt = db.prepare('DELETE FROM sales_actual WHERE year_month = ?');
        const insertStmt = db.prepare(`
            INSERT INTO sales_actual (year_month, team, sp_name, cust_code, cust_name, item_type, item_code, item_name, amount, weight)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((rows, monthList) => {
            for (const m of monthList) {
                deleteStmt.run(m);
            }
            for (const row of rows) {
                insertStmt.run(
                    String(row['년도월']),
                    row['영업팀'],
                    row['영업사원명'],
                    row['거래처코드'],
                    row['거래처명'],
                    row['품목유형'],
                    row['품목코드'],
                    row['품목명'],
                    Number(row['매출금액']),
                    Number(row['중량(KG)'])
                );
            }
        });

        transaction(data, months);
        res.json({ success: true, count: data.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '실적 동기화 실패' });
    }
});

// 9. 목표 데이터 동기화 (업로드 시 호출)
app.post('/api/target/sync', (req, res) => {
    const { months, data } = req.body;
    try {
        const deleteStmt = db.prepare('DELETE FROM sales_target WHERE year_month = ?');
        const insertStmt = db.prepare(`
            INSERT INTO sales_target (year_month, team, sp_name, cust_code, cust_name, item_type, amount)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        const transaction = db.transaction((rows, monthList) => {
            for (const m of monthList) {
                deleteStmt.run(m);
            }
            for (const row of rows) {
                insertStmt.run(
                    String(row['년도월']),
                    row['영업팀'],
                    row['영업사원명'],
                    row['거래처코드'],
                    row['거래처명'],
                    row['품목유형'],
                    Number(row['목표금액'])
                );
            }
        });

        transaction(data, months);
        res.json({ success: true, count: data.length });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '목표 동기화 실패' });
    }
});

// 10. 마스터 데이터 전체 조회
app.get('/api/master-data', (req, res) => {
    try {
        const actualRows = db.prepare('SELECT * FROM sales_actual').all();
        const targetRows = db.prepare('SELECT * FROM sales_target').all();

        // 필드맵핑 (DB 필드 -> 클라이언트 객체 키)
        const mappedActual = actualRows.map(r => ({
            '년도월': r.year_month,
            '영업팀': r.team,
            '영업사원명': r.sp_name,
            '거래처코드': r.cust_code,
            '거래처명': r.cust_name,
            '품목유형': r.item_type,
            '품목코드': r.item_code,
            '품목명': r.item_name,
            '매출금액': r.amount,
            '중량(KG)': r.weight
        }));

        const mappedTarget = targetRows.map(r => ({
            '년도월': r.year_month,
            '영업팀': r.team,
            '영업사원명': r.sp_name,
            '거래처코드': r.cust_code,
            '거래처명': r.cust_name,
            '품목유형': r.item_type,
            '목표금액': r.amount
        }));

        // 설정값도 함께 로드
        const settingRows = db.prepare('SELECT * FROM settings').all();
        const dbSettings = {};
        settingRows.forEach(row => {
            try { dbSettings[row.key] = JSON.parse(row.value); } catch (e) { dbSettings[row.key] = row.value; }
        });

        res.json({
            actual: mappedActual,
            target: mappedTarget,
            settings: dbSettings,
            lastSync: new Date().toISOString()
        });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '마스터 데이터 조회 실패' });
    }
});

// 11. 데이터 초기화
app.post('/api/master-data/reset', (req, res) => {
    try {
        db.prepare('DELETE FROM sales_actual').run();
        db.prepare('DELETE FROM sales_target').run();
        res.json({ success: true });
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: '초기화 실패' });
    }
});

// 서버 상태 확인용 루트 경로
app.get('/', (req, res) => {
    res.send('Dashboard API Server is Running');
});

const PORT = 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
    console.log(`\x1b[32m%s\x1b[0m`, `🚀 로컬 DB 서버 (SQLite) 가 가동되었습니다!`);
    console.log(`📡 서버 주소: http://localhost:${PORT}`);
    console.log(`📂 데이터 파일: ${path.join(__dirname, 'dashboard.db')}`);
    console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
});
