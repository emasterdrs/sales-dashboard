/**
 * 한국 공휴일 및 영업일 계산 유틸리티 (고급형)
 */

export const HOLIDAY_DATA = {
    '2026': [
        { date: '2026-01-01', name: '신정' },
        { date: '2026-01-27', name: '대체공휴일' }, // 설날 관련 대체공휴일 시뮬레이션
        { date: '2026-02-16', name: '설날 연휴' },
        { date: '2026-02-17', name: '설날 당일' },
        { date: '2026-02-18', name: '설날 연휴' },
        { date: '2026-03-01', name: '삼일절' },
        { date: '2026-03-02', name: '삼일절 대체공휴일' },
        { date: '2026-05-05', name: '어린이날' },
        { date: '2026-05-24', name: '부처님 오신 날' },
        { date: '2026-05-25', name: '부처님 오신 날 대체공휴일' },
        { date: '2026-06-06', name: '현충일' },
        { date: '2026-08-15', name: '광복절' },
        { date: '2026-08-17', name: '광복절 대체공휴일' },
        { date: '2026-09-24', name: '추석 연휴' },
        { date: '2026-09-25', name: '추석 당일' },
        { date: '2026-09-26', name: '추석 연휴' },
        { date: '2026-09-28', name: '추석 대체공휴일' },
        { date: '2026-10-03', name: '개천절' },
        { date: '2026-10-05', name: '개천절 대체공휴일' },
        { date: '2026-10-09', name: '한글날' },
        { date: '2026-12-25', name: '성탄절' },
    ],
    '2025': [
        { date: '2025-01-01', name: '신정' },
        // ... 생략 (실제 운영시 데이터 추가 가능)
    ]
};

/**
 * 특정 월의 영업일수 계산
 */
export function calculateBusinessDays(yearMonth, customHolidays = []) {
    const [year, month] = yearMonth.split('-').map(Number);
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    let businessDays = 0;
    const yearHolidays = HOLIDAY_DATA[year] || [];
    const holidayDates = yearHolidays.map(h => h.date);
    const allHolidays = [...holidayDates, ...customHolidays];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateString = d.toISOString().split('T')[0];
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !allHolidays.includes(dateString)) {
            businessDays++;
        }
    }
    return businessDays;
}

/**
 * 현재 월의 경과 영업일 계산
 */
export function calculateCurrentBusinessDay(yearMonth, customHolidays = []) {
    const now = new Date();
    const [year, month] = yearMonth.split('-').map(Number);
    const targetMonthStart = new Date(year, month - 1, 1);
    const targetMonthEnd = new Date(year, month, 0);

    let calculationEnd = now > targetMonthEnd ? targetMonthEnd : now;
    if (now < targetMonthStart) return 0;

    let currentDays = 0;
    const yearHolidays = HOLIDAY_DATA[year] || [];
    const holidayDates = yearHolidays.map(h => h.date);
    const allHolidays = [...holidayDates, ...customHolidays];

    for (let d = new Date(targetMonthStart); d <= calculationEnd; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        const dateString = d.toISOString().split('T')[0];
        if (dayOfWeek !== 0 && dayOfWeek !== 6 && !allHolidays.includes(dateString)) {
            currentDays++;
        }
    }
    return currentDays;
}

/**
 * 특정 연도의 달력 데이터 생성
 */
export function getYearlyCalendarData(year) {
    const calendar = [];
    const holidays = HOLIDAY_DATA[year] || [];

    for (let month = 1; month <= 12; month++) {
        const days = [];
        const date = new Date(year, month - 1, 1);
        const lastDay = new Date(year, month, 0).getDate();

        for (let i = 1; i <= lastDay; i++) {
            const currDate = new Date(year, month - 1, i);
            const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const holiday = holidays.find(h => h.date === dateStr);
            const isWeekend = currDate.getDay() === 0 || currDate.getDay() === 6;

            days.push({
                day: i,
                date: dateStr,
                isWeekend,
                isHoliday: !!holiday,
                holidayName: holiday ? holiday.name : (isWeekend ? (currDate.getDay() === 0 ? '일요일' : '토요일') : null),
                isBusinessDay: !isWeekend && !holiday
            });
        }
        calendar.push({ month, days });
    }
    return calendar;
}
