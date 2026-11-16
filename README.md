# Marta Sátyl — Espaço Equilíbrio Corpo&Mente

Frontend demonstrativo de agendamento e gestão de clientes. Construído com React, Next.js (App Router), TypeScript e CSS Modules, com tema branco e dourado e layouts para computador e celular.

## Executar localmente

Requisitos: **Node.js 22 ou superior** e npm. Validado com Node.js 24.

Abra um terminal na raiz deste repositório e execute:

```bash
npm ci
npm run dev
```

Acesse **http://127.0.0.1:3000**. Use `npm install` apenas se estiver alterando dependências; `npm ci` reproduz as versões do arquivo de lock.

### Build estático

```bash
npm run build
npm run preview
```

Encerre o servidor de desenvolvimento com `Ctrl+C` antes de iniciar a prévia, pois ambos usam a porta 3000. O build produz a pasta **`out/`**, contendo o site estático completo. A prévia serve essa pasta em **http://127.0.0.1:3000**. Não use `next start`: esta aplicação utiliza `output: 'export'`.

O servidor de prévia serve apenas arquivos; não há backend de negócio. As rotas usam barra final e arquivos `index.html` por diretório. Abra o projeto por HTTP, e não diretamente pelo gerenciador de arquivos. Nenhuma publicação ou hospedagem externa é necessária.

## Acessos e telas

E-mail e senha na entrada são ilustrativos: **nenhum preenchimento é necessário**.

| Acesso                         | Funcionamento                                                |
| ------------------------------ | ------------------------------------------------------------ |
| Entrar como cliente            | Abre a agenda usando o perfil demonstrativo de Ana Oliveira. |
| Acessar painel da proprietária | Abre o painel de Marta Sátyl.                                |
| Sair e trocar perfil           | Retorna ao login sem apagar clientes ou agendamentos.        |

| Rota                      | Conteúdo                                                              |
| ------------------------- | --------------------------------------------------------------------- |
| `/login/`                 | Entrada demonstrativa dos dois perfis.                                |
| `/cliente/agendar/`       | Serviços em gaveta, calendário, horários disponíveis e reserva.       |
| `/cliente/meus-horarios/` | Sessões futuras, cancelamento e histórico do cliente demonstrativo.   |
| `/proprietario/`          | Indicadores, agenda diária, horários livres e ações sobre as sessões. |
| `/proprietario/agendar/`  | Reservas e reagendamentos para clientes cadastrados ou novos.         |
| `/proprietario/clientes/` | Pesquisa, filtros, cadastro, edição, desativação e reativação.        |

A raiz encaminha ao perfil selecionado ou ao login. As verificações de perfil apenas organizam a navegação; **não representam autenticação ou controle de acesso real**.

## Dados temporários

- Context e `useReducer` compartilham a mesma agenda entre as duas áreas na aba atual.
- As alterações e o perfil são serializados em `sessionStorage`, na chave `equilibrio.session.v1`.
- Navegar, sair do perfil e atualizar a página preservam os dados durante a sessão da aba.
- Uma aba nova aberta de forma independente inicia seus próprios dados. Não há sincronização entre abas nem uso de `localStorage`.
- Fechar a aba normalmente encerra sua sessão. O recurso do navegador de restaurar ou duplicar abas pode restaurar/copiar o `sessionStorage`; depois disso, as abas continuam independentes.
- Para reiniciar deliberadamente a demonstração, feche a aba e abra o endereço em uma aba nova independente. Também é possível remover apenas a chave `equilibrio.session.v1` no painel de armazenamento do navegador e atualizar.
- Conteúdo inválido ou incompatível no armazenamento é substituído pelos dados iniciais, com aviso. Se o navegador bloquear o armazenamento, a aplicação continua em memória e avisa que atualizar a página perderá as alterações.

Todos os clientes, contatos, serviços e sessões iniciais são **fictícios**, para demonstração. As datas dos exemplos são calculadas na abertura de cada sessão. Os campos de login nunca são armazenados. Não existe envio de formulários, notificações, integração externa ou banco de dados.

## Regras da agenda

- Uma única agenda para Marta Sátyl, de **segunda a sábado, das 08h às 18h**. Domingo não tem atendimento.
- Três serviços demonstrativos: massagem relaxante, drenagem linfática e reflexologia. Todos duram **60 minutos**, com inícios de hora em hora entre **08h e 17h**. Não há pausas intermediárias configuradas.
- Datas e horários seguem o relógio e o fuso local do navegador. A disponibilidade se atualiza a cada 30 segundos e ao voltar à aba; a confirmação valida novamente usando o horário atual.
- Horários passados e conflitos são bloqueados. O agendamento da proprietária pode deixar o cliente vazio, aparecendo como **Novo cliente**.
- Agendamento, reagendamento e cancelamento sempre pedem confirmação. “Voltar”, fechar o diálogo ou pressionar `Esc` não altera a agenda.
- Cancelamentos liberam a vaga e mantêm o registro no histórico. Reagendamentos preservam o ID e substituem data/horário somente após validar a nova vaga, sem conflitar com o próprio registro.
- Apenas sessões futuras e confirmadas podem ser canceladas ou reagendadas. Sessões cujo horário passou são identificadas como “Horário passado”; isso não registra presença ou atendimento realizado.
- “Sessões de hoje” inclui todos os horários confirmados de hoje; “Próximos 7 dias” inclui hoje e os seis dias seguintes. Cancelamentos não entram nessas contagens. “Clientes ativos” exclui cadastros desativados.
- Desativar um cliente não apaga suas sessões. Bloqueia novas reservas, mas permite administrar as já existentes, inclusive reagendar. Reativar libera novas reservas.
- Nome, e-mail e telefone são obrigatórios no cadastro. Endereço, nascimento e documento são opcionais. Há validação de formato de contato e documento, mas não consulta externa nem validação de dígitos verificadores de CPF/CNH.

## Organização do código

```text
.
├── src/
│   ├── app/                # Rotas, layouts, metadados e estilos globais
│   ├── components/         # Navegação, calendário, botões, campos e diálogos
│   ├── features/
│   │   ├── agenda/         # Reserva, reagendamento, histórico e cancelamento
│   │   ├── auth/           # Entrada demonstrativa
│   │   ├── clients/        # Cadastro e gerenciamento de clientes
│   │   └── dashboard/      # Indicadores e agenda da proprietária
│   ├── lib/                # Tipos, dados, datas, validações, reducer e testes
│   └── state/              # Context, ciclo de sessão e notificações
├── next.config.ts          # Exportação estática
├── package.json
├── package-lock.json
└── README.md
```

As regras de agenda e validação são funções puras em `src/lib/agenda.ts`; as transições ficam em `src/lib/store.ts`. Os componentes reaproveitam essas funções para não duplicar regras entre os perfis. Os tipos `Cliente`, `Servico`, `Agendamento` e `Perfil` ficam em `src/lib/types.ts`.

Os serviços, horários e dados de exemplo ficam em `src/lib/data.ts`. As cores e tipografias são variáveis em `src/app/globals.css`; os demais estilos são locais a cada componente. Não há imagens, fontes remotas, biblioteca de componentes, biblioteca de calendário ou dependência de estado externo. Ícones são pequenos SVGs internos.

Os diálogos usam `<dialog>` nativo para restringir o foco, suportar teclado e devolver o foco ao fechar. Campos têm rótulos e erros associados; os botões têm foco visível e as notificações são anunciadas por leitores de tela. As animações respeitam `prefers-reduced-motion`.

## Verificação

```bash
npm run test
npm run typecheck
npm run build
npm run format:check
```

`npm run test:watch` executa os testes em modo contínuo. `npm run format` aplica a formatação consistente com Prettier.

Os testes automatizados cobrem expediente, domingos, datas inválidas/passadas, conflitos, sessões consecutivas, reserva sem cliente, cancelamento com liberação de vaga, reagendamento, indicadores, cadastro, desativação/reativação, serialização e recuperação de sessões inválidas.

Para conferir manualmente:

1. Entre sem preencher credenciais, escolha um serviço, dia e hora; volte na confirmação e depois confirme a reserva.
2. Verifique a sessão em Meus horários. Troque para proprietária e encontre a mesma sessão na agenda.
3. Reagende para um horário livre, confira a liberação do anterior e depois cancele com confirmação.
4. Reserve sem selecionar um cliente e confira “Novo cliente” no painel.
5. Cadastre, pesquise, edite, desative e reative um cliente; confira sua presença no seletor de reservas.
6. Atualize a página para conferir a persistência. Abra uma aba independente para verificar o isolamento.
7. Percorra as telas no computador e celular, incluindo gavetas, formulários, navegação por teclado e fechamento de diálogos com `Esc`.

Os limites são intencionais: a demonstração não oferece autenticação real, persistência definitiva, múltiplos profissionais, pagamentos ou notificações.
