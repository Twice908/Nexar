'use client';

import { useAuth } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import type { VerificationStatus } from './profile';

const LocationMap = dynamic(
  () => import('./location-map').then((module) => module.LocationMap),
  { ssr: false },
);

type OnboardingForm = {
  name: string;
  profileImageUrl: string | null;
  gender: 'female' | 'male' | 'non_binary' | 'prefer_not_to_say';
  homeZoneLabel: string;
  homeZoneLatitude: number;
  homeZoneLongitude: number;
  officeBuilding: string;
  officeEntryWindow: string;
  commuteDays: string[];
  vehicleModel: string;
  vehiclePlateNumber: string;
  vehicleSeatsAvailable: number;
  rolePreference: 'driver' | 'passenger' | 'both';
};

const initialForm: OnboardingForm = {
  name: '',
  profileImageUrl: null,
  gender: 'prefer_not_to_say',
  homeZoneLabel: '',
  homeZoneLatitude: 0,
  homeZoneLongitude: 0,
  officeBuilding: '',
  officeEntryWindow: '08:30 - 09:00',
  commuteDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
  vehicleModel: '',
  vehiclePlateNumber: '',
  vehicleSeatsAvailable: 3,
  rolePreference: 'both',
};

const dayOptions: [string, string][] = [
  ['monday', 'M'],
  ['tuesday', 'T'],
  ['wednesday', 'W'],
  ['thursday', 'T'],
  ['friday', 'F'],
];

export function OnboardingFlow({
  stayOnForm = false,
  onSaved,
}: {
  stayOnForm?: boolean;
  onSaved?: () => void;
} = {}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState(initialForm);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [locating, setLocating] = useState(false);
  const [complete, setComplete] = useState(false);
  const [verification, setVerification] = useState<VerificationStatus | null>(
    null,
  );
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded || !isSignedIn) {
      return;
    }

    async function loadProfile() {
      try {
        const token = await getToken();
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'}/v1/onboarding`,
          { headers: token ? { Authorization: `Bearer ${token}` } : undefined },
        );
        if (response.ok) {
          const result = await response.json();
          setVerification(result.verification ?? null);
          if (result.profile) {
            setForm((current) => ({
              ...current,
              ...result.profile,
            }));
          }
          if (result.complete && !stayOnForm) {
            router.replace('/home');
            return;
          }
          setComplete(Boolean(result.complete));
        }
      } catch {
        setError(
          'We could not reach your commute workspace. Try again shortly.',
        );
      } finally {
        setLoading(false);
      }
    }

    void loadProfile();
  }, [getToken, isLoaded, isSignedIn, router, stayOnForm]);

  function update<K extends keyof OnboardingForm>(
    key: K,
    value: OnboardingForm[K],
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function toggleDay(day: string) {
    setForm((current) => ({
      ...current,
      commuteDays: current.commuteDays.includes(day)
        ? current.commuteDays.filter((currentDay) => currentDay !== day)
        : [...current.commuteDays, day],
    }));
  }

  function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError(
        'Location is not available in this browser. Enter an approximate zone instead.',
      );
      return;
    }

    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update('homeZoneLatitude', Number(coords.latitude.toFixed(6)));
        update('homeZoneLongitude', Number(coords.longitude.toFixed(6)));
        setLocating(false);
      },
      () => {
        setError(
          'Location permission was not granted. Enter an approximate zone instead.',
        );
        setLocating(false);
      },
      { enableHighAccuracy: false, maximumAge: 300000, timeout: 10000 },
    );
  }

  function validateCurrentStep() {
    if (step === 1 && form.name.trim().length < 2) {
      return 'Add the name you want your Nexar group to use.';
    }
    if (
      step === 2 &&
      (!form.homeZoneLabel.trim() || !form.officeBuilding.trim())
    ) {
      return 'Add your approximate home zone and office building.';
    }
    if (
      step === 2 &&
      (form.homeZoneLatitude === 0 || form.homeZoneLongitude === 0)
    ) {
      return 'Use your current location or enter a map location before continuing.';
    }
    if (step === 3 && form.vehicleModel.trim().length < 2) {
      return 'Add the car model you will use for carpooling.';
    }
    if (step === 3 && form.vehiclePlateNumber.trim().length < 4) {
      return 'Add a valid vehicle plate number.';
    }
    if (step === 3 && form.commuteDays.length === 0) {
      return 'Choose at least one recurring commute day.';
    }
    return '';
  }

  function nextStep() {
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError('');
    setStep((current) => Math.min(current + 1, 3));
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const validationError = validateCurrentStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError('');
    try {
      const token = await getToken();
      if (!token) {
        throw new Error(
          'Your Clerk session is still loading. Please try again.',
        );
      }
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:4000'}/v1/onboarding`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(form),
        },
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        throw new Error(
          result?.error ?? 'Unable to save your commute profile.',
        );
      }
      setComplete(true);
      if (onSaved) {
        onSaved();
      } else if (!stayOnForm) {
        router.replace('/home');
      }
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : 'Unable to save your commute profile.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="onboarding-state">Loading your commute workspace...</div>
    );
  }

  if (complete && stayOnForm) {
    return null;
  }

  if (complete) {
    return (
      <section
        className="onboarding-card onboarding-complete"
        aria-live="polite"
      >
        <p className="eyebrow">Profile ready</p>
        <h2>You are ready for matching.</h2>
        <p>
          Your car, commute window, and approximate zones are saved for the next
          matching run.
        </p>
        <button
          className="button button-primary button-large"
          type="button"
          onClick={() => setComplete(false)}
        >
          Edit commute details
        </button>
      </section>
    );
  }

  return (
    <section className="onboarding-card" aria-labelledby="onboarding-heading">
      <div className="onboarding-heading-row">
        <div>
          <p className="eyebrow">Set up your commute</p>
          <h2 id="onboarding-heading">Let us get the details right.</h2>
        </div>
        <span className="step-count">0{step} / 03</span>
      </div>

      <div className="progress-track" aria-hidden="true">
        <span style={{ width: `${(step / 3) * 100}%` }} />
      </div>

      <form onSubmit={submit}>
        {step === 1 && (
          <div className="form-step">
            <p className="step-intro">
              This is how your verified commute group will recognize you.
            </p>
            <label>
              Your name
              <input
                value={form.name}
                onChange={(event) => update('name', event.target.value)}
                placeholder="First and last name"
                autoComplete="name"
              />
            </label>
            <label>
              Gender
              <select
                value={form.gender}
                onChange={(event) =>
                  update(
                    'gender',
                    event.target.value as OnboardingForm['gender'],
                  )
                }
              >
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="non_binary">Non-binary</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </label>
            <label>
              Ride preference
              <select
                value={form.rolePreference}
                onChange={(event) =>
                  update(
                    'rolePreference',
                    event.target.value as OnboardingForm['rolePreference'],
                  )
                }
              >
                <option value="both">Both: offer and request rides</option>
                <option value="driver">Driver: offer rides</option>
                <option value="passenger">Passenger: request rides</option>
              </select>
            </label>
            <p className="privacy-hint">
              Only your first name and profile photo are shown to a matched
              group.
            </p>
          </div>
        )}

        {step === 2 && (
          <div className="form-step">
            <p className="step-intro">
              We use approximate zones to find a practical shared pickup and
              drop point.
            </p>
            <label>
              Residential address or landmark
              <input
                value={form.homeZoneLabel}
                onChange={(event) =>
                  update('homeZoneLabel', event.target.value)
                }
                placeholder="Apartment, residential gate, or landmark"
              />
            </label>
            <LocationMap
              latitude={form.homeZoneLatitude}
              longitude={form.homeZoneLongitude}
              onChange={(latitude, longitude) => {
                update('homeZoneLatitude', latitude);
                update('homeZoneLongitude', longitude);
              }}
            />
            <button
              className="location-button"
              type="button"
              onClick={useCurrentLocation}
              disabled={locating}
            >
              {locating
                ? 'Finding an approximate zone...'
                : 'Use my approximate location'}
            </button>
            <div className="coordinate-row">
              <span>Zone latitude: {form.homeZoneLatitude || 'Not set'}</span>
              <span>Zone longitude: {form.homeZoneLongitude || 'Not set'}</span>
            </div>
            <label>
              Office building or campus
              <input
                value={form.officeBuilding}
                onChange={(event) =>
                  update('officeBuilding', event.target.value)
                }
                placeholder="Building name or campus"
              />
            </label>
            <label>
              Usual office entry window
              <select
                value={form.officeEntryWindow}
                onChange={(event) =>
                  update('officeEntryWindow', event.target.value)
                }
              >
                <option>07:30 - 08:00</option>
                <option>08:00 - 08:30</option>
                <option>08:30 - 09:00</option>
                <option>09:00 - 09:30</option>
                <option>09:30 - 10:00</option>
              </select>
            </label>
          </div>
        )}

        {step === 3 && (
          <div className="form-step">
            <p className="step-intro">
              Nexar is genuine cost-sharing, not a taxi service. Vehicle
              details are required for every pilot profile while we build the
              driver flow.
            </p>
            <label>
              Car model
              <input
                value={form.vehicleModel}
                onChange={(event) => update('vehicleModel', event.target.value)}
                placeholder="Model and variant"
              />
            </label>
            <label>
              Vehicle plate number
              <input
                value={form.vehiclePlateNumber}
                onChange={(event) =>
                  update('vehiclePlateNumber', event.target.value.toUpperCase())
                }
                placeholder="Last four digits are shown before matching"
              />
            </label>
            <label>
              Available passenger seats
              <input
                type="number"
                min="3"
                max="8"
                value={form.vehicleSeatsAvailable}
                onChange={(event) =>
                  update('vehicleSeatsAvailable', Number(event.target.value))
                }
              />
            </label>
            <fieldset>
              <legend>Recurring commute days</legend>
              <div className="day-picker">
                {dayOptions.map(([day, label]) => (
                  <button
                    className={
                      form.commuteDays.includes(day)
                        ? 'day-button selected'
                        : 'day-button'
                    }
                    type="button"
                    key={day}
                    onClick={() => toggleDay(day)}
                    aria-pressed={form.commuteDays.includes(day)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        )}

        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}

        <div className="form-actions">
          {step > 1 && (
            <button
              className="button button-quiet"
              type="button"
              onClick={() => {
                setError('');
                setStep((current) => current - 1);
              }}
            >
              Back
            </button>
          )}
          {step < 3 ? (
            <button
              className="button button-primary"
              type="button"
              onClick={nextStep}
            >
              Continue
            </button>
          ) : (
            <button
              className="button button-primary"
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save my commute'}
            </button>
          )}
        </div>
      </form>
    </section>
  );
}
