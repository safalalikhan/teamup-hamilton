import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);
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
      const list = Array.isArray(res.data) ? res.data : [];
      const now = Date.now();
      setMatches(list.filter((m) => new Date(m.date).getTime() >= now));
      setPastMatches(list.filter((m) => new Date(m.date).getTime() < now));
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

  const rsvp = async (id, status) => {
    if (!userId) return;
    setPending({ id, action: status });
    try {
      await api.post(`/api/matches/${id}/rsvp`, { status });
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
              const isToday = !!m.isToday;
              const spotsLeft = m.spotsLeft ?? null;
              return (
                <li key={m._id} className={`list-group-item d-flex align-items-center justify-content-between ${isToday ? 'match-today' : ''}`}>
                  <div>
                    <div className="fw-semibold d-flex align-items-center gap-2">
                      <span>{new Date(m.date).toLocaleString()}</span>
                      {isToday && <span className="badge bg-success-subtle text-success">Today</span>}
                    </div>
                    <div className="small text-muted">Players: {m.players?.length || 0}{spotsLeft != null && ` · Spots left: ${spotsLeft}`}</div>
                  </div>
                  <div className="d-flex gap-1">
                    <Link to={`/matches/${m._id}`} className="btn btn-outline-secondary btn-sm">View</Link>
                    <div className="btn-group btn-group-sm" role="group" aria-label="RSVP">
                      <button
                        onClick={() => rsvp(m._id, 'going')}
                        className={`btn btn-primary btn-sm ${joined ? '' : 'btn-outline-primary'}`}
                        disabled={!userId || (isPending && pending.action === 'going')}
                        title={joined ? 'You are going' : 'RSVP Going'}
                      >{isPending && pending.action === 'going' ? '...' : 'Going'}</button>
                      <button
                        onClick={() => rsvp(m._id, 'maybe')}
                        className="btn btn-outline-secondary btn-sm"
                        disabled={!userId || (isPending && pending.action === 'maybe')}
                        title="RSVP Maybe"
                      >{isPending && pending.action === 'maybe' ? '...' : 'Maybe'}</button>
                      <button
                        onClick={() => rsvp(m._id, 'not_going')}
                        className="btn btn-outline-secondary btn-sm"
                        disabled={!userId || (isPending && pending.action === 'not_going')}
                        title="RSVP Not going"
                      >{isPending && pending.action === 'not_going' ? '...' : 'Not going'}</button>
                    </div>
                  </div>
                </li>
              );
            })}
            {!loading && matches.length === 0 && (
              <li className="list-group-item text-muted small">No upcoming matches. Create one above.</li>
            )}
          </ul>
        </Card>

        {/* Past matches section */}
        <Card title="Past Matches" subtitle="Completed or older matches are archived here.">
          <details>
            <summary className="small text-muted">Show past matches ({pastMatches.length})</summary>
            <ul className="list-group list-group-flush mt-2">
              {pastMatches.map((m) => (
                <li key={m._id} className="list-group-item d-flex align-items-center justify-content-between">
                  <div>
                    <div className="fw-semibold">{new Date(m.date).toLocaleString()}</div>
                    <div className="small text-muted">Players: {m.players?.length || 0}</div>
                  </div>
                  <Link to={`/matches/${m._id}`} className="btn btn-outline-secondary btn-sm">View</Link>
                </li>
              ))}
              {!loading && pastMatches.length === 0 && (
                <li className="list-group-item text-muted small">No past matches.</li>
              )}
            </ul>
          </details>
          </Card>
    </Layout>
  );
}
