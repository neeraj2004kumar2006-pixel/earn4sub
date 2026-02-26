// pages/Tasks.jsx - Tasks page for Sub4Earn users
import { useEffect, useState, useRef } from 'react';
import { ExternalLink, Upload, Youtube, CheckCircle, Clock, XCircle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../utils/api';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

function TaskCard({ task, onSubmit }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const fileRef = useRef();

  const status = task.user_status;

  const handleFileChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > 5 * 1024 * 1024) return toast.error('File too large. Max 5MB.');
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!file) return toast.error('Please select a screenshot');
    setUploading(true);
    const formData = new FormData();
    formData.append('proof', file);
    try {
      await api.post(`/tasks/${task.id}/submit`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Proof submitted! Awaiting review.');
      setShowUpload(false);
      setFile(null);
      setPreview(null);
      onSubmit();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const canSubmit = !status || status === 'rejected';

  return (
    <div className="card">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
            <Youtube size={20} className="text-red-600" />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">{task.title}</h3>
            <p className="text-xs text-gray-400 mt-0.5">{task.completions || 0} completed</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-lg font-bold text-purple-700">₹{task.reward_amount}</p>
          <StatusBadge status={status || 'not_started'} />
        </div>
      </div>

      {/* Reject reason */}
      {status === 'rejected' && task.reject_reason && (
        <div className="mb-3 p-2 bg-red-50 rounded-xl text-xs text-red-700">
          <strong>Rejected:</strong> {task.reject_reason}
        </div>
      )}

      {/* Proof thumbnail */}
      {task.proof_image_url && !showUpload && (
        <div className="mb-3">
          <p className="text-xs text-gray-500 mb-1">Submitted proof:</p>
          <img src={`${API_BASE}${task.proof_image_url}`} alt="Proof" className="w-full max-h-40 object-cover rounded-xl" />
        </div>
      )}

      {/* Upload section */}
      {showUpload && (
        <div className="mb-3">
          <div
            className="border-2 border-dashed border-purple-200 rounded-xl p-4 text-center cursor-pointer hover:border-purple-400 transition-colors"
            onClick={() => fileRef.current.click()}
          >
            {preview ? (
              <img src={preview} alt="Preview" className="w-full max-h-36 object-cover rounded-lg" />
            ) : (
              <>
                <Upload size={24} className="mx-auto text-purple-400 mb-2" />
                <p className="text-sm text-gray-500">Tap to select screenshot</p>
                <p className="text-xs text-gray-400">JPG, PNG or WEBP · Max 5MB</p>
              </>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <a
          href={task.youtube_url}
          target="_blank" rel="noreferrer"
          className="flex items-center gap-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-2 rounded-xl transition-colors"
        >
          <ExternalLink size={14} /> Open YouTube
        </a>

        {canSubmit && !showUpload && (
          <button
            className="flex items-center gap-1.5 text-xs font-semibold btn-primary py-2 px-3"
            onClick={() => setShowUpload(true)}
          >
            <Upload size={14} /> Upload Proof
          </button>
        )}

        {showUpload && (
          <>
            <button
              className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
              onClick={handleSubmit}
              disabled={uploading || !file}
            >
              {uploading ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><CheckCircle size={14} /> Submit</>}
            </button>
            <button className="btn-secondary text-xs py-2 px-3" onClick={() => { setShowUpload(false); setFile(null); setPreview(null); }}>
              Cancel
            </button>
          </>
        )}

        {status === 'approved' && (
          <span className="flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl">
            <CheckCircle size={14} /> Reward credited
          </span>
        )}
        {status === 'pending' && (
          <span className="flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-3 py-2 rounded-xl">
            <Clock size={14} /> Under review
          </span>
        )}
      </div>
    </div>
  );
}

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchTasks = () => {
    setLoading(true);
    api.get('/tasks')
      .then(res => setTasks(res.data.tasks))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const filtered = tasks.filter(t => {
    if (filter === 'all') return true;
    if (filter === 'pending') return t.user_status === 'pending';
    if (filter === 'approved') return t.user_status === 'approved';
    if (filter === 'new') return !t.user_status;
    return true;
  });

  const filters = [
    { key: 'all', label: 'All Tasks', count: tasks.length },
    { key: 'new', label: 'Available', count: tasks.filter(t => !t.user_status).length },
    { key: 'pending', label: 'Pending', count: tasks.filter(t => t.user_status === 'pending').length },
    { key: 'approved', label: 'Approved', count: tasks.filter(t => t.user_status === 'approved').length },
  ];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Tasks</h1>
          <p className="text-sm text-gray-500">Subscribe to channels and earn rewards</p>
        </div>
        <button onClick={fetchTasks} className="btn-secondary p-2 rounded-xl" title="Refresh">
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              filter === f.key ? 'bg-purple-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f.label} {f.count > 0 && <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${filter === f.key ? 'bg-white/20' : 'bg-gray-100'}`}>{f.count}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12">
          <Youtube size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="text-gray-500 font-medium">No tasks found</p>
          <p className="text-sm text-gray-400 mt-1">Check back later for new tasks</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map(task => (
            <TaskCard key={task.id} task={task} onSubmit={fetchTasks} />
          ))}
        </div>
      )}
    </Layout>
  );
}
