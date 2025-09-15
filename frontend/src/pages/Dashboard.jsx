import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', turf: '' });
  const [turfs, setTurfs] = useState([]);

  const loadMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/matches');
      setMatches(res.data || []);
    } catch (e) {
      setError('Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
    api.get('/api/turfs').then((res) => setTurfs(res.data || [])).catch(() => setTurfs([]));
  }, []);

  const join = async (id) => {
    await api.post(`/api/matches/${id}/join`);
    await loadMatches();
  };

  const leave = async (id) => {
    await api.post(`/api/matches/${id}/leave`);
    await loadMatches();
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    setCreating(true);
    try {
      await api.post('/api/matches', { date: form.date, time: form.time || undefined, turf: form.turf || undefined });
      setForm({ date: '', time: '', turf: '' });
      await loadMatches();
    } finally {
      setCreating(false);
    }
  };

  return (
    <Layout>
      <PageHeader title="Dashboard" />

        <Card title="Create Match">
          <form onSubmit={create} className="flex flex-col sm:flex-row gap-3">
            <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input sm:w-auto" />
            <input type="text" placeholder="Time (optional)" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="input sm:w-auto" />
            <select value={form.turf} onChange={(e) => setForm({ ...form, turf: e.target.value })} className="select sm:w-auto">
              <option value="">Select turf (optional)</option>
              {turfs.map((t) => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
            <button disabled={creating} className={`btn-brand ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}>
              {creating ? 'Creating...' : 'Create'}
            </button>
          </form>
        </Card>

        <Card title="Upcoming Matches" subtitle="Join an open game or create one above.">
          {error && <div className="text-red-400 text-sm mb-2">{error}</div>}
          <ul className="divide-y">
            {matches.map((m) => (
              <li key={m._id} className="py-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{new Date(m.date).toLocaleString()}</div>
                  <div className="text-sm text-gray-600">Players: {m.players?.length || 0}</div>
                </div>
                <div className="flex gap-2">
                  <Link to={`/matches/${m._id}`} className="btn-brand text-sm px-3 py-1">View</Link>
                  <button onClick={() => join(m._id)} className="btn-brand text-sm px-3 py-1">Join</button>
                  <button onClick={() => leave(m._id)} className="text-sm px-3 py-1 rounded bg-gray-200 hover:bg-gray-300">Leave</button>
                </div>
              </li>
            ))}
            {!loading && matches.length === 0 && (
              <li className="py-6 text-gray-500 text-sm">No matches yet. Create one above.</li>
            )}
          </ul>
        </Card>
    </Layout>
  );
}
