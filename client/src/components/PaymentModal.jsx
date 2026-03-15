import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

export default function PaymentModal({ roomId, onSuccess, onClose }) {
  const [loading, setLoading] = useState(false);

  const handleDemoPayment = async () => {
    setLoading(true);
    try {
      await axios.post('/api/payment/demo-unlock', { roomId });
      toast.success('Sync unlocked! Send unlimited messages now 🎉');
      onSuccess();
      onClose();
    } catch {
      toast.error('Payment failed. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}>
      <div className="bg-slate-900 border border-violet-500/20 rounded-2xl p-6 w-full max-w-sm animate-fade-in shadow-2xl">
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-500/10 border border-violet-500/20 mb-3">
            <svg className="w-8 h-8 text-violet-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-white" style={{ fontFamily: 'Syne,sans-serif' }}>Unlock Private Sync</h2>
          <p className="text-slate-400 text-sm mt-1">You've used your 3 free messages</p>
        </div>

        <div className="bg-slate-800/60 rounded-xl p-4 mb-5 space-y-2">
          {['Unlimited messages', 'Chat history saved', 'One-time payment', 'Secure & private'].map(f => (
            <div key={f} className="flex items-center gap-2 text-sm">
              <svg className="w-4 h-4 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-slate-300">{f}</span>
            </div>
          ))}
        </div>

        <div className="text-center mb-5">
          <div className="text-3xl font-black text-white" style={{ fontFamily: 'Syne,sans-serif' }}>$0.99</div>
          <div className="text-slate-500 text-sm">one-time per conversation</div>
        </div>

        <div className="space-y-2">
          <button onClick={handleDemoPayment} disabled={loading}
            className="btn-primary w-full flex items-center justify-center gap-2 text-base">
            {loading
              ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Processing...</>
              : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>Pay &amp; Unlock Sync</>
            }
          </button>
          <button onClick={onClose} className="w-full text-sm text-slate-500 hover:text-slate-300 py-2 transition-colors">
            Maybe later
          </button>
        </div>
        <p className="text-xs text-slate-600 text-center mt-3">Secured by Stripe · Your payment info is never stored</p>
      </div>
    </div>
  );
}