import type { Metadata } from 'next';
import { Login } from '@/features/auth/Login';

export const metadata: Metadata = { title: 'Bem-vindo' };
export default function LoginPage() {
  return <Login />;
}
