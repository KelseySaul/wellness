import { useEffect, useState, useCallback } from 'react';
console.log('CounselorDashboard loaded - v4');


function AssessmentRow({ item, idx, onSave }) {
  const [draftNotes, setDraftNotes] = useState(item.counselor_notes || '');
  const [draftFollowUp, setDraftFollowUp] = useState(!!item.follow_up_required);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = draftNotes !== (item.counselor_notes || '') || draftFollowUp !== !!item.follow_up_required;

  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave(item.id, draftNotes, draftFollowUp);
    setIsSaving(false);
  };

  return (
    <motion.tr
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="group hover:bg-blue-50/30 transition-colors"
    >
      <td className="p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-100 uppercase text-xs">
            {item.student_name.substring(0, 2)}
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800 tracking-tight">{item.student_name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.student_age}Y/O • {item.student_sex}</p>
          </div>
        </div>
      </td>
      <td className="p-6 text-center">
        <span className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider inline-block ${
          item.risk_level === 'High Risk' ? 'bg-red-500 text-white' : item.risk_level === 'Moderate Risk' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {item.risk_level}
        </span>
      </td>
      <td className="p-6">
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-slate-700 tabular-nums whitespace-nowrap">{item.total_score}/21</span>
          <div className="w-16 bg-slate-100 h-1.5 rounded-full overflow-hidden hidden sm:block">
            <div 
              className={`h-full rounded-full ${item.total_score >= 15 ? 'bg-red-500' : item.total_score >= 8 ? 'bg-orange-400' : 'bg-green-500'}`}
              style={{ width: `${(item.total_score / 21) * 100}%` }}
            />
          </div>
        </div>
      </td>
      <td className="p-6">
        <div className="flex items-center gap-3">
          <div className="relative flex-grow">
             <textarea
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none min-h-[40px]"
                placeholder="Add notes..."
                value={draftNotes}
                onChange={(e) => setDraftNotes(e.target.value)}
              />
          </div>
          <div className="flex flex-col items-center gap-2">
             <label className="flex items-center gap-2 cursor-pointer whitespace-nowrap">
              <input 
                type="checkbox"
                className="w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                checked={draftFollowUp}
                onChange={(e) => setDraftFollowUp(e.target.checked)}
              />
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Follow up</span>
            </label>
            <AnimatePresence>
              {hasChanges && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="p-1.5 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100 hover:bg-blue-700 transition-colors"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin"/> : <Save className="w-3.5 h-3.5" />}
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>
      <td className="p-6 text-center">
        <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border transition-colors ${
          item.status === 'resolved' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-slate-50 text-slate-500 border-slate-100'
        }`}>
          {item.status || 'pending'}
        </span>
      </td>
    </motion.tr>
  );
}


import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, AlertCircle, CheckCircle2, RefreshCw,
  Search, Calendar, Activity, ShieldAlert, Bell, X, Save, MessageSquare, Clock
} from 'lucide-react';

// ─── SVG Donut Chart ────────────────────────────────────────────────────────
function DonutChart({ high, moderate, low, total }) {
  if (total === 0) return null;
  const SIZE = 120;
  const RADIUS = 44;
  const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
  const cx = SIZE / 2;
  const cy = SIZE / 2;

  const segments = [
    { value: high,     color: '#ef4444', label: 'High Risk' },
    { value: moderate, color: '#f97316', label: 'Moderate' },
    { value: low,      color: '#22c55e', label: 'Low Risk' },
  ];

  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * CIRCUMFERENCE;
    const arc = { ...seg, dasharray: `${dash} ${CIRCUMFERENCE}`, dashoffset: -offset * CIRCUMFERENCE };
    offset += pct;
    return arc;
  });

  return (
    <div className="flex items-center gap-6">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={cx} cy={cy} r={RADIUS} fill="none" stroke="#f1f5f9" strokeWidth="14" />
        {arcs.map((arc, i) => (
          <motion.circle
            key={i}
            cx={cx} cy={cy} r={RADIUS}
            fill="none"
            stroke={arc.color}
            strokeWidth="14"
            strokeDasharray={arc.dasharray}
            strokeDashoffset={arc.dashoffset}
            strokeLinecap="round"
            initial={{ strokeDasharray: `0 ${CIRCUMFERENCE}` }}
            animate={{ strokeDasharray: arc.dasharray }}
            transition={{ duration: 1, delay: i * 0.2, ease: 'easeOut' }}
            style={{ transformOrigin: 'center', transform: 'rotate(-90deg)' }}
          />
        ))}
        <text x={cx} y={cy - 6} textAnchor="middle" className="fill-slate-800" style={{ fontSize: 22, fontWeight: 800 }}>{total}</text>
        <text x={cx} y={cy + 12} textAnchor="middle" className="fill-slate-400" style={{ fontSize: 9, fontWeight: 700, letterSpacing: 1 }}>TOTAL</text>
      </svg>
      <div className="space-y-2">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-2 text-xs font-bold text-slate-600">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: seg.color }} />
            <span className="text-slate-500">{seg.label}</span>
            <span className="ml-auto text-slate-800 tabular-nums">{seg.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Toast Notification ──────────────────────────────────────────────────────
function Toast({ message, onClose }) {
  useEffect(() => {
    const t = setTimeout(onClose, 6000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      className="fixed top-6 right-6 z-50 flex items-start gap-3 bg-red-600 text-white px-5 py-4 rounded-2xl shadow-2xl shadow-red-300 max-w-sm"
    >
      <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0 mt-0.5">
        <Bell className="w-4 h-4" />
      </div>
      <div className="flex-grow text-left">
        <p className="font-bold text-sm mb-0.5">🚨 High-Risk Submission</p>
        <p className="text-xs text-red-100 font-medium">{message}</p>
      </div>
      <button onClick={onClose} className="text-red-200 hover:text-white transition-colors">
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

// ─── Assessment Card Component (Mobile) ──────────────────────────────────
function AssessmentCard({ item, onSave }) {
  const [draftNotes, setDraftNotes] = useState(item.counselor_notes || '');
  const [draftFollowUp, setDraftFollowUp] = useState(!!item.follow_up_required);
  const [isSaving, setIsSaving] = useState(false);

  const hasChanges = draftNotes !== (item.counselor_notes || '') || draftFollowUp !== !!item.follow_up_required;

  const handleSaveClick = async () => {
    setIsSaving(true);
    await onSave(item.id, draftNotes, draftFollowUp);
    setIsSaving(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4"
    >
      <div className="flex justify-between items-start gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-100 uppercase text-xs">
            {item.student_name.substring(0, 2)}
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800 tracking-tight">{item.student_name}</p>
            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.student_age}Y/O • {item.student_sex}</p>
          </div>
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
          item.risk_level === 'High Risk' ? 'bg-red-500 text-white' : item.risk_level === 'Moderate Risk' ? 'bg-orange-500 text-white' : 'bg-green-500 text-white'
        }`}>
          {item.risk_level}
        </span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
          <span>Screening Score</span>
          <span className="text-slate-700">{item.total_score}/21</span>
        </div>
        <div className="bg-slate-100 h-1.5 rounded-full overflow-hidden">
          <div 
            className={`h-full rounded-full ${item.total_score >= 15 ? 'bg-red-500' : item.total_score >= 8 ? 'bg-orange-400' : 'bg-green-500'}`}
            style={{ width: `${(item.total_score / 21) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-3 pt-2">
        <div className="relative">
          <MessageSquare className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
          <textarea
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none min-h-[80px]"
            placeholder="Intervention notes..."
            value={draftNotes}
            onChange={(e) => setDraftNotes(e.target.value)}
          />
        </div>
        
        <div className="flex flex-col gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input 
              type="checkbox"
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              checked={draftFollowUp}
              onChange={(e) => setDraftFollowUp(e.target.checked)}
            />
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Needs Another Session</span>
          </label>

          <AnimatePresence>
            {hasChanges && (
              <motion.button
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                onClick={handleSaveClick}
                disabled={isSaving}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-100"
              >
                {isSaving ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />}
                Save Changes & Update History
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}


// ─── Main Dashboard ──────────────────────────────────────────────────────────
export default function CounselorDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  const fetchAssessments = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error) setAssessments(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssessments();

    const subscription = supabase
      .channel('risk-alerts')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assessments' }, (payload) => {
        if (payload.new.risk_level === 'High Risk') {
          setToast(`${payload.new.student_name} needs attention. Risk score: ${payload.new.total_score}`);
        }
        fetchAssessments();
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, [fetchAssessments]);

  const handleAssessmentSave = async (id, note, followUp) => {
    const newStatus = followUp ? 'in-progress' : 'resolved';
    const { error } = await supabase
      .from('assessments')
      .update({ counselor_notes: note, follow_up_required: followUp, status: newStatus })
      .eq('id', id);

    if (!error) {
      setAssessments(prev => prev.map(item =>
        item.id === id ? { ...item, counselor_notes: note, follow_up_required: followUp, status: newStatus } : item
      ));
    }
  };

  const filteredData = assessments.filter(item => {
    const matchesSearch = item.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter =
      filter === 'all' ||
      (filter === 'priority' && (item.risk_level === 'High Risk' || item.risk_level === 'Moderate Risk')) ||
      (filter === 'resolved' && item.status === 'resolved') ||
      (filter === 'pending' && item.status !== 'resolved');
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total:    assessments.length,
    highRisk: assessments.filter(a => a.risk_level === 'High Risk').length,
    pending:  assessments.filter(a => a.status !== 'resolved').length,
    resolved: assessments.filter(a => a.status === 'resolved').length,
    low:      assessments.filter(a => a.risk_level !== 'High Risk' && a.risk_level !== 'Moderate Risk').length,
    moderate: assessments.filter(a => a.risk_level === 'Moderate Risk').length,
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-left px-1">
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-2">Intervention Dashboard</h1>
          <p className="text-sm sm:text-base text-slate-500 font-medium leading-tight">Monitoring and early detection system for student wellbeing.</p>
        </div>
        <button
          onClick={fetchAssessments}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-600 hover:text-blue-600 transition-all active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 grid grid-cols-1 xs:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4 text-left">
          {[
            { label: 'Total Cases', value: stats.total,    icon: <Users />,        color: 'blue' },
            { label: 'High Risk',   value: stats.highRisk, icon: <ShieldAlert />, color: 'red' },
            { label: 'Active',      value: stats.pending,  icon: <Clock />,       color: 'orange' },
            { label: 'Resolved',    value: stats.resolved, icon: <CheckCircle2 />,color: 'green' },
          ].map((s, idx) => (
            <motion.div key={idx} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card p-5 flex flex-col gap-3 border-none shadow-sm">
              <div className={`p-2.5 rounded-xl bg-${s.color}-50 text-${s.color}-600 w-fit`}>{s.icon}</div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p>
                <h4 className="text-3xl font-black text-slate-800 tabular-nums">{s.value}</h4>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2 card p-6 border-none shadow-sm flex flex-col items-center sm:items-start justify-between gap-6">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest w-full text-left">Risk Distribution</p>
          <div className="w-full flex justify-center lg:justify-start">
            <DonutChart high={stats.highRisk} moderate={stats.moderate} low={stats.low} total={stats.total} />
          </div>
        </div>
      </div>

      <div className="card shadow-xl shadow-slate-200/50 border-white/50 bg-white/70 backdrop-blur-xl shrink-0 overflow-hidden">
        <div className="p-4 sm:p-6 border-b border-slate-100 flex flex-col items-center justify-between gap-4">
          <div className="relative w-full text-left">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search students..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex w-full bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner overflow-x-auto gap-1">
            {[ { id: 'all', label: 'All' }, { id: 'priority', label: 'Priority' }, { id: 'pending', label: 'Active' }, { id: 'resolved', label: 'History' } ].map(f => (
              <button
                key={f.id} onClick={() => setFilter(f.id)}
                className={`flex-1 min-w-[70px] px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${
                  filter === f.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Risk Level</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Score</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intervention Log</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredData.map((item, idx) => (
                  <AssessmentRow key={item.id} item={item} idx={idx} onSave={handleAssessmentSave} />
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden p-4 space-y-4 bg-slate-50/50">
          <AnimatePresence>
            {filteredData.map((item) => (
              <AssessmentCard key={item.id} item={item} onSave={handleAssessmentSave} />
            ))}
          </AnimatePresence>
        </div>

        {filteredData.length === 0 && (
          <div className="p-20 text-center">
            <Activity className="w-12 h-12 text-slate-200 mx-auto mb-4" />
            <p className="text-slate-700 font-bold mb-1 uppercase tracking-widest text-xs">No records found</p>
            <p className="text-slate-400 text-[10px] font-bold">Try adjusting filters or search term</p>
          </div>
        )}
      </div>
    </div>
  );
}