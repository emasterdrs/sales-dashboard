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
    ChevronDown
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
import { motion, AnimatePresence } from 'framer-motion';
import { generateStandardSalesData, generateTargetData } from './data/generateSalesData';
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

// 컴팩트 KPI 카드
function CompactStat({ title, value, detail, icon: Icon, color, trend }) {
    const isPositive = trend >= 0;
    return (
        <div className="bg-[#0f1220] border border-white/5 rounded-2xl p-4 flex items-center gap-4 hover:border-white/10 transition-all">
            <div className={`p-2.5 rounded-xl bg-${color}-500/10 text-${color}-400`}>
                <Icon size={18} />
            </div>
            <div>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-tight">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-lg font-black text-white">{value}</h3>
                    {trend !== undefined && (
                        <span className={`text-[10px] font-bold ${isPositive ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {isPositive ? '+' : ''}{trend.toFixed(1)}%
                        </span>
                    )}
                </div>
                <p className="text-slate-600 text-[10px] mt-0.5">{detail}</p>
            </div>
        </div>
    );
}

export default function App() {
    const [view, setView] = useState('dashboard');
    const [mainTab, setMainTab] = useState('current');
    const [analysisMode, setAnalysisMode] = useState('goal'); // goal, yoy, mom, cumulative, forecast
    const [metricType, setMetricType] = useState('amount');
    const [path, setPath] = useState([{ level: 'root', id: 'all', name: '전체' }]);
    const [amountUnit, setAmountUnit] = useState('1M');
    const [weightUnit, setWeightUnit] = useState('KG');

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
    // 기존 호환성을 위해 유지
    const fCurrency = fMetric;

    const bi = useMemo(() => {
        const actual = generateStandardSalesData(2026, 2, 9200000000);
        const target = generateTargetData(2026, 2, 12000000000);
        const lastYear = generateStandardSalesData(2025, 2, 7800000000);
        const lastMonth = generateStandardSalesData(2026, 1, 8500000000);
        return new SalesBI(actual, target, lastYear, lastMonth);
    }, []);

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

    return (
        <div className="min-h-screen bg-[#070914] text-slate-300 flex flex-col md:flex-row overflow-x-hidden font-sans pb-20 md:pb-0">
            {/* Sidebar - Desktop Only */}
            <aside className="hidden md:flex w-16 bg-[#0a0c1a] border-r border-white/5 flex-col items-center py-6 z-50 h-screen sticky top-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white mb-10 shadow-lg shadow-indigo-600/20">
                    <Zap size={20} fill="currentColor" />
                </div>
                <div className="flex-1 space-y-8">
                    <SidebarIcon active={view === 'dashboard'} icon={LayoutDashboard} onClick={() => setView('dashboard')} />
                    <SidebarIcon active={view === 'receivables'} icon={CreditCard} onClick={() => setView('receivables')} />
                    <SidebarIcon active={view === 'settings'} icon={Settings} onClick={() => setView('settings')} />
                </div>
            </aside>

            {/* 메인 뷰포트 - 스크롤 억제 및 그리드 배치 */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                {/* 상단 통합 제어바 */}
                <header className="py-6 px-4 md:py-10 md:px-10 border-b border-white/5 bg-gradient-to-b from-[#0a0c1a] to-transparent">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 md:gap-8 mb-6 md:mb-8">
                        <div className="flex-1 min-w-0 w-full">
                            <div className="flex items-center gap-2 mb-2 md:mb-4">
                                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                                <span className="text-indigo-400 text-[10px] md:text-xs font-black uppercase tracking-widest">Live Analysis System</span>
                            </div>
                            <h1 className="text-2xl md:text-5xl font-black text-white tracking-tighter italic mb-2 md:mb-3 leading-tight">
                                2026년 2월 <span className={mainTab === 'expected' ? 'text-indigo-400' : 'text-emerald-400'}>
                                    {mainTab === 'expected' ? '예상마감 실적' : '매출 실적'}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs md:text-sm px-1">
                                <span className="flex items-center gap-1.5"><Calendar size={14} className="text-indigo-400 md:size-4" /> 매출 기준일: 2026.02.24</span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 shrink-0 w-full md:w-auto">
                            {/* 영업 진도 요약 미니 표 - 우측 배치 */}
                            <div className="overflow-x-auto no-scrollbar rounded-xl border border-white/10 bg-[#0f1220]/80 shadow-2xl transition-all hover:border-indigo-500/30">
                                <table className="text-[10px] md:text-[11px] leading-tight min-w-full">
                                    <thead className="bg-white/[0.05] border-b border-white/10">
                                        <tr className="text-slate-400 font-bold uppercase tracking-tighter whitespace-nowrap">
                                            <th className="px-3 md:px-5 py-2 md:py-2.5 border-r border-white/10">영업일</th>
                                            <th className="px-3 md:px-5 py-2 md:py-2.5 border-r border-white/10">총 영업일</th>
                                            <th className="px-3 md:px-5 py-2 md:py-2.5 text-indigo-300 font-black">진도율</th>
                                            <th className="px-3 md:px-5 py-2 md:py-2.5">1일 평균</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-center font-black">
                                        <tr>
                                            <td className="px-3 md:px-5 py-2 md:py-3 text-white text-lg md:text-xl border-r border-white/10">{SETTINGS.currentBusinessDay}</td>
                                            <td className="px-3 md:px-5 py-2 md:py-3 text-slate-300 text-lg md:text-xl border-r border-white/10">{SETTINGS.businessDays['2026-02']}</td>
                                            <td className="px-3 md:px-5 py-2 md:py-3 text-indigo-400 border-r border-white/10 text-xl md:text-2xl tracking-tighter">{((SETTINGS.currentBusinessDay / SETTINGS.businessDays['2026-02']) * 100).toFixed(1)}%</td>
                                            <td className="px-3 md:px-5 py-2 md:py-3 text-slate-400 text-[10px] md:text-sm font-mono">{(100 / SETTINGS.businessDays['2026-02']).toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex flex-col sm:flex-row bg-[#0f1220] p-1.5 rounded-2xl border border-white/10 shadow-2xl gap-3 items-stretch sm:items-center">
                                <div className="flex bg-white/5 p-1 rounded-xl flex-1">
                                    <button
                                        onClick={() => setMainTab('current')}
                                        className={`flex-1 px-4 md:px-8 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-black transition-all ${mainTab === 'current' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        현재실적
                                    </button>
                                    <button
                                        onClick={() => setMainTab('expected')}
                                        className={`flex-1 px-4 md:px-8 py-2 md:py-2.5 rounded-lg text-xs md:text-sm font-black transition-all ${mainTab === 'expected' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-400 hover:text-slate-200'}`}
                                    >
                                        예상마감
                                    </button>
                                </div>

                                <div className="flex flex-col xs:flex-row items-center gap-2 flex-1">
                                    {/* 금액 선택 그룹 */}
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[100px] w-full">
                                        <button
                                            onClick={() => setMetricType('amount')}
                                            className={`w-full px-4 md:px-6 py-2 rounded-lg text-xs font-black transition-all border ${metricType === 'amount' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-lg' : 'text-slate-500 border-transparent hover:text-slate-400'}`}
                                        >
                                            금액 기준
                                        </button>
                                        <div className={`relative group transition-all ${metricType === 'amount' ? 'opacity-100' : 'opacity-0 invisible'}`}>
                                            <button className="flex items-center justify-between w-full px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:border-indigo-500/30 hover:text-white transition-all">
                                                <span>{CURRENCY_UNITS.find(u => u.key === amountUnit)?.label}</span>
                                                <ChevronDown size={10} className="text-indigo-400 group-hover:rotate-180 transition-transform" />
                                            </button>
                                            <div className="absolute top-full left-0 w-full mt-1 bg-[#0a0c1a] border border-white/10 rounded-lg shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-[100] py-1">
                                                {CURRENCY_UNITS.map(unit => (
                                                    <button
                                                        key={unit.key}
                                                        onClick={() => setAmountUnit(unit.key)}
                                                        className={`w-full text-left px-3 py-1.5 text-[10px] font-bold transition-colors ${amountUnit === unit.key ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                                    >
                                                        {unit.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    {/* 중량 선택 그룹 */}
                                    <div className="flex flex-col gap-1.5 flex-1 min-w-[100px] w-full">
                                        <button
                                            onClick={() => setMetricType('weight')}
                                            className={`w-full px-4 md:px-6 py-2 rounded-lg text-xs font-black transition-all border ${metricType === 'weight' ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50 shadow-lg' : 'text-slate-500 border-transparent hover:text-slate-400'}`}
                                        >
                                            중량 기준
                                        </button>
                                        <div className={`relative group transition-all ${metricType === 'weight' ? 'opacity-100' : 'opacity-0 invisible'}`}>
                                            <button className="flex items-center justify-between w-full px-3 py-1.5 rounded-md bg-white/5 border border-white/5 text-[10px] font-bold text-slate-400 hover:border-indigo-500/30 hover:text-white transition-all">
                                                <span>{WEIGHT_UNITS.find(u => u.key === weightUnit)?.label}</span>
                                                <ChevronDown size={10} className="text-indigo-400 group-hover:rotate-180 transition-transform" />
                                            </button>
                                            <div className="absolute top-full left-0 w-full mt-1 bg-[#0a0c1a] border border-white/10 rounded-lg shadow-2xl invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-all z-[100] py-1">
                                                {WEIGHT_UNITS.map(unit => (
                                                    <button
                                                        key={unit.key}
                                                        onClick={() => setWeightUnit(unit.key)}
                                                        className={`w-full text-left px-3 py-1.5 text-[10px] font-bold transition-colors ${weightUnit === unit.key ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
                                                    >
                                                        {unit.label}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {path.length > 1 && (
                        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2 bg-white/5 px-4 rounded-xl border border-white/5 self-start">
                            {path.map((p, i) => (
                                <button key={i} onClick={() => setPath(path.slice(0, i + 1))} className={`text-[11px] font-bold px-3 py-1 color transition-all flex items-center gap-2 ${i === path.length - 1 ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}>
                                    {p.name}
                                    {i < path.length - 1 && <ChevronRight size={10} className="text-slate-700" />}
                                </button>
                            ))}
                        </div>
                    )}
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-6 bg-[#070914] md:max-h-screen">
                    {view === 'settings' ? <SettingsView /> : (
                        <div className="max-w-[1600px] mx-auto space-y-8">
                            {/* 분석 모드 탭 내비게이션 (임원진용 대형 탭) */}
                            <div className="overflow-x-auto no-scrollbar pb-1">
                                <div className="flex bg-[#0a0c1a] p-1 rounded-2xl border border-white/10 w-fit shadow-2xl min-w-full sm:min-w-0">
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
                                            className={`px-4 md:px-10 py-2.5 md:py-3.5 rounded-xl text-xs md:text-base font-black transition-all whitespace-nowrap ${analysisMode === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/40' : 'text-slate-500 hover:text-slate-300'}`}
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
                                    <div className="bg-[#0a0c1a] border border-white/5 rounded-[24px] overflow-hidden">
                                        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
                                            <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                                                <TrendingUp size={16} className="text-indigo-400" />
                                                {analysisMode === 'goal' ? '목표 대비 달성률 집계' :
                                                    analysisMode === 'yoy' ? '전년 대비 성장률 집계' :
                                                        analysisMode === 'mom' ? '전월 대비 성장률 집계' : '누계 실적 집계'}
                                            </h3>
                                            <div className="flex bg-[#0f1220] p-0.5 rounded-lg scale-90">
                                                <button onClick={() => setMetricType('amount')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${metricType === 'amount' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-600'}`}>금액</button>
                                                <button onClick={() => setMetricType('weight')} className={`px-3 py-1 rounded-md text-[10px] font-bold ${metricType === 'weight' ? 'bg-indigo-500/10 text-indigo-400' : 'text-slate-600'}`}>중량</button>
                                            </div>
                                        </div>
                                        <div className="p-6 h-[340px]">
                                            <ResponsiveContainer>
                                                <BarChart data={drillDownData} onClick={(data) => data && handleDrillDown(data.activePayload[0].payload)}>
                                                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.02)" vertical={false} />
                                                    <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight={800} tickLine={false} axisLine={false} dy={10} />
                                                    <YAxis stroke="#475569" fontSize={9} tickLine={false} axisLine={false} unit="%" />
                                                    <Tooltip contentStyle={{ backgroundColor: '#0a0c1a', border: '1px solid #1e293b', borderRadius: '12px', fontSize: '11px' }} />
                                                    <Bar dataKey={analysisMode === 'goal' ? 'achievement' :
                                                        analysisMode === 'yoy' ? 'yoy' :
                                                            analysisMode === 'mom' ? 'mom' :
                                                                analysisMode === 'forecast' ? 'forecastAchievement' : 'achievement'}
                                                        name={analysisMode === 'goal' ? '달성률' : analysisMode === 'forecast' ? '예상달성률' : '성장률'}
                                                        radius={[8, 8, 0, 0]} barSize={40} cursor="pointer">
                                                        {drillDownData.map((e, i) => (
                                                            <Cell key={i} fill={TEAM_COLORS[e.name]?.main || TEAM_COLORS['전체'].main} opacity={0.9} />
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
                                    <div className="bg-[#0a0c1a] border border-white/5 rounded-[24px] overflow-hidden">
                                        <div className="px-6 py-4 border-b border-white/5 bg-white/[0.01]">
                                            <h3 className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Detail Breakdown</h3>
                                        </div>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-left text-[11px] table-fixed">
                                                <thead>
                                                    <tr className="text-slate-600 font-bold border-b border-white/5 bg-[#0f1220]/30 text-[10px]">
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
                                                <tbody className="divide-y divide-white/[0.03]">
                                                    {drillDownData.map((item, i) => (
                                                        <tr key={i} onClick={() => handleDrillDown(item)} className="hover:bg-indigo-500/[0.03] transition-colors cursor-pointer group">
                                                            <td className="py-4 px-6 font-black text-white group-hover:text-indigo-400 transition-colors uppercase tracking-tight truncate">
                                                                <span className="inline-block w-1 h-3 rounded-full mr-3" style={{ background: TEAM_COLORS[item.name]?.main || '#334155' }} />
                                                                {item.name}
                                                            </td>
                                                            <td className="py-4 font-mono text-white text-right">
                                                                {fCurrency(analysisMode === 'cumulative' ? item.cumulativeActual : analysisMode === 'forecast' ? item.forecastAmt : item.actual)}
                                                            </td>
                                                            <td className="py-4 font-mono text-slate-500 text-right">
                                                                {fCurrency(analysisMode === 'yoy' ? item.lastYear : analysisMode === 'mom' ? item.lastMonth : analysisMode === 'cumulative' ? item.cumulativeTarget : item.target)}
                                                            </td>
                                                            <td className="py-4 px-4 text-center">
                                                                <span className="font-black text-white">
                                                                    {fPercent(analysisMode === 'yoy' ? item.yoy : analysisMode === 'mom' ? item.mom : analysisMode === 'cumulative' ? (item.cumulativeActual / (item.cumulativeTarget || 1) * 100) : analysisMode === 'forecast' ? item.forecastAchievement : item.achievement)}
                                                                </span>
                                                            </td>
                                                            <td className={`py-4 pr-6 font-mono text-right font-black ${item.progressGap >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
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
                                    <div className="bg-[#0a0c1a] border border-white/5 rounded-[24px] p-6 shadow-xl">
                                        <h3 className="text-xs font-black text-white italic mb-6">Market Share</h3>
                                        <div className="h-[200px]">
                                            <ResponsiveContainer>
                                                <PieChart>
                                                    <Pie data={drillDownData.slice(0, 5)} dataKey="actual" cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={8} stroke="none">
                                                        {drillDownData.map((e, i) => <Cell key={i} fill={TEAM_COLORS[e.name]?.main || '#1e293b'} />)}
                                                    </Pie>
                                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', background: '#0a0c1a', fontSize: '10px' }} />
                                                </PieChart>
                                            </ResponsiveContainer>
                                        </div>
                                        <div className="space-y-2.5 mt-4">
                                            {drillDownData.slice(0, 4).map((item, i) => (
                                                <div key={i} className="flex items-center justify-between text-[10px]">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: TEAM_COLORS[item.name]?.main || '#334155' }} />
                                                        <span className="font-bold text-slate-500">{item.name}</span>
                                                    </div>
                                                    <span className="font-black text-white">{((item.actual / summary.actual) * 100).toFixed(1)}%</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* 기업 연간 목표 위젯 */}
                                    <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-white/5 rounded-[24px] p-6 text-white relative overflow-hidden group">
                                        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform" />
                                        <Globe size={40} className="absolute bottom-2 right-2 opacity-10" />
                                        <h4 className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Company Annual Goal</h4>
                                        <p className="text-2xl font-black tracking-tighter mb-4">Target 2026</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-[10px] font-bold">
                                                <span>Yearly Progress</span>
                                                <span>31.4%</span>
                                            </div>
                                            <div className="h-1.5 bg-black/20 rounded-full overflow-hidden">
                                                <div className="h-full bg-white shadow-xl" style={{ width: '31.4%' }} />
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
                <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] bg-[#0a0c1a]/80 backdrop-blur-2xl border border-white/10 rounded-2xl p-2 flex items-center justify-around shadow-2xl z-50">
                    <SidebarIcon active={view === 'dashboard'} icon={LayoutDashboard} onClick={() => setView('dashboard')} />
                    <SidebarIcon active={view === 'receivables'} icon={CreditCard} onClick={() => setView('receivables')} />
                    <SidebarIcon active={view === 'settings'} icon={Settings} onClick={() => setView('settings')} />
                </nav>
            </div>
        </div>
    );
}

// 사이드바 아이콘 컴포넌트
function SidebarIcon({ active, icon: Icon, onClick }) {
    return (
        <button onClick={onClick} className={`p-3 md:p-2.5 rounded-xl transition-all ${active ? 'bg-white/10 text-indigo-400' : 'text-slate-600 hover:text-slate-400'}`}>
            <Icon size={20} className="md:size-5" />
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
