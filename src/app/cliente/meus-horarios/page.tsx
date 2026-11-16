import type { Metadata } from 'next';
import { MyAppointments } from '@/features/agenda/MyAppointments';

export const metadata: Metadata = { title: 'Meus horários' };
export default function AppointmentsPage() {
  return <MyAppointments />;
}
