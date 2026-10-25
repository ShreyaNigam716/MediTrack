
import { Suspense } from 'react';
import Shell from '@/components/Shell';

export default function AppLayout({ children }) {
  return (
    <Suspense fallback={<div className="p-8 text-slate-500">Loading…</div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
