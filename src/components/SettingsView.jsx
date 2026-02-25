import { useState } from 'react';
import { Settings, Calendar as CalendarIcon, Users, Package, Building2, Filter, Upload, ChevronRight, Save, Target } from 'lucide-react';
import { SETTINGS } from '../data/mockEngine';

export function SettingsView() {
    return (
        <div className="animate-in fade-in slide-in-from-bottom-5 duration-700 space-y-8 pb-20">
            <header className="mb-10">
                <h2 className="text-3xl font-black text-white tracking-tighter mb-2 italic">Dashboard Configuration</h2>
                <p className="text-slate-500 font-medium text-lg">기획안 [1. 라. 설정] 및 [마, 바] 표준 항목 관리</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* 1. 영업일수 설정 */}
                <SettingCard
                    title="영업일수 설정"
                    icon={CalendarIcon}
                    desc="공휴일, 창립 기념일 등 월별 실제 영업일수 관리"
                >
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-800/30 rounded-2xl border border-white/5">
                            <span className="text-slate-300 font-bold">2026년 2월 총 영업일</span>
                            <div className="flex items-center gap-3">
                                <input type="number" defaultValue={SETTINGS.businessDays['2026-02']} className="w-16 bg-slate-900 border border-slate-700 rounded-lg px-3 py-1 text-white text-center font-mono" />
                                <span className="text-slate-500 text-sm">일</span>
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-600 leading-relaxed italic">* 목표 대비 진도율 계산의 기준이 됩니다. 실시간 대시보드 반영.</p>
                    </div>
                </SettingCard>

                {/* 2. 조직/영업사원 설정 */}
                <SettingCard
                    title="조직 및 인원 설정"
                    icon={Users}
                    desc="대시보드 표시 팀 및 비영업 조직 제외 관리"
                >
                    <div className="space-y-3">
                        {['FD팀', 'FC팀', 'FR팀', 'FS팀', 'FL팀'].map(team => (
                            <div key={team} className="flex items-center justify-between p-3 bg-slate-800/20 rounded-xl border border-white/5">
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                                    <span className="text-sm text-slate-300">{team}</span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className="text-xs text-slate-600">6명 활성</span>
                                    <div className="w-8 h-4 bg-indigo-500/20 rounded-full relative">
                                        <div className="absolute right-1 top-1 w-2 h-2 bg-indigo-400 rounded-full" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </SettingCard>

                {/* 3. 품목/거래처 통합 관리 */}
                <SettingCard
                    title="품목 및 거래처 통합"
                    icon={Package}
                    desc="복수 코드 품목의 대표 품목 지정 및 본부코드 통합"
                >
                    <div className="grid grid-cols-2 gap-4">
                        <button className="p-4 bg-slate-800/30 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all text-left">
                            <Package className="text-slate-500 mb-2" size={18} />
                            <span className="block text-sm font-bold text-white">품목 통합 설정</span>
                            <span className="text-[10px] text-slate-600 mt-1 block">모자렐라1,2 → 모자렐라 통합</span>
                        </button>
                        <button className="p-4 bg-slate-800/30 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-all text-left">
                            <Building2 className="text-slate-500 mb-2" size={18} />
                            <span className="block text-sm font-bold text-white">거래처 본부 통합</span>
                            <span className="text-[10px] text-slate-600 mt-1 block">거래처 A, B → A본부 통합</span>
                        </button>
                    </div>
                </SettingCard>

                {/* 4. 매출 항목/목표 업로드 */}
                <SettingCard
                    title="표준 데이터 업로드"
                    icon={Upload}
                    desc="기획안 표준 항목(년도월, 팀, 사원 등) 엑셀 관리"
                >
                    <div className="space-y-6">
                        <div className="p-4 bg-slate-800/20 rounded-2xl border border-white/5">
                            <label className="block text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">매출 기준일 설정</label>
                            <div className="flex items-center gap-3">
                                <CalendarIcon size={18} className="text-indigo-500" />
                                <input
                                    type="date"
                                    defaultValue="2026-02-24"
                                    className="bg-slate-900 border border-slate-700 rounded-xl px-4 py-2 text-white font-bold text-sm focus:outline-none focus:border-indigo-500 transition-all uppercase"
                                />
                                <span className="text-[10px] text-slate-500 italic"> * 선택한 날짜까지의 실적으로 집계됩니다.</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-6 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-slate-800/20 hover:border-indigo-500/30 transition-all cursor-pointer group">
                                <Filter size={24} className="text-slate-600 group-hover:text-indigo-400" />
                                <div className="text-center">
                                    <span className="block text-xs font-black text-slate-400 group-hover:text-white">매출 데이터 업로드</span>
                                    <span className="text-[10px] text-slate-600">Standard CSV or Excel</span>
                                </div>
                            </div>
                            <div className="p-6 border-2 border-dashed border-slate-800 rounded-2xl flex flex-col items-center justify-center gap-3 hover:bg-slate-800/20 hover:border-indigo-500/30 transition-all cursor-pointer group">
                                <Target size={24} className="text-slate-600 group-hover:text-emerald-400" />
                                <div className="text-center">
                                    <span className="block text-xs font-black text-slate-400 group-hover:text-white">목표 데이터 업로드</span>
                                    <span className="text-[10px] text-slate-600">Standard CSV or Excel</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </SettingCard>
            </div>

            <div className="flex justify-end pt-10">
                <button className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-black rounded-2xl shadow-2xl shadow-indigo-500/20 transform active:scale-95 transition-all">
                    <Save size={20} />
                    설정 값 저장 및 대시보드 갱신
                </button>
            </div>
        </div>
    );
}

function SettingCard({ title, icon: Icon, desc, children }) {
    return (
        <div className="bg-slate-900/40 border border-slate-800 rounded-[32px] p-8 hover:border-slate-700/50 transition-all">
            <div className="flex items-start gap-4 mb-6">
                <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400">
                    <Icon size={24} />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-white">{title}</h3>
                    <p className="text-xs text-slate-500 mt-1">{desc}</p>
                </div>
            </div>
            {children}
        </div>
    );
}
