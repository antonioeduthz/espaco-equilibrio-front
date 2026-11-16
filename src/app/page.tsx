'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/state/SessionProvider';
import { Loading } from '@/components/ui';

export default function Home() {
  const { state, ready } = useSession();
  const router = useRouter();
  useEffect(() => {
    if (ready)
      router.replace(
        state.perfil === 'proprietario'
          ? '/proprietario'
          : state.perfil === 'cliente'
            ? '/cliente/agendar'
            : '/login',
      );
  }, [state.perfil, ready, router]);
  return <Loading />;
}
