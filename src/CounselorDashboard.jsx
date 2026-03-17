import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, AlertCircle, CheckCircle2, RefreshCw, 
  Search, Filter, ChevronRight, MessageSquare,
  Clock, Calendar, Activity, ShieldAlert
} from 'lucide-react';

export default function CounselorDashboard() {
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchFlaggedStudents();

    const subscription = supabase
      .channel('risk-alerts')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'assessments' 
      }, (payload) => {
        if (payload.new.risk_level === 'High Risk') {
          // You could use a toast notification here
          console.log(`🚨 URGENT: High Risk submission from ${payload.new.student_name}`);
        }
        fetchFlaggedStudents();
      })
      .subscribe();

    return () => supabase.removeChannel(subscription);
  }, []);

  async function fetchFlaggedStudents() {
    setLoading(true);
    let query = supabase
      .from('assessments')
      .select('*')
      .order('created_at', { ascending: false });

    // In a real app, we'd handle complex filtering on the server
    const { data, error } = await query;
    if (!error) setAssessments(data);
    setLoading(false);
  }

  async function updateFollowUp(id, note) {
    const { error } = await supabase
      .from('assessments')
      .update({ counselor_notes: note })
      .eq('id', id);

    if (error) alert("Failed to save note: " + error.message);
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase
      .from('assessments')
      .update({ status: newStatus })
      .eq('id', id);

    if (!error) {
       setAssessments(prev => prev.map(item => item.id === id ? { ...item, status: newStatus } : item));
    }
  }

  const filteredData = assessments.filter(item => {
    const matchesSearch = item.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filter === 'all' || 
                         (filter === 'priority' && (item.risk_level === 'High Risk' || item.risk_level === 'Moderate Risk')) ||
                         (filter === 'resolved' && item.status === 'resolved') ||
                         (filter === 'pending' && item.status !== 'resolved');
    return matchesSearch && matchesFilter;
  });

  const stats = {
    total: assessments.length,
    highRisk: assessments.filter(a => a.risk_level === 'High Risk').length,
    pending: assessments.filter(a => a.status !== 'resolved').length,
    resolved: assessments.filter(a => a.status === 'resolved').length
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Dashboard Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Expert Intervention Dashboard</h1>
          <p className="text-slate-500 font-medium">Real-time monitoring and early detection system for student wellbeing.</p>
        </div>
        <button 
          onClick={fetchFlaggedStudents}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl shadow-sm text-sm font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 transition-all active:scale-95"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh Data
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Assessments', value: stats.total, icon: <Users />, color: 'blue' },
          { label: 'High Risk Flagged', value: stats.highRisk, icon: <ShieldAlert />, color: 'red' },
          { label: 'Pending Action', value: stats.pending, icon: <Clock />, color: 'orange' },
          { label: 'Case Resolved', value: stats.resolved, icon: <CheckCircle2 />, color: 'green' },
        ].map((s, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="card p-6 flex items-center gap-5 border-none shadow-sm"
          >
            <div className={`p-4 rounded-2xl bg-${s.color}-50 text-${s.color}-600`}>
              {s.icon}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-none mb-1">{s.label}</p>
              <h4 className="text-3xl font-black text-slate-800">{s.value}</h4>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Main Table Interface */}
      <div className="card shadow-xl shadow-slate-200/50 border-white/50 bg-white/70 backdrop-blur-xl transition-all">
        {/* Table Controls */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-grow max-w-md">
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
            {[
              { id: 'all', label: 'All Cases' },
              { id: 'priority', label: 'Priority Only' },
              { id: 'pending', label: 'Active' },
              { id: 'resolved', label: 'History' }
            ].map(f => (
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

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Student Identity</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Inference Engine Result</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Severity Metric</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Intervention Notes</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              <AnimatePresence>
                {filteredData.map((item, idx) => (
                  <motion.tr 
                    key={item.id}
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-slate-50/50 transition-colors group"
                  >
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-100 uppercase">
                          {item.student_name.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 tracking-tight leading-none mb-1">{item.student_name}</p>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            <span>{item.student_age} Y/O</span>
                            <span>•</span>
                            <span>{item.student_sex}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(item.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    </td>

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

                    <td className="p-6">
                      <div className="flex items-center gap-3">
                        <div className="flex-grow bg-slate-100 rounded-full h-2.5 overflow-hidden shadow-inner w-24">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${(item.total_score / 9) * 100}%` }}
                            className={`h-full rounded-full transition-all ${
                              item.total_score >= 7 ? 'bg-red-500' : item.total_score >= 4 ? 'bg-orange-400' : 'bg-green-500'
                            }`}
                          />
                        </div>
                        <span className="text-xs font-black text-slate-700">{item.total_score}/9</span>
                      </div>
                    </td>

                    <td className="p-6">
                      <div className="relative">
                        <MessageSquare className="absolute left-3 top-3 text-slate-300 w-4 h-4" />
                        <textarea 
                          className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all resize-none min-h-[60px]"
                          placeholder="Log counseling session details..."
                          defaultValue={item.counselor_notes}
                          onBlur={(e) => updateFollowUp(item.id, e.target.value)}
                        />
                      </div>
                    </td>

                    <td className="p-6 text-center">
                      <select 
                        className={`text-xs font-black p-2 border-2 rounded-xl cursor-pointer transition-all ${
                          item.status === 'resolved' 
                            ? 'border-green-100 bg-green-50 text-green-600' 
                            : 'border-slate-100 bg-white text-slate-600 hover:border-blue-200'
                        }`}
                        value={item.status}
                        onChange={(e) => updateStatus(item.id, e.target.value)}
                      >
                        <option value="pending">PENDING</option>
                        <option value="in-progress">IN PROGRESS</option>
                        <option value="resolved">RESOLVED</option>
                      </select>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          
          {filteredData.length === 0 && (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                <Activity className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-slate-400 font-bold text-sm italic">
                No active records match the current filter criteria.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}