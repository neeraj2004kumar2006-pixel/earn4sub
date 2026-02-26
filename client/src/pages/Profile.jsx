// pages/Profile.jsx - User profile page for Sub4Earn
import { useEffect, useState } from 'react';
import { User, KeyRound, Smartphone, Copy, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [upiForm, setUpiForm] = useState({ upi_id: '' });
  const [pwdForm, setPwdForm] = useState({ current_password: '', new_password: '', confirm: '' });
  const [savingUpi, setSavingUpi] = useState(false);
  const [savingPwd, setSavingPwd] = useState(false);
  const [referrals, setReferrals] = useState([]);

  useEffect(() => {
    Promise.all([api.get('/profile'), api.get('/profile/referrals')])
      .then(([p, r]) => {
        setProfile(p.data.user);
        setUpiForm({ upi_id: p.data.user.upi_id || '' });
        setReferrals(r.data.referrals);
      })
      .catch(() => toast.error('Failed to load profile'))
      .finally(() => setLoading(false));
  }, []);

  const saveUpi = async (e) => {
    e.preventDefault();
    setSavingUpi(true);
    try {
      await api.put('/profile/upi', upiForm);
      toast.success('UPI ID updated!');
      refreshUser();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Update failed');
    } finally {
      setSavingUpi(false);
    }
  };

  const changePwd = async (e) => {
    e.preventDefault();
    if (pwdForm.new_password !== pwdForm.confirm) return toast.error('New passwords do not match');
    setSavingPwd(true);
    try {
      await api.put('/profile/password', { current_password: pwdForm.current_password, new_password: pwdForm.new_password });
      toast.success('Password changed!');
      setPwdForm({ current_password: '', new_password: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setSavingPwd(false);
    }
  };

  const copyRef = () => {
    navigator.clipboard.writeText(`${window.location.origin}/signup?ref=${profile?.referral_code}`);
    toast.success('Referral link copied!');
  };

  if (loading) return <Layout><div className="flex justify-center py-20"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div></Layout>;

  return (
    <Layout>
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900">Profile</h1>
        <p className="text-sm text-gray-500">Manage your account settings</p>
      </div>

      {/* Profile overview */}
      <div className="card mb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-violet-500 flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
            {user?.email?.[0]?.toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-gray-900 text-lg break-all">{user?.email}</p>
            <p className="text-xs text-gray-400">Member since {new Date(profile?.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
            <div className="flex items-center gap-2 mt-1">
              <StatusBadge status={user?.kyc_status || 'not_submitted'} />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            ['₹' + (profile?.total_earned || 0).toFixed(0), 'Total Earned'],
            [profile?.completed_tasks || 0, 'Tasks Done'],
            [profile?.total_referrals || 0, 'Referrals'],
          ].map(([val, label]) => (
            <div key={label} className="text-center bg-gray-50 rounded-xl p-3">
              <p className="font-bold text-gray-900">{val}</p>
              <p className="text-xs text-gray-400 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* UPI ID */}
      <div className="card mb-5">
        <div className="flex items-center gap-2 mb-3">
          <Smartphone size={18} className="text-purple-600" />
          <h2 className="font-semibold text-gray-800">UPI ID</h2>
        </div>
        <form onSubmit={saveUpi} className="flex gap-2">
          <input className="input flex-1" placeholder="yourname@upi" value={upiForm.upi_id} onChange={e => setUpiForm({ upi_id: e.target.value })} />
          <button type="submit" disabled={savingUpi} className="btn-primary py-2.5 px-4 text-sm flex items-center gap-1">
            {savingUpi ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <CheckCircle size={14} />}
            Save
          </button>
        </form>
      </div>

      {/* Referral */}
      <div className="card mb-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-800">Referral Code</h2>
          <button onClick={copyRef} className="flex items-center gap-1.5 text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl">
            <Copy size={12} /> Copy Link
          </button>
        </div>
        <div className="bg-purple-50 rounded-xl px-4 py-3 font-bold text-purple-700 text-lg tracking-widest text-center">
          {profile?.referral_code}
        </div>
        {referrals.length > 0 && (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-gray-500">{referrals.length} referral(s)</p>
            {referrals.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-xs text-gray-600">
                <span className="truncate">{r.referred_email}</span>
                <span className="text-emerald-600 font-semibold ml-2">+₹10</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Change password */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <KeyRound size={18} className="text-purple-600" />
          <h2 className="font-semibold text-gray-800">Change Password</h2>
        </div>
        <form onSubmit={changePwd} className="space-y-3">
          <input className="input" type="password" placeholder="Current password" value={pwdForm.current_password} onChange={e => setPwdForm({ ...pwdForm, current_password: e.target.value })} />
          <input className="input" type="password" placeholder="New password (min 6 chars)" value={pwdForm.new_password} onChange={e => setPwdForm({ ...pwdForm, new_password: e.target.value })} />
          <input className="input" type="password" placeholder="Confirm new password" value={pwdForm.confirm} onChange={e => setPwdForm({ ...pwdForm, confirm: e.target.value })} />
          <button type="submit" disabled={savingPwd} className="btn-primary w-full flex items-center justify-center gap-2">
            {savingPwd ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <KeyRound size={14} />}
            Change Password
          </button>
        </form>
      </div>
    </Layout>
  );
}
