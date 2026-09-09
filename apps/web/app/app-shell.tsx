'use client';

import { UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { href: '/home', label: 'Home', icon: '/icons/home.svg' },
  { href: '/trips', label: 'Trips', icon: '/icons/rides.svg' },
  { href: '/profile', label: 'Profile', icon: '/icons/account.svg' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <Link className="brand-lockup" href="/home" aria-label="Nexar home">
          <img className="brand-logo" src="/nexar-logo-exp.svg" alt="Nexar" />
        </Link>
        <nav className="app-nav-desktop" aria-label="Primary">
          {navItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                className={active ? 'app-nav-link active' : 'app-nav-link'}
                href={item.href}
                key={item.href}
                aria-current={active ? 'page' : undefined}
              >
                <img src={item.icon} alt="" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <UserButton />
      </header>

      <main className="app-main">{children}</main>

      <nav className="app-nav-mobile" aria-label="Primary">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              className={active ? 'app-nav-item active' : 'app-nav-item'}
              href={item.href}
              key={item.href}
              aria-current={active ? 'page' : undefined}
            >
              <img src={item.icon} alt="" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
