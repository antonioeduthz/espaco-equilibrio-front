'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { Calendar } from '@/components/Calendar';
import { Icon } from '@/components/Icon';
import { Button, ConfirmDialog, Dialog, EmptyState, Field, PageHeading } from '@/components/ui';
import { availableHours, getBookingError, isUpcoming } from '@/lib/agenda';
import { DEMO_CLIENT_ID, getService, HOURS, SERVICES } from '@/lib/data';
import { addDays, dateKey, formatDate, isDateKey, nextOpenDay } from '@/lib/dates';
import type { Agendamento } from '@/lib/types';
import { useSession } from '@/state/SessionProvider';
import styles from './Booking.module.css';

export function Booking({ owner = false }: { owner?: boolean }) {
  const params = useSearchParams();
  return (
    <BookingForm
      key={params.toString()}
      owner={owner}
      editId={owner ? params.get('editar') : null}
      prefillDate={params.get('data')}
      prefillHour={params.get('hora')}
    />
  );
}

function BookingForm({
  owner,
  editId,
  prefillDate,
  prefillHour,
}: {
  owner: boolean;
  editId: string | null;
  prefillDate: string | null;
  prefillHour: string | null;
}) {
  const { state, now, perform } = useSession();
  const router = useRouter();
  const original = editId ? state.agendamentos.find((item) => item.id === editId) : undefined;
  const today = dateKey(now);
  const [data, setData] = useState(() => {
    if (original) return original.data;
    if (prefillDate && isDateKey(prefillDate) && prefillDate >= today)
      return nextOpenDay(prefillDate);
    let day = nextOpenDay(today);
    for (let index = 0; index < 14 && availableHours(state, day, now).length === 0; index++)
      day = nextOpenDay(addDays(day, 1));
    return day;
  });
  const [hora, setHora] = useState(
    original?.hora ?? (prefillHour && HOURS.includes(prefillHour) ? prefillHour : ''),
  );
  const [servicoId, setServicoId] = useState(original?.servicoId ?? SERVICES[0].id);
  const [clienteId, setClienteId] = useState<string | null>(
    original?.clienteId ?? (owner ? null : DEMO_CLIENT_ID),
  );
  const [serviceOpen, setServiceOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const hours = useMemo(
    () => availableHours(state, data, now, editId ?? undefined),
    [state, data, now, editId],
  );
  const service = getService(servicoId);
  const client = state.clientes.find((item) => item.id === clienteId);
  const selectedHour = hours.includes(hora) ? hora : '';
  const backHref = owner ? '/proprietario' : '/cliente/meus-horarios';

  if (editId && (!original || !isUpcoming(original, now)))
    return (
      <div className="surface">
        <EmptyState
          title="Essa sessão não pode ser reagendada"
          description="Escolha uma sessão futura e confirmada no painel da agenda."
          action={
            <Link href="/proprietario" className="button button-primary">
              Voltar à agenda
            </Link>
          }
        />
      </div>
    );

  function requestConfirmation() {
    const validation = getBookingError(
      state,
      { data, hora: selectedHour, servicoId, clienteId },
      new Date(),
      editId ?? undefined,
    );
    if (validation) {
      setError(validation);
      return;
    }
    setError('');
    setConfirmOpen(true);
  }

  function save() {
    const appointment: Agendamento = {
      id: editId ?? crypto.randomUUID(),
      clienteId,
      servicoId,
      data,
      hora: selectedHour,
      status: 'confirmado',
    };
    if (
      perform(
        { type: 'appointment/save', agendamento: appointment, now: Date.now() },
        editId
          ? 'Sessão reagendada. Seu novo horário está reservado!'
          : 'Agendamento confirmado. Esperamos por você!',
      )
    ) {
      setConfirmOpen(false);
      router.push(owner ? `/proprietario?data=${data}` : '/cliente/meus-horarios');
    } else {
      setConfirmOpen(false);
    }
  }

  return (
    <>
      <PageHeading
        eyebrow={owner ? 'CUIDADO EM CADA DETALHE' : 'RESERVE UM TEMPO PARA VOCÊ'}
        title={
          editId
            ? 'Um novo momento de cuidado.'
            : owner
              ? 'Vamos agendar um cuidado?'
              : 'Seu próximo momento de equilíbrio.'
        }
        description={
          editId
            ? 'Escolha o novo dia e horário. O restante a gente prepara com carinho.'
            : 'Escolha seu cuidado, encontre o melhor horário e deixe o resto com a gente.'
        }
        action={
          <Link href={backHref} className="button button-secondary">
            <Icon name={owner ? 'grid' : 'clock'} size={16} />
            {owner ? 'Voltar à agenda' : 'Meus horários'}
          </Link>
        }
      />
      <div className={styles.steps} aria-label="Etapas do agendamento">
        <span>
          <b>01</b> Seu cuidado
        </span>
        <i />
        <span>
          <b>02</b> Dia e horário
        </span>
        <i />
        <span className={styles.lastStep}>
          <b>03</b> Confirmação
        </span>
      </div>
      <div className={styles.layout}>
        <div className={styles.main}>
          {owner && (
            <section className={`surface ${styles.clientSection}`}>
              <Field id="booking-client" label="Para quem é esse cuidado?">
                <select
                  id="booking-client"
                  value={clienteId ?? ''}
                  onChange={(event) => setClienteId(event.target.value || null)}
                >
                  <option value="">Novo cliente · sem cadastro</option>
                  {state.clientes
                    .filter((item) => item.ativo || item.id === original?.clienteId)
                    .map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nome}
                        {item.ativo ? '' : ' (inativo)'}
                      </option>
                    ))}
                </select>
              </Field>
              <p>Você pode reservar o horário e cadastrar o cliente depois.</p>
            </section>
          )}
          <section className={`surface ${styles.section}`} aria-labelledby="service-title">
            <div className={styles.sectionTitle}>
              <span className={styles.sectionNumber}>01</span>
              <h2 id="service-title">Escolha seu cuidado</h2>
            </div>
            <button
              type="button"
              className={styles.selectedService}
              onClick={() => setServiceOpen(true)}
              aria-haspopup="dialog"
            >
              <span className={`${styles.serviceIcon} ${styles[service.cor]}`}>
                <Icon name={service.id === 'reflexologia' ? 'spark' : 'leaf'} size={28} />
              </span>
              <span className={styles.serviceText}>
                <span className="eyebrow">{service.categoria}</span>
                <strong>{service.nome}</strong>
                <span>
                  <Icon name="clock" size={13} />
                  {service.duracao} minutos de cuidado
                </span>
              </span>
              <span className={styles.changeService}>
                Alterar
                <Icon name="chevron" size={15} />
              </span>
            </button>
          </section>
          <section className={`surface ${styles.section}`} aria-labelledby="date-title">
            <div className={styles.sectionTitle}>
              <span className={styles.sectionNumber}>02</span>
              <h2 id="date-title">Encontre o seu momento</h2>
            </div>
            <div className={styles.dateTime}>
              <div className={styles.calendarWrap}>
                <Calendar
                  value={data}
                  minDate={today}
                  onChange={(value) => {
                    setData(value);
                    setHora('');
                    setError('');
                  }}
                />
              </div>
              <div className={styles.timeWrap}>
                <h3>Horários disponíveis</h3>
                <p className={styles.selectedDate}>
                  {formatDate(data, { weekday: 'long', day: 'numeric', month: 'short' })}
                </p>
                {hours.length ? (
                  <>
                    <div className={styles.times} role="group" aria-label="Horários disponíveis">
                      {HOURS.map((hour) => (
                        <button
                          type="button"
                          key={hour}
                          disabled={!hours.includes(hour)}
                          aria-pressed={selectedHour === hour}
                          onClick={() => {
                            setHora(hour);
                            setError('');
                          }}
                          className={selectedHour === hour ? styles.timeSelected : ''}
                        >
                          {hour}
                          {selectedHour === hour && <Icon name="check" size={13} />}
                        </button>
                      ))}
                    </div>
                    <span className={styles.timeHint}>
                      <span /> Horários no seu horário local
                    </span>
                  </>
                ) : (
                  <div className={styles.noHours}>
                    <Icon name="clock" size={25} />
                    <strong>Uma pausa por aqui.</strong>
                    <p>Não há horários disponíveis neste dia. Escolha outra data no calendário.</p>
                  </div>
                )}
              </div>
            </div>
          </section>
          <div className={styles.careNote}>
            <Icon name="heart" size={19} />
            <span>
              Seu bem-estar merece um lugar na agenda.
              <br />
              <strong>Estamos preparando tudo para receber você.</strong>
            </span>
          </div>
        </div>
        <aside className={styles.summary}>
          <div className={`surface ${styles.summaryCard}`}>
            <div className={styles.summaryTop}>
              <Icon name="leaf" size={28} />
              <p className="eyebrow">UM TEMPO SÓ SEU</p>
              <h2>Seu agendamento</h2>
              <p>Cada detalhe pensado para você.</p>
            </div>
            <dl className={styles.details}>
              <div>
                <dt>
                  <Icon name="spark" size={16} />
                  Cuidado
                </dt>
                <dd>{service.nome}</dd>
              </div>
              {owner && (
                <div>
                  <dt>
                    <Icon name="user" size={16} />
                    Cliente
                  </dt>
                  <dd>{client?.nome ?? 'Novo cliente'}</dd>
                </div>
              )}
              <div>
                <dt>
                  <Icon name="calendar" size={16} />
                  Data
                </dt>
                <dd>{formatDate(data, { day: 'numeric', month: 'long', year: 'numeric' })}</dd>
              </div>
              <div>
                <dt>
                  <Icon name="clock" size={16} />
                  Horário
                </dt>
                <dd className={!selectedHour ? styles.pending : ''}>
                  {selectedHour
                    ? `${selectedHour} · ${service.duracao} minutos`
                    : 'Escolha um horário'}
                </dd>
              </div>
            </dl>
            {!owner && client && !client.ativo && (
              <p className="notice notice-error">
                Seu cadastro está inativo. A proprietária pode reativá-lo na área de clientes.
              </p>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <Button
              className={styles.confirmButton}
              onClick={requestConfirmation}
              disabled={!selectedHour || (!owner && !client?.ativo)}
            >
              {editId ? 'Reagendar sessão' : 'Confirmar agendamento'}
              <Icon name="arrow" size={17} />
            </Button>
            <p className={styles.summaryHint}>
              <Icon name="info" size={13} />
              Você poderá revisar antes de confirmar.
            </p>
          </div>
          <div className={styles.opening}>
            <Icon name="clock" size={18} />
            <div>
              <strong>Nosso horário de acolhimento</strong>
              <p>
                Segunda a sábado, das 08h às 18h.
                <br />
                Última sessão às 17h.
              </p>
            </div>
          </div>
        </aside>
      </div>
      <Dialog
        open={serviceOpen}
        title="Qual cuidado combina com você?"
        description="Reserve uma hora para desacelerar e se reconectar."
        drawer
        onClose={() => setServiceOpen(false)}
      >
        <div className={styles.serviceOptions}>
          {SERVICES.map((item) => (
            <button
              type="button"
              className={`${styles.serviceOption} ${servicoId === item.id ? styles.optionSelected : ''}`}
              key={item.id}
              aria-pressed={servicoId === item.id}
              onClick={() => {
                setServicoId(item.id);
                setServiceOpen(false);
              }}
            >
              <span className={`${styles.serviceIcon} ${styles[item.cor]}`}>
                <Icon name={item.id === 'reflexologia' ? 'spark' : 'leaf'} size={25} />
              </span>
              <span>
                <span className="eyebrow">{item.categoria}</span>
                <strong>{item.nome}</strong>
                <p>{item.descricao}</p>
                <small>
                  <Icon name="clock" size={12} />
                  {item.duracao} minutos
                </small>
              </span>
              {servicoId === item.id && <Icon name="check" size={17} />}
            </button>
          ))}
        </div>
        <p className="notice">
          <Icon name="heart" size={17} />
          Cada sessão é um convite para cuidar de você com calma e presença.
        </p>
      </Dialog>
      <ConfirmDialog
        open={confirmOpen}
        title={editId ? 'Confirmar novo horário?' : 'Podemos reservar esse momento?'}
        description={
          editId
            ? 'O horário anterior será liberado e sua sessão ficará reservada na nova data.'
            : 'Confira os detalhes. Ao confirmar, esse horário fica reservado na nossa agenda.'
        }
        confirmLabel={editId ? 'Sim, reagendar' : 'Sim, agendar'}
        onClose={() => setConfirmOpen(false)}
        onConfirm={save}
      >
        <div className={styles.confirmSummary}>
          <strong>{service.nome}</strong>
          <span>{owner ? (client?.nome ?? 'Novo cliente') : client?.nome}</span>
          <span>
            {formatDate(data, { weekday: 'long', day: 'numeric', month: 'long' })} · {selectedHour}
          </span>
          <span>{service.duracao} minutos</span>
        </div>
      </ConfirmDialog>
    </>
  );
}
