import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import Card from '../components/Card';
import Spinner from '../components/Spinner';
import Toast from '../components/Toast';
import api from '../lib/api';

const initialEventForm = {
  title: '',
  description: '',
  date: '',
  venue: '',
  ctaText: '',
  ctaUrl: '',
};

const initialAnnouncementForm = {
  title: '',
  message: '',
  ctaText: '',
  ctaUrl: '',
  expiresAt: '',
};

export default function Home() {
  const { token, isAdmin } = useAuth();
  const [ann, setAnn] = useState([]);
  const [annLoading, setAnnLoading] = useState(true);
  const [annError, setAnnError] = useState('');
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [savingEvent, setSavingEvent] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [announcementForm, setAnnouncementForm] = useState(initialAnnouncementForm);
  const [savingAnnouncement, setSavingAnnouncement] = useState(false);

  useEffect(() => {
    let timeout;
    if (toast.message) timeout = setTimeout(() => setToast({ type: '', message: '' }), 2500);
    return () => timeout && clearTimeout(timeout);
  }, [toast]);

  const loadEvents = useCallback(async () => {
    setEventsLoading(true);
    setEventsError('');
    try {
      const { data } = await api.get('/api/events');
      setEvents(Array.isArray(data) ? data : []);
    } catch (error) {
      setEventsError('Unable to load upcoming trainings right now.');
    } finally {
      setEventsLoading(false);
    }
  }, []);

  const loadAnnouncements = useCallback(async () => {
    setAnnLoading(true);
    setAnnError('');

    const loadFallbackMatches = async () => {
      try {
        const { data } = await api.get('/api/matches/announcements/upcoming?windowHours=24');
        return Array.isArray(data)
          ? data.map((item) => ({ ...item, type: 'match' }))
          : [];
      } catch (error) {
        console.error('[Announcements fallback]', error);
        return [];
      }
    };

    try {
      const params = new URLSearchParams();
      if (isAdmin) params.set('includeExpired', 'true');
      const { data } = await api.get(`/api/announcements${params.toString() ? `?${params.toString()}` : ''}`);
      const manual = Array.isArray(data)
        ? data.map((item) => ({ ...item, type: item.type || 'manual' }))
        : [];

      const fallback = await loadFallbackMatches();
      const combined = manual.length ? [...manual, ...fallback] : fallback;
      setAnn(combined);
    } catch (error) {
      const fallback = await loadFallbackMatches();
      if (!fallback.length) {
        setAnnError('Unable to load announcements right now.');
      } else {
        setAnnError('');
      }
      setAnn(fallback);
    } finally {
      setAnnLoading(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    loadEvents();
    loadAnnouncements();
  }, [loadEvents, loadAnnouncements]);

  const updateEventField = (field, value) => {
    setEventForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetEventForm = () => setEventForm(initialEventForm);

  const handleCreateEvent = async (event) => {
    event.preventDefault();

    if (!eventForm.title.trim() || !eventForm.description.trim() || !eventForm.venue.trim() || !eventForm.date) {
      setToast({ type: 'error', message: 'Please complete the title, description, venue, and date/time.' });
      return;
    }

    const dateValue = new Date(eventForm.date);
    if (Number.isNaN(dateValue.getTime())) {
      setToast({ type: 'error', message: 'Please provide a valid date and time.' });
      return;
    }

    setSavingEvent(true);
    try {
      await api.post('/api/events', {
        title: eventForm.title.trim(),
        description: eventForm.description.trim(),
        venue: eventForm.venue.trim(),
        date: dateValue.toISOString(),
        ctaText: eventForm.ctaText.trim(),
        ctaUrl: eventForm.ctaUrl.trim(),
      });

      setToast({ type: 'success', message: 'Event added for players.' });
      resetEventForm();
      await loadEvents();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to create event.';
      setToast({ type: 'error', message });
    } finally {
      setSavingEvent(false);
    }
  };

  const updateAnnouncementField = (field, value) => {
    setAnnouncementForm((prev) => ({ ...prev, [field]: value }));
  };

  const resetAnnouncementForm = () => setAnnouncementForm(initialAnnouncementForm);

  const handleCreateAnnouncement = async (event) => {
    event.preventDefault();

    if (!announcementForm.title.trim() || !announcementForm.message.trim()) {
      setToast({ type: 'error', message: 'Please provide both a title and message for the announcement.' });
      return;
    }

    let expiresAtValue = announcementForm.expiresAt ? new Date(announcementForm.expiresAt) : null;
    if (expiresAtValue && Number.isNaN(expiresAtValue.getTime())) {
      setToast({ type: 'error', message: 'Please provide a valid expiry date and time.' });
      return;
    }

    if (expiresAtValue && expiresAtValue < new Date()) {
      setToast({ type: 'error', message: 'Expiry must be in the future.' });
      return;
    }

    const ctaText = announcementForm.ctaText.trim();
    const ctaUrl = announcementForm.ctaUrl.trim();

    setSavingAnnouncement(true);
    try {
      await api.post('/api/announcements', {
        title: announcementForm.title.trim(),
        message: announcementForm.message.trim(),
        ctaText: ctaText || undefined,
        ctaUrl: ctaUrl || undefined,
        expiresAt: expiresAtValue ? expiresAtValue.toISOString() : undefined,
      });

      setToast({ type: 'success', message: 'Announcement published.' });
      resetAnnouncementForm();
      await loadAnnouncements();
    } catch (error) {
      const message = error?.response?.data?.message || 'Failed to publish announcement.';
      setToast({ type: 'error', message });
    } finally {
      setSavingAnnouncement(false);
    }
  };

  return (
    <>
      <Layout>
        <Toast toast={toast} onClear={() => setToast({ type: '', message: '' })} />
        <section className="app-hero text-center">
          <div className="d-flex flex-column align-items-center gap-3">
            <img src="/Logo.png" alt="TeamUp Hamilton" className="app-hero-logo" />
            <h1 className="display-5 fw-bold">TeamUp Hamilton</h1>
            <p className="lead text-muted" style={{ maxWidth: 720 }}>
              Find your perfect teammates. Plan balanced weekend football matches with smart logistics.
            </p>

            {!token ? (
              <div className="mt-2 d-flex flex-column flex-sm-row gap-3 justify-content-center">
                <Link to="/signin" className="btn btn-primary btn-lg">Sign in</Link>
                <Link to="/signup" className="btn btn-outline-primary btn-lg">Create account</Link>
              </div>
            ) : (
              <div className="mt-2">
                <Link to="/dashboard" className="btn btn-primary btn-lg">Go to dashboard</Link>
              </div>
            )}
          </div>
        </section>

        <div className="row g-3 mt-2">
          <div className="col-12 col-lg-8">
            {isAdmin && (
              <Card
                title="Add training or tournament"
                subtitle="Only admins can publish these events"
                className="mb-4"
              >
                  <form onSubmit={handleCreateEvent} className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label">Title</label>
                    <input
                      className="form-control"
                      value={eventForm.title}
                      onChange={(e) => updateEventField('title', e.target.value)}
                      placeholder="e.g., Weekend Skills Clinic"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Venue</label>
                    <input
                      className="form-control"
                      value={eventForm.venue}
                      onChange={(e) => updateEventField('venue', e.target.value)}
                      placeholder="e.g., Porritt Park 3"
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Date &amp; time</label>
                    <input
                      type="datetime-local"
                      className="form-control"
                      value={eventForm.date}
                      onChange={(e) => updateEventField('date', e.target.value)}
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">CTA text</label>
                    <input
                      className="form-control"
                      value={eventForm.ctaText}
                      onChange={(e) => updateEventField('ctaText', e.target.value)}
                      placeholder="e.g., Register"
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">CTA link</label>
                    <input
                      className="form-control"
                      value={eventForm.ctaUrl}
                      onChange={(e) => updateEventField('ctaUrl', e.target.value)}
                      placeholder="https://..."
                    />
                  </div>
                  <div className="col-12">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-control"
                      rows={3}
                      value={eventForm.description}
                      onChange={(e) => updateEventField('description', e.target.value)}
                      placeholder="Share what players can expect"
                    />
                  </div>
                  <div className="col-12 d-flex gap-2">
                    <button className="btn btn-primary" disabled={savingEvent} type="submit">
                      {savingEvent ? 'Saving…' : 'Publish event'}
                    </button>
                    <button type="button" className="btn btn-outline-secondary" onClick={resetEventForm} disabled={savingEvent}>
                      Reset
                    </button>
                  </div>
                  </form>
              </Card>
            )}

            <Card
              title="Upcoming trainings & tournaments"
              subtitle="Open to everyone in the Hamilton community"
              className="mb-4"
            >
              <div className="scroll-area scroll-area--section">
              {eventsLoading ? (
                <div className="py-3 d-flex justify-content-center"><Spinner label="Loading events…" /></div>
              ) : eventsError ? (
                <div className="text-danger small">{eventsError}</div>
              ) : events.length === 0 ? (
                <div className="small text-muted">No events posted yet. Check back soon.</div>
              ) : (
                events.map((item) => {
                  const eventDate = item.date ? new Date(item.date) : null;
                  const formattedDate = eventDate && !Number.isNaN(eventDate.getTime())
                    ? eventDate.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })
                    : 'Date to be confirmed';

                  return (
                    <div key={item._id} className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 py-2 border-bottom">
                      <div className="me-md-3" style={{ minWidth: 220 }}>
                        <div className="fw-semibold">{item.title}</div>
                        <div className="text-muted small">{formattedDate} · {item.venue}</div>
                      </div>
                      <div className="flex-grow-1 text-muted small">{item.description}</div>
                      {item.ctaText && item.ctaUrl ? (
                        <div>
                          <a
                            href={item.ctaUrl}
                            className="btn btn-outline-primary btn-sm"
                            target="_blank"
                            rel="noreferrer noopener"
                            onClick={(e) => {
                              if (!token) {
                                e.preventDefault();
                                setShowAuthPrompt(true);
                              }
                            }}
                          >
                            {item.ctaText}
                          </a>
                        </div>
                      ) : null}
                    </div>
                  );
                })
              )}
              </div>
            </Card>
          </div>

          <div className="col-12 col-lg-4">
            {isAdmin && (
              <div className="card shadow-sm mb-4">
                <div className="card-header">
                  <h2 className="h6 fw-semibold mb-0">Share announcement</h2>
                </div>
                <div className="card-body">
                  <form onSubmit={handleCreateAnnouncement} className="d-flex flex-column gap-3">
                    <div>
                      <label className="form-label">Title</label>
                      <input
                        className="form-control"
                        value={announcementForm.title}
                        onChange={(e) => updateAnnouncementField('title', e.target.value)}
                        placeholder="e.g., Team photo day"
                      />
                    </div>
                    <div>
                      <label className="form-label">Message</label>
                      <textarea
                        className="form-control"
                        rows={3}
                        value={announcementForm.message}
                        onChange={(e) => updateAnnouncementField('message', e.target.value)}
                        placeholder="Let players know what's happening"
                      />
                    </div>
                    <div className="row g-2">
                      <div className="col-sm-6">
                        <label className="form-label">CTA text</label>
                        <input
                          className="form-control"
                          value={announcementForm.ctaText}
                          onChange={(e) => updateAnnouncementField('ctaText', e.target.value)}
                          placeholder="Optional button"
                        />
                      </div>
                      <div className="col-sm-6">
                        <label className="form-label">CTA link</label>
                        <input
                          className="form-control"
                          value={announcementForm.ctaUrl}
                          onChange={(e) => updateAnnouncementField('ctaUrl', e.target.value)}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Expires (optional)</label>
                      <input
                        type="datetime-local"
                        className="form-control"
                        value={announcementForm.expiresAt}
                        onChange={(e) => updateAnnouncementField('expiresAt', e.target.value)}
                      />
                    </div>
                    <div className="d-flex gap-2">
                      <button className="btn btn-primary" type="submit" disabled={savingAnnouncement}>
                        {savingAnnouncement ? 'Posting…' : 'Publish announcement'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        onClick={resetAnnouncementForm}
                        disabled={savingAnnouncement}
                      >
                        Reset
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {!isAdmin && (
              <div className="card shadow-sm mb-4">
                <div className="card-body small text-muted">
                  Organisers can publish trainings and announcements. Contact an admin if you need access.
                </div>
              </div>
            )}

            <div className="card shadow-sm mb-4">
              <div className="card-header">
                <h2 className="h6 fw-semibold mb-0">Announcements</h2>
              </div>
              <div className="card-body">
                {annError ? <div className="text-danger small mb-2">{annError}</div> : null}
                <div className="scroll-area scroll-area--section">
                <ul className="list-unstyled mb-0">
                  {annLoading ? (
                    <li className="small text-muted">Loading announcements…</li>
                  ) : ann.length === 0 ? (
                    <li className="small text-muted">No announcements just yet.</li>
                  ) : (
                    ann.map((item) => {
                      if (item.type === 'manual') {
                        const published = item.publishAt ? new Date(item.publishAt) : null;
                        return (
                          <li key={`ann-${item._id}`} className="mb-3">
                            <div className="d-flex justify-content-between align-items-start gap-2">
                              <div>
                                <div className="fw-semibold">{item.title}</div>
                                {published && (
                                  <div className="text-muted small">
                                    {published.toLocaleString()}
                                  </div>
                                )}
                              </div>
                            </div>
                            <div className="small mt-1" style={{ whiteSpace: 'pre-wrap' }}>{item.message}</div>
                            {item.ctaText && item.ctaUrl ? (
                              <div className="mt-2">
                                <a
                                  href={item.ctaUrl}
                                  className="btn btn-outline-primary btn-sm"
                                  target="_blank"
                                  rel="noreferrer noopener"
                                >
                                  {item.ctaText}
                                </a>
                              </div>
                            ) : null}
                          </li>
                        );
                      }

                      return (
                        <li key={`match-${item._id}`} className="mb-2 d-flex align-items-start gap-2">
                          <span className="badge text-bg-primary rounded-pill mt-1" style={{ width: 8, height: 8 }} />
                          <div>
                            <div className="small">
                              {item.date ? new Date(item.date).toLocaleString() : 'Upcoming match'} — {item.turf?.name || 'Open match'}
                              {item.spotsLeft != null ? ` · ${item.spotsLeft} spots left` : ''}
                            </div>
                            {item.startsInMinutes != null && (
                              <div className="text-muted small">Starts in {Math.max(0, item.startsInMinutes)} min</div>
                            )}
                          </div>
                        </li>
                      );
                    })
                  )}
                </ul>
                </div>
              </div>
            </div>

            <div className="card shadow-sm">
              <div className="card-body">
                <div className="fw-semibold">How TeamUp works</div>
                <ol className="small text-muted mt-2 mb-0 ps-3">
                  <li>Create an account and set preferred position & availability</li>
                  <li>Join or create a match from the dashboard</li>
                  <li>We help balance teams and share turf details</li>
                  <li>Get reminders and last‑minute fill‑ins if needed</li>
                </ol>
              </div>
            </div>
          </div>
      </div>
      </Layout>
      {showAuthPrompt && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ backgroundColor: 'rgba(15, 23, 42, 0.55)', zIndex: 1050 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="authPromptTitle"
        >
          <div className="card shadow-lg" style={{ maxWidth: 420, width: '90%' }}>
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-start mb-3">
                <div>
                  <h2 className="h5 mb-1" id="authPromptTitle">Please sign in first</h2>
                  <p className="text-muted small mb-0">
                    You need an account to register for TeamUp Hamilton events.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={() => setShowAuthPrompt(false)}
                />
              </div>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Link to="/signin" className="btn btn-primary flex-fill" onClick={() => setShowAuthPrompt(false)}>
                  Sign in
                </Link>
                <Link to="/signup" className="btn btn-outline-primary flex-fill" onClick={() => setShowAuthPrompt(false)}>
                  Create account
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
