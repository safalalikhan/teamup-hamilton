import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

function MapView({ lat, lng, height = 320 }) {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  const ref = useRef(null);

  useEffect(() => {
    if (!apiKey || !lat || !lng) return;
    const ensure = () =>
      new Promise((resolve, reject) => {
        if (window.google?.maps) return resolve();
        const s = document.createElement('script');
        s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
        s.async = true;
        s.defer = true;
        s.onload = resolve;
        s.onerror = reject;
        document.head.appendChild(s);
      });

    ensure().then(() => {
      const map = new window.google.maps.Map(ref.current, {
        center: { lat, lng },
        zoom: 14,
      });
      new window.google.maps.Marker({ position: { lat, lng }, map });
    });
  }, [apiKey, lat, lng]);

  if (!lat || !lng) return null;
  return <div ref={ref} style={{ width: '100%', height, borderRadius: '0.75rem', border: '1px solid #e5e7eb' }} />;
}

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });
  const [joining, setJoining] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    let t;
    if (toast.message) t = setTimeout(() => setToast({ type: '', message: '' }), 2500);
    return () => t && clearTimeout(t);
  }, [toast]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/api/matches/${id}`);
      setMatch(res.data);
    } catch (e) {
      setError('Failed to load match');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  const userId = user?._id || user?.id;
  const creatorId = useMemo(() => {
    if (!match?.createdBy) return null;
    const val = match.createdBy;
    if (typeof val === 'string') return val;
    if (typeof val === 'object') return val._id || val.id || null;
    return null;
  }, [match?.createdBy]);
  const isPast = match?.date ? new Date(match.date).getTime() < Date.now() : false;
  const canManageMatch = Boolean(user?.role === 'admin' || (creatorId && userId && String(creatorId) === String(userId)));

  const isParticipant = useMemo(() => {
    if (!match?.players || !userId) return false;
    return match.players.some((p) => p._id === userId || p.id === userId);
  }, [match, userId]);

  const userStatus = useMemo(() => {
    if (!match?.rsvps || !userId) return null;
    const entry = match.rsvps.find((r) => {
      const val = r.user?._id || r.user?.id || r.user;
      return val && String(val) === String(userId);
    });
    if (entry?.status) return entry.status;
    if (isParticipant) return 'going';
    return null;
  }, [match?.rsvps, userId, isParticipant]);

  const rsvp = async (status) => {
    if (status === 'not_going') {
      const ok = window.confirm('Mark as not going?');
      if (!ok) return;
    }
    if ((status === 'going' && joining) || (status === 'not_going' && leaving)) return;
    if (status === 'going' && isParticipant) return;
    setJoining(status === 'going');
    setLeaving(status === 'not_going');
    try {
      await api.post(`/api/matches/${id}/rsvp`, { status });
      setToast({ type: 'success', message: status === 'not_going' ? 'Updated RSVP' : 'RSVP saved' });
      await load();
    } catch (e) {
      const msg = e?.response?.status === 409 ? 'Match is full' : 'Failed to update RSVP';
      setToast({ type: 'error', message: msg });
    } finally {
      setJoining(false);
      setLeaving(false);
    }
  };

  // Simple team split preview: alternate players into A/B
  const split = useMemo(() => {
    const list = match?.players || [];
    const teamA = [];
    const teamB = [];
    list.forEach((p, idx) => (idx % 2 === 0 ? teamA : teamB).push(p));
    return { teamA, teamB };
  }, [match]);

  return (
    <Layout>
      <Toast toast={toast} onClear={() => setToast({ type: '', message: '' })} />
      <PageHeader title="Match details" subtitle="Organise your squad and finalise logistics" />

      {loading ? (
        <div className="py-3"><Spinner /></div>
      ) : error ? (
        <div className="text-danger">{error}</div>
      ) : !match ? (
        <div className="text-muted">Match not found.</div>
      ) : (
        <div className="row g-4">
          <div className="col-12 col-xl-8">
            <Card className="shadow-sm border-0">
              <div className="d-flex flex-column flex-lg-row justify-content-between align-items-lg-center gap-3">
                <div className="flex-grow-1">
                  <h1 className="h4 fw-semibold mb-1 d-flex flex-wrap align-items-center gap-2">
                    <span>{match.turf?.name || 'Match'}</span>
                    {match.status === 'Cancelled' && (
                      <span className="badge bg-success-subtle text-success">Cancelled</span>
                    )}
                    {isPast && match.status !== 'Cancelled' && (
                      <span className="badge bg-success-subtle text-success">Completed</span>
                    )}
                  </h1>
                  <div className="text-muted small d-flex flex-wrap gap-2 align-items-center">
                    <span>{match.date ? new Date(match.date).toLocaleString() : 'Date TBD'}</span>
                    {match.turf?.location?.address && (
                      <span className="badge bg-light text-muted">{match.turf.location.address}</span>
                    )}
                    {match.location?.address && !match.turf?.location?.address && (
                      <span className="badge bg-light text-muted">{match.location.address}</span>
                    )}
                  </div>
                </div>
                <div className="d-flex flex-wrap gap-2 align-items-center" />
                <div className="d-flex flex-column gap-2 align-items-end text-end">
                  {match.spotsLeft != null && (
                    <span className="badge bg-primary-subtle text-primary align-self-end">Spots left: {match.spotsLeft}</span>
                  )}
                  <div className="d-flex flex-wrap gap-2 align-items-center justify-content-end">
                    {canManageMatch && match?.status !== 'Cancelled' && !isPast && (
                      <button
                        className="btn btn-outline-danger btn-sm flex-shrink-0"
                        onClick={async () => {
                          if (!confirm('Cancel this match? This cannot be undone.')) return;
                          try {
                            const { data } = await api.patch(`/api/matches/${id}/status`, { status: 'Cancelled' });
                            setMatch(data);
                            setToast({ type: 'success', message: 'Match cancelled' });
                          } catch {
                            setToast({ type: 'error', message: 'Failed to cancel match' });
                          }
                        }}
                      >
                        Cancel match
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {!isPast && (
                <div className="mt-3">
                  <div className="d-flex flex-column flex-sm-row align-items-stretch gap-2">
                    <button
                      onClick={() => rsvp('going')}
                      className={`btn flex-fill ${userStatus === 'going' ? 'btn-success text-white' : 'btn-outline-success bg-white'}`}
                      disabled={!userId || joining || (isParticipant && userStatus === 'going') || match.status === 'Cancelled'}
                    >
                      {joining ? 'Updating…' : 'I\'m going'}
                    </button>
                    <button
                      onClick={() => rsvp('maybe')}
                      className={`btn flex-fill ${userStatus === 'maybe' ? 'btn-warning text-white' : 'btn-outline-warning bg-white'}`}
                      disabled={!userId || match.status === 'Cancelled'}
                    >
                      Maybe
                    </button>
                    <button
                      onClick={() => rsvp('not_going')}
                      className={`btn flex-fill ${userStatus === 'not_going' ? 'btn-danger text-white' : 'btn-outline-secondary bg-white'}`}
                      disabled={!userId || leaving || match.status === 'Cancelled'}
                    >
                      {leaving ? 'Updating…' : 'Not going'}
                    </button>
                  </div>
                </div>
              )}

              {match.turf?.location?.lat && match.turf?.location?.lng && (
                <div className="mt-4">
                  <h2 className="h6 fw-semibold mb-2">Meetup location</h2>
                  <MapView
                    lat={Number(match.turf.location.lat)}
                    lng={Number(match.turf.location.lng)}
                    height={360}
                  />
                </div>
              )}

              {match.location && !match.turf?.location?.lat && (
                <div className="mt-3 small text-muted">Meeting point: {match.location.address}</div>
              )}
            </Card>
          </div>

          <div className="col-12 col-xl-4">
            <div className="row g-4">
              <div className="col-12">
                <Card title={`Roster (${match.players?.length || 0})`} className="shadow-sm border-0">
                  {(!match.players || match.players.length === 0) ? (
                    <div className="small text-muted">No players have joined yet.</div>
                  ) : (
                    <div className="scroll-area">
                    <ul className="list-group list-group-flush mb-0">
                      {match.players.map((p) => (
                        <li key={p._id} className="list-group-item d-flex flex-column gap-1">
                          <div className="fw-semibold">{p.name || p.email}</div>
                          <div className="small text-muted">{p.email}</div>
                          {(p.skillLevel || p.preferredPosition) && (
                            <div className="small text-muted">
                              {p.skillLevel ? p.skillLevel : 'Skill level N/A'}
                              {p.preferredPosition ? ` · ${p.preferredPosition}` : ''}
                            </div>
                          )}
                        </li>
                      ))}
                    </ul>
                    </div>
                  )}
                </Card>
              </div>
              <div className="col-12">
                <Card title="Team preview" className="shadow-sm border-0">
                  <div className="row g-3">
                    <div className="col-6">
                      <div className="fw-semibold mb-2">Team A</div>
                      <ul className="ps-3 small mb-0">
                        {split.teamA.length ? split.teamA.map((p) => (
                          <li key={p._id}>{p.name || p.email}</li>
                        )) : <li>No players yet</li>}
                      </ul>
                    </div>
                    <div className="col-6">
                      <div className="fw-semibold mb-2">Team B</div>
                      <ul className="ps-3 small mb-0">
                        {split.teamB.length ? split.teamB.map((p) => (
                          <li key={p._id}>{p.name || p.email}</li>
                        )) : <li>No players yet</li>}
                      </ul>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
