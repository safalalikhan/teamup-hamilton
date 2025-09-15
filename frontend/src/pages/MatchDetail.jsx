import React, { useEffect, useMemo, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

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
  return <div ref={ref} style={{ width: '100%', height }} className="rounded-2xl border border-gray-200" />;
}

export default function MatchDetail() {
  const { id } = useParams();
  const [match, setMatch] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });

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

  const join = async () => {
    try {
      await api.post(`/api/matches/${id}/join`);
      setToast({ type: 'success', message: 'Joined match' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Failed to join' });
    }
  };

  const leave = async () => {
    try {
      await api.post(`/api/matches/${id}/leave`);
      setToast({ type: 'success', message: 'Left match' });
      await load();
    } catch {
      setToast({ type: 'error', message: 'Failed to leave' });
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
        <div className="py-6"><Spinner /></div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : !match ? (
        <div className="text-subtle">Match not found.</div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-6">
          <Card>
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold">{match.turf?.name || 'Match'}</h1>
              <div className="text-subtle">
                {match.date ? new Date(match.date).toLocaleString() : 'Date TBD'}
              </div>
              {match.turf?.name && (
                <div className="text-sm text-subtle">
                  Turf: {match.turf.name}
                  {match.turf?.location?.address ? ` — ${match.turf.location.address}` : ''}
                </div>
              )}

              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={join} className="btn-brand">Join</button>
                <button onClick={leave} className="btn btn-outline-brand">Leave</button>
              </div>

              {match.turf?.location?.lat && match.turf?.location?.lng && (
                <div className="mt-4">
                  <MapView
                    lat={Number(match.turf.location.lat)}
                    lng={Number(match.turf.location.lng)}
                  />
                </div>
              )}
            </div>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <Card title={`Players (${match.players?.length || 0})`}>
              {(!match.players || match.players.length === 0) ? (
                <div className="text-sm text-subtle">No players yet.</div>
              ) : (
                <ul className="text-sm divide-y divide-gray-200">
                  {match.players.map((p) => (
                    <li key={p._id} className="py-2">
                      <div className="font-medium">{p.name || p.email}</div>
                      <div className="text-subtle">{p.email}</div>
                      <div className="text-subtle">
                        {p.skillLevel} · {p.preferredPosition}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card title="Team split (preview)">
              <div className="grid grid-cols-2 gap-6 text-sm">
                <div>
                  <div className="font-medium mb-2">Team A</div>
                  <ul className="list-disc ml-5 space-y-1">
                    {split.teamA.map((p) => (
                      <li key={p._id}>{p.name || p.email}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="font-medium mb-2">Team B</div>
                  <ul className="list-disc ml-5 space-y-1">
                    {split.teamB.map((p) => (
                      <li key={p._id}>{p.name || p.email}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </Layout>
  );
}