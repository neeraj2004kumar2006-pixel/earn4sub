// pages/admin/AdminKYC.jsx - KYC review page for Sub4Earn admin
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, ShieldCheck, ExternalLink, Hash } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import StatusBadge from '../../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

export default function AdminKYC() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');
  const [rejectModal, setRejectModal] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [processing, setProcessing] = useState(null);

  const fetchKYC = (status = filter) => {
    setLoading(true);
    api.get(`/admin/kyc?status=${status}`)
      .then(res => setRecords(res.data.records))
      .catch(() => toast.error('Failed to load KYC records'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchKYC(filter); }, [filter]);

  const approve = async (id) => {
    setProcessing(id);
    try {
      await api.post(`/admin/kyc/${id}/approve`);
      toast.success('KYC approved!');
      fetchKYC();
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
      await api.post(`/admin/kyc/${rejectModal}/reject`, { reason: rejectReason });
      toast.success('KYC rejected');
      setRejectModal(null); setRejectReason('');
      fetchKYC();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed');
    } finally {
      setProcessing(null);
    }
  };

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">KYC Review</h1>
        <p className="text-sm text-gray-500">Verify user identity documents</p>
      </div>

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
            <h3 className="font-bold text-gray-900 mb-3">Reject KYC</h3>
            <textarea className="input min-h-[80px] mb-3" placeholder="Reason for rejection..." value={rejectReason} onChange={e => setRejectReason(e.target.value)} />
            <div className="flex gap-2">
              <button className="btn-danger flex-1" onClick={reject} disabled={!!processing}>Confirm Reject</button>
              <button className="btn-secondary flex-1" onClick={() => { setRejectModal(null); setRejectReason(''); }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : records.length === 0 ? (
        <div className="card text-center py-12"><ShieldCheck size={36} className="mx-auto text-gray-200 mb-2" /><p className="text-gray-400">No {filter} KYC records</p></div>
      ) : (
        <div className="space-y-4">
          {records.map(r => (
            <div key={r.id} className="card">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="font-semibold text-gray-800">{r.full_name}</p>
                  <p className="text-xs text-gray-500">{r.email}</p>
                  <p className="text-xs text-gray-400">{r.mobile} · UPI: {r.upi_id}</p>
                  <p className="text-xs text-gray-300 mt-0.5">{new Date(r.submitted_at).toLocaleDateString()}</p>
                </div>
                <StatusBadge status={r.status} />
              </div>

              {/* UTR Number — key for admin payment verification */}
              {r.utr_number && (
                <div className="mb-3 flex items-center gap-2 bg-purple-50 border border-purple-100 rounded-xl px-4 py-2.5">
                  <Hash size={16} className="text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-xs text-gray-500 font-medium">UTR / Transaction Number</p>
                    <p className="font-bold text-purple-800 tracking-widest text-sm">{r.utr_number}</p>
                  </div>
                </div>
              )}
              {!r.utr_number && (
                <div className="mb-3 px-4 py-2 bg-amber-50 rounded-xl text-xs text-amber-700">
                  No UTR number provided.
                </div>
              )}

              {/* Documents */}
              <div className="grid grid-cols-2 gap-3 mb-3">
                {r.id_proof_url && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500 font-medium">ID Proof</p>
                      <a href={`${API_BASE}${r.id_proof_url}`} target="_blank" rel="noreferrer"><ExternalLink size={11} className="text-blue-500" /></a>
                    </div>
                    <img src={`${API_BASE}${r.id_proof_url}`} alt="ID" className="w-full h-28 object-cover rounded-xl" />
                  </div>
                )}
                {r.selfie_url && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-xs text-gray-500 font-medium">Selfie</p>
                      <a href={`${API_BASE}${r.selfie_url}`} target="_blank" rel="noreferrer"><ExternalLink size={11} className="text-blue-500" /></a>
                    </div>
                    <img src={`${API_BASE}${r.selfie_url}`} alt="Selfie" className="w-full h-28 object-cover rounded-xl" />
                  </div>
                )}
              </div>

              {r.review_note && <p className="text-xs text-red-600 bg-red-50 rounded-xl p-2 mb-3">Note: {r.review_note}</p>}

              {r.status === 'pending' && (
                <div className="flex gap-2">
                  <button className="btn-success flex-1 flex items-center justify-center gap-1.5 text-sm" onClick={() => approve(r.id)} disabled={processing === r.id}>
                    {processing === r.id ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
                    Approve KYC
                  </button>
                  <button className="btn-danger flex-1 flex items-center justify-center gap-1.5 text-sm" onClick={() => setRejectModal(r.id)}>
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
