/**
 * [프로젝트 30억] 표준 데이터 생성 엔진
 * 기획안의 [매출업로드 표준 항목] 및 [목표업로드 표준 항목] 기반
 */
import { SALESPERSONS, ALL_CUSTOMERS, ALL_PRODUCTS, PRODUCT_TYPES } from './foodDistributionData.js';

// 1. 유틸리티 함수
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * 매출 데이터 생성 (팀별 가중치 반영)
 */
export function generateStandardSalesData(year, month, targetAmount, teamWeights) {
    const data = [];
    const yearMonth = `${year}${(month).toString().padStart(2, '0')}`;

    // 각 팀별로 배분된 금액에 따라 데이터 생성
    Object.entries(teamWeights).forEach(([team, weight]) => {
        const teamTargetAmount = targetAmount * weight;
        let teamCurrentAmount = 0;

        // 해당 팀 사원들
        const teamSps = SALESPERSONS.filter(sp => sp.team === team);
        if (teamSps.length === 0) return;

        while (teamCurrentAmount < teamTargetAmount) {
            const sp = teamSps[Math.floor(Math.random() * teamSps.length)];
            const customersOfSp = ALL_CUSTOMERS.filter(c => c.salespersonId === sp.id);
            if (customersOfSp.length === 0) continue;

            const customer = customersOfSp[Math.floor(Math.random() * customersOfSp.length)];
            const product = ALL_PRODUCTS[Math.floor(Math.random() * ALL_PRODUCTS.length)];

            // 금액을 균일하게 배분하기 위해 랜덤성 조절 (회당 약 5000만~1억 목표 시뮬레이션)
            const quantity = randomInt(50, 200);
            const amount = Math.round(quantity * product.unitPrice * 50); // 금액 단위 조정
            const weight_kg = (quantity * (0.5 + Math.random() * 2)).toFixed(2);

            data.push({
                '년도월': yearMonth,
                '영업팀': sp.team,
                '영업사원명': sp.name,
                '거래처코드': customer.code,
                '거래처명': customer.name,
                '품목유형': product.type,
                '품목코드': product.code,
                '품목명': product.name,
                '매출금액': amount,
                '중량(KG)': parseFloat(weight_kg)
            });

            teamCurrentAmount += amount;
            if (data.length > 20000) break; // 안전장치
        }
    });

    return data;
}

/**
 * 목표 데이터 생성 (팀별 가중치 반영)
 * 유도리 있는 목표 설정을 위해 영업사원 레벨까지만 배분 (거래처/유형은 공란)
 */
export function generateTargetData(year, month, totalTarget, teamWeights) {
    const data = [];
    const yearMonth = `${year}${(month).toString().padStart(2, '0')}`;

    Object.entries(teamWeights).forEach(([team, weight]) => {
        const teamTarget = totalTarget * weight;
        const teamSps = SALESPERSONS.filter(sp => sp.team === team);
        if (teamSps.length === 0) return;

        const targetPerSp = Math.round(teamTarget / teamSps.length);

        teamSps.forEach(sp => {
            // 거래처코드, 거래처명, 품목유형은 공란으로 설정하여 사원별 총액 목표만 부여
            data.push({
                '년도월': yearMonth,
                '영업팀': sp.team,
                '영업사원명': sp.name,
                '거래처코드': '',
                '거래처명': '',
                '품목유형': '',
                '목표금액': targetPerSp
            });
        });
    });

    return data;
}

/**
 * 전 기간 데이터셋 생성 (2023-12 ~ 2026-02)
 * 23년 12월 매출 100억 시작, 매월 10억 증액
 * 팀 비중: 1팀 20%, 2팀 40%, 3팀 20%, 4팀 10%, 5팀 10%
 * 달성률: 110% 이상 유지 (실적 = 목표 * 1.15)
 */
export function generateFullDataset() {
    const startYear = 2023;
    const startMonth = 12;
    const endYear = 2026;
    const endMonth = 3; // 3월까지 확장

    const teamWeights = {
        '영업1팀': 0.2,
        '영업2팀': 0.4,
        '영업3팀': 0.2,
        '영업4팀': 0.1,
        '영업5팀': 0.1
    };

    const fullActual = [];
    const fullTarget = [];

    let currentYear = startYear;
    let currentMonth = startMonth;
    let monthlyActualAmount = 10000000000; // 100억

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
        // 달성률 110% 이상을 위해 목표는 실적보다 낮게 설정
        // 실적 = 목표 * 1.15 => 목표 = 실적 / 1.15
        let targetAmountForMonth = Math.round(monthlyActualAmount / 1.15);
        let actualAmountForMonth = monthlyActualAmount;

        // 2026년 3월 특수 처리: 4일 기준, 1~3일 중 영업일은 3일 하루 뿐 (2일 대체공휴일)
        // 1일치 실적만 반영 (한 달 약 20일 기준 1/20 수준)
        if (currentYear === 2026 && currentMonth === 3) {
            actualAmountForMonth = Math.round(monthlyActualAmount * (1 / 21)); // 약 1일치
        }

        fullActual.push(...generateStandardSalesData(currentYear, currentMonth, actualAmountForMonth, teamWeights));
        fullTarget.push(...generateTargetData(currentYear, currentMonth, targetAmountForMonth, teamWeights));

        currentMonth++;
        if (currentMonth > 12) {
            currentMonth = 1;
            currentYear++;
        }
        monthlyActualAmount += 1000000000; // 매월 10억 증가
    }

    return { actual: fullActual, target: fullTarget };
}

/**
 * CSV 변환 함수
 */
export function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    const headers = Object.keys(data[0]);
    const rows = data.map(row =>
        headers.map(header => {
            const val = row[header];
            // 쉼표 포함 시 따옴표 처리
            if (typeof val === 'string' && val.includes(',')) {
                return `"${val}"`;
            }
            return val;
        }).join(',')
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
