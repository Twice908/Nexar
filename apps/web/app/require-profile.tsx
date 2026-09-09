'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import {
  fetchOnboarding,
  type CommuteProfile,
} from './profile';

export function RequireProfile({
  children,
}: {
  children: (profile: CommuteProfile) => React.ReactNode;
}) {
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CommuteProfile | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn) {
      router.replace('/');
      return;
    }

    async function load() {
      try {
        const token = await getToken();
        const result = await fetchOnboarding(token);
        if (!result.complete || !result.profile) {
          router.replace('/');
          return;
        }
        setProfile(result.profile);
      } catch {
        setError('We could not load your commute workspace.');
      }
    }

    void load();
  }, [getToken, isLoaded, isSignedIn, router]);

  if (error) {
    return <div className="onboarding-state">{error}</div>;
  }

  if (!profile) {
    return (
      <div className="onboarding-state">Loading your commute workspace...</div>
    );
  }

  return <>{children(profile)}</>;
}
