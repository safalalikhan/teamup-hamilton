import React, { useEffect, useRef, useState } from 'react';
import Layout from '../components/Layout';
import Card from '../components/Card';
import PageHeader from '../components/PageHeader';
import GoogleMap from '../components/GoogleMap';
import LocationPicker from '../components/LocationPicker';
import Spinner from '../components/Spinner';
import api from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function Turfs() {
  const [turfs, setTurfs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { isAdmin } = useAuth();

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
  const [locationKey, setLocationKey] = useState(0);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    lighting: false,
    hasGoalposts: false,
    isBookable: false,
    availableTimeSlots: '',
    lat: undefined,
    lng: undefined,
  });
  const [editLocationKey, setEditLocationKey] = useState(0);
  const [savingEdit, setSavingEdit] = useState(false);
  const editCardRef = useRef(null);
  const editNameRef = useRef(null);

  const loadTurfs = async (nextFilters = filters) => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      ['lighting', 'hasGoalposts', 'isBookable'].forEach((k) => {
        if (nextFilters[k] !== '') params[k] = nextFilters[k];
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
    await loadTurfs(filters);
  };

  const createTurf = async (e) => {
    e.preventDefault();
    if (!isAdmin) return;
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
      setLocationKey((k) => k + 1);
      await loadTurfs();
    } finally {
      setCreating(false);
    }
  };

  const beginEdit = (turf) => {
    if (!isAdmin) return;
    setEditingId(turf._id);
    setEditForm({
      name: turf.name || '',
      address: turf.location?.address || '',
      lighting: Boolean(turf.lighting),
      hasGoalposts: Boolean(turf.hasGoalposts),
      isBookable: Boolean(turf.isBookable),
      availableTimeSlots: Array.isArray(turf.availableTimeSlots)
        ? turf.availableTimeSlots.join(', ')
        : '',
      lat: turf.location?.lat,
      lng: turf.location?.lng,
    });
    setEditLocationKey((k) => k + 1);
    requestAnimationFrame(() => {
      if (editCardRef.current) {
        editCardRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      if (editNameRef.current) {
        editNameRef.current.focus();
      }
    });
  };

  const resetEditForm = () => {
    setEditingId(null);
    setEditForm({
      name: '',
      address: '',
      lighting: false,
      hasGoalposts: false,
      isBookable: false,
      availableTimeSlots: '',
      lat: undefined,
      lng: undefined,
    });
    setEditLocationKey((k) => k + 1);
  };

  const updateTurf = async (e) => {
    e.preventDefault();
    if (!isAdmin || !editingId) return;
    if (!editForm.name) return;
    setSavingEdit(true);
    try {
      const payload = {
        name: editForm.name.trim(),
        location: editForm.address
          ? { address: editForm.address, lat: editForm.lat, lng: editForm.lng }
          : undefined,
        lighting: !!editForm.lighting,
        hasGoalposts: !!editForm.hasGoalposts,
        isBookable: !!editForm.isBookable,
        availableTimeSlots: editForm.availableTimeSlots
          ? editForm.availableTimeSlots.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
      };
      await api.put(`/api/turfs/${editingId}`, payload);
      resetEditForm();
      await loadTurfs();
    } finally {
      setSavingEdit(false);
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

      {/* Create/Edit at the top */}
      <div className="row g-4 mb-4">
        {isAdmin ? (
          editingId ? (
            <div className="col-lg-6" ref={editCardRef} tabIndex={-1}>
              <Card title="Edit Turf" subtitle={`Updating ${editForm.name || 'selected turf'}`} className="border border-warning border-2 shadow-sm">
                <form onSubmit={updateTurf}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      ref={editNameRef}
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <LocationPicker
                      key={editLocationKey}
                      value={{ address: editForm.address || '', lat: editForm.lat, lng: editForm.lng }}
                      onChange={(loc) =>
                        setEditForm((f) => ({
                          ...f,
                          address: loc.address || '',
                          lat: loc.lat,
                          lng: loc.lng,
                        }))
                      }
                    />
                  </div>

                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="edit-lighting" checked={editForm.lighting} onChange={(e) => setEditForm({ ...editForm, lighting: e.target.checked })} />
                      <label className="form-check-label" htmlFor="edit-lighting">Lighting</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="edit-goalposts" checked={editForm.hasGoalposts} onChange={(e) => setEditForm({ ...editForm, hasGoalposts: e.target.checked })} />
                      <label className="form-check-label" htmlFor="edit-goalposts">Goalposts</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="edit-bookable" checked={editForm.isBookable} onChange={(e) => setEditForm({ ...editForm, isBookable: e.target.checked })} />
                      <label className="form-check-label" htmlFor="edit-bookable">Bookable</label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Available time slots (comma separated)</label>
                    <input
                      className="form-control"
                      value={editForm.availableTimeSlots}
                      onChange={(e) => setEditForm({ ...editForm, availableTimeSlots: e.target.value })}
                    />
                  </div>

                  <div className="d-flex gap-2">
                    <button disabled={savingEdit} className={`btn btn-primary ${savingEdit ? 'disabled' : ''}`}>
                      {savingEdit ? 'Saving…' : 'Save changes'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={resetEditForm} disabled={savingEdit}>
                      Cancel
                    </button>
                  </div>
                </form>
              </Card>
            </div>
          ) : (
            <div className="col-lg-6">
              <Card title="Create Turf" subtitle="Add a new community ground">
                <form onSubmit={createTurf}>
                  <div className="mb-3">
                    <label className="form-label">Name</label>
                    <input
                      className="form-control"
                      placeholder="e.g., Claudelands Park 5-a-side"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <LocationPicker
                      key={locationKey}
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

                  <div className="d-flex flex-wrap align-items-center gap-3 mb-3">
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="lighting" checked={form.lighting} onChange={(e) => setForm({ ...form, lighting: e.target.checked })} />
                      <label className="form-check-label" htmlFor="lighting">Lighting</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="goalposts" checked={form.hasGoalposts} onChange={(e) => setForm({ ...form, hasGoalposts: e.target.checked })} />
                      <label className="form-check-label" htmlFor="goalposts">Goalposts</label>
                    </div>
                    <div className="form-check">
                      <input className="form-check-input" type="checkbox" id="bookable" checked={form.isBookable} onChange={(e) => setForm({ ...form, isBookable: e.target.checked })} />
                      <label className="form-check-label" htmlFor="bookable">Bookable</label>
                    </div>
                  </div>

                  <div className="mb-3">
                    <label className="form-label">Available time slots (comma separated)</label>
                    <input
                      className="form-control"
                      placeholder="e.g., 18:00-19:00, 19:00-20:00"
                      value={form.availableTimeSlots}
                      onChange={(e) => setForm({ ...form, availableTimeSlots: e.target.value })}
                    />
                  </div>

                  <button disabled={creating} className={`btn btn-primary ${creating ? 'disabled' : ''}`}>
                    {creating ? 'Creating…' : 'Create Turf'}
                  </button>
                </form>
              </Card>
            </div>
          )
        ) : (
          <div className="col-lg-6">
            <Card title="Need a turf added?" subtitle="Only administrators can publish new grounds">
              <p className="mb-0 small text-muted">Reach out to an administrator if you know about a turf that should be listed.</p>
            </Card>
          </div>
        )}
      </div>

      {/* Map and list side-by-side */}
      <div className="row g-4">
        <div className="col-lg-6">
          <Card title="Map Overview">
            {loading ? (
              <div className="py-3"><Spinner label="Loading map…" /></div>
            ) : (
              <GoogleMap
                center={{ lat: -37.787, lng: 175.279 }}
                markers={markers}
                height={360}
              />
            )}
          </Card>
        </div>
        <div className="col-lg-6">
          <Card title="All Turfs" subtitle="Use filters to narrow the list below">
            <form onSubmit={onFilter} className="row g-3 mb-3 align-items-end">
              {['lighting', 'hasGoalposts', 'isBookable'].map((k) => (
                <div key={k} className="col-12 col-sm-4">
                  <label className="form-label text-capitalize">{k}</label>
                  <select
                    value={filters[k]}
                    onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}
                    className="form-select"
                  >
                    <option value="">Any</option>
                    <option value="true">Yes</option>
                    <option value="false">No</option>
                  </select>
                </div>
              ))}
              <div className="col-12 d-flex gap-2">
                <button type="submit" className="btn btn-primary flex-grow-1">Apply</button>
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={async () => {
                    const defaults = { lighting: '', hasGoalposts: '', isBookable: '' };
                    setFilters(defaults);
                    await loadTurfs(defaults);
                  }}
                >
                  Reset
                </button>
              </div>
            </form>
            {error && <div className="text-danger small mb-3">{error}</div>}

            {loading ? (
              <div className="py-3"><Spinner label="Loading turfs…" /></div>
            ) : turfs.length === 0 ? (
              <div className="py-4 small text-muted">No turfs found.</div>
            ) : (
              <div className="scroll-area">
              <ul className="list-group list-group-flush mb-0">
                {turfs.map((t) => (
                  <li key={t._id} className="list-group-item">
                    <div className="fw-semibold">{t.name}</div>
                    <div className="small text-muted">
                      {t.location?.address || 'No address'} · Lighting: {String(!!t.lighting)} · Goalposts: {String(!!t.hasGoalposts)} · Bookable: {String(!!t.isBookable)}
                    </div>
                    {t.availableTimeSlots?.length > 0 && (
                      <div className="small text-muted mt-1">
                        Slots: {t.availableTimeSlots.join(', ')}
                      </div>
                    )}
                    {isAdmin && (
                      <div className="mt-2 d-flex gap-2">
                        <button
                          type="button"
                          className={`btn btn-sm ${editingId === t._id ? 'btn-primary' : 'btn-outline-primary'}`}
                          onClick={() => beginEdit(t)}
                          disabled={editingId === t._id}
                        >
                          {editingId === t._id ? 'Editing' : 'Edit'}
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              </div>
            )}
          </Card>
        </div>
      </div>
    </Layout>
  );
}
