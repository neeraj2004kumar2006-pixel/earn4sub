// pages/admin/AdminTasks.jsx - Task management for Sub4Earn admin
import { useEffect, useState } from 'react';
import { Plus, Edit3, ToggleLeft, ToggleRight, Youtube, X, Check } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../../utils/api';
import Layout from '../../components/Layout';

const empty = { title: '', youtube_url: '', reward_amount: '', max_limit: 0, active: true, task_type: 'subscribe' };

export default function AdminTasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchTasks = () => {
    api.get('/admin/tasks')
      .then(res => setTasks(res.data.tasks))
      .catch(() => toast.error('Failed to load tasks'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchTasks(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title || !form.youtube_url || !form.reward_amount) return toast.error('Title, URL and reward are required');
    setSaving(true);
    try {
      if (editId) {
        await api.put(`/admin/tasks/${editId}`, form);
        toast.success('Task updated!');
      } else {
        await api.post('/admin/tasks', form);
        toast.success('Task created!');
      }
      setShowForm(false); setEditId(null); setForm(empty);
      fetchTasks();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (task) => {
    try {
      await api.put(`/admin/tasks/${task.id}`, { active: !task.active });
      toast.success(`Task ${task.active ? 'disabled' : 'enabled'}`);
      fetchTasks();
    } catch { toast.error('Update failed'); }
  };

  const startEdit = (task) => {
    setForm({ title: task.title, youtube_url: task.youtube_url, reward_amount: task.reward_amount, max_limit: task.max_limit, active: !!task.active, task_type: task.task_type });
    setEditId(task.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Task Management</h1>
          <p className="text-sm text-gray-500">{tasks.length} tasks total</p>
        </div>
        <button onClick={() => { setShowForm(v => !v); setEditId(null); setForm(empty); }} className="btn-primary flex items-center gap-2 text-sm">
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? 'Cancel' : 'New Task'}
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card mb-5">
          <h2 className="font-semibold text-gray-800 mb-4">{editId ? 'Edit Task' : 'Create New Task'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Task Title</label>
              <input className="input" placeholder="Subscribe to [Channel Name]" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label className="label">YouTube Channel URL</label>
              <input className="input" placeholder="https://www.youtube.com/@channel" value={form.youtube_url} onChange={e => setForm({ ...form, youtube_url: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Reward (₹)</label>
                <input className="input" type="number" min="1" step="0.01" placeholder="15" value={form.reward_amount} onChange={e => setForm({ ...form, reward_amount: e.target.value })} />
              </div>
              <div>
                <label className="label">Max Completions (0=unlimited)</label>
                <input className="input" type="number" min="0" placeholder="0" value={form.max_limit} onChange={e => setForm({ ...form, max_limit: parseInt(e.target.value) || 0 })} />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-purple-600 w-4 h-4" checked={form.active} onChange={e => setForm({ ...form, active: e.target.checked })} />
                Active (visible to users)
              </label>
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
                {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
                {editId ? 'Save Changes' : 'Create Task'}
              </button>
              <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditId(null); setForm(empty); }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-16"><span className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No tasks yet. Create one above.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tasks.map(task => (
            <div key={task.id} className={`card ${!task.active ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                    <Youtube size={16} className="text-red-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{task.title}</p>
                    <a href={task.youtube_url} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline truncate block">{task.youtube_url}</a>
                  </div>
                </div>
                <span className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-semibold ${task.active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {task.active ? 'Active' : 'Disabled'}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div className="bg-purple-50 rounded-xl py-2">
                  <p className="font-bold text-purple-700">₹{task.reward_amount}</p>
                  <p className="text-xs text-gray-400">Reward</p>
                </div>
                <div className="bg-green-50 rounded-xl py-2">
                  <p className="font-bold text-green-700">{task.approved_count || 0}</p>
                  <p className="text-xs text-gray-400">Approved</p>
                </div>
                <div className="bg-amber-50 rounded-xl py-2">
                  <p className="font-bold text-amber-700">{task.pending_count || 0}</p>
                  <p className="text-xs text-gray-400">Pending</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(task)} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 rounded-xl transition-colors">
                  <Edit3 size={13} /> Edit
                </button>
                <button onClick={() => toggleActive(task)} className={`flex-1 flex items-center justify-center gap-1.5 text-xs font-semibold py-2 rounded-xl transition-colors ${task.active ? 'bg-red-50 hover:bg-red-100 text-red-600' : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700'}`}>
                  {task.active ? <><ToggleLeft size={13} /> Disable</> : <><ToggleRight size={13} /> Enable</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}
