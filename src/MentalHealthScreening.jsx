import { useState } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send, CheckCircle2, AlertTriangle, ShieldCheck,
  Sparkles, Smile, CloudMoon, Brain, Zap, Apple, Wind, AlertCircle, X
} from 'lucide-react';

const WELLNESS_TIPS = [
  "Try to spend at least 15 minutes outdoors today. Vitamin D and fresh air can significantly boost your mood.",
  "Write down three things you're grateful for today. Gratitude journaling reduces anxiety and improves sleep.",
  "Drink a full glass of water and take three slow deep breaths. Hydration and breathing calm the nervous system.",
  "Reach out to one friend or family member today, even just a short text. Human connection is a powerful mood booster.",
  "Take a 10-minute walk — even indoors. Movement releases endorphins that naturally lift your spirit.",
  "Try a 5-minute body scan: starting at your feet, slowly notice each part of your body without judgment.",
  "Put your phone down 30 minutes before bed tonight. Better sleep quality starts with less screen time.",
  "Listen to your favourite song right now. Music has immediate, proven effects on emotional state.",
];

const QUESTIONS = [
  { id: 'q1_sadness',      label: 'Feeling down, depressed, or hopeless?',            icon: <Smile className="w-5 h-5" /> },
  { id: 'q2_sleep',        label: 'Trouble falling or staying asleep, or sleeping too much?', icon: <CloudMoon className="w-5 h-5" /> },
  { id: 'q3_concentration',label: 'Trouble concentrating on things, such as school work?',    icon: <Brain className="w-5 h-5" /> },
  { id: 'q4_interest',     label: 'Little interest or pleasure in doing things you enjoy?',   icon: <Sparkles className="w-5 h-5" /> },
  { id: 'q5_fatigue',      label: 'Feeling tired or having little energy?',                   icon: <Zap className="w-5 h-5" /> },
  { id: 'q6_appetite',     label: 'Poor appetite or overeating?',                             icon: <Apple className="w-5 h-5" /> },
  { id: 'q7_anxiety',      label: 'Feeling nervous, anxious, or on edge?',                    icon: <Wind className="w-5 h-5" /> },
];

const OPTION_LABELS = [
  { label: 'Not at all', emoji: '😌', value: 0 },
  { label: 'Several days', emoji: '😕', value: 1 },
  { label: 'More than half', emoji: '😟', value: 2 },
  { label: 'Nearly every day', emoji: '😔', value: 3 },
];

const INITIAL_FORM = {
  student_name: '', student_age: '', student_sex: '',
  q1_sadness: 0, q2_sleep: 0, q3_concentration: 0,
  q4_interest: 0, q5_fatigue: 0, q6_appetite: 0, q7_anxiety: 0,
};

export default function MentalHealthScreening({ studentId }) {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [riskAlert, setRiskAlert] = useState(false);
  const [error, setError] = useState(null);
  const [wellnessTip] = useState(() => WELLNESS_TIPS[Math.floor(Math.random() * WELLNESS_TIPS.length)]);
  const [form, setForm] = useState(INITIAL_FORM);

  const setQ = (id, value) => setForm(prev => ({ ...prev, [id]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // JS-level validation
    const age = parseInt(form.student_age);
    if (isNaN(age) || age < 12 || age > 19) {
      setError('Please enter a valid age between 12 and 19.');
      return;
    }

    setLoading(true);

    const totalScore = QUESTIONS.reduce((sum, q) => sum + (form[q.id] || 0), 0);

    const submission = { ...form };
    if (studentId) submission.student_id = studentId;

    const { error: supaError } = await supabase
      .from('assessments')
      .insert([submission]);

    if (supaError) {
      setError(supaError.message);
    } else {
      setSubmitted(true);
      // High risk: >= 15/21; Moderate: >= 8/21
      if (totalScore >= 15) setRiskAlert(true);
    }
    setLoading(false);
  };

  if (submitted) return (
    <div className="max-w-xl mx-auto px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="card p-10 text-center border-none shadow-2xl shadow-green-100"
      >
        <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-inner">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <h2 className="text-4xl font-bold text-slate-900 mb-4 tracking-tight">Check-in Complete</h2>
        <p className="text-slate-500 mb-10 text-lg leading-relaxed">
          Thank you for sharing, <span className="text-blue-600 font-bold">{form.student_name}</span>. Your openness helps us provide the best support.
        </p>

        <AnimatePresence>
          {riskAlert && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-100 p-8 rounded-2xl text-left"
            >
              <div className="flex items-center gap-3 mb-4 text-red-600">
                <AlertTriangle className="w-6 h-6 fill-red-600 text-white" />
                <h3 className="text-xl font-bold tracking-tight">Priority Care Resources</h3>
              </div>
              <p className="text-red-700/80 mb-6 font-medium leading-relaxed">
                Your responses suggest you might be having a difficult time. Please reach out to one of these verified resources immediately:
              </p>
              <div className="space-y-3">
                <a href="tel:988" className="block bg-white p-4 rounded-xl shadow-sm border border-red-100 flex justify-between items-center group hover:border-red-300 transition-colors">
                  <div>
                    <span className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-0.5">National Crisis Line</span>
                    <span className="text-lg font-bold text-slate-900">Emergency Call 988</span>
                  </div>
                  <div className="w-10 h-10 bg-red-100 text-red-600 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Send className="w-5 h-5" />
                  </div>
                </a>
                <div className="p-4 bg-red-500/5 rounded-xl border border-red-500/10 text-xs text-red-600 italic font-semibold leading-relaxed">
                  * A support counselor has been alerted to your submission and will reach out for a confidential check-in session.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {!riskAlert && (
          <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100/50">
            <div className="flex items-center justify-center gap-3 text-blue-600 mb-3">
              <Sparkles className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-widest">Wellness Tip</span>
            </div>
            <p className="text-blue-700/80 text-sm font-medium leading-relaxed">{wellnessTip}</p>
          </div>
        )}
      </motion.div>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card shadow-2xl shadow-slate-200/50 border-white/50 bg-white/70 backdrop-blur-xl shrink-0 overflow-hidden">

        {/* Hero Banner */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-10 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldCheck className="w-32 h-32 sm:w-48 sm:h-48" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6">
            <div className="text-left">
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-2">Wellness Check-in</h1>
              <p className="text-blue-100 text-sm sm:text-lg opacity-90 max-w-md font-medium">
                Take a moment to reflect on your week. Your feedback remains secure and confidential.
              </p>
            </div>
            <div className="bg-white/20 backdrop-blur-md rounded-2xl p-3 sm:p-4 flex items-center gap-3 w-fit">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white rounded-lg flex items-center justify-center text-blue-600 shrink-0">
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
              <div className="text-left font-sans">
                <div className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest opacity-80">Encryption</div>
                <div className="text-[10px] sm:text-xs font-bold leading-none">Confidential Protocol</div>
              </div>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 sm:p-10 space-y-8 sm:space-y-12">

          {/* Inline error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-3 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3"
            >
              <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
              <p className="text-xs sm:text-sm font-medium flex-grow text-left">{error}</p>
              <button type="button" onClick={() => setError(null)} className="text-red-400 hover:text-red-600 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Profile Information */}
          <section>
            <div className="flex items-center gap-2 mb-4 sm:mb-6">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Profile Information</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-4 sm:gap-6 text-left">
              <div className="md:col-span-3 space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 ml-1 uppercase">Full Name</label>
                <input
                  required type="text" placeholder="Alex Johnson"
                  className="input-field py-2.5 sm:py-3 text-sm sm:text-base"
                  value={form.student_name}
                  onChange={(e) => setQ('student_name', e.target.value)}
                />
              </div>
              <div className="md:col-span-1 space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 ml-1 uppercase">Age</label>
                <input
                  required type="number" placeholder="16" min="12" max="19"
                  className="input-field py-2.5 sm:py-3 text-sm sm:text-base text-center"
                  value={form.student_age}
                  onChange={(e) => setQ('student_age', e.target.value)}
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] sm:text-xs font-bold text-slate-500 ml-1 uppercase text-left block">Sex</label>
                <select
                  required className="input-field py-2.5 sm:py-3 text-sm sm:text-base appearance-none bg-white"
                  value={form.student_sex}
                  onChange={(e) => setQ('student_sex', e.target.value)}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          </section>

          {/* Screening Questions */}
          <section>
            <div className="flex items-center gap-2 mb-6 sm:mb-8">
              <div className="w-1 h-6 bg-blue-600 rounded-full"></div>
              <h3 className="text-[10px] sm:text-sm font-bold text-slate-400 uppercase tracking-[0.2em]">Daily Experience</h3>
            </div>
            <div className="space-y-10 sm:space-y-16">
              {QUESTIONS.map((q) => (
                <div key={q.id} className="space-y-4 sm:space-y-6">
                  <p className="text-sm sm:text-lg font-bold text-slate-800 leading-snug text-left">
                    <span className="text-blue-600 mr-2 opacity-50 font-black italic">0{q.id.split('_')[0].slice(1)}</span>
                    {q.label}

                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                    {OPTION_LABELS.map((opt) => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setQ(q.id, opt.value)}
                        className={`group relative p-3 sm:p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                          form[q.id] === opt.value
                            ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-200 scale-[1.02]'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-blue-50/50'
                        }`}
                      >
                        <span className="text-xl sm:text-2xl">{opt.emoji}</span>
                        <span className={`text-[9px] sm:text-[10px] font-black uppercase tracking-widest ${form[q.id] === opt.value ? 'text-blue-100' : 'text-slate-400 group-hover:text-blue-600'}`}>
                          {opt.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <button
            type="submit" disabled={loading}
            className="w-full py-4 sm:py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-sm sm:text-lg font-black uppercase tracking-widest flex items-center justify-center gap-3 shadow-xl shadow-blue-100 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5 sm:w-6 sm:h-6" />
                <span>Submit Check-in</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}