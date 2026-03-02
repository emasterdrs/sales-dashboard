/**
 * 한국 공휴일 및 영업일 계산 유틸리티
 */

// 2026년 한국 공휴일 리스트 (대체공휴일 포함)
const HOLIDAYS_2026 = [
    '2026-01-01', // 신정
    '2026-02-16', // 설날 연휴
    '2026-02-17', // 설날 당일
    '2026-02-18', // 설날 연휴
    '2026-03-01', // 삼일절
    '2026-03-02', // 삼일절 대체공휴일
    '2026-05-05', // 어린이날
    '2026-05-24', // 부처님 오신 날
    '2026-05-25', // 부처님 오신 날 대체공휴일
    '2026-06-06', // 현충일
    '2026-08-15', // 광복절
    '2026-08-17', // 광복절 대체공휴일
    '2026-09-24', // 추석 연휴
    '2026-09-25', // 추석 당일
    '2026-09-26', // 추석 연휴
    '2026-09-28', // 추석 대체공휴일
    '2026-10-03', // 개천절
    '2026-10-05', // 개천절 대체공휴일
    '2026-10-09', // 한글날
    '2026-12-25', // 성탄절
];

/**
 * 특정 월의 영업일수 계산 (주말 및 공휴일 제외)
 * @param {string} yearMonth - 'YYYY-MM' 형식
 * @param {string[]} customHolidays - 사용자가 추가로 지정한 공휴일 (YYYY-MM-DD)
 * @returns {number} 영업일수
 */
export function calculateBusinessDays(yearMonth, customHolidays = []) {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0); // 해당 월의 마지막 날

    let businessDays = 0;
    const allHolidays = [...HOLIDAYS_2026, ...customHolidays];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay(); // 0(일) ~ 6(토)
        const dateString = d.toISOString().split('T')[0];

        // 토요일(6), 일요일(0) 제외 및 공휴일 제외
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !allHolidays.includes(dateString)) {
            businessDays++;
        }
    }

    return businessDays;
}

/**
 * 현재 월의 경과 영업일 계산 (오늘 포함)
 * @param {string} yearMonth - 'YYYY-MM' 형식
 * @param {string[]} customHolidays - 공휴일
 * @returns {number} 현재까지의 영업일
 */
export function calculateCurrentBusinessDay(yearMonth, customHolidays = []) {
    const now = new Date();
    const [year, month] = yearMonth.split('-').map(Number);

    // 현재 날짜가 요청한 월보다 미래면 해당 월 전체를 계산, 과거면 0, 같으면 오늘까지
    const targetMonthStart = new Date(year, month - 1, 1);
    const targetMonthEnd = new Date(year, month, 0);

    let calculationEnd;
    if (now > targetMonthEnd) {
        calculationEnd = targetMonthEnd;
    } else if (now < targetMonthStart) {
        return 0;
    } else {
        calculationEnd = now;
    }

    let currentDays = 0;
    const allHolidays = [...HOLIDAYS_2026, ...customHolidays];

    for (let d = new Date(targetMonthStart); d <= calculationEnd; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateString = d.toISOString().split('T')[0];

        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !allHolidays.includes(dateString)) {
            currentDays++;
        }
    }

    return currentDays;
}
