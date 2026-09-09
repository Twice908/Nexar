'use client';

import { AppShell } from '../app-shell';
import { RequireProfile } from '../require-profile';

export default function TripsPage() {
  return (
    <RequireProfile>
      {() => (
        <AppShell>
          <section className="page-panel" aria-labelledby="trips-heading">
            <p className="eyebrow">Trips</p>
            <h1 id="trips-heading">No matched trip yet.</h1>
            <p className="home-copy">
              Groups are formed overnight from your saved commute window, home
              zone, and office building. Tomorrow’s group will appear here when
              matching completes.
            </p>
            <span className="status-chip">Waiting for next matching run</span>
          </section>
        </AppShell>
      )}
    </RequireProfile>
  );
}
