
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const PUBLIC_DIR = './public';
const OUTPUT_FILE = './src/data/actual_data.json';

// Helper: Read Excel or CSV and return as JSON array
function readDataToJSON(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.xlsx' || ext === '.xls') {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0]; // Use first sheet
            const worksheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(worksheet);
        } else if (ext === '.csv') {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            if (lines.length === 0) return [];

            const cleanHeader = lines[0].replace(/^\uFEFF/, '');
            const headers = cleanHeader.split(',').map(h => h.trim());
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
        }
        return [];
    } catch (e) {
        console.error(`Error reading ${filePath}:`, e);
        return [];
    }
}

function sync() {
    console.log('Syncing Professional Excel/CSV files to Dashboard JSON...');

    if (!fs.existsSync(PUBLIC_DIR)) {
        console.error('Public directory not found.');
        return;
    }

    const files = fs.readdirSync(PUBLIC_DIR);
    const salesFiles = files.filter(f =>
        (f.startsWith('판매데이터') || f.startsWith('Sales')) &&
        (f.endsWith('.csv') || f.endsWith('.xlsx') || f.endsWith('.xls'))
    );
    const bondFiles = files.filter(f =>
        (f.startsWith('채권데이터') || f.startsWith('Bond')) &&
        (f.endsWith('.csv') || f.endsWith('.xlsx') || f.endsWith('.xls'))
    );

    console.log(`Found ${salesFiles.length} sales files: ${salesFiles.join(', ')}`);
    console.log(`Found ${bondFiles.length} bond files: ${bondFiles.join(', ')}`);

    let allActual = [];
    salesFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const data = readDataToJSON(filePath);

        const mapped = data.map(r => {
            // Team name normalization
            let rawTeam = String(r['영업팀'] || r['팀'] || '기타');
            let teamName = rawTeam;
            if (rawTeam.match(/^\d/)) {
                teamName = `영업${rawTeam}`;
            } else if (!rawTeam.includes('영업') && rawTeam !== '기타') {
                teamName = `영업${rawTeam}`;
            }

            // YearMonth parsing
            let ym = String(r['년도월'] || '').replace(/-/g, '').substring(0, 6);
            if (!ym && r['거래일자']) {
                ym = String(r['거래일자']).replace(/-/g, '').substring(0, 6);
            }

            return {
                '년도월': ym,
                '영업팀': teamName,
                '영업사원명': r['영업사원'] || r['영업사원명'] || '기타',
                '거래처코드': r['거래처코드'] || r['거래처ID'] || '',
                '거래처명': r['거래처명'] || r['CustomerName'] || '',
                '품목유형': r['유형명'] || r['품목유형'] || '기타',
                '품목코드': r['품목코드'] || r['품목ID'] || '',
                '품목명': r['품목명'] || '',
                '매출금액': parseFloat(r['매출액'] || r['금액'] || r['Amount']) || 0,
                '중량(KG)': parseFloat(r['중량(kg)'] || r['중량(KG)'] || r['수량'] || r['Quantity']) || 0
            };
        });
        allActual = allActual.concat(mapped);
    });

    let allBonds = [];
    bondFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const data = readDataToJSON(filePath);

        const mapped = data.map(r => {
            return {
                '청구서ID': r['청구서ID'] || '',
                '거래처ID': r['거래처ID'] || '',
                '거래처명': r['거래처명'] || '',
                '청구일자': r['청구일자'] || '',
                '만기일': r['만기일'] || '',
                '금액': parseFloat(r['금액']) || 0,
                '결제완료': r['결제완료'] || 'N',
                '연체여부': r['연체여부'] || 'N',
                '연체일수': parseInt(r['연체일수']) || 0
            };
        });
        allBonds = allBonds.concat(mapped);
    });

    const result = {
        actual: allActual,
        bonds: allBonds,
        lastSync: new Date().toISOString()
    };

    if (!fs.existsSync('./src/data')) {
        fs.mkdirSync('./src/data', { recursive: true });
    }

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(result, null, 2));
    console.log(`Successfully synced ${allActual.length} sales rows and ${allBonds.length} bond rows to ${OUTPUT_FILE}`);

}

sync();
