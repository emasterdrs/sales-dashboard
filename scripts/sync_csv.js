
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = './public';
const OUTPUT_FILE = './src/data/actual_data.json';

function parseCSV(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const lines = content.split('\n').filter(l => l.trim());
        if (lines.length === 0) return [];

        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim());
            const obj = {};
            headers.forEach((h, idx) => {
                obj[h] = values[idx];
            });
            data.push(obj);
        }
        return data;
    } catch (e) {
        console.error(`Error parsing ${filePath}:`, e);
        return [];
    }
}

function sync() {
    console.log('Syncing CSV files to JSON...');

    // Find all sales data CSVs
    const files = fs.readdirSync(PUBLIC_DIR);
    const salesFiles = files.filter(f => f.startsWith('판매데이터') && f.endsWith('.csv'));

    let allActual = [];
    salesFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const data = parseCSV(filePath);

        // Map to standard format
        const mapped = data.map(r => ({
            '년도월': r['거래일자'] ? r['거래일자'].replace(/-/g, '').substring(0, 6) : '',
            '영업팀': r['팀'] ? (r['팀'].includes('팀') ? r['팀'] : `영업${r['팀'].replace('팀', '')}팀`) : '기타',
            '영업사원명': r['영업사원명'] || '기타',
            '거래처코드': r['거래처ID'] || '',
            '거래처명': r['거래처명'] || '',
            '품목유형': '기타', // CSV에 유형이 없으므로 기본값
            '품목코드': r['품목ID'] || '',
            '품목명': r['품목명'] || '',
            '매출금액': parseFloat(r['금액']) || 0,
            '중량(KG)': parseFloat(r['수량']) || 0 // 수량을 중량으로 가정한 예시
        }));
        allActual = allActual.concat(mapped);
    });

    // Handle accounts receivable (채권) if needed by adding to JSON
    const bondFile = files.find(f => f.includes('채권') && f.endsWith('.csv'));
    let bonds = [];
    if (bondFile) {
        bonds = parseCSV(path.join(PUBLIC_DIR, bondFile));
    }

    const result = {
        actual: allActual,
        bonds: bonds,
        lastSync: new Date().toISOString()
    };

    if (!fs.existsSync('./src/data')) {
        fs.mkdirSync('./src/data', { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`Successfully synced ${allActual.length} sales rows to ${OUTPUT_FILE}`);
}

sync();
