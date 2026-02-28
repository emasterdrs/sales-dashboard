/**
 * [프로젝트 30억] BI 분석 엔진
 * 드릴다운 구조: 팀 -> 영업사원 -> 거래처 -> 품목
 */
import { SALESPERSONS } from './foodDistributionData.js';

/**
 * 전역 설정 (기획안의 '설정' 섹션 반영)
 */
export const SETTINGS = {
    businessDays: {
        '2026-02': 17, // 2월 영업일수
    },
    currentBusinessDay: 9, // 현재 9일차라고 가정
};

/**
 * 실적 데이터 가공 및 분석 클래스
 */
export class SalesBI {
    constructor(actualData, targetData, lastYearData = [], lastMonthData = []) {
        this.actual = actualData;
        this.target = targetData;
        this.lastYear = lastYearData;
        this.lastMonth = lastMonthData;
    }

    /**
     * 핵심 KPI 계산 (전체 요약)
     */
    getSummary(selectedMonth, level, id, mainTab, metricType) {
        let filteredActual = this.actual;
        let filteredTarget = this.target;
        let filteredLastYear = this.lastYear;
        let filteredLastMonth = this.lastMonth;

        if (level === 'team') {
            filteredActual = filteredActual.filter(r => r['영업팀'] === id);
            filteredTarget = filteredTarget.filter(r => r['영업팀'] === id);
            filteredLastYear = filteredLastYear.filter(r => r['영업팀'] === id);
            filteredLastMonth = filteredLastMonth.filter(r => r['영업팀'] === id);
        } else if (level === 'person') {
            filteredActual = filteredActual.filter(r => r['영업사원명'] === id);
            filteredTarget = filteredTarget.filter(r => r['영업사원명'] === id);
            filteredLastYear = filteredLastYear.filter(r => r['영업사원명'] === id);
            filteredLastMonth = filteredLastMonth.filter(r => r['영업사원명'] === id);
        }

        const actualAmt = filteredActual.reduce((sum, r) => sum + r['매출금액'], 0);
        const targetAmt = filteredTarget.reduce((sum, r) => sum + r['목표금액'], 0);
        const lastYearAmt = filteredLastYear.reduce((sum, r) => sum + r['매출금액'], 0);
        const lastMonthAmt = filteredLastMonth.reduce((sum, r) => sum + r['매출금액'], 0);

        const actualWeight = filteredActual.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);
        const lastYearWeight = filteredLastYear.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);
        const lastMonthWeight = filteredLastMonth.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);

        const currentActual = metricType === 'amount' ? actualAmt : actualWeight;
        const currentTarget = metricType === 'amount' ? targetAmt : (targetAmt / 4500); // 중량 목표는 시뮬레이션
        const currentLastYear = metricType === 'amount' ? lastYearAmt : lastYearWeight;
        const currentLastMonth = metricType === 'amount' ? lastMonthAmt : lastMonthWeight;

        const achievementRate = currentTarget > 0 ? (currentActual / currentTarget) * 100 : 0;
        const businessDays = SETTINGS.businessDays[selectedMonth] || 20;
        const progressRate = (SETTINGS.currentBusinessDay / businessDays) * 100;

        return {
            actual: currentActual,
            target: currentTarget,
            achievementRate,
            progressRate,
            progressGap: achievementRate - progressRate,
            lastYearActual: currentLastYear,
            lastMonthActual: currentLastMonth,
            yoyGrowth: currentLastYear > 0 ? ((currentActual - currentLastYear) / currentLastYear) * 100 : 0,
            momGrowth: currentLastMonth > 0 ? ((currentActual - currentLastMonth) / currentLastMonth) * 100 : 0,
            cumulativeActual: currentActual * 1.8,
            cumulativeTarget: currentTarget * 2.0,
            cumulativeAchievement: (currentActual * 1.8) / (currentTarget * 2.0 || 1) * 100,
            forecast: (currentActual / SETTINGS.currentBusinessDay) * businessDays
        };
    }

    /**
     * 드릴다운 데이터 집계
     */
    getDrillDown(selectedMonth, level, id, nextLevel, mainTab, metricType) {
        if (nextLevel === 'team') {
            return this.getAggregatedByTeam().map(d => this._mapMetric(d, metricType));
        } else if (nextLevel === 'person') {
            return this.getAggregatedBySalesperson(id).map(d => this._mapMetric(d, metricType));
        } else if (nextLevel === 'customer') {
            return this.getAggregatedByCustomer(id).map(d => this._mapMetric(d, metricType));
        }
        return this.getAggregatedByTeam().map(d => this._mapMetric(d, metricType));
    }

    _mapMetric(d, metricType) {
        if (metricType === 'amount') return d;
        // 중량 기준으로 필드 매핑
        return {
            ...d,
            actual: d.weight,
            target: d.target / 4500, // 시뮬레이션
            lastYear: d.lastYearWeight,
            lastMonth: d.lastMonthWeight,
            achievement: (d.weight / (d.target / 4500 || 1)) * 100,
            yoy: d.lastYearWeight > 0 ? ((d.weight - d.lastYearWeight) / d.lastYearWeight) * 100 : 0,
            mom: d.lastMonthWeight > 0 ? ((d.weight - d.lastMonthWeight) / d.lastMonthWeight) * 100 : 0,
            cumulativeTarget: (d.target / 4500) * 2.0,
            cumulativeActual: d.weight * 1.8,
            forecastAmt: (d.weight / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20)
        };
    }

    /**
     * 팀별 데이터 집계 (1단계)
     */
    getAggregatedByTeam() {
        const teams = [...new Set(this.target.map(r => r['영업팀']))];
        const progressRate = (SETTINGS.currentBusinessDay / (SETTINGS.businessDays['2026-02'] || 20)) * 100;

        return teams.map(teamName => {
            const teamActual = this.actual.filter(r => r['영업팀'] === teamName);
            const teamTarget = this.target.filter(r => r['영업팀'] === teamName);
            const teamLastYear = this.lastYear.filter(r => r['영업팀'] === teamName);
            const teamLastMonth = this.lastMonth.filter(r => r['영업팀'] === teamName);

            const actualAmt = teamActual.reduce((sum, r) => sum + r['매출금액'], 0);
            const targetAmt = teamTarget.reduce((sum, r) => sum + r['목표금액'], 0);
            const lastYearAmt = teamLastYear.reduce((sum, r) => sum + r['매출금액'], 0);
            const lastMonthAmt = teamLastMonth.reduce((sum, r) => sum + r['매출금액'], 0);

            const weight = teamActual.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);
            const lastYearWeight = teamLastYear.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);
            const lastMonthWeight = teamLastMonth.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);

            const achievement = targetAmt > 0 ? (actualAmt / targetAmt) * 100 : 0;

            return {
                id: teamName,
                name: teamName,
                actual: actualAmt,
                target: targetAmt,
                weight,
                lastYearWeight,
                lastMonthWeight,
                achievement,
                progressGap: achievement - progressRate,
                lastYear: lastYearAmt,
                yoy: lastYearAmt > 0 ? ((actualAmt - lastYearAmt) / lastYearAmt) * 100 : 0,
                lastMonth: lastMonthAmt,
                mom: lastMonthAmt > 0 ? ((actualAmt - lastMonthAmt) / lastMonthAmt) * 100 : 0,
                cumulativeTarget: targetAmt * 2.0,
                cumulativeActual: actualAmt * 1.8,
                cumulativeWeight: weight * 1.8,
                forecast: (actualAmt / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20),
                forecastWeight: (weight / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20)
            };
        }).sort((a, b) => b.actual - a.actual);
    }

    /**
     * 사원별 데이터 집계 (2단계)
     */
    getAggregatedBySalesperson(teamName) {
        const targetList = teamName === 'all' ? this.target : this.target.filter(r => r['영업팀'] === teamName);
        const spsInTeam = [...new Set(targetList.map(r => r['영업사원명']))];
        const progressRate = (SETTINGS.currentBusinessDay / (SETTINGS.businessDays['2026-02'] || 20)) * 100;

        return spsInTeam.map(name => {
            const spActual = this.actual.filter(r => r['영업사원명'] === name);
            const spTarget = this.target.filter(r => r['영업사원명'] === name);
            const spLastYear = this.lastYear.filter(r => r['영업사원명'] === name);
            const spLastMonth = this.lastMonth.filter(r => r['영업사원명'] === name);

            const actualAmt = spActual.reduce((sum, r) => sum + r['매출금액'], 0);
            const targetAmt = spTarget.reduce((sum, r) => sum + r['목표금액'], 0);
            const lastYearAmt = spLastYear.reduce((sum, r) => sum + r['매출금액'], 0);
            const lastMonthAmt = spLastMonth.reduce((sum, r) => sum + r['매출금액'], 0);

            const weight = spActual.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);
            const lastYearWeight = spLastYear.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);
            const lastMonthWeight = spLastMonth.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);

            const achievement = targetAmt > 0 ? (actualAmt / targetAmt) * 100 : 0;

            return {
                id: name,
                name: name,
                actual: actualAmt,
                target: targetAmt,
                weight,
                lastYearWeight,
                lastMonthWeight,
                achievement,
                progressGap: achievement - progressRate,
                lastYear: lastYearAmt,
                yoy: lastYearAmt > 0 ? ((actualAmt - lastYearAmt) / lastYearAmt) * 100 : 0,
                lastMonth: lastMonthAmt,
                mom: lastMonthAmt > 0 ? ((actualAmt - lastMonthAmt) / lastMonthAmt) * 100 : 0,
                cumulativeTarget: targetAmt * 2.0,
                cumulativeActual: actualAmt * 1.8,
                cumulativeWeight: weight * 1.8,
                forecast: (actualAmt / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20),
                forecastWeight: (weight / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20)
            };
        }).sort((a, b) => b.actual - a.actual);
    }

    /**
     * 거래처별 데이터 집계 (3단계)
     */
    getAggregatedByCustomer(spName) {
        const customersOfSp = [...new Set(this.target.filter(r => r['영업사원명'] === spName).map(r => r['거래처명']))];
        const progressRate = (SETTINGS.currentBusinessDay / (SETTINGS.businessDays['2026-02'] || 20)) * 100;

        return customersOfSp.map(name => {
            const custActual = this.actual.filter(r => r['거래처명'] === name);
            const custTarget = this.target.filter(r => r['거래처명'] === name);
            const custLastYear = this.lastYear.filter(r => r['거래처명'] === name);
            const custLastMonth = this.lastMonth.filter(r => r['거래처명'] === name);

            const actualAmt = custActual.reduce((sum, r) => sum + r['매출금액'], 0);
            const targetAmt = custTarget.reduce((sum, r) => sum + r['목표금액'], 0);
            const lastYearAmt = custLastYear.reduce((sum, r) => sum + r['매출금액'], 0);
            const lastMonthAmt = custLastMonth.reduce((sum, r) => sum + r['매출금액'], 0);

            const weight = custActual.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);
            const lastYearWeight = custLastYear.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);
            const lastMonthWeight = custLastMonth.reduce((sum, r) => sum + (r['중량(KG)'] || 0), 0);

            const achievement = targetAmt > 0 ? (actualAmt / targetAmt) * 100 : 0;

            return {
                id: name,
                name: name,
                actual: actualAmt,
                target: targetAmt,
                weight,
                lastYearWeight,
                lastMonthWeight,
                achievement,
                progressGap: achievement - progressRate,
                lastYear: lastYearAmt,
                yoy: lastYearAmt > 0 ? ((actualAmt - lastYearAmt) / lastYearAmt) * 100 : 0,
                lastMonth: lastMonthAmt,
                mom: lastMonthAmt > 0 ? ((actualAmt - lastMonthAmt) / lastMonthAmt) * 100 : 0,
                cumulativeTarget: targetAmt * 2.0,
                cumulativeActual: actualAmt * 1.8,
                cumulativeWeight: weight * 1.8,
                forecast: (actualAmt / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20),
                forecastWeight: (weight / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20)
            };
        }).sort((a, b) => b.actual - a.actual);
    }

    /**
     * 품목별 데이터 집계 (4단계)
     */
    getAggregatedByItem(custName) {
        const items = {};
        this.actual.filter(r => r['거래처명'] === custName).forEach(r => {
            if (!items[r['품목명']]) {
                items[r['품목명']] = { name: r['품목명'], actual: 0, weight: 0 };
            }
            items[r['품목명']].actual += r['매출금액'];
            items[r['품목명']].weight += (r['중량(KG)'] || 0);
        });

        return Object.values(items).map(item => {
            // 품목별 목표는 데이터에 없으므로 실제의 1.2배로 시뮬레이션
            item.target = item.actual * 1.2;
            item.achievement = (item.actual / (item.target || 1)) * 100;
            item.forecastAmt = (item.actual / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20);
            item.forecastWeight = (item.weight / SETTINGS.currentBusinessDay) * (SETTINGS.businessDays['2026-02'] || 20);
            return item;
        }).sort((a, b) => b.actual - a.actual);
    }
}
