// pages/admin/AdminDashboard.jsx - Admin overview dashboard for Sub4Earn
import { useEffect, useState } from 'react';
import { Users, ListTodo, Eye, ShieldCheck, CreditCard, TrendingUp } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';

function StatCard({ icon: Icon, label, value, color, to }) {
  const content = (
    <div className={`card flex items-center gap-4 hover:shadow-md transition-shadow ${to ? 'cursor-pointer' : ''}`}>
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/dashboard')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load dashboard'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex justify-center py-20"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div></Layout>;

  const { stats, recent_users } = data;

  return (
    <Layout>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-500">Sub4Earn platform overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Users} label="Total Users" value={stats.total_users} color="bg-blue-100 text-blue-600" to="/admin/users" />
        <StatCard icon={ListTodo} label="Total Tasks" value={stats.total_tasks} color="bg-purple-100 text-purple-600" to="/admin/tasks" />
        <StatCard icon={Eye} label="Pending Proofs" value={stats.pending_proofs} color="bg-amber-100 text-amber-600" to="/admin/proofs" />
        <StatCard icon={ShieldCheck} label="Pending KYC" value={stats.pending_kyc} color="bg-violet-100 text-violet-600" to="/admin/kyc" />
        <StatCard icon={CreditCard} label="Pending Payouts" value={stats.pending_withdrawals} color="bg-red-100 text-red-600" to="/admin/withdrawals" />
        <StatCard icon={TrendingUp} label="Total Payouts" value={`₹${(stats.total_payouts || 0).toFixed(0)}`} color="bg-emerald-100 text-emerald-600" />
      </div>

      {/* Quick alerts */}
      {(stats.pending_proofs > 0 || stats.pending_kyc > 0 || stats.pending_withdrawals > 0) && (
        <div className="card mb-5 border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-800 mb-2">Pending Actions</h3>
          <ul className="space-y-1 text-sm text-amber-700">
            {stats.pending_proofs > 0 && <li>• {stats.pending_proofs} proof submission(s) waiting for review</li>}
            {stats.pending_kyc > 0 && <li>• {stats.pending_kyc} KYC application(s) waiting for approval</li>}
            {stats.pending_withdrawals > 0 && <li>• {stats.pending_withdrawals} withdrawal request(s) pending</li>}
          </ul>
        </div>
      )}

      {/* Recent users */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Sign-ups</h2>
          <Link to="/admin/users" className="text-sm text-purple-600 hover:underline">View all</Link>
        </div>
        {recent_users.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No users yet</p>
        ) : (
          <div className="space-y-3">
            {recent_users.map(u => (
              <div key={u.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm">
                    {u.email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{u.email}</p>
                    <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.kyc_status === 'approved' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  KYC: {u.kyc_status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
