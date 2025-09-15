import React, { useEffect, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import GoogleMap from '../components/GoogleMap';
import LocationPicker from '../components/LocationPicker';
import Spinner from '../components/Spinner';
import api from '../lib/api';

export default function Turfs() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [filters, setFilters] = useState({
    lighting: '',
    hasGoalposts: '',
    isBookable: '',
  });

  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    name: '',
    address: '',
    lighting: false,
    hasGoalposts: false,
    isBookable: false,
    availableTimeSlots: '',
    lat: undefined,
    lng: undefined,
  });

  const loadTurfs = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      ['lighting', 'hasGoalposts', 'isBookable'].forEach((k) => {
        if (filters[k] !== '') params[k] = filters[k];
      });
      const res = await api.get('/api/turfs', { params });
      setTurfs(res.data || []);
    } catch (e) {
      setError('Failed to load turfs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTurfs(); }, []);

  const onFilter = async (e) => {
    e.preventDefault();
    await loadTurfs();
  };

  const createTurf = async (e) => {
    e.preventDefault();
    if (!form.name) return;
    setCreating(true);
    try {
      const payload = {
        name: form.name.trim(),
        location: form.address
          ? { address: form.address, lat: form.lat, lng: form.lng }
          : undefined,
        lighting: !!form.lighting,
        hasGoalposts: !!form.hasGoalposts,
        isBookable: !!form.isBookable,
        availableTimeSlots: form.availableTimeSlots
          ? form.availableTimeSlots.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await api.post('/api/turfs', payload);
      setForm({
        name: '', address: '', lighting: false, hasGoalposts: false, isBookable: false,
        availableTimeSlots: '', lat: undefined, lng: undefined,
      });
      await loadTurfs();
    } finally {
      setCreating(false);
    }
  };

  const markers = turfs
    .filter(t => t.location?.lat && t.location?.lng)
    .map(t => ({
      lat: t.location.lat,
      lng: t.location.lng,
      title: t.name,
      info: `<strong>${t.name}</strong><br/>${t.location?.address || ''}`,
    }));

  return (
    <Layout>
      <PageHeader
        title="Turfs"
        subtitle="Find suitable grounds and add new ones you know."
      />

      <Card title="Map Overview" className="mb-6">
        {loading ? (
          <div className="py-4"><Spinner label="Loading map…" /></div>
        ) : (
          <GoogleMap
            center={{ lat: -37.787, lng: 175.279 }}
            markers={markers}
            height={320}
          />
        )}
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <Card title="Filters" subtitle="Narrow down by amenities">
          <form onSubmit={onFilter} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {['lighting', 'hasGoalposts', 'isBookable'].map((k) => (
              <label key={k} className="block">
                <span className="block text-sm font-medium capitalize mb-1">{k}</span>
                <select
                  value={filters[k]}
                  onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
                  className="select"
                >
                  <option value="">Any</option>
                  <option value="true">Yes</option>
                  <option value="false">No</option>
                </select>
              </label>
            ))}
            <div className="sm:col-span-2">
              <button className="btn-brand">Apply</button>
            </div>
          </form>
        </Card>

        <Card title="Create Turf" subtitle="Add a new community ground">
          <form onSubmit={createTurf} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Name</label>
              <input
                className="input"
                placeholder="e.g., Claudelands Park 5-a-side"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Location</label>
              <LocationPicker
                value={{ address: form.address || '', lat: form.lat, lng: form.lng }}
                onChange={(loc) =>
                  setForm((f) => ({
                    ...f,
                    address: loc.address || '',
                    lat: loc.lat,
                    lng: loc.lng,
                  }))
                }
              />
            </div>

            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.lighting}
                  onChange={(e) => setForm({ ...form, lighting: e.target.checked })}
                />
                Lighting
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.hasGoalposts}
                  onChange={(e) => setForm({ ...form, hasGoalposts: e.target.checked })}
                />
                Goalposts
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.isBookable}
                  onChange={(e) => setForm({ ...form, isBookable: e.target.checked })}
                />
                Bookable
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">
                Available time slots (comma separated)
              </label>
              <input
                className="input"
                placeholder="e.g., 18:00-19:00, 19:00-20:00"
                value={form.availableTimeSlots}
                onChange={(e) => setForm({ ...form, availableTimeSlots: e.target.value })}
              />
            </div>

            <button
              disabled={creating}
              className={`btn-brand ${creating ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {creating ? 'Creating…' : 'Create Turf'}
            </button>
          </form>
        </Card>
      </div>

      <Card title="All Turfs">
        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

        {loading ? (
          <div className="py-4"><Spinner label="Loading turfs…" /></div>
        ) : turfs.length === 0 ? (
          <div className="py-6 text-sm text-subtle">No turfs found.</div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {turfs.map((t) => (
              <li key={t._id} className="py-3">
                <div className="font-medium">{t.name}</div>
                <div className="text-sm text-subtle">
                  {t.location?.address || 'No address'} · Lighting: {String(!!t.lighting)} · Goalposts: {String(!!t.hasGoalposts)} · Bookable: {String(!!t.isBookable)}
                </div>
                {t.availableTimeSlots?.length > 0 && (
                  <div className="text-xs text-subtle mt-1">
                    Slots: {t.availableTimeSlots.join(', ')}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </Layout>
  );
}