// pages/admin/AdminWithdrawals.jsx - Withdrawal review page for Sub4Earn admin
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, CreditCard } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

export default function AdminWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(null);

  const fetchWithdrawals = (status = filter) => {
    setLoading(true);
    api.get(`/admin/withdrawals?status=${status}`)
      .then(res => setWithdrawals(res.data.withdrawals))
      .catch(() => toast.error('Failed to load withdrawals'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWithdrawals(filter); }, [filter]);

  const approve = async (id) => {
    setProcessing(id);
    try {
      const res = await api.post(`/admin/withdrawals/${id}/approve`);
      toast.success(res.data.message);
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setProcessing(null);
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal);
    try {
      await api.post(`/admin/withdrawals/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('Withdrawal rejected. Balance refunded.');
      setRejectModal(null); setRejectReason('');
      fetchWithdrawals();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setProcessing(null);
    }
  };

  const totalPending = withdrawals.filter(w => w.status === 'pending').reduce((s, w) => s + w.amount, 0);

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Withdrawal Requests</h1>
        <p className="text-sm text-gray-500">Process user payout requests</p>
      </div>

      {filter === 'pending' && withdrawals.length > 0 && (
        <div className="card mb-4 bg-purple-50 border-purple-200">
          <p className="text-sm text-purple-700"><span className="font-bold">{withdrawals.length}</span> pending request(s) totaling <span className="font-bold">₹{totalPending.toFixed(2)}</span></p>
        </div>
      )}

      <div className="flex gap-2 mb-5">
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize ${filter === s ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-1">Reject Withdrawal</h3>
            <p className="text-sm text-gray-500 mb-3">The amount will be refunded to user's wallet.</p>
            <textarea className="input min-h-[70px] mb-3" placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-danger flex-1" onClick={reject} disabled={!!processing}>Reject & Refund</button>
              <button className="btn-secondary flex-1" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : withdrawals.length === 0 ? (
        <div className="card text-center py-12"><CreditCard size={36} className="mx-auto text-gray-200 mb-2" /><p className="text-gray-400">No {filter} withdrawals</p></div>
      ) : (
        <div className="space-y-4">
          {withdrawals.map(w => (
            <div key={w.id} className="card">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-sm font-semibold text-gray-800">{w.user_email}</p>
                  <p className="text-xs text-gray-500">UPI: {w.upi_id}</p>
                  <p className="text-xs text-gray-400">{new Date(w.created_at).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-extrabold text-purple-700">₹{w.amount.toFixed(2)}</p>
                  <StatusBadge status={w.status} />
                </div>
              </div>
              {w.reject_reason && <p className="text-xs text-red-600 bg-red-50 rounded-xl p-2 mb-3">Reason: {w.reject_reason}</p>}
              {w.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="btn-success flex-1 flex items-center justify-center gap-1.5 text-sm" onClick={() => approve(w.id)} disabled={processing === w.id}>
                    {processing === w.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                    Mark Paid
                  </button>
                  <button className="btn-danger flex-1 flex items-center justify-center gap-1.5 text-sm" onClick={() => setRejectModal(w.id)}>
                    <XCircle size={14} /> Reject & Refund
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
