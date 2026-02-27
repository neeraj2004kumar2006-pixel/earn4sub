// pages/Withdraw.jsx - Withdrawal page for Sub4Earn users
import { useEffect, useState } from 'react';
import { ArrowDownToLine, Lock, CheckCircle, Clock, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

function fmtDate(str) {
  return new Date(str).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function WithdrawPage() {
  const [data, setData] = useState(null);
  const [form, setForm] = useState({ amount: '', upi_id: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = () => {
    api.get('/withdraw')
      .then(res => {
        setData(res.data);
        if (res.data.upi_id) setForm(f => ({ ...f, upi_id: res.data.upi_id }));
      })
      .catch(() => toast.error('Failed to load withdrawal data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return toast.error('Enter a valid amount');
    if (!form.upi_id.trim()) return toast.error('UPI ID is required');
    setSubmitting(true);
    try {
      await api.post('/withdraw/request', { amount: amt, upi_id: form.upi_id });
      toast.success('Withdrawal request submitted!');
      setForm(f => ({ ...f, amount: '' }));
      fetchData();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Request failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div></Layout>;

  const kycApproved = data?.kyc_status === 'approved';
  const hasPending = data?.withdrawals?.some(w => w.status === 'pending');

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Withdraw Earnings</h1>
        <p className="text-sm text-gray-500">Transfer your earnings to UPI</p>
      </div>

      {/* Balance */}
      <div className="card bg-gradient-to-r from-purple-600 to-violet-600 text-white mb-5">
        <p className="text-sm opacity-80">Available Balance</p>
        <p className="text-4xl font-extrabold mt-1">₹{(data?.wallet_balance || 0).toFixed(2)}</p>
        <p className="text-xs opacity-70 mt-2">Min. withdrawal: ₹{data?.min_withdrawal || 149}</p>
      </div>

      {/* KYC lock */}
      {!kycApproved && (
        <div className="card mb-5 border-amber-200 bg-amber-50 flex items-center gap-4">
          <Lock className="text-amber-600 flex-shrink-0" size={28} />
          <div>
            <p className="font-semibold text-amber-800">KYC Required</p>
            <p className="text-sm text-amber-700">You need to complete KYC verification before withdrawing.</p>
            <Link to="/kyc" className="text-sm text-purple-700 font-semibold hover:underline mt-1 inline-block">Complete KYC →</Link>
          </div>
        </div>
      )}

      {/* Pending notice */}
      {hasPending && (
        <div className="card mb-5 border-blue-200 bg-blue-50 flex items-center gap-3">
          <Clock className="text-blue-600 flex-shrink-0" size={22} />
          <p className="text-sm text-blue-700">You have a pending withdrawal request. Please wait for it to be processed.</p>
        </div>
      )}

      {/* Withdraw form */}
      {kycApproved && !hasPending && (
        <div className="card mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">New Withdrawal Request</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Amount (₹)</label>
              <input
                className="input"
                type="number"
                min={data?.min_withdrawal || 149}
                max={data?.wallet_balance || 0}
                step="1"
                placeholder={`Min ₹${data?.min_withdrawal || 149}`}
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
              />
              <p className="text-xs text-gray-400 mt-1">Max: ₹{(data?.wallet_balance || 0).toFixed(2)}</p>
            </div>
            <div>
              <label className="label">UPI ID</label>
              <input
                className="input"
                placeholder="yourname@upi"
                value={form.upi_id}
                onChange={e => setForm({ ...form, upi_id: e.target.value })}
              />
            </div>
            <button type="submit" disabled={submitting || !data?.wallet_balance || data.wallet_balance < (data?.min_withdrawal || 149)} className="btn-primary w-full flex items-center justify-center gap-2">
              {submitting ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><ArrowDownToLine size={16} /> Request Withdrawal</>}
            </button>
          </form>
        </div>
      )}

      {/* History */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">Withdrawal History</h2>
        {(!data?.withdrawals || data.withdrawals.length === 0) ? (
          <div className="text-center py-8">
            <ArrowDownToLine size={36} className="mx-auto text-gray-200 mb-2" />
            <p className="text-gray-400 text-sm">No withdrawal requests yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.withdrawals.map(w => (
              <div key={w.id} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800">₹{w.amount.toFixed(2)}</p>
                  <p className="text-xs text-gray-500">{w.upi_id}</p>
                  <p className="text-xs text-gray-300">{fmtDate(w.created_at)}</p>
                </div>
                <StatusBadge status={w.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
