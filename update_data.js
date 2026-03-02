const fs = require('fs');
let s = fs.readFileSync('src/data/foodDistributionData.js', 'utf8');

// Replace TEAMS
s = s.replace(/export const TEAMS = \[.*?\];/s, `export const TEAMS = ['영업1팀', '영업2팀', '영업3팀', '영업4팀', '영업5팀'];`);

// Generate SALESPERSONS
let spStr = 'export const SALESPERSONS = [\n';
let count = 1;
for (let t = 1; t <= 5; t++) {
    for (let i = 1; i <= 6; i++) {
        spStr += `    { id: 'SP${String(count).padStart(3, '0')}', name: '새 사원${count}', team: '영업${t}팀' },\n`;
        count++;
    }
}
spStr += '];';
s = s.replace(/export const SALESPERSONS = \[.*?\];/s, spStr);

// Generate PRODUCT_TYPES
let ptStr = 'export const PRODUCT_TYPES = {\n';
for (let i = 1; i <= 6; i++) {
    ptStr += `    '새 유형${i}': [\n`;
    for (let p = 1; p <= 5; p++) {
        ptStr += `        { code: 'T${i}P${String(p).padStart(2, '0')}', name: '유형${i} 상품${p}', unitPrice: ${1000 * p} },\n`;
    }
    ptStr += '    ],\n';
}
ptStr += '};\n';

s = s.replace(/export const PRODUCT_TYPES = \{.*?\n\};\n/s, ptStr);

fs.writeFileSync('src/data/foodDistributionData.js', s);
console.log('done');
