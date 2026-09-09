'use client';

import Link from 'next/link';
import { useAuth } from '@clerk/nextjs';
import { FormEvent, useEffect, useState } from 'react';

import { AppShell } from '../app-shell';
import {
  firstName,
  formatCommuteDays,
  maskedPlate,
  apiBaseUrl,
  type CommuteProfile,
} from '../profile';
import { RequireProfile } from '../require-profile';

type RideMode = 'driver' | 'passenger';

type RideRequest = {
  id: string;
  role: RideMode;
  commuteDays: string[];
  active: boolean;
};

const dayOptions: [string, string][] = [
  ['monday', 'M'],
  ['tuesday', 'T'],
  ['wednesday', 'W'],
  ['thursday', 'T'],
  ['friday', 'F'],
];

function RideCreator({ profile }: { profile: CommuteProfile }) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [mode, setMode] = useState<RideMode>(
    profile.rolePreference === 'passenger' ? 'passenger' : 'driver',
  );
  const [request, setRequest] = useState<RideRequest | null>(null);
  const [commuteDays, setCommuteDays] = useState(profile.commuteDays);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  function switchMode(nextMode: RideMode) {
    setMode(nextMode);
  }

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    async function loadRequests() {
      try {
        const token = await getToken();
        const response = await fetch(`${apiBaseUrl}/v1/ride-requests`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) {
          throw new Error('Unable to load your recurring ride request.');
        }
        const result = (await response.json()) as {
          requests: RideRequest[];
        };
        const current = result.requests[0] ?? null;
        setRequest(current);
        if (current) {
          setMode(current.role);
          setCommuteDays(current.commuteDays);
        }
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load your recurring ride request.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadRequests();
  }, [getToken, isLoaded, isSignedIn]);

  function toggleDay(day: string) {
    setCommuteDays((current) =>
      current.includes(day)
        ? current.filter((currentDay) => currentDay !== day)
        : [...current, day],
    );
  }

  async function saveRide(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (commuteDays.length === 0) {
      setError('Choose at least one recurring commute day.');
      return;
    }

    setSaving(true);
    setError('');
    setMessage('');
    try {
      const token = await getToken();
      if (!token) {
        throw new Error(
          'Your Clerk session is still loading. Please try again.',
        );
      }
      const response = await fetch(
        request
          ? `${apiBaseUrl}/v1/ride-requests/${request.id}`
          : `${apiBaseUrl}/v1/ride-requests/${mode === 'driver' ? 'offer' : 'request'}`,
        {
          method: request ? 'PATCH' : 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            commuteDays,
            ...(request ? { role: mode } : {}),
          }),
        },
      );
      const result = (await response.json().catch(() => null)) as {
        request?: RideRequest;
        error?: string;
      } | null;
      if (!response.ok || !result?.request) {
        throw new Error(result?.error ?? 'Unable to save your ride request.');
      }
      setRequest(result.request);
      setMessage(
        result.request.role === 'driver'
          ? 'Your recurring driver offer is active.'
          : 'Your recurring ride request is active.',
      );
    } catch (saveError) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : 'Unable to save your ride request.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function cancelRide() {
    if (!request) {
      return;
    }
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const token = await getToken();
      const response = await fetch(
        `${apiBaseUrl}/v1/ride-requests/${request.id}`,
        {
          method: 'DELETE',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      const result = (await response.json().catch(() => null)) as {
        request?: RideRequest;
        error?: string;
      } | null;
      if (!response.ok || !result?.request) {
        throw new Error(result?.error ?? 'Unable to cancel your ride request.');
      }
      setRequest(result.request);
      setMessage('Your recurring ride request is cancelled.');
    } catch (cancelError) {
      setError(
        cancelError instanceof Error
          ? cancelError.message
          : 'Unable to cancel your ride request.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="ride-creator" aria-labelledby="ride-creator-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Recurring commute</p>
          <h2 id="ride-creator-heading">Set your ride role</h2>
        </div>
        <span className="demo-label">
          {loading ? 'Loading' : request?.active ? 'Active' : 'Not active'}
        </span>
      </div>

      <div className="ride-mode-picker" role="tablist" aria-label="Ride role">
        <button
          className={mode === 'driver' ? 'ride-mode active' : 'ride-mode'}
          type="button"
          role="tab"
          aria-selected={mode === 'driver'}
          onClick={() => switchMode('driver')}
        >
          <span>Offer a ride</span>
          <small>Drive fellow Nexirians</small>
        </button>
        <button
          className={mode === 'passenger' ? 'ride-mode active' : 'ride-mode'}
          type="button"
          role="tab"
          aria-selected={mode === 'passenger'}
          onClick={() => switchMode('passenger')}
        >
          <span>Request a ride</span>
          <small>Join a Nexar driver</small>
        </button>
      </div>

      <form className="ride-form" onSubmit={saveRide}>
        <label>
          Starting point
          <input value={profile.homeZoneLabel} readOnly />
        </label>
        <label>
          Destination
          <input value={profile.officeBuilding} readOnly />
        </label>
        <label>
          Office entry
          <input value={profile.officeEntryWindow} readOnly />
        </label>
        <fieldset>
          <legend>Days</legend>
          <div className="day-picker">
            {dayOptions.map(([day, label]) => (
              <button
                className={
                  commuteDays.includes(day)
                    ? 'day-button selected'
                    : 'day-button'
                }
                type="button"
                key={day}
                onClick={() => toggleDay(day)}
                aria-pressed={commuteDays.includes(day)}
              >
                {label}
              </button>
            ))}
          </div>
        </fieldset>
        <button className="button button-primary" type="submit">
          {saving
            ? 'Saving...'
            : mode === 'driver'
              ? 'Offer recurring ride'
              : 'Request recurring ride'}
        </button>
      </form>

      {(message || error) && (
        <div className="ride-created" role="status">
          <div>
            <span className="ride-created-label">
              {error ? 'Action failed' : 'Saved'}
            </span>
            <strong>{error || message}</strong>
          </div>
          {request?.active && (
            <button
              className="button button-quiet"
              type="button"
              onClick={cancelRide}
              disabled={saving}
            >
              Cancel request
            </button>
          )}
        </div>
      )}
    </section>
  );
}

function HomeDashboard({ profile }: { profile: CommuteProfile }) {
  return (
    <AppShell>
      <section className="home-hero" aria-labelledby="home-heading">
        <p className="eyebrow">Today</p>
        <h1 id="home-heading">Hello, {firstName(profile.name)}.</h1>
        <p className="home-copy">
          Your commute details are saved. Matching runs overnight for your
          office window.
        </p>
        <span className="status-chip">Ready for matching</span>
      </section>

      <section className="info-grid" aria-label="Your commute">
        <article className="info-card">
          <img src="/icons/home-user.svg" alt="" />
          <p className="info-label">Home zone</p>
          <p className="info-value">{profile.homeZoneLabel}</p>
          <p className="info-meta">Approximate landmark only</p>
        </article>
        <article className="info-card">
          <img src="/icons/office.svg" alt="" />
          <p className="info-label">Office</p>
          <p className="info-value">{profile.officeBuilding}</p>
          <p className="info-meta">{profile.officeEntryWindow}</p>
        </article>
        <article className="info-card">
          <img src="/icons/rides.svg" alt="" />
          <p className="info-label">Commute days</p>
          <p className="info-value">{formatCommuteDays(profile.commuteDays)}</p>
          <p className="info-meta">Recurring weekday request</p>
        </article>
        <article className="info-card">
          <img src="/icons/account.svg" alt="" />
          <p className="info-label">Your car</p>
          <p className="info-value">{profile.vehicleModel}</p>
          <p className="info-meta">
            {maskedPlate(profile.vehiclePlateNumber)} ·{' '}
            {profile.vehicleSeatsAvailable} seats
          </p>
        </article>
      </section>

      <section className="home-actions">
        <Link className="button button-primary button-large" href="/trips">
          View trips
        </Link>
        <Link className="button button-quiet button-large" href="/profile">
          Edit commute details
        </Link>
      </section>

      <RideCreator profile={profile} />

      <section
        className="dummy-ride-panel"
        aria-labelledby="dummy-ride-heading"
      >
        <div>
          <p className="eyebrow">Upcoming example</p>
          <h2 id="dummy-ride-heading">Tomorrow, Tuesday</h2>
          <p className="home-copy">
            A sample matched ride will appear here once Nexar groups you with
            nearby Nexirians.
          </p>
        </div>
        <div className="dummy-ride-route">
          <span>08:15</span>
          <div>
            <strong>Baner, Pune</strong>
            <span>→</span>
            <strong>Hinjawadi Phase 1 Campus</strong>
          </div>
          <span className="status-chip">3 seats open</span>
        </div>
      </section>
    </AppShell>
  );
}

export default function HomePage() {
  return (
    <RequireProfile>
      {(profile) => <HomeDashboard profile={profile} />}
    </RequireProfile>
  );
}
