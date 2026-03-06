import { useMemo } from 'react';
import { CreditCard, AlertCircle, CheckCircle2, Search, TrendingUp, TrendingDown, Clock, CalendarDays, ArrowRight, User, Building2, LayoutDashboard, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function BondDashboard({ masterData, fCurrency }) {
    const bonds = useMemo(() => masterData?.bonds || [], [masterData]);

    const stats = useMemo(() => {
        const total = bonds.reduce((acc, b) => acc + b['금액'], 0);
        const overdue = bonds.filter(b => b['연체여부'] === 'Y').reduce((acc, b) => acc + b['금액'], 0);
        const unpaid = bonds.filter(b => b['결제완료'] === 'N').reduce((acc, b) => acc + b['금액'], 0);
        const overdueCount = bonds.filter(b => b['연체여부'] === 'Y').length;

        return { total, overdue, unpaid, overdueCount };
    }, [bonds]);

    // Group by customer for summary
    const customerSummary = useMemo(() => {
        const summary = {};
        bonds.forEach(b => {
            const name = b['거래처명'];
            if (!summary[name]) {
                summary[name] = { name, total: 0, overdue: 0, unpaid: 0, count: 0 };
            }
            summary[name].total += b['금액'];
            if (b['연체여부'] === 'Y') summary[name].overdue += b['금액'];
            if (b['결제완료'] === 'N') summary[name].unpaid += b['금액'];
            summary[name].count++;
        });
        return Object.values(summary).sort((a, b) => b.unpaid - a.unpaid);
    }, [bonds]);

    return (
        <div className="max-w-[1600px] mx-auto space-y-6">
            <div className="flex flex-col xl:flex-row justify-between items-start gap-6">
                <div className="flex-1">
                    <h2 className="text-4xl font-black text-slate-800 tracking-tighter mb-2 italic uppercase flex items-center gap-3">
                        <CreditCard size={32} className="text-indigo-600" />
                        Credit Status Dashboard
                    </h2>
                    <p className="text-slate-400 font-bold text-lg uppercase tracking-widest">실시간 채권 및 결제 현황 분석</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full xl:w-auto shrink-0">
                    <StatCard title="총 채권 (Outstanding)" value={fCurrency(stats.total)} icon={CreditCard} color="indigo" />
                    <StatCard title="미결제 합계 (Unpaid)" value={fCurrency(stats.unpaid)} icon={Clock} color="amber" />
                    <StatCard title="연체 금액 (Overdue)" value={fCurrency(stats.overdue)} icon={AlertCircle} color="rose" />
                    <StatCard title="연체 건수 (Items)" value={`${stats.overdueCount}건`} icon={TrendingUp} color="rose" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                {/* 1. Customer Summary List */}
                <div className="bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-[700px]">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            거래처별 요약
                        </h3>
                        <div className="px-3 py-1 bg-white rounded-full text-[10px] font-black border border-slate-200 text-slate-400">Top Unpaid First</div>
                    </div>
                    <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-2">
                        {customerSummary.map((c, i) => (
                            <div key={i} className="group p-4 bg-white hover:bg-indigo-50/50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-slate-50 text-slate-400 flex items-center justify-center shrink-0 group-hover:bg-indigo-100 group-hover:text-indigo-600 font-black">
                                    {c.name.slice(0, 1)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-black text-slate-700 truncate">{c.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400">Invoices: {c.count}건</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-slate-900">{fCurrency(c.unpaid)}</p>
                                    <p className="text-[10px] font-bold text-slate-400 italic">Total: {fCurrency(c.total)}</p>
                                </div>
                                {c.overdue > 0 && (
                                    <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)] ml-2" />
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* 2. Detailed Invoice Table */}
                <div className="lg:col-span-2 bg-white border border-slate-200 rounded-[32px] overflow-hidden shadow-sm flex flex-col h-[700px]">
                    <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-600 uppercase tracking-widest flex items-center gap-2">
                            채권 상세 내역
                        </h3>
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-rose-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-rose-500" /> 연체
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-amber-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" /> 미결제
                            </span>
                            <span className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> 결제완료
                            </span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto no-scrollbar">
                        <table className="w-full text-left table-fixed min-w-[800px]">
                            <thead className="sticky top-0 z-10 bg-slate-50 border-b-2 border-slate-100">
                                <tr className="text-slate-400 font-black text-[11px] uppercase tracking-widest">
                                    <th className="py-4 px-6 w-[20%]">거래처명</th>
                                    <th className="py-4 px-2 w-[15%]">청구서ID</th>
                                    <th className="py-4 px-2 text-center w-[15%]">청구일 / 만기일</th>
                                    <th className="py-4 px-2 text-right w-[15%]">금액</th>
                                    <th className="py-4 px-2 text-center w-[15%]">상태</th>
                                    <th className="py-4 pr-6 text-center w-[10%]">연체일수</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm font-bold">
                                {bonds.map((b, i) => (
                                    <tr key={i} className="hover:bg-slate-50 transition-colors border-b border-slate-50 group">
                                        <td className="py-4 px-6 text-slate-800 font-black">{b['거래처명']}</td>
                                        <td className="py-4 px-2 text-[11px] text-slate-400 uppercase tracking-tighter">{b['청구서ID']}</td>
                                        <td className="py-4 px-2 text-center">
                                            <div className="flex flex-col items-center">
                                                <span className="text-slate-500 text-[10px]">{b['청구일자']}</span>
                                                <span className="text-slate-900 text-[12px]">{b['만기일']}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2 text-right font-black text-slate-900">{fCurrency(b['금액'])}</td>
                                        <td className="py-4 px-2 text-center">
                                            <div className="flex justify-center">
                                                {b['결제완료'] === 'Y' ? (
                                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black border border-emerald-100 uppercase tracking-tighter">Paid Full</span>
                                                ) : b['연체여부'] === 'Y' ? (
                                                    <span className="px-3 py-1 bg-rose-50 text-rose-600 rounded-full text-[10px] font-black border border-rose-100 uppercase tracking-tighter">Overdue</span>
                                                ) : (
                                                    <span className="px-3 py-1 bg-amber-50 text-amber-600 rounded-full text-[10px] font-black border border-amber-100 uppercase tracking-tighter">Pending</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-4 pr-6 text-center">
                                            {b['연체일수'] > 0 ? (
                                                <span className="text-rose-600 font-black text-lg">{b['연체일수']}<span className="text-[10px] ml-0.5">일</span></span>
                                            ) : '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }) {
    const colorMap = {
        indigo: 'bg-indigo-50 text-indigo-600 border-indigo-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
    };

    return (
        <div className="bg-white border border-slate-200 rounded-3xl p-5 shadow-sm hover:shadow-md transition-all flex items-center gap-5 group">
            <div className={`p-4 rounded-2xl ${colorMap[color] || colorMap.indigo} border transition-all group-hover:scale-110`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className="text-xl font-black text-slate-800 tracking-tighter">{value}</h3>
                </div>
            </div>
        </div>
    );
}
