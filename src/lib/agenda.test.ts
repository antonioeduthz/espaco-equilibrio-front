import { describe, expect, it } from 'vitest';
import {
  availableHours,
  dashboardStats,
  getBookingError,
  isUpcoming,
  validateClient,
} from './agenda';
import { createDemoState, DEMO_CLIENT_ID } from './data';
import { addDays, dateKey, isDateKey, nextOpenDay } from './dates';
import { appReducer, restoreState, transition } from './store';
import type { Agendamento, AppState, BookingInput } from './types';

const now = new Date('2026-11-16T07:00:00');
const base = (): AppState => ({ ...createDemoState(now), agendamentos: [] });
const input: BookingInput = {
  clienteId: DEMO_CLIENT_ID,
  servicoId: 'massagem',
  data: '2026-11-16',
  hora: '09:00',
};
const appointment: Agendamento = { ...input, id: 'test-appointment', status: 'confirmado' };
function save(state: AppState, value = appointment) {
  return transition(state, { type: 'appointment/save', agendamento: value, now: now.getTime() });
}

describe('Disponibilidade e reservas', () => {
  it('oferece dez sessões de uma hora, das 08h às 17h', () => {
    const hours = availableHours(base(), '2026-11-16', now);
    expect(hours).toHaveLength(10);
    expect(hours[0]).toBe('08:00');
    expect(hours.at(-1)).toBe('17:00');
  });
  it('não oferece domingos nem horários que já começaram', () => {
    expect(availableHours(base(), '2026-11-22', now)).toEqual([]);
    expect(availableHours(base(), '2026-11-16', new Date('2026-11-16T16:00:00'))).toEqual([
      '17:00',
    ]);
    expect(availableHours(base(), '2026-11-16', new Date('2026-11-16T17:00:00'))).toEqual([]);
  });
  it('rejeita datas inválidas, passadas e horários fora do expediente', () => {
    for (const value of [
      { ...input, data: '2026-02-30' },
      { ...input, data: '2026-11-14' },
      { ...input, data: '2026-11-22' },
      { ...input, hora: '18:00' },
      { ...input, hora: '09:30' },
      { ...input, servicoId: 'unknown' },
    ])
      expect(getBookingError(base(), value, now)).toBeTruthy();
  });
  it('reserva para cliente cadastrado e aceita cliente ainda sem cadastro', () => {
    expect(save(base()).error).toBeUndefined();
    expect(
      save(base(), { ...appointment, clienteId: null }).state.agendamentos[0].clienteId,
    ).toBeNull();
  });
  it('bloqueia conflitos entre serviços e clientes, mas permite sessões consecutivas', () => {
    const state = save(base()).state;
    expect(
      save(state, { ...appointment, id: 'second', servicoId: 'drenagem', clienteId: null }).error,
    ).toContain('reservado');
    expect(save(state, { ...appointment, id: 'second', hora: '10:00' }).error).toBeUndefined();
    expect(availableHours(state, input.data, now)).not.toContain('09:00');
  });
  it('bloqueia cliente inexistente ou desativado', () => {
    expect(getBookingError(base(), { ...input, clienteId: 'missing' }, now)).toBeTruthy();
    const state = appReducer(base(), { type: 'client/toggle', id: DEMO_CLIENT_ID });
    expect(getBookingError(state, input, now)).toContain('inativo');
  });
  it('cancela preservando histórico e libera a vaga imediatamente', () => {
    const state = save(base()).state;
    const next = appReducer(state, {
      type: 'appointment/cancel',
      id: appointment.id,
      now: now.getTime(),
    });
    expect(next.agendamentos).toHaveLength(1);
    expect(next.agendamentos[0].status).toBe('cancelado');
    expect(availableHours(next, input.data, now)).toContain('09:00');
    expect(dashboardStats(next, input.data).today).toBe(0);
    expect(save(next, { ...appointment, id: 'replacement' }).error).toBeUndefined();
  });
  it('não cancela nem reagenda uma sessão que já passou', () => {
    const state = save(base()).state;
    const later = new Date('2026-11-16T10:01:00');
    expect(
      transition(state, { type: 'appointment/cancel', id: appointment.id, now: later.getTime() })
        .error,
    ).toBeTruthy();
    expect(getBookingError(state, { ...input, hora: '15:00' }, later, appointment.id)).toBeTruthy();
    expect(isUpcoming(appointment, later)).toBe(false);
  });
  it('reagenda sem conflitar consigo mesmo e mantém o ID', () => {
    const state = save(base()).state;
    expect(availableHours(state, input.data, now, appointment.id)).toContain('09:00');
    expect(save(state).error).toBeUndefined();
    const next = save(state, { ...appointment, data: '2026-11-17', hora: '12:00' }).state;
    expect(next.agendamentos).toHaveLength(1);
    expect(next.agendamentos[0]).toMatchObject({
      id: appointment.id,
      data: '2026-11-17',
      hora: '12:00',
    });
    expect(availableHours(next, input.data, now)).toContain('09:00');
  });
  it('reagendamento com conflito deixa a reserva original intacta', () => {
    const state = save(save(base()).state, { ...appointment, id: 'second', hora: '10:00' }).state;
    const result = save(state, { ...appointment, hora: '10:00' });
    expect(result.error).toBeTruthy();
    expect(result.state).toBe(state);
    expect(result.state.agendamentos[0].hora).toBe('09:00');
  });
  it('sessão cancelada não pode ser restaurada por reagendamento', () => {
    const state = { ...base(), agendamentos: [{ ...appointment, status: 'cancelado' as const }] };
    expect(save(state, { ...appointment, hora: '12:00' }).error).toBeTruthy();
  });
  it('desativar preserva reservas existentes e permite reorganizá-las', () => {
    const state = appReducer(save(base()).state, { type: 'client/toggle', id: DEMO_CLIENT_ID });
    expect(state.agendamentos).toEqual([appointment]);
    expect(save(state, { ...appointment, hora: '12:00' }).error).toBeUndefined();
    expect(save(state, { ...appointment, id: 'new', hora: '12:00' }).error).toBeTruthy();
    const active = appReducer(state, { type: 'client/toggle', id: DEMO_CLIENT_ID });
    expect(save(active, { ...appointment, id: 'new', hora: '12:00' }).error).toBeUndefined();
  });
});

describe('Indicadores e cadastros', () => {
  it('conta hoje e os seis dias seguintes, excluindo cancelamentos', () => {
    const state = {
      ...base(),
      agendamentos: [
        appointment,
        { ...appointment, id: 'b', data: '2026-11-21' },
        { ...appointment, id: 'c', data: '2026-11-23' },
        { ...appointment, id: 'd', hora: '10:00', status: 'cancelado' as const },
      ],
    };
    expect(dashboardStats(state, '2026-11-16')).toEqual({ today: 1, week: 2, clients: 5 });
    expect(dashboardStats(state, '2026-11-17').week).toBe(2);
  });
  it('valida contato obrigatório, documento e nascimento', () => {
    const client = base().clientes[0];
    expect(validateClient(client, now)).toEqual({});
    expect(
      validateClient(
        {
          ...client,
          nome: '',
          email: 'invalido',
          telefone: '123',
          nascimento: '2030-01-01',
          documento: '123',
        },
        now,
      ),
    ).toHaveProperty('nome');
    expect(
      Object.keys(
        validateClient(
          {
            ...client,
            nome: '',
            email: 'invalido',
            telefone: '123',
            nascimento: '2030-01-01',
            documento: '123',
          },
          now,
        ),
      ),
    ).toHaveLength(5);
    expect(validateClient({ ...client, tipoDocumento: 'RG', documento: '12345678X' }, now)).toEqual(
      {},
    );
  });
  it('edita sem duplicar nem modificar a referência dos agendamentos', () => {
    const state = save(base()).state;
    const cliente = { ...state.clientes[0], nome: 'Ana Atualizada', telefone: '11911112222' };
    const next = appReducer(state, { type: 'client/save', cliente, now: now.getTime() });
    expect(next.clientes).toHaveLength(state.clientes.length);
    expect(next.clientes[0].nome).toBe('Ana Atualizada');
    expect(next.agendamentos).toBe(state.agendamentos);
  });
  it('adiciona cadastro válido e rejeita cadastro inválido', () => {
    const state = base();
    const cliente = { ...state.clientes[0], id: 'new-client', nome: 'Cliente Teste' };
    expect(
      appReducer(state, { type: 'client/save', cliente, now: now.getTime() }).clientes,
    ).toHaveLength(7);
    expect(
      transition(state, {
        type: 'client/save',
        cliente: { ...cliente, email: '' },
        now: now.getTime(),
      }).state,
    ).toBe(state);
  });
});

describe('Sessão temporária', () => {
  it('restaura todas as alterações e o perfil depois de serializar', () => {
    const state = appReducer(save(base()).state, { type: 'profile/set', perfil: 'proprietario' });
    expect(restoreState(JSON.stringify(state))).toEqual(state);
  });
  it('sair ou alternar perfis não apaga os dados', () => {
    const state = save(base()).state;
    for (const perfil of ['cliente', null, 'proprietario'] as const) {
      const next = appReducer(state, { type: 'profile/set', perfil });
      expect(next.agendamentos).toBe(state.agendamentos);
      expect(next.clientes).toBe(state.clientes);
    }
  });
  it('rejeita sessão ausente, JSON inválido, versão desconhecida ou shape incompleto', () => {
    for (const raw of [
      null,
      '{bad',
      'null',
      '{}',
      JSON.stringify({ ...base(), version: 2 }),
      JSON.stringify({ ...base(), perfil: 'admin' }),
      JSON.stringify({ ...base(), clientes: [] }),
    ])
      expect(restoreState(raw)).toBeNull();
  });
  it('rejeita referências inexistentes, duplicidade e agenda corrompida', () => {
    for (const agendamentos of [
      [{ ...appointment, clienteId: 'missing' }],
      [{ ...appointment, servicoId: 'missing' }],
      [appointment, { ...appointment, id: 'duplicate-slot' }],
      [{ ...appointment, data: '2026-02-30' }],
      [{ ...appointment, hora: '18:00' }],
      [{ ...appointment, hora: ['09:00'] }],
      [{ ...appointment, status: ['confirmado'] }],
      [appointment, { ...appointment, hora: '10:00' }],
    ])
      expect(restoreState(JSON.stringify({ ...base(), agendamentos }))).toBeNull();
    const state = base();
    const clientes = [{ ...state.clientes[0], tipoDocumento: ['CPF'] }, ...state.clientes.slice(1)];
    expect(restoreState(JSON.stringify({ ...state, clientes }))).toBeNull();
  });
  it('dados iniciais são independentes, válidos e relativos à abertura', () => {
    const first = createDemoState(now);
    const second = createDemoState(new Date('2026-11-23T07:00:00'));
    expect(first.clientes).not.toBe(second.clientes);
    expect(first.agendamentos[0].data).toBe('2026-11-16');
    expect(second.agendamentos[0].data).toBe('2026-11-23');
    expect(restoreState(JSON.stringify(first))).toEqual(first);
  });
});

describe('Calendário local', () => {
  it('atravessa meses e anos sem converter para UTC', () => {
    expect(dateKey(new Date(2026, 10, 16, 23, 55))).toBe('2026-11-16');
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(isDateKey('2026-02-30')).toBe(false);
    expect(nextOpenDay('2026-11-22')).toBe('2026-11-23');
  });
});
