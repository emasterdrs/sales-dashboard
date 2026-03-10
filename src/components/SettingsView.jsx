import { useState, useRef, useEffect, useMemo } from 'react';
import {
    Settings, Calendar as CalendarIcon, Users, Package, Building2,
    Filter, Upload, ChevronRight, Save, Target, Type, Globe,
    Info, CheckCircle2, AlertCircle, ChevronDown, CalendarDays,
    ArrowRight, ArrowUp, ArrowDown, Zap
} from 'lucide-react';
import { SETTINGS } from '../data/mockEngine';
import { calculateBusinessDays, calculateCurrentBusinessDay, getYearlyCalendarData } from '../lib/dateUtils';
import { motion, AnimatePresence } from 'framer-motion';
import { generateFullDataset, convertToCSV, downloadCSV } from '../data/generateSalesData';
import { SALESPERSONS, ALL_CUSTOMERS, ALL_PRODUCTS } from '../data/foodDistributionData';

import { supabase } from '../lib/supabase';

export function SettingsView({ masterData, setMasterData, fetchCloudData, selectedMonth, subView, profile, session }) {
    const [selectedYear, setSelectedYear] = useState('2026');

    return (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8 pb-20">
            <header className="mb-10 flex justify-between items-end">
                <div>
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 italic uppercase">
                        {subView === 'bizDays' ? 'Business Days' :
                            subView === 'org' ? 'Organization' :
                                subView === 'types' ? 'Type Definitions' :
                                    subView === 'accounts' ? 'Member Management' :
                                        subView === 'logs' ? 'Access Logs' : 'Sales Data Center'}
                    </h2>
                    <p className="text-slate-500 font-bold text-lg">
                        {subView === 'bizDays' ? '영업일수 및 공휴일 상세 설정' :
                            subView === 'org' ? '조직 및 인원 구성 관리' :
                                subView === 'types' ? '시스템 유형 및 코드 관리' :
                                    subView === 'accounts' ? '멤버 초대 및 권한 승인' :
                                        subView === 'logs' ? '시스템 접속 이력 모니터링' : '매출 및 목표 데이터 업로드'}
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
                    {subView === 'bizDays' && <BusinessDaysSubView year={selectedYear} profile={profile} />}
                    {subView === 'org' && <OrganizationSubView setMasterData={setMasterData} masterData={masterData} profile={profile} />}
                    {subView === 'types' && <TypesSubView setMasterData={setMasterData} masterData={masterData} profile={profile} />}
                    {subView === 'data' && <DataUploadSubView setMasterData={setMasterData} masterData={masterData} profile={profile} />}
                    {subView === 'accounts' && <AccountsSubView profile={profile} />}
                    {subView === 'logs' && <LogsSubView profile={profile} />}
                </motion.div>
            </AnimatePresence>
        </div>
    );
}

/**
 * 1. 영업일수 상세 설정 (달력형)
 */
function BusinessDaysSubView({ year, profile }) {
    const calendarDataRaw = useMemo(() => getYearlyCalendarData(year), [year]);
    const [editingMonth, setEditingMonth] = useState(null);
    const [holidayNames, setHolidayNames] = useState({});
    const [toggledDays, setToggledDays] = useState({});

    // 서버 및 브라우저 저장소에서 데이터 로드
    useEffect(() => {
        const loadSettings = async () => {
            if (!profile?.company_id) return;
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('data')
                    .eq('company_id', profile.company_id)
                    .single();

                if (data && data.data) {
                    const settings = data.data;
                    if (settings[`holidayNames_${year}`]) setHolidayNames(settings[`holidayNames_${year}`]);
                    if (settings[`toggledDays_${year}`]) setToggledDays(settings[`toggledDays_${year}`]);
                }
            } catch (e) {
                console.warn('Failed to load settings from Supabase', e);
            }
        };
        loadSettings();
    }, [year, profile]);

    const toggleEditAndSave = async (month, isCurrentlyEditing) => {
        if (isCurrentlyEditing) {
            try {
                // 1. Get current settings
                const { data: current, error: fetchErr } = await supabase
                    .from('settings')
                    .select('data')
                    .eq('company_id', profile.company_id)
                    .single();

                let newData = current?.data || {};
                newData[`holidayNames_${year}`] = holidayNames;
                newData[`toggledDays_${year}`] = toggledDays;

                // 2. Upsert settings
                const { error: upsertErr } = await supabase
                    .from('settings')
                    .upsert({ company_id: profile.company_id, data: newData });

                if (upsertErr) throw upsertErr;

                // Update local storage too for backward compatibility if needed
                localStorage.setItem('dashboard_settings', JSON.stringify(newData));

            } catch (e) {
                console.warn('Failed to save settings to Supabase', e);
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
function OrganizationSubView({ setMasterData, masterData, profile }) {
    const [teams, setTeams] = useState([{ id: 1, name: '영업팀' }]);
    const [salespersons, setSalespersons] = useState([]);
    const [selectedTeam, setSelectedTeam] = useState(null);

    const [editingTeamId, setEditingTeamId] = useState(null);
    const [teamEditName, setTeamEditName] = useState('');

    const [editingSpId, setEditingSpId] = useState(null);
    const [spEditName, setSpEditName] = useState('');

    const [selectedTeamIds, setSelectedTeamIds] = useState(new Set());
    const [selectedSpIds, setSelectedSpIds] = useState(new Set());

    useEffect(() => {
        const loadOrg = async () => {
            if (!profile?.company_id) return;
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('data')
                    .eq('company_id', profile.company_id)
                    .single();

                if (data && data.data) {
                    const settings = data.data;
                    if (settings.teams) setTeams(settings.teams);
                    if (settings.salespersons) setSalespersons(settings.salespersons);
                }
            } catch (e) {
                console.warn('Failed to load org settings from Supabase', e);
            }
        };
        loadOrg();
    }, [profile]);

    const saveChanges = async (newTeams, newSps) => {
        if (!profile?.company_id) return;
        try {
            // 1. Get current settings
            const { data: current, error: fetchErr } = await supabase
                .from('settings')
                .select('data')
                .eq('company_id', profile.company_id)
                .single();

            let newData = current?.data || {};
            newData.teams = newTeams;
            newData.salespersons = newSps;

            // 2. Upsert settings
            const { error: upsertErr } = await supabase
                .from('settings')
                .upsert({ company_id: profile.company_id, data: newData });

            if (upsertErr) throw upsertErr;

            localStorage.setItem('dashboard_settings', JSON.stringify(newData));

            if (setMasterData && masterData) {
                setMasterData({ ...masterData });
            }
        } catch (e) {
            console.warn('Failed to save org to Supabase', e);
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

        if (selectedTeamIds.has(id)) {
            const newSet = new Set(selectedTeamIds);
            newSet.delete(id);
            setSelectedTeamIds(newSet);
        }
    };

    const handleToggleSelectAllTeams = (e) => {
        if (e.target.checked) setSelectedTeamIds(new Set(teams.map(t => t.id)));
        else setSelectedTeamIds(new Set());
    };
    const handleToggleSelectTeam = (id) => {
        const newSet = new Set(selectedTeamIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedTeamIds(newSet);
    };
    const handleDeleteSelectedTeams = () => {
        if (selectedTeamIds.size === 0) return;
        if (!window.confirm(`선택한 ${selectedTeamIds.size}개의 팀을 삭제하시겠습니까? 데이터는 "기타" 팀으로 집계됩니다.`)) return;
        const updated = teams.filter(t => !selectedTeamIds.has(t.id));
        setTeams(updated);
        if (selectedTeamIds.has(selectedTeam)) setSelectedTeam(null);
        saveChanges(updated, salespersons);
        setSelectedTeamIds(new Set());
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

        if (selectedSpIds.has(id)) {
            const newSet = new Set(selectedSpIds);
            newSet.delete(id);
            setSelectedSpIds(newSet);
        }
    };

    const handleToggleSelectAllSps = (e, currentList) => {
        if (e.target.checked) setSelectedSpIds(new Set(currentList.map(s => s.id)));
        else setSelectedSpIds(new Set());
    };
    const handleToggleSelectSp = (id) => {
        const newSet = new Set(selectedSpIds);
        if (newSet.has(id)) newSet.delete(id);
        else newSet.add(id);
        setSelectedSpIds(newSet);
    };
    const handleDeleteSelectedSps = () => {
        if (selectedSpIds.size === 0) return;
        if (!window.confirm(`선택한 ${selectedSpIds.size}명의 영업사원을 삭제하시겠습니까?`)) return;
        const updated = salespersons.filter(s => !selectedSpIds.has(s.id));
        setSalespersons(updated);
        saveChanges(teams, updated);
        setSelectedSpIds(new Set());
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

    const handleMoveSpUp = (e, spId) => {
        e.stopPropagation();
        const idx = salespersons.findIndex(s => s.id === spId);
        if (idx <= 0) return;

        const updated = [...salespersons];
        const temp = updated[idx - 1];
        updated[idx - 1] = updated[idx];
        updated[idx] = temp;

        setSalespersons(updated);
        saveChanges(teams, updated);
    };

    const handleMoveSpDown = (e, spId) => {
        e.stopPropagation();
        const idx = salespersons.findIndex(s => s.id === spId);
        if (idx === -1 || idx === salespersons.length - 1) return;

        const updated = [...salespersons];
        const temp = updated[idx + 1];
        updated[idx + 1] = updated[idx];
        updated[idx] = temp;

        setSalespersons(updated);
        saveChanges(teams, updated);
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
                    {teams.length > 0 && (
                        <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={selectedTeamIds.size === teams.length && teams.length > 0}
                                    onChange={handleToggleSelectAllTeams}
                                    className="w-4 h-4 text-indigo-500 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer"
                                />
                                <span className="text-sm font-black text-slate-700">전체 선택</span>
                            </label>
                            {selectedTeamIds.size > 0 && (
                                <button
                                    onClick={handleDeleteSelectedTeams}
                                    className="text-xs font-bold px-4 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors border border-rose-100"
                                >
                                    선택 항목 삭제 ({selectedTeamIds.size})
                                </button>
                            )}
                        </div>
                    )}
                    {teams.map((team, index) => (
                        <div
                            key={team.id || typeof team === 'string' ? team : `team-${Math.random()}`}
                            className={`flex flex-col md:flex-row md:items-center justify-between p-4 cursor-pointer rounded-2xl border shadow-sm transition-all ${selectedTeam === team.id ? 'bg-indigo-50 border-indigo-200 ring-1 ring-indigo-500/20' : 'bg-white border-slate-100'}`}
                            onClick={() => setSelectedTeam(team.id)}
                        >
                            <div className="flex items-center gap-4">
                                <input
                                    type="checkbox"
                                    checked={selectedTeamIds.has(team.id)}
                                    onChange={() => handleToggleSelectTeam(team.id)}
                                    className="w-4 h-4 text-indigo-500 rounded border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                />
                                {editingTeamId === team.id ? (
                                    <div className="flex items-center gap-2">
                                        <input
                                            autoFocus
                                            type="text"
                                            value={teamEditName}
                                            onChange={(e) => setTeamEditName(e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                    e.stopPropagation();
                                                    handleSaveTeamEdit(team.id);
                                                }
                                            }}
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

            <SettingCard title="영업사원 마스터" icon={Building2} desc={
                <>
                    {selectedTeam ? `선택된 팀: ${teams.find(t => t.id === selectedTeam)?.name || '이름 없음'} (미등록 사원은 '기타'로 집계)` : "먼저 대상 팀을 선택해주세요"}
                    <span className="block mt-1.5 text-[12px] font-bold text-slate-400 tracking-tight flex items-center gap-1.5">
                        <Info size={12} className="text-indigo-400" /> 여기서 설정한 배치 순서에 따라 메인 대시보드에도 순서대로 표시됩니다.
                    </span>
                </>
            }>
                {selectedTeam ? (
                    <div className="space-y-3">
                        {currentSpList.length > 0 && (
                            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={currentSpList.length > 0 && currentSpList.every(s => selectedSpIds.has(s.id))}
                                        onChange={(e) => handleToggleSelectAllSps(e, currentSpList)}
                                        className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                                    />
                                    <span className="text-sm font-black text-slate-700">전체 선택</span>
                                </label>
                                {selectedSpIds.size > 0 && (
                                    <button
                                        onClick={handleDeleteSelectedSps}
                                        className="text-xs font-bold px-4 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors border border-rose-100"
                                    >
                                        선택 항목 삭제 ({Array.from(selectedSpIds).filter(id => currentSpList.some(s => s.id === id)).length})
                                    </button>
                                )}
                            </div>
                        )}
                        {currentSpList.length === 0 && (
                            <div className="py-8 text-center text-sm font-bold text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                                등록된 담당 사원이 없습니다.
                            </div>
                        )}
                        {currentSpList.map(sp => (
                            <div key={sp.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="checkbox"
                                        checked={selectedSpIds.has(sp.id)}
                                        onChange={() => handleToggleSelectSp(sp.id)}
                                        className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer shrink-0"
                                    />
                                    <div className="w-8 h-8 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-500 font-black text-xs shrink-0">
                                        {sp?.name?.[0] || '?'}
                                    </div>
                                    {editingSpId === sp.id ? (
                                        <div className="flex items-center gap-2">
                                            <input
                                                autoFocus
                                                type="text"
                                                value={spEditName}
                                                onChange={(e) => setSpEditName(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.stopPropagation();
                                                        handleSaveSpEdit(sp.id);
                                                    }
                                                }}
                                                className="px-3 py-1.5 border border-indigo-200 rounded-lg text-sm font-black outline-none focus:ring-2 ring-indigo-500/30"
                                                onClick={(e) => e.stopPropagation()}
                                            />
                                            <button onClick={(e) => { e.stopPropagation(); handleSaveSpEdit(sp.id); }} className="text-xs bg-indigo-600 text-white px-3 py-1.5 rounded-lg font-bold">확인</button>
                                        </div>
                                    ) : (
                                        <span className="text-[14px] text-slate-700 font-bold">{sp.name}</span>
                                    )}
                                </div>
                                {editingSpId !== sp.id && (
                                    <div className="flex items-center gap-2 mt-3 md:mt-0">
                                        <button onClick={(e) => { e.stopPropagation(); setSpEditName(sp.name); setEditingSpId(sp.id); }} className="text-[11px] font-bold px-3 py-1 rounded-md bg-slate-100 text-slate-500 hover:bg-indigo-100 hover:text-indigo-600">수정</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDeleteSp(sp.id); }} className="text-[11px] font-bold px-3 py-1 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600">삭제</button>
                                        <div className="flex items-center border border-slate-200 rounded-md ml-2 overflow-hidden bg-slate-50">
                                            <button
                                                onClick={(e) => handleMoveSpUp(e, sp.id)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors border-r border-slate-200"
                                                title="순서 위로 이동"
                                            >
                                                <ArrowUp size={14} strokeWidth={3} />
                                            </button>
                                            <button
                                                onClick={(e) => handleMoveSpDown(e, sp.id)}
                                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-white transition-colors"
                                                title="순서 아래로 이동"
                                            >
                                                <ArrowDown size={14} strokeWidth={3} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                        <button onClick={handleAddSp} className="w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-black hover:bg-slate-50 hover:border-emerald-200 hover:text-emerald-500 transition-all mt-4">
                            + 새로운 영업사원 추가
                        </button>
                    </div>
                ) : (
                    <div className="py-12 text-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-4">
                            <Users size={32} />
                        </div>
                        <p className="text-slate-400 font-bold">좌측 영업팀 목록에서 관리할 팀을 선택해주세요.</p>
                    </div>
                )}
            </SettingCard>
        </div >
    );
}

/**
 * 3. 유형명 설정
 */
function TypesSubView({ masterData, setMasterData, profile }) {
    const [types, setTypes] = useState([
        { id: 'T01', name: '영업유형' }
    ]);
    const [editingTypeId, setEditingTypeId] = useState(null);
    const [typeEditName, setTypeEditName] = useState('');
    const [selectedTypeIds, setSelectedTypeIds] = useState(new Set());

    useEffect(() => {
        const loadTypes = async () => {
            if (!profile?.company_id) return;
            try {
                const { data, error } = await supabase
                    .from('settings')
                    .select('data')
                    .eq('company_id', profile.company_id)
                    .single();

                if (data && data.data && data.data.types) {
                    setTypes(data.data.types);
                }
            } catch (e) {
                console.error('Settings load failed from Supabase', e);
            }
        };
        loadTypes();
    }, [profile]);

    const saveChanges = async (updatedTypes) => {
        if (!profile?.company_id) return;
        try {
            // 1. Get current settings
            const { data: current, error: fetchErr } = await supabase
                .from('settings')
                .select('data')
                .eq('company_id', profile.company_id)
                .single();

            let newData = current?.data || {};
            newData.types = updatedTypes;

            // 2. Upsert settings
            const { error: upsertErr } = await supabase
                .from('settings')
                .upsert({ company_id: profile.company_id, data: newData });

            if (upsertErr) throw upsertErr;

            localStorage.setItem('dashboard_settings', JSON.stringify(newData));

            if (masterData) {
                setMasterData({ ...masterData });
            }
        } catch (e) {
            console.error('Save to Supabase failed', e);
        }
    };

    const handleAddType = () => {
        const newType = { id: `T${Date.now()}`, name: `새 유형${types.length + 1}` };
        const updated = [...types, newType];
        setTypes(updated);
        saveChanges(updated);
        setEditingTypeId(newType.id);
        setTypeEditName(newType.name);
    };

    const handleDeleteType = (id) => {
        if (!confirm('유형을 삭제하시겠습니까? 관련 데이터가 "기타"로 분류됩니다.')) return;
        const updated = types.filter(t => t.id !== id);
        setTypes(updated);
        saveChanges(updated);

        if (selectedTypeIds.has(id)) {
            const newSet = new Set(selectedTypeIds);
            newSet.delete(id);
            setSelectedTypeIds(newSet);
        }
    };

    const handleToggleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedTypeIds(new Set(types.map(t => t.id)));
        } else {
            setSelectedTypeIds(new Set());
        }
    };

    const handleToggleSelectType = (id) => {
        const newSet = new Set(selectedTypeIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedTypeIds(newSet);
    };

    const handleDeleteSelected = () => {
        if (selectedTypeIds.size === 0) return;
        if (!confirm(`선택한 ${selectedTypeIds.size}개의 유형을 삭제하시겠습니까? 관련 데이터가 "기타"로 분류됩니다.`)) return;
        const updated = types.filter(t => !selectedTypeIds.has(t.id));
        setTypes(updated);
        saveChanges(updated);
        setSelectedTypeIds(new Set());
    };

    const handleSaveTypeEdit = (id) => {
        if (!typeEditName.trim()) {
            alert('이름을 입력해주세요.');
            return;
        }
        const updated = types.map(t => t.id === id ? { ...t, name: typeEditName } : t);
        setTypes(updated);
        setEditingTypeId(null);
        saveChanges(updated);
    };

    const handleMoveTypeUp = (e, index) => {
        e.stopPropagation();
        if (index === 0) return;
        const updated = [...types];
        const temp = updated[index - 1];
        updated[index - 1] = updated[index];
        updated[index] = temp;
        setTypes(updated);
        saveChanges(updated);
    };

    const handleMoveTypeDown = (e, index) => {
        e.stopPropagation();
        if (index === types.length - 1) return;
        const updated = [...types];
        const temp = updated[index + 1];
        updated[index + 1] = updated[index];
        updated[index] = temp;
        setTypes(updated);
        saveChanges(updated);
    };

    return (
        <div className="bg-white rounded-[32px] border border-slate-200 p-8">
            <div className="flex items-center gap-4 mb-8">
                <div className="p-4 bg-amber-50 rounded-2xl text-amber-500">
                    <Type size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black text-slate-800">품목 유형 관리</h3>
                    <p className="text-sm text-slate-400 font-bold flex items-center gap-1.5 mt-1">
                        활성 제품 유형 구성 및 순서 설정 (미등록 품목은 '기타'로 합산)
                        <span className="block mt-1 text-[12px] font-bold text-slate-400 tracking-tight flex items-center gap-1.5">
                            <Info size={12} className="text-amber-500" /> 여기서 설정한 배치 순서에 따라 메인 대시보드(유형별)에도 순서대로 표시됩니다.
                        </span>
                    </p>
                </div>
            </div>
            <div className="max-w-3xl space-y-3">
                {types.length > 0 && (
                    <div className="flex items-center justify-between px-4 py-2 bg-slate-50 rounded-2xl border border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={selectedTypeIds.size === types.length && types.length > 0}
                                onChange={handleToggleSelectAll}
                                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer"
                            />
                            <span className="text-sm font-black text-slate-700">전체 선택</span>
                        </label>
                        {selectedTypeIds.size > 0 && (
                            <button
                                onClick={handleDeleteSelected}
                                className="text-xs font-bold px-4 py-1.5 rounded-lg bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600 transition-colors border border-rose-100"
                            >
                                선택 항목 삭제 ({selectedTypeIds.size})
                            </button>
                        )}
                    </div>
                )}
                {types.map((type, index) => (
                    <div
                        key={type.id || typeof type === 'string' ? type : `type-${index}`}
                        className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-2xl border border-slate-100 shadow-sm bg-white"
                    >
                        <div className="flex items-center gap-4">
                            <input
                                type="checkbox"
                                checked={selectedTypeIds.has(type.id)}
                                onChange={() => handleToggleSelectType(type.id)}
                                className="w-4 h-4 text-amber-500 rounded border-slate-300 focus:ring-amber-500 cursor-pointer shrink-0"
                                onClick={(e) => e.stopPropagation()}
                            />
                            {editingTypeId === type.id ? (
                                <div className="flex items-center gap-2">
                                    <input
                                        autoFocus
                                        type="text"
                                        value={typeEditName}
                                        onChange={(e) => setTypeEditName(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.stopPropagation();
                                                handleSaveTypeEdit(type.id);
                                            }
                                        }}
                                        className="px-3 py-1.5 border border-amber-200 rounded-lg text-sm font-black outline-none focus:ring-2 ring-amber-500/30"
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                    <button onClick={(e) => { e.stopPropagation(); handleSaveTypeEdit(type.id); }} className="text-xs bg-amber-500 text-white px-3 py-1.5 rounded-lg font-bold">확인</button>
                                </div>
                            ) : (
                                <span className="text-[15px] text-slate-800 font-extrabold">{type?.name || type}</span>
                            )}
                        </div>
                        {editingTypeId !== type.id && (
                            <div className="flex items-center gap-2 mt-3 md:mt-0">
                                <button onClick={(e) => { e.stopPropagation(); setTypeEditName(type.name); setEditingTypeId(type.id); }} className="text-[11px] font-bold px-3 py-1 rounded-md bg-slate-100 text-slate-500 hover:bg-amber-100 hover:text-amber-600">수정</button>
                                <button onClick={(e) => { e.stopPropagation(); handleDeleteType(type.id); }} className="text-[11px] font-bold px-3 py-1 rounded-md bg-rose-50 text-rose-500 hover:bg-rose-100 hover:text-rose-600">삭제</button>
                                <div className="flex items-center border border-slate-200 rounded-md ml-2 overflow-hidden bg-slate-50">
                                    <button onClick={(e) => handleMoveTypeUp(e, index)} disabled={index === 0} className={`p-1.5 text-slate-400 hover:text-amber-500 hover:bg-white transition-colors border-r border-slate-200 ${index === 0 ? 'opacity-30 cursor-not-allowed' : ''}`} title="순서 위로 이동">
                                        <ArrowUp size={14} strokeWidth={3} />
                                    </button>
                                    <button onClick={(e) => handleMoveTypeDown(e, index)} disabled={index === types.length - 1} className={`p-1.5 text-slate-400 hover:text-amber-500 hover:bg-white transition-colors ${index === types.length - 1 ? 'opacity-30 cursor-not-allowed' : ''}`} title="순서 아래로 이동">
                                        <ArrowDown size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                <button onClick={handleAddType} className="max-w-3xl w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 text-sm font-black hover:bg-slate-50 hover:border-amber-200 hover:text-amber-500 transition-all mt-4">
                    + 새로운 유형 추가
                </button>
            </div>
        </div>
    );
}

/**
 * 4. 데이터 업로드 센터 (원본 스타일 유지하되 정제)
 */
function DataUploadSubView({ setMasterData, masterData, profile }) {
    const salesInputRef = useRef(null);
    const targetInputRef = useRef(null);

    // 파일 선택 상태
    const [selectedFiles, setSelectedFiles] = useState({ sales: null, target: null });
    // 최근 업로드 정보
    const [uploadHistory, setUploadHistory] = useState(() => {
        try {
            const saved = localStorage.getItem('dashboard_upload_history');
            return saved ? JSON.parse(saved) : {
                sales: { filename: '-', time: '-' },
                target: { filename: '-', time: '-' }
            };
        } catch (e) {
            return {
                sales: { filename: '-', time: '-' },
                target: { filename: '-', time: '-' }
            };
        }
    });

    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        localStorage.setItem('dashboard_upload_history', JSON.stringify(uploadHistory));
    }, [uploadHistory]);

    const handleFileSelect = (e, type) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFiles(prev => ({ ...prev, [type]: file }));
        }
    };

    const handleFileUploadExecute = (type) => {
        const file = selectedFiles[type];
        if (!file) {
            alert('먼저 파일을 선택해 주세요.');
            return;
        }

        setIsUploading(true);
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target.result;
                const wb = window.XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                let uploadedRows = window.XLSX.utils.sheet_to_json(ws);

                if (uploadedRows.length === 0) {
                    alert('파일에 데이터가 없습니다.');
                    return;
                }

                // 1. 데이터 매핑 및 필터링
                const months = [...new Set(uploadedRows.map(r => String(r['년도월'])))];

                const mappedData = uploadedRows.map(row => {
                    const cleanValue = (val) => String(val || '').trim().replace(/^'/, '');
                    if (type === 'sales') {
                        return {
                            company_id: profile.company_id,
                            year_month: cleanValue(row['년도월']),
                            team_name: cleanValue(row['영업팀']),
                            person_name: cleanValue(row['영업사원명']),
                            customer_code: cleanValue(row['거래처코드']),
                            customer_name: cleanValue(row['거래처명']),
                            type_name: cleanValue(row['품목유형']),
                            item_code: cleanValue(row['품목코드']),
                            item_name: cleanValue(row['품목명']),
                            amount: Number(row['금액'] || row['매출금액'] || 0)
                        };
                    } else {
                        return {
                            company_id: profile.company_id,
                            year_month: cleanValue(row['년도월']),
                            team_name: cleanValue(row['영업팀']),
                            person_name: cleanValue(row['영업사원명']),
                            amount: Number(row['금액'] || row['목표금액'] || 0)
                        };
                    }
                });

                // 2. Supabase 동기화 (기존 해당 월 데이터 삭제 후 삽입)
                const tableName = type === 'sales' ? 'sales_actual' : 'sales_target';

                const { error: delError } = await supabase
                    .from(tableName)
                    .delete()
                    .eq('company_id', profile.company_id)
                    .in('year_month', months);

                if (delError) throw delError;

                const CHUNK_SIZE = 1000;
                for (let i = 0; i < mappedData.length; i += CHUNK_SIZE) {
                    const chunk = mappedData.slice(i, i + CHUNK_SIZE);
                    const { error: insError } = await supabase
                        .from(tableName)
                        .insert(chunk);
                    if (insError) throw insError;
                }

                alert(`${type === 'sales' ? '매출' : '목표'} 데이터 ${mappedData.length}건이 업로드되었습니다.`);

                const now = new Date();
                const timeStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

                setUploadHistory(prev => ({
                    ...prev,
                    [type]: { filename: file.name, time: timeStr }
                }));

                setSelectedFiles(prev => ({ ...prev, [type]: null }));
                if (type === 'sales') salesInputRef.current.value = '';
                if (type === 'target') targetInputRef.current.value = '';

            } catch (e) {
                console.error('Upload failed:', e);
                alert(`업로드 중 오류가 발생했습니다: ${e.message}`);
            } finally {
                setIsUploading(false);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleDownloadExample = (type, mode = 'example') => {
        let data = [];
        if (mode === 'example') {
            const dataset = generateFullDataset();
            data = type === 'sales' ? dataset.actual : dataset.target;
        } else {
            if (type === 'sales') {
                data = [{
                    '년도월': '202601(예시)',
                    '영업팀': '영업1팀',
                    '영업사원명': '홍길동',
                    '거래처코드': 'C001',
                    '거래처명': '거래처A',
                    '품목유형': '치즈',
                    '품목코드': 'P001',
                    '품목명': '상품A',
                    '매출금액': 1000000,
                    '중량(KG)': 10.5
                }];
            } else if (type === 'target') {
                data = [{
                    '년도월': '202601(예시)',
                    '영업팀': '영업1팀',
                    '영업사원명': '홍길동',
                    '거래처코드': 'C001',
                    '거래처명': '거래처A',
                    '품목유형': '치즈',
                    '목표금액': 1200000
                }];
            } else if (type === 'bonds') {
                data = [{
                    '청구서ID': 'INV-001',
                    '거래처ID': 'C001',
                    '거래처명': '거래처A',
                    '청구일자': '2026-01-01',
                    '만기일': '2026-01-31',
                    '금액': 5000000,
                    '결제완료': 'N',
                    '연체여부': 'N',
                    '연체일수': 0
                }];
            }

        }

        const csv = convertToCSV(data);
        let filename = '';
        if (mode === 'example') {
            filename = type === 'sales' ? '판매데이터_2025.csv' : 'Target_Data_Example.csv';
        } else {
            const currentYear = new Date().getFullYear();
            filename = type === 'sales' ? `판매데이터_${currentYear}.csv` : `Target_Upload_Form_${currentYear}.csv`;
        }
        downloadCSV(csv, filename);
    };

    const handleResetData = () => {
        if (window.confirm('모든 매출 및 목표 데이터를 초기화하시겠습니까? 초기화 후에는 복구할 수 없습니다.')) {
            setMasterData({ actual: [], target: [] });

            // 서버 데이터 초기화 추가
            fetch(`${API_BASE_URL}/api/master-data/reset`, {
                method: 'POST'
            }).catch(e => console.error('Server reset failed', e));

            if (setLastUpdated) {
                const now = new Date();
                setLastUpdated(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`);
            }
            alert('데이터가 초기화되었습니다.');
        }
    };

    return (
        <div className="space-y-8">
            <div className="bg-white border-2 border-indigo-100 rounded-[32px] p-8 mb-8 shadow-sm">
                <div className="flex items-start gap-5">
                    <div className="p-4 bg-indigo-500 text-white rounded-2xl shadow-lg ring-4 ring-indigo-50">
                        <Zap size={24} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-slate-800 mb-3 tracking-tighter uppercase">Data Upload Master Guide</h4>
                        <ul className="space-y-2.5 text-[12px] text-slate-500 font-bold leading-relaxed">
                            <li className="flex gap-2">• <span className="text-slate-700">작성 요령:</span> 다운로드한 양식의 <b>1행은 제목(헤더)</b>이며, 2행부터 실제 데이터를 입력해 주세요.</li>
                            <li className="flex gap-2">• <span className="text-slate-700">스마트 매칭(월별 업로드):</span> 기존 전체 데이터를 지울 필요 없이, <b>추가된 달의 데이터만 파일로 만들어 업로드</b> 하시면 해당 월만 자동 갱신됩니다.</li>
                        </ul>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mt-6 pt-6 border-t border-slate-100">
                            <div>
                                <h5 className="text-[13px] font-black text-indigo-600 mb-2 uppercase flex items-center gap-2">
                                    <Filter size={14} /> 매출 실적 업로드 가이드 (표준 양식)
                                </h5>
                                <ul className="space-y-2.5 text-[12px] text-slate-500 font-bold leading-relaxed">
                                    <li className="flex gap-2">• <span className="text-slate-700">필수 항목:</span> 년도월(YYYYMM), 영업팀, 영업사원, 매출액, 중량(kg)은 반드시 포함되어야 합니다.</li>
                                    <li className="flex gap-2">• <span className="text-slate-700">분석 항목:</span> 거래처코드/명, 품목코드/명, 유형명, 단위, 중량, 입수 등을 입력하면 더 정밀한 분석이 가능합니다.</li>
                                    <li className="flex gap-2">• <span className="text-slate-700">파일 형식:</span> 엑셀(.xlsx, .xls) 또는 CSV 파일을 지원합니다.</li>
                                    <li className="flex gap-2">• <span className="text-slate-700">자동 보정:</span> '1팀'이라고 입력해도 시스템이 '영업1팀'으로 자동 인식합니다.</li>
                                </ul>
                            </div>
                            <div>
                                <h5 className="text-[13px] font-black text-emerald-600 mb-2 uppercase flex items-center gap-2">
                                    <Target size={14} /> 목표 데이터 업로드 가이드 (선택적 배분)
                                </h5>
                                <ul className="space-y-2.5 text-[12px] text-slate-500 font-bold leading-relaxed">
                                    <li className="flex gap-2">• <span className="text-slate-700">수준별 목표:</span> 사원까지만 관리하려면 거래처/유형을 비워두세요.</li>
                                    <li className="flex flex-wrap items-center gap-y-1">
                                        <span className="mr-2">• <span className="text-slate-700">유연한 매칭:</span> 정보의 깊이에 따라 목표를 자동 합산합니다.</span>
                                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black cursor-help relative group whitespace-nowrap border border-indigo-100 transition-colors hover:bg-indigo-600 hover:text-white">
                                            자세한 설명 <Info size={10} />
                                            <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 text-white p-4 rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-[11px] border border-slate-700 text-left whitespace-normal">
                                                <p className="font-black text-amber-400 mb-2">💡 구체적인 동작 방식 (예시)</p>
                                                <div className="space-y-3 font-bold leading-normal text-slate-300">
                                                    <div>
                                                        <p className="text-white">1단계: 영업사원 단위 관리</p>
                                                        <p className="text-[10px]">사원명만 입력 시 해당 사원의 총량 목표로 인식</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white">2단계: 거래처 단위 관리</p>
                                                        <p className="text-[10px]">거래처코드 입력 시 특정 거래처 전용 목표로 인식</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-white">3단계: 품목 유형 단위 관리</p>
                                                        <p className="text-[10px]">유형명까지 입력 시 가장 상세한 하위 목표로 인식</p>
                                                    </div>
                                                    <p className="pt-1 text-slate-500 border-t border-slate-800 text-[9px]">* 어떤 수준으로 입력하든 상위 레벨로 자동 통합 집계됩니다.</p>
                                                </div>
                                            </div>
                                        </span>
                                    </li>
                                </ul>
                            </div>
                            {/* 채권 가이드 제거 */}
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <SettingCard
                    title="매출 실적 파일"
                    icon={Filter}
                    desc="ERP 시스템에서 추출된 마스타 데이터 업로드"
                    extra={
                        <div className="flex gap-2">
                            <button onClick={() => handleDownloadExample('sales', 'example')} className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-black hover:bg-indigo-100 transition-all border border-indigo-100">예시 다운로드</button>
                            <button onClick={() => handleDownloadExample('sales', 'form')} className="px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-black hover:bg-slate-100 transition-all border border-slate-200">업로드 양식 다운로드</button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-sm font-bold text-slate-500 truncate">
                                {selectedFiles.sales ? selectedFiles.sales.name : '선택된 파일 없음'}
                            </div>
                            <input type="file" ref={salesInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'sales')} accept=".csv,.xlsx" />
                            <button onClick={() => salesInputRef.current.click()} className="px-6 h-12 bg-slate-800 text-white rounded-xl font-black text-sm hover:bg-slate-700 transition-all shadow-sm">찾아보기</button>
                            <button onClick={() => handleFileUploadExecute('sales')} className="px-6 h-12 bg-indigo-600 text-white rounded-xl font-black text-sm hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100">업로드</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">최근 업로드 파일</p>
                                <p className="text-sm font-black text-slate-700 truncate">{uploadHistory.sales.filename}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">최근 업로드 일시</p>
                                <p className="text-sm font-black text-slate-700">{uploadHistory.sales.time}</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-rose-500 font-black italic bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">※ 파일 업로드 시 해당 년도월의 기존 데이터가 자동으로 덮어씌워집니다.</p>
                    </div>
                </SettingCard>

                <SettingCard
                    title="목표 데이터 파일"
                    icon={Target}
                    desc="연간 및 월간 목표 수립 데이터 업로드"
                    extra={
                        <div className="flex gap-2">
                            <button onClick={() => handleDownloadExample('target', 'example')} className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-black hover:bg-emerald-100 transition-all border border-emerald-100">예시 다운로드</button>
                            <button onClick={() => handleDownloadExample('target', 'form')} className="px-3 py-1.5 bg-white text-slate-600 rounded-lg text-xs font-black hover:bg-slate-100 transition-all border border-slate-200">업로드 양식 다운로드</button>
                        </div>
                    }
                >
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1 h-12 px-4 bg-slate-50 border border-slate-200 rounded-xl flex items-center text-sm font-bold text-slate-500 truncate">
                                {selectedFiles.target ? selectedFiles.target.name : '선택된 파일 없음'}
                            </div>
                            <input type="file" ref={targetInputRef} className="hidden" onChange={(e) => handleFileSelect(e, 'target')} accept=".csv,.xlsx" />
                            <button onClick={() => targetInputRef.current.click()} className="px-6 h-12 bg-slate-800 text-white rounded-xl font-black text-sm hover:bg-slate-700 transition-all shadow-sm">찾아보기</button>
                            <button onClick={() => handleFileUploadExecute('target')} className="px-6 h-12 bg-emerald-600 text-white rounded-xl font-black text-sm hover:bg-emerald-700 transition-all shadow-md shadow-emerald-100">업로드</button>
                        </div>

                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-50">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">최근 업로드 파일</p>
                                <p className="text-sm font-black text-slate-700 truncate">{uploadHistory.target.filename}</p>
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1">최근 업로드 일시</p>
                                <p className="text-sm font-black text-slate-700">{uploadHistory.target.time}</p>
                            </div>
                        </div>
                        <p className="text-[10px] text-rose-500 font-black italic bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-100">※ 파일 업로드 시 해당 년도월의 기존 목표가 자동으로 덮어씌워집니다.</p>
                    </div>
                </SettingCard>

                {/* 채권 업로드 카드 제거 */}
            </div>

            <div className="flex justify-center pt-8">
                <button
                    onClick={handleResetData}
                    className="flex items-center gap-2 px-8 py-4 bg-rose-50 text-rose-600 rounded-[24px] font-black text-sm hover:bg-rose-100 transition-all border border-rose-100 shadow-sm"
                >
                    <AlertCircle size={18} />
                    전체 데이터 초기화
                </button>
            </div>
        </div >
    );
}

/**
 * 5. 접속 로그 모니터링
 */
function LogsSubView() {
    return (
        <div className="bg-white rounded-[32px] border border-slate-200 overflow-hidden shadow-sm p-20 text-center">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mx-auto mb-6">
                <Globe size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">Cloud Activity Logs</h3>
            <p className="text-slate-400 font-bold max-w-md mx-auto">
                클라우드 기반의 실시간 시스템 활동 로그 서비스 준비 중입니다.<br />
                조만간 모든 구성원의 활동 내역을 확인하실 수 있습니다.
            </p>
        </div>
    );
}

function SettingCard({ title, icon: Icon, desc, extra, children }) {
    return (
        <div className="bg-white border border-slate-200 rounded-[40px] p-8 shadow-sm hover:shadow-md transition-all">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mb-8">
                <div className="flex items-start gap-5">
                    <div className="p-4 bg-slate-50 rounded-2xl text-slate-900 border border-slate-100 shadow-sm">
                        <Icon size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-black text-slate-800">{title}</h3>
                        <p className="text-sm font-bold text-slate-400 mt-1">{desc}</p>
                    </div>
                </div>
                {extra}
            </div>
            {children}
        </div>
    );
}

function AccountsSubView({ profile }) {
    const [companyInfo, setCompanyInfo] = useState(null);
    const [members, setMembers] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        if (!profile?.company_id) return;
        setIsLoading(true);
        try {
            // 1. Fetch company details
            const { data: company, error: compErr } = await supabase
                .from('companies')
                .select('*')
                .eq('id', profile.company_id)
                .single();
            if (compErr) throw compErr;
            setCompanyInfo(company);

            // 2. Fetch all members
            const { data: mems, error: memErr } = await supabase
                .from('profiles')
                .select('*')
                .eq('company_id', profile.company_id)
                .order('created_at', { ascending: true });
            if (memErr) throw memErr;
            setMembers(mems);
        } catch (e) {
            console.error('Failed to fetch members:', e);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [profile]);

    const handleApprove = async (id) => {
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: 'approved' })
                .eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (e) {
            alert('승인 중 오류가 발생했습니다.');
        }
    };

    const handleReject = async (id) => {
        if (!confirm('가입 신청을 거절하시겠습니까? 해당 사용자의 프로필 정보가 업데이트됩니다.')) return;
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ company_id: null, status: 'pending' }) // Reset to pending/none
                .eq('id', id);
            if (error) throw error;
            fetchData();
        } catch (e) {
            alert('처리에 실패했습니다.');
        }
    };

    const handleUpdateCode = async () => {
        const newCode = prompt('새로운 가입 코드를 입력하세요 (최소 4자):', companyInfo.registration_code);
        if (!newCode || newCode.length < 4) return;

        try {
            const { error } = await supabase
                .from('companies')
                .update({ registration_code: newCode })
                .eq('id', profile.company_id);
            if (error) throw error;
            fetchData();
        } catch (e) {
            alert('업데이트 실패: ' + e.message);
        }
    };

    const handleUpdatePW = async () => {
        const newPW = prompt('새로운 가입 비밀번호를 입력하세요:', companyInfo.registration_password);
        if (!newPW) return;

        try {
            const { error } = await supabase
                .from('companies')
                .update({ registration_password: newPW })
                .eq('id', profile.company_id);
            if (error) throw error;
            fetchData();
        } catch (e) {
            alert('업데이트 실패: ' + e.message);
        }
    };

    if (isLoading) return <div className="p-20 text-center text-slate-400 font-bold">Loading members...</div>;

    const pendingMembers = members.filter(m => m.status === 'pending');
    const approvedMembers = members.filter(m => m.status === 'approved');

    return (
        <div className="space-y-8">
            {/* Company Access Credentials */}
            <SettingCard title="회사 가입 정보" icon={Building2} desc="새 구성원이 가입할 때 사용하는 코드와 비밀번호입니다.">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Join Code</span>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-indigo-600 tracking-tighter uppercase">{companyInfo?.registration_code}</span>
                            <button onClick={handleUpdateCode} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><Settings size={18} /></button>
                        </div>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex flex-col gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Join Secret</span>
                        <div className="flex items-center justify-between">
                            <span className="text-2xl font-black text-slate-800 tracking-tighter">••••••</span>
                            <button onClick={handleUpdatePW} className="p-2 hover:bg-white rounded-xl text-slate-400 hover:text-indigo-600 transition-all"><Settings size={18} /></button>
                        </div>
                    </div>
                </div>
            </SettingCard>

            {/* Pending Requests */}
            {pendingMembers.length > 0 && (
                <SettingCard title="가입 승인 대기" icon={Clock} desc="참여 신청 후 승인을 기다리는 구성원입니다." color="amber">
                    <div className="space-y-3">
                        {pendingMembers.map(m => (
                            <div key={m.id} className="p-5 bg-white border border-amber-100 rounded-[28px] shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 font-black text-lg">
                                        {m.full_name?.slice(0, 1)}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-800 leading-tight">{m.full_name}</h4>
                                        <p className="text-[11px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded-md mt-1 w-max">PENDING APPROVAL</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleApprove(m.id)} className="px-5 py-2.5 bg-emerald-500 text-white rounded-2xl text-[11px] font-black hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">승인</button>
                                    <button onClick={() => handleReject(m.id)} className="px-5 py-2.5 bg-slate-50 text-slate-400 rounded-2xl text-[11px] font-black hover:bg-rose-50 hover:text-rose-500 border border-transparent hover:border-rose-100 active:scale-95 transition-all">거절</button>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingCard>
            )}

            {/* Approved Members */}
            <SettingCard title="구성원 목록" icon={Users} desc={`전체 ${approvedMembers.length}명의 승인된 구성원`}>
                <div className="divide-y divide-slate-100 bg-slate-50/50 rounded-3xl border border-slate-100 overflow-hidden">
                    {approvedMembers.map(m => (
                        <div key={m.id} className="p-5 flex items-center justify-between hover:bg-white transition-all group">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 ${m.role === 'admin' ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400'} rounded-2xl flex items-center justify-center font-black text-sm`}>
                                    {m.full_name?.slice(0, 1)}
                                </div>
                                <div>
                                    <h4 className="font-black text-slate-800">{m.full_name}</h4>
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${m.role === 'admin' ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                        {m.role}
                                    </span>
                                </div>
                            </div>
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                {m.id !== profile.id && (
                                    <button onClick={() => handleReject(m.id)} className="p-2 text-slate-300 hover:text-rose-500 transition-colors"><AlertCircle size={18} /></button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </SettingCard>
        </div>
    );
}
