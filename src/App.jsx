import { useState, useMemo, useEffect } from 'react';
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
    LabelList,
    ReferenceLine
} from 'recharts';

import { saveAs } from 'file-saver';
import { motion, AnimatePresence } from 'framer-motion';
import { generateFullDataset, convertToCSV, downloadCSV } from './data/generateSalesData';
import actualDataJson from './data/actual_data.json';
import { TEAMS, SALESPERSONS, ALL_CUSTOMERS, ALL_PRODUCTS } from './data/foodDistributionData';
import { SalesBI, SETTINGS } from './data/mockEngine';
import { getYearlyCalendarData } from './lib/dateUtils';
import { Quote } from './components/Quote';
import { SettingsView } from './components/SettingsView';
import { AuthView } from './components/AuthView';
import { OnboardingView } from './components/OnboardingView';
import { supabase } from './lib/supabase';
// import { BondDashboard } from './components/BondDashboard'; // 채권 대시보드 제거



// 색상 팔레트 최적화
const TEAM_COLORS = {
    '영업1팀': { main: '#6366f1', grad: 'from-indigo-600 to-blue-500' },
    '영업2팀': { main: '#10b981', grad: 'from-emerald-600 to-teal-500' },
    '영업3팀': { main: '#f59e0b', grad: 'from-amber-600 to-orange-500' },
    '영업4팀': { main: '#ef4444', grad: 'from-rose-600 to-pink-500' },
    '영업5팀': { main: '#8b5cf6', grad: 'from-violet-600 to-purple-500' },
    '전체': { main: '#3b82f6', grad: 'from-blue-600 to-indigo-500' },
    '기타': { main: '#94a3b8', grad: 'from-slate-400 to-slate-500' }
};

const CHART_COLORS = [
    '#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#0ea5e9', '#d946ef', '#f97316', '#14b8a6', '#64748b'
];

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

const fPercent = (val) => `${(val || 0).toFixed(1)}%`;

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
                            {isPositive ? '+' : ''}{(trend || 0).toFixed(1)}%
                        </span>
                    )}
                </div>
                <p className="text-slate-400 text-[10px] mt-0.5">{detail}</p>
            </div>
        </div>
    );
}

function SidebarIcon({ icon: Icon, label, active, onClick, badge }) {
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
        </button>
    );
}

export default function App() {
    // 1. Supabase Auth & Profile State
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);

    useEffect(() => {
        // Init session
        supabase.auth.getSession().then(({ data: { session: initialSession } }) => {
            setSession(initialSession);
            if (initialSession) fetchProfile(initialSession.user.id);
            else setLoadingProfile(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session) fetchProfile(session.user.id);
            else {
                setProfile(null);
                setLoadingProfile(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const fetchProfile = async (userId) => {
        setLoadingProfile(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*, companies(*)')
                .eq('id', userId)
                .single();

            if (error) throw error;
            setProfile(data);
        } catch (e) {
            console.error('Profile fetch error:', e);
        } finally {
            setLoadingProfile(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setSession(null);
        setProfile(null);
    };

    // 2. View States
    const [selectedMonth, setSelectedMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });
    const [view, setView] = useState(() => {
        const hash = window.location.hash.replace('#', '');
        return hash || localStorage.getItem('dashboard_view') || 'dashboard_team';
    });

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash.replace('#', '');
            if (hash && hash !== view) setView(hash);
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [view]);

    useEffect(() => {
        localStorage.setItem('dashboard_view', view);
        if (window.location.hash !== `#${view}`) {
            window.location.hash = view;
        }
    }, [view]);

    const [mainTab, setMainTab] = useState('current');
    const [analysisMode, setAnalysisMode] = useState('goal');
    const [metricType, setMetricType] = useState('amount');
    const [path, setPath] = useState([{ level: 'root', id: 'all', name: '전체' }]);
    const [amountUnit, setAmountUnit] = useState('1M');
    const [weightUnit, setWeightUnit] = useState('KG');
    const [showAmountDropdown, setShowAmountDropdown] = useState(false);
    const [showWeightDropdown, setShowWeightDropdown] = useState(false);
    const [fontFamily, setFontFamily] = useState('Gmarket');
    const [settingsSubView, setSettingsSubView] = useState('bizDays');

    // 3. Calculation & Master Data Logic
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [currentTime, setCurrentTime] = useState('');

    // Cloud Data Fetcher
    const fetchCloudData = async () => {
        if (!profile || !profile.company_id || profile.status !== 'approved') return;

        setIsLoadingData(true);
        try {
            // 1. Fetch Sales Actual
            const { data: actual, error: actualErr } = await supabase
                .from('sales_actual')
                .select('*')
                .eq('company_id', profile.company_id);
            if (actualErr) throw actualErr;

            // 2. Fetch Sales Target
            const { data: target, error: targetErr } = await supabase
                .from('sales_target')
                .select('*')
                .eq('company_id', profile.company_id);
            if (targetErr) throw targetErr;

            // 3. Fetch Settings
            const { data: setRes, error: setErr } = await supabase
                .from('settings')
                .select('data')
                .eq('company_id', profile.company_id)
                .single();

            // Map DB records back to UI format (Korean keys)
            const mappedActual = (actual || []).map(r => ({
                '년도월': r.year_month,
                '영업팀': r.team_name,
                '영업사원명': r.person_name,
                '거래처코드': r.customer_code,
                '거래처명': r.customer_name,
                '품목유형': r.type_name,
                '품목코드': r.item_code,
                '품목명': r.item_name,
                '금액': r.amount,
                '매출금액': r.amount
            }));

            const mappedTarget = (target || []).map(r => ({
                '년도월': r.year_month,
                '영업팀': r.team_name,
                '영업사원명': r.person_name,
                '금액': r.amount,
                '목표금액': r.amount
            }));

            setMasterData({
                actual: mappedActual,
                target: mappedTarget
            });

            // Sync settings to localStorage for the existing components (backward compatibility)
            if (setRes && setRes.data) {
                localStorage.setItem('dashboard_settings', JSON.stringify(setRes.data));
            }

        } catch (e) {
            console.error('Cloud data fetch failed:', e);
        } finally {
            setIsLoadingData(false);
        }
    };

    useEffect(() => {
        if (profile && profile.company_id && profile.status === 'approved') {
            fetchCloudData();
        }
    }, [profile]);

    const [masterData, setMasterData] = useState(() => {
        try {
            const saved = localStorage.getItem('dashboard_master_data');
            if (saved) return JSON.parse(saved);
        } catch (e) { }
        return { actual: [], target: [] };
    });


    useEffect(() => {
        try {
            localStorage.setItem('dashboard_master_data', JSON.stringify(masterData));
        } catch (e) { }
    }, [masterData]);



    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            const yyyy = now.getFullYear();
            const mm = String(now.getMonth() + 1).padStart(2, '0');
            const dd = String(now.getDate()).padStart(2, '0');
            const hh = String(now.getHours()).padStart(2, '0');
            const min = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            setCurrentTime(`${yyyy}년 ${mm}월 ${dd}일 ${hh}:${min}:${ss}`);
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    const bizDayInfo = useMemo(() => {
        if (!selectedMonth || !selectedMonth.includes('-')) return { currentBusinessDay: 1, totalBusinessDays: 20 };
        const [year, month] = selectedMonth.split('-').map(Number);
        const calendar = getYearlyCalendarData(year);
        const monthData = calendar.find(m => m.month === month);

        if (!monthData) return { currentBusinessDay: 1, totalBusinessDays: 20 };

        let toggledDays = {};
        try {
            const savedData = localStorage.getItem('dashboard_settings');
            if (savedData) {
                const data = JSON.parse(savedData);
                toggledDays = data[`toggledDays_${year}`] || {};
            }
        } catch (e) { }

        const processedDays = monthData.days.map(d => {
            const isToggled = toggledDays[d.date] !== undefined;
            let isBusinessDay = d.isBusinessDay;
            if (isToggled) isBusinessDay = toggledDays[d.date];
            return { ...d, isBusinessDay };
        });

        const totalBusinessDays = processedDays.filter(d => d.isBusinessDay).length || 20;

        const now = new Date();
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);

        const nowY = now.getFullYear();
        const nowM = now.getMonth() + 1;

        const isPastMonth = year < nowY || (year === nowY && month < nowM);
        const isFutureMonth = year > nowY || (year === nowY && month > nowM);

        let currentBusinessDay = 0;
        if (isPastMonth) {
            currentBusinessDay = totalBusinessDays;
        } else if (isFutureMonth) {
            currentBusinessDay = 0;
        } else {
            const yesterdayIso = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
            currentBusinessDay = processedDays.filter(d => d.isBusinessDay && d.date <= yesterdayIso).length;
        }

        return { currentBusinessDay, totalBusinessDays };
    }, [selectedMonth]);

    // 전역 설정 연동 (Legacy 지원용으로 남겨두되 가급적 파라미터 전달 권장)
    useEffect(() => {
        SETTINGS.currentBusinessDay = bizDayInfo.currentBusinessDay || 1;
        SETTINGS.businessDays[selectedMonth] = bizDayInfo.totalBusinessDays;
        SETTINGS.selectedMonth = selectedMonth;
    }, [bizDayInfo, selectedMonth]);

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

    const fMetricNoSuffix = (val) => {
        if (val === undefined || val === null) return '0';
        if (metricType === 'amount') {
            const config = CURRENCY_UNITS.find(u => u.key === amountUnit) || CURRENCY_UNITS[1];
            const converted = val / config.divisor;
            return converted.toLocaleString(undefined, { maximumFractionDigits: (converted >= 10 || amountUnit === '1') ? 0 : 1 });
        } else {
            const config = WEIGHT_UNITS.find(u => u.key === weightUnit) || WEIGHT_UNITS[0];
            const converted = val / config.divisor;
            return converted.toLocaleString(undefined, { maximumFractionDigits: converted >= 10 ? 0 : 2 });
        }
    };
    const fCurrencyNoSuffix = fMetricNoSuffix;

    const formatDisplayMonth = (ym) => {
        const [y, m] = ym.split('-');
        return `${y}년 ${m}월`;
    };

    const bi = useMemo(() => new SalesBI(masterData.actual, masterData.target), [masterData]);

    const currentView = path[path.length - 1];

    const summary = useMemo(() => {
        return bi.getSummary(selectedMonth, currentView.level, currentView.id, mainTab, metricType, bizDayInfo);
    }, [bi, selectedMonth, currentView, mainTab, metricType, bizDayInfo]);

    const drillDownData = useMemo(() => {
        const nextLevelMap = view === 'dashboard_type'
            ? { root: 'type', type: 'type' }
            : { root: 'team', team: 'person', person: 'customer', customer: 'item', item: 'item' };
        const nextLevel = nextLevelMap[currentView.level];
        return bi.getDrillDown(selectedMonth, currentView.level, currentView.id, nextLevel, mainTab, metricType, bizDayInfo);
    }, [path, bi, selectedMonth, currentView, mainTab, metricType, bizDayInfo]);

    // 대안 A: 가독성 중심 데이터 요약 (Top 10 + 기타)
    const slicedChartData = useMemo(() => {
        if (!drillDownData || drillDownData.length <= 10) return drillDownData;

        // 실적(actual) 순으로 정렬하여 상위 10개 추출
        const sorted = [...drillDownData].sort((a, b) => (b.actual || 0) - (a.actual || 0));
        const top10 = sorted.slice(0, 10);
        const others = sorted.slice(10);

        const otherSummary = others.reduce((acc, curr) => {
            acc.actual += (curr.actual || 0);
            acc.target += (curr.target || 0);
            acc.weight += (curr.weight || 0);
            acc.lastYear += (curr.lastYear || 0);
            acc.lastMonth += (curr.lastMonth || 0);
            acc.cumulativeActual += (curr.cumulativeActual || 0);
            acc.cumulativeTarget += (curr.cumulativeTarget || 0);
            return acc;
        }, {
            id: 'others_group',
            name: `기타(${others.length}개)`,
            actual: 0,
            target: 0,
            weight: 0,
            lastYear: 0,
            lastMonth: 0,
            cumulativeActual: 0,
            cumulativeTarget: 0
        });

        // 달성률 재계산
        otherSummary.achievement = otherSummary.target > 0 ? (otherSummary.actual / otherSummary.target) * 100 : (otherSummary.actual > 0 ? 100 : 0);

        return [...top10, otherSummary];
    }, [drillDownData]);

    const handleDrillDown = (item) => {
        if (item.id === 'others_group') return; // 기타 합계는 드릴다운 불가
        if (currentView.level === 'type' || currentView.level === 'item') return;
        const nextLevelMap = view === 'dashboard_type'
            ? { root: 'type' }
            : { root: 'team', team: 'person', person: 'customer', customer: 'item' };
        const nextLvl = nextLevelMap[currentView.level];
        if (!nextLvl) return;
        setPath([...path, { level: nextLvl, id: item.id || item.name, name: item.name }]);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        try {
            const user = users.find(u => u.id === loginId && u.pw === loginPw);
            if (user) {
                setLoggedInUser(user);

                // 로컬 서버로 접속 로그 전송 추가
                try {
                    fetch(`${API_BASE_URL}/api/logs`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            user_id: user.id,
                            user_name: user.name,
                            event: 'LOGIN'
                        })
                    }).catch(err => console.error('로그 서버 연결 실패:', err));
                } catch (e) { }

                setLoginId('');
                setLoginPw('');
                if (user.permissions.includes('dashboard_team')) setView('dashboard_team');
                else if (user.permissions.includes('dashboard_type')) setView('dashboard_type');
                else if (user.permissions.includes('settings')) setView('settings');
            } else {
                alert('아이디 또는 비밀번호가 올바르지 않습니다.');
            }
        } catch (error) {
            alert('로그인 처리 중 오류가 발생했습니다.');
        }
    };

    useEffect(() => {
        setPath([{ level: view === 'dashboard_type' ? 'type' : 'root', id: 'all', name: '전체' }]);
    }, [view]);

    const fontMap = {
        'Gmarket': 'font-gmarket',
        'Pretendard': 'font-pretendard',
        'Inter': 'font-inter'
    };

    if (!session) {
        return <AuthView onLoginSuccess={(user) => fetchProfile(user.id)} />;
    }

    if (loadingProfile) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile || !profile.company_id) {
        return <OnboardingView user={session.user} onComplete={() => fetchProfile(session.user.id)} />;
    }

    if (profile.status === 'pending') {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center text-slate-800">
                <div className="w-24 h-24 bg-amber-50 rounded-[40px] flex items-center justify-center text-amber-500 mb-8 border border-amber-100 shadow-xl shadow-amber-50">
                    <Clock size={48} className="animate-pulse" />
                </div>
                <h2 className="text-3xl font-black tracking-tighter mb-4 italic uppercase">Pending Approval</h2>
                <p className="text-slate-400 font-bold max-w-sm leading-relaxed mb-8">
                    {profile.companies?.name}의 참여 신청이 완료되었습니다.<br />
                    관리자가 승인하면 모든 데이터를 볼 수 있습니다.
                </p>
                <button onClick={handleLogout} className="px-8 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-rose-500 transition-colors">
                    Logout
                </button>
            </div>
        );
    }

    return (
        <div className={`min-h-screen bg-[#f8fafc] text-slate-600 flex flex-col md:flex-row overflow-x-hidden pb-20 md:pb-0 shadow-inner ${fontMap[fontFamily]}`}>
            <aside className="hidden md:flex w-64 bg-white border-r border-slate-200/60 flex-col py-10 z-50 h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] px-6">
                <div className="flex items-center gap-4 px-2 mb-12">
                    <div className="flex flex-col justify-center">
                        <button onClick={() => setView('dashboard_team')} className="text-2xl font-black text-slate-900 tracking-tighter leading-none hover:text-indigo-600 transition-colors text-left uppercase italic">
                            {profile.companies?.name}
                        </button>
                        <div className="mt-3 text-[10px] font-black text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-100 flex items-center gap-1.5 w-max uppercase tracking-widest">
                            <Shield size={10} />
                            {profile.role === 'admin' ? 'Admin Mode' : 'Staff Mode'}
                        </div>
                    </div>
                </div>

                <nav className="flex-1">
                    <div className="space-y-2">
                        <SidebarIcon active={view === 'dashboard_team'} icon={BarChart3} label="매출 실적 (팀별)" onClick={() => setView('dashboard_team')} />
                        <SidebarIcon active={view === 'dashboard_type'} icon={PieChartIcon} label="매출 실적 (유형별)" onClick={() => setView('dashboard_type')} />

                        {(profile.role === 'admin') && (
                            <SidebarIcon active={view === 'settings'} icon={Settings} label="설정" onClick={() => setView('settings')} />
                        )}

                        <AnimatePresence>
                            {view === 'settings' && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="ml-8 mt-2 space-y-1 border-l-2 border-indigo-50 pl-4 overflow-hidden"
                                >
                                    {[
                                        { id: 'bizDays', name: '영업일수' },
                                        { id: 'org', name: '조직 및 인원' },
                                        { id: 'types', name: '유형명' },
                                        { id: 'data', name: '판매 데이터' },
                                        { id: 'accounts', name: '멤버 관리' },
                                        { id: 'logs', name: '접속 로그' }
                                    ].map(sub => (
                                        <button
                                            key={sub.id}
                                            onClick={() => setSettingsSubView(sub.id)}
                                            className={`block w-full text-left py-2 text-sm font-black transition-all transform hover:translate-x-1 ${settingsSubView === sub.id ? 'text-indigo-600 scale-105' : 'text-slate-400 hover:text-slate-600'}`}
                                        >
                                            {sub.name}
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </nav>

                <div className="pt-8 mt-8 border-t border-slate-100 px-2 flex justify-between items-center">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 flex-1">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                            <span className="font-extrabold text-[12px] uppercase">{profile.full_name?.slice(0, 1)}</span>
                        </div>
                        <div className="flex flex-col overflow-hidden">
                            <span className="text-[12px] font-black text-slate-800 truncate leading-tight tracking-tighter">{profile.full_name}</span>
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">{profile.role}</span>
                        </div>
                    </div>
                    <button onClick={handleLogout} className="ml-2 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                    </button>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
                <header className="py-2 px-4 md:py-3 md:px-8 border-b border-slate-200 bg-white">
                    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 md:gap-6 mb-2 md:mb-4">
                        <div className="flex-1 min-w-0 w-full">
                            <div className="hidden"></div>
                            <h1 className="text-2xl md:text-5xl font-black text-slate-900 tracking-tighter italic mb-2 md:mb-3 leading-tight">
                                {formatDisplayMonth(selectedMonth)} <span className={mainTab === 'expected' ? 'text-indigo-600' : 'text-emerald-500'}>
                                    {mainTab === 'expected' ? '예상마감 실적' : '현재 매출 실적'}
                                </span>
                            </h1>
                            <div className="flex items-center gap-4 text-slate-400 font-bold text-xs md:text-[11px] px-1 uppercase tracking-wider">
                                <span className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full border border-indigo-100">
                                    <Globe size={10} className="animate-pulse" />
                                    Cloud Connected
                                </span>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-6 shrink-0 w-full md:w-auto">
                            <div className="overflow-x-auto no-scrollbar rounded-3xl border border-slate-200 bg-slate-50 shadow-sm transition-all hover:border-indigo-500/30">
                                <table className="text-[10px] md:text-[11px] leading-tight min-w-full">
                                    <thead className="bg-slate-50 border-b border-slate-200">
                                        <tr className="text-slate-800 font-black text-[11px] md:text-[12px] uppercase tracking-widest whitespace-nowrap">
                                            <th className="px-5 py-3 border-r border-slate-200">Biz Days</th>
                                            <th className="px-5 py-3 border-r border-slate-200">Total</th>
                                            <th className="px-5 py-3 border-r border-slate-200">Progress</th>
                                            <th className="px-5 py-3">1 Day Avg</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-center font-black">
                                        <tr className="text-slate-900 text-lg md:text-xl tracking-tighter">
                                            <td className="px-5 py-2.5 border-r border-slate-200">{bizDayInfo.currentBusinessDay}</td>
                                            <td className="px-5 py-2.5 border-r border-slate-200">{bizDayInfo.totalBusinessDays}</td>
                                            <td className="px-5 py-2.5 border-r border-slate-200">{((bizDayInfo.currentBusinessDay / (bizDayInfo.totalBusinessDays || 1)) * 100).toFixed(1)}%</td>
                                            <td className="px-5 py-2.5">{(100 / (bizDayInfo.totalBusinessDays || 1)).toFixed(1)}%</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto custom-scrollbar p-4 md:p-6 space-y-4 bg-[#f8fafc] md:max-h-screen">
                    {view === 'settings' ? (
                        <SettingsView
                            setMasterData={setMasterData}
                            masterData={masterData}
                            refreshData={fetchCloudData}
                            fontFamily={fontFamily}
                            setFontFamily={setFontFamily}
                            fontMap={fontMap}
                            selectedMonth={selectedMonth}
                            subView={settingsSubView}
                            profile={profile}
                            session={session}
                        />
                    ) : (
                        <div className="max-w-[1600px] mx-auto space-y-6">
                            {/* KPI Summary Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-1000">
                                <CompactStat
                                    title="전체 매출 실적"
                                    value={fMetric(summary.actual)}
                                    detail={`목표금액: ${fMetric(summary.target)}`}
                                    icon={DollarSign}
                                    color="indigo"
                                    trend={summary.achievementRate}
                                />
                                <CompactStat
                                    title="달성률 (목표대비)"
                                    value={fPercent(summary.achievementRate)}
                                    detail={`진도율(${fPercent(summary.progressRate)}) 대비 ${summary.progressGap >= 0 ? '+' : ''}${summary.progressGap.toFixed(1)}%`}
                                    icon={Target}
                                    color="emerald"
                                />
                                <CompactStat
                                    title="전년 동기 대비(YoY)"
                                    value={fPercent(summary.yoyGrowth)}
                                    detail={`전년 실적: ${fMetric(summary.lastYearActual)}`}
                                    icon={TrendingUp}
                                    color="amber"
                                    trend={summary.yoyGrowth}
                                />
                                <CompactStat
                                    title="예상 마감 실적"
                                    value={fMetric(summary.forecast)}
                                    detail={`현재 추세 기반 월말 예상치`}
                                    icon={Zap}
                                    color="violet"
                                    trend={summary.cumulativeAchievement}
                                />
                            </div>

                            <div className="flex flex-col xl:flex-row justify-between items-stretch xl:items-center gap-6">
                                <div className="flex flex-wrap items-center gap-4 bg-white/80 backdrop-blur-md p-3 px-5 rounded-3xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                                    <div className="flex items-center gap-3 pr-4 border-r border-slate-100">
                                        <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner">
                                            <Calendar size={22} className="group-hover:scale-110 transition-transform" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-0.5">Analysis Period</span>
                                            <div className="flex items-center gap-2">
                                                <button onClick={() => {
                                                    const prev = new Date(selectedMonth + '-01');
                                                    prev.setMonth(prev.getMonth() - 1);
                                                    setSelectedMonth(toIsoString(prev).slice(0, 7));
                                                }} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"><ChevronLeft size={16} /></button>
                                                <select
                                                    value={selectedMonth}
                                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                                    className="bg-transparent text-[15px] font-black text-slate-800 outline-none cursor-pointer appearance-none py-0.5 px-1 hover:text-indigo-600 transition-colors"
                                                >
                                                    {[2026, 2025, 2024].map(year => (
                                                        <optgroup key={year} label={`${year}년`}>
                                                            {Array.from({ length: 12 }, (_, i) => 12 - i).map(month => {
                                                                const mStr = String(month).padStart(2, '0');
                                                                return <option key={`${year}-${mStr}`} value={`${year}-${mStr}`}>{`${year}년 ${mStr}월`}</option>;
                                                            })}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                                <button onClick={() => {
                                                    const next = new Date(selectedMonth + '-01');
                                                    next.setMonth(next.getMonth() + 1);
                                                    setSelectedMonth(toIsoString(next).slice(0, 7));
                                                }} className="p-1 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-indigo-600"><ChevronRight size={16} /></button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data Status</span>
                                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-50 rounded-full border border-emerald-100 shadow-sm overflow-hidden animate-pulse">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                                                <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">Live DB Sync</span>
                                            </div>
                                        </div>
                                        <p className="text-[13px] font-black text-slate-600 tracking-tight mt-0.5">{lastUpdated} 업데이트됨</p>
                                    </div>
                                </div>

                                <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                                    <div className="flex items-center gap-5 bg-white/80 backdrop-blur-md p-4 px-6 rounded-3xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex-1 min-w-[140px] md:min-w-[180px]">
                                            <div className="flex justify-between items-center mb-2 px-1">
                                                <span className="text-[11px] font-black text-indigo-600 uppercase tracking-wider">영업 진도율</span>
                                                <span className="text-[12px] font-black text-slate-700">{fPercent(summary.progressRate)}</span>
                                            </div>
                                            <div className="h-2.5 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-[2px]">
                                                <div
                                                    className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600 rounded-full shadow-[0_0_12px_rgba(99,102,241,0.4)] transition-all duration-1000 ease-out"
                                                    style={{ width: `${summary.progressRate}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-[1px] h-10 bg-slate-100" />
                                        <div className="flex gap-1.5 bg-slate-100/50 p-1 rounded-2xl">
                                            <button onClick={() => setMainTab('current')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${mainTab === 'current' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>현재실적</button>
                                            <button onClick={() => setMainTab('expected')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${mainTab === 'expected' ? 'bg-white text-indigo-600 shadow-sm scale-105' : 'text-slate-400 hover:text-slate-600'}`}>예상마감</button>
                                        </div>
                                    </div>

                                    <div className="flex bg-white/80 backdrop-blur-md p-2 rounded-3xl border border-slate-200/60 shadow-sm transition-all hover:shadow-md">
                                        <div className="flex gap-1 bg-slate-100/50 p-1 rounded-2xl">
                                            {[
                                                { id: 'goal', name: '목표대비' },
                                                { id: 'yoy', name: '전년대비' },
                                                { id: 'mom', name: '전월대비' },
                                                { id: 'cumulative', name: '누계' }
                                            ].map(tab => (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setAnalysisMode(tab.id)}
                                                    className={`px-4 py-2 rounded-xl text-[12px] font-black transition-all whitespace-nowrap ${analysisMode === tab.id ? 'bg-white text-indigo-600 shadow-sm scale-110' : 'text-slate-400 hover:text-slate-600'}`}
                                                >
                                                    {tab.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="hidden"></div>

                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                <div className="xl:col-span-4">
                                    <div className="grid grid-cols-1 lg:grid-cols-5 items-start gap-6">
                                        {/* Detailed Team Analysis Table (LEFT - 3/5) */}
                                        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm flex flex-col max-h-[1000px]">
                                            <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center whitespace-nowrap overflow-x-auto no-scrollbar">
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-base font-black text-slate-600 uppercase tracking-widest flex items-center gap-2 shrink-0">
                                                        <Activity size={18} className="text-indigo-500" />
                                                        분석 현황
                                                    </h3>
                                                    {path.length > 1 && (
                                                        <div className="flex items-center gap-0.5 px-2.5 py-1 bg-indigo-50/50 rounded-full border border-indigo-100 shadow-sm overflow-hidden">
                                                            {path.map((p, i) => (
                                                                <button key={i} onClick={() => setPath(path.slice(0, i + 1))} className={`text-[10px] font-black px-1.5 py-0.5 transition-all flex items-center gap-1 rounded-md ${i === path.length - 1 ? 'bg-indigo-600 text-white' : 'text-indigo-400 hover:text-indigo-600 hover:bg-white'}`}>
                                                                    {p.name}
                                                                    {i < path.length - 1 && <ChevronRight size={8} className={i === path.length - 1 ? 'text-white/50' : 'text-indigo-200'} />}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 ml-4 shrink-0">
                                                        <button onClick={() => setMetricType('amount')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${metricType === 'amount' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>금액</button>
                                                        <button onClick={() => setMetricType('weight')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-all ${metricType === 'weight' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-500'}`}>중량</button>
                                                    </div>
                                                    <div className="relative shrink-0 ml-1">
                                                        <select
                                                            value={metricType === 'amount' ? amountUnit : weightUnit}
                                                            onChange={(e) => {
                                                                if (metricType === 'amount') setAmountUnit(e.target.value);
                                                                else setWeightUnit(e.target.value);
                                                            }}
                                                            className="appearance-none bg-white border border-slate-300 text-slate-600 text-[13px] font-black py-1.5 pl-3 pr-8 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 shadow-sm cursor-pointer"
                                                        >
                                                            {metricType === 'amount' ? (
                                                                CURRENCY_UNITS.map(u => <option key={u.key} value={u.key}>(단위: {u.label})</option>)
                                                            ) : (
                                                                WEIGHT_UNITS.map(u => <option key={u.key} value={u.key}>(단위: {u.label})</option>)
                                                            )}
                                                        </select>
                                                        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 overflow-x-auto overflow-y-auto max-h-[800px] no-scrollbar">
                                                <table className="w-full text-left table-fixed min-w-[650px]">
                                                    <thead className="sticky top-0 z-10 bg-slate-50 border-b-2 border-slate-200">
                                                        <tr className="text-slate-700 font-extrabold text-[13px] md:text-[14px] uppercase tracking-tighter align-middle">
                                                            <th className="py-3.5 px-6 w-[20%] text-left">
                                                                {path.length === 1 ? (view === 'dashboard_type' ? '유형명' : '영업팀') :
                                                                    path.length === 2 ? '영업사원' :
                                                                        path.length === 3 ? '거래처' : '품목'}
                                                            </th>
                                                            {analysisMode === 'goal' && (
                                                                <>
                                                                    <th className="py-3.5 px-2 text-right w-[15%]">목표</th>
                                                                    <th className="py-3.5 px-2 text-right w-[15%]">실적</th>
                                                                    <th className="py-3.5 px-2 text-center w-[15%]">달성율(%)</th>
                                                                    <th className="py-3.5 px-2 text-center w-[15%]">과부족(%)</th>
                                                                    <th className="py-3.5 pr-6 text-right w-[20%]">과부족({metricType === 'amount' ? '금액' : '수량'})</th>
                                                                </>
                                                            )}
                                                            {analysisMode === 'yoy' && (
                                                                <>
                                                                    <th className="py-3.5 px-2 text-right w-[20%]">실적</th>
                                                                    <th className="py-3.5 px-2 text-right w-[20%]">전년실적</th>
                                                                    <th className="py-3.5 px-2 text-center w-[20%]">성장률(%)</th>
                                                                    <th className="py-3.5 pr-6 text-right w-[20%]">증감액</th>
                                                                </>
                                                            )}
                                                            {analysisMode === 'mom' && (
                                                                <>
                                                                    <th className="py-3.5 px-2 text-right w-[20%]">실적</th>
                                                                    <th className="py-3.5 px-2 text-right w-[20%]">전월실적</th>
                                                                    <th className="py-3.5 px-2 text-center w-[20%]">성장률(%)</th>
                                                                    <th className="py-3.5 pr-6 text-right w-[20%]">증감액</th>
                                                                </>
                                                            )}
                                                            {analysisMode === 'cumulative' && (
                                                                <>
                                                                    <th className="py-3.5 px-2 text-right w-[20%]">누계목표</th>
                                                                    <th className="py-3.5 px-2 text-right w-[20%]">누계실적</th>
                                                                    <th className="py-3.5 px-2 text-center w-[20%]">달성율(%)</th>
                                                                    <th className="py-3.5 pr-6 text-right w-[20%]">과부족</th>
                                                                </>
                                                            )}
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100">
                                                        {drillDownData.map((item, i) => (
                                                            <tr key={i} onClick={() => handleDrillDown(item)} className="hover:bg-slate-50 transition-colors cursor-pointer group">
                                                                <td className="py-4 px-6 font-black text-slate-800 text-[15px] group-hover:text-indigo-600 transition-colors tracking-tight truncate align-middle">
                                                                    <span className="inline-block w-2 h-5 rounded-full mr-3 align-middle" style={{ background: TEAM_COLORS[item.name]?.main || CHART_COLORS[i % CHART_COLORS.length] }} />
                                                                    {item.name}
                                                                </td>
                                                                {analysisMode === 'goal' && (
                                                                    <>
                                                                        <td className="py-4 px-2 font-mono text-slate-500 text-right text-[15px] font-bold align-middle">{fCurrencyNoSuffix(item.target)}</td>
                                                                        <td className="py-4 px-2 font-mono text-slate-800 text-right text-[15px] font-extrabold align-middle">{fCurrencyNoSuffix(item.actual)}</td>
                                                                        <td className="py-4 px-2 text-center align-middle">
                                                                            <span className="font-extrabold text-slate-900 text-[15px] block">{fPercent(item.achievement)}</span>
                                                                        </td>
                                                                        <td className="py-4 px-2 text-center align-middle">
                                                                            <span className={`font-extrabold text-[15px] ${(item.progressGap || 0) >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                                {(item.progressGap || 0) > 0 ? '+' : ''}{(item.progressGap || 0).toFixed(1)}%
                                                                            </span>
                                                                        </td>
                                                                        <td className={`py-4 pr-6 font-mono text-right font-extrabold text-[15px] align-middle ${item.overShort >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                            {item.overShort > 0 ? `+${fCurrencyNoSuffix(item.overShort)}` : fCurrencyNoSuffix(item.overShort)}
                                                                        </td>
                                                                    </>
                                                                )}
                                                                {analysisMode === 'yoy' && (
                                                                    <>
                                                                        <td className="py-4 px-2 font-mono text-slate-800 text-right text-[15px] font-extrabold align-middle">{fCurrencyNoSuffix(item.actual)}</td>
                                                                        <td className="py-4 px-2 font-mono text-slate-500 text-right text-[15px] font-bold align-middle">{fCurrencyNoSuffix(item.lastYear)}</td>
                                                                        <td className="py-4 px-2 text-center align-middle">
                                                                            <span className={`font-extrabold text-[15px] ${item.yoy >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>{fPercent(item.yoy)}</span>
                                                                        </td>
                                                                        <td className={`py-4 pr-6 font-mono text-right font-extrabold text-[15px] align-middle ${item.actual - item.lastYear >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                            {fCurrencyNoSuffix(item.actual - item.lastYear)}
                                                                        </td>
                                                                    </>
                                                                )}
                                                                {analysisMode === 'mom' && (
                                                                    <>
                                                                        <td className="py-4 px-2 font-mono text-slate-800 text-right text-[15px] font-extrabold align-middle">{fCurrencyNoSuffix(item.actual)}</td>
                                                                        <td className="py-4 px-2 font-mono text-slate-500 text-right text-[15px] font-bold align-middle">{fCurrencyNoSuffix(item.lastMonth)}</td>
                                                                        <td className="py-4 px-2 text-center align-middle">
                                                                            <span className={`font-extrabold text-[15px] ${item.mom >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>{fPercent(item.mom)}</span>
                                                                        </td>
                                                                        <td className={`py-4 pr-6 font-mono text-right font-extrabold text-[15px] align-middle ${item.actual - item.lastMonth >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                            {fCurrencyNoSuffix(item.actual - item.lastMonth)}
                                                                        </td>
                                                                    </>
                                                                )}
                                                                {analysisMode === 'cumulative' && (
                                                                    <>
                                                                        <td className="py-4 px-2 font-mono text-slate-500 text-right text-[15px] font-bold align-middle">{fCurrencyNoSuffix(item.cumulativeTarget)}</td>
                                                                        <td className="py-4 px-2 font-mono text-slate-800 text-right text-[15px] font-extrabold align-middle">{fCurrencyNoSuffix(item.cumulativeActual)}</td>
                                                                        <td className="py-4 px-2 text-center align-middle">
                                                                            <span className="font-extrabold text-slate-900 text-[15px]">{fPercent(item.cumulativeAchievement)}</span>
                                                                        </td>
                                                                        <td className={`py-4 pr-6 font-mono text-right font-extrabold text-[15px] align-middle ${item.cumulativeActual - item.cumulativeTarget >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                            {fCurrencyNoSuffix(item.cumulativeActual - item.cumulativeTarget)}
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-slate-50/80 border-t-2 border-slate-200">
                                                        <tr className="font-extrabold text-[15px] md:text-[16px]">
                                                            <td className="py-4 px-6 text-slate-900 uppercase tracking-tight align-middle">합계</td>
                                                            {analysisMode === 'goal' && (
                                                                <>
                                                                    <td className="py-4 px-2 font-mono text-slate-600 text-right align-middle">{fCurrencyNoSuffix(summary.target)}</td>
                                                                    <td className="py-4 px-2 font-mono text-slate-900 text-right align-middle">{fCurrencyNoSuffix(summary.actual)}</td>
                                                                    <td className="py-4 px-2 text-center align-middle"><span className="text-slate-900 tracking-tighter">{fPercent(summary.achievementRate)}</span></td>
                                                                    <td className="py-4 px-2 text-center align-middle">
                                                                        <span className={`tracking-tighter ${(summary.progressGap || 0) >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                            {(summary.progressGap || 0) > 0 ? '+' : ''}{(summary.progressGap || 0).toFixed(1)}%
                                                                        </span>
                                                                    </td>
                                                                    <td className={`py-4 pr-6 font-mono text-right align-middle ${summary.overShort >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                        {summary.overShort > 0 ? `+${fCurrencyNoSuffix(summary.overShort)}` : fCurrencyNoSuffix(summary.overShort)}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {analysisMode === 'yoy' && (
                                                                <>
                                                                    <td className="py-4 px-2 font-mono text-slate-900 text-right align-middle">{fCurrencyNoSuffix(summary.actual)}</td>
                                                                    <td className="py-4 px-2 font-mono text-slate-600 text-right align-middle">{fCurrencyNoSuffix(summary.lastYearActual)}</td>
                                                                    <td className="py-4 px-2 text-center align-middle"><span className={`tracking-tighter ${summary.yoyGrowth >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>{fPercent(summary.yoyGrowth)}</span></td>
                                                                    <td className={`py-4 pr-6 font-mono text-right align-middle ${summary.actual - summary.lastYearActual >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                        {fCurrencyNoSuffix(summary.actual - summary.lastYearActual)}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {analysisMode === 'mom' && (
                                                                <>
                                                                    <td className="py-4 px-2 font-mono text-slate-900 text-right align-middle">{fCurrencyNoSuffix(summary.actual)}</td>
                                                                    <td className="py-4 px-2 font-mono text-slate-600 text-right align-middle">{fCurrencyNoSuffix(summary.lastMonthActual)}</td>
                                                                    <td className="py-4 px-2 text-center align-middle"><span className={`tracking-tighter ${summary.momGrowth >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>{fPercent(summary.momGrowth)}</span></td>
                                                                    <td className={`py-4 pr-6 font-mono text-right align-middle ${summary.actual - summary.lastMonthActual >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                        {fCurrencyNoSuffix(summary.actual - summary.lastMonthActual)}
                                                                    </td>
                                                                </>
                                                            )}
                                                            {analysisMode === 'cumulative' && (
                                                                <>
                                                                    <td className="py-4 px-2 font-mono text-slate-600 text-right align-middle">{fCurrencyNoSuffix(summary.cumulativeTarget)}</td>
                                                                    <td className="py-4 px-2 font-mono text-slate-900 text-right align-middle">{fCurrencyNoSuffix(summary.cumulativeActual)}</td>
                                                                    <td className="py-4 px-2 text-center align-middle"><span className="text-slate-900 tracking-tighter">{fPercent(summary.cumulativeAchievement)}</span></td>
                                                                    <td className={`py-4 pr-6 font-mono text-right align-middle ${summary.cumulativeActual - summary.cumulativeTarget >= 0 ? 'text-blue-600' : 'text-rose-500'}`}>
                                                                        {fCurrencyNoSuffix(summary.cumulativeActual - summary.cumulativeTarget)}
                                                                    </td>
                                                                </>
                                                            )}
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Performance Horizontal Chart (RIGHT - 2/5) */}
                                        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm flex flex-col h-fit">
                                            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                                <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                                    <TrendingUp size={18} className="text-indigo-600" />
                                                    달성률 시각화 {drillDownData.length > 12 && <span className="text-[10px] font-bold text-slate-400 normal-case ml-2">(상위 10개 요약)</span>}
                                                </h3>
                                            </div>
                                            <div className="p-4 h-[440px]">
                                                <ResponsiveContainer width="100%" height="100%">
                                                    <BarChart data={slicedChartData} margin={{ left: -10, right: 10, top: 40, bottom: 0 }}>
                                                        <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                                                        <XAxis
                                                            dataKey="name"
                                                            axisLine={false}
                                                            tickLine={false}
                                                            tick={{ fontSize: 10, fontWeight: 900, fill: '#64748b' }}
                                                            interval={0}
                                                            angle={slicedChartData.length > 5 ? -15 : 0}
                                                            dx={slicedChartData.length > 5 ? -5 : 0}
                                                        />
                                                        <YAxis hide domain={[0, Math.min(200, Math.max(110, ...slicedChartData.map(d => d.achievement || 0)))]} />
                                                        <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />

                                                        <ReferenceLine
                                                            y={100}
                                                            stroke="#cbd5e1"
                                                            strokeDasharray="3 3"
                                                            label={{
                                                                position: 'insideTopRight',
                                                                value: '목표(100%)',
                                                                fill: '#94a3b8',
                                                                fontSize: 10,
                                                                fontWeight: 900,
                                                                offset: 10
                                                            }}
                                                        />
                                                        <ReferenceLine
                                                            y={summary.progressRate}
                                                            stroke="#6366f1"
                                                            strokeDasharray="5 5"
                                                            strokeWidth={2}
                                                            label={{
                                                                position: 'insideTopLeft',
                                                                value: `진도율(${summary.progressRate.toFixed(1)}%)`,
                                                                fill: '#6366f1',
                                                                fontSize: 10,
                                                                fontWeight: 900,
                                                                offset: 10
                                                            }}
                                                        />

                                                        <Bar dataKey="achievement" radius={[8, 8, 0, 0]} barSize={slicedChartData.length > 8 ? 20 : 35}>
                                                            {slicedChartData.map((e, i) => (
                                                                <Cell key={i} fill={TEAM_COLORS[e.name]?.main || CHART_COLORS[i % CHART_COLORS.length]} opacity={0.8} />
                                                            ))}
                                                            <LabelList
                                                                dataKey="achievement"
                                                                position="top"
                                                                formatter={(v) => slicedChartData.length > 10 ? '' : `${v.toFixed(1)}%`}
                                                                fontSize={10}
                                                                fontWeight={900}
                                                                fill="#475569"
                                                            />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>

                            <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
                                {/* Pie Chart for Composition Ratio - Full Width below or next to the bar chart */}
                                <div className="xl:col-span-4 bg-white border border-slate-200 rounded-[24px] overflow-hidden shadow-sm flex flex-col mt-4 h-fit">
                                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                        <h3 className="text-base font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                                            <PieChartIcon size={18} className="text-indigo-600" />
                                            {view === 'dashboard_type' ? '유형별 구성비' : '팀별 구성비'} {drillDownData.length > 10 && <span className="text-[10px] font-bold text-slate-400 normal-case ml-2">(상위 10개 요약)</span>}
                                        </h3>
                                    </div>
                                    <div className="p-4 h-[440px]">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie
                                                    data={slicedChartData.filter(d => (d.actual || 0) > 0)}
                                                    dataKey="actual"
                                                    nameKey="name"
                                                    cx="50%"
                                                    cy="50%"
                                                    innerRadius={80}
                                                    outerRadius={120}
                                                    paddingAngle={5}
                                                >
                                                    {slicedChartData.filter(d => (d.actual || 0) > 0).map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={TEAM_COLORS[entry.name]?.main || CHART_COLORS[index % CHART_COLORS.length]} />
                                                    ))}
                                                    <LabelList dataKey="name" position="outside" offset={20} stroke="none" fill="#475569" fontSize={10} fontWeight="bold" />
                                                </Pie>
                                                <Tooltip
                                                    formatter={(value, name) => {
                                                        const total = drillDownData.reduce((acc, curr) => acc + (curr.actual || 0), 0);
                                                        const percent = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
                                                        return [`${fCurrencyNoSuffix(value)} (${percent}%)`, name];
                                                    }}
                                                    contentStyle={{ borderRadius: '12px', fontSize: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <nav className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 w-[85%] bg-white/95 backdrop-blur-3xl border border-slate-200 rounded-[24px] p-2.5 flex items-center justify-around shadow-2xl z-50 ring-1 ring-slate-900/5">
                    <SidebarIcon active={view === 'dashboard_team'} icon={BarChart3} label="팀별 실적" onClick={() => setView('dashboard_team')} color="indigo" />
                    <SidebarIcon active={view === 'dashboard_type'} icon={PieChartIcon} label="유형별 실적" onClick={() => setView('dashboard_type')} color="indigo" />
                    <SidebarIcon active={view === 'settings'} icon={Settings} label="설정" onClick={() => setView('settings')} color="slate" />
                </nav>
            </div>
        </div>
    );
}

function CustomLabel({ x, y, width, value, mainTab, analysisMode }) {
    if (value === undefined) return null;
    const isNeg = parseFloat(value) < 0;
    const label = value > 0 ? `+${value.toFixed(1)}` : value.toFixed(1);
    const unit = (analysisMode === 'goal' || analysisMode === 'cumulative') ? '%p' : '%';
    return (
        <text x={x + width / 2} y={y - 12} fill={isNeg ? '#f43f5e' : '#10b981'} textAnchor="middle" fontSize={10} fontWeight="900">
            {label}{unit}
        </text>
    );
}

// Helper to format ISO without timezone issues
const toIsoString = (date) => {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};
