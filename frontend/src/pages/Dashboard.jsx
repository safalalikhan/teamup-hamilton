import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', turf: '' });
  const [turfs, setTurfs] = useState([]);
  const [pending, setPending] = useState({ id: null, action: null });
  const { user } = useAuth();

  const userId = useMemo(() => user?._id || user?.id || null, [user]);

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

  const isParticipant = useCallback((match) => {
    if (!userId) return false;
    return (match.players || []).some((p) => (p._id || p.id) === userId);
  }, [userId]);

  const join = async (id) => {
    if (!userId) return;
    setPending({ id, action: 'join' });
    try {
      await api.post(`/api/matches/${id}/join`);
      await loadMatches();
    } finally {
      setPending({ id: null, action: null });
    }
  };

  const leave = async (id) => {
    if (!userId) return;
    setPending({ id, action: 'leave' });
    try {
      await api.post(`/api/matches/${id}/leave`);
      await loadMatches();
    } finally {
      setPending({ id: null, action: null });
    }
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
          <form onSubmit={create} className="row g-2 align-items-center">
            <div className="col-12 col-sm-auto">
              <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="form-control" />
            </div>
            <div className="col-12 col-sm-auto">
              <input type="text" placeholder="Time (optional)" value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="form-control" />
            </div>
            <div className="col-12 col-sm-auto">
              <select value={form.turf} onChange={(e) => setForm({ ...form, turf: e.target.value })} className="form-select">
                <option value="">Select turf (optional)</option>
                {turfs.map((t) => (
                  <option key={t._id} value={t._id}>{t.name}</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-sm-auto">
              <button disabled={creating} className={`btn btn-primary ${creating ? 'disabled' : ''}`}>
                {creating ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        </Card>

        <Card title="Upcoming Matches" subtitle="Join an open game or create one above.">
          {error && <div className="text-danger small mb-2">{error}</div>}
          <ul className="list-group list-group-flush">
            {matches.map((m) => {
              const joined = isParticipant(m);
              const isPending = pending.id === m._id;

              return (
                <li key={m._id} className="list-group-item d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-semibold">{new Date(m.date).toLocaleString()}</div>
                    <div className="small text-muted">Players: {m.players?.length || 0}</div>
                  </div>
                  <div className="d-flex gap-2">
                    <Link to={`/matches/${m._id}`} className="btn btn-primary btn-sm">View</Link>
                    <button
                      onClick={() => join(m._id)}
                      className="btn btn-primary btn-sm"
                      disabled={!userId || joined || (isPending && pending.action === 'join')}
                    >
                      {isPending && pending.action === 'join' ? 'Joining…' : 'Join'}
                    </button>
                    <button
                      onClick={() => leave(m._id)}
                      className="btn btn-outline-secondary btn-sm"
                      disabled={!userId || !joined || (isPending && pending.action === 'leave')}
                    >
                      {isPending && pending.action === 'leave' ? 'Leaving…' : 'Leave'}
                    </button>
                  </div>
                </li>
              );
            })}
            {!loading && matches.length === 0 && (
              <li className="list-group-item text-muted small">No matches yet. Create one above.</li>
            )}
          </ul>
        </Card>
    </Layout>
  );
}
