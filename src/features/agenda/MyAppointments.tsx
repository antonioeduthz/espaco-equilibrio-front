'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Icon } from '@/components/Icon';
import { Button, EmptyState, PageHeading } from '@/components/ui';
import { DEMO_CLIENT_ID, getService } from '@/lib/data';
import { formatDate, startTime } from '@/lib/dates';
import { isUpcoming } from '@/lib/agenda';
import type { Agendamento } from '@/lib/types';
import { useSession } from '@/state/SessionProvider';
import { CancelAppointmentDialog } from './CancelAppointmentDialog';
import styles from './MyAppointments.module.css';

export function MyAppointments() {
  const { state, now } = useSession();
  const [cancel, setCancel] = useState<Agendamento | null>(null);
  const { upcoming, history } = useMemo(() => {
    const own = state.agendamentos.filter((item) => item.clienteId === DEMO_CLIENT_ID);
    const sort = (a: Agendamento, b: Agendamento) =>
      startTime(a.data, a.hora) - startTime(b.data, b.hora);
    return {
      upcoming: own.filter((item) => isUpcoming(item, now)).sort(sort),
      history: own.filter((item) => !isUpcoming(item, now)).sort((a, b) => sort(b, a)),
    };
  }, [state.agendamentos, now]);

  function card(appointment: Agendamento, past = false) {
    const service = getService(appointment.servicoId);
    return (
      <article key={appointment.id} className={`${styles.card} surface ${past ? styles.past : ''}`}>
        <div className={styles.date}>
          <strong>{formatDate(appointment.data, { day: '2-digit' })}</strong>
          <span>{formatDate(appointment.data, { month: 'short' }).replace('.', '')}</span>
        </div>
        <div className={styles.cardInfo}>
          <span
            className={`badge badge-${past ? (appointment.status === 'cancelado' ? 'danger' : 'muted') : service.cor}`}
          >
            {past
              ? appointment.status === 'cancelado'
                ? 'Cancelado'
                : 'Horário passado'
              : 'Confirmado'}
          </span>
          <h3>{service.nome}</h3>
          <p>
            <Icon name="calendar" size={14} />
            {formatDate(appointment.data, {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
            <span className={styles.dot}>·</span>
            <Icon name="clock" size={14} />
            {appointment.hora} <span className={styles.duration}>({service.duracao} min)</span>
          </p>
          <span className={styles.professional}>Com Marta Sátyl</span>
        </div>
        {!past && (
          <Button
            variant="ghost"
            className={styles.cancel}
            onClick={() => setCancel(appointment)}
            aria-label={`Cancelar ${service.nome} em ${formatDate(appointment.data)} às ${appointment.hora}`}
          >
            <Icon name="close" size={15} />
            Cancelar sessão
          </Button>
        )}
      </article>
    );
  }

  return (
    <>
      <PageHeading
        eyebrow="CUIDADO COM HORA MARCADA"
        title="Um tempo reservado para você."
        description="Acompanhe seus próximos encontros e os momentos de cuidado que já passaram."
        action={
          <Link className="button button-primary" href="/cliente/agendar">
            <Icon name="plus" size={17} />
            Agendar um cuidado
          </Link>
        }
      />
      <div className={styles.nextNote}>
        <span>
          <Icon name="leaf" size={30} />
        </span>
        <div>
          <p className="eyebrow">SUA PAUSA NA ROTINA</p>
          <h2>
            {upcoming.length
              ? 'Seu próximo encontro está chegando.'
              : 'Sempre há espaço para um novo cuidado.'}
          </h2>
          <p>
            {upcoming.length
              ? 'Chegue com alguns minutos de antecedência e aproveite esse momento com calma.'
              : 'Escolha um dia, encontre um horário e venha se reconectar com você.'}
          </p>
        </div>
      </div>
      <section className={styles.section} aria-labelledby="upcoming-title">
        <div className={styles.sectionHeader}>
          <h2 id="upcoming-title">
            Próximos encontros <span>{upcoming.length}</span>
          </h2>
          <span>Seus cuidados confirmados</span>
        </div>
        <div className={styles.cards}>
          {upcoming.length ? (
            upcoming.map((item) => card(item))
          ) : (
            <div className="surface">
              <EmptyState
                title="Sua agenda está livre"
                description="Que tal reservar seu próximo momento de equilíbrio?"
                action={
                  <Link href="/cliente/agendar" className="button button-primary">
                    Escolher um horário
                    <Icon name="arrow" size={16} />
                  </Link>
                }
              />
            </div>
          )}
        </div>
      </section>
      <section className={styles.section} aria-labelledby="history-title">
        <div className={styles.sectionHeader}>
          <h2 id="history-title">
            Seu histórico <span>{history.length}</span>
          </h2>
          <span>Sessões anteriores e canceladas</span>
        </div>
        <div className={styles.cards}>
          {history.length ? (
            history.map((item) => card(item, true))
          ) : (
            <p className={styles.emptyHistory}>Seus momentos de cuidado aparecerão aqui.</p>
          )}
        </div>
      </section>
      <CancelAppointmentDialog appointment={cancel} onClose={() => setCancel(null)} />
    </>
  );
}
