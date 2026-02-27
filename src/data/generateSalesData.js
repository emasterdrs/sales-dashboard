/**
 * [프로젝트 30억] 표준 데이터 생성 엔진
 * 기획안의 [매출업로드 표준 항목] 및 [목표업로드 표준 항목] 기반
 */
import { SALESPERSONS, ALL_CUSTOMERS, ALL_PRODUCTS } from './foodDistributionData.js';

// 1. 유틸리티 함수
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * 매출 데이터 생성 (표준 헤더 반영)
 * 헤더: 년도월, 영업팀, 영업사원명, 거래처코드, 거래처명, 품목코드, 품목명, 매출금액, 중량(KG)
 */
export function generateStandardSalesData(year, month, targetAmount) {
    const data = [];
    let currentAmount = 0;
    const yearMonth = `${year}${(month).toString().padStart(2, '0')}`;

    // 영업일수 계산 (임시로 평일 기준)
    const daysInMonth = new Date(year, month, 0).getDate();

    // 데이터 생성 루프
    while (currentAmount < targetAmount) {
        const sp = randomElement(SALESPERSONS);
        const customersOfSp = ALL_CUSTOMERS.filter(c => c.salespersonId === sp.id);
        const customer = randomElement(customersOfSp);
        const product = randomElement(ALL_PRODUCTS);

        const quantity = randomInt(10, 100);
        const amount = quantity * product.unitPrice;
        const weight = (quantity * (0.5 + Math.random() * 2)).toFixed(2); // 랜덤 중량 생성

        data.push({
            '년도월': yearMonth,
            '영업팀': sp.team,
            '영업사원명': sp.name,
            '거래처코드': customer.code,
            '거래처명': customer.name,
            '품목코드': product.code,
            '품목명': product.name,
            '매출금액': amount,
            '중량(KG)': parseFloat(weight)
        });

        currentAmount += amount;

        // 너무 많이 생성되는 것 방지
        if (data.length > 5000) break;
    }

    return data;
}

/**
 * 목표 데이터 생성 (표준 헤더 반영)
 * 헤더: 년도월, 영업팀, 영업사원명, 거래처코드, 거래처명, 목표금액
 */
export function generateTargetData(year, month, totalTarget) {
    const data = [];
    const yearMonth = `${year}${(month).toString().padStart(2, '0')}`;
    const spCount = SALESPERSONS.length;
    const avgTargetPerSp = totalTarget / spCount;

    SALESPERSONS.forEach(sp => {
        const customersOfSp = ALL_CUSTOMERS.filter(c => c.salespersonId === sp.id);
        const spTarget = avgTargetPerSp * (0.8 + Math.random() * 0.4); // 사원별 목표 편차

        const targetPerCustomer = spTarget / customersOfSp.length;

        customersOfSp.forEach(customer => {
            data.push({
                '년도월': yearMonth,
                '영업팀': sp.team,
                '영업사원명': sp.name,
                '거래처코드': customer.code,
                '거래처명': customer.name,
                '목표금액': Math.round(targetPerCustomer)
            });
        });
    });

    return data;
}

/**
 * 전 기간 데이터셋 생성 (2025-01 ~ 2026-02)
 * 2025년 월평균 실적: 약 300억 준
 * 2026년 월평균 목표/실적: 약 400억 수준
 */
export function generateFullDataset() {
    const months = [
        { year: 2025, range: [1, 12], avg: 31000000000 },
        { year: 2026, range: [1, 2], avg: 42000000000 }
    ];

    const fullActual = [];
    const fullTarget = [];

    months.forEach(period => {
        for (let m = period.range[0]; m <= period.range[1]; m++) {
            // 실제 실적은 평균에서 ±15% 변동 부여
            const monthlyActual = period.avg * (0.85 + Math.random() * 0.3);
            // 목표는 평균에서 ±5% 변동 부여
            const monthlyTarget = period.avg * (0.95 + Math.random() * 0.1);

            fullActual.push(...generateStandardSalesData(period.year, m, monthlyActual));
            fullTarget.push(...generateTargetData(period.year, m, monthlyTarget));
        }
    });

    return { actual: fullActual, target: fullTarget };
}

/**
 * CSV 변환 함수
 */
export function convertToCSV(data) {
    if (data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(header => row[header]).join(',')
    );
    return [headers.join(','), ...rows].join('\n');
}

/**
 * 브라우저 다운로드
 */
export function downloadCSV(csvContent, filename) {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
