'use client';

import { useRouter } from 'next/navigation';
import { Brand, Button, Field } from '@/components/ui';
import { Icon } from '@/components/Icon';
import { useSession } from '@/state/SessionProvider';
import type { Perfil } from '@/lib/types';
import styles from './Login.module.css';

export function Login() {
  const { ready, perform } = useSession();
  const router = useRouter();
  function enter(perfil: Perfil) {
    perform({ type: 'profile/set', perfil });
    router.push(perfil === 'cliente' ? '/cliente/agendar' : '/proprietario');
  }
  return (
    <main className={styles.page}>
      <section className={styles.welcome} aria-labelledby="welcome-title">
        <Brand />
        <div className={styles.welcomeContent}>
          <span className={styles.overline}>
            <span /> BEM-VINDA AO SEU MOMENTO
          </span>
          <h1 id="welcome-title">
            O equilíbrio
            <br />
            começa com
            <br />
            <em>um cuidado.</em>
          </h1>
          <p>
            Uma pausa na rotina.
            <br />
            Um encontro com você.
            <br />
            Um espaço para corpo e mente.
          </p>
          <div className={styles.signature}>
            <span className={styles.signatureLine} />
            <span>
              Com carinho, <i>Marta Sátyl</i>
            </span>
          </div>
        </div>
        <div className={styles.welcomeFooter}>
          <Icon name="leaf" size={17} />
          <span>CUIDADO QUE ACOLHE. EQUILÍBRIO QUE TRANSFORMA.</span>
        </div>
        <div className={styles.rings} aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
      <section className={styles.loginArea} aria-labelledby="login-title">
        <div className={styles.loginCard}>
          <span className={styles.entryIcon}>
            <Icon name="leaf" size={28} />
          </span>
          <p className="eyebrow">SEU ESPAÇO DE BEM-ESTAR</p>
          <h2 id="login-title">Que bom ter você aqui.</h2>
          <p className={styles.subtitle}>Entre e reserve um tempo para cuidar de você.</p>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              enter('cliente');
            }}
            noValidate
            className={styles.form}
          >
            <Field id="email" label="E-mail">
              <div className={styles.inputWrap}>
                <Icon name="mail" size={18} />
                <input id="email" type="email" placeholder="seu@email.com" autoComplete="email" />
              </div>
            </Field>
            <Field id="senha" label="Senha">
              <div className={styles.inputWrap}>
                <Icon name="lock" size={18} />
                <input
                  id="senha"
                  type="password"
                  placeholder="Digite sua senha"
                  autoComplete="current-password"
                />
              </div>
            </Field>
            <Button type="submit" disabled={!ready} className={styles.enter}>
              Entrar como cliente
              <Icon name="arrow" size={18} />
            </Button>
          </form>
          <p className={styles.demo}>
            <Icon name="info" size={14} />
            Para conhecer o espaço, basta clicar em entrar.
          </p>
          <div className={styles.divider}>
            <span />
            ÁREA DA PROPRIETÁRIA
            <span />
          </div>
          <Button
            variant="secondary"
            onClick={() => enter('proprietario')}
            disabled={!ready}
            className={styles.owner}
          >
            <Icon name="grid" size={16} />
            Acessar painel da proprietária
          </Button>
          <div className={styles.hours}>
            <Icon name="clock" size={16} />
            <span>Segunda a sábado · 08h às 18h</span>
          </div>
        </div>
        <p className={styles.copyright}>Marta Sátyl · Espaço Equilíbrio Corpo&Mente</p>
      </section>
    </main>
  );
}
