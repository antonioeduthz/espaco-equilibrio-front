import { addDays, dateKey, nextOpenDay } from './dates';
import type { AppState, Cliente, Servico } from './types';

export const DEMO_CLIENT_ID = 'cliente-ana';
export const STORAGE_KEY = 'equilibrio.session.v1';
export const SERVICES: readonly Servico[] = [
  {
    id: 'massagem',
    nome: 'Massagem relaxante',
    descricao: 'Uma pausa para desacelerar, aliviar as tensões e se reconectar com você.',
    duracao: 60,
    categoria: 'RELAXAMENTO',
    cor: 'sage',
  },
  {
    id: 'drenagem',
    nome: 'Drenagem linfática',
    descricao: 'Movimentos suaves e um momento de cuidado e leveza para o seu corpo.',
    duracao: 60,
    categoria: 'CUIDADO CORPORAL',
    cor: 'gold',
  },
  {
    id: 'reflexologia',
    nome: 'Reflexologia',
    descricao: 'Atenção aos pés, presença e equilíbrio em uma experiência de bem-estar.',
    duracao: 60,
    categoria: 'EQUILÍBRIO',
    cor: 'rose',
  },
];

export const HOURS = Array.from(
  { length: 10 },
  (_, index) => `${String(index + 8).padStart(2, '0')}:00`,
);
export const EMPTY_STATE: AppState = { version: 1, perfil: null, clientes: [], agendamentos: [] };

export function getService(id: string): Servico {
  return SERVICES.find((service) => service.id === id) ?? SERVICES[0];
}

export function createDemoState(now = new Date()): AppState {
  const people = [
    ['cliente-ana', 'Ana Oliveira', 'ana.oliveira@example.com'],
    ['cliente-beatriz', 'Beatriz Santos', 'beatriz.santos@example.com'],
    ['cliente-clara', 'Clara Almeida', 'clara.almeida@example.com'],
    ['cliente-helena', 'Helena Costa', 'helena.costa@example.com'],
    ['cliente-lucia', 'Lúcia Ferreira', 'lucia.ferreira@example.com'],
    ['cliente-marina', 'Marina Ribeiro', 'marina.ribeiro@example.com'],
  ];
  const clientes: Cliente[] = people.map(([id, nome, email], index) => ({
    id,
    nome,
    email,
    endereco: `Rua Exemplo, ${100 + index * 10}`,
    telefone: `1190000000${index}`,
    nascimento: `199${index}-05-15`,
    tipoDocumento: 'CPF',
    documento: '',
    ativo: index !== 5,
  }));
  const today = dateKey(now);
  const day = nextOpenDay(today);
  const tomorrow = nextOpenDay(addDays(day, 1));
  const later = nextOpenDay(addDays(day, 3));
  return {
    version: 1,
    perfil: null,
    clientes,
    agendamentos: [
      {
        id: 'demo-1',
        clienteId: 'cliente-beatriz',
        servicoId: 'massagem',
        data: day,
        hora: '09:00',
        status: 'confirmado',
      },
      {
        id: 'demo-2',
        clienteId: DEMO_CLIENT_ID,
        servicoId: 'drenagem',
        data: day,
        hora: '11:00',
        status: 'confirmado',
      },
      {
        id: 'demo-3',
        clienteId: 'cliente-clara',
        servicoId: 'reflexologia',
        data: day,
        hora: '14:00',
        status: 'confirmado',
      },
      {
        id: 'demo-4',
        clienteId: 'cliente-helena',
        servicoId: 'massagem',
        data: day,
        hora: '16:00',
        status: 'confirmado',
      },
      {
        id: 'demo-5',
        clienteId: DEMO_CLIENT_ID,
        servicoId: 'massagem',
        data: tomorrow,
        hora: '10:00',
        status: 'confirmado',
      },
      {
        id: 'demo-6',
        clienteId: 'cliente-lucia',
        servicoId: 'drenagem',
        data: tomorrow,
        hora: '15:00',
        status: 'confirmado',
      },
      {
        id: 'demo-7',
        clienteId: null,
        servicoId: 'reflexologia',
        data: later,
        hora: '09:00',
        status: 'confirmado',
      },
      {
        id: 'demo-8',
        clienteId: DEMO_CLIENT_ID,
        servicoId: 'reflexologia',
        data: nextOpenDay(addDays(today, -7)),
        hora: '14:00',
        status: 'confirmado',
      },
      {
        id: 'demo-9',
        clienteId: DEMO_CLIENT_ID,
        servicoId: 'drenagem',
        data: nextOpenDay(addDays(today, -4)),
        hora: '11:00',
        status: 'cancelado',
      },
    ],
  };
}
