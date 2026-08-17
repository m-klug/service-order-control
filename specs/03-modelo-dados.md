# Modelo de Dados — Controle de Ordens de Serviço

> Modelo lógico. **Convenção**: nomes de tabelas, colunas e todo o código-fonte em **inglês**. A documentação de domínio e a UI permanecem em português.
> Mapa de termos: Cliente = `client`, Ordem de Serviço = `service_order`, Item = `service_order_item`, Deslocamento = `trip`.

## Auditoria (padrão em todas as tabelas de topo)

Toda tabela de entidade principal (`client`, `service_order`) carrega:

| Campo        | Tipo      | Obrigatório | Observação                                       |
|--------------|-----------|-------------|--------------------------------------------------|
| created_at   | timestamp | sim         | data/hora de criação                             |
| updated_at   | timestamp | sim         | data/hora da última atualização                  |
| created_by   | uuid      | sim         | FK → usuário (auth) que criou — rastreio futuro  |
| updated_by   | uuid      | sim         | FK → usuário (auth) que atualizou por último      |

`created_by` / `updated_by` referenciam o usuário autenticado (Supabase `auth.users`). Hoje há um único usuário, mas o campo garante rastreabilidade quando a aplicação escalar para múltiplos operadores.

## Entidades e Atributos

### client
| Campo        | Tipo        | Obrigatório | Observação                    |
|--------------|-------------|-------------|-------------------------------|
| id           | uuid        | sim         | PK                            |
| name         | text        | sim         | nome do cliente               |
| address      | text        | não         | endereço                      |
| district     | text        | não         | bairro                        |
| reference    | text        | não         | ponto de referência           |
| city         | text        | não         | padrão "Timbó"                |
| phone        | text        | não         | telefone                      |
| email        | text        | não         |                               |
| created_at   | timestamp   | sim         | (auditoria)                   |
| updated_at   | timestamp   | sim         | (auditoria)                   |
| created_by   | uuid        | sim         | (auditoria)                   |
| updated_by   | uuid        | sim         | (auditoria)                   |

### service_order
| Campo          | Tipo        | Obrigatório | Observação                                        |
|----------------|-------------|-------------|---------------------------------------------------|
| id             | uuid        | sim         | PK                                                |
| number         | text        | sim         | ex. "1408a" — DDMM + letra (RN-01); único         |
| client_id      | uuid        | sim         | FK → client                                       |
| opened_at      | date        | sim         | data de abertura; padrão = hoje                   |
| status         | enum        | sim         | open \| in_progress \| completed                  |
| request        | text        | não         | solicitação — o que o cliente pediu               |
| report         | text        | não         | relatório — o que foi feito                       |
| discount       | numeric     | não         | desconto; padrão 0                                |
| warranty_months| integer     | não         | garantia em meses                                 |
| paid           | boolean     | sim         | pago; padrão false                                |
| amount_paid    | numeric     | não         | valor pago                                        |
| settled_at     | date        | não         | data de quitação                                  |
| created_at     | timestamp   | sim         | (auditoria)                                       |
| updated_at     | timestamp   | sim         | (auditoria)                                       |
| created_by     | uuid        | sim         | (auditoria)                                       |
| updated_by     | uuid        | sim         | (auditoria)                                       |

`total` é **derivado**: `Σ(item.subtotal) − discount`.

### service_order_item
| Campo        | Tipo      | Obrigatório | Observação                          |
|--------------|-----------|-------------|-------------------------------------|
| id           | uuid      | sim         | PK                                  |
| order_id     | uuid      | sim         | FK → service_order (cascade delete) |
| position     | integer   | sim         | posição na lista                    |
| description  | text      | sim         | texto livre no MVP                  |
| quantity     | numeric   | sim         | padrão 1                            |
| unit_price   | numeric   | sim         | preço unitário                      |

`subtotal` derivado: `quantity × unit_price`.

### trip (deslocamento)
| Campo          | Tipo      | Obrigatório | Observação                          |
|----------------|-----------|-------------|-------------------------------------|
| id             | uuid      | sim         | PK                                  |
| order_id       | uuid      | sim         | FK → service_order (cascade delete) |
| position       | integer   | sim         | 1º, 2º, 3º... deslocamento          |
| date           | date      | não         |                                     |
| km_start       | integer   | não         | km início                           |
| km_end         | integer   | não         | km fim                              |
| left_shop_at   | time      | não         | hora de saída da loja               |
| arrived_at     | time      | não         | hora de chegada no cliente          |
| left_client_at | time      | não         | fim do atendimento no cliente       |
| back_shop_at   | time      | não         | hora de retorno à loja              |
| vehicle        | text      | não         | um carro só; texto simples          |
| signed_by      | text      | não         | visto — rubrica/identificação       |

> `service_order_item` e `trip` são filhos de `service_order`; a rastreabilidade de autoria deriva da OS pai. Podem receber `created_by`/`updated_by` próprios se necessário no futuro.

## Relacionamentos

```
client         1 ──── N service_order
service_order  1 ──── N service_order_item
service_order  1 ──── N trip
auth user      1 ──── N (created_by / updated_by em client e service_order)
```

## Notas de Integridade

- `service_order.number` deve ser único. A sugestão automática calcula `DDMM` + próxima letra livre do dia.
- Exclusão de `service_order` remove `service_order_item` e `trip` em cascata.
- Exclusão de `client` com OS vinculadas deve ser bloqueada (ou exigir confirmação), preservando histórico.
- Valores monetários com 2 casas decimais; `total` nunca negativo.
- `created_by` preenchido na criação e imutável; `updated_by`/`updated_at` atualizados a cada gravação (via trigger ou camada de aplicação).
