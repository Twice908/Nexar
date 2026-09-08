import {
  SignInButton,
  SignUpButton,
  SignedIn,
  SignedOut,
  UserButton,
} from '@clerk/nextjs';

export default function HomePage() {
  const clerkConfigured = Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  );

  return (
    <main className="landing-shell">
      <header className="topbar">
        <div className="brand-lockup" aria-label="Nexar home">
          <img className="brand-logo" src="/nexar-logo-exp.svg" alt="Nexar" />
        </div>
        <div className="auth-controls">
          {clerkConfigured && (
            <>
              <SignedOut>
                <SignInButton mode="modal">
                  <button className="button button-quiet" type="button">
                    Sign in
                  </button>
                </SignInButton>
                <SignUpButton mode="modal">
                  <button className="button button-primary" type="button">
                    Get started
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <UserButton />
              </SignedIn>
            </>
          )}
          {!clerkConfigured && (
            <button className="button button-quiet" type="button" disabled>
              Login unavailable
            </button>
          )}
        </div>
      </header>

      <section className="hero-panel" aria-labelledby="welcome-heading">
        <p className="eyebrow">Welcome to Nexar</p>
        <h1 id="welcome-heading">
          Move together,
          <br />
          move better.
        </h1>
        <p className="hero-copy">
          Your verified employee carpool, built around the commute you already
          make.
        </p>
        <div className="hero-actions">
          {clerkConfigured && (
            <>
              <SignedOut>
                <SignUpButton mode="modal">
                  <button
                    className="button button-primary button-large"
                    type="button"
                  >
                    Create your account
                  </button>
                </SignUpButton>
              </SignedOut>
              <SignedIn>
                <p className="signed-in-note">
                  You are signed in. Your commute workspace is ready.
                </p>
              </SignedIn>
            </>
          )}
          {!clerkConfigured && (
            <div className="auth-setup-note">
              <button
                className="button button-primary button-large"
                type="button"
                disabled
              >
                Login
              </button>
              <p>
                Add your Clerk publishable key to enable login and account
                creation.
              </p>
            </div>
          )}
        </div>
      </section>

      <footer className="trust-note">
        <span className="trust-dot" aria-hidden="true" />
        <span>Private by design. Built for verified colleagues.</span>
      </footer>
    </main>
  );
}
