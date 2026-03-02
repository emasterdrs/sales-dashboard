import { useState, useRef, useEffect } from 'react';
import { Settings, Calendar as CalendarIcon, Users, Package, Building2, Filter, Upload, ChevronRight, Save, Target, Type, Globe, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { SETTINGS } from '../data/mockEngine';
import { calculateBusinessDays, calculateCurrentBusinessDay } from '../lib/dateUtils';

export function SettingsView({ setMasterData, setLastUpdated, selectedMonth }) {
    const salesInputRef = useRef(null);
    const targetInputRef = useRef(null);
    const [bizDays, setBizDays] = useState(SETTINGS.businessDays[selectedMonth] || 20);
    const [currentDay, setCurrentDay] = useState(SETTINGS.currentBusinessDay);
    const [autoCalc, setAutoCalc] = useState(true);

    // 공휴일 정보 (사용자에게 보여주기 위함)
    const holidays2026 = [
        { date: '2026-01-01', name: '신정' },
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
    ];

    useEffect(() => {
        if (autoCalc) {
            const calculated = calculateBusinessDays(selectedMonth);
            const current = calculateCurrentBusinessDay(selectedMonth);
            setBizDays(calculated);
            setCurrentDay(current);
        }
    }, [selectedMonth, autoCalc]);

    const handleSave = () => {
        SETTINGS.businessDays[selectedMonth] = bizDays;
        SETTINGS.currentBusinessDay = currentDay;
        alert('설정이 저장되었습니다. 대시보드에 반영됩니다.');
        // 강제로 리렌더링을 유도하기 위해 마스터 데이터를 동일하게 설정 (App.jsx의 useMemo가 반응함)
        setMasterData(prev => ({ ...prev }));
    };

    const handleFileUpload = (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = window.XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = window.XLSX.utils.sheet_to_json(ws);

                setMasterData(prev => {
                    const newData = { ...prev };
                    if (type === 'sales') {
                        newData.actual = data;
                    } else {
                        newData.target = data;
                    }
                    return newData;
                });

                if (setLastUpdated) {
                    const now = new Date();
                    const yyyy = now.getFullYear();
                    const mm = String(now.getMonth() + 1).padStart(2, '0');
                    const dd = String(now.getDate()).padStart(2, '0');
                    const hh = String(now.getHours()).padStart(2, '0');
                    const min = String(now.getMinutes()).padStart(2, '0');
                    setLastUpdated(`${yyyy}-${mm}-${dd} ${hh}:${min}`);
                }

                alert(`${type === 'sales' ? '매출실적' : '목표'} 파일 업로드 성공! (${data.length}건 읽음) \n데이터가 대시보드 화면에 즉시 적용되었습니다.`);
            } catch (error) {
                alert('파일을 읽는 중 오류가 발생했습니다. 올바른 엑셀 형식인지 확인해주세요.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };
    return (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8 pb-20">
            <header className="mb-10">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2 italic">Dashboard Configuration</h2>
                <p className="text-slate-500 font-medium text-lg">대시보드 환경설정 및 관리</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SettingCard
                    title="영업일수 설정"
                    icon={CalendarIcon}
                    desc="주말 및 국가 공휴일 자동 계산 시스템"
                >
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <div>
                                <span className="block text-slate-800 font-extrabold text-lg">자동 영업일 계산 (2026년 기준)</span>
                                <span className="text-xs text-indigo-500 font-bold">주말 및 법정 공휴일이 자동으로 제외됩니다.</span>
                            </div>
                            <button
                                onClick={() => setAutoCalc(!autoCalc)}
                                className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${autoCalc ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}
                            >
                                {autoCalc ? '자동 활성화' : '수동 입력'}
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="block text-xs text-slate-400 font-bold mb-1 italic">대상 월 총 영업일</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={bizDays}
                                        readOnly={autoCalc}
                                        onChange={(e) => setBizDays(Number(e.target.value))}
                                        className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 font-black text-xl ${autoCalc ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                    />
                                    <span className="text-slate-400 font-bold">일</span>
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <span className="block text-xs text-slate-400 font-bold mb-1 italic">현재 경과 영업일</span>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        value={currentDay}
                                        readOnly={autoCalc}
                                        onChange={(e) => setCurrentDay(Number(e.target.value))}
                                        className={`w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-slate-800 font-black text-xl ${autoCalc ? 'bg-slate-50 cursor-not-allowed' : ''}`}
                                    />
                                    <span className="text-slate-400 font-bold">일</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Info size={14} className="text-indigo-400" />
                                이번 달 제외된 공휴일
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {holidays2026.filter(h => h.date.startsWith(selectedMonth)).map(h => (
                                    <div key={h.date} className="flex items-center gap-2 px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-600 rounded-lg text-[11px] font-bold animate-in zoom-in">
                                        <div className="w-1 h-1 rounded-full bg-rose-400" />
                                        <span>{h.name} ({h.date.split('-').slice(1).join('/')})</span>
                                    </div>
                                ))}
                                {holidays2026.filter(h => h.date.startsWith(selectedMonth)).length === 0 && (
                                    <span className="text-[11px] text-slate-400 font-bold italic">이번 달은 공휴일이 없습니다. (주말만 제외됨)</span>
                                )}
                            </div>
                        </div>
                    </div>
                </SettingCard>

                {/* 2. 조직/영업사원 설정 */}
                <SettingCard
                    title="조직 및 인원 설정"
                    icon={Users}
                    desc="대시보드 표시 팀 및 비영업 조직 관리"
                >
                    <div className="space-y-3">
                        {['FD팀', 'FC팀', 'FR팀', 'FS팀', 'FL팀'].map(team => (
                            <div key={team} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span className="text-sm text-slate-600 font-medium">{team}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-slate-400">활성 상태</span>
                                    <div className="w-8 h-4 bg-emerald-100 rounded-full relative">
                                        <div className="absolute right-1 top-1 w-2 h-2 bg-emerald-500 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingCard>

                {/* 3. 데이터 업로드 관리 */}
                <SettingCard
                    title="데이터 업로드 마스터"
                    icon={Upload}
                    desc="매출 실적 및 목표 데이터를 엑셀/CSV로 통합 관리"
                >
                    <div className="space-y-6">
                        <div className="p-4 bg-indigo-50/30 border border-indigo-100 rounded-2xl">
                            <div className="flex items-start gap-4">
                                <div className="p-2 bg-white rounded-lg border border-indigo-100 text-indigo-500">
                                    <Info size={16} />
                                </div>
                                <div>
                                    <p className="text-[11px] text-slate-600 font-bold leading-relaxed">
                                        기존 수기 입력을 대체하여 대량의 데이터를 한 번에 반영할 수 있습니다.<br />
                                        업로드된 데이터는 대시보드의 모든 차트와 요약에 즉각 반영됩니다.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <input type="file" ref={salesInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e, 'sales')} />
                            <input type="file" ref={targetInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e, 'target')} />

                            <button onClick={() => salesInputRef.current.click()} className="flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-indigo-500 hover:bg-slate-50 transition-all group active:scale-[0.98] shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                        <Filter size={24} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-black text-slate-800">매출 실적 업로드</span>
                                        <span className="text-[10px] text-slate-400 font-bold">일별 실적 데이터 (CSV/Excel)</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-indigo-500" />
                            </button>

                            <button onClick={() => targetInputRef.current.click()} className="flex items-center justify-between p-6 bg-white border-2 border-slate-100 rounded-3xl hover:border-emerald-500 hover:bg-slate-50 transition-all group active:scale-[0.98] shadow-sm hover:shadow-md">
                                <div className="flex items-center gap-4">
                                    <div className="p-4 bg-slate-50 rounded-2xl group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors">
                                        <Target size={24} />
                                    </div>
                                    <div className="text-left">
                                        <span className="block text-sm font-black text-slate-800">연간/월간 목표 업로드</span>
                                        <span className="text-[10px] text-slate-400 font-bold">팀별/기간별 설정 데이터 (CSV/Excel)</span>
                                    </div>
                                </div>
                                <ChevronRight className="text-slate-300 group-hover:text-emerald-500" />
                            </button>
                        </div>
                    </div>
                </SettingCard>
            </div>

            <div className="flex justify-end pt-10">
                <button
                    onClick={handleSave}
                    className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transform active:scale-95 transition-all text-lg group"
                >
                    <CheckCircle2 size={24} className="group-hover:rotate-12 transition-transform" />
                    설정 값 저장 및 대시보드 갱신
                </button>
            </div>
        </div>
    );
}

function SettingCard({ title, icon: Icon, desc, children }) {
    return (
        <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-indigo-50 rounded-2xl text-indigo-600">
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-slate-800">{title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </div>
            </div>
            {children}
        </div>
    );
}
