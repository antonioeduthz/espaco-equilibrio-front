import type { Metadata } from 'next';
import { SessionProvider } from '@/state/SessionProvider';
import './globals.css';

export const metadata: Metadata = {
  title: { default: 'Espaço Equilíbrio | Marta Sátyl', template: '%s | Espaço Equilíbrio' },
  description:
    'Seu momento de cuidado, leveza e equilíbrio. Agende sua sessão no Espaço Equilíbrio Corpo&Mente de Marta Sátyl.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" data-scroll-behavior="smooth">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
