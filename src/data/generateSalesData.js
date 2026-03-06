/**
 * [프로젝트 30억] 표준 데이터 생성 엔진
 * 기획안의 [매출업로드 표준 항목] 및 [목표업로드 표준 항목] 기반
 */
import { SALESPERSONS, ALL_CUSTOMERS, ALL_PRODUCTS } from './foodDistributionData.js';

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
 * 전 기간 데이터셋 생성 (2024 ~ 2026.03)
 * 2024년: 총 4000억원
 * 2025년: 총 4500억원
 * 2026년: 매월 430억원 (3월까지)
 */
export function generateFullDataset() {
    const years = [2024, 2025, 2026];
    const teamWeights = {
        '영업1팀': 0.2,
        '영업2팀': 0.3,
        '영업3팀': 0.25,
        '영업4팀': 0.15,
        '영업5팀': 0.1
    };

    const fullActual = [];
    const fullTarget = [];

    years.forEach(year => {
        const monthsInYear = year === 2026 ? 3 : 12;

        let yearlyActualTarget = 0;
        if (year === 2024) yearlyActualTarget = 400000000000;
        else if (year === 2025) yearlyActualTarget = 450000000000;
        else if (year === 2026) yearlyActualTarget = 43000000000 * 12; // 연환산 기준

        const monthlyActualGoal = year === 2026 ? 43000000000 : Math.round(yearlyActualTarget / 12);

        for (let month = 1; month <= monthsInYear; month++) {
            // 달성률 100~105% 사이로 랜덤하게 설정
            const achievementRate = 1.0 + (Math.random() * 0.05);
            const monthlyTargetAmount = Math.round(monthlyActualGoal / achievementRate);
            const monthlyActualAmount = monthlyActualGoal;

            // 2026년 3월 특수 처리: 현재 3월 초라면 일부만 발생하도록 (기본 1/3 정도)
            let actualToGen = monthlyActualAmount;
            if (year === 2026 && month === 3) {
                actualToGen = Math.round(monthlyActualAmount * 0.33); // 10일치 정도
            }

            fullActual.push(...generateStandardSalesData(year, month, actualToGen, teamWeights));
            fullTarget.push(...generateTargetData(year, month, monthlyTargetAmount, teamWeights));
        }
    });

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
