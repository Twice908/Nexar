'use client';

import { useState } from 'react';

import { AppShell } from '../app-shell';
import { OnboardingFlow } from '../onboarding-flow';
import {
  firstName,
  formatCommuteDays,
  maskedPlate,
  type CommuteProfile,
} from '../profile';
import { RequireProfile } from '../require-profile';

function ProfileView({ profile }: { profile: CommuteProfile }) {
  const [editing, setEditing] = useState(false);

  return (
    <AppShell>
      <section className="page-panel" aria-labelledby="profile-heading">
        <p className="eyebrow">Profile</p>
        <h1 id="profile-heading">{profile.name}</h1>
        <p className="home-copy">
          Only {firstName(profile.name)} and your commute essentials are used
          for matching. Exact home address is never shown to another group
          member.
        </p>
        {profile.profileImageUrl && (
          <img
            className="profile-avatar"
            src={profile.profileImageUrl}
            alt={`${firstName(profile.name)} profile`}
          />
        )}
        {!editing && (
          <dl className="profile-list">
            <div>
              <dt>Ride preference</dt>
              <dd>{profile.rolePreference}</dd>
            </div>
            <div>
              <dt>Home zone</dt>
              <dd>{profile.homeZoneLabel}</dd>
            </div>
            <div>
              <dt>Office</dt>
              <dd>
                {profile.officeBuilding} · {profile.officeEntryWindow}
              </dd>
            </div>
            <div>
              <dt>Days</dt>
              <dd>{formatCommuteDays(profile.commuteDays)}</dd>
            </div>
            <div>
              <dt>Vehicle</dt>
              <dd>
                {profile.vehicleModel} ·{' '}
                {maskedPlate(profile.vehiclePlateNumber)}
              </dd>
            </div>
          </dl>
        )}
        {!editing && (
          <button
            className="button button-primary"
            type="button"
            onClick={() => setEditing(true)}
          >
            Edit commute details
          </button>
        )}
      </section>
      {editing && (
        <OnboardingFlow
          stayOnForm
          onSaved={() => setEditing(false)}
        />
      )}
    </AppShell>
  );
}

export default function ProfilePage() {
  return (
    <RequireProfile>
      {(profile) => <ProfileView profile={profile} />}
    </RequireProfile>
  );
}
