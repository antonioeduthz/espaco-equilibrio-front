'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, type ReactNode } from 'react';
import { dateKey, formatDate, initials } from '@/lib/dates';
import { DEMO_CLIENT_ID } from '@/lib/data';
import type { Perfil } from '@/lib/types';
import { useSession } from '@/state/SessionProvider';
import { Brand, Loading } from './ui';
import { Icon, type IconName } from './Icon';
import styles from './AppShell.module.css';

const navigation: Record<Perfil, { href: string; label: string; short: string; icon: IconName }[]> =
  {
    proprietario: [
      { href: '/proprietario', label: 'Visão geral', short: 'Visão geral', icon: 'grid' },
      {
        href: '/proprietario/agendar',
        label: 'Novo agendamento',
        short: 'Agendar',
        icon: 'calendar',
      },
      { href: '/proprietario/clientes', label: 'Meus clientes', short: 'Clientes', icon: 'users' },
      {
        href: '/proprietario/configuracoes',
        label: 'Configurações',
        short: 'Ajustes',
        icon: 'settings',
      },
    ],
    cliente: [
      { href: '/cliente/agendar', label: 'Agendar um cuidado', short: 'Agendar', icon: 'calendar' },
      {
        href: '/cliente/meus-horarios',
        label: 'Meus horários',
        short: 'Meus horários',
        icon: 'clock',
      },
    ],
  };

export function AppShell({ children, perfil }: { children: ReactNode; perfil: Perfil }) {
  const { state, ready, now, perform } = useSession();
  const pathname = usePathname().replace(/\/$/, '');
  const router = useRouter();
  useEffect(() => {
    if (!ready) return;
    if (!state.perfil) router.replace('/login');
    else if (state.perfil !== perfil)
      router.replace(state.perfil === 'cliente' ? '/cliente/agendar' : '/proprietario');
  }, [ready, state.perfil, perfil, router]);

  if (!ready || state.perfil !== perfil) return <Loading />;
  const client = state.clientes.find((item) => item.id === DEMO_CLIENT_ID)!;
  const name = perfil === 'proprietario' ? 'Marta Sátyl' : client.nome;
  const links = navigation[perfil];
  const active = links.find((item) => item.href === pathname);
  function logout() {
    perform({ type: 'profile/set', perfil: null });
    router.push('/login');
  }

  return (
    <div className={styles.shell}>
      <a href="#conteudo" className="skip-link">
        Ir para o conteúdo
      </a>
      <aside className={styles.sidebar}>
        <Link
          href={links[0].href}
          className={styles.brandLink}
          aria-label="Espaço Equilíbrio — início"
        >
          <Brand compact />
        </Link>
        <div className={styles.navGroup}>
          <p className={styles.navLabel}>
            {perfil === 'proprietario' ? 'MEU ESPAÇO' : 'SEU BEM-ESTAR'}
          </p>
          <nav aria-label="Navegação principal" className={styles.nav}>
            {links.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${styles.navLink} ${pathname === item.href ? styles.active : ''}`}
                aria-current={pathname === item.href ? 'page' : undefined}
              >
                <Icon name={item.icon} size={19} />
                <span>{item.label}</span>
                {pathname === item.href && <span className={styles.activeDot} />}
              </Link>
            ))}
          </nav>
        </div>
        <div className={styles.sideBottom}>
          <div className={styles.sideNote}>
            <Icon name="leaf" size={25} />
            <p>
              Cuidar de si é encontrar
              <br />o seu equilíbrio.
            </p>
            <span>UM MOMENTO. SÓ SEU.</span>
          </div>
          <div className={styles.profile}>
            <span className={styles.avatar}>{initials(name)}</span>
            <div>
              <strong>{name}</strong>
              <span>{perfil === 'proprietario' ? 'Proprietária' : 'Meu perfil'}</span>
            </div>
            <button
              type="button"
              className="icon-button"
              onClick={logout}
              aria-label="Sair e trocar perfil"
              title="Sair e trocar perfil"
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </div>
      </aside>
      <div className={styles.mainArea}>
        <header className={styles.topbar}>
          <div className={styles.breadcrumb}>
            <span>Meu espaço</span>
            <Icon name="chevron" size={13} />
            <strong>{active?.label ?? 'Agenda'}</strong>
          </div>
          <Link href={links[0].href} className={styles.mobileBrand}>
            <Brand compact />
          </Link>
          <div className={styles.topRight}>
            <span className={styles.today}>
              <Icon name="calendar" size={16} />
              {formatDate(dateKey(now), { day: '2-digit', month: 'short', year: 'numeric' })}
            </span>
            <span className={styles.topDivider} />
            <span className={styles.welcome}>Olá, {name.split(' ')[0]}</span>
            <span className={styles.smallAvatar}>{initials(name)}</span>
            <button
              type="button"
              className={`icon-button ${styles.mobileLogout}`}
              aria-label="Sair e trocar perfil"
              onClick={logout}
            >
              <Icon name="logout" size={18} />
            </button>
          </div>
        </header>
        <main id="conteudo" tabIndex={-1} className={styles.content}>
          {children}
        </main>
        <footer className={styles.footer}>
          <span>Marta Sátyl · Espaço Equilíbrio Corpo&Mente</span>
          <span>
            Feito para cuidar de você <Icon name="heart" size={12} />
          </span>
        </footer>
      </div>
      <nav className={styles.mobileNav} aria-label="Navegação no celular">
        {links.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={pathname === item.href ? styles.mobileActive : ''}
            aria-current={pathname === item.href ? 'page' : undefined}
          >
            <Icon name={item.icon} size={21} />
            <span>{item.short}</span>
          </Link>
        ))}
      </nav>
    </div>
  );
}
