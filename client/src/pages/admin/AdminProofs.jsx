// pages/admin/AdminProofs.jsx - Proof review page for Sub4Earn admin
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ExternalLink, Eye } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AdminProofs() {
  const [proofs, setProofs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null); // { id }
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(null);

  const fetchProofs = (status = filter) => {
    setLoading(true);
    api.get(`/admin/proofs?status=${status}`)
      .then(res => setProofs(res.data.proofs))
      .catch(() => toast.error('Failed to load proofs'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchProofs(filter); }, [filter]);

  const approve = async (id) => {
    setProcessing(id);
    try {
      const res = await api.post(`/admin/proofs/${id}/approve`);
      toast.success(res.data.message);
      fetchProofs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to approve');
    } finally {
      setProcessing(null);
    }
  };

  const reject = async () => {
    if (!rejectModal) return;
    setProcessing(rejectModal);
    try {
      await api.post(`/admin/proofs/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('Proof rejected');
      setRejectModal(null); setRejectReason('');
      fetchProofs();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to reject');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Proof Review</h1>
        <p className="text-sm text-gray-500">Review user task submissions</p>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-xl text-xs font-semibold capitalize transition-all ${filter === s ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
            {s}
          </button>
        ))}
      </div>

      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm shadow-xl">
            <h3 className="font-bold text-gray-900 mb-3">Reject Proof</h3>
            <textarea
              className="input min-h-[80px] mb-3"
              placeholder="Reason for rejection..."
              value={rejectReason}
              onChange={e => setRejectReason(e.target.value)}
            />
            <div className="flex gap-2">
              <button className="btn-danger flex-1" onClick={reject} disabled={!!processing}>
                {processing ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mx-auto" /> : 'Confirm Reject'}
              </button>
              <button className="btn-secondary flex-1" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : proofs.length === 0 ? (
        <div className="card text-center py-12"><Eye size={36} className="mx-auto text-gray-200 mb-2" /><p className="text-gray-400">No {filter} proofs</p></div>
      ) : (
        <div className="space-y-4">
          {proofs.map(proof => (
            <div key={proof.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{proof.task_title}</p>
                  <p className="text-xs text-gray-500">{proof.user_email}</p>
                  <p className="text-xs text-gray-400">{new Date(proof.submitted_at).toLocaleDateString()}</p>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-purple-700">₹{proof.reward_amount}</p>
                  <StatusBadge status={proof.status} />
                </div>
              </div>

              {/* Proof image */}
              {proof.proof_image_url && (
                <div className="mb-3 relative">
                  <img
                    src={`${API_BASE}${proof.proof_image_url}`}
                    alt="Proof"
                    className="w-full max-h-52 object-cover rounded-xl"
                  />
                  <a
                    href={`${API_BASE}${proof.proof_image_url}`}
                    target="_blank" rel="noreferrer"
                    className="absolute top-2 right-2 bg-white/90 rounded-lg p-1.5 shadow hover:bg-white"
                  >
                    <ExternalLink size={14} className="text-gray-700" />
                  </a>
                </div>
              )}

              {/* Reject reason */}
              {proof.reject_reason && (
                <p className="text-xs text-red-600 mb-3 bg-red-50 rounded-xl p-2">Rejected: {proof.reject_reason}</p>
              )}

              {/* Actions */}
              {proof.status === 'pending' && (
                <div className="flex gap-2">
                  <button
                    className="btn-success flex-1 flex items-center justify-center gap-1.5 text-sm"
                    onClick={() => approve(proof.id)}
                    disabled={processing === proof.id}
                  >
                    {processing === proof.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                    Approve (+₹{proof.reward_amount})
                  </button>
                  <button
                    className="btn-danger flex-1 flex items-center justify-center gap-1.5 text-sm"
                    onClick={() => setRejectModal(proof.id)}
                  >
                    <XCircle size={14} /> Reject
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
