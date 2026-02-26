// pages/Wallet.jsx - Wallet page for Sub4Earn users
import { useEffect, useState } from 'react';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

function fmtDate(str) {
  return new Date(str).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function WalletPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/wallet')
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load wallet'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Layout><div className="flex justify-center py-20"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Wallet</h1>
        <p className="text-sm text-gray-500">Your earnings and transaction history</p>
      </div>

      {/* Balance card */}
      <div className="card bg-gradient-to-r from-purple-600 to-violet-600 text-white mb-5">
        <p className="text-sm font-medium opacity-80 mb-1">Available Balance</p>
        <p className="text-4xl font-extrabold">₹{(data?.wallet_balance || 0).toFixed(2)}</p>
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs opacity-75 mb-1"><TrendingUp size={12} /> Total Earned</div>
            <p className="font-bold text-lg">₹{(data?.total_earned || 0).toFixed(2)}</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <div className="flex items-center gap-1.5 text-xs opacity-75 mb-1"><TrendingDown size={12} /> Total Withdrawn</div>
            <p className="font-bold text-lg">₹{(data?.total_withdrawn || 0).toFixed(2)}</p>
          </div>
        </div>
      </div>

      {/* Transaction count */}
      <p className="text-sm text-gray-500 mb-3">{data?.total_transactions || 0} transactions</p>

      {/* Transaction list */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Transaction History</h2>
        {(!data?.transactions || data.transactions.length === 0) ? (
          <div className="text-center py-10">
            <WalletIcon size={40} className="mx-auto text-gray-200 mb-3" />
            <p className="text-gray-400 text-sm">No transactions yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.type === 'credit' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {tx.type === 'credit'
                      ? <TrendingUp size={16} className="text-emerald-600" />
                      : <TrendingDown size={16} className="text-red-600" />
                    }
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 capitalize truncate">{tx.source?.replace(/_/g, ' ')}</p>
                    <p className="text-xs text-gray-400 truncate">{tx.note || '—'}</p>
                    <p className="text-xs text-gray-300">{fmtDate(tx.created_at)}</p>
                  </div>
                </div>
                <div className="flex-shrink-0 ml-3 text-right">
                  <p className={`font-bold text-sm ${tx.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>
                    {tx.type === 'credit' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                  </p>
                  <StatusBadge status={tx.type} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
