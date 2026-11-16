import type { Metadata } from 'next';
import { Clients } from '@/features/clients/Clients';

export const metadata: Metadata = { title: 'Meus clientes' };
export default function ClientsPage() {
  return <Clients />;
}
