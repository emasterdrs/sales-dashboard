// Node.js 환경에서 CSV 파일 생성
const fs = require('fs');
const path = require('path');

// 팀 구성
const TEAMS = ['FD팀', 'FC팀', 'FR팀', 'FS팀', 'FL팀'];

// 영업사원 30명
const SALESPERSONS = [
    // FD팀 (6명)
    { id: 'SP001', name: '김민수', team: 'FD팀' },
    { id: 'SP002', name: '이영희', team: 'FD팀' },
    { id: 'SP003', name: '박철수', team: 'FD팀' },
    { id: 'SP004', name: '최지은', team: 'FD팀' },
    { id: 'SP005', name: '정대호', team: 'FD팀' },
    { id: 'SP006', name: '강서연', team: 'FD팀' },
    // FC팀 (6명)
    { id: 'SP007', name: '윤성민', team: 'FC팀' },
    { id: 'SP008', name: '임수진', team: 'FC팀' },
    { id: 'SP009', name: '한동욱', team: 'FC팀' },
    { id: 'SP010', name: '오지혜', team: 'FC팀' },
    { id: 'SP011', name: '신재현', team: 'FC팀' },
    { id: 'SP012', name: '배유리', team: 'FC팀' },
    // FR팀 (6명)
    { id: 'SP013', name: '조현우', team: 'FR팀' },
    { id: 'SP014', name: '송미경', team: 'FR팀' },
    { id: 'SP015', name: '권태양', team: 'FR팀' },
    { id: 'SP016', name: '안소희', team: 'FR팀' },
    { id: 'SP017', name: '홍준표', team: 'FR팀' },
    { id: 'SP018', name: '서은아', team: 'FR팀' },
    // FS팀 (6명)
    { id: 'SP019', name: '노승우', team: 'FS팀' },
    { id: 'SP020', name: '문지원', team: 'FS팀' },
    { id: 'SP021', name: '황인호', team: 'FS팀' },
    { id: 'SP022', name: '유하나', team: 'FS팀' },
    { id: 'SP023', name: '장민재', team: 'FS팀' },
    { id: 'SP024', name: '나예린', team: 'FS팀' },
    // FL팀 (6명)
    { id: 'SP025', name: '표정훈', team: 'FL팀' },
    { id: 'SP026', name: '차수빈', team: 'FL팀' },
    { id: 'SP027', name: '구본석', team: 'FL팀' },
    { id: 'SP028', name: '방민지', team: 'FL팀' },
    { id: 'SP029', name: '탁준영', team: 'FL팀' },
    { id: 'SP030', name: '설아영', team: 'FL팀' },
];

// 품목 데이터 (간소화 버전 - 각 유형당 10개씩만)
const PRODUCTS = [
    // 치즈 (10개)
    { code: 'CH001', name: '모짜렐라치즈1kg', type: '치즈', price: 12000 },
    { code: 'CH002', name: '체다치즈500g', type: '치즈', price: 8500 },
    { code: 'CH003', name: '고다치즈1kg', type: '치즈', price: 15000 },
    { code: 'CH004', name: '파마산치즈200g', type: '치즈', price: 9800 },
    { code: 'CH005', name: '크림치즈1kg', type: '치즈', price: 11000 },
    { code: 'CH006', name: '리코타치즈500g', type: '치즈', price: 13500 },
    { code: 'CH007', name: '블루치즈300g', type: '치즈', price: 18000 },
    { code: 'CH008', name: '까망베르치즈250g', type: '치즈', price: 14500 },
    { code: 'CH009', name: '에멘탈치즈1kg', type: '치즈', price: 16500 },
    { code: 'CH010', name: '브리치즈200g', type: '치즈', price: 12800 },
    // 소스 (10개)
    { code: 'SC001', name: '토마토파스타소스1L', type: '소스', price: 5500 },
    { code: 'SC002', name: '크림파스타소스1L', type: '소스', price: 6800 },
    { code: 'SC003', name: '페스토소스500ml', type: '소스', price: 8500 },
    { code: 'SC004', name: '마리나라소스2L', type: '소스', price: 9200 },
    { code: 'SC005', name: '알프레도소스1L', type: '소스', price: 7500 },
    { code: 'SC006', name: '볼로네제소스1.5L', type: '소스', price: 8800 },
    { code: 'SC007', name: '까르보나라소스1L', type: '소스', price: 7200 },
    { code: 'SC008', name: '아라비아따소스1L', type: '소스', price: 6500 },
    { code: 'SC009', name: '바질토마토소스1L', type: '소스', price: 6200 },
    { code: 'SC010', name: '갈릭오일소스500ml', type: '소스', price: 5800 },
    // 피자 (10개)
    { code: 'PZ001', name: '냉동페퍼로니피자12인치', type: '피자', price: 8500 },
    { code: 'PZ002', name: '냉동콤비네이션피자12인치', type: '피자', price: 9200 },
    { code: 'PZ003', name: '냉동치즈피자12인치', type: '피자', price: 7800 },
    { code: 'PZ004', name: '냉동불고기피자12인치', type: '피자', price: 9800 },
    { code: 'PZ005', name: '냉동슈프림피자12인치', type: '피자', price: 10500 },
    { code: 'PZ006', name: '피자도우12인치10개입', type: '피자', price: 15000 },
    { code: 'PZ007', name: '피자도우14인치10개입', type: '피자', price: 18000 },
    { code: 'PZ008', name: '씬크러스트도우12인치', type: '피자', price: 14500 },
    { code: 'PZ009', name: '팬피자도우12인치', type: '피자', price: 16500 },
    { code: 'PZ010', name: '글루텐프리피자도우', type: '피자', price: 19500 },
    // 빵크림 (10개)
    { code: 'BC001', name: '휘핑크림1L', type: '빵크림', price: 8500 },
    { code: 'BC002', name: '생크림1L', type: '빵크림', price: 9200 },
    { code: 'BC003', name: '커스터드크림1kg', type: '빵크림', price: 7800 },
    { code: 'BC004', name: '버터크림1kg', type: '빵크림', price: 8800 },
    { code: 'BC005', name: '초콜릿크림1kg', type: '빵크림', price: 9500 },
    { code: 'BC006', name: '딸기크림1kg', type: '빵크림', price: 8200 },
    { code: 'BC007', name: '바닐라크림1kg', type: '빵크림', price: 7500 },
    { code: 'BC008', name: '녹차크림1kg', type: '빵크림', price: 9800 },
    { code: 'BC009', name: '치즈크림1kg', type: '빵크림', price: 10500 },
    { code: 'BC010', name: '카라멜크림1kg', type: '빵크림', price: 8900 },
    // 이스트 (10개)
    { code: 'YS001', name: '인스턴트드라이이스트500g', type: '이스트', price: 5500 },
    { code: 'YS002', name: '액티브드라이이스트500g', type: '이스트', price: 6200 },
    { code: 'YS003', name: '생이스트1kg', type: '이스트', price: 4800 },
    { code: 'YS004', name: '저당이스트500g', type: '이스트', price: 6800 },
    { code: 'YS005', name: '고당이스트500g', type: '이스트', price: 7200 },
    { code: 'YS006', name: '냉동이스트1kg', type: '이스트', price: 8500 },
    { code: 'YS007', name: '천연이스트500g', type: '이스트', price: 9800 },
    { code: 'YS008', name: '베이킹파우더1kg', type: '이스트', price: 4500 },
    { code: 'YS009', name: '베이킹소다1kg', type: '이스트', price: 3800 },
    { code: 'YS010', name: '이스트푸드500g', type: '이스트', price: 5200 },
    // 대소공장유탕류 (10개)
    { code: 'DF001', name: '크림도넛10개입', type: '대소공장유탕류', price: 12000 },
    { code: 'DF002', name: '슈가도넛10개입', type: '대소공장유탕류', price: 10500 },
    { code: 'DF003', name: '초코도넛10개입', type: '대소공장유탕류', price: 11500 },
    { code: 'DF004', name: '크림빵10개입', type: '대소공장유탕류', price: 13000 },
    { code: 'DF005', name: '소보로빵10개입', type: '대소공장유탕류', price: 11800 },
    { code: 'DF006', name: '단팥빵10개입', type: '대소공장유탕류', price: 12200 },
    { code: 'DF007', name: '카레빵10개입', type: '대소공장유탕류', price: 13500 },
    { code: 'DF008', name: '피자빵10개입', type: '대소공장유탕류', price: 14000 },
    { code: 'DF009', name: '고로케10개입', type: '대소공장유탕류', price: 12800 },
    { code: 'DF010', name: '핫도그빵10개입', type: '대소공장유탕류', price: 13200 },
    // 대소공장밀키트 (10개)
    { code: 'MK001', name: '피자밀키트세트', type: '대소공장밀키트', price: 25000 },
    { code: 'MK002', name: '파스타밀키트세트', type: '대소공장밀키트', price: 18000 },
    { code: 'MK003', name: '리조또밀키트세트', type: '대소공장밀키트', price: 22000 },
    { code: 'MK004', name: '라자냐밀키트세트', type: '대소공장밀키트', price: 28000 },
    { code: 'MK005', name: '까르보나라밀키트', type: '대소공장밀키트', price: 16500 },
    { code: 'MK006', name: '봉골레밀키트', type: '대소공장밀키트', price: 19500 },
    { code: 'MK007', name: '페스토파스타밀키트', type: '대소공장밀키트', price: 21000 },
    { code: 'MK008', name: '해산물파스타밀키트', type: '대소공장밀키트', price: 26000 },
    { code: 'MK009', name: '샐러드밀키트', type: '대소공장밀키트', price: 12000 },
    { code: 'MK010', name: '샌드위치밀키트', type: '대소공장밀키트', price: 13500 },
    // 냉동감자 (10개)
    { code: 'FP001', name: '프렌치프라이2.5kg', type: '냉동감자', price: 8500 },
    { code: 'FP002', name: '웨지감자2kg', type: '냉동감자', price: 9200 },
    { code: 'FP003', name: '해시브라운2kg', type: '냉동감자', price: 10500 },
    { code: 'FP004', name: '감자튀김스트레이트3kg', type: '냉동감자', price: 11000 },
    { code: 'FP005', name: '감자튀김크링클3kg', type: '냉동감자', price: 11500 },
    { code: 'FP006', name: '스위트포테이토프라이2kg', type: '냉동감자', price: 12500 },
    { code: 'FP007', name: '치즈감자볼1.5kg', type: '냉동감자', price: 14500 },
    { code: 'FP008', name: '모짜렐라감자스틱1.5kg', type: '냉동감자', price: 15000 },
    { code: 'FP009', name: '베이컨감자2kg', type: '냉동감자', price: 16500 },
    { code: 'FP010', name: '갈릭감자2kg', type: '냉동감자', price: 11800 },
    // 해외소싱상품류 (10개)
    { code: 'IS001', name: '이탈리아파스타면5kg', type: '해외소싱상품류', price: 18000 },
    { code: 'IS002', name: '스페인올리브유5L', type: '해외소싱상품류', price: 45000 },
    { code: 'IS003', name: '프랑스버터5kg', type: '해외소싱상품류', price: 55000 },
    { code: 'IS004', name: '벨기에초콜릿3kg', type: '해외소싱상품류', price: 68000 },
    { code: 'IS005', name: '독일소시지5kg', type: '해외소싱상품류', price: 42000 },
    { code: 'IS006', name: '스위스치즈3kg', type: '해외소싱상품류', price: 75000 },
    { code: 'IS007', name: '이탈리아토마토통조림6kg', type: '해외소싱상품류', price: 22000 },
    { code: 'IS008', name: '노르웨이연어5kg', type: '해외소싱상품류', price: 95000 },
    { code: 'IS009', name: '프랑스와인12병', type: '해외소싱상품류', price: 240000 },
    { code: 'IS010', name: '브라질커피원두5kg', type: '해외소싱상품류', price: 65000 },
    // 국내소싱상품류 (10개)
    { code: 'DS001', name: '국내산쌀20kg', type: '국내소싱상품류', price: 65000 },
    { code: 'DS002', name: '국내산밀가루20kg', type: '국내소싱상품류', price: 42000 },
    { code: 'DS003', name: '국내산설탕10kg', type: '국내소싱상품류', price: 28000 },
    { code: 'DS004', name: '국내산식용유18L', type: '국내소싱상품류', price: 45000 },
    { code: 'DS005', name: '국내산참기름5L', type: '국내소싱상품류', price: 125000 },
    { code: 'DS006', name: '국내산고추장10kg', type: '국내소싱상품류', price: 85000 },
    { code: 'DS007', name: '국내산된장10kg', type: '국내소싱상품류', price: 75000 },
    { code: 'DS008', name: '국내산간장18L', type: '국내소싱상품류', price: 95000 },
    { code: 'DS009', name: '국내산김치10kg', type: '국내소싱상품류', price: 68000 },
    { code: 'DS010', name: '국내산계란30판', type: '국내소싱상품류', price: 95000 },
];

// 거래처 생성
function generateCustomers() {
    const customers = [];
    const baseNames = [
        '한국식품', '글로벌푸드', '프레시마트', '프리미엄식자재', '동네슈퍼',
        '대형마트', '편의점체인', '레스토랑그룹', '호텔식자재', '카페체인',
        '베이커리', '패밀리레스토랑', '패스트푸드', '뷔페', '이탈리안레스토랑',
        '일식당', '중식당', '한식당', '분식집', '치킨전문점',
        '피자전문점', '햄버거전문점', '샌드위치전문점', '도시락전문점', '급식업체',
        '케이터링', '식품제조', '제과점', '제빵소', '떡집',
        '도매상', '유통센터', '물류센터', '식자재마트', '온라인몰',
        '배달전문점', '포장마차', '푸드트럭', '카페테리아', '구내식당',
        '학교급식', '병원급식', '회사급식', '군부대납품', '관공서납품',
        '요양원', '어린이집', '유치원', '학원', '기숙사',
        '스포츠센터', '골프장', '리조트', '펜션', '모텔'
    ];

    SALESPERSONS.forEach(sp => {
        for (let i = 0; i < 55; i++) {
            const code = `${sp.id}-C${String(i + 1).padStart(3, '0')}`;
            const name = `${baseNames[i % baseNames.length]}${Math.floor(i / baseNames.length) + 1}`;
            customers.push({ code, name, spId: sp.id, spName: sp.name, team: sp.team });
        }
    });

    return customers;
}

const ALL_CUSTOMERS = generateCustomers();

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomElement(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
}

function formatDate(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function generateSalesData(year, month, targetAmount) {
    const sales = [];
    const daysInMonth = new Date(year, month, 0).getDate();

    const avgAmount = 150000;
    const totalTxs = Math.floor(targetAmount / avgAmount);
    const txsPerDay = Math.floor(totalTxs / daysInMonth);

    let currentTotal = 0;
    let txId = 0;

    for (let day = 1; day <= daysInMonth; day++) {
        const dailyTxs = txsPerDay + randomInt(-20, 20);

        for (let t = 0; t < dailyTxs; t++) {
            const sp = randomElement(SALESPERSONS);
            const spCustomers = ALL_CUSTOMERS.filter(c => c.spId === sp.id);
            const customer = randomElement(spCustomers);
            const product = randomElement(PRODUCTS);

            let qty;
            if (product.price >= 100000) qty = randomInt(1, 10);
            else if (product.price >= 50000) qty = randomInt(5, 30);
            else if (product.price >= 10000) qty = randomInt(10, 100);
            else qty = randomInt(50, 300);

            const amount = qty * product.price;
            currentTotal += amount;
            txId++;

            const date = new Date(year, month - 1, day);

            sales.push({
                거래ID: `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}-${String(txId).padStart(6, '0')}`,
                거래일자: formatDate(date),
                영업사원ID: sp.id,
                영업사원명: sp.name,
                팀: sp.team,
                거래처코드: customer.code,
                거래처명: customer.name,
                품목코드: product.code,
                품목명: product.name,
                품목유형명: product.type,
                수량: qty,
                단가: product.price,
                금액: amount
            });

            if (currentTotal >= targetAmount) break;
        }

        if (currentTotal >= targetAmount) break;
    }

    // 마지막 조정
    const diff = targetAmount - currentTotal;
    if (sales.length > 0) {
        sales[sales.length - 1].금액 += diff;
    }

    console.log(`${year}년 ${month}월: ${sales.length}건, ${currentTotal.toLocaleString()}원`);
    return sales;
}

function toCSV(sales) {
    const headers = ['거래ID', '거래일자', '영업사원ID', '영업사원명', '팀', '거래처코드', '거래처명', '품목코드', '품목명', '품목유형명', '수량', '단가', '금액'];
    const rows = [headers.join(',')];

    sales.forEach(s => {
        rows.push([
            s.거래ID, s.거래일자, s.영업사원ID, s.영업사원명, s.팀,
            s.거래처코드, s.거래처명, s.품목코드, s.품목명, s.품목유형명,
            s.수량, s.단가, s.금액
        ].join(','));
    });

    return rows.join('\n');
}

// 데이터 생성 및 저장
console.log('=== 판매 데이터 생성 시작 ===\n');

const sales2025 = generateSalesData(2025, 1, 30000000000);
const sales2026 = generateSalesData(2026, 1, 40000000000);

const csv2025 = toCSV(sales2025);
const csv2026 = toCSV(sales2026);

const outputDir = path.join(__dirname, '..', '..', 'public');
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(path.join(outputDir, '판매데이터_2025년01월.csv'), '\uFEFF' + csv2025, 'utf8');
fs.writeFileSync(path.join(outputDir, '판매데이터_2026년01월.csv'), '\uFEFF' + csv2026, 'utf8');

console.log('\n=== 파일 생성 완료 ===');
console.log('📁 public/판매데이터_2025년01월.csv');
console.log('📁 public/판매데이터_2026년01월.csv');
