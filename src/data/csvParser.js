// CSV 파일 파싱 유틸리티

export function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const headers = lines[0].split(',');

    const data = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        const row = {};

        headers.forEach((header, index) => {
            row[header] = values[index];
        });

        data.push(row);
    }

    return data;
}

export function parseSalesCSV(csvText) {
    const rows = parseCSV(csvText);

    return rows.map(row => ({
        id: row['거래ID'],
        date: new Date(row['거래일자']),
        salespersonId: row['영업사원ID'],
        salespersonName: row['영업사원명'],
        team: row['팀'],
        customerId: row['거래처ID'],
        customerName: row['거래처명'],
        itemId: row['품목ID'],
        itemName: row['품목명'],
        itemGrade: row['등급'],
        channel: row['판매경로'],
        quantity: parseInt(row['수량']),
        unitPrice: parseInt(row['단가']),
        amount: parseInt(row['금액']),
    }));
}

export function parseReceivablesCSV(csvText) {
    const rows = parseCSV(csvText);

    return rows.map(row => ({
        id: row['청구서ID'],
        customerId: row['거래처ID'],
        customerName: row['거래처명'],
        invoiceDate: new Date(row['청구일자']),
        dueDate: new Date(row['만기일']),
        paymentTerms: parseInt(row['결제조건(일)']),
        amount: parseInt(row['금액']),
        isPaid: row['결제완료'] === 'Y',
        paidDate: row['결제일자'] ? new Date(row['결제일자']) : null,
        isOverdue: row['연체여부'] === 'Y',
        daysOverdue: parseInt(row['연체일수']),
    }));
}

export async function loadCSVFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
            resolve(e.target.result);
        };

        reader.onerror = (e) => {
            reject(e);
        };

        reader.readAsText(file, 'UTF-8');
    });
}
