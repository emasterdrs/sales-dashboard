
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = './public';

function fixEncodingForExcel(filePath) {
    try {
        const content = fs.readFileSync(filePath);
        // UTF-8 BOM: 0xEF, 0xBB, 0xBF
        const BOM = Buffer.from([0xEF, 0xBB, 0xBF]);

        // 이미 BOM이 있는지 확인
        if (content[0] === 0xEF && content[1] === 0xBB && content[2] === 0xBF) {
            console.log(`${filePath} already has BOM.`);
            return;
        }

        const newContent = Buffer.concat([BOM, content]);
        fs.writeFileSync(filePath, newContent);
        console.log(`Fixed encoding for: ${filePath}`);
    } catch (e) {
        console.error(`Failed to fix ${filePath}:`, e);
    }
}

const files = fs.readdirSync(PUBLIC_DIR);
const csvFiles = files.filter(f => f.endsWith('.csv'));

csvFiles.forEach(file => {
    fixEncodingForExcel(path.join(PUBLIC_DIR, file));
});
