// pages/admin/AdminUsers.jsx - Users list page for Sub4Earn admin
import { useEffect, useState } from 'react';
import { Users, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    api.get('/admin/users')
      .then(res => setUsers(res.data.users))
      .catch(() => toast.error('Failed to load users'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()));

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Users</h1>
        <p className="text-sm text-gray-500">{users.length} registered users</p>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-9"
          placeholder="Search by email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12"><Users size={36} className="mx-auto text-gray-200 mb-2" /><p className="text-gray-400">No users found</p></div>
      ) : (
        <div className="card">
          <div className="space-y-3">
            {filtered.map(u => (
              <div key={u.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center text-purple-700 font-bold text-sm flex-shrink-0">
                    {u.email[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.email}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <StatusBadge status={u.kyc_status} />
                      <span className="text-xs text-gray-400">{u.completed_tasks} tasks</span>
                    </div>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-purple-700">₹{(u.wallet_balance || 0).toFixed(2)}</p>
                  <p className="text-xs text-gray-400">{new Date(u.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Layout>
  );
}
