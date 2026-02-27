import { useState, useRef } from 'react';
import { Settings, Calendar as CalendarIcon, Users, Package, Building2, Filter, Upload, ChevronRight, Save, Target, Type, Globe } from 'lucide-react';
import { SETTINGS } from '../data/mockEngine';

export function SettingsView({ setMasterData, setLastUpdated }) {
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
        e.target.value = ''; // 동일 파일 재업로드 가능하도록 초기화
    };
    return (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8 pb-20">
            <header className="mb-10">
                <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2 italic">Dashboard Configuration</h2>
                <p className="text-slate-500 font-medium text-lg">대시보드 환경설정 및 관리</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. 영업일수 설정 */}
                <SettingCard
                    title="영업일수 설정"
                    icon={CalendarIcon}
                    desc="공휴일, 창립 기념일 등 월별 실제 영업일수 관리"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-200">
                            <span className="text-slate-600 font-bold">2026년 2월 총 영업일</span>
                            <div className="flex items-center gap-3">
                                <input type="number" defaultValue={SETTINGS.businessDays['2026-02']} className="w-16 bg-white border border-slate-200 rounded-lg px-3 py-1 text-slate-800 text-center font-bold" />
                                <span className="text-slate-400 text-sm">일</span>
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
                    title="표준 데이터 업로드"
                    icon={Upload}
                    desc="매출 및 목표 표준 데이터 엑셀/CSV 업로드"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <input type="file" ref={salesInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e, 'sales')} />
                            <input type="file" ref={targetInputRef} className="hidden" accept=".xlsx, .xls, .csv" onChange={(e) => handleFileUpload(e, 'target')} />

                            <button onClick={() => salesInputRef.current.click()} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl hover:bg-indigo-50 hover:border-indigo-300 transition-all group active:scale-95">
                                <Filter size={20} className="text-slate-400 group-hover:text-indigo-500 mb-2" />
                                <span className="text-xs font-bold text-slate-600">매출 업로드 (엑셀/CSV)</span>
                            </button>
                            <button onClick={() => targetInputRef.current.click()} className="flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 border-dashed rounded-2xl hover:bg-emerald-50 hover:border-emerald-300 transition-all group active:scale-95">
                                <Target size={20} className="text-slate-400 group-hover:text-emerald-500 mb-2" />
                                <span className="text-xs font-bold text-slate-600">목표 업로드 (엑셀/CSV)</span>
                            </button>
                        </div>
                    </div>
                </SettingCard>
            </div>

            <div className="flex justify-end pt-10">
                <button className="flex items-center gap-2 px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-indigo-600/20 transform active:scale-95 transition-all text-lg">
                    <Save size={20} />
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
