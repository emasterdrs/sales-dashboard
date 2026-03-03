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
        '2026-01': 22, // 1월 영업일수
        '2026-02': 17, // 2월 영업일수
    },
    currentBusinessDay: 9, // 현재 9일차라고 가정
};

/**
 * 실적 데이터 가공 및 분석 클래스
 */
export class SalesBI {
    constructor(actualData, targetData, lastYearData = [], lastMonthData = []) {
        let registeredTeamNames = ['영업1팀', '영업2팀', '영업3팀', '영업4팀', '영업5팀'];
        let registeredTypeNames = ['새 유형1', '새 유형2', '새 유형3', '새 유형4', '새 유형5', '새 유형6'];
        try {
            const savedData = localStorage.getItem('dashboard_settings');
            const settingsData = savedData ? JSON.parse(savedData) : {};
            if (settingsData.teams) {
                registeredTeamNames = settingsData.teams.map(t => t.name);
            }
            if (settingsData.types) {
                registeredTypeNames = settingsData.types.map(t => t.name);
            }
        } catch (e) { }

        const mapTeamAndType = (r) => {
            const t = r['영업팀'];
            const pt = r['품목유형'];
            const mappedTeamName = registeredTeamNames.includes(t) ? t : '기타';
            const mappedTypeName = registeredTypeNames.includes(pt) ? pt : '기타';
            return { ...r, '영업팀': mappedTeamName, '품목유형': mappedTypeName };
        };

        this.actual = actualData.map(mapTeamAndType);
        this.target = targetData.map(mapTeamAndType);
        this.lastYear = lastYearData.map(mapTeamAndType);
        this.lastMonth = lastMonthData.map(mapTeamAndType);

        this.registeredTeamNames = registeredTeamNames;
        this.registeredTypeNames = registeredTypeNames;
    }

    /**
     * 핵심 KPI 계산 (전체 요약)
     */
    getSummary(selectedMonth, level, id, mainTab, metricType) {
        const targetYM = selectedMonth.replace('-', '');
        const currentYear = selectedMonth.split('-')[0];
        const currentMonth = selectedMonth.split('-')[1];

        // 1. 기간 필터링 로직
        const filterByMonth = (data, ym) => data.filter(r => String(r['년도월']) === ym);
        const filterByYearToMonth = (data, ym) => {
            const y = ym.substring(0, 4);
            const m = ym.substring(4, 6);
            return data.filter(r => {
                const rYM = String(r['년도월']);
                return rYM.startsWith(y) && rYM.substring(4, 6) <= m;
            });
        };

        const getYestYearYM = (ym) => {
            const y = parseInt(ym.substring(0, 4)) - 1;
            const m = ym.substring(4, 6);
            return `${y}${m}`;
        };

        const getPrevMonthYM = (ym) => {
            let y = parseInt(ym.substring(0, 4));
            let m = parseInt(ym.substring(4, 6)) - 1;
            if (m === 0) {
                m = 12;
                y -= 1;
            }
            return `${y}${String(m).padStart(2, '0')}`;
        };

        // 2. 레벨 필터링
        let fullActual = this.actual;
        let fullTarget = this.target;

        if (level === 'team') {
            fullActual = fullActual.filter(r => r['영업팀'] === id);
            fullTarget = fullTarget.filter(r => r['영업팀'] === id);
        } else if (level === 'person') {
            fullActual = fullActual.filter(r => r['영업사원명'] === id);
            fullTarget = fullTarget.filter(r => r['영업사원명'] === id);
        } else if (level === 'type') {
            fullActual = fullActual.filter(r => r['품목유형'] === id);
            fullTarget = fullTarget.filter(r => r['품목유형'] === id);
        }

        const currentActualRows = filterByMonth(fullActual, targetYM);
        const currentTargetRows = filterByMonth(fullTarget, targetYM);
        const prevYearActualRows = filterByMonth(fullActual, getYestYearYM(targetYM));
        const prevMonthActualRows = filterByMonth(fullActual, getPrevMonthYM(targetYM));

        const cumActualRows = filterByYearToMonth(fullActual, targetYM);
        const cumTargetRows = filterByYearToMonth(fullTarget, targetYM);

        // 3. 값 집계함수
        const sum = (rows, field) => rows.reduce((acc, r) => acc + (r[field] || 0), 0);

        const actualAmt = sum(currentActualRows, '매출금액');
        const targetAmt = sum(currentTargetRows, '목표금액');
        const lyAmt = sum(prevYearActualRows, '매출금액');
        const lmAmt = sum(prevMonthActualRows, '매출금액');
        const cumActualAmt = sum(cumActualRows, '매출금액');
        const cumTargetAmt = sum(cumTargetRows, '목표금액');

        const actualWeight = sum(currentActualRows, '중량(KG)');
        const lyWeight = sum(prevYearActualRows, '중량(KG)');
        const lmWeight = sum(prevMonthActualRows, '중량(KG)');
        const cumActualWeight = sum(cumActualRows, '중량(KG)');

        // 4. 메트릭 변환
        const isAmt = metricType === 'amount';
        let currentActual = isAmt ? actualAmt : actualWeight;
        const businessDays = SETTINGS.businessDays[selectedMonth] || 20;
        const currentBizDay = Math.max(1, SETTINGS.currentBusinessDay);

        if (mainTab === 'expected') {
            currentActual = (currentActual / currentBizDay) * businessDays;
        }

        const currentTarget = isAmt ? targetAmt : (targetAmt / 4500); // 중량 목표는 시뮬레이션
        const currentLastYear = isAmt ? lyAmt : lyWeight;
        const currentLastMonth = isAmt ? lmAmt : lmWeight;
        const cumulativeActual = isAmt ? cumActualAmt : cumActualWeight;
        const cumulativeTarget = isAmt ? cumTargetAmt : (cumTargetAmt / 4500);

        const achievementRate = currentTarget > 0 ? (currentActual / currentTarget) * 100 : (currentActual > 0 ? 100 : 0);
        const progressRate = (SETTINGS.currentBusinessDay / businessDays) * 100;
        const progressAdjustedTarget = currentTarget * (progressRate / 100);
        const overShort = mainTab === 'expected' ? (currentActual - currentTarget) : (currentActual - progressAdjustedTarget);

        return {
            actual: currentActual,
            target: currentTarget,
            achievementRate,
            progressRate,
            progressGap: achievementRate - (mainTab === 'expected' ? 100 : progressRate),
            overShort,
            lastYearActual: currentLastYear,
            lastMonthActual: currentLastMonth,
            yoyGrowth: currentLastYear > 0 ? ((currentActual - currentLastYear) / currentLastYear) * 100 : 0,
            momGrowth: currentLastMonth > 0 ? ((currentActual - currentLastMonth) / currentLastMonth) * 100 : 0,
            cumulativeActual,
            cumulativeTarget,
            cumulativeAchievement: cumulativeTarget > 0 ? (cumulativeActual / cumulativeTarget) * 100 : (cumulativeActual > 0 ? 100 : 0),
            forecast: (currentActual / currentBizDay) * businessDays
        };
    }

    /**
     * 드릴다운 데이터 집계
     */
    getDrillDown(selectedMonth, level, id, nextLevel, mainTab, metricType) {
        const businessDays = SETTINGS.businessDays[selectedMonth] || 20;
        const progressRate = (SETTINGS.currentBusinessDay / businessDays) * 100;
        const targetYM = selectedMonth.replace('-', '');

        // 연도 및 월 보조 함수
        const getYestYearYM = (ym) => {
            const y = parseInt(ym.substring(0, 4)) - 1;
            const m = ym.substring(4, 6);
            return `${y}${m}`;
        };
        const getPrevMonthYM = (ym) => {
            let y = parseInt(ym.substring(0, 4));
            let m = parseInt(ym.substring(4, 6)) - 1;
            if (m === 0) { m = 12; y -= 1; }
            return `${y}${String(m).padStart(2, '0')}`;
        };
        const filterByYearToMonth = (data, ym) => {
            const y = ym.substring(0, 4);
            const m = ym.substring(4, 6);
            return data.filter(r => {
                const rYM = String(r['년도월']);
                return rYM.startsWith(y) && rYM.substring(4, 6) <= m;
            });
        };

        let data = [];
        if (nextLevel === 'team') {
            data = this.getAggregatedData(this.actual, this.target, '영업팀', targetYM);
        } else if (nextLevel === 'type') {
            data = this.getAggregatedData(this.actual, this.target, '품목유형', targetYM);
        } else if (nextLevel === 'person') {
            const filteredActual = id === 'all' ? this.actual : this.actual.filter(r => r['영업팀'] === id);
            const filteredTarget = id === 'all' ? this.target : this.target.filter(r => r['영업팀'] === id);
            data = this.getAggregatedData(filteredActual, filteredTarget, '영업사원명', targetYM);
        } else if (nextLevel === 'customer') {
            const filteredActual = this.actual.filter(r => r['영업사원명'] === id);
            const filteredTarget = this.target.filter(r => r['영업사원명'] === id);
            data = this.getAggregatedData(filteredActual, filteredTarget, '거래처명', targetYM);
        }

        return data.map(d => this._mapMetric(d, metricType, mainTab, progressRate));
    }

    /**
     * 범용 집계 함수 (중량/금액/전년/전월/누계 모두 포함)
     */
    getAggregatedData(actualData, targetData, keyField, targetYM) {
        const keys = [...new Set([...actualData.map(r => r[keyField]), ...targetData.map(r => r[keyField])])];
        const currentBizDay = Math.max(1, SETTINGS.currentBusinessDay);
        const businessDays = SETTINGS.businessDays[SETTINGS.selectedMonth] || 20;

        const getYestYearYM = (ym) => {
            const y = parseInt(ym.substring(0, 4)) - 1;
            const m = ym.substring(4, 6);
            return `${y}${m}`;
        };
        const getPrevMonthYM = (ym) => {
            let y = parseInt(ym.substring(0, 4));
            let m = parseInt(ym.substring(4, 6)) - 1;
            if (m === 0) { m = 12; y -= 1; }
            return `${y}${String(m).padStart(2, '0')}`;
        };
        const filterByYearToMonth = (data, ym) => {
            const y = ym.substring(0, 4);
            const m = ym.substring(4, 6);
            return data.filter(r => {
                const rYM = String(r['년도월']);
                return rYM.startsWith(y) && rYM.substring(4, 6) <= m;
            });
        };

        return keys.map(key => {
            const currentActual = actualData.filter(r => r[keyField] === key && String(r['년도월']) === targetYM);
            const currentTarget = targetData.filter(r => r[keyField] === key && String(r['년도월']) === targetYM);
            const prevYearActual = actualData.filter(r => r[keyField] === key && String(r['년도월']) === getYestYearYM(targetYM));
            const prevMonthActual = actualData.filter(r => r[keyField] === key && String(r['년도월']) === getPrevMonthYM(targetYM));
            const cumActualRows = filterByYearToMonth(actualData.filter(r => r[keyField] === key), targetYM);
            const cumTargetRows = filterByYearToMonth(targetData.filter(r => r[keyField] === key), targetYM);

            const sum = (rows, field) => rows.reduce((acc, r) => acc + (r[field] || 0), 0);

            const actualAmt = sum(currentActual, '매출금액');
            const targetAmt = sum(currentTarget, '목표금액');
            const lyAmt = sum(prevYearActual, '매출금액');
            const lmAmt = sum(prevMonthActual, '매출금액');
            const weight = sum(currentActual, '중량(KG)');
            const lyWeight = sum(prevYearActual, '중량(KG)');
            const lmWeight = sum(prevMonthActual, '중량(KG)');
            const cumActualAmt = sum(cumActualRows, '매출금액');
            const cumTargetAmt = sum(cumTargetRows, '목표금액');
            const cumWeight = sum(cumActualRows, '중량(KG)');

            return {
                id: key,
                name: key,
                actual: actualAmt,
                target: targetAmt,
                weight,
                lastYear: lyAmt,
                lastMonth: lmAmt,
                lastYearWeight: lyWeight,
                lastMonthWeight: lmWeight,
                cumulativeTarget: cumTargetAmt,
                cumulativeActual: cumActualAmt,
                cumulativeWeight: cumWeight,
                forecast: (actualAmt / currentBizDay) * businessDays,
                forecastWeight: (weight / currentBizDay) * businessDays
            };
        });
    }

    _mapMetric(d, metricType, mainTab, progressRate) {
        let actual = d.actual;
        let target = d.target;
        let lastYear = d.lastYear;
        let lastMonth = d.lastMonth;
        let weight = d.weight;
        let cumulativeTarget = d.cumulativeTarget;
        let cumulativeActual = d.cumulativeActual;

        if (mainTab === 'expected') {
            actual = d.forecast;
            weight = d.forecastWeight;
        }

        if (metricType === 'weight') {
            actual = weight;
            target = d.target / 4500;
            lastYear = d.lastYearWeight;
            lastMonth = d.lastMonthWeight;
            cumulativeTarget = d.cumulativeTarget / 4500;
            cumulativeActual = d.cumulativeWeight;
        }

        const achievement = target > 0 ? (actual / target) * 100 : (actual > 0 ? 100 : 0);
        const yoy = lastYear > 0 ? ((actual - lastYear) / lastYear) * 100 : 0;
        const mom = lastMonth > 0 ? ((actual - lastMonth) / lastMonth) * 100 : 0;
        const cumulativeAchievement = cumulativeTarget > 0 ? (cumulativeActual / cumulativeTarget) * 100 : (cumulativeActual > 0 ? 100 : 0);

        const overShort = mainTab === 'expected' ? (actual - target) : (actual - (target * (progressRate / 100)));

        return {
            ...d,
            actual,
            target,
            lastYear,
            lastMonth,
            achievement,
            yoy,
            mom,
            overShort,
            cumulativeActual,
            cumulativeTarget,
            cumulativeAchievement
        };
    }
}
