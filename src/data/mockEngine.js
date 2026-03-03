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
    getSummary(selectedMonth, level, id, mainTab, metricType, bizDayInfo = { currentBusinessDay: 1, totalBusinessDays: 20 }) {
        const targetYM = selectedMonth.replace('-', '');

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
            if (m === 0) { m = 12; y -= 1; }
            return `${y}${String(m).padStart(2, '0')}`;
        };

        // 2. 레벨 필터링
        let fullActual = this.actual || [];
        let fullTarget = this.target || [];

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
        const sumVal = (rows, field) => rows.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);

        const actualAmt = sumVal(currentActualRows, '매출금액');
        const targetAmt = sumVal(currentTargetRows, '목표금액');
        const lyAmt = sumVal(prevYearActualRows, '매출금액');
        const lmAmt = sumVal(prevMonthActualRows, '매출금액');
        const cumActualAmt = sumVal(cumActualRows, '매출금액');
        const cumTargetAmt = sumVal(cumTargetRows, '목표금액');

        const actualWeight = sumVal(currentActualRows, '중량(KG)');
        const lyWeight = sumVal(prevYearActualRows, '중량(KG)');
        const lmWeight = sumVal(prevMonthActualRows, '중량(KG)');
        const cumActualWeight = sumVal(cumActualRows, '중량(KG)');

        // 4. 메트릭 변환
        const isAmt = metricType === 'amount';
        let currentActualTotal = isAmt ? actualAmt : actualWeight;
        const businessDays = bizDayInfo.totalBusinessDays || 20;
        const currentBizDay = Math.max(1, bizDayInfo.currentBusinessDay);

        if (mainTab === 'expected') {
            currentActualTotal = (currentActualTotal / currentBizDay) * businessDays;
        }

        const currentTargetTotal = isAmt ? targetAmt : (targetAmt / 4500);
        const currentLastYearTotal = isAmt ? lyAmt : lyWeight;
        const currentLastMonthTotal = isAmt ? lmAmt : lmWeight;
        const cumulativeActualTotal = isAmt ? cumActualAmt : cumActualWeight;
        const cumulativeTargetTotal = isAmt ? cumTargetAmt : (cumTargetAmt / 4500);

        const achievementRate = currentTargetTotal > 0 ? (currentActualTotal / currentTargetTotal) * 100 : (currentActualTotal > 0 ? 100 : 0);
        const progressRateCurrent = (bizDayInfo.currentBusinessDay / businessDays) * 100;
        const progressAdjustedTargetTotal = currentTargetTotal * (progressRateCurrent / 100);
        const overShortVal = mainTab === 'expected' ? (currentActualTotal - currentTargetTotal) : (currentActualTotal - progressAdjustedTargetTotal);

        return {
            actual: currentActualTotal,
            target: currentTargetTotal,
            achievementRate,
            progressRate: progressRateCurrent,
            progressGap: achievementRate - (mainTab === 'expected' ? 100 : progressRateCurrent),
            overShort: overShortVal,
            lastYearActual: currentLastYearTotal,
            lastMonthActual: currentLastMonthTotal,
            yoyGrowth: currentLastYearTotal > 0 ? ((currentActualTotal - currentLastYearTotal) / currentLastYearTotal) * 100 : 0,
            momGrowth: currentLastMonthTotal > 0 ? ((currentActualTotal - currentLastMonthTotal) / currentLastMonthTotal) * 100 : 0,
            cumulativeActual: cumulativeActualTotal,
            cumulativeTarget: cumulativeTargetTotal,
            cumulativeAchievement: cumulativeTargetTotal > 0 ? (cumulativeActualTotal / cumulativeTargetTotal) * 100 : (cumulativeActualTotal > 0 ? 100 : 0),
            forecast: (currentActualTotal / currentBizDay) * businessDays
        };
    }

    /**
     * 드릴다운 데이터 집계
     */
    getDrillDown(selectedMonth, level, id, nextLevel, mainTab, metricType, bizDayInfo = { currentBusinessDay: 1, totalBusinessDays: 20 }) {
        const progressRate = (bizDayInfo.currentBusinessDay / (bizDayInfo.totalBusinessDays || 20)) * 100;
        const targetYM = selectedMonth.replace('-', '');

        let data = [];
        if (nextLevel === 'team') {
            data = this.getAggregatedData(this.actual, this.target, '영업팀', targetYM, bizDayInfo);
        } else if (nextLevel === 'type') {
            data = this.getAggregatedData(this.actual, this.target, '품목유형', targetYM, bizDayInfo);
        } else if (nextLevel === 'person') {
            const filteredActual = id === 'all' ? this.actual : this.actual.filter(r => r['영업팀'] === id);
            const filteredTarget = id === 'all' ? this.target : this.target.filter(r => r['영업팀'] === id);
            data = this.getAggregatedData(filteredActual, filteredTarget, '영업사원명', targetYM, bizDayInfo);
        } else if (nextLevel === 'customer') {
            const filteredActual = this.actual.filter(r => r['영업사원명'] === id);
            const filteredTarget = this.target.filter(r => r['영업사원명'] === id);
            data = this.getAggregatedData(filteredActual, filteredTarget, '거래처명', targetYM, bizDayInfo);
        }

        return data.map(d => this._mapMetric(d, metricType, mainTab, progressRate));
    }

    /**
     * 범용 집계 함수 (중량/금액/전년/전월/누계 모두 포함)
     */
    getAggregatedData(actualData, targetData, keyField, targetYM, bizDayInfo) {
        const keys = [...new Set([...actualData.map(r => r[keyField]), ...targetData.map(r => r[keyField])])];
        const currentBizDay = Math.max(1, bizDayInfo.currentBusinessDay);
        const businessDays = bizDayInfo.totalBusinessDays || 20;

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
        const filterByYearToMonthArr = (arr, ym) => {
            const y = ym.substring(0, 4);
            const m = ym.substring(4, 6);
            return arr.filter(r => {
                const rYM = String(r['년도월']);
                return rYM.startsWith(y) && rYM.substring(4, 6) <= m;
            });
        };

        const sumVal = (rows, field) => rows.reduce((acc, r) => acc + (parseFloat(r[field]) || 0), 0);

        return keys.filter(k => k).map(key => {
            const currentActualRows = actualData.filter(r => r[keyField] === key && String(r['년도월']) === targetYM);
            const currentTargetRows = targetData.filter(r => r[keyField] === key && String(r['년도월']) === targetYM);
            const prevYearActualRows = actualData.filter(r => r[keyField] === key && String(r['년도월']) === getYestYearYM(targetYM));
            const prevMonthActualRows = actualData.filter(r => r[keyField] === key && String(r['년도월']) === getPrevMonthYM(targetYM));

            const spActualRows = actualData.filter(r => r[keyField] === key);
            const spTargetRows = targetData.filter(r => r[keyField] === key);

            const cumActualRows = filterByYearToMonthArr(spActualRows, targetYM);
            const cumTargetRows = filterByYearToMonthArr(spTargetRows, targetYM);

            const actualAmt = sumVal(currentActualRows, '매출금액');
            const targetAmt = sumVal(currentTargetRows, '목표금액');
            const lyAmt = sumVal(prevYearActualRows, '매출금액');
            const lmAmt = sumVal(prevMonthActualRows, '매출금액');
            const weight = sumVal(currentActualRows, '중량(KG)');
            const lyWeight = sumVal(prevYearActualRows, '중량(KG)');
            const lmWeight = sumVal(prevMonthActualRows, '중량(KG)');
            const cumActualAmt = sumVal(cumActualRows, '매출금액');
            const cumTargetAmt = sumVal(cumTargetRows, '목표금액');
            const cumWeight = sumVal(cumActualRows, '중량(KG)');

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
