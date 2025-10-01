import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { token } = useAuth();

  return (
    <Layout>
      <section className="app-hero text-center">
        <div className="d-flex flex-column align-items-center gap-3">
          <img src="/vite.svg" alt="App logo" style={{ width: 56, height: 56 }} />
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
          <div className="card shadow-sm">
            <div className="card-header bg-white">
              <h2 className="h6 fw-semibold mb-0">Upcoming Trainings & Tournaments</h2>
              <p className="small text-muted mb-0">Open to everyone in Hamilton community</p>
            </div>
            <div className="card-body">
              {[
                { id: 't1', title: 'Weekend Skills Clinic', date: 'Sat, Oct 5 · 9:00–11:00 AM', venue: 'Porritt Park 3', desc: 'Ball control, passing drills, and finishing practice. Friendly for all levels.', cta: 'Register', url: '#' },
                { id: 't2', title: '5‑a‑side Mini Tournament', date: 'Sun, Oct 6 · 1:30–5:00 PM', venue: 'Galloway Turf 2', desc: 'Mixed teams, short games, prizes for finalists.', cta: 'Join a team', url: '#' },
                { id: 't3', title: 'Evening Goalkeeper Workshop', date: 'Wed, Oct 9 · 6:00–7:30 PM', venue: 'Ashurst Park', desc: 'Shot‑stopping basics and distribution. Limited spots.', cta: 'Reserve spot', url: '#' },
              ].map((x) => (
                <div key={x.id} className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-2 py-2 border-bottom">
                  <div className="me-md-3" style={{ minWidth: 220 }}>
                    <div className="fw-semibold">{x.title}</div>
                    <div className="text-muted small">{x.date} · {x.venue}</div>
                  </div>
                  <div className="flex-grow-1 text-muted small">{x.desc}</div>
                  <div>
                    <a href={x.url} className="btn btn-outline-primary btn-sm">{x.cta}</a>
                  </div>
                </div>
              ))}
              <div className="text-muted small mt-2">These are sample events for demo. Final details will be posted weekly.</div>
            </div>
          </div>
        </div>

        <div className="col-12 col-lg-4">
          <div className="card shadow-sm mb-3">
            <div className="card-header bg-white">
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
