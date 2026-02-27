// pages/Dashboard.jsx - User dashboard home for Sub4Earn
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, ListTodo, CheckCircle, Clock, ShieldCheck, ArrowDownToLine, Copy, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

function StatCard({ icon: Icon, label, value, color, sub }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400">{sub}</p>}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [stats, setStats] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/profile'),
      api.get('/tasks/my'),
    ]).then(([profileRes, tasksRes]) => {
      setStats(profileRes.data.user);
      setTasks(tasksRes.data.tasks);
    }).catch(() => {
      toast.error('Failed to load dashboard');
    }).finally(() => setLoading(false));
    refreshUser();
  }, []);

  const copyReferral = () => {
    const link = `${window.location.origin}/signup?ref=${user?.referral_code}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!');
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      {/* Welcome header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">Welcome back! 👋</h1>
        <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <StatCard icon={Wallet} label="Wallet Balance" value={`₹${(user?.wallet_balance || 0).toFixed(2)}`} color="bg-purple-100 text-purple-600" />
        <StatCard icon={ArrowDownToLine} label="Total Withdrawn" value={`₹${(stats?.total_earned - (user?.wallet_balance || 0) < 0 ? 0 : 0).toFixed(2)}`} color="bg-green-100 text-green-600" sub="All time" />
        <StatCard icon={CheckCircle} label="Completed Tasks" value={stats?.completed_tasks || 0} color="bg-blue-100 text-blue-600" />
        <StatCard icon={Clock} label="Pending Tasks" value={tasks.filter(t => t.status === 'pending').length} color="bg-amber-100 text-amber-600" />
        <StatCard
          icon={ShieldCheck}
          label="KYC Status"
          value={<StatusBadge status={user?.kyc_status || 'not_submitted'} />}
          color="bg-violet-100 text-violet-600"
        />
        <StatCard icon={Wallet} label="Total Earned" value={`₹${(stats?.total_earned || 0).toFixed(2)}`} color="bg-emerald-100 text-emerald-600" sub="All task rewards" />
      </div>

      {/* KYC banner */}
      {user?.kyc_status !== 'approved' && (
        <div className="mb-5 p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-amber-800">Complete KYC to withdraw</p>
            <p className="text-xs text-amber-600">Submit your KYC documents to unlock withdrawals.</p>
          </div>
          <Link to="/kyc" className="btn-primary text-xs py-2 px-3 whitespace-nowrap">Verify Now</Link>
        </div>
      )}

      {/* Referral card */}
      <div className="card mb-5 bg-gradient-to-r from-purple-600 to-violet-600 text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold opacity-90">Refer & Earn</p>
            <p className="text-xs opacity-75 mt-0.5">Earn ₹10 for each successful referral</p>
            <p className="font-bold mt-2 tracking-wider">{user?.referral_code}</p>
          </div>
          <button
            onClick={copyReferral}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 rounded-xl px-4 py-2 text-sm font-semibold transition-all"
          >
            <Copy size={14} /> Copy Link
          </button>
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-800">Recent Submissions</h2>
          <Link to="/tasks" className="text-sm text-purple-600 hover:underline flex items-center gap-1">View all <ArrowRight size={12} /></Link>
        </div>
        {tasks.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-400 text-sm mb-3">No tasks submitted yet</p>
            <Link to="/tasks" className="btn-primary text-sm py-2 px-4">Browse Tasks</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {tasks.map(t => (
              <div key={t.id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{t.title}</p>
                  <p className="text-xs text-gray-400">{new Date(t.submitted_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                  <span className="text-sm font-bold text-purple-700">₹{t.reward_amount}</span>
                  <StatusBadge status={t.status} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
