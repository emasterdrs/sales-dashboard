import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Settings, Calendar as CalendarIcon, Users, Package, Building2,
    Filter, Upload, ChevronRight, Save, Target, Type, Globe,
    Info, CheckCircle2, AlertCircle, ChevronDown, CalendarDays,
    ArrowRight
} from 'lucide-react';
import { SETTINGS } from '../data/mockEngine';
import { calculateBusinessDays, calculateCurrentBusinessDay, getYearlyCalendarData } from '../lib/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

export function SettingsView({ setMasterData, setLastUpdated, selectedMonth, subView }) {
    const [selectedYear, setSelectedYear] = useState('2026');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8 pb-20">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 italic uppercase">
                        {subView === 'bizDays' ? 'Business Days' :
                            subView === 'org' ? 'Organization' :
                                subView === 'types' ? 'Type Definitions' : 'Sales Data Center'}
                    </h2>
                    <p className="text-slate-500 font-bold text-lg">
                        {subView === 'bizDays' ? '영업일수 및 공휴일 상세 설정' :
                            subView === 'org' ? '조직 및 인원 구성 관리' :
                                subView === 'types' ? '시스템 유형 및 코드 관리' : '매출 및 목표 데이터 업로드'}
                    </p>
                </div>

                {subView === 'bizDays' && (
                    <div className="flex items-center gap-3 bg-white p-2 px-4 rounded-2xl border border-slate-200 shadow-sm">
                        <CalendarDays size={20} className="text-indigo-500" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent font-black text-slate-700 outline-none appearance-none pr-6 cursor-pointer"
                        >
                            <option value="2026">2026년</option>
                            <option value="2025">2025년</option>
                        </select>
                        <ChevronDown size={14} className="-ml-6 text-slate-400 pointer-events-none" />
                    </div>
                )}
            </header>

            <AnimatePresence mode="wait">
                <motion.div
                    key={subView}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                >
                    {subView === 'bizDays' && <BusinessDaysSubView year={selectedYear} />}
                    {subView === 'org' && <OrganizationSubView />}
                    {subView === 'types' && <TypesSubView />}
                    {subView === 'data' && <DataUploadSubView setMasterData={setMasterData} setLastUpdated={setLastUpdated} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/**
 * 1. 영업일수 상세 설정 (달력형)
 */
function BusinessDaysSubView({ year }) {
    const calendarData = useMemo(() => getYearlyCalendarData(year), [year]);
    const [editingMonth, setEditingMonth] = useState(null);
    const [holidayNames, setHolidayNames] = useState({});

    const handleNameChange = (date, name) => {
        setHolidayNames(prev => ({ ...prev, [date]: name }));
    };

    return (
        <div className="space-y-12">
            {/* 연간 영업일수 요약 표 */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm p-8">
                <div className="flex items-center gap-3 mb-6">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    <h3 className="text-lg font-black text-slate-800 uppercase tracking-tight">{year}년 월별 영업일 요약</h3>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-y border-slate-100">
                                {calendarData.map(m => (
                                    <th key={m.month} className="py-4 px-2 text-[10px] md:text-sm font-black text-slate-400 uppercase tracking-widest border-r border-slate-100 last:border-r-0">
                                        {m.month}월
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className="hover:bg-slate-50/50 transition-colors">
                                {calendarData.map(m => {
                                    const bizDays = m.days.filter(d => d.isBusinessDay).length;
                                    return (
                                        <td key={m.month} className="py-6 px-2 border-r border-slate-100 last:border-r-0 group">
                                            <span className="text-xl md:text-2xl font-black text-slate-800 group-hover:text-indigo-600 transition-colors">{bizDays}</span>
                                            <span className="text-[10px] md:text-xs text-slate-300 ml-1 font-bold">일</span>
                                        </td>
                                    );
                                })}
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            {calendarData.map(({ month, days }) => {
                const totalBizDays = days.filter(d => d.isBusinessDay).length;
                const holidays = days.filter(d => d.isHoliday || (d.isWeekend && d.holidayName));
                const isEditing = editingMonth === month;

                return (
                    <div key={month} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-2xl font-black text-indigo-600 shadow-sm">
                                    {month}
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-slate-800">{year}년 {month}월</h3>
                                    <p className="text-sm text-slate-400 font-bold uppercase tracking-wider">Monthly Calendar</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="block text-[10px] text-slate-400 font-black uppercase tracking-tighter">Total Business Days</span>
                                <span className="text-3xl font-black text-indigo-600">{totalBizDays} <span className="text-lg text-slate-300">Days</span></span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3">
                            {/* 달력 영역 */}
                            <div className="lg:col-span-2 p-8 border-r border-slate-100">
                                <div className="grid grid-cols-7 gap-2">
                                    {['일', '월', '화', '수', '목', '금', '토'].map(d => (
                                        <div key={d} className={`text-center py-2 text-xs font-black uppercase tracking-widest ${d === '일' ? 'text-rose-500' : d === '토' ? 'text-blue-500' : 'text-slate-400'}`}>
                                            {d}
                                        </div>
                                    ))}
                                    {/* 첫 날 시작 요일 맞추기 */}
                                    {Array.from({ length: new Date(year, month - 1, 1).getDay() }).map((_, i) => (
                                        <div key={`empty-${i}`} />
                                    ))}
                                    {days.map(d => {
                                        const displayName = holidayNames[d.date] || d.holidayName;
                                        return (
                                            <div
                                                key={d.date}
                                                className={`
                                                    relative h-16 rounded-xl flex flex-col items-center justify-center border transition-all
                                                    ${d.isBusinessDay ? 'bg-white border-transparent hover:border-indigo-200 hover:bg-indigo-50/30' :
                                                        d.isHoliday ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                                            'bg-slate-50 border-slate-100 text-slate-400'}
                                                `}
                                            >
                                                <span className="text-sm font-black">{d.day}</span>
                                                {displayName && <span className="text-[8px] font-bold mt-1 text-center truncate px-1">{displayName}</span>}
                                                {d.isBusinessDay && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 상세 정보 (제외 사유) */}
                            <div className="p-8 bg-slate-50/30">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Info size={14} className="text-indigo-400" />
                                        영업일 제외 상세 내역
                                    </h4>
                                    <button
                                        onClick={() => setEditingMonth(isEditing ? null : month)}
                                        className={`px-4 py-1.5 rounded-lg text-[11px] font-black transition-all shadow-sm border ${isEditing
                                            ? 'bg-indigo-600 text-white border-indigo-600'
                                            : 'bg-white text-indigo-600 border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {isEditing ? '저장' : '편집'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {holidays.length > 0 ? holidays.map(h => (
                                        <div key={h.date} className="flex items-center justify-between p-3 bg-white rounded-2xl border border-slate-100 shadow-sm animate-in slide-in-from-right-2">
                                            <div className="flex items-center gap-3 flex-1 mr-2">
                                                <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${h.isHoliday ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-400'}`}>
                                                    {h.day}
                                                </div>
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={holidayNames[h.date] || h.holidayName || ''}
                                                        onChange={(e) => handleNameChange(h.date, e.target.value)}
                                                        className="w-full text-xs font-black text-slate-700 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-1 outline-none"
                                                        placeholder="제외 사유 입력"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-black text-slate-700">{holidayNames[h.date] || h.holidayName}</span>
                                                )}
                                            </div>
                                            {!isEditing && <span className="text-[10px] text-slate-300 font-bold shrink-0">{h.date}</span>}
                                        </div>
                                    )) : (
                                        <div className="text-center py-10">
                                            <p className="text-xs text-slate-400 font-bold italic">제외된 날짜가 없습니다.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

/**
 * 2. 조직 및 인원 설정
 */
function OrganizationSubView() {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SettingCard title="영업팀 관리" icon={Users} desc="활성 영업팀 및 조직 체계 구성">
                <div className="space-y-3">
                    {['FD팀', 'FC팀', 'FR팀', 'FS팀', 'FL팀'].map(team => (
                        <div key={team} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 font-black">
                                    {team[0]}
                                </div>
                                <span className="text-sm text-slate-800 font-black">{team}</span>
                            </div>
                            <div className="w-10 h-5 bg-emerald-500 rounded-full relative">
                                <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full shadow-sm" />
                            </div>
                        </div>
                    ))}
                    <button className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-black hover:bg-slate-50 transition-all mt-4">
                        + 새로운 팀 추가
                    </button>
                </div>
            </SettingCard>

            <SettingCard title="영업사원 마스터" icon={Building2} desc="팀별 전담 사원 및 권한 관리">
                <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-[32px]">
                    <p className="text-slate-400 font-bold">전체 영업사원 48명 리스트 관리</p>
                    <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black">상세 데이터 보기</button>
                </div>
            </SettingCard>
        </div>
    );
}

/**
 * 3. 유형명 설정
 */
function TypesSubView() {
    return (
        <div className="bg-white rounded-[32px] border border-slate-200 p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-500">
                    <Type size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">카테고리 및 유형 정의</h3>
                    <p className="text-sm text-slate-400 font-bold">제품 분류 및 실적 집계 기준 코드 관리</p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {['대분류', '중분류', '소분류'].map(level => (
                    <div key={level} className="p-6 bg-slate-50 rounded-3xl border border-slate-100">
                        <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{level}</span>
                        <div className="mt-4 space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="px-4 py-2 bg-white rounded-lg text-xs font-bold text-slate-600 border border-slate-200 flex justify-between">
                                    <span>분류 항목 {i + 1}</span>
                                    <ArrowRight size={12} className="text-slate-300" />
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/**
 * 4. 데이터 업로드 센터 (원본 스타일 유지하되 정제)
 */
function DataUploadSubView({ setMasterData, setLastUpdated }) {
    const salesInputRef = useRef(null);
    const targetInputRef = useRef(null);

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
                    if (type === 'sales') newData.actual = data;
                    else newData.target = data;
                    return newData;
                });

                if (setLastUpdated) {
                    const now = new Date();
                    setLastUpdated(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
                }
                alert(`${type === 'sales' ? '매출실적' : '목표'} 업로드 성공!`);
            } catch (error) {
                alert('파일 오류가 발생했습니다.');
            }
        };
        reader.readAsBinaryString(file);
        e.target.value = '';
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SettingCard title="매출 실적 파일" icon={Filter} desc="ERP 시스템에서 추출된 마스타 데이터 업로드">
                <input type="file" ref={salesInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'sales')} />
                <button onClick={() => salesInputRef.current.click()} className="w-full py-16 border-2 border-dashed border-indigo-200 rounded-[32px] flex flex-col items-center justify-center hover:bg-indigo-50 transition-all group">
                    <Filter className="text-indigo-500 mb-4 group-hover:scale-110 transition-transform" size={40} />
                    <span className="text-lg font-black text-slate-800">엑셀/CSV 파일 선택</span>
                    <span className="text-xs text-slate-400 font-bold mt-2">Duri Sales Master Format (.xlsx)</span>
                </button>
            </SettingCard>

            <SettingCard title="목표 데이터 파일" icon={Target} desc="연간 및 월간 목표 수립 데이터 업로드">
                <input type="file" ref={targetInputRef} className="hidden" onChange={(e) => handleFileUpload(e, 'target')} />
                <button onClick={() => targetInputRef.current.click()} className="w-full py-16 border-2 border-dashed border-emerald-200 rounded-[32px] flex flex-col items-center justify-center hover:bg-emerald-50 transition-all group">
                    <Target className="text-emerald-500 mb-4 group-hover:scale-110 transition-transform" size={40} />
                    <span className="text-lg font-black text-slate-800">목표 파일 업로드</span>
                    <span className="text-xs text-slate-400 font-bold mt-2">Duri Target Schema (.csv)</span>
                </button>
            </SettingCard>
        </div>
    );
}

function SettingCard({ title, icon: Icon, desc, children }) {
    return (
        <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start gap-5 mb-8">
                <div className="p-4 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 shadow-sm">
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">{title}</h3>
                    <p className="text-sm font-bold text-slate-400 mt-1">{desc}</p>
                </div>
            </div>
            {children}
        </div>
    );
}
