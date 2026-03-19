import { useEffect, useState, useCallback } from 'react';
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

// ─── Assessment Row Component ──────────────────────────────────────────────
function AssessmentRow({ item, onSave, idx }) {
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
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="hover:bg-slate-50/50 transition-colors"
    >
      {/* Student */}
      <td className="p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-bold border border-slate-100 uppercase text-sm">
            {item.student_name.substring(0, 2)}
          </div>
          <div className="text-left">
            <p className="font-bold text-slate-800 tracking-tight leading-none mb-1">{item.student_name}</p>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
              <span>{item.student_age} Y/O</span>
              <span>•</span>
              <span>{item.student_sex}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </td>

      {/* Risk Badge */}
      <td className="p-6 text-center">
        <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
          item.risk_level === 'High Risk'
            ? 'bg-red-500 text-white shadow-lg shadow-red-200'
            : item.risk_level === 'Moderate Risk'
              ? 'bg-orange-500 text-white shadow-lg shadow-orange-200'
              : 'bg-green-500 text-white shadow-lg shadow-green-200'
        }`}>
          {item.risk_level === 'High Risk' && <AlertCircle className="w-3 h-3 fill-white text-red-500" />}
          {item.risk_level}
        </span>
      </td>

      {/* Score */}
      <td className="p-6">
        <div className="flex items-center gap-3">
          <div className="flex-grow bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner w-24">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(item.total_score / 21) * 100}%` }}
              className={`h-full rounded-full transition-all ${
                item.total_score >= 15 ? 'bg-red-500' : item.total_score >= 8 ? 'bg-orange-400' : 'bg-green-500'
              }`}
            />
          </div>
          <span className="text-xs font-black text-slate-700">{item.total_score}/21</span>
        </div>
      </td>

      {/* Intervention Notes & Save Button */}
      <td className="p-6">
        <div className="flex flex-col gap-3">
          <div className="relative">
            <MessageSquare className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
            <textarea
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none min-h-[60px]"
              placeholder="Log counseling session details..."
              value={draftNotes}
              onChange={(e) => setDraftNotes(e.target.value)}
            />
          </div>
          
          <div className="flex items-center justify-between gap-4">
            <label className="flex items-center gap-2 cursor-pointer group">
              <input 
                type="checkbox"
                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                checked={draftFollowUp}
                onChange={(e) => setDraftFollowUp(e.target.checked)}
              />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">
                Needs Another Session
              </span>
            </label>

            <AnimatePresence>
              {hasChanges && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  onClick={handleSaveClick}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition shadow-lg shadow-blue-100 disabled:opacity-50"
                >
                  {isSaving ? <RefreshCw className="w-3 h-3 animate-spin"/> : <Save className="w-3 h-3" />}
                  Save Session Log
                </motion.button>
              )}
            </AnimatePresence>
          </div>
        </div>
      </td>

      {/* Calculated Status */}
      <td className="p-6 text-center">
        <div className={`text-[10px] font-black p-2 border-2 rounded-xl uppercase tracking-widest ${
          item.status === 'resolved'
            ? 'border-green-100 bg-green-50 text-green-600'
            : item.status === 'in-progress'
              ? 'border-blue-100 bg-blue-50 text-blue-600'
              : 'border-slate-100 bg-white text-slate-400'
        }`}>
          {item.status}
        </div>
      </td>
    </motion.tr>
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
    if (!error) setAssessments(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAssessments();

    const subscription = supabase
      .channel('risk-alerts')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'assessments'
      }, (payload) => {
        if (payload.new.risk_level === 'High Risk') {
          setToast(`${payload.new.student_name} needs immediate attention. Risk score: ${payload.new.total_score}`);
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
      .update({
        counselor_notes: note,
        follow_up_required: followUp,
        status: newStatus
      })
      .eq('id', id);

    if (!error) {
      setAssessments(prev => prev.map(item =>
        item.id === id
          ? { ...item, counselor_notes: note, follow_up_required: followUp, status: newStatus }
          : item
      ));
    } else {
      console.error(error);
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
    moderate: assessments.filter(a => a.risk_level === 'Moderate Risk').length,
    pending:  assessments.filter(a => a.status !== 'resolved').length,
    resolved: assessments.filter(a => a.status === 'resolved').length,
    low:      assessments.filter(a => a.risk_level !== 'High Risk' && a.risk_level !== 'Moderate Risk').length,
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AnimatePresence>
        {toast && <Toast message={toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="text-left">
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Intervention Dashboard</h1>
          <p className="text-slate-500 font-medium">Real-time monitoring and early detection system for student wellbeing.</p>
        </div>
        <button
          onClick={fetchAssessments}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 text-left">
        <div className="lg:col-span-3 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total', value: stats.total,    icon: <Users />,        color: 'blue' },
            { label: 'High Risk', value: stats.highRisk, icon: <ShieldAlert />, color: 'red' },
            { label: 'Pending',  value: stats.pending,  icon: <Clock />,       color: 'orange' },
            { label: 'Resolved', value: stats.resolved, icon: <CheckCircle2 />,color: 'green' },
          ].map((s, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.08 }}
              className="card p-5 flex flex-col gap-3 border-none shadow-sm"
            >
              <div className={`p-2.5 rounded-xl bg-${s.color}-50 text-${s.color}-600 w-fit`}>
                {s.icon}
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
                <h4 className="text-3xl font-black text-slate-800 tabular-nums">{s.value}</h4>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="lg:col-span-2 card p-6 border-none shadow-sm flex flex-col justify-between">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Risk Distribution</p>
          <DonutChart high={stats.highRisk} moderate={stats.moderate} low={stats.low} total={stats.total} />
        </div>
      </div>

      <div className="card shadow-xl shadow-slate-200/50 border-white/50 bg-white/70 backdrop-blur-xl">
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md text-left">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by student name..."
              className="input-field pl-12 shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
            {[ { id: 'all', label: 'All' }, { id: 'priority', label: 'Priority' }, { id: 'pending', label: 'Active' }, { id: 'resolved', label: 'History' } ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                  filter === f.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
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
                  <AssessmentRow 
                    key={item.id} 
                    item={item} 
                    idx={idx} 
                    onSave={handleAssessmentSave} 
                  />
                ))}
              </AnimatePresence>
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <div className="p-20 text-center">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 bg-blue-50 rounded-full animate-ping opacity-20" />
                <div className="relative w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                  <Activity className="w-9 h-9 text-slate-300" />
                </div>
              </div>
              <p className="text-slate-700 font-bold text-base mb-1">No records found</p>
              <p className="text-slate-400 text-sm font-medium">
                {searchTerm ? `No students match "${searchTerm}"` : 'No records match the selected filter.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}