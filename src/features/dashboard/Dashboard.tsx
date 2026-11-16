'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Calendar } from '@/components/Calendar';
import { Icon } from '@/components/Icon';
import { EmptyState, PageHeading } from '@/components/ui';
import { dashboardStats, isUpcoming } from '@/lib/agenda';
import { getService, HOURS } from '@/lib/data';
import {
  addDays,
  dateKey,
  formatDate,
  initials,
  isDateKey,
  isOpenDay,
  startTime,
} from '@/lib/dates';
import type { Agendamento } from '@/lib/types';
import { useSession } from '@/state/SessionProvider';
import { CancelAppointmentDialog } from '@/features/agenda/CancelAppointmentDialog';
import styles from './Dashboard.module.css';

export function Dashboard() {
  const params = useSearchParams();
  return <DashboardContent key={params.toString()} initialDate={params.get('data')} />;
}

function DashboardContent({ initialDate }: { initialDate: string | null }) {
  const { state, now } = useSession();
  const today = dateKey(now);
  const [day, setDay] = useState(initialDate && isDateKey(initialDate) ? initialDate : today);
  const [cancel, setCancel] = useState<Agendamento | null>(null);
  const stats = useMemo(() => dashboardStats(state, today), [state, today]);
  const appointments = useMemo(
    () => state.agendamentos.filter((appointment) => appointment.status === 'confirmado'),
    [state.agendamentos],
  );
  const byHour = new Map(
    appointments
      .filter((appointment) => appointment.data === day)
      .map((appointment) => [appointment.hora, appointment]),
  );
  const marks = [...new Set(appointments.map((appointment) => appointment.data))];
  const upcoming = appointments
    .filter((appointment) => isUpcoming(appointment, now))
    .sort((a, b) => startTime(a.data, a.hora) - startTime(b.data, b.hora))[0];
  const upcomingClient = state.clientes.find((client) => client.id === upcoming?.clienteId);
  const remaining = isOpenDay(day)
    ? HOURS.filter((hour) => !byHour.has(hour) && startTime(day, hour) > now.getTime()).length
    : 0;

  return (
    <>
      <PageHeading
        eyebrow="BEM-VINDA AO SEU ESPAÇO"
        title="Seu dia, em equilíbrio."
        description="Um olhar para sua agenda, mais tempo para cuidar de quem chega."
        action={
          <Link href="/proprietario/agendar" className="button button-primary">
            <Icon name="plus" size={17} />
            Novo agendamento
          </Link>
        }
      />
      <div className={styles.stats}>
        <article className={`surface ${styles.stat}`}>
          <div>
            <span>Sessões de hoje</span>
            <strong>{String(stats.today).padStart(2, '0')}</strong>
            <p>{formatDate(today, { weekday: 'long', day: 'numeric', month: 'short' })}</p>
          </div>
          <span className={`${styles.statIcon} ${styles.sage}`}>
            <Icon name="calendar" size={22} />
          </span>
        </article>
        <article className={`surface ${styles.stat}`}>
          <div>
            <span>Próximos 7 dias</span>
            <strong>{String(stats.week).padStart(2, '0')}</strong>
            <p>
              Encontros de hoje até{' '}
              {formatDate(addDays(today, 6), { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <span className={`${styles.statIcon} ${styles.gold}`}>
            <Icon name="clock" size={22} />
          </span>
        </article>
        <article className={`surface ${styles.stat}`}>
          <div>
            <span>Clientes ativos</span>
            <strong>{String(stats.clients).padStart(2, '0')}</strong>
            <Link href="/proprietario/clientes" className="text-link">
              Cuidar dos cadastros
              <Icon name="arrow" size={13} />
            </Link>
          </div>
          <span className={`${styles.statIcon} ${styles.rose}`}>
            <Icon name="users" size={22} />
          </span>
        </article>
      </div>
      <div className={styles.layout}>
        <section className={`surface ${styles.agenda}`} aria-labelledby="agenda-title">
          <div className={styles.agendaHeader}>
            <div>
              <p className="eyebrow">CADA ENCONTRO IMPORTA</p>
              <h2 id="agenda-title">
                Agenda do dia <span>{byHour.size} sessões</span>
              </h2>
            </div>
            <div className={styles.dayNav}>
              <button
                type="button"
                className="icon-button"
                aria-label="Dia anterior"
                onClick={() => setDay(addDays(day, -1))}
              >
                <Icon name="chevron" size={15} style={{ transform: 'rotate(180deg)' }} />
              </button>
              <button type="button" onClick={() => setDay(today)} className={styles.todayButton}>
                Hoje
              </button>
              <button
                type="button"
                className="icon-button"
                aria-label="Próximo dia"
                onClick={() => setDay(addDays(day, 1))}
              >
                <Icon name="chevron" size={15} />
              </button>
            </div>
          </div>
          <div className={styles.agendaSub}>
            <span>
              <Icon name="calendar" size={14} />
              {formatDate(day, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </span>
            <span className={styles.freeIndicator}>
              <i />
              {remaining} horários livres
            </span>
          </div>
          {isOpenDay(day) ? (
            <div className={styles.timeline}>
              {HOURS.map((hour) => {
                const appointment = byHour.get(hour);
                const service = appointment ? getService(appointment.servicoId) : null;
                const client = appointment
                  ? state.clientes.find((item) => item.id === appointment.clienteId)
                  : null;
                const past = startTime(day, hour) <= now.getTime();
                const name = client?.nome ?? 'Novo cliente';
                return (
                  <div className={styles.row} key={hour}>
                    <span className={styles.time}>{hour}</span>
                    {appointment && service ? (
                      <article className={`${styles.session} ${styles[service.cor]}`}>
                        <span className={styles.sessionAvatar}>
                          {client ? initials(client.nome) : <Icon name="user" size={18} />}
                        </span>
                        <div className={styles.sessionInfo}>
                          <h3>{name}</h3>
                          <span>
                            {service.nome}
                            <span> · </span>
                            {service.duracao} min
                          </span>
                        </div>
                        <span
                          className={`${styles.sessionBadge} badge badge-${past ? 'muted' : service.cor}`}
                        >
                          {past ? 'Horário passado' : 'Confirmado'}
                        </span>
                        <div className={styles.sessionActions}>
                          {!past && (
                            <>
                              <Link
                                href={`/proprietario/agendar?editar=${appointment.id}`}
                                className="icon-button"
                                aria-label={`Reagendar sessão de ${name} às ${hour}`}
                                title="Reagendar"
                              >
                                <Icon name="edit" size={16} />
                              </Link>
                              <button
                                type="button"
                                className={`icon-button ${styles.cancelButton}`}
                                onClick={() => setCancel(appointment)}
                                aria-label={`Cancelar sessão de ${name} às ${hour}`}
                                title="Cancelar"
                              >
                                <Icon name="close" size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </article>
                    ) : (
                      <div className={`${styles.emptySlot} ${past ? styles.pastSlot : ''}`}>
                        <span>{past ? 'Horário encerrado' : 'Um espaço para cuidar'}</span>
                        {!past && (
                          <Link
                            className={styles.bookLink}
                            href={`/proprietario/agendar?data=${day}&hora=${hour}`}
                            aria-label={`Agendar em ${formatDate(day)} às ${hour}`}
                          >
                            <Icon name="plus" size={14} />
                            Agendar
                          </Link>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState
              title="Domingo é dia de pausa."
              description="O espaço atende de segunda a sábado. Selecione outro dia para organizar seus próximos encontros."
              icon="leaf"
            />
          )}
          <div className={styles.agendaFooter}>
            <Icon name="info" size={13} />
            Cada sessão tem duração de 60 minutos.
          </div>
        </section>
        <aside className={styles.side}>
          <div className={`surface ${styles.calendarPanel}`}>
            <Calendar key={day.slice(0, 7)} value={day} onChange={setDay} markedDates={marks} />
          </div>
          <div className={styles.nextSession}>
            <div className={styles.nextLabel}>
              <span />
              <span>PRÓXIMO ENCONTRO</span>
              <Icon name="leaf" size={19} />
            </div>
            {upcoming ? (
              <>
                <h3>{upcomingClient?.nome ?? 'Novo cliente'}</h3>
                <p>{getService(upcoming.servicoId).nome}</p>
                <div className={styles.nextWhen}>
                  <span>
                    <Icon name="calendar" size={14} />
                    {upcoming.data === today
                      ? 'Hoje'
                      : formatDate(upcoming.data, { day: 'numeric', month: 'short' })}
                  </span>
                  <span>
                    <Icon name="clock" size={14} />
                    {upcoming.hora}
                  </span>
                </div>
                <Link href={`/proprietario/agendar?editar=${upcoming.id}`} className="text-link">
                  Ver e reagendar
                  <Icon name="arrow" size={14} />
                </Link>
              </>
            ) : (
              <>
                <h3>Uma agenda leve.</h3>
                <p>Seus próximos encontros aparecerão aqui.</p>
                <Link href="/proprietario/agendar" className="text-link">
                  Criar agendamento
                  <Icon name="arrow" size={14} />
                </Link>
              </>
            )}
          </div>
          <div className={styles.quote}>
            <Icon name="spark" size={23} />
            <p>
              “Cuidar é criar espaço
              <br />
              para o outro florescer.”
            </p>
            <span>UM DIA DE CADA VEZ.</span>
          </div>
        </aside>
      </div>
      <CancelAppointmentDialog appointment={cancel} onClose={() => setCancel(null)} />
    </>
  );
}
