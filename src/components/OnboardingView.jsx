import { useState } from 'react';
import { supabase } from '../lib/supabase';
import { motion } from 'framer-motion';
import { Building2, UserPlus, ShieldCheck, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';

export function OnboardingView({ user, onComplete }) {
    const [mode, setMode] = useState('choice'); // 'choice' | 'create' | 'join'
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Create Company states
    const [companyName, setCompanyName] = useState('');
    const [bizNumber, setBizNumber] = useState('');
    const [ceoName, setCeoName] = useState('');

    // Join Company states
    const [joinCode, setJoinCode] = useState('');
    const [joinPassword, setJoinPassword] = useState('');

    const handleCreateCompany = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Create company
            const { data: company, error: companyErr } = await supabase
                .from('companies')
                .insert([{
                    name: companyName,
                    biz_number: bizNumber,
                    ceo_name: ceoName,
                    join_code: Math.random().toString(36).substring(2, 10).toUpperCase(),
                    join_password: Math.random().toString(36).substring(2, 6).toUpperCase()
                }])
                .select()
                .single();

            if (companyErr) throw companyErr;

            // 2. Link user to company as admin and approve immediately
            const { error: profileErr } = await supabase
                .from('profiles')
                .update({ company_id: company.id, role: 'admin', status: 'approved' })
                .eq('id', user.id);

            if (profileErr) throw profileErr;

            onComplete();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleJoinCompany = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // 1. Find company by join code and password
            const { data: company, error: companyErr } = await supabase
                .from('companies')
                .select('id')
                .eq('join_code', joinCode.trim().toUpperCase())
                .eq('join_password', joinPassword.trim().toUpperCase())
                .single();

            if (companyErr || !company) throw new Error('올바른 참여 코드 혹은 비밀번호가 아닙니다.');

            // 2. Request join (set company_id but keep status as pending)
            const { error: profileErr } = await supabase
                .from('profiles')
                .update({ company_id: company.id, status: 'pending', role: 'staff' })
                .eq('id', user.id);

            if (profileErr) throw profileErr;

            alert('참여 신청이 완료되었습니다! 관리자의 승인을 기다려주세요.');
            onComplete();
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (mode === 'choice') {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
                    <motion.button
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('create')}
                        className="bg-white p-12 rounded-[40px] border border-slate-200 shadow-xl text-center group transition-all hover:border-indigo-500"
                    >
                        <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Building2 size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4">새로운 회사 등록</h2>
                        <p className="text-slate-400 font-bold leading-relaxed">회사를 처음 등록하고 관리자로서 모든 설정을 제어할 수 있습니다.</p>
                        <div className="mt-8 flex items-center justify-center gap-2 text-indigo-600 font-black uppercase text-xs tracking-widest">
                            시작하기 <ArrowRight size={16} />
                        </div>
                    </motion.button>

                    <motion.button
                        whileHover={{ y: -5, scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setMode('join')}
                        className="bg-white p-12 rounded-[40px] border border-slate-200 shadow-xl text-center group transition-all hover:border-emerald-500"
                    >
                        <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                            <UserPlus size={40} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-4">기존 회사 참여</h2>
                        <p className="text-slate-400 font-bold leading-relaxed">회사가 이미 가입되어 있다면 참여 코드를 입력하고 소속될 수 있습니다.</p>
                        <div className="mt-8 flex items-center justify-center gap-2 text-emerald-600 font-black uppercase text-xs tracking-widest">
                            참여하기 <ArrowRight size={16} />
                        </div>
                    </motion.button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-lg bg-white rounded-[40px] shadow-2xl border border-slate-200 p-10 md:p-14"
            >
                <button onClick={() => setMode('choice')} className="text-xs font-black text-slate-400 hover:text-indigo-600 mb-8 uppercase tracking-widest flex items-center gap-2">
                    <ArrowRight size={14} className="rotate-180" /> 돌아가기
                </button>

                <div className="mb-10">
                    <h2 className="text-3xl font-black text-slate-800 tracking-tighter mb-2 italic">
                        {mode === 'create' ? 'Register Company' : 'Join Company'}
                    </h2>
                    <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                        {mode === 'create' ? '회사 정보를 입력해주세요' : '전달받은 참여 정보를 입력해주세요'}
                    </p>
                </div>

                <form onSubmit={mode === 'create' ? handleCreateCompany : handleJoinCompany} className="space-y-6">
                    {mode === 'create' ? (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Company Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="상호명을 입력하세요"
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Business Number</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="사업자번호 (10자리)"
                                    value={bizNumber}
                                    onChange={(e) => setBizNumber(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CEO Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="대표자명을 입력하세요"
                                    value={ceoName}
                                    onChange={(e) => setCeoName(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Join Code</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="참여 코드 (예: AB12CD34)"
                                    value={joinCode}
                                    onChange={(e) => setJoinCode(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Join Password</label>
                                <input
                                    type="password"
                                    required
                                    placeholder="참여 비밀번호"
                                    value={joinPassword}
                                    onChange={(e) => setJoinPassword(e.target.value)}
                                    className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black text-slate-700 outline-none focus:ring-4 ring-indigo-500/10 focus:border-indigo-500 transition-all placeholder:text-slate-300"
                                />
                            </div>
                        </>
                    )}

                    {error && (
                        <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3">
                            <AlertCircle size={16} className="text-rose-500" />
                            <p className="text-xs font-bold text-rose-600">{error}</p>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className={`w-full py-5 rounded-2xl font-black text-sm uppercase tracking-widest text-white shadow-xl transition-all disabled:opacity-50
                            ${mode === 'create' ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700' : 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700'}`}
                    >
                        {loading ? 'Processing...' : (mode === 'create' ? 'Create Company' : 'Join Company')}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}
