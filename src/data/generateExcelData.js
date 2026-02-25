// 실제 엑셀 데이터 생성 스크립트
// CSV 형식으로 실제 판매 데이터를 생성합니다

const SALESPERSONS = [
    { id: 'SP001', name: '김영업', team: '1팀' },
    { id: 'SP002', name: '이매출', team: '1팀' },
    { id: 'SP003', name: '박성과', team: '2팀' },
    { id: 'SP004', name: '최실적', team: '2팀' },
    { id: 'SP005', name: '정목표', team: '3팀' },
];

const CUSTOMERS = [
    { id: 'C001', name: '(주)한국유통', paymentTerms: 30 },
    { id: 'C002', name: '글로벌마트', paymentTerms: 45 },
    { id: 'C003', name: '신선식품', paymentTerms: 30 },
    { id: 'C004', name: '프리미엄스토어', paymentTerms: 60 },
    { id: 'C005', name: '동네슈퍼체인', paymentTerms: 30 },
    { id: 'C006', name: '온라인몰A', paymentTerms: 15 },
    { id: 'C007', name: '대형할인점', paymentTerms: 45 },
];

const ITEMS = [
    { id: 'I001', name: '프리미엄 생수', grade: 'A', unitPrice: 1200 },
    { id: 'I002', name: '유기농 우유', grade: 'A', unitPrice: 3500 },
    { id: 'I003', name: '천연 주스', grade: 'B', unitPrice: 2800 },
    { id: 'I004', name: '탄산음료', grade: 'C', unitPrice: 1500 },
    { id: 'I005', name: '에너지드링크', grade: 'B', unitPrice: 2200 },
    { id: 'I006', name: '전통 막걸리', grade: 'A', unitPrice: 4500 },
    { id: 'I007', name: '수입 와인', grade: 'S', unitPrice: 25000 },
];

const CHANNELS = ['직영', '대리점', '온라인', '도매'];

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

// CSV 데이터 생성
export function generateSalesCSV(year = 2026, month = 2) {
    const csvRows = [];

    // CSV 헤더
    csvRows.push([
        '거래ID',
        '거래일자',
        '영업사원ID',
        '영업사원명',
        '팀',
        '거래처ID',
        '거래처명',
        '품목ID',
        '품목명',
        '등급',
        '판매경로',
        '수량',
        '단가',
        '금액'
    ].join(','));

    const daysInMonth = new Date(year, month, 0).getDate();
    const currentDay = new Date().getDate();
    const maxDay = month === new Date().getMonth() + 1 ? Math.min(currentDay, daysInMonth) : daysInMonth;

    for (let day = 1; day <= maxDay; day++) {
        const transactionsPerDay = randomInt(10, 30);

        for (let t = 0; t < transactionsPerDay; t++) {
            const salesperson = randomElement(SALESPERSONS);
            const customer = randomElement(CUSTOMERS);
            const item = randomElement(ITEMS);
            const channel = randomElement(CHANNELS);
            const quantity = randomInt(10, 500);
            const amount = quantity * item.unitPrice;

            const date = new Date(year, month - 1, day);
            const transactionId = `${year}${String(month).padStart(2, '0')}${String(day).padStart(2, '0')}-${String(t).padStart(4, '0')}`;

            csvRows.push([
                transactionId,
                formatDate(date),
                salesperson.id,
                salesperson.name,
                salesperson.team,
                customer.id,
                customer.name,
                item.id,
                item.name,
                item.grade,
                channel,
                quantity,
                item.unitPrice,
                amount
            ].join(','));
        }
    }

    return csvRows.join('\n');
}

// 채권 데이터 CSV 생성
export function generateReceivablesCSV() {
    const csvRows = [];

    csvRows.push([
        '청구서ID',
        '거래처ID',
        '거래처명',
        '청구일자',
        '만기일',
        '결제조건(일)',
        '금액',
        '결제완료',
        '결제일자',
        '연체여부',
        '연체일수'
    ].join(','));

    const today = new Date();

    CUSTOMERS.forEach(customer => {
        const invoiceCount = randomInt(2, 5);

        for (let i = 0; i < invoiceCount; i++) {
            const invoiceDate = new Date(today);
            invoiceDate.setDate(today.getDate() - randomInt(10, 90));

            const dueDate = new Date(invoiceDate);
            dueDate.setDate(invoiceDate.getDate() + customer.paymentTerms);

            const amount = randomInt(500000, 5000000);
            const isPaid = Math.random() > 0.3;
            const isOverdue = !isPaid && dueDate < today;
            const daysOverdue = isOverdue ? Math.floor((today - dueDate) / 86400000) : 0;

            const paidDate = isPaid ? new Date(dueDate.getTime() - randomInt(0, 5) * 86400000) : null;

            csvRows.push([
                `INV-${customer.id}-${i}`,
                customer.id,
                customer.name,
                formatDate(invoiceDate),
                formatDate(dueDate),
                customer.paymentTerms,
                amount,
                isPaid ? 'Y' : 'N',
                paidDate ? formatDate(paidDate) : '',
                isOverdue ? 'Y' : 'N',
                daysOverdue
            ].join(','));
        }
    });

    return csvRows.join('\n');
}

// 브라우저에서 CSV 다운로드
export function downloadCSV(csvContent, filename) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
