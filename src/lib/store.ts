import { getBookingError, isUpcoming, validateClient } from './agenda';
import { DEMO_CLIENT_ID, HOURS, SERVICES } from './data';
import { isDateKey, isOpenDay } from './dates';
import type { AppAction, AppState } from './types';

export function transition(
  state: AppState,
  action: AppAction,
): { state: AppState; error?: string } {
  switch (action.type) {
    case 'hydrate':
      return { state: action.state };
    case 'profile/set':
      return { state: { ...state, perfil: action.perfil } };
    case 'client/save': {
      const error = Object.values(validateClient(action.cliente, new Date(action.now)))[0];
      if (error) return { state, error };
      const exists = state.clientes.some((client) => client.id === action.cliente.id);
      return {
        state: {
          ...state,
          clientes: exists
            ? state.clientes.map((client) =>
                client.id === action.cliente.id ? action.cliente : client,
              )
            : [...state.clientes, action.cliente],
        },
      };
    }
    case 'client/toggle':
      return {
        state: {
          ...state,
          clientes: state.clientes.map((client) =>
            client.id === action.id ? { ...client, ativo: !client.ativo } : client,
          ),
        },
      };
    case 'appointment/save': {
      const exists = state.agendamentos.some(
        (appointment) => appointment.id === action.agendamento.id,
      );
      const error = getBookingError(
        state,
        action.agendamento,
        new Date(action.now),
        exists ? action.agendamento.id : undefined,
      );
      if (error) return { state, error };
      const appointment = { ...action.agendamento, status: 'confirmado' as const };
      return {
        state: {
          ...state,
          agendamentos: exists
            ? state.agendamentos.map((item) => (item.id === appointment.id ? appointment : item))
            : [...state.agendamentos, appointment],
        },
      };
    }
    case 'appointment/cancel': {
      const appointment = state.agendamentos.find((item) => item.id === action.id);
      if (!appointment || !isUpcoming(appointment, new Date(action.now)))
        return { state, error: 'Somente sessões futuras e confirmadas podem ser canceladas.' };
      return {
        state: {
          ...state,
          agendamentos: state.agendamentos.map((item) =>
            item.id === action.id ? { ...item, status: 'cancelado' } : item,
          ),
        },
      };
    }
  }
}

export function appReducer(state: AppState, action: AppAction): AppState {
  return transition(state, action).state;
}

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

// Session data is untrusted: validate shape, references and IDs before rendering it.
export function restoreState(raw: string | null): AppState | null {
  if (!raw) return null;
  try {
    const state: unknown = JSON.parse(raw);
    if (
      !record(state) ||
      state.version !== 1 ||
      (state.perfil !== null && state.perfil !== 'cliente' && state.perfil !== 'proprietario')
    )
      return null;
    if (!Array.isArray(state.clientes) || !Array.isArray(state.agendamentos)) return null;
    const clients = state.clientes;
    if (
      !clients.every(
        (client: unknown) =>
          record(client) &&
          ['id', 'nome', 'endereco', 'email', 'telefone', 'nascimento', 'documento'].every(
            (key) => typeof client[key] === 'string',
          ) &&
          Boolean(client.id) &&
          Boolean(String(client.nome).trim()) &&
          typeof client.ativo === 'boolean' &&
          (client.tipoDocumento === 'CPF' ||
            client.tipoDocumento === 'RG' ||
            client.tipoDocumento === 'CNH') &&
          (client.nascimento === '' || isDateKey(String(client.nascimento))),
      )
    )
      return null;
    const ids = new Set(clients.map((client) => client.id));
    if (ids.size !== clients.length || !ids.has(DEMO_CLIENT_ID)) return null;
    const appointments = state.agendamentos;
    if (
      !appointments.every(
        (appointment: unknown) =>
          record(appointment) &&
          typeof appointment.id === 'string' &&
          Boolean(appointment.id) &&
          (appointment.clienteId === null ||
            (typeof appointment.clienteId === 'string' && ids.has(appointment.clienteId))) &&
          SERVICES.some((service) => service.id === appointment.servicoId) &&
          typeof appointment.data === 'string' &&
          isOpenDay(appointment.data) &&
          typeof appointment.hora === 'string' &&
          HOURS.includes(appointment.hora) &&
          (appointment.status === 'confirmado' || appointment.status === 'cancelado'),
      )
    )
      return null;
    if (new Set(appointments.map((appointment) => appointment.id)).size !== appointments.length)
      return null;
    const occupied = appointments
      .filter((appointment) => appointment.status === 'confirmado')
      .map((appointment) => `${appointment.data}/${appointment.hora}`);
    if (new Set(occupied).size !== occupied.length) return null;
    return state as unknown as AppState;
  } catch {
    return null;
  }
}
