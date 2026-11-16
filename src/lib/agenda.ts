import { HOURS, SERVICES } from './data';
import { addDays, dateKey, isDateKey, isOpenDay, startTime } from './dates';
import type { Agendamento, AppState, BookingInput, Cliente, ClientErrors } from './types';

export function isUpcoming(appointment: Agendamento, now = new Date()): boolean {
  return (
    appointment.status === 'confirmado' &&
    startTime(appointment.data, appointment.hora) > now.getTime()
  );
}

export function getBookingError(
  state: AppState,
  input: BookingInput,
  now = new Date(),
  editingId?: string,
): string | null {
  if (!SERVICES.some((service) => service.id === input.servicoId)) return 'Selecione um serviço.';
  if (!isDateKey(input.data)) return 'Selecione uma data válida.';
  if (!isOpenDay(input.data)) return 'O espaço não atende aos domingos. Escolha outro dia.';
  if (!HOURS.includes(input.hora)) return 'Selecione um horário entre 08h e 17h.';
  if (startTime(input.data, input.hora) <= now.getTime())
    return 'Esse horário já passou. Escolha um horário futuro.';
  const original = state.agendamentos.find((appointment) => appointment.id === editingId);
  if (editingId && (!original || !isUpcoming(original, now)))
    return 'Somente sessões futuras e confirmadas podem ser reagendadas.';
  if (input.clienteId !== null) {
    const client = state.clientes.find((item) => item.id === input.clienteId);
    if (!client) return 'Selecione um cliente existente ou a opção Novo cliente.';
    if (!client.ativo && original?.clienteId !== client.id)
      return 'Este cadastro está inativo. Reative-o para fazer novos agendamentos.';
  }
  const start = startTime(input.data, input.hora);
  const duration = SERVICES.find((service) => service.id === input.servicoId)!.duracao * 60_000;
  const conflict = state.agendamentos.some((appointment) => {
    if (appointment.id === editingId || appointment.status === 'cancelado') return false;
    const otherStart = startTime(appointment.data, appointment.hora);
    const otherDuration =
      SERVICES.find((service) => service.id === appointment.servicoId)!.duracao * 60_000;
    return start < otherStart + otherDuration && start + duration > otherStart;
  });
  return conflict ? 'Esse horário já está reservado. Escolha outro horário.' : null;
}

export function availableHours(
  state: AppState,
  data: string,
  now = new Date(),
  editingId?: string,
): string[] {
  return HOURS.filter(
    (hora) =>
      !getBookingError(
        state,
        { data, hora, servicoId: SERVICES[0].id, clienteId: null },
        now,
        editingId,
      ),
  );
}

export function dashboardStats(state: AppState, today = dateKey(new Date())) {
  const lastDay = addDays(today, 6);
  const confirmed = state.agendamentos.filter((appointment) => appointment.status === 'confirmado');
  return {
    today: confirmed.filter((appointment) => appointment.data === today).length,
    week: confirmed.filter(
      (appointment) => appointment.data >= today && appointment.data <= lastDay,
    ).length,
    clients: state.clientes.filter((client) => client.ativo).length,
  };
}

export function validateClient(client: Cliente, now = new Date()): ClientErrors {
  const errors: ClientErrors = {};
  if (client.nome.trim().length < 2) errors.nome = 'Informe um nome com pelo menos 2 caracteres.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(client.email.trim()))
    errors.email = 'Informe um e-mail válido.';
  if (!/^\d{10,11}$/.test(client.telefone.replace(/\D/g, '')))
    errors.telefone = 'Informe o telefone com DDD (10 ou 11 dígitos).';
  if (client.nascimento && (!isDateKey(client.nascimento) || client.nascimento > dateKey(now)))
    errors.nascimento = 'Informe uma data de nascimento válida, até hoje.';
  if (!['CPF', 'RG', 'CNH'].includes(client.tipoDocumento))
    errors.tipoDocumento = 'Escolha CPF, RG ou CNH.';
  if (client.documento.trim()) {
    const normalized = client.documento.replace(/[.\-\s]/g, '');
    if (
      client.tipoDocumento === 'RG'
        ? !/^[\dXx]{5,14}$/.test(normalized)
        : !/^\d{11}$/.test(normalized)
    )
      errors.documento =
        client.tipoDocumento === 'RG'
          ? 'Informe de 5 a 14 caracteres (números ou X).'
          : 'Informe os 11 dígitos do documento.';
  }
  return errors;
}
