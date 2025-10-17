import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LocationPicker from '../components/LocationPicker';

export default function Dashboard() {
  const [matches, setMatches] = useState([]);
  const [pastMatches, setPastMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    date: '',
    time: '',
    turf: '',
    capacity: '',
    locationAddress: '',
    lat: null,
    lng: null,
  });
  const [turfs, setTurfs] = useState([]);
  const [radiusKm, setRadiusKm] = useState(5);
  const [loadingTurfs, setLoadingTurfs] = useState(false);
  const [pending, setPending] = useState({ id: null, action: null });
  const [cursor, setCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const { user } = useAuth();

  const userId = useMemo(() => user?._id || user?.id || null, [user]);

  const LIMIT = 20;

  const loadMatches = async (append = false) => {
    if (append) setLoadingMore(true); else setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      params.set('limit', String(LIMIT));
      if (append && cursor) params.set('cursor', cursor);
      const res = await api.get(`/api/matches?${params.toString()}`);
      const list = Array.isArray(res.data) ? res.data : [];
      const now = Date.now();
      if (append) {
        const upAdd = list.filter((m) => new Date(m.date).getTime() >= now);
        const pastAdd = list.filter((m) => new Date(m.date).getTime() < now);
        const byId = (arr) => {
          const seen = new Set();
          const out = [];
          for (const it of arr) { const id = it._id || it.id; if (!seen.has(id)) { seen.add(id); out.push(it); } }
          return out;
        };
        setMatches((prev) => byId([...prev, ...upAdd]));
        setPastMatches((prev) => byId([...prev, ...pastAdd]));
      } else {
        setMatches(list.filter((m) => new Date(m.date).getTime() >= now));
        setPastMatches(list.filter((m) => new Date(m.date).getTime() < now));
      }
      if (list.length > 0) {
        const last = list[list.length - 1];
        if (last?.date) setCursor(new Date(last.date).toISOString());
      }
      setHasMore(list.length === LIMIT);
    } catch (e) {
      setError('Failed to load matches');
    } finally {
      if (append) setLoadingMore(false); else setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const fetchTurfs = useCallback(async () => {
    setLoadingTurfs(true);
    try {
      const params = {};
      if (form.lat != null && form.lng != null) {
        params.lat = form.lat;
        params.lng = form.lng;
        params.radiusKm = radiusKm;
      }
      const res = await api.get('/api/turfs', { params });
      setTurfs(res.data || []);
    } catch {
      setTurfs([]);
    } finally {
      setLoadingTurfs(false);
    }
  }, [form.lat, form.lng, radiusKm]);

  useEffect(() => {
    fetchTurfs();
  }, [fetchTurfs]);

  useEffect(() => {
    const onScroll = () => {
      if (!hasMore || loading || loadingMore) return;
      const threshold = 200; // px from bottom
      const scrolled = window.innerHeight + window.scrollY;
      const height = document.body.offsetHeight;
      if (scrolled >= height - threshold) {
        loadMatches(true);
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [hasMore, loading, loadingMore, cursor]);

  const isParticipant = useCallback((match) => {
    if (!userId) return false;
    return (match.players || []).some((p) => (p._id || p.id) === userId);
  }, [userId]);

  const getUserStatus = useCallback((match) => {
    if (!userId) return null;
    const rsvps = Array.isArray(match.rsvps) ? match.rsvps : [];
    const entry = rsvps.find((r) => {
      const val = r.user?._id || r.user?.id || r.user;
      return val && String(val) === String(userId);
    });
    if (entry?.status) return entry.status;
    if (isParticipant(match)) return 'going';
    return null;
  }, [userId, isParticipant]);

  const rsvp = async (id, status) => {
    if (!userId) return;
    if (status === 'not_going') {
      const ok = window.confirm('Mark as not going?');
      if (!ok) return;
    }
    setPending({ id, action: status });
    try {
      await api.post(`/api/matches/${id}/rsvp`, { status });
      await loadMatches();
    } catch (e) {
      if (e?.response?.status === 409) {
        setError('Match is full');
      } else {
        setError('Unable to update RSVP. Please try again.');
      }
      setTimeout(() => setError(''), 2500);
    } finally {
      setPending({ id: null, action: null });
    }
  };

  const create = async (e) => {
    e.preventDefault();
    if (!form.date) return;
    setCreating(true);
    try {
      const payload = { date: form.date, time: form.time || undefined, turf: form.turf || undefined };
      const capNum = Number(form.capacity);
      if (!Number.isNaN(capNum) && capNum > 0) payload.capacity = capNum;
      if (form.lat != null && form.lng != null) {
        payload.location = {
          address: form.locationAddress || undefined,
          lat: form.lat,
          lng: form.lng,
        };
      }
      await api.post('/api/matches', payload);
      setForm({
        date: '',
        time: '',
        turf: '',
        capacity: '',
        locationAddress: '',
        lat: null,
        lng: null,
      });
      await loadMatches();
      setRadiusKm(5);
    } finally {
      setCreating(false);
    }
  };

  const nowTs = Date.now();
  const allById = React.useMemo(() => {
    const map = new Map();
    [...matches, ...pastMatches].forEach((m) => map.set(m._id || m.id, m));
    return Array.from(map.values());
  }, [matches, pastMatches]);
  const cancelledMatches = React.useMemo(
    () => allById.filter((m) => String(m.status) === 'Cancelled'),
    [allById]
  );
  const purePastMatches = React.useMemo(
    () => pastMatches.filter((m) => String(m.status) !== 'Cancelled'),
    [pastMatches]
  );
  const pastCount = purePastMatches.length;
  const cancelledCount = cancelledMatches.length;

  return (
    <Layout>
      <PageHeader title="Dashboard" />

        <Card title="Upcoming Matches" subtitle="Join an open game or create one below." className="mb-4">
          {error && <div className="text-danger small mb-2">{error}</div>}
          {loading && <div className="py-2 d-flex justify-content-center"><Spinner label="Loading matches…" /></div>}
          <div className="scroll-area">
          <ul className="list-group list-group-flush mb-0">
            {matches.map((m) => {
              const joined = isParticipant(m);
              const userStatus = getUserStatus(m);
              const statusLabel = userStatus === 'going'
                ? 'Going'
                : userStatus === 'maybe'
                  ? 'Maybe'
                  : userStatus === 'not_going'
                    ? 'Not going'
                    : '';
              const isPending = pending.id === m._id;
              const isToday = !!m.isToday;
              const spotsLeft = m.spotsLeft ?? null;
              const turfLabel = m.turf?.name ? `@ ${m.turf.name}` : '';
              return (
                <li key={m._id} className={`list-group-item py-3 ${isToday ? 'match-today' : ''}`}>
                  <div className="d-flex flex-column flex-lg-row align-items-lg-center gap-3">
                    <div className="flex-grow-1">
                      <div className="d-flex flex-wrap align-items-center gap-2 fw-semibold">
                        <span>{new Date(m.date).toLocaleString()}</span>
                        {turfLabel && <span className="badge bg-light text-muted">{turfLabel}</span>}
                        {isToday && <span className="badge bg-success-subtle text-success">Today</span>}
                        {m.status === 'Cancelled' && <span className="badge bg-success-subtle text-success">Cancelled</span>}
                      </div>
                      <div className="small text-muted mt-1 d-flex flex-wrap gap-2 align-items-center">
                        <span>{statusLabel || 'No RSVP yet'}</span>
                        {spotsLeft != null && (
                          <span className="badge bg-light text-muted">Spots left: {spotsLeft}</span>
                        )}
                      </div>
                    </div>
                    <div className="d-flex flex-column flex-sm-row align-items-stretch align-items-sm-center gap-2 flex-shrink-0">
                      <Link to={`/matches/${m._id}`} className="btn btn-outline-secondary flex-fill flex-sm-auto">View details</Link>
                      <div className="btn-group" role="group" aria-label="RSVP">
                        <button
                          onClick={() => rsvp(m._id, 'going')}
                          className={`btn ${userStatus === 'going' ? 'btn-success text-white' : 'btn-outline-secondary bg-white'}`}
                          disabled={!userId || (isPending && pending.action === 'going') || (joined && userStatus === 'going') || spotsLeft === 0 || m.status === 'Cancelled'}
                          aria-disabled={!userId || spotsLeft === 0 || m.status === 'Cancelled'}
                          title={!userId ? 'Sign in to RSVP' : m.status === 'Cancelled' ? 'Match cancelled' : spotsLeft === 0 ? 'Match is full' : 'RSVP Going'}
                        >{isPending && pending.action === 'going' ? '…' : 'Going'}</button>
                        <button
                          onClick={() => rsvp(m._id, 'maybe')}
                          className={`btn ${userStatus === 'maybe' ? 'btn-warning text-white' : 'btn-outline-secondary bg-white'}`}
                          disabled={!userId || (isPending && pending.action === 'maybe') || m.status === 'Cancelled'}
                          aria-disabled={!userId || m.status === 'Cancelled'}
                          title={!userId ? 'Sign in to RSVP' : m.status === 'Cancelled' ? 'Match cancelled' : 'RSVP Maybe'}
                        >{isPending && pending.action === 'maybe' ? '…' : 'Maybe'}</button>
                        <button
                          onClick={() => rsvp(m._id, 'not_going')}
                          className={`btn ${userStatus === 'not_going' ? 'btn-danger text-white' : 'btn-outline-secondary bg-white'}`}
                          disabled={!userId || (isPending && pending.action === 'not_going') || m.status === 'Cancelled'}
                          aria-disabled={!userId || m.status === 'Cancelled'}
                          title={!userId ? 'Sign in to RSVP' : m.status === 'Cancelled' ? 'Match cancelled' : 'RSVP Not going'}
                        >{isPending && pending.action === 'not_going' ? '…' : 'Not going'}</button>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
            {!loading && matches.length === 0 && (
              <li className="list-group-item text-muted small">No upcoming matches. Create one below.</li>
            )}
          </ul>
          </div>
        </Card>

        <Card title="Create Match" className="mb-4">
          <form onSubmit={create} className="row g-3">
            <div className="col-12 col-md-4">
              <label className="form-label">Kick-off</label>
              <input
                type="datetime-local"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Time label (optional)</label>
              <input
                type="text"
                placeholder="e.g., Evening session"
                value={form.time}
                onChange={(e) => setForm({ ...form, time: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="col-12">
              <label className="form-label">Match location</label>
              <LocationPicker
                value={{
                  address: form.locationAddress || '',
                  lat: form.lat ?? undefined,
                  lng: form.lng ?? undefined,
                }}
                onChange={(loc) =>
                  setForm((prev) => ({
                    ...prev,
                    locationAddress: loc.address || '',
                    lat: loc.lat ?? null,
                    lng: loc.lng ?? null,
                  }))
                }
              />
              <div className="form-text">Drop a pin where players should meet; nearby turfs will auto-populate below.</div>
            </div>
            <div className="col-12 col-md-3">
              <label className="form-label">Show turfs within</label>
              <select
                value={String(radiusKm)}
                onChange={(e) => setRadiusKm(Number(e.target.value))}
                className="form-select"
                disabled={loadingTurfs || form.lat == null || form.lng == null}
              >
                {[5, 10, 20].map((km) => (
                  <option key={km} value={km}>{km} km</option>
                ))}
              </select>
            </div>
            <div className="col-12 col-md-5">
              <label className="form-label">Nearby turfs (optional)</label>
              <select
                value={form.turf}
                onChange={(e) => setForm({ ...form, turf: e.target.value })}
                className="form-select"
                disabled={loadingTurfs}
              >
                <option value="">Select turf</option>
                {turfs.map((t) => (
                  <option key={t._id} value={t._id}>
                    {t.name}{typeof t.distanceKm === 'number' ? ` (${t.distanceKm} km)` : ''}
                  </option>
                ))}
              </select>
              {loadingTurfs ? (
                <div className="form-text text-muted">Searching for turfs…</div>
              ) : (!form.lat || !form.lng) ? (
                <div className="form-text text-muted">Pick a location above to tailor the list.</div>
              ) : turfs.length === 0 ? (
                <div className="form-text text-muted">No turfs found within {radiusKm} km.</div>
              ) : null}
            </div>
            <div className="col-12 col-md-2">
              <label className="form-label">Capacity</label>
              <input
                type="number"
                min="1"
                className="form-control"
                placeholder="e.g., 12"
                value={form.capacity}
                onChange={(e) => setForm({ ...form, capacity: e.target.value })}
              />
              <div className="form-text">Leave blank for unlimited spots.</div>
            </div>
            <div className="col-12 col-md-2 d-flex align-items-end">
              <button disabled={creating} className={`btn btn-primary w-100 ${creating ? 'disabled' : ''}`}>
                {creating ? 'Creating…' : 'Create match'}
              </button>
            </div>
          </form>
        </Card>

        <div className="row g-5 mt-3">
          <div className="col-12 col-xl-6">
            <Card title={`Past Matches (${pastCount})`} subtitle="Browse results and revisit previous games">
              <div className="scroll-area scroll-area--tall">
                <ul className="list-group list-group-flush mb-0">
                  {purePastMatches.map((m) => (
                    <li key={m._id} className="list-group-item">
                      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                        <div className="me-md-3">
                          <div className="fw-semibold">{new Date(m.date).toLocaleString()}</div>
                          {m.turf?.name && <div className="small text-muted">@ {m.turf.name}</div>}
                        </div>
                        <div className="d-flex flex-wrap gap-2 small text-muted align-items-center">
                          <span className="badge bg-secondary-subtle text-secondary">Completed</span>
                          {m.turf?.location?.address && <span className="badge bg-light text-muted">{m.turf.location.address}</span>}
                          <span className="badge bg-light text-muted">{m.players?.length || 0} players</span>
                        </div>
                        <Link to={`/matches/${m._id}`} className="btn btn-outline-primary btn-sm ms-md-auto">View recap</Link>
                      </div>
                    </li>
                  ))}
                  {!loading && purePastMatches.length === 0 && (
                    <li className="list-group-item text-muted small">No past matches yet.</li>
                  )}
                </ul>
              </div>
            </Card>
          </div>
          <div className="col-12 col-xl-6">
            <Card title={`Cancelled Matches (${cancelledCount})`} subtitle="Matches cancelled by organiser">
              <div className="scroll-area scroll-area--tall">
                <ul className="list-group list-group-flush mb-0">
                  {cancelledMatches.map((m) => (
                    <li key={m._id} className="list-group-item">
                      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2">
                        <div className="me-md-3">
                          <div className="fw-semibold">{new Date(m.date).toLocaleString()}</div>
                          {m.turf?.name && <div className="small text-muted">@ {m.turf.name}</div>}
                        </div>
                        <div className="d-flex flex-wrap gap-2 small text-muted align-items-center">
                          <span className="badge bg-success-subtle text-success">Cancelled</span>
                          {m.turf?.location?.address && <span className="badge bg-light text-muted">{m.turf.location.address}</span>}
                        </div>
                        <Link to={`/matches/${m._id}`} className="btn btn-outline-secondary btn-sm ms-md-auto">Details</Link>
                      </div>
                    </li>
                  ))}
                  {!loading && cancelledMatches.length === 0 && (
                    <li className="list-group-item text-muted small">No cancelled matches.</li>
                  )}
                </ul>
              </div>
            </Card>
          </div>
        </div>
    </Layout>
  );
}
