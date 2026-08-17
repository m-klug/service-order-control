# Plano Técnico e Viabilidade — Controle de Ordens de Serviço

> Como construir. Depende da aprovação de `01-especificacao.md`.

## 1. Veredito de Viabilidade

**Viável, baixo risco.** O domínio é pequeno e bem definido (3 entidades principais, fluxo de estados simples, 1 usuário, ~60–90 OS/mês). Não há requisito de escala, concorrência ou integração complexa. O maior risco do projeto **não é técnico — é over-engineering**. A recomendação é um MVP enxuto com free tiers, custo operacional ≈ R$ 0.

Os dois requisitos que mais influenciam a arquitetura:
1. **Mobile (campo) + Desktop (escritório) com fluxos diferentes** → favorece uma única base responsiva/PWA, não dois apps.
2. **Preparado para offline** → exige isolar o acesso a dados atrás de uma interface de repositório desde o início, mesmo que o MVP seja online.

## 2. Stack Recomendada

| Camada        | Escolha                                   | Porquê                                                                 |
|---------------|-------------------------------------------|-----------------------------------------------------------------------|
| Frontend      | React + Vite + TypeScript, PWA            | Uma base para mobile e desktop; PWA instalável no celular; caminho natural para offline. |
| UI            | Tailwind CSS + shadcn/ui                   | Componentes acessíveis, responsivos, rápidos de montar.               |
| Backend/DB    | Supabase (PostgreSQL + Auth)              | Banco relacional (encaixa no modelo), login pronto, controle de acesso (RLS), free tier generoso. |
| PDF           | pdfmake ou @react-pdf/renderer            | Geração do documento da OS no cliente, sem servidor extra.            |
| Hospedagem    | Cloudflare Pages / Vercel / Netlify (free) + Supabase (free) | Custo ≈ R$ 0 nessa escala.                                            |

**Alternativa considerada e descartada para o MVP**: stack local-first pura (RxDB/PowerSync) desde o início — mais poderosa para offline, porém complexidade desnecessária agora. Deixamos a porta aberta via camada de repositório (RNF-03).

## 3. Arquitetura

```
┌─────────────────────────────────────────────┐
│  PWA (React + Vite + TS)                      │
│                                               │
│  UI adaptada por contexto:                    │
│   • Mobile  → fluxo de campo (atender OS)     │
│   • Desktop → gestão (listar, financeiro, PDF)│
│                                               │
│  Camada de aplicação (casos de uso)           │
│                                               │
│  Camada de repositório  ◀── interface estável │
│   (hoje: Supabase; amanhã: cache local + sync)│
└───────────────┬───────────────────────────────┘
                │ HTTPS
        ┌───────▼────────┐
        │   Supabase     │
        │  Postgres+Auth │
        │  + RLS         │
        └────────────────┘
```

Princípio-chave: **a UI e os casos de uso não conhecem o Supabase**. Falam com `ClienteRepository`, `OrdemServicoRepository`, etc. Trocar a implementação (adicionar offline) não toca a aplicação.

## 4. Estrutura de Telas (MVP)

**Mobile (campo)**
- Lista de OS do dia / em aberto.
- Detalhe/edição de OS: status, itens, deslocamentos, relatório.
- Criar OS rápida.

**Desktop (escritório)**
- Tabela de OS com filtros (status, cliente, período, pago/não pago) e busca.
- Detalhe completo da OS + gerar PDF.
- Cadastro de clientes.
- Visão financeira simples (pago x a receber) — lista, sem dashboard.

## 5. Fases de Entrega

- **Fase 0 — Fundação**: projeto, Supabase, schema/migrations (modelo de dados) com colunas de auditoria (`created_at`/`updated_at`/`created_by`/`updated_by`) e triggers para preenchê-las, auth/login, camada de repositório, layout responsivo base. Todo código e schema em inglês (RNF-07).
- **Fase 1 — Núcleo OS**: CRUD de cliente; CRUD de OS com itens; numeração automática (RN-01); cálculo de total; status.
- **Fase 2 — Campo e Financeiro**: deslocamentos dinâmicos; pagamento/desconto/garantia; fluxo mobile de campo.
- **Fase 3 — Saída e Busca**: geração de PDF da OS; listagem/filtros/busca.
- **Fase 4 — Polimento**: PWA instalável, validações, testes dos critérios de aceite.

Cada fase entrega algo utilizável e verificável contra os critérios de aceite do MVP.

## 6. Riscos e Mitigações

| Risco                                   | Mitigação                                                        |
|-----------------------------------------|-----------------------------------------------------------------|
| Over-engineering (offline cedo demais)  | MVP online; só a interface de repositório fica pronta p/ futuro. |
| Numeração com colisão/concorrência      | Baixo (1 usuário); validar unicidade e sugerir próxima letra.    |
| Escopo crescer no meio (catálogo, etc.) | Congelado como não-objetivo; revisita em fase futura.            |
| Custo surpresa de free tier             | Volume minúsculo; muito abaixo dos limites gratuitos.            |

## 7. Estimativa de Custo Operacional

Nessa escala: **≈ R$ 0/mês** (free tiers de hospedagem estática + Supabase). Custo sobe só se o volume crescer ordens de magnitude.

## 8. Decisões Pendentes de Aprovação

1. Confirmar a stack recomendada (React/Vite/PWA + Supabase) ou preferência diferente.
2. Confirmar biblioteca de PDF (pdfmake vs @react-pdf/renderer).
3. Aprovar o faseamento antes de gerar as tarefas (tasks) da Fase 0.
