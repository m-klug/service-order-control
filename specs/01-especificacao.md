# Especificação Funcional — Controle de Ordens de Serviço

> Documento vivo. Fase: **Especificação (SDD)**. Nenhum código antes da aprovação desta spec e do plano técnico.
>
> **Convenção de idioma**: todo o código-fonte e o banco de dados (tabelas, colunas, enums, identificadores) em **inglês**. Documentação de domínio e UI em português. Ver mapa de termos em `03-modelo-dados.md`.

## 1. Contexto e Problema

Empresa de instalação/manutenção de sistemas de segurança (câmeras, portões, etc. — "Beto Sistemas de Segurança"). Hoje o controle de ordens de serviço é feito em **papel (bloco pré-impresso) + planilha**. O objetivo é unificar esse processo em um app único, mantendo o fluxo que já funciona e eliminando a digitação duplicada e o retrabalho.

O documento de papel atual contém: dados do cliente, até 3 deslocamentos (com km e horários), lista de itens/serviços com preço, solicitação do cliente, relatório do que foi feito, total, desconto, garantia e um canhoto de recibo destacável.

## 2. Objetivos

- Registrar e acompanhar ordens de serviço de ponta a ponta em um só lugar.
- Reaproveitar o cadastro de clientes recorrentes (sem redigitar dados a cada OS).
- Controlar valores e situação de pagamento (pago / não pago + valor pago).
- Registrar deslocamentos (km e horários) de forma opcional para controle de custo/produtividade.
- Gerar o documento da OS em PDF para entregar/enviar ao cliente.
- Uso em dois contextos: **campo (celular)** e **escritório (desktop)**.

## 3. Não-objetivos (fora do MVP)

- Catálogo de produtos/serviços com preço pré-cadastrado (futuro — MVP usa item de texto livre).
- Funcionamento offline real (MVP é online; a arquitetura fica **preparada** para offline depois).
- Canhoto de recibo destacável (era artefato do papel; não é necessário no digital).
- Acesso do cliente ao sistema (100% uso interno).
- Fotos e assinatura em campo.
- Método/forma de pagamento (só registra se pagou e o valor total pago).
- Relatórios analíticos e dashboards (a definir em fase futura).
- Cadastro de veículos (há apenas um carro; campo de texto simples resolve).

## 4. Usuários e Contextos

- **Usuário único** (o operador do negócio), autenticado por login/senha.
- **Campo (mobile / PWA instalável no celular)**: criar e atender OS na casa do cliente, registrar deslocamento, mudar status, preencher relatório. Fluxo rápido, poucos toques.
- **Escritório (desktop)**: visão de gestão — listar/filtrar/buscar OS, controlar pagamentos, editar cadastros de cliente, gerar PDF. Tela ampla, tabela e detalhe.

Volume esperado: ~2–3 OS por dia (~60–90/mês). Escala pequena — a prioridade de projeto é **simplicidade e baixo custo**, evitando over-engineering.

## 5. Entidades (visão funcional)

Detalhamento técnico em `03-modelo-dados.md`.

- **Cliente** (recorrente): nome, endereço, bairro, referência, cidade (padrão "Timbó"), telefone, e-mail.
- **Ordem de Serviço (OS)**: número, cliente, data de abertura, status, solicitação, relatório, itens, deslocamentos, desconto, total (calculado), situação de pagamento, valor pago, data de quitação, garantia (meses).
- **Item da OS**: descrição, quantidade, preço unitário (subtotal calculado). No MVP, "Mão de obra" e "Deslocamento" são apenas itens de texto livre como os demais.
- **Deslocamento** (0..N por OS, opcional): data, km início, km fim, hora saída da loja, hora chegada no cliente, hora fim no cliente, hora retorno à loja, carro (texto), visto.

## 6. Regras de Negócio

- **RN-01 — Numeração da OS**: automática e editável. Padrão `DDMM` + letra sequencial por OS do mesmo dia (`a`, `b`, `c`, ...). Ex.: primeira OS de 14/08 = `1408a`, segunda = `1408b`. O sistema sugere o próximo número; o usuário pode editar. Colisões de número devem ser evitadas/avisadas.
- **RN-02 — Ciclo de vida**: `Aberta` → `Em andamento` → `Concluída`. Situação de **pagamento** é independente do status (uma OS concluída pode estar não paga).
- **RN-03 — Total**: `Total = Σ(item.quantidade × item.preço_unitário) − desconto`. Nunca negativo.
- **RN-04 — Pagamento**: campo booleano "pago" + valor total pago + data de quitação (opcional). Sem método de pagamento no MVP.
- **RN-05 — Deslocamento**: todos os campos opcionais. Número de deslocamentos é dinâmico (adicionar quantos precisar; o papel tinha 3 fixos apenas por limitação de espaço).
- **RN-06 — Cidade padrão**: "Timbó" pré-preenchido, editável.
- **RN-07 — Garantia**: número de meses, opcional.

## 7. Requisitos Funcionais

- **RF-01** Cadastrar, editar e listar clientes; buscar por nome/telefone.
- **RF-02** Criar OS selecionando cliente existente (ou cadastrando na hora).
- **RF-03** Sugerir número automático da OS (RN-01), permitindo edição.
- **RF-04** Adicionar/editar/remover itens da OS (descrição, qtd, preço); total recalculado ao vivo.
- **RF-05** Adicionar/editar/remover deslocamentos (dinâmico, campos opcionais).
- **RF-06** Registrar solicitação e relatório (texto).
- **RF-07** Alterar status da OS.
- **RF-08** Registrar pagamento (pago/não pago, valor pago, data quitação) e desconto/garantia.
- **RF-09** Listar/filtrar/buscar OS (por status, cliente, período, pago/não pago).
- **RF-10** Gerar PDF da OS para entrega ao cliente (sem o canhoto de recibo).
- **RF-11** Login/logout do usuário único.

## 8. Requisitos Não-Funcionais

- **RNF-01 — Custo**: hospedagem e manutenção de custo próximo a zero (free tiers).
- **RNF-02 — Um código, dois contextos**: mesma base servindo mobile e desktop (responsivo/PWA), com fluxos adaptados por contexto.
- **RNF-03 — Preparado para offline**: camada de dados isolada por trás de uma interface de repositório, permitindo adicionar cache local + sincronização depois sem reescrever a aplicação.
- **RNF-04 — Segurança**: autenticação obrigatória; dados de cliente/financeiro protegidos por controle de acesso no backend.
- **RNF-05 — Simplicidade**: escopo enxuto de MVP; sem funcionalidades especulativas.
- **RNF-06 — Auditoria/rastreabilidade**: toda entidade principal registra `created_at`, `updated_at`, `created_by` e `updated_by`, permitindo saber quem criou e quem alterou cada registro caso a aplicação escale para múltiplos usuários.
- **RNF-07 — Idioma do código**: código-fonte e banco em inglês (ver convenção no topo); domínio e UI em português.

## 9. Pontos em Aberto (a decidir em fases futuras)

- Formato e conteúdo dos relatórios/dashboards.
- Catálogo de produtos/serviços (evolução do item de texto livre para modo misto).
- Estratégia concreta de sincronização offline (tecnologia de local-first).
- Envio do PDF por WhatsApp/e-mail direto do app.

## 10. Critérios de Aceite do MVP

1. Consigo cadastrar um cliente e reusá-lo em várias OS.
2. Consigo criar uma OS com número automático (`DDMM` + letra), itens, deslocamentos opcionais, solicitação, relatório, desconto e garantia.
3. O total é calculado corretamente conforme RN-03.
4. Consigo marcar como paga e registrar o valor pago.
5. Consigo listar e buscar minhas OS por status/cliente/período/pagamento.
6. Consigo gerar o PDF da OS.
7. Acesso protegido por login.
