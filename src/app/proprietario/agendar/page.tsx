import { Suspense } from 'react';
import type { Metadata } from 'next';
import { Booking } from '@/features/agenda/Booking';
import { Loading } from '@/components/ui';

export const metadata: Metadata = { title: 'Novo agendamento' };
export default function OwnerBookingPage() {
  return (
    <Suspense fallback={<Loading />}>
      <Booking owner />
    </Suspense>
  );
}
