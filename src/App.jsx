import { useState, useMemo } from 'react';
import {
    LayoutDashboard,
    DollarSign,
    Target,
    Calendar,
    ChevronRight,
    Settings,
    CreditCard,
    AlertCircle,
    Download,
    Eye,
    Zap,
    Scale,
    TrendingUp,
    TrendingDown,
    Menu,
    X,
    LayoutGrid,
    Globe,
    ChevronDown,
    Clock,
    Filter,
    BarChart3,
    Settings2,
    PieChart as PieChartIcon,
    Command,
    Sparkles,
    Activity,
    Shield,
    Layers,
    Gauge
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    ComposedChart,
    Area,
    Cell,
    PieChart,
    Pie,
    LabelList
} from 'recharts';

import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { generateStandardSalesData, generateTargetData, generateFullDataset } from './data/generateSalesData';
import { SalesBI, SETTINGS } from './data/mockEngine';
import { Quote } from './components/Quote';
import { SettingsView } from './components/SettingsView';

// 색상 팔레트 최적화
const TEAM_COLORS = {
    'FD팀': { main: '#6366f1', grad: 'from-indigo-600 to-blue-500' },
    'FC팀': { main: '#10b981', grad: 'from-emerald-600 to-teal-500' },
    'FR팀': { main: '#f59e0b', grad: 'from-amber-600 to-orange-500' },
    'FS팀': { main: '#ef4444', grad: 'from-rose-600 to-pink-500' },
    'FL팀': { main: '#8b5cf6', grad: 'from-violet-600 to-purple-500' },
    '전체': { main: '#3b82f6', grad: 'from-blue-600 to-indigo-500' }
};

// 통화/중량 단위 설정
const CURRENCY_UNITS = [
    { key: '100M', label: '억원', divisor: 100000000, suffix: '억' },
    { key: '1M', label: '백만원', divisor: 1000000, suffix: '백만' },
    { key: '1K', label: '천원', divisor: 1000, suffix: '천' },
    { key: '1', label: '원', divisor: 1, suffix: '원' }
];

const WEIGHT_UNITS = [
    { key: 'TON', label: '톤(Ton)', divisor: 1000, suffix: '톤' },
    { key: 'KG', label: '킬로그램(KG)', divisor: 1, suffix: 'kg' },
    { key: 'BOX', label: '박스(Box)', divisor: 10, suffix: 'box' },
    { key: 'EA', label: '개(EA)', divisor: 1, suffix: 'ea' }
];

const fPercent = (val) => `${val.toFixed(1)}%`;

// 컴팩트 KPI 카드 (라이트 테마 최적화)
function CompactStat({ title, value, detail, icon: Icon, color, trend }) {
    const isPositive = trend >= 0;
    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        rose: 'bg-rose-50 text-rose-600',
        amber: 'bg-amber-50 text-amber-600',
        slate: 'bg-slate-100 text-slate-600',
        violet: 'bg-violet-50 text-violet-600',
        blue: 'bg-blue-50 text-blue-600'
    };

    return (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-all group">
            <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.slate} transition-colors group-hover:scale-110 duration-300`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-tight">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-black text-slate-900">{value}</h3>
                    {trend !== undefined && (
                        <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-500' : 'text-rose-500'}`}>
                            {isPositive ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                    )}
                </div>
                <p className="text-slate-400 text-[10px] mt-0.5">{detail}</p>
            </div>
        </div>
    );
}

export default function App() {
    const [selectedMonth, setSelectedMonth] = useState('2026-02');
    const [view, setView] = useState('dashboard');
    const [mainTab, setMainTab] = useState('current');
    const [analysisMode, setAnalysisMode] = useState('goal'); // goal, yoy, mom, cumulative, forecast
    const [metricType, setMetricType] = useState('amount');
    const [path, setPath] = useState([{ level: 'root', id: 'all', name: '전체' }]);
    const [amountUnit, setAmountUnit] = useState('1M');
    const [weightUnit, setWeightUnit] = useState('KG');
    const [showAmountDropdown, setShowAmountDropdown] = useState(false);
    const [showWeightDropdown, setShowWeightDropdown] = useState(false);
    const [fontFamily, setFontFamily] = useState('Gmarket'); // Default to Gmarket as requested

    // 전체 마스터 데이터 상태 관리 (초깃값 샘플 생성)
    const [masterData, setMasterData] = useState(() => generateFullDataset());

    // 최종 업데이트 시간 상태
    const [lastUpdated, setLastUpdated] = useState(() => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const mm = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const hh = String(now.getHours()).padStart(2, '0');
        const min = String(now.getMinutes()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
    });

    // 동적 매트릭 포맷터 (금액/중량 통합)
    const fMetric = (val) => {
        if (val === undefined || val === null) return '0';
        if (metricType === 'amount') {
            const config = CURRENCY_UNITS.find(u => u.key === amountUnit) || CURRENCY_UNITS[1];
            const converted = val / config.divisor;
            return `${converted.toLocaleString(undefined, { maximumFractionDigits: (converted >= 10 || amountUnit === '1') ? 0 : 1 })}${config.suffix}`;
        } else {
            const config = WEIGHT_UNITS.find(u => u.key === weightUnit) || WEIGHT_UNITS[0];
            const converted = val / config.divisor;
            return `${converted.toLocaleString(undefined, { maximumFractionDigits: converted >= 10 ? 0 : 2 })}${config.suffix}`;
        }
    };
    const fCurrency = fMetric;

    const formatDisplayMonth = (ym) => {
        const [y, m] = ym.split('-');
        return `${y}년 ${m.padStart(2, '0')}월`;
    };

    const bi = useMemo(() => {
        const [y, m] = selectedMonth.split('-').map(Number);
        const ymStr = `${y}${m.toString().padStart(2, '0')}`;

        // 전년 동월 계산
        const lyStr = `${y - 1}${m.toString().padStart(2, '0')}`;

        // 전월 계산
        let lmY = y, lmM = m - 1;
        if (lmM === 0) { lmY = y - 1; lmM = 12; }
        const lmStr = `${lmY}${lmM.toString().padStart(2, '0')}`;

        const actual = masterData.actual.filter(d => d['년도월'] === ymStr);
        const target = masterData.target.filter(d => d['년도월'] === ymStr);
        const lastYear = masterData.actual.filter(d => d['년도월'] === lyStr);
        const lastMonth = masterData.actual.filter(d => d['년도월'] === lmStr);

        return new SalesBI(actual, target, lastYear, lastMonth);
    }, [selectedMonth, masterData]);

    const summary = bi.getSummary();
    const currentView = path[path.length - 1];

    const drillDownData = useMemo(() => {
        let result = [];
        if (currentView.level === 'root') result = bi.getAggregatedByTeam();
        else if (currentView.level === 'team') result = bi.getAggregatedBySalesperson(currentView.name);
        else if (currentView.level === 'salesperson') result = bi.getAggregatedByCustomer(currentView.name);
        else if (currentView.level === 'customer') result = bi.getAggregatedByItem(currentView.name);

        // 모든 모드에서 공통으로 사용할 수 있도록 데이터 보강
        return result.map(item => {
            // metricType에 따라 기본 필드 값 매핑
            const activeActual = metricType === 'amount' ? item.actual : item.weight;
            const activeTarget = metricType === 'amount' ? item.target : (item.target * 0.0001); // 중량 목표는 시뮬레이션
            const activeLastYear = metricType === 'amount' ? item.lastYear : item.lastYearWeight;
            const activeLastMonth = metricType === 'amount' ? item.lastMonth : item.lastMonthWeight;
            const activeCumulativeActual = metricType === 'amount' ? item.cumulativeActual : item.cumulativeWeight;
            const activeCumulativeTarget = metricType === 'amount' ? item.cumulativeTarget : (item.cumulativeTarget * 0.0001);
            const activeForecast = metricType === 'amount' ? item.forecast : item.forecastWeight;

            const fAmt = activeForecast || (SETTINGS.currentBusinessDay > 0 ? (activeActual / SETTINGS.currentBusinessDay) * SETTINGS.businessDays['2026-02'] : 0);
            const fAch = activeTarget > 0 ? (fAmt / activeTarget) * 100 : 0;
            const ach = activeTarget > 0 ? (activeActual / activeTarget) * 100 : 0;

            return {
                ...item,
                // UI에서 공통으로 사용하는 alias 필드들
                actual: mainTab === 'expected' ? fAmt : activeActual,
                target: activeTarget,
                achievement: mainTab === 'expected' ? fAch : ach,
                lastYear: activeLastYear,
                lastMonth: activeLastMonth,
                cumulativeActual: activeCumulativeActual,
                cumulativeTarget: activeCumulativeTarget,
                forecastAmt: fAmt,
                forecastAchievement: fAch,
                yoy: activeLastYear > 0 ? ((activeActual - activeLastYear) / activeLastYear) * 100 : 0,
                mom: activeLastMonth > 0 ? ((activeActual - activeLastMonth) / activeLastMonth) * 100 : 0,
                progressGap: (mainTab === 'expected' ? fAch : ach) - ((SETTINGS.currentBusinessDay / SETTINGS.businessDays['2026-02']) * 100)
            };
        });
    }, [path, bi, mainTab, currentView, metricType]);

    const handleDrillDown = (item) => {
        let nextLevel = '';
        if (currentView.level === 'root') nextLevel = 'team';
        else if (currentView.level === 'team') nextLevel = 'salesperson';
        else if (currentView.level === 'salesperson') nextLevel = 'customer';
        else return;
        setPath([...path, { level: nextLevel, id: item.id, name: item.name }]);
    };

    const fontMap = {
        'Pretendard': 'font-style-Pretendard',
        'Gmarket': 'font-style-Gmarket',
        'IBM': 'font-style-IBM',
        'Nanum': 'font-style-Nanum',
        'Serif': 'font-style-Serif'
    };

    const iconMap = {
        dashboard: BarChart3,
        settings: Settings
    };

    // 엑셀 다운로드 (분석 데이터 요약 추출)
    const handleExport = () => {
        const timestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const wsData = drillDownData.map(item => ({
            '분석단위': item.name,
            '단위결과': metricType === 'amount' ? '금액' : '중량',
            '현실적': item.actual,
            '목표금액': item.target,
            '달성률(%)': item.achievement,
            '전년동기': item.lastYear,
            'YOY성장(%)': item.yoy,
            '전월실적': item.lastMonth,
            'MOM성장(%)': item.mom,
            '당월예상마감': item.forecastAmt,
            '예상달성률(%)': item.forecastAchievement,
            '마감진도격차(%)': item.progressGap
        }));

        const ws = window.XLSX.utils.json_to_sheet(wsData);
        // 컬럼 크기 약간 넓히기
        ws['!cols'] = Array(12).fill({ wch: 15 });
        const wb = window.XLSX.utils.book_new();
        window.XLSX.utils.book_append_sheet(wb, ws, `${selectedMonth} 분석결과`);

        // 가장 안정적인 다운로드 전용 라이브러리 활용
        const excelBuffer = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const blob = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(blob, 'Sales_Dashboard_Data.xlsx');
    };

    return (
        <div
            className={`min-h-screen bg-[#f8fafc] text-slate-600 flex flex-col md:flex-row overflow-x-hidden pb-20 md:pb-0 shadow-inner ${fontMap[fontFamily]}`}
        >
            {/* Sidebar - Desktop Only */}
            <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/60 flex-col py-10 z-50 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] px-6">
                {/* 로고 영역 - 엔터프라이즈 감성 */}
                <div className="flex items-center gap-4 px-2 mb-16">
                    <div className="flex flex-col justify-center">
                        <span className="text-xl font-black text-slate-900 tracking-tighter leading-none">영업 대시보드</span>
                    </div>
                </div>

                <nav className="flex-1">
                    <div className="space-y-2">
                        <SidebarIcon active={view === 'dashboard'} icon={iconMap.dashboard} label="매출 실적" onClick={() => setView('dashboard')} />
                        <SidebarIcon active={view === 'settings'} icon={iconMap.settings} label="설정" onClick={() => setView('settings')} />
                    </div>
                </nav>

                {/* 하단 미니 위젯/아이콘 (디테일 추가) */}
                <div className="pt-8 mt-8 border-t border-slate-100 px-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                            <Sparkles size={14} />
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[10px] font-black text-slate-800 truncate leading-tight tracking-tighter">Premium Plan</span>
                            <span className="text-[9px] font-bold text-slate-400">Enterprise AI</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* 메인 뷰포트 */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* 상단 통합 제어바 */}
                <header className="py-4 px-4 md:py-6 md:px-10 border-b border-slate-200 bg-white">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 md:gap-6 mb-2 md:mb-4">
                        <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-2 mb-2 md:mb-4">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.5)]" />
                                <span className="text-indigo-600 text-[10px] md:text-xs font-black uppercase tracking-widest">Sales Data Performance</span>
                            </div>
                            <h1 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter italic mb-2 md:mb-3 leading-tight">
                                {formatDisplayMonth(selectedMonth)} <span className={mainTab === 'expected' ? 'text-indigo-600' : 'text-emerald-500'}>
                                    {mainTab === 'expected' ? '예상마감 실적' : '매출 실적'}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs md:text-[11px] px-1 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5">
                                    <Clock size={12} className="text-indigo-400" />
                                    최종 업데이트: {lastUpdated}
                                </span>
                                <button onClick={handleExport} className="flex items-center gap-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white px-3 py-1.5 rounded-lg transition-all duration-300 border border-indigo-200 hover:border-indigo-600 ml-2 group">
                                    <Download size={14} className="group-hover:animate-bounce" />
                                    <span>엑셀 다운로드</span>
                                </button>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 shrink-0 w-full md:w-auto">
                            {/* 영업 진도 요약 미니 표 - 우측 배치 */}
                            <div className="overflow-x-auto no-scrollbar rounded-xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:border-indigo-500/30">
                                <table className="text-[10px] md:text-[11px] leading-tight min-w-full">
                                    <thead className="bg-slate-100 border-b border-slate-200">
                                        <tr className="text-slate-500 font-bold uppercase tracking-tighter whitespace-nowrap">
                                            <th className="px-3 md:px-5 py-2 md:py-2.5 border-r border-slate-200">영업일</th>
                                            <th className="px-3 md:px-5 py-2 md:py-2.5 border-r border-slate-200">총 영업일</th>
                                            <th className="px-3 md:px-5 py-2 md:py-2.5 text-indigo-600 font-black">진도율</th>
                                            <th className="px-3 md:px-5 py-2 md:py-2.5">1일 평균</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-center font-black">
                                        <tr>
                                            <td className="px-3 md:px-5 py-2 md:py-3 text-slate-900 text-lg md:text-xl border-r border-slate-200">{SETTINGS.currentBusinessDay}</td>
                                            <td className="px-3 md:px-5 py-2 md:py-3 text-slate-500 text-lg md:text-xl border-r border-slate-200">{SETTINGS.businessDays['2026-02']}</td>
                                            <td className="px-3 md:px-5 py-2 md:py-3 text-indigo-600 border-r border-slate-200 text-xl md:text-2xl tracking-tighter">{((SETTINGS.currentBusinessDay / SETTINGS.businessDays['2026-02']) * 100).toFixed(1)}%</td>
                                            <td className="px-3 md:px-5 py-2 md:py-3 text-slate-400 text-[10px] md:text-sm font-mono">{(100 / SETTINGS.businessDays['2026-02']).toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col gap-3 shrink-0 w-full sm:w-[320px] bg-slate-50/50 p-3 rounded-[24px] border border-slate-200/60 shadow-inner">
                                {/* 헤더: 분석 조건 설정 (아이콘 추가) */}
                                <div className="flex items-center gap-2 px-2 mb-1">
                                    <Filter size={12} className="text-indigo-500" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Analysis Filters</span>
                                </div>

                                {/* 월 선택 드롭다운 (이동됨) */}
                                <div className="relative group">
                                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-500 group-hover:scale-110 transition-transform">
                                        <Calendar size={14} />
                                    </div>
                                    <select
                                        value={selectedMonth}
                                        onChange={(e) => setSelectedMonth(e.target.value)}
                                        className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black text-slate-700 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none cursor-pointer shadow-sm appearance-none transition-all"
                                    >
                                        <optgroup label="2026년">
                                            <option value="2026-02">2026년 02월</option>
                                            <option value="2026-01">2026년 01월</option>
                                        </optgroup>
                                        <optgroup label="2025년">
                                            {Array.from({ length: 12 }, (_, i) => 12 - i).map(m => (
                                                <option key={m} value={`2025-${m.toString().padStart(2, '0')}`}>2025년 {m.toString().padStart(2, '0')}월</option>
                                            ))}
                                        </optgroup>
                                    </select>
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                        <ChevronDown size={12} />
                                    </div>
                                </div>

                                {/* 실적 모드 토글 */}
                                <div className="bg-slate-200/50 p-1 rounded-xl">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setMainTab('current')}
                                            className={`flex-1 px-4 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap ${mainTab === 'current' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            현재실적
                                        </button>
                                        <button
                                            onClick={() => setMainTab('expected')}
                                            className={`flex-1 px-4 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap ${mainTab === 'expected' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            예상마감
                                        </button>
                                    </div>
                                </div>

                                {/* 기준 모드 토글 (디자인 통일) */}
                                <div className="bg-slate-200/50 p-1 rounded-xl">
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => setMetricType('amount')}
                                            className={`flex-1 px-4 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap ${metricType === 'amount' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            금액 기준
                                        </button>
                                        <button
                                            onClick={() => setMetricType('weight')}
                                            className={`flex-1 px-4 py-1.5 rounded-lg text-[11px] font-black transition-all whitespace-nowrap ${metricType === 'weight' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                                        >
                                            중량 기준
                                        </button>
                                    </div>
                                </div>

                                {/* 하단: 단위 구성 (2열 배치) */}
                                <div className="grid grid-cols-2 gap-3">
                                    {/* 금액 단위 블록 */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMetricType('amount');
                                                setShowAmountDropdown(!showAmountDropdown);
                                                setShowWeightDropdown(false);
                                            }}
                                            className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md bg-white border text-[9px] font-bold transition-all ${metricType === 'amount' ? 'border-indigo-500/30 text-indigo-600' : 'border-slate-200 text-slate-400'}`}
                                        >
                                            <span className="truncate">{CURRENCY_UNITS.find(u => u.key === amountUnit)?.label}</span>
                                            <ChevronDown size={8} className={`text-indigo-500 transition-transform ${showAmountDropdown ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showAmountDropdown && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] py-1">
                                                {CURRENCY_UNITS.map(unit => (
                                                    <button
                                                        key={unit.key}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setAmountUnit(unit.key);
                                                            setMetricType('amount');
                                                            setShowAmountDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-1.5 text-[10px] font-bold transition-colors ${amountUnit === unit.key ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                                    >
                                                        {unit.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* 중량 단위 블록 */}
                                    <div className="relative">
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setMetricType('weight');
                                                setShowWeightDropdown(!showWeightDropdown);
                                                setShowAmountDropdown(false);
                                            }}
                                            className={`flex items-center justify-between w-full px-2 py-1.5 rounded-md bg-white border text-[9px] font-bold transition-all ${metricType === 'weight' ? 'border-indigo-500/30 text-indigo-600' : 'border-slate-200 text-slate-400'}`}
                                        >
                                            <span className="truncate">{WEIGHT_UNITS.find(u => u.key === weightUnit)?.label}</span>
                                            <ChevronDown size={8} className={`text-indigo-500 transition-transform ${showWeightDropdown ? 'rotate-180' : ''}`} />
                                        </button>
                                        {showWeightDropdown && (
                                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-xl z-[100] py-1">
                                                {WEIGHT_UNITS.map(unit => (
                                                    <button
                                                        key={unit.key}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            setWeightUnit(unit.key);
                                                            setMetricType('weight');
                                                            setShowWeightDropdown(false);
                                                        }}
                                                        className={`w-full text-left px-3 py-1.5 text-[10px] font-bold transition-colors ${weightUnit === unit.key ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                                    >
                                                        {unit.label}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {path.length > 1 ? (
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 bg-slate-50 px-4 rounded-xl border border-slate-200 self-start mx-10 mt-[-20px] mb-6 shadow-sm">
                            {path.map((p, i) => (
                                <button key={i} onClick={() => setPath(path.slice(0, i + 1))} className={`text-[11px] font-bold px-3 py-1 transition-all flex items-center gap-2 ${i === path.length - 1 ? 'text-indigo-600' : 'text-slate-400 hover:text-slate-600'}`}>
                                    {p.name}
                                    {i < path.length - 1 && <ChevronRight size={10} className="text-slate-300" />}
                                </button>
                            ))}
                        </div>
                    ) : null}
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 bg-[#f8fafc] md:max-h-screen">
                    {view === 'settings' ? <SettingsView setMasterData={setMasterData} masterData={masterData} setLastUpdated={setLastUpdated} fontFamily={fontFamily} setFontFamily={setFontFamily} fontMap={fontMap} /> : (
                        <div className="max-w-[1600px] mx-auto space-y-4">
                            {/* 분석 모드 탭 내비게이션 (임원진용 대형 탭) */}
                            <div className="overflow-x-auto no-scrollbar pb-1">
                                <div className="flex bg-white p-1.5 rounded-2xl border border-slate-200 w-fit shadow-sm min-w-full sm:min-w-0">
                                    {[
                                        { id: 'goal', name: '목표대비' },
                                        { id: 'yoy', name: '전년대비' },
                                        { id: 'mom', name: '전월대비' },
                                        { id: 'cumulative', name: '누계' },
                                        { id: 'forecast', name: '예상마감' }
                                    ].map(tab => (
                                        <button
                                            key={tab.id}
                                            onClick={() => setAnalysisMode(tab.id)}
                                            className={`px-4 md:px-10 py-2.5 md:py-3.5 rounded-xl text-xs md:text-base font-black transition-all whitespace-nowrap ${analysisMode === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {tab.name}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* 핵심 KPI 섹션 (모드별 동적 변경) */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
                                {analysisMode === 'goal' && (
                                    <>
                                        <CompactStat title="당월 목표" value={fCurrency(summary.target)} icon={Target} color="slate" />
                                        <CompactStat title="당월 실적" value={fCurrency(summary.actual)} icon={DollarSign} color="indigo" />
                                        <CompactStat title="현재 달성률" value={fPercent(summary.achievementRate)} icon={Zap} color="emerald" trend={summary.achievementRate} />
                                        <CompactStat title="목표 대비 격차" value={fCurrency(summary.actual - summary.target)} detail={`진도율(${fPercent(summary.progressRate)}) 대비 ${fPercent(summary.progressGap)}`} icon={TrendingUp} color={summary.progressGap >= 0 ? 'emerald' : 'rose'} />
                                    </>
                                )}
                                {analysisMode === 'yoy' && (
                                    <>
                                        <CompactStat title="전년 동기 실적" value={fCurrency(summary.lastYearActual)} icon={Calendar} color="slate" />
                                        <CompactStat title="당월 실적" value={fCurrency(summary.actual)} icon={DollarSign} color="indigo" />
                                        <CompactStat title="전년 대비 성장률" value={fPercent(summary.yoyGrowth)} icon={TrendingUp} color="amber" trend={summary.yoyGrowth} />
                                        <CompactStat title="성장액" value={fCurrency(summary.actual - summary.lastYearActual)} detail="vs 전년 동기" icon={Scale} color={summary.yoyGrowth >= 0 ? 'emerald' : 'rose'} />
                                    </>
                                )}
                                {analysisMode === 'mom' && (
                                    <>
                                        <CompactStat title="본 전월 실적" value={fCurrency(summary.lastMonthActual)} icon={Calendar} color="slate" />
                                        <CompactStat title="당월 실적" value={fCurrency(summary.actual)} icon={DollarSign} color="indigo" />
                                        <CompactStat title="전월 대비 성장률" value={fPercent(summary.momGrowth)} icon={TrendingUp} color="blue" trend={summary.momGrowth} />
                                        <CompactStat title="성장액" value={fCurrency(summary.actual - summary.lastMonthActual)} detail="vs 전월" icon={Scale} color={summary.momGrowth >= 0 ? 'emerald' : 'rose'} />
                                    </>
                                )}
                                {analysisMode === 'cumulative' && (
                                    <>
                                        <CompactStat title="연간 누계 목표" value={fCurrency(summary.cumulativeTarget)} icon={Target} color="slate" />
                                        <CompactStat title="연간 누계 실적" value={fCurrency(summary.cumulativeActual)} icon={DollarSign} color="indigo" />
                                        <CompactStat title="누계 달성률" value={fPercent(summary.cumulativeAchievement)} icon={Zap} color="violet" trend={summary.cumulativeAchievement} />
                                        <CompactStat title="누계 기준 전년성장" value="+15.4%" detail="26년 YTD vs 25년 YTD" icon={TrendingUp} color="emerald" />
                                    </>
                                )}
                                {analysisMode === 'forecast' && (
                                    <>
                                        <CompactStat title="마감일 기준 목표" value={fCurrency(summary.target)} icon={Target} color="slate" />
                                        <CompactStat title="마감 예상 실적" value={fCurrency(summary.forecast)} icon={Zap} color="indigo" />
                                        <CompactStat title="예상 달성률" value={fPercent(summary.forecast / summary.target * 100)} icon={Target} color="emerald" trend={(summary.forecast / summary.target * 100) - 100} />
                                        <CompactStat title="예상 달성 격차" value={fCurrency(summary.forecast - summary.target)} detail="마감 시점 과부족" icon={Scale} color={summary.forecast >= summary.target ? 'emerald' : 'rose'} />
                                    </>
                                )}
                            </div>

                            {/* 메인 대시보드 그리드 */}
                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                {/* 좌측 분석 섹션 (차트 + 테이블) */}
                                <div className="xl:col-span-3 space-y-6">
                                    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                <TrendingUp size={16} className="text-indigo-600" />
                                                {analysisMode === 'goal' ? '목표 대비 달성률 집계' :
                                                    analysisMode === 'yoy' ? '전년 대비 성장률 집계' :
                                                        analysisMode === 'mom' ? '전월 대비 성장률 집계' : '누계 실적 집계'}
                                            </h3>
                                            <div className="flex bg-slate-100 p-0.5 rounded-lg scale-90 border border-slate-200">
                                                <button onClick={() => setMetricType('amount')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${metricType === 'amount' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>금액</button>
                                                <button onClick={() => setMetricType('weight')} className={`px-3 py-1 rounded-md text-[10px] font-bold transition-all ${metricType === 'weight' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>중량</button>
                                            </div>
                                        </div>
                                        <div className="p-6 h-[340px]">
                                            <ResponsiveContainer>
                                                <BarChart data={drillDownData} onClick={(data) => data && handleDrillDown(data.activePayload[0].payload)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} dy={10} />
                                                    <YAxis stroke="#64748b" fontSize={9} tickLine={false} axisLine={false} unit="%" />
                                                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                                    <Bar dataKey={analysisMode === 'goal' ? 'achievement' :
                                                        analysisMode === 'yoy' ? 'yoy' :
                                                            analysisMode === 'mom' ? 'mom' :
                                                                analysisMode === 'forecast' ? 'forecastAchievement' : 'achievement'}
                                                        name={analysisMode === 'goal' ? '달성률' : analysisMode === 'forecast' ? '예상달성률' : '성장률'}
                                                        radius={[8, 8, 0, 0]} barSize={40} cursor="pointer">
                                                        {drillDownData.map((e, i) => (
                                                            <Cell key={i} fill={TEAM_COLORS[e.name]?.main || TEAM_COLORS['전체'].main} opacity={0.8} />
                                                        ))}
                                                        <LabelList
                                                            dataKey={analysisMode === 'goal' ? 'progressGap' :
                                                                analysisMode === 'yoy' ? 'yoy' :
                                                                    analysisMode === 'mom' ? 'mom' :
                                                                        analysisMode === 'forecast' ? 'forecastAchievement' : 'achievement'}
                                                            position="top"
                                                            content={props => <CustomLabel {...props} mainTab={mainTab} analysisMode={analysisMode} />}
                                                        />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>

                                    {/* 상세 데이터 테이블 */}
                                    <div className="bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm">
                                        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/50">
                                            <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Detail Breakdown</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-[11px] table-fixed">
                                                <thead>
                                                    <tr className="text-slate-500 font-bold border-b border-slate-100 bg-slate-50/30 text-[10px]">
                                                        <th className="py-3 px-6 w-1/4">구분</th>
                                                        {analysisMode === 'goal' ? (
                                                            <>
                                                                <th className="py-3 text-right">실적</th>
                                                                <th className="py-3 text-right">목표</th>
                                                                <th className="py-3 text-center w-24">달성률</th>
                                                                <th className="py-3 pr-6 text-right">진도차이</th>
                                                            </>
                                                        ) : analysisMode === 'yoy' ? (
                                                            <>
                                                                <th className="py-3 text-right">당월실적</th>
                                                                <th className="py-3 text-right">전년실적</th>
                                                                <th className="py-3 text-center w-24">성장률(YoY)</th>
                                                                <th className="py-3 pr-6 text-right">성장액</th>
                                                            </>
                                                        ) : analysisMode === 'mom' ? (
                                                            <>
                                                                <th className="py-3 text-right">당월실적</th>
                                                                <th className="py-3 text-right">전월실적</th>
                                                                <th className="py-3 text-center w-24">성장률(MoM)</th>
                                                                <th className="py-3 pr-6 text-right">성장액</th>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <th className="py-3 text-right">누계실적</th>
                                                                <th className="py-3 text-right">누계목표</th>
                                                                <th className="py-3 text-center w-24">누계달성률</th>
                                                                <th className="py-3 pr-6 text-right">누계격차</th>
                                                            </>
                                                        )}
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {drillDownData.map((item, i) => (
                                                        <tr key={i} onClick={() => handleDrillDown(item)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                                            <td className="py-4 px-6 font-black text-slate-800 group-hover:text-indigo-600 transition-colors uppercase tracking-tight truncate">
                                                                <span className="inline-block w-1.5 h-4 rounded-full mr-3" style={{ background: TEAM_COLORS[item.name]?.main || '#e2e8f0' }} />
                                                                {item.name}
                                                            </td>
                                                            <td className="py-4 font-mono text-slate-700 text-right">
                                                                {fCurrency(analysisMode === 'cumulative' ? item.cumulativeActual : analysisMode === 'forecast' ? item.forecastAmt : item.actual)}
                                                            </td>
                                                            <td className="py-4 font-mono text-slate-400 text-right">
                                                                {fCurrency(analysisMode === 'yoy' ? item.lastYear : analysisMode === 'mom' ? item.lastMonth : analysisMode === 'cumulative' ? item.cumulativeTarget : item.target)}
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="font-bold text-slate-900">
                                                                    {fPercent(analysisMode === 'yoy' ? item.yoy : analysisMode === 'mom' ? item.mom : analysisMode === 'cumulative' ? (item.cumulativeActual / (item.cumulativeTarget || 1) * 100) : analysisMode === 'forecast' ? item.forecastAchievement : item.achievement)}
                                                                </span>
                                                            </td>
                                                            <td className={`py-4 pr-6 font-mono text-right font-black ${item.progressGap >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                                                {analysisMode === 'goal' ? (item.progressGap > 0 ? `+${item.progressGap.toFixed(1)}%p` : `${item.progressGap.toFixed(1)}%p`) :
                                                                    analysisMode === 'yoy' ? fCurrency(item.actual - item.lastYear) :
                                                                        analysisMode === 'mom' ? fCurrency(item.actual - item.lastMonth) :
                                                                            analysisMode === 'forecast' ? fCurrency(item.forecastAmt - item.target) : fCurrency(item.cumulativeActual - item.cumulativeTarget)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>

                                {/* 우측 위젯 컬럼 */}
                                <div className="space-y-6">
                                    {/* 점유율 위젯 */}
                                    <div className="bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm">
                                        <h3 className="text-xs font-black text-slate-800 italic mb-6">Market Share</h3>
                                        <div className="h-[200px]">
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie data={drillDownData.slice(0, 5)} dataKey="actual" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={8} stroke="#fff" strokeWidth={2}>
                                                        {drillDownData.map((e, i) => <Cell key={i} fill={TEAM_COLORS[e.name]?.main || '#e2e8f0'} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#fff', fontSize: '10px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-2.5 mt-4">
                                            {drillDownData.slice(0, 4).map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-[10px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: TEAM_COLORS[item.name]?.main || '#e2e8f0' }} />
                                                        <span className="font-bold text-slate-400">{item.name}</span>
                                                    </div>
                                                    <span className="font-black text-slate-800">{((item.actual / summary.actual) * 100).toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 기업 연간 목표 위젯 - 라이트 테마 최적화 */}
                                    <div className="bg-white border border-slate-200 rounded-[24px] p-6 text-slate-800 relative overflow-hidden group shadow-sm hover:shadow-md transition-all">
                                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                                        <Globe size={40} className="absolute bottom-2 right-2 text-indigo-100" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Company Annual Goal</h4>
                                        <p className="text-2xl font-black tracking-tighter text-slate-900 mb-4">Target 2026</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span className="text-slate-500">Yearly Progress</span>
                                                <span className="text-indigo-600">31.4%</span>
                                            </div>
                                            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-600 rounded-full shadow-lg shadow-indigo-600/30" style={{ width: '31.4%' }} />
                                            </div>
                                        </div>
                                    </div>

                                    <Quote />
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-[24px] p-2.5 flex items-center justify-around shadow-2xl z-50 ring-1 ring-slate-900/5">
                    <SidebarIcon active={view === 'dashboard'} icon={BarChart3} label="매출 실적" onClick={() => setView('dashboard')} color="indigo" />
                    <SidebarIcon active={view === 'settings'} icon={Settings} label="설정" onClick={() => setView('settings')} color="slate" />
                </nav>
            </div>
        </div>
    );
}

function SidebarIcon({ active, icon: Icon, label, onClick }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-4 w-full px-4 py-4 rounded-[22px] transition-all duration-300 group relative ${active
                ? 'bg-white shadow-[0_10px_25px_-4px_rgba(99,102,241,0.12)] ring-1 ring-slate-100'
                : 'text-slate-400 hover:text-slate-900 hover:bg-slate-50/50'
                }`}
        >
            <div className={`p-2.5 rounded-[16px] transition-all duration-500 shadow-sm ${active
                ? 'bg-gradient-to-br from-indigo-500 to-indigo-700 text-white shadow-lg shadow-indigo-500/40 scale-110'
                : 'bg-slate-50 text-slate-400 group-hover:bg-white group-hover:text-indigo-500 group-hover:shadow-md'
                }`}>
                <Icon size={20} />
            </div>
            <span className={`text-[14px] font-bold tracking-tight transition-colors whitespace-nowrap ${active ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-700'}`}>
                {label}
            </span>
            {active && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.8)]" />
            )}

            {/* Hover Decorator */}
            {!active && (
                <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    className="absolute left-0 w-1 h-6 bg-indigo-500/20 rounded-r-full"
                />
            )}
        </button>
    );
}

// 차트 내부 라벨
function CustomLabel({ x, y, width, value, mainTab, analysisMode }) {
    if (value === undefined) return null;
    const isNeg = parseFloat(value) < 0;
    const label = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    const unit = analysisMode === 'goal' ? '%p' : '%';
    return (
        <text x={x + width / 2} y={y - 12} fill={isNeg ? '#f43f5e' : '#10b981'} textAnchor="middle" fontSize={10} fontWeight="900">
            {label}{unit}
        </text>
    );
}
