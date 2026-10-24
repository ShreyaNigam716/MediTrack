'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getUser, logout } from '@/lib/auth';
import { NAV, ROLE_LABEL } from '@/lib/nav';

const UserContext = createContext(null);
export const useUser = () => useContext(UserContext);

export default function Shell({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const u = getUser();
    if (!u || !localStorage.getItem('token')) router.replace('/login');
    else setUser(u);
  }, [router]);

  if (!user) return <div className="p-8 text-slate-500">Loading…</div>;

  const links = NAV[user.role] || [];

  return (
    <UserContext.Provider value={user}>
      <div className="min-h-screen md:flex">
        {open && (
          <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} />
        )}

        <aside
          className={`fixed inset-y-0 left-0 z-30 flex w-60 shrink-0 flex-col bg-teal-800 text-white transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${
            open ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <div className="px-5 py-5 text-xl font-bold tracking-tight">MediTrack</div>

          <nav className="flex-1 space-y-1 px-3">
            {links.map((l) => {
              const active =
                pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href));
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={`block rounded-lg px-3 py-2 text-sm ${
                    active ? 'bg-white/20 font-medium' : 'text-teal-50 hover:bg-white/10'
                  }`}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-white/20 p-4 text-sm">
            <p className="font-medium">{user.name}</p>
            <p className="text-teal-200">{ROLE_LABEL[user.role]}</p>
            <button
              onClick={logout}
              className="mt-3 w-full rounded-lg bg-white/10 px-3 py-1.5 hover:bg-white/20"
            >
              Log out
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="flex items-center gap-3 border-b bg-white px-4 py-3 md:hidden">
            <button onClick={() => setOpen(true)} className="rounded border px-2 py-1 text-sm">
              Menu
            </button>
            <span className="font-semibold text-teal-800">MediTrack</span>
          </header>
          <main className="mx-auto max-w-6xl p-4 md:p-8">{children}</main>
        </div>
      </div>
    </UserContext.Provider>
  );
}