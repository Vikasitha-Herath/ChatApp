import React from 'react';

const COLORS = [
  'bg-cyan-600','bg-violet-600','bg-emerald-600','bg-pink-600',
  'bg-amber-600','bg-blue-600','bg-rose-600','bg-teal-600'
];

function getColor(str) {
  if (!str) return COLORS[0];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return COLORS[Math.abs(hash) % COLORS.length];
}

export default function Avatar({ user, size = 'md', showStatus = false }) {
  const sizes = { xs:'w-6 h-6 text-xs', sm:'w-8 h-8 text-sm', md:'w-10 h-10 text-sm', lg:'w-12 h-12 text-base', xl:'w-16 h-16 text-xl' };
  const statusSizes = { xs:'w-1.5 h-1.5 -bottom-0 -right-0', sm:'w-2 h-2 bottom-0 right-0', md:'w-2.5 h-2.5 bottom-0 right-0', lg:'w-3 h-3 bottom-0 right-0', xl:'w-3.5 h-3.5 bottom-0.5 right-0.5' };
  const initial = user?.username?.charAt(0).toUpperCase() || '?';
  const color   = getColor(user?.username);

  return (
    <div className="relative inline-flex flex-shrink-0">
      {user?.avatar
        ? <img src={user.avatar} alt={user.username} className={`${sizes[size]} rounded-full object-cover border-2 border-slate-700`} />
        : <div className={`${sizes[size]} ${color} rounded-full flex items-center justify-center font-bold text-white border-2 border-slate-700 flex-shrink-0`}>{initial}</div>
      }
      {showStatus && (
        <span className={`absolute ${statusSizes[size]} rounded-full border-2 border-slate-900 ${user?.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`}
          style={user?.isOnline ? { boxShadow: '0 0 6px rgba(52,211,153,0.6)' } : {}} />
      )}
    </div>
  );
}
