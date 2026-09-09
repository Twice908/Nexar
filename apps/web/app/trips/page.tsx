'use client';

import { useAuth } from '@clerk/nextjs';
import { useEffect, useState } from 'react';

import { AppShell } from '../app-shell';
import { apiBaseUrl } from '../profile';
import { RequireProfile } from '../require-profile';

type CurrentTrip = {
  id: string;
  status: 'MATCHED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  confirmationDeadline: string | null;
  member: { confirmedAt: string | null; role: 'driver' | 'rider' };
};

export default function TripsPage() {
  return <RequireProfile>{() => <TripsContent />}</RequireProfile>;
}

function TripsContent() {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const [trip, setTrip] = useState<CurrentTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    async function loadTrip() {
      try {
        const token = await getToken();
        const response = await fetch(`${apiBaseUrl}/v1/trips/current`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        });
        if (!response.ok) {
          throw new Error('Unable to load your current trip.');
        }
        const result = (await response.json()) as { trip: CurrentTrip | null };
        setTrip(result.trip);
      } catch (loadError) {
        setError(
          loadError instanceof Error
            ? loadError.message
            : 'Unable to load your current trip.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadTrip();
  }, [getToken, isLoaded, isSignedIn]);

  async function confirmTrip() {
    if (!trip) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      const response = await fetch(
        `${apiBaseUrl}/v1/trips/${trip.id}/confirm`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      const result = (await response.json().catch(() => null)) as {
        status?: CurrentTrip['status'];
        error?: string;
      } | null;
      if (!response.ok || !result?.status) {
        throw new Error(result?.error ?? 'Unable to confirm this trip.');
      }
      setTrip({
        ...trip,
        status: result.status,
        member: { ...trip.member, confirmedAt: new Date().toISOString() },
      });
    } catch (confirmError) {
      setError(
        confirmError instanceof Error
          ? confirmError.message
          : 'Unable to confirm this trip.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function startTrip() {
    if (!trip) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      const response = await fetch(
        `${apiBaseUrl}/v1/trips/${trip.id}/start`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      const result = (await response.json().catch(() => null)) as {
        status?: CurrentTrip['status'];
        error?: string;
      } | null;
      if (!response.ok || !result?.status) {
        throw new Error(result?.error ?? 'Unable to start this trip.');
      }
      setTrip({ ...trip, status: result.status });
    } catch (startError) {
      setError(
        startError instanceof Error
          ? startError.message
          : 'Unable to start this trip.',
      );
    } finally {
      setSaving(false);
    }
  }

  async function completeTrip() {
    if (!trip) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      const response = await fetch(
        `${apiBaseUrl}/v1/trips/${trip.id}/complete`,
        {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        },
      );
      const result = (await response.json().catch(() => null)) as {
        status?: CurrentTrip['status'];
        error?: string;
      } | null;
      if (!response.ok || !result?.status) {
        throw new Error(result?.error ?? 'Unable to complete this trip.');
      }
      setTrip({ ...trip, status: result.status });
    } catch (completeError) {
      setError(
        completeError instanceof Error
          ? completeError.message
          : 'Unable to complete this trip.',
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <AppShell>
      <section className="page-panel" aria-labelledby="trips-heading">
        <p className="eyebrow">Trips</p>
        {loading ? <h1 id="trips-heading">Loading your trip...</h1> : null}
        {!loading && !trip ? (
          <>
            <h1 id="trips-heading">No matched trip yet.</h1>
            <p className="home-copy">
              Tomorrow’s group will appear here when matching completes.
            </p>
          </>
        ) : null}
        {trip ? (
          <>
            <h1 id="trips-heading">Tomorrow’s commute</h1>
            <p className="home-copy">
              Status: {trip.status}. Confirmation closes at{' '}
              {trip.confirmationDeadline
                ? new Date(trip.confirmationDeadline).toLocaleString()
                : '9:30 PM tonight'}
              .
            </p>
            {trip.status === 'MATCHED' && !trip.member.confirmedAt ? (
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={() => void confirmTrip()}
              >
                {saving ? 'Confirming...' : 'Confirm commute'}
              </button>
            ) : null}
            {trip.status === 'CONFIRMED' && trip.member.role === 'driver' ? (
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={() => void startTrip()}
              >
                {saving ? 'Starting...' : 'Start trip'}
              </button>
            ) : null}
            {trip.status === 'IN_PROGRESS' ? (
              <p className="home-copy" aria-live="polite">
                Trip is in progress. Live location is active.
              </p>
            ) : null}
            {trip.status === 'IN_PROGRESS' && trip.member.role === 'driver' ? (
              <button
                className="primary-button"
                type="button"
                disabled={saving}
                onClick={() => void completeTrip()}
              >
                {saving ? 'Completing...' : 'Mark drop-off done'}
              </button>
            ) : null}
            {trip.status === 'COMPLETED' ? (
              <p className="home-copy">Trip completed.</p>
            ) : null}
          </>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
      </section>
    </AppShell>
  );
}
