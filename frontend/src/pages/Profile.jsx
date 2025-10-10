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
          <div className="py-3"><Spinner /></div>
        ) : (
          <form onSubmit={onSave}>
            {error && (
              <div className="alert alert-danger" role="alert">{error}</div>
            )}

            {/* Details and map side by side */}
            <div className="row g-4">
              <div className="col-lg-6">
                <div className="row g-3">
                  <div className="col-12">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      value={form.name}
                      onChange={(e) => updateField('name', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Email</label>
                    <input
                      className="form-control"
                      value={form.email}
                      onChange={(e) => updateField('email', e.target.value)}
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Skill level</label>
                    <select
                      className="form-select"
                      value={form.skillLevel}
                      onChange={(e) => updateField('skillLevel', e.target.value)}
                    >
                      {LEVELS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="col-12">
                    <label className="form-label">Preferred position</label>
                    <select
                      className="form-select"
                      value={form.preferredPosition}
                      onChange={(e) => updateField('preferredPosition', e.target.value)}
                    >
                      {POSITIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="col-lg-6">
                <label className="form-label">Location</label>
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
                  height={320}
                />
              </div>
            </div>

            <div className="mt-4">
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h2 className="h6 fw-semibold mb-0">Weekly availability</h2>
                <button
                  type="button"
                  onClick={addSlot}
                  className="btn btn-primary btn-sm"
                >
                  Add slot
                </button>
              </div>

              <div className="d-flex flex-column gap-2">
                {form.availability?.map((slot, idx) => (
                  <div key={idx} className="row g-2 align-items-center">
                    <div className="col-sm">
                      <select
                        className="form-select"
                        value={slot.day}
                        onChange={(e) => updateSlot(idx, 'day', e.target.value)}
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-sm">
                      <input
                        type="time"
                        className="form-control"
                        value={slot.startTime}
                        onChange={(e) => updateSlot(idx, 'startTime', e.target.value)}
                      />
                    </div>
                    <div className="col-auto text-muted">to</div>
                    <div className="col-sm">
                      <input
                        type="time"
                        className="form-control"
                        value={slot.endTime}
                        onChange={(e) => updateSlot(idx, 'endTime', e.target.value)}
                      />
                    </div>
                    <div className="col-auto">
                      <button
                        type="button"
                        onClick={() => removeSlot(idx)}
                        className="btn btn-link text-danger p-0"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                {!form.availability || form.availability.length === 0 ? (
                  <div className="small text-muted">No availability set. Add a slot above.</div>
                ) : null}
              </div>
            </div>

            <div className="d-flex align-items-center gap-2 mt-3">
              <button
                disabled={saving}
                className={`btn btn-primary ${saving ? 'disabled' : ''}`}
              >
                {saving ? 'Saving…' : 'Save profile'}
              </button>
              <button type="button" onClick={load} className="btn btn-outline-secondary">Reset</button>
            </div>
          </form>
        )}
      </Card>
    </Layout>
  );
}
