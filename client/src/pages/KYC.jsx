// pages/KYC.jsx - KYC submission page for Sub4Earn
// UPDATED: Added ₹90 payment section, QR code, 12-digit UTR field, WhatsApp redirect
import { useEffect, useState, useRef } from 'react';
import { ShieldCheck, Upload, CheckCircle, Clock, XCircle, Smartphone, AlertCircle, ExternalLink, Copy, IndianRupee } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

// WhatsApp redirect helper
function openWhatsApp(utrNumber) {
  const phone = '917740892754'; // +91 country code
  const message = `This is my KYC payment.\nUTR Number: ${utrNumber}`;
  const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank');
}

export default function KYCPage() {
  const [kyc, setKyc] = useState(null);
  const [paymentInfo, setPaymentInfo] = useState({ upi_id: 'sunita2546@fam', amount: 90 });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form fields (existing)
  const [form, setForm] = useState({ full_name: '', mobile: '', email: '', upi_id: '' });
  const [idProof, setIdProof] = useState(null);
  const [selfie, setSelfie] = useState(null);
  const idRef = useRef();
  const selfieRef = useRef();

  // New: UTR field
  const [utrNumber, setUtrNumber] = useState('');
  const [utrError, setUtrError] = useState('');

  // QR copy state
  const [copied, setCopied] = useState(false);

  // UPI payment string for QR code
  const upiString = `upi://pay?pa=${paymentInfo.upi_id}&pn=Sub4Earn&am=${paymentInfo.amount}&cu=INR&tn=KYC+Verification+Fee`;

  useEffect(() => {
    Promise.all([
      api.get('/kyc'),
      api.get('/kyc/payment-info'),
    ]).then(([kycRes, piRes]) => {
      setKyc(kycRes.data.kyc);
      setPaymentInfo(piRes.data);
      if (kycRes.data.kyc) {
        const k = kycRes.data.kyc;
        setForm({ full_name: k.full_name, mobile: k.mobile, email: k.email, upi_id: k.upi_id });
        if (k.utr_number) setUtrNumber(k.utr_number);
      }
    })
    .catch(() => toast.error('Failed to load KYC data'))
    .finally(() => setLoading(false));
  }, []);

  const validateUtr = (val) => {
    if (!val) return 'UTR number is required';
    if (!/^\d+$/.test(val)) return 'UTR must contain only digits';
    if (val.length !== 12) return `UTR must be exactly 12 digits (${val.length} entered)`;
    return '';
  };

  const handleUtrChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 12);
    setUtrNumber(val);
    setUtrError(val.length > 0 ? validateUtr(val) : '');
  };

  const copyUpiId = () => {
    navigator.clipboard.writeText(paymentInfo.upi_id);
    setCopied(true);
    toast.success('UPI ID copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields
    if (!form.full_name || !form.mobile || !form.email || !form.upi_id)
      return toast.error('All personal fields are required');
    if (!idProof || !selfie)
      return toast.error('Please upload both ID proof and selfie');

    const utrErr = validateUtr(utrNumber);
    if (utrErr) { setUtrError(utrErr); return toast.error(utrErr); }

    setSubmitting(true);
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => fd.append(k, v));
    fd.append('utr_number', utrNumber);
    fd.append('id_proof', idProof);
    fd.append('selfie', selfie);

    try {
      await api.post('/kyc/submit', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('KYC submitted! Redirecting to WhatsApp…');

      // Refresh KYC state
      const res = await api.get('/kyc');
      setKyc(res.data.kyc);

      // Redirect to WhatsApp with UTR
      setTimeout(() => openWhatsApp(utrNumber), 800);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Submission failed');
    } finally {
      setSubmitting(false);
    }
  };

  const canSubmit = !kyc || kyc.status === 'rejected';

  if (loading) return (
    <Layout>
      <div className="flex justify-center py-20">
        <span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">KYC Verification</h1>
        <p className="text-sm text-gray-500">Verify your identity to enable withdrawals</p>
      </div>

      {/* ─── KYC Status Banner ───────────────────────────────────────────────── */}
      {kyc && (
        <div className={`card mb-5 flex items-center gap-4 ${
          kyc.status === 'approved'  ? 'border-emerald-200 bg-emerald-50' :
          kyc.status === 'rejected'  ? 'border-red-200 bg-red-50' :
                                       'border-amber-200 bg-amber-50'
        }`}>
          {kyc.status === 'approved' && <CheckCircle className="text-emerald-600 flex-shrink-0" size={28} />}
          {kyc.status === 'pending'  && <Clock className="text-amber-600 flex-shrink-0" size={28} />}
          {kyc.status === 'rejected' && <XCircle className="text-red-600 flex-shrink-0" size={28} />}
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <p className="font-semibold text-gray-800">
                KYC {kyc.status.charAt(0).toUpperCase() + kyc.status.slice(1)}
              </p>
              <StatusBadge status={kyc.status} />
            </div>
            {kyc.status === 'approved' && <p className="text-sm text-emerald-700">Your identity is verified. You can now withdraw earnings.</p>}
            {kyc.status === 'pending'  && <p className="text-sm text-amber-700">Under review. Usually takes 24–48 hours after payment verification.</p>}
            {kyc.status === 'rejected' && <p className="text-sm text-red-700">Reason: {kyc.review_note || 'Documents not valid'}. Please resubmit.</p>}
          </div>
        </div>
      )}

      {/* ─── Submitted documents preview (non-rejected) ──────────────────────── */}
      {kyc && kyc.status !== 'rejected' && (
        <div className="card mb-5">
          <h3 className="font-semibold text-gray-800 mb-3">Submitted Documents</h3>
          {kyc.utr_number && (
            <div className="mb-3 p-2 bg-purple-50 rounded-xl">
              <p className="text-xs text-gray-500 font-medium mb-0.5">UTR Number</p>
              <p className="font-bold text-purple-800 tracking-widest">{kyc.utr_number}</p>
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {kyc.id_proof_url && (
              <div>
                <p className="text-xs text-gray-500 mb-1">ID Proof</p>
                <img src={`${API_BASE}${kyc.id_proof_url}`} alt="ID Proof" className="w-full h-28 object-cover rounded-xl" />
              </div>
            )}
            {kyc.selfie_url && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Selfie</p>
                <img src={`${API_BASE}${kyc.selfie_url}`} alt="Selfie" className="w-full h-28 object-cover rounded-xl" />
              </div>
            )}
          </div>
          {/* Re-send WhatsApp if pending */}
          {kyc.status === 'pending' && kyc.utr_number && (
            <button
              onClick={() => openWhatsApp(kyc.utr_number)}
              className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold bg-green-500 hover:bg-green-600 text-white transition-all"
            >
              <ExternalLink size={15} /> Resend on WhatsApp
            </button>
          )}
        </div>
      )}

      {/* ─── KYC Form (shown when can submit) ────────────────────────────────── */}
      {canSubmit && (
        <>
          {/* ── STEP 1: Payment Section ── */}
          <div className="card mb-5 border-2 border-purple-100">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">1</div>
              <h3 className="font-bold text-gray-900">Pay KYC Verification Fee</h3>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 flex items-start gap-2">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                A one-time KYC fee of <strong>₹{paymentInfo.amount}</strong> is required for identity verification.
                Pay via UPI and enter the UTR number in the form below.
              </p>
            </div>

            {/* Payment amount badge */}
            <div className="text-center mb-4">
              <div className="inline-flex items-center gap-1.5 bg-purple-600 text-white px-5 py-2 rounded-full text-lg font-extrabold shadow-md">
                <IndianRupee size={18} /> {paymentInfo.amount} KYC Fee
              </div>
            </div>

            {/* QR Code */}
            <div className="flex flex-col items-center gap-3 mb-4">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-gray-100">
                <QRCodeSVG
                  value={upiString}
                  size={180}
                  bgColor="#ffffff"
                  fgColor="#4f1d95"
                  level="M"
                  includeMargin={true}
                />
              </div>
              <p className="text-xs text-gray-500 text-center">Scan with any UPI app (PhonePe, GPay, Paytm)</p>
            </div>

            {/* UPI ID with copy */}
            <div className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500 font-medium">UPI ID</p>
                <p className="text-sm font-bold text-gray-900">{paymentInfo.upi_id}</p>
              </div>
              <button
                onClick={copyUpiId}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl transition-all ${
                  copied ? 'bg-emerald-100 text-emerald-700' : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {copied ? <><CheckCircle size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-3">
              After payment, enter the 12-digit UTR/Transaction ID in the form below.
            </p>
          </div>

          {/* ── STEP 2: KYC Form ── */}
          <div className="card">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 rounded-full bg-purple-600 text-white text-xs font-bold flex items-center justify-center">2</div>
              <h3 className="font-bold text-gray-900">
                {kyc?.status === 'rejected' ? 'Resubmit KYC Details' : 'Enter KYC Details'}
              </h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* ── Existing fields (unchanged) ── */}
              <div>
                <label className="label">Full Name (as on ID)</label>
                <input className="input" placeholder="Your full legal name" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} />
              </div>
              <div>
                <label className="label">Mobile Number</label>
                <input className="input" type="tel" maxLength={10} placeholder="10-digit mobile number" value={form.mobile} onChange={e => setForm({ ...form, mobile: e.target.value.replace(/\D/g, '') })} />
              </div>
              <div>
                <label className="label">Email Address</label>
                <input className="input" type="email" placeholder="your@email.com" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label className="label">UPI ID (for payouts)</label>
                <input className="input" placeholder="yourname@upi" value={form.upi_id} onChange={e => setForm({ ...form, upi_id: e.target.value })} />
              </div>

              {/* ID Proof upload */}
              <div>
                <label className="label">ID Proof (Aadhaar / PAN / Voter ID)</label>
                <div
                  className="border-2 border-dashed border-purple-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
                  onClick={() => idRef.current.click()}
                >
                  {idProof ? (
                    <div className="flex items-center gap-2 justify-center text-sm text-emerald-700">
                      <CheckCircle size={16} /> {idProof.name}
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="mx-auto text-purple-400 mb-1" />
                      <p className="text-sm text-gray-500">Upload ID proof image</p>
                      <p className="text-xs text-gray-400">JPG / PNG · Max 5MB</p>
                    </>
                  )}
                </div>
                <input ref={idRef} type="file" accept="image/*" className="hidden" onChange={e => setIdProof(e.target.files[0])} />
              </div>

              {/* Selfie upload */}
              <div>
                <label className="label">Selfie Photo</label>
                <div
                  className="border-2 border-dashed border-purple-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
                  onClick={() => selfieRef.current.click()}
                >
                  {selfie ? (
                    <div className="flex items-center gap-2 justify-center text-sm text-emerald-700">
                      <CheckCircle size={16} /> {selfie.name}
                    </div>
                  ) : (
                    <>
                      <Upload size={20} className="mx-auto text-purple-400 mb-1" />
                      <p className="text-sm text-gray-500">Upload a clear selfie</p>
                      <p className="text-xs text-gray-400">JPG / PNG · Max 5MB</p>
                    </>
                  )}
                </div>
                <input ref={selfieRef} type="file" accept="image/*" className="hidden" onChange={e => setSelfie(e.target.files[0])} />
              </div>

              {/* ── NEW: UTR Number Field ── */}
              <div>
                <label className="label">
                  UTR / Transaction Number
                  <span className="ml-1 text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    className={`input pr-16 font-mono tracking-widest ${utrError ? 'border-red-400 focus:ring-red-400' : utrNumber.length === 12 ? 'border-emerald-400 focus:ring-emerald-400' : ''}`}
                    type="text"
                    inputMode="numeric"
                    placeholder="Enter 12-digit UTR"
                    maxLength={12}
                    value={utrNumber}
                    onChange={handleUtrChange}
                  />
                  <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium ${
                    utrNumber.length === 12 ? 'text-emerald-600' : 'text-gray-400'
                  }`}>
                    {utrNumber.length}/12
                  </span>
                </div>
                {utrError && (
                  <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                    <AlertCircle size={12} /> {utrError}
                  </p>
                )}
                {utrNumber.length === 12 && !utrError && (
                  <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                    <CheckCircle size={12} /> Valid UTR number
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">
                  Find the UTR / Reference ID in your UPI payment receipt.
                </p>
              </div>

              {/* WhatsApp info notice */}
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-xl p-3">
                <Smartphone size={16} className="text-green-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-green-800">
                  After submitting, you'll be automatically redirected to <strong>WhatsApp</strong> to send your UTR proof to our team at <strong>+91 77408 92754</strong>.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full flex items-center justify-center gap-2 py-3"
              >
                {submitting ? (
                  <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <><ShieldCheck size={16} /> Submit KYC & Open WhatsApp</>
                )}
              </button>
            </form>
          </div>
        </>
      )}
    </Layout>
  );
}
