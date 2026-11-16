'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { Icon, type IconName } from '@/components/Icon';
import { Button, Dialog, Field, PageHeading } from '@/components/ui';
import { dateKey, formatDate, startTime } from '@/lib/dates';
import { useSession } from '@/state/SessionProvider';
import styles from './Settings.module.css';

type Section = 'absence' | 'confirmation' | 'hours' | 'birthday';
const weekdays = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
];
const sections: {
  id: Section;
  title: string;
  description: string;
  action: string;
  icon: IconName;
}[] = [
  {
    id: 'absence',
    title: 'Férias e ausências',
    description:
      'Reserve um tempo para você e organize os atendimentos que precisam de uma nova data.',
    action: 'Programar ausência',
    icon: 'leaf',
  },
  {
    id: 'confirmation',
    title: 'Confirmação por WhatsApp',
    description: 'Escolha quando lembrar seus clientes e personalize a mensagem de confirmação.',
    action: 'Configurar confirmação',
    icon: 'phone',
  },
  {
    id: 'hours',
    title: 'Dias e horários',
    description: 'Organize sua semana com os dias e horários em que deseja receber seus clientes.',
    action: 'Ajustar disponibilidade',
    icon: 'clock',
  },
  {
    id: 'birthday',
    title: 'Mensagem de aniversário',
    description: 'Prepare um carinho especial para acompanhar seus clientes no dia do aniversário.',
    action: 'Personalizar mensagem',
    icon: 'heart',
  },
];

const initialSettings = {
  absence: {
    start: '',
    end: '',
    message:
      'Olá, $USER! Estarei ausente de $INICIO a $FIM. Se você tem uma sessão nesse período, vamos combinar uma nova data?',
  },
  confirmation: {
    advance: '24',
    message:
      'Olá, $USER! Sua sessão no Espaço Equilíbrio está marcada para $DATA às $HORA. Podemos confirmar sua presença?',
  },
  hours: weekdays.map((day, index) => ({
    day,
    enabled: index !== 0,
    start: '08:00',
    end: '18:00',
  })),
  birthday: {
    enabled: true,
    message:
      'Feliz aniversário, $USER! Que seu novo ciclo tenha muito equilíbrio, saúde e momentos de cuidado. Com carinho, Marta Sátyl.',
  },
};

export function Settings() {
  const { state, now } = useSession();
  const [saved, setSaved] = useState(initialSettings);
  const [draft, setDraft] = useState(initialSettings);
  const [section, setSection] = useState<Section | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const today = dateKey(now);
  const current = sections.find((item) => item.id === section);
  const affected = state.agendamentos
    .filter(
      (item) =>
        item.status === 'confirmado' &&
        item.data >= draft.absence.start &&
        item.data <= draft.absence.end &&
        startTime(item.data, item.hora) > now.getTime(),
    )
    .sort((a, b) => `${a.data}${a.hora}`.localeCompare(`${b.data}${b.hora}`));

  function open(id: Section) {
    setDraft(saved);
    setError('');
    setSection(id);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      section === 'absence' &&
      (draft.absence.start < today || draft.absence.end < draft.absence.start)
    ) {
      setError(
        'Escolha um período a partir de hoje, com a data final igual ou posterior à inicial.',
      );
      return;
    }
    if (section === 'hours' && draft.hours.some((day) => day.enabled && day.end <= day.start)) {
      setError('O horário final deve ser posterior ao inicial em cada dia de atendimento.');
      return;
    }
    const message =
      section === 'absence'
        ? draft.absence.message
        : section === 'confirmation'
          ? draft.confirmation.message
          : section === 'birthday'
            ? draft.birthday.message
            : null;
    if (message !== null && !message.trim()) {
      setError('Escreva uma mensagem para visualizar esta configuração.');
      return;
    }
    setSaved(draft);
    setNotice(`${current?.title}: prévia atualizada nesta página.`);
    setSection(null);
  }

  function summary(id: Section) {
    if (id === 'absence')
      return saved.absence.start
        ? `${formatDate(saved.absence.start)} a ${formatDate(saved.absence.end)}`
        : 'Nenhuma ausência programada';
    if (id === 'confirmation')
      return `${saved.confirmation.advance === '24' ? '1 dia' : '4 horas'} antes da sessão`;
    if (id === 'hours')
      return `${saved.hours.filter((day) => day.enabled).length} dias de atendimento por semana`;
    return saved.birthday.enabled
      ? 'Mensagem de aniversário ativada'
      : 'Mensagem de aniversário desativada';
  }

  const message =
    section === 'absence'
      ? draft.absence.message
      : section === 'confirmation'
        ? draft.confirmation.message
        : draft.birthday.message;
  const preview = message
    .replaceAll('$USER', 'Ana')
    .replaceAll('$INICIO', draft.absence.start ? formatDate(draft.absence.start) : '[data inicial]')
    .replaceAll('$FIM', draft.absence.end ? formatDate(draft.absence.end) : '[data final]')
    .replaceAll('$DATA', formatDate(today))
    .replaceAll('$HORA', '14:00');

  return (
    <>
      <PageHeading
        eyebrow="DO SEU JEITO"
        title="Configurações"
        description="Cuide da sua rotina e de cada detalhe da comunicação com seus clientes."
      />
      <div className={styles.banner}>
        <span className={styles.bannerIcon}>
          <Icon name="settings" size={28} />
        </span>
        <div>
          <h2>Seu espaço, no seu ritmo.</h2>
          <p>Mais organização para a agenda. Mais cuidado em cada mensagem.</p>
        </div>
      </div>
      <p className={styles.demo}>
        <Icon name="info" size={16} /> Demonstração: as opções permitem explorar o layout. As
        prévias valem enquanto esta página estiver aberta, sem enviar mensagens ou alterar a agenda.
      </p>
      {notice && (
        <p className={styles.notice} role="status">
          <Icon name="check" size={17} />
          {notice}
        </p>
      )}
      <div className={styles.grid}>
        {sections.map((item) => (
          <section className={styles.card} key={item.id}>
            <span className={`${styles.cardIcon} ${styles[item.id]}`}>
              <Icon name={item.icon} size={24} />
            </span>
            <h2>{item.title}</h2>
            <p>{item.description}</p>
            <span className={styles.summary}>{summary(item.id)}</span>
            <Button variant="secondary" onClick={() => open(item.id)} aria-haspopup="dialog">
              {item.action}
              <Icon name="arrow" size={16} />
            </Button>
          </section>
        ))}
      </div>
      <Dialog
        open={section !== null}
        title={current?.title ?? 'Configurações'}
        description={current?.description}
        onClose={() => setSection(null)}
      >
        {section && (
          <form className={styles.form} onSubmit={save}>
            {section === 'absence' && (
              <>
                <p className={styles.hint}>
                  Para um único dia de folga, selecione a mesma data nos dois campos.
                </p>
                <div className={styles.dateRow}>
                  <Field id="absence-start" label="Data inicial">
                    <input
                      id="absence-start"
                      type="date"
                      required
                      min={today}
                      value={draft.absence.start}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          absence: { ...draft.absence, start: event.target.value },
                        })
                      }
                    />
                  </Field>
                  <Field id="absence-end" label="Data final">
                    <input
                      id="absence-end"
                      type="date"
                      required
                      min={draft.absence.start || today}
                      value={draft.absence.end}
                      onChange={(event) =>
                        setDraft({
                          ...draft,
                          absence: { ...draft.absence, end: event.target.value },
                        })
                      }
                    />
                  </Field>
                </div>
                <div className={styles.affected}>
                  <h3>Atendimentos no período</h3>
                  {!draft.absence.start || !draft.absence.end ? (
                    <p>Selecione as datas para consultar sua agenda.</p>
                  ) : affected.length === 0 ? (
                    <p>Nenhuma sessão futura nesse período.</p>
                  ) : (
                    <>
                      <p>
                        {affected.length} sessão(ões) para revisar. Escolha uma para abrir o
                        reagendamento.
                      </p>
                      <ul>
                        {affected.map((item) => (
                          <li key={item.id}>
                            <div>
                              <strong>
                                {state.clientes.find((client) => client.id === item.clienteId)
                                  ?.nome ?? 'Novo cliente'}
                              </strong>
                              <span>
                                {formatDate(item.data)} · {item.hora}
                              </span>
                            </div>
                            <Link
                              href={`/proprietario/agendar?editar=${encodeURIComponent(item.id)}`}
                              className="button button-secondary"
                              aria-label={`Reagendar sessão de ${formatDate(item.data)} às ${item.hora}`}
                            >
                              Reagendar
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              </>
            )}
            {section === 'confirmation' && (
              <Field id="confirmation-advance" label="Quando pedir a confirmação?">
                <select
                  id="confirmation-advance"
                  value={draft.confirmation.advance}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      confirmation: { ...draft.confirmation, advance: event.target.value },
                    })
                  }
                >
                  <option value="24">1 dia antes da sessão</option>
                  <option value="4">4 horas antes da sessão</option>
                </select>
              </Field>
            )}
            {section === 'hours' && (
              <>
                <p className={styles.hint}>
                  Selecione os dias de atendimento e ajuste o início e o fim do expediente.
                </p>
                <div className={styles.week}>
                  {draft.hours.map((day, index) => {
                    function update(values: Partial<typeof day>) {
                      setDraft({
                        ...draft,
                        hours: draft.hours.map((item, position) =>
                          position === index ? { ...item, ...values } : item,
                        ),
                      });
                    }
                    return (
                      <div className={styles.day} key={day.day}>
                        <label className={styles.check}>
                          <input
                            type="checkbox"
                            checked={day.enabled}
                            onChange={(event) => update({ enabled: event.target.checked })}
                          />
                          {day.day}
                        </label>
                        {day.enabled ? (
                          <div className={styles.times}>
                            <input
                              aria-label={`Início — ${day.day}`}
                              type="time"
                              required
                              value={day.start}
                              onChange={(event) => update({ start: event.target.value })}
                            />
                            <span>às</span>
                            <input
                              aria-label={`Fim — ${day.day}`}
                              type="time"
                              required
                              value={day.end}
                              onChange={(event) => update({ end: event.target.value })}
                            />
                          </div>
                        ) : (
                          <span className={styles.closed}>Sem atendimento</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
            {section === 'birthday' && (
              <label className={styles.check}>
                <input
                  type="checkbox"
                  checked={draft.birthday.enabled}
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      birthday: { ...draft.birthday, enabled: event.target.checked },
                    })
                  }
                />
                Ativar mensagem no dia do aniversário
              </label>
            )}
            {section !== 'hours' && (
              <>
                <Field
                  id="settings-message"
                  label={
                    section === 'absence'
                      ? 'Mensagem para todos os clientes'
                      : 'Mensagem personalizada'
                  }
                >
                  <textarea
                    id="settings-message"
                    required
                    rows={4}
                    value={message}
                    onChange={(event) => {
                      const value = event.target.value;
                      if (section === 'absence')
                        setDraft({ ...draft, absence: { ...draft.absence, message: value } });
                      if (section === 'confirmation')
                        setDraft({
                          ...draft,
                          confirmation: { ...draft.confirmation, message: value },
                        });
                      if (section === 'birthday')
                        setDraft({ ...draft, birthday: { ...draft.birthday, message: value } });
                    }}
                  />
                </Field>
                <p className={styles.hint}>
                  Use <code>$USER</code> para o nome do cliente.
                  {section === 'absence' && (
                    <>
                      {' '}
                      Use <code>$INICIO</code> e <code>$FIM</code> para as datas.
                    </>
                  )}
                  {section === 'confirmation' && (
                    <>
                      {' '}
                      Use <code>$DATA</code> e <code>$HORA</code> para a sessão.
                    </>
                  )}
                </p>
                <div className={styles.preview}>
                  <span>PRÉVIA DA MENSAGEM · ANA</span>
                  <p>{preview}</p>
                  <small>Exemplo ilustrativo. Nenhuma mensagem será enviada.</small>
                </div>
              </>
            )}
            {error && (
              <p className="field-error" role="alert">
                {error}
              </p>
            )}
            <div className={styles.actions}>
              <Button variant="secondary" onClick={() => setSection(null)}>
                Cancelar
              </Button>
              <Button type="submit">
                <Icon name="check" size={17} />
                Salvar prévia
              </Button>
            </div>
          </form>
        )}
      </Dialog>
    </>
  );
}
