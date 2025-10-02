import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';
import { useAuth } from '../context/AuthContext';

function MapView({ lat, lng, height = 240 }) {
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

  const isParticipant = useMemo(() => {
    if (!match?.players || !userId) return false;
    return match.players.some((p) => p._id === userId || p.id === userId);
  }, [match, userId]);

  const join = async () => {
    if (joining || isParticipant) return;
    setJoining(true);
    try {
      await api.post(`/api/matches/${id}/join`);
      setToast({ type: 'success', message: 'Joined match' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Failed to join' });
    } finally {
      setJoining(false);
    }
  };

  const leave = async () => {
    if (leaving || !isParticipant) return;
    setLeaving(true);
    try {
      await api.post(`/api/matches/${id}/leave`);
      setToast({ type: 'success', message: 'Left match' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Failed to leave' });
    } finally {
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
      <PageHeader title="Match details" />

      {loading ? (
        <div className="py-3"><Spinner /></div>
      ) : error ? (
        <div className="text-danger">{error}</div>
      ) : !match ? (
        <div className="text-muted">Match not found.</div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-6">
            <Card>
              <div>
                <h1 className="h4 fw-semibold mb-1">{match.turf?.name || 'Match'}</h1>
                <div className="text-muted small">
                  {match.date ? new Date(match.date).toLocaleString() : 'Date TBD'}
                </div>
                {match.turf?.name && (
                  <div className="small text-muted mt-1">
                    Turf: {match.turf.name}
                    {match.turf?.location?.address ? ` — ${match.turf.location.address}` : ''}
                  </div>
                )}

                <div className="mt-3 d-flex flex-wrap gap-2">
                  <button
                    onClick={join}
                    className="btn btn-primary"
                    disabled={!userId || joining || isParticipant}
                  >
                    {joining ? 'Joining...' : 'Join'}
                  </button>
                  <button
                    onClick={leave}
                    className="btn btn-outline-secondary"
                    disabled={!userId || leaving || !isParticipant}
                  >
                    {leaving ? 'Leaving...' : 'Leave'}
                  </button>
                </div>

                {match.turf?.location?.lat && match.turf?.location?.lng && (
                  <div className="mt-3">
                    <MapView
                      lat={Number(match.turf.location.lat)}
                      lng={Number(match.turf.location.lng)}
                    />
                  </div>
                )}
              </div>
            </Card>
          </div>

          <div className="col-lg-6">
            <div className="row g-4">
              <div className="col-md-6">
                <Card title={`Players (${match.players?.length || 0})`}>
                  {(!match.players || match.players.length === 0) ? (
                    <div className="small text-muted">No players yet.</div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {match.players.map((p) => (
                        <li key={p._id} className="list-group-item">
                          <div className="fw-semibold">{p.name || p.email}</div>
                          <div className="small text-muted">{p.email}</div>
                          <div className="small text-muted">
                            {p.skillLevel} · {p.preferredPosition}
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </Card>
              </div>
              <div className="col-md-6">
                <Card title="Team split (preview)">
                  <div className="row g-3 small">
                    <div className="col-6">
                      <div className="fw-semibold mb-2">Team A</div>
                      <ul className="ps-3">
                        {split.teamA.map((p) => (
                          <li key={p._id}>{p.name || p.email}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="col-6">
                      <div className="fw-semibold mb-2">Team B</div>
                      <ul className="ps-3">
                        {split.teamB.map((p) => (
                          <li key={p._id}>{p.name || p.email}</li>
                        ))}
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
