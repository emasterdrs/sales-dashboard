import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Settings, Calendar as CalendarIcon, Users, Package, Building2,
    Filter, Upload, ChevronRight, Save, Target, Type, Globe,
    Info, CheckCircle2, AlertCircle, ChevronDown, CalendarDays,
    ArrowRight, ArrowUp, ArrowDown
} from 'lucide-react';
import { SETTINGS } from '../data/mockEngine';
import { calculateBusinessDays, calculateCurrentBusinessDay, getYearlyCalendarData } from '../lib/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';

export function SettingsView({ masterData, setMasterData, setLastUpdated, selectedMonth, subView }) {
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
                    <div className="flex items-center gap-2 bg-white p-2 pl-4 pr-3 rounded-2xl border border-slate-200 shadow-sm relative">
                        <CalendarDays size={20} className="text-indigo-500" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="bg-transparent font-black text-slate-700 outline-none appearance-none pr-6 cursor-pointer w-full z-10"
                        >
                            <option value="2026">2026년</option>
                            <option value="2025">2025년</option>
                        </select>
                        <ChevronDown size={14} className="absolute right-3 text-slate-400 pointer-events-none z-0" />
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
                    {subView === 'org' && <OrganizationSubView setMasterData={setMasterData} masterData={masterData} />}
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
    const calendarDataRaw = useMemo(() => getYearlyCalendarData(year), [year]);
    const [editingMonth, setEditingMonth] = useState(null);
    const [holidayNames, setHolidayNames] = useState({});
    const [toggledDays, setToggledDays] = useState({});

    // 브라우저 저장소(localStorage)에서 데이터 로드
    useEffect(() => {
        try {
            const savedData = localStorage.getItem('dashboard_settings');
            const data = savedData ? JSON.parse(savedData) : {};
            setHolidayNames(data[`holidayNames_${year}`] || {});
            setToggledDays(data[`toggledDays_${year}`] || {});
        } catch (e) {
            console.warn('Failed to load from localStorage', e);
        }
    }, [year]);

    const toggleEditAndSave = (month, isCurrentlyEditing) => {
        if (isCurrentlyEditing) {
            // 로컬 스토리지에 저장 처리
            try {
                const savedData = localStorage.getItem('dashboard_settings');
                let data = savedData ? JSON.parse(savedData) : {};

                data[`holidayNames_${year}`] = holidayNames;
                data[`toggledDays_${year}`] = toggledDays;

                localStorage.setItem('dashboard_settings', JSON.stringify(data));
            } catch (e) {
                console.warn('Failed to save to localStorage', e);
                alert('설정 저장 중 오류가 발생했습니다.');
            }
            setEditingMonth(null);
        } else {
            setEditingMonth(month);
        }
    };

    const calendarData = useMemo(() => {
        return calendarDataRaw.map(m => ({
            ...m,
            days: m.days.map(d => {
                const isToggled = toggledDays[d.date] !== undefined;
                let isBusinessDay = d.isBusinessDay;
                let isHoliday = d.isHoliday;
                let currentName = holidayNames[d.date] !== undefined ? holidayNames[d.date] : d.holidayName;

                if (isToggled) {
                    isBusinessDay = toggledDays[d.date];
                    isHoliday = !isBusinessDay && !d.isWeekend;
                    if (!isBusinessDay && !currentName && !d.isWeekend) {
                        currentName = '임시 지정 휴일';
                    }
                }

                return { ...d, isBusinessDay, isHoliday, holidayName: currentName };
            })
        }));
    }, [calendarDataRaw, toggledDays, holidayNames]);

    const handleNameChange = (date, name) => {
        setHolidayNames(prev => ({ ...prev, [date]: name }));
    };

    const handleDayToggle = (date, currentIsBusinessDay) => {
        setToggledDays(prev => ({ ...prev, [date]: !currentIsBusinessDay }));
        if (currentIsBusinessDay && !holidayNames[date]) {
            setHolidayNames(prev => ({ ...prev, [date]: '임시 지정 휴일' }));
        }
    };

    return (
        <div className="space-y-12">
            {/* 연간 영업일수 요약 표 */}
            <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm p-4 md:p-8">
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
                const holidays = days.filter(d => !d.isBusinessDay && (d.isHoliday || d.isWeekend));
                const isEditing = editingMonth === month;

                return (
                    <div key={month} className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all group">
                        <div className="p-4 md:p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                            <div className="flex items-center gap-3 md:gap-4">
                                <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-xl md:text-2xl font-black text-indigo-600 shadow-sm shrink-0">
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
                            <div className="lg:col-span-2 p-4 md:p-8 border-b lg:border-b-0 lg:border-r border-slate-100">
                                <div className="grid grid-cols-7 gap-1 md:gap-2">
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
                                        const displayName = holidayNames[d.date] !== undefined ? holidayNames[d.date] : d.holidayName;
                                        return (
                                            <div
                                                key={d.date}
                                                onClick={() => isEditing && handleDayToggle(d.date, d.isBusinessDay)}
                                                className={`
                                                    relative h-14 md:h-16 rounded-lg md:rounded-xl flex flex-col items-center justify-center border transition-all
                                                    ${d.isBusinessDay ? 'bg-white border-transparent hover:border-indigo-200 hover:bg-indigo-50/30' :
                                                        d.isHoliday ? 'bg-rose-50 border-rose-100 text-rose-600' :
                                                            'bg-slate-50 border-slate-100 text-slate-400'}
                                                    ${isEditing ? 'cursor-pointer hover:border-indigo-400 hover:shadow-md' : ''}
                                                `}
                                            >
                                                <span className="text-xs md:text-sm font-black">{d.day}</span>
                                                {displayName && !d.isBusinessDay && <span className="text-[6px] md:text-[8px] font-bold mt-0.5 md:mt-1 text-center truncate px-0.5 md:px-1 w-[95%]">{displayName}</span>}
                                                {d.isBusinessDay && <div className="absolute top-1 right-1 w-1 md:w-1.5 h-1 md:h-1.5 rounded-full bg-emerald-400" />}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* 상세 정보 (제외 사유) */}
                            <div className="p-4 md:p-8 bg-slate-50/30">
                                <div className="flex justify-between items-center mb-6">
                                    <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                        <Info size={14} className="text-indigo-400" />
                                        영업일 제외 상세 내역
                                    </h4>
                                    <button
                                        onClick={() => toggleEditAndSave(month, isEditing)}
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
                                                        value={holidayNames[h.date] !== undefined ? holidayNames[h.date] : (h.holidayName || '')}
                                                        onChange={(e) => handleNameChange(h.date, e.target.value)}
                                                        className="w-full text-xs font-black text-slate-700 bg-indigo-50 border border-indigo-100 rounded-md px-2 py-1 outline-none"
                                                        placeholder="제외 사유 입력"
                                                    />
                                                ) : (
                                                    <span className="text-xs font-black text-slate-700">{holidayNames[h.date] !== undefined ? holidayNames[h.date] : h.holidayName}</span>
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
function OrganizationSubView({ setMasterData, masterData }) {
    const [teams, setTeams] = useState([{ id: 1, name: 'FD팀' }, { id: 2, name: 'FC팀' }, { id: 3, name: 'FR팀' }, { id: 4, name: 'FS팀' }, { id: 5, name: 'FL팀' }]);
    const [salespersons, setSalespersons] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);

    const [editingTeamId, setEditingTeamId] = useState(null);
    const [teamEditName, setTeamEditName] = useState('');

    const [editingSpId, setEditingSpId] = useState(null);
    const [spEditName, setSpEditName] = useState('');

    useEffect(() => {
        try {
            const savedData = localStorage.getItem('dashboard_settings');
            const data = savedData ? JSON.parse(savedData) : {};
            // Validate schema robustly to prevent runtime crashes from old data structures
            if (data.teams && Array.isArray(data.teams) && typeof data.teams[0] === 'object') {
                setTeams(data.teams);
            }
            if (data.salespersons && Array.isArray(data.salespersons)) {
                setSalespersons(data.salespersons);
            }
        } catch (e) {
            console.warn('Failed to load from localStorage', e);
        }
    }, []);

    const saveChanges = (newTeams, newSps) => {
        try {
            const savedData = localStorage.getItem('dashboard_settings');
            let data = savedData ? JSON.parse(savedData) : {};
            data.teams = newTeams;
            data.salespersons = newSps;
            localStorage.setItem('dashboard_settings', JSON.stringify(data));
            // Force re-calc of mock engine bucketting
            if (setMasterData && masterData) {
                setMasterData({ ...masterData });
            }
        } catch (e) {
            console.warn('Failed to save to localStorage', e);
        }
    };

    const handleAddTeam = () => {
        const newTeam = { id: Date.now(), name: '새 영업팀' };
        const updated = [...teams, newTeam];
        setTeams(updated);
        saveChanges(updated, salespersons);
        setEditingTeamId(newTeam.id);
        setTeamEditName('새 영업팀');
    };

    const handleDeleteTeam = (id) => {
        if (!window.confirm('해당 팀을 삭제하시겠습니까? 데이터는 "기타" 팀으로 집계됩니다.')) return;
        const updated = teams.filter(t => t.id !== id);
        setTeams(updated);
        if (selectedTeam === id) setSelectedTeam(null);
        saveChanges(updated, salespersons);
    };

    const handleSaveTeamEdit = (id) => {
        const updated = teams.map(t => t.id === id ? { ...t, name: teamEditName } : t);
        setTeams(updated);
        setEditingTeamId(null);
        saveChanges(updated, salespersons);
    };

    const handleAddSp = () => {
        if (!selectedTeam) return alert('먼저 팀을 선택해주세요.');
        const newSp = { id: Date.now(), teamId: selectedTeam, name: '새 사원' };
        const updated = [...salespersons, newSp];
        setSalespersons(updated);
        saveChanges(teams, updated);
        setEditingSpId(newSp.id);
        setSpEditName('새 사원');
    };

    const handleDeleteSp = (id) => {
        const updated = salespersons.filter(s => s.id !== id);
        setSalespersons(updated);
        saveChanges(teams, updated);
    };

    const handleMoveTeamUp = (e, index) => {
        e.stopPropagation();
        if (index === 0) return;
        const updated = [...teams];
        const temp = updated[index - 1];
        updated[index - 1] = updated[index];
        updated[index] = temp;
        setTeams(updated);
        saveChanges(updated, salespersons);
    };

    const handleMoveTeamDown = (e, index) => {
        e.stopPropagation();
        if (index === teams.length - 1) return;
        const updated = [...teams];
        const temp = updated[index + 1];
        updated[index + 1] = updated[index];
        updated[index] = temp;
        setTeams(updated);
        saveChanges(updated, salespersons);
    };

    const handleSaveSpEdit = (id) => {
        const updated = salespersons.map(s => s.id === id ? { ...s, name: spEditName } : s);
        setSalespersons(updated);
        setEditingSpId(null);
        saveChanges(teams, updated);
    };

    const currentSpList = salespersons.filter(s => s.teamId === selectedTeam);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <SettingCard title="영업팀 관리" icon={Users} desc={
                <>
                    활성 영업팀 및 조직 체계 구성 (미등록 팀 데이터는 '기타'로 합산)
                    <span className="block mt-1.5 text-[12px] font-bold text-slate-400 tracking-tight flex items-center gap-1.5">
                        <Info size={12} className="text-indigo-400" /> 여기서 설정한 배치 순서에 따라 메인 대시보드에도 순서대로 표시됩니다.
                    </span>
                </>
            }>
                <div className="space-y-3">
                    {teams.map((team, index) => (
                        <div
                            key={team.id || typeof team === 'string' ? team : `team-${Math.random()}`}
                            className={`flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer rounded-2xl border shadow-sm transition-all ${selectedTeam === team.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20' : 'bg-white border-slate-100'}`}
                            onClick={() => setSelectedTeam(team.id)}
                        >
                            <div className="flex items-center gap-3">
                                {editingTeamId === team.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={teamEditName}
                                            onChange={(e) => setTeamEditName(e.target.value)}
                                            className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-black outline-none focus:ring-2 ring-indigo-500/30"
                                            onClick={(e) => e.stopPropagation()}
                                        />
                                        <button onClick={(e) => { e.stopPropagation(); handleSaveTeamEdit(team.id); }} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold">확인</button>
                                    </div>
                                ) : (
                                    <span className="text-[15px] text-slate-800 font-extrabold">{team?.name || (typeof team === 'string' ? team : '알 수 없는 팀')}</span>
                                )}
                            </div>
                            {editingTeamId !== team.id && (
                                <div className="flex items-center gap-2 mt-3 md:mt-0">
                                    <button onClick={(e) => { e.stopPropagation(); setTeamEditName(team.name); setEditingTeamId(team.id); }} className="text-[11px] font-bold px-3 py-1 rounded-md bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600">수정</button>
                                    <button onClick={(e) => { e.stopPropagation(); handleDeleteTeam(team.id); }} className="text-[11px] font-bold px-3 py-1 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600">삭제</button>
                                    <div className="flex items-center border border-slate-200 rounded-md ml-2 overflow-hidden bg-slate-50">
                                        <button onClick={(e) => handleMoveTeamUp(e, index)} disabled={index === 0} className={`p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors border-r border-slate-200 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`} title="순서 위로 이동">
                                            <ArrowUp size={14} strokeWidth={3} />
                                        </button>
                                        <button onClick={(e) => handleMoveTeamDown(e, index)} disabled={index === teams.length - 1} className={`p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors ${index === teams.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`} title="순서 아래로 이동">
                                            <ArrowDown size={14} strokeWidth={3} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                    <button onClick={handleAddTeam} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-black hover:bg-slate-50 hover:border-indigo-200 hover:text-indigo-500 transition-all mt-4">
                        + 새로운 영업팀 추가
                    </button>
                </div>
            </SettingCard>

            <SettingCard title="영업사원 마스터" icon={Building2} desc={selectedTeam ? `선택된 팀: ${teams.find(t => t.id === selectedTeam)?.name || '이름 없음'}` : "먼저 대상 팀을 선택해주세요"}>
                {selectedTeam ? (
                    <div className="space-y-3">
                        {currentSpList.length === 0 && (
                            <div className="py-8 text-center text-sm font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                등록된 담당 사원이 없습니다.
                            </div>
                        )}
                        {currentSpList.map(sp => (
                            <div key={sp.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 font-black text-xs">
                                        {sp?.name?.[0] || '?'}
                                    </div>
                                    {editingSpId === sp.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={spEditName}
                                                onChange={(e) => setSpEditName(e.target.value)}
                                                className="px-2 py-1 border border-emerald-200 rounded-md text-[13px] font-black outline-none focus:ring-2 ring-emerald-500/30"
                                            />
                                            <button onClick={() => handleSaveSpEdit(sp.id)} className="text-[11px] bg-emerald-600 text-white px-2 py-1 rounded-md font-bold">저장</button>
                                        </div>
                                    ) : (
                                        <span className="text-[13px] text-slate-700 font-black">{sp?.name || '이름 없음'}</span>
                                    )}
                                </div>
                                {editingSpId !== sp.id && (
                                    <div className="flex items-center gap-1.5 mt-2 md:mt-0">
                                        <button onClick={() => { setSpEditName(sp.name); setEditingSpId(sp.id); }} className="text-[11px] font-bold px-2 py-1 rounded bg-slate-100 text-slate-500 hover:bg-emerald-100 hover:text-emerald-600">수정</button>
                                        <button onClick={() => handleDeleteSp(sp.id)} className="text-[11px] font-bold px-2 py-1 rounded bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600">삭제</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={handleAddSp} className="w-full py-3 mt-4 border border-dashed border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 rounded-xl text-emerald-600 text-xs font-black transition-all">
                            + 영업사원 등록
                        </button>
                    </div>
                ) : (
                    <div className="p-8 text-center bg-slate-50 border border-slate-200 border-dashed rounded-[32px]">
                        <p className="text-slate-400 font-bold">좌측에서 관리할 영업팀을 선택해주세요</p>
                    </div>
                )}
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
