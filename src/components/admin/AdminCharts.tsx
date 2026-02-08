import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Profile } from '@/hooks/useAuth';

interface AdminChartsProps {
  creditTrendData: { date: string; usage: number; bonus: number; purchase: number }[];
  topUsers: Profile[];
}

const AdminCharts: React.FC<AdminChartsProps> = ({ creditTrendData, topUsers }) => {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Credit Usage Trend */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5">
        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Credit Usage Trend (30d)</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={creditTrendData}>
              <defs>
                <linearGradient id="usageGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="bonusGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '11px' }}
                labelStyle={{ color: '#fff', fontWeight: 700 }}
              />
              <Area type="monotone" dataKey="usage" stroke="#f97316" fill="url(#usageGrad)" strokeWidth={2} name="Usage" />
              <Area type="monotone" dataKey="bonus" stroke="#a855f7" fill="url(#bonusGrad)" strokeWidth={2} name="Free Grants" />
              <Area type="monotone" dataKey="purchase" stroke="#22c55e" fill="transparent" strokeWidth={1.5} strokeDasharray="4 4" name="Purchases" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Users */}
      <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl p-5">
        <h3 className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">Top Users by Usage</h3>
        <div className="h-[250px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={topUsers.map(u => ({ name: u.full_name.split(' ')[0] || u.email.split('@')[0], generations: u.total_generations, credits: u.credits }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9, fill: '#71717a' }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46', borderRadius: '12px', fontSize: '11px' }}
                labelStyle={{ color: '#fff', fontWeight: 700 }}
              />
              <Bar dataKey="generations" fill="#f97316" radius={[6, 6, 0, 0]} name="Total Generations" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default AdminCharts;
