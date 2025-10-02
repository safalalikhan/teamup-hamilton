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

export default function Home() {
  const { token, isAdmin } = useAuth();
  const [events, setEvents] = useState([]);
  const [eventsLoading, setEventsLoading] = useState(true);
  const [eventsError, setEventsError] = useState('');
  const [eventForm, setEventForm] = useState(initialEventForm);
  const [savingEvent, setSavingEvent] = useState(false);
  const [toast, setToast] = useState({ type: '', message: '' });

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

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

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

  return (
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
              className="mb-3"
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
          >
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
                        >
                          {item.ctaText}
                        </a>
                      </div>
                    ) : null}
                  </div>
                );
              })
            )}
          </Card>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm mb-3">
            <div className="card-header">
              <h2 className="h6 fw-semibold mb-0">Announcements</h2>
            </div>
            <div className="card-body">
              <ul className="list-unstyled mb-0">
                {[ 
                  { id: 'a1', title: 'New turf added: Clyde Park', when: 'Oct 1' },
                  { id: 'a2', title: 'Looking for defenders for Sunday 4 PM match', when: 'Oct 2' },
                  { id: 'a3', title: 'Light rain expected this weekend — check turf updates', when: 'Oct 3' },
                ].map(a => (
                  <li key={a.id} className="mb-2 d-flex align-items-start gap-2">
                    <span className="badge text-bg-primary rounded-pill mt-1" style={{ width: 8, height: 8 }} />
                    <div>
                      <div className="small">{a.title}</div>
                      <div className="text-muted small">{a.when}</div>
                    </div>
                  </li>
                ))}
              </ul>
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
  );
}
