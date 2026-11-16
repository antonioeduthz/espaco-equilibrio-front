'use client';

import { useMemo, useRef, useState, type FormEvent } from 'react';
import { Icon } from '@/components/Icon';
import { Button, ConfirmDialog, Dialog, EmptyState, Field, PageHeading } from '@/components/ui';
import { validateClient } from '@/lib/agenda';
import { dateKey, initials } from '@/lib/dates';
import type { Cliente, ClientErrors, TipoDocumento } from '@/lib/types';
import { useSession } from '@/state/SessionProvider';
import styles from './Clients.module.css';

type ClientFilter = 'todos' | 'ativos' | 'inativos';
const blankClient: Cliente = {
  id: '',
  nome: '',
  email: '',
  telefone: '',
  endereco: '',
  nascimento: '',
  tipoDocumento: 'CPF',
  documento: '',
  ativo: true,
};

export function Clients() {
  const { state, perform } = useSession();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<ClientFilter>('todos');
  const [editing, setEditing] = useState<Cliente | 'new' | null>(null);
  const [deactivating, setDeactivating] = useState<Cliente | null>(null);
  const activeCount = state.clientes.filter((client) => client.ativo).length;
  const visible = useMemo(() => {
    const normalize = (text: string) =>
      text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase();
    const term = normalize(search.trim());
    return state.clientes
      .filter(
        (client) =>
          (filter === 'todos' || client.ativo === (filter === 'ativos')) &&
          normalize(`${client.nome} ${client.email} ${client.telefone}`).includes(term),
      )
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  }, [state.clientes, search, filter]);

  return (
    <>
      <PageHeading
        eyebrow="CONEXÕES QUE ACOLHEM"
        title="Cada pessoa, um cuidado."
        description="Conheça quem faz parte do seu espaço e mantenha cada detalhe por perto."
        action={
          <Button onClick={() => setEditing('new')}>
            <Icon name="plus" size={17} />
            Cadastrar cliente
          </Button>
        }
      />
      <div className={styles.overview}>
        <span className={styles.overviewIcon}>
          <Icon name="users" size={28} />
        </span>
        <div>
          <h2>Seu círculo de cuidado</h2>
          <p>
            <strong>{state.clientes.length} pessoas</strong> fazem parte dessa história.{' '}
            <span>{activeCount} cadastros ativos.</span>
          </p>
        </div>
        <span className={styles.overviewLabel}>
          <Icon name="heart" size={15} />
          CADA PESSOA IMPORTA
        </span>
      </div>
      <section className={`surface ${styles.panel}`} aria-label="Lista de clientes">
        <div className={styles.toolbar}>
          <div className={styles.filters} role="group" aria-label="Filtrar clientes">
            {(
              [
                ['todos', 'Todos', state.clientes.length],
                ['ativos', 'Ativos', activeCount],
                ['inativos', 'Inativos', state.clientes.length - activeCount],
              ] as const
            ).map(([value, label, count]) => (
              <button
                type="button"
                key={value}
                aria-pressed={filter === value}
                className={filter === value ? styles.filterActive : ''}
                onClick={() => setFilter(value)}
              >
                {label}
                <span>{count}</span>
              </button>
            ))}
          </div>
          <div className={styles.search}>
            <Icon name="search" size={17} />
            <label htmlFor="client-search" className="sr-only">
              Buscar clientes por nome, e-mail ou telefone
            </label>
            <input
              id="client-search"
              type="search"
              placeholder="Buscar nome, e-mail ou telefone"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        {visible.length ? (
          <div className={styles.tableWrap}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>CLIENTE</th>
                  <th>TELEFONE</th>
                  <th>STATUS</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {visible.map((client, index) => (
                  <tr key={client.id} className={!client.ativo ? styles.inactive : ''}>
                    <td>
                      <div className={styles.clientCell}>
                        <span className={`${styles.avatar} ${styles[`avatar${index % 3}`]}`}>
                          {initials(client.nome)}
                        </span>
                        <div>
                          <strong>{client.nome}</strong>
                          <span>{client.email}</span>
                        </div>
                      </div>
                    </td>
                    <td className={styles.phone}>
                      <Icon name="phone" size={13} />
                      {client.telefone.replace(/^(\d{2})(\d{5})(\d{4})$/, '($1) $2-$3')}
                    </td>
                    <td>
                      <span className={`badge badge-${client.ativo ? 'sage' : 'muted'}`}>
                        <span className={styles.statusDot} />
                        {client.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => setEditing(client)}
                          aria-label={`Editar ${client.nome}`}
                          title="Editar cadastro"
                        >
                          <Icon name="edit" size={16} />
                        </button>
                        <button
                          type="button"
                          className={`icon-button ${client.ativo ? styles.deactivate : ''}`}
                          aria-label={`${client.ativo ? 'Desativar' : 'Reativar'} ${client.nome}`}
                          title={client.ativo ? 'Desativar cadastro' : 'Reativar cadastro'}
                          onClick={() =>
                            client.ativo
                              ? setDeactivating(client)
                              : perform(
                                  { type: 'client/toggle', id: client.id },
                                  'Cadastro reativado. O cliente já pode agendar novamente.',
                                )
                          }
                        >
                          <Icon name={client.ativo ? 'close' : 'refresh'} size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            icon="search"
            title="Nenhum cliente por aqui"
            description={
              search
                ? 'Tente outro nome, e-mail ou telefone, ou altere o filtro.'
                : 'Os cadastros com esse status aparecerão aqui.'
            }
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  setSearch('');
                  setFilter('todos');
                }}
              >
                Limpar filtros
              </Button>
            }
          />
        )}
        <div className={styles.tableFooter}>
          <span>
            Mostrando {visible.length} de {state.clientes.length} clientes
          </span>
          <span>
            <Icon name="info" size={13} />
            Desativar preserva o histórico de cuidados.
          </span>
        </div>
      </section>
      {editing && (
        <ClientForm
          key={editing === 'new' ? 'new' : editing.id}
          client={editing === 'new' ? blankClient : editing}
          onClose={() => setEditing(null)}
        />
      )}
      <ConfirmDialog
        open={Boolean(deactivating)}
        title="Desativar este cadastro?"
        description={`${deactivating?.nome ?? 'O cliente'} não poderá receber novos agendamentos. As sessões existentes e o histórico serão preservados. Você pode reativar o cadastro quando quiser.`}
        confirmLabel="Desativar cadastro"
        danger
        onClose={() => setDeactivating(null)}
        onConfirm={() => {
          if (deactivating)
            perform(
              { type: 'client/toggle', id: deactivating.id },
              'Cadastro desativado. O histórico foi preservado.',
            );
          setDeactivating(null);
        }}
      />
    </>
  );
}

function ClientForm({ client, onClose }: { client: Cliente; onClose: () => void }) {
  const { perform, now } = useSession();
  const [draft, setDraft] = useState(client);
  const [errors, setErrors] = useState<ClientErrors>({});
  const formRef = useRef<HTMLFormElement>(null);
  function update<K extends keyof Cliente>(key: K, value: Cliente[K]) {
    setDraft((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  }
  function inputProps(key: keyof Cliente) {
    return {
      id: `client-${key}`,
      'aria-invalid': Boolean(errors[key]),
      'aria-describedby': errors[key] ? `client-${key}-error` : undefined,
    };
  }
  function submit(event: FormEvent) {
    event.preventDefault();
    const next: Cliente = {
      ...draft,
      id: draft.id || crypto.randomUUID(),
      nome: draft.nome.trim(),
      email: draft.email.trim().toLowerCase(),
      telefone: draft.telefone.trim(),
      endereco: draft.endereco.trim(),
      documento: draft.documento.trim(),
    };
    const validation = validateClient(next);
    if (Object.keys(validation).length) {
      setErrors(validation);
      requestAnimationFrame(() =>
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus(),
      );
      return;
    }
    if (
      perform(
        { type: 'client/save', cliente: next, now: Date.now() },
        client.id
          ? 'Cadastro atualizado com sucesso.'
          : 'Cliente cadastrado. Mais alguém para acolher!',
      )
    )
      onClose();
  }

  return (
    <Dialog
      open
      title={client.id ? 'Cuidar dos detalhes.' : 'Uma nova conexão.'}
      description={
        client.id
          ? `Atualize as informações de ${client.nome}.`
          : 'Cadastre um cliente para acompanhar seus momentos de cuidado.'
      }
      drawer
      onClose={onClose}
    >
      <form className={styles.form} ref={formRef} onSubmit={submit} noValidate>
        <p className={styles.formHint}>Nome, e-mail e telefone são obrigatórios.</p>
        <Field id="client-nome" label="Nome completo" error={errors.nome}>
          <input
            {...inputProps('nome')}
            value={draft.nome}
            onChange={(event) => update('nome', event.target.value)}
            placeholder="Como podemos chamar essa pessoa?"
            autoComplete="name"
            required
            maxLength={120}
          />
        </Field>
        <Field id="client-email" label="E-mail" error={errors.email}>
          <input
            {...inputProps('email')}
            type="email"
            value={draft.email}
            onChange={(event) => update('email', event.target.value)}
            placeholder="nome@email.com"
            autoComplete="email"
            required
            maxLength={160}
          />
        </Field>
        <div className={styles.formRow}>
          <Field id="client-telefone" label="Telefone" error={errors.telefone}>
            <input
              {...inputProps('telefone')}
              type="tel"
              value={draft.telefone}
              onChange={(event) => update('telefone', event.target.value)}
              placeholder="(11) 99999-9999"
              autoComplete="tel-national"
              required
              maxLength={20}
            />
          </Field>
          <Field id="client-nascimento" label="Nascimento" optional error={errors.nascimento}>
            <input
              {...inputProps('nascimento')}
              type="date"
              value={draft.nascimento}
              max={dateKey(now)}
              onChange={(event) => update('nascimento', event.target.value)}
              autoComplete="bday"
            />
          </Field>
        </div>
        <Field id="client-endereco" label="Endereço" optional>
          <textarea
            {...inputProps('endereco')}
            value={draft.endereco}
            onChange={(event) => update('endereco', event.target.value)}
            placeholder="Rua, número, bairro e cidade"
            autoComplete="street-address"
            maxLength={300}
          />
        </Field>
        <div className={styles.documentRow}>
          <Field id="client-tipoDocumento" label="Documento" error={errors.tipoDocumento}>
            <select
              {...inputProps('tipoDocumento')}
              value={draft.tipoDocumento}
              onChange={(event) => {
                update('tipoDocumento', event.target.value as TipoDocumento);
                setErrors((previous) => ({ ...previous, documento: undefined }));
              }}
            >
              <option>CPF</option>
              <option>RG</option>
              <option>CNH</option>
            </select>
          </Field>
          <Field id="client-documento" label="Número" optional error={errors.documento}>
            <input
              {...inputProps('documento')}
              value={draft.documento}
              onChange={(event) => update('documento', event.target.value)}
              placeholder="Número do documento"
              inputMode={draft.tipoDocumento === 'RG' ? 'text' : 'numeric'}
              maxLength={20}
            />
          </Field>
        </div>
        <div className={styles.formActions}>
          <Button variant="secondary" onClick={onClose}>
            Voltar
          </Button>
          <Button type="submit">
            <Icon name="check" size={16} />
            {client.id ? 'Salvar alterações' : 'Cadastrar cliente'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
