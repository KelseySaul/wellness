import { useState } from 'react';
import { supabase } from './supabaseClient';
import { motion, AnimatePresence } from 'framer-motion';
import { LogIn, UserPlus, Mail, Lock, User, CheckCircle2 } from 'lucide-react';

export default function Auth() {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('counselor');
  const [isSignUp, setIsSignUp] = useState(false);

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password: trimmedPassword,
        options: {
          data: { role: role }
        }
      });
      
      if (error) alert(error.message);
      else alert(isSignUp ? 'Account created successfully!' : 'Signed in successfully!');
    } else {
      const { error } = await supabase.auth.signInWithPassword({ 
        email: trimmedEmail, 
        password: trimmedPassword 
      });
      if (error) alert(error.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-slate-50 p-4 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card w-full max-w-md bg-white border-slate-100 shadow-2xl shadow-slate-200/50"
      >
        <div className="p-8">
          <div className="flex justify-center mb-8">
            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <span className="text-2xl font-bold font-display">W</span>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold mb-2 text-center text-slate-900 tracking-tight">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          <p className="text-slate-500 text-center mb-8">
            {isSignUp ? 'Create a counselor account' : 'Access the expert intervention dashboard'}
          </p>
          
          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="email" placeholder="name@school.edu" required
                  className="input-field pl-12"
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="password" placeholder="••••••••" required
                  className="input-field pl-12"
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>

            {isSignUp && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100/50 mt-2">
                  <p className="text-xs font-bold text-blue-700 uppercase tracking-widest text-center">
                    Authorized Staff Account
                  </p>
                </div>
              </motion.div>
            )}

            <button 
              disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-4"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isSignUp ? (
                <><UserPlus className="w-5 h-5" /> Register Account</>
              ) : (
                <><LogIn className="w-5 h-5" /> Sign In</>
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-4">
            <button 
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-sm font-semibold text-blue-600 hover:text-blue-700 transition"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}