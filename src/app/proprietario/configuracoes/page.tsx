import type { Metadata } from 'next';
import { Settings } from '@/features/settings/Settings';

export const metadata: Metadata = { title: 'Configurações' };

export default function SettingsPage() {
  return <Settings />;
}
