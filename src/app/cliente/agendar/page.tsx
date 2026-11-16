import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Booking } from '@/features/agenda/Booking';
import { Loading } from '@/components/ui';

export const metadata: Metadata = { title: 'Agendar um cuidado' };
export default function BookingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Booking />
    </Suspense>
  );
}
