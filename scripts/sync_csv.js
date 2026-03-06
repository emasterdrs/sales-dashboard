
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';

const PUBLIC_DIR = './public';
const OUTPUT_FILE = './src/data/actual_data.json';

// Helper: Excel 또는 CSV 읽어서 JSON 배열로 반환
function readDataToJSON(filePath) {
    try {
        const ext = path.extname(filePath).toLowerCase();

        if (ext === '.xlsx' || ext === '.xls') {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0]; // 첫 번째 시트 사용
            const worksheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(worksheet);
        } else if (ext === '.csv') {
            const content = fs.readFileSync(filePath, 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            if (lines.length === 0) return [];

            // BOM 제거 (있는 경우)
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
    console.log('Syncing Yearly Excel/CSV files to Dashboard JSON...');

    if (!fs.existsSync(PUBLIC_DIR)) {
        console.error('Public directory not found.');
        return;
    }

    const files = fs.readdirSync(PUBLIC_DIR);
    // 판매데이터_ 로 시작하는 csv, xlsx, xls 파일 모두 찾기
    const salesFiles = files.filter(f =>
        (f.startsWith('판매데이터') || f.startsWith('Sales')) &&
        (f.endsWith('.csv') || f.endsWith('.xlsx') || f.endsWith('.xls'))
    );

    console.log(`Found ${salesFiles.length} data files: ${salesFiles.join(', ')}`);

    let allActual = [];
    salesFiles.forEach(file => {
        const filePath = path.join(PUBLIC_DIR, file);
        const data = readDataToJSON(filePath);

        const mapped = data.map(r => {
            let rawTeam = String(r['팀'] || r['Team'] || '기타');
            let teamName = rawTeam;
            if (rawTeam.match(/^\d/)) {
                teamName = `영업${rawTeam}`;
            } else if (!rawTeam.includes('영업') && rawTeam !== '기타') {
                teamName = `영업${rawTeam}`;
            }

            const dateVal = r['거래일자'] || r['Date'] || '';
            const ym = String(dateVal).replace(/-/g, '').substring(0, 6);

            return {
                '년도월': ym,
                '영업팀': teamName,
                '영업사원명': r['영업사원명'] || r['Salesperson'] || '기타',
                '거래처코드': r['거래처ID'] || r['CustomerID'] || '',
                '거래처명': r['거래처명'] || r['CustomerName'] || '',
                '품목유형': r['품목유형'] || r['Type'] || '기타',
                '품목코드': r['품목ID'] || r['ItemID'] || '',
                '품목명': r['품목명'] || r['ItemName'] || '',
                '매출금액': parseFloat(r['금액'] || r['Amount']) || 0,
                '중량(KG)': parseFloat(r['수량'] || r['Quantity']) || 0
            };
        });
        allActual = allActual.concat(mapped);
    });

    // 채권 데이터 처리 (Excel/CSV 공용)
    const bondFile = files.find(f => (f.includes('채권') || f.includes('Receivable')) && (f.endsWith('.csv') || f.endsWith('.xlsx')));
    let bonds = [];
    if (bondFile) {
        bonds = readDataToJSON(path.join(PUBLIC_DIR, bondFile));
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
    console.log(`Successfully synced ${allActual.length} rows to ${OUTPUT_FILE}`);
}

sync();
