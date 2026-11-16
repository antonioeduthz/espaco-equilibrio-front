import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Loading } from '@/components/ui';
import { Dashboard } from '@/features/dashboard/Dashboard';

export const metadata: Metadata = { title: 'Visão geral' };
export default function DashboardPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Dashboard />
    </Suspense>
  );
}
