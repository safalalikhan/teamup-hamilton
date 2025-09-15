import React, { useEffect, useMemo, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import api from '../lib/api';
import LocationPicker from '../components/LocationPicker';
import Toast from '../components/Toast';
import Spinner from '../components/Spinner';

const LEVELS = [
  { label: 'Beginner', value: 'beginner' },
  { label: 'Intermediate', value: 'intermediate' },
  { label: 'Advanced', value: 'proficient' },
];

const POSITIONS = [
  { label: 'No Preference', value: 'noPreference' },
  { label: 'Goalkeeper', value: 'goalKeeper' },
  { label: 'Defender', value: 'defence' },
  { label: 'Midfielder', value: 'midField' },
  { label: 'Forward', value: 'attack' },
];

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ type: '', message: '' });

  const [form, setForm] = useState({
    name: '',
    email: '',
    skillLevel: 'beginner',
    preferredPosition: 'noPreference',
    locationAddress: '',
    lat: '',
    lng: '',
    availability: [],
  });

  useEffect(() => {
    let t;
    if (toast.message) t = setTimeout(() => setToast({ type: '', message: '' }), 2500);
    return () => t && clearTimeout(t);
  }, [toast]);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get('/api/user');
      const u = res.data || {};
      setForm({
        name: u.name || '',
        email: u.email || '',
        skillLevel: u.skillLevel || 'beginner',
        preferredPosition: u.preferredPosition || 'noPreference',
        locationAddress: u.location?.address || '',
        lat: u.location?.lat || '',
        lng: u.location?.lng || '',
        availability: Array.isArray(u.availability) ? u.availability : [],
      });
    } catch (e) {
      setError('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const updateField = (name, value) => setForm((f) => ({ ...f, [name]: value }));

  const addSlot = () => {
    setForm((f) => ({
      ...f,
      availability: [...(f.availability || []), { day: 'Saturday', startTime: '10:00', endTime: '12:00' }],
    }));
  };

  const updateSlot = (idx, key, value) => {
    setForm((f) => {
      const next = [...f.availability];
      next[idx] = { ...next[idx], [key]: value };
      return { ...f, availability: next };
    });
  };

  const removeSlot = (idx) => {
    setForm((f) => ({ ...f, availability: f.availability.filter((_, i) => i !== idx) }));
  };

  const canSave = useMemo(() => form.name && form.email, [form.name, form.email]);

  const onSave = async (e) => {
    e.preventDefault();
    if (!canSave) {
      setToast({ type: 'error', message: 'Name and email are required' });
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = {
        name: form.name,
        email: form.email,
        skillLevel: form.skillLevel,
        preferredPosition: form.preferredPosition,
        location: form.locationAddress ? {
          address: form.locationAddress,
          lat: form.lat ? Number(form.lat) : undefined,
          lng: form.lng ? Number(form.lng) : undefined,
        } : undefined,
        availability: form.availability,
      };
      await api.put('/api/user', payload);
      setToast({ type: 'success', message: 'Profile saved' });
      await load();
    } catch (e) {
      setError('Failed to save');
      setToast({ type: 'error', message: 'Failed to save profile' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <Toast toast={toast} onClear={() => setToast({ type: '', message: '' })} />
      <PageHeader title="My Profile" subtitle="Update your details and availability" />

      <Card>
        {loading ? (
          <div className="py-6"><Spinner /></div>
        ) : (
          <form onSubmit={onSave} className="space-y-6">
            {error && (
              <div className="w-full rounded-lg bg-red-50 text-red-800 border border-red-200 px-3 py-2 text-sm">
                {error}
              </div>
            )}

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  className="input"
                  value={form.name}
                  onChange={(e) => updateField('name', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  className="input"
                  value={form.email}
                  onChange={(e) => updateField('email', e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Skill level</label>
                <select
                  className="select"
                  value={form.skillLevel}
                  onChange={(e) => updateField('skillLevel', e.target.value)}
                >
                  {LEVELS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Preferred position</label>
                <select
                  className="select"
                  value={form.preferredPosition}
                  onChange={(e) => updateField('preferredPosition', e.target.value)}
                >
                  {POSITIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-1">Location</label>
                <LocationPicker
                  value={{
                    address: form.locationAddress,
                    lat: form.lat ? Number(form.lat) : undefined,
                    lng: form.lng ? Number(form.lng) : undefined
                  }}
                  onChange={(loc) =>
                    setForm((f) => ({
                      ...f,
                      locationAddress: loc.address || '',
                      lat: loc.lat || '',
                      lng: loc.lng || ''
                    }))
                  }
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-semibold">Weekly availability</h2>
                <button
                  type="button"
                  onClick={addSlot}
                  className="text-sm px-3 py-1 rounded-lg bg-brand text-white hover:bg-brand-dark"
                >
                  Add slot
                </button>
              </div>

              <div className="space-y-2">
                {form.availability?.map((slot, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr,1fr,auto,1fr,auto] gap-2 items-center">
                    <select
                      className="select"
                      value={slot.day}
                      onChange={(e) => updateSlot(idx, 'day', e.target.value)}
                    >
                      {DAYS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                    <input
                      type="time"
                      className="input"
                      value={slot.startTime}
                      onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                    />
                    <span className="text-subtle text-center">to</span>
                    <input
                      type="time"
                      className="input"
                      value={slot.endTime}
                      onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                    />
                    <button
                      type="button"
                      onClick={() => removeSlot(idx)}
                      className="text-sm text-red-600 hover:underline justify-self-start"
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!form.availability || form.availability.length === 0 ? (
                  <div className="text-sm text-subtle">No availability set. Add a slot above.</div>
                ) : null}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                disabled={saving}
                className={`btn-brand ${saving ? 'opacity-60 cursor-not-allowed' : ''}`}
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
              <button type="button" onClick={load} className="btn-outline-brand">Reset</button>
            </div>
          </form>
        )}
      </Card>
    </Layout>
  );
}