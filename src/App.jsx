import { useState, useEffect, lazy, Suspense } from 'react';
import { supabase } from './supabaseClient';
import Auth from './Auth';
import { LogOut, User as UserIcon, Heart } from 'lucide-react';
import { motion } from 'framer-motion';

const MentalHealthScreening = lazy(() => import('./MentalHealthScreening'));
const CounselorDashboard = lazy(() => import('./CounselorDashboard'));

export default function App() {
  const [session, setSession] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUserRole(session?.user?.user_metadata?.role || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <motion.div 
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="w-12 h-12 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200"
        />
      </div>
    );
  }

  // If not logged in and not specifically trying to login, show landing page
  if (!session && showAuth) {
    return (
      <div className="relative">
        <button 
          onClick={() => setShowAuth(false)}
          className="absolute top-8 left-8 z-50 text-slate-500 font-bold hover:text-blue-600 transition-colors flex items-center gap-2"
        >
          &larr; Back to Screening
        </button>
        <Auth />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center text-slate-900 font-sans">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <Heart className="w-6 h-6 fill-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-none">WellnessPort</span>
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Mental Health System</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 lg:gap-8">
            {session ? (
              <>
                <div className="hidden md:flex items-center gap-3 border-r border-slate-200 pr-6 mr-2">
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-800 leading-none">{session.user.email.split('@')[0]}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">{userRole || 'Student'}</p>
                  </div>
                  <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center border border-slate-200">
                    <UserIcon className="w-5 h-5 text-slate-500" />
                  </div>
                </div>
                
                <button 
                  onClick={() => supabase.auth.signOut()}
                  className="flex items-center gap-2 text-slate-600 hover:text-red-600 font-semibold text-sm transition-colors group"
                >
                  <span className="hidden sm:inline">Sign Out</span>
                  <LogOut className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </>
            ) : (
              <button 
                onClick={() => setShowAuth(true)}
                className="bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 px-6 py-2 rounded-xl text-sm font-bold transition-all border border-slate-200 shadow-sm shadow-slate-100"
              >
                Counselor Access
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Suspense fallback={
              <div className="flex items-center justify-center py-24">
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="w-12 h-12 bg-blue-600 rounded-2xl shadow-xl shadow-blue-200"
                />
              </div>
            }>
              {userRole === 'counselor' ? (
                <CounselorDashboard />
              ) : (
                <MentalHealthScreening studentId={session?.user?.id || null} />
              )}
            </Suspense>
          </motion.div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 bg-white border-t border-slate-200 text-center">
        <p className="text-sm text-slate-400 font-medium tracking-tight">
          &copy; 2026 WellnessPort Educational Support System. Strictly Confidential.
        </p>
      </footer>
    </div>
  );
}