
import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../firebaseConfig';
import { Target, AlertTriangle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginScreen: React.FC = () => {
  const [error, setError] = useState('');

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to sign in');
    }
  };

  if (!isFirebaseConfigured) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-6">
            <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl p-8 border border-red-200 dark:border-red-900">
                <div className="flex items-center gap-3 text-red-600 dark:text-red-400 mb-4">
                    <AlertTriangle size={32} />
                    <h2 className="text-xl font-bold">Configuration Needed</h2>
                </div>
                <p className="text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
                    To enable cloud sync, you need to connect this app to Firebase.
                </p>
                <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-500 dark:text-slate-400 mb-6 font-mono bg-slate-100 dark:bg-slate-950 p-4 rounded-lg">
                    <li>Open <strong>firebaseConfig.ts</strong></li>
                    <li>Replace the placeholder keys with your Firebase project details.</li>
                </ol>
                <p className="text-xs text-slate-400">
                    If you just want to test without sync, revert the changes to App.tsx.
                </p>
            </div>
        </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 relative overflow-hidden transition-colors duration-500">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/10 rounded-full blur-[100px]"></div>
      </div>

      <div className="max-w-md w-full z-10">
        <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-3xl shadow-lg shadow-indigo-500/30 mb-6 rotate-3">
                <Target size={40} className="text-white" />
            </div>
            <h1 className="text-4xl font-extrabold text-slate-900 dark:text-white mb-2 tracking-tight">
                NeuroFlow
            </h1>
            <p className="text-lg text-slate-500 dark:text-slate-400">
                The Life OS designed for your brain.
            </p>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-800 p-8">
            <h2 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                Sign in to Sync
            </h2>

            <div className="space-y-4 mb-8">
                <FeatureRow icon={CheckCircle2} text="Sync tasks across mobile & desktop" />
                <FeatureRow icon={CheckCircle2} text="Never lose your data" />
                <FeatureRow icon={CheckCircle2} text="AI Coaching access" />
            </div>

            <button
                onClick={handleLogin}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl font-bold text-lg flex items-center justify-center gap-3 hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
            >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="G" />
                Continue with Google
            </button>
            
            {error && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg text-center">
                    {error}
                </div>
            )}
        </div>

        <p className="text-center mt-8 text-xs text-slate-400">
            Secure authentication powered by Google Firebase.
        </p>
      </div>
    </div>
  );
};

const FeatureRow = ({ icon: Icon, text }: { icon: any, text: string }) => (
    <div className="flex items-center gap-3 text-slate-600 dark:text-slate-300">
        <Icon size={18} className="text-green-500" />
        <span className="text-sm font-medium">{text}</span>
    </div>
);
