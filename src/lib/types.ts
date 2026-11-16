export type Perfil = 'cliente' | 'proprietario';
export type TipoDocumento = 'CPF' | 'RG' | 'CNH';

export interface Cliente {
  id: string;
  nome: string;
  endereco: string;
  email: string;
  telefone: string;
  nascimento: string;
  tipoDocumento: TipoDocumento;
  documento: string;
  ativo: boolean;
}

export interface Servico {
  id: string;
  nome: string;
  descricao: string;
  duracao: number;
  categoria: string;
  cor: 'sage' | 'gold' | 'rose';
}

export interface Agendamento {
  id: string;
  clienteId: string | null;
  servicoId: string;
  data: string;
  hora: string;
  status: 'confirmado' | 'cancelado';
}

export interface AppState {
  version: 1;
  perfil: Perfil | null;
  clientes: Cliente[];
  agendamentos: Agendamento[];
}

export type BookingInput = Omit<Agendamento, 'id' | 'status'>;
export type ClientErrors = Partial<Record<keyof Cliente, string>>;

export type AppAction =
  | { type: 'hydrate'; state: AppState }
  | { type: 'profile/set'; perfil: Perfil | null }
  | { type: 'client/save'; cliente: Cliente; now: number }
  | { type: 'client/toggle'; id: string }
  | { type: 'appointment/save'; agendamento: Agendamento; now: number }
  | { type: 'appointment/cancel'; id: string; now: number };
