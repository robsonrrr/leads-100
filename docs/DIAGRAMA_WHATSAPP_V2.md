# Diagrama de Relações das Tabelas - WhatsApp V2 (Superbot)

**Data:** 2026-01-20  
**Sistema:** Leads-Agent WhatsApp Integration

---

## 📊 Diagrama ER (Entity-Relationship)

```
┌─────────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                    SISTEMA WHATSAPP V2 (SUPERBOT)                                       │
└─────────────────────────────────────────────────────────────────────────────────────────────────────────┘

                                              ┌────────────────────────┐
                                              │   superbot_customers   │
                                              ├────────────────────────┤
                                              │ PK id                  │
                                              │    jid (UK)            │
                                              │    name                │
                                              │    push_name           │
                                              │    phone_number        │
                                              │    is_group            │
                                              │    created_at          │
                                              │    updated_at          │
                                              └───────────┬────────────┘
                                                          │
                   ┌──────────────────────────────────────┼──────────────────────────────────────┐
                   │                                      │                                      │
                   │ 1:N (via phone_number match)         │ 1:N                                  │
                   ▼                                      ▼                                      ▼
    ┌───────────────────────────┐          ┌────────────────────────────┐        ┌────────────────────────────┐
    │        messages           │          │  superbot_customer_links   │        │   superbot_lead_origins    │
    ├───────────────────────────┤          ├────────────────────────────┤        ├────────────────────────────┤
    │ PK id                     │          │ PK id                      │        │ PK id                      │
    │    message_id (UK)        │          │ FK superbot_customer_id    │───────▶│ FK superbot_customer_id    │
    │    session_id             │          │ FK leads_customer_id       │        │ FK lead_id → sCart         │
    │    sender_phone           │          │ FK linked_by → users       │        │ FK message_id              │
    │    recipient_phone        │          │    confidence_score        │        │    session_id              │
    │    message_text           │          │    verified                │        │    intent_detected         │
    │    source                 │          │    notes                   │        │    confidence              │
    │    message_type           │          │    linked_at               │        │    entities_json           │
    │    original_timestamp     │          └────────────────────────────┘        │    auto_created            │
    │    received_at            │                       │                        │    created_at              │
    │    processed_at           │                       │                        └────────────────────────────┘
    │    status                 │                       │
    │    direction              │                       │ FK → mak.clientes
    │    is_group               │                       ▼
    │    delivered_at           │          ┌────────────────────────────┐
    │    read_at                │          │     mak.clientes           │ (TABELA EXTERNA)
    └───────────┬───────────────┘          │     (leads-agent)          │
                │                          └────────────────────────────┘
                │
    ┌───────────┴───────────────────────────────────────────────┐
    │ 1:N                                                       │ 1:N
    ▼                                                           ▼
┌───────────────────────────┐                        ┌───────────────────────────┐
│     message_media         │                        │    message_responses      │
├───────────────────────────┤                        ├───────────────────────────┤
│ PK id                     │                        │ PK id                     │
│ FK message_id             │────────────┐           │ FK message_id             │
│    type (audio/img/video) │            │           │    ai_service             │
│    file_name              │            │           │    raw_response (JSON)    │
│    file_size              │            │           │    formatted_response     │
│    mime_type              │            │           │    response_type          │
│    s3_url                 │            │           │    processing_time_ms     │
│    s3_key                 │            │           │    tokens_used            │
│    duration               │            │           │    cost_estimate          │
│    width/height           │            │           │    status                 │
│    caption                │            │           │    error_message          │
│    is_voice_note          │            │           │    created_at             │
│    transcription_status   │            │           └───────────┬───────────────┘
│    created_at             │            │                       │
└───────────┬───────────────┘            │                       │
            │                            │                       │
            │ 1:N                        │                       │ 1:N
            ▼                            │                       ▼
┌───────────────────────────┐            │           ┌───────────────────────────┐
│  message_transcriptions   │            │           │   whatsapp_deliveries     │
├───────────────────────────┤            │           ├───────────────────────────┤
│ PK id                     │            │           │ PK id                     │
│ FK media_id               │────────────┘           │ FK message_id             │
│    transcription_text     │                        │ FK response_id            │────┘
│    confidence             │                        │    delivery_type          │
│    language               │                        │    recipient_phone        │
│    service_used           │                        │    whatsapp_message_id    │
│    processing_time_ms     │                        │    delivery_status        │
│    status                 │                        │    api_response (JSON)    │
│    error_message          │                        │    sent_at                │
│    created_at             │                        │    delivered_at           │
└───────────────────────────┘                        │    read_at                │
                                                     └───────────────────────────┘


                              ┌───────────────────────────┐
                              │    phone_validations      │  (TABELA DE CACHE)
                              ├───────────────────────────┤
                              │ PK id                     │
                              │    phone_number (UK)      │
                              │    formatted_number       │
                              │    validation_api_response│
                              │    is_valid               │
                              │    last_validated         │
                              └───────────────────────────┘
```

---

## 🔗 Resumo das Relações

| Tabela Origem | Relacionamento | Tabela Destino | Chave Estrangeira |
|---------------|----------------|----------------|-------------------|
| `message_media` | N:1 | `messages` | `message_id` → `messages.id` |
| `message_transcriptions` | N:1 | `message_media` | `media_id` → `message_media.id` |
| `message_responses` | N:1 | `messages` | `message_id` → `messages.id` |
| `whatsapp_deliveries` | N:1 | `messages` | `message_id` → `messages.id` |
| `whatsapp_deliveries` | N:1 | `message_responses` | `response_id` → `message_responses.id` |
| `superbot_customer_links` | N:1 | `superbot_customers` | `superbot_customer_id` → `superbot_customers.id` |
| `superbot_customer_links` | N:1 | `mak.clientes` | `leads_customer_id` → `mak.clientes.id` |
| `superbot_customer_links` | N:1 | `mak.users` | `linked_by` → `mak.users.id` |
| `superbot_lead_origins` | N:1 | `superbot_customers` | `superbot_customer_id` → `superbot_customers.id` |
| `superbot_lead_origins` | N:1 | `sCart` | `lead_id` → `sCart.cSCart` |
| `superbot_lead_origins` | N:1 | `messages` | `message_id` → `messages.id` |

---

## 📦 Agrupamento por Funcionalidade

### 1. **Core do WhatsApp** (Database: `superbot`)
| Tabela | Descrição |
|--------|-----------|
| `superbot_customers` | Contatos do WhatsApp (JID, nome, telefone) |
| `messages` | Todas as mensagens de conversas |
| `message_media` | Arquivos de mídia (áudio, imagem, vídeo, documento) |
| `message_transcriptions` | Transcrições de áudio (via OpenAI Whisper) |
| `message_responses` | Respostas geradas por IA |
| `whatsapp_deliveries` | Log de entregas de mensagens |
| `phone_validations` | Cache de validações de telefone |

### 2. **Integração com Leads-Agent** (Database: `mak`)
| Tabela | Descrição |
|--------|-----------|
| `superbot_customer_links` | Vinculação WhatsApp ↔ Clientes do ERP |
| `superbot_lead_origins` | Leads originados do WhatsApp (tracking) |

---

## 📐 Views Disponíveis

| View | Descrição |
|------|-----------|
| `vw_superbot_leads_customers` | Clientes Superbot + dados do leads-agent unificados |
| `vw_superbot_customer_stats` | Estatísticas de conversas por cliente |
| `vw_superbot_lead_origins_summary` | Resumo de leads criados via WhatsApp |

---

## 🗄️ Esquema Detalhado

### `messages` - Mensagens de Conversas
```sql
id                  INT PK AUTO_INCREMENT
message_id          VARCHAR(255) UNIQUE -- ID único do WhatsApp
session_id          VARCHAR(50)         -- Agrupamento de conversas
sender_phone        VARCHAR(20) NOT NULL
recipient_phone     VARCHAR(20)
message_text        TEXT
source              ENUM('user', 'api')
message_type        ENUM('text', 'media', 'status')
direction           ENUM('incoming', 'outgoing')
status              ENUM('received', 'processing', 'completed', 'error')
original_timestamp  TIMESTAMP
received_at         TIMESTAMP
processed_at        TIMESTAMP
read_at             TIMESTAMP
delivered_at        TIMESTAMP
is_group            INT
environment         VARCHAR(20)
```

### `superbot_customers` - Contatos do WhatsApp
```sql
id            INT PK AUTO_INCREMENT
jid           VARCHAR(255) UNIQUE -- ID do WhatsApp (55119999@s.whatsapp.net)
name          VARCHAR(255)
push_name     VARCHAR(255)        -- Nome configurado no WhatsApp
phone_number  VARCHAR(50)
is_group      TINYINT(1)
created_at    TIMESTAMP
updated_at    TIMESTAMP
```

### `message_media` - Arquivos de Mídia
```sql
id                    INT PK AUTO_INCREMENT
message_id            INT FK → messages.id
type                  ENUM('audio', 'image', 'video', 'document')
file_name             VARCHAR(255)
file_size             BIGINT
mime_type             VARCHAR(100)
s3_url                TEXT          -- URL no Amazon S3
s3_key                VARCHAR(500)
local_path            VARCHAR(500)
duration              INT           -- Para áudio/vídeo
width, height         INT           -- Para imagens/vídeos
is_voice_note         TINYINT(1)
transcription_status  ENUM('pending', 'success', 'failed', 'skipped')
created_at            TIMESTAMP
```

### `superbot_customer_links` - Vinculação de Clientes
```sql
id                    INT PK AUTO_INCREMENT
superbot_customer_id  INT FK → superbot_customers.id
leads_customer_id     INT FK → mak.clientes.id
linked_by             INT FK → mak.users.id
confidence_score      DECIMAL(5,2)    -- Score de match automático
verified              BOOLEAN         -- Verificação manual
notes                 TEXT
linked_at             TIMESTAMP
```

---

## 🔄 Fluxo de Dados

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  WhatsApp API   │ ──▶  │    messages     │ ──▶  │ message_media   │
│  (Webhook)      │      │                 │      │                 │
└─────────────────┘      └────────┬────────┘      └────────┬────────┘
                                  │                        │
                                  ▼                        ▼
                         ┌────────────────┐       ┌─────────────────────┐
                         │ message_       │       │ message_            │
                         │ responses      │       │ transcriptions      │
                         │ (IA/n8n)       │       │ (Whisper)           │
                         └────────┬───────┘       └─────────────────────┘
                                  │
                                  ▼
                         ┌────────────────────┐
                         │ whatsapp_          │
                         │ deliveries         │
                         │ (Log de Envio)     │
                         └────────────────────┘

         INTEGRAÇÃO
       ┌───────────────────────────────────────────────────────────┐
       │                                                           │
       │  superbot_customers  ◄────▶  superbot_customer_links     │
       │         │                            │                    │
       │         │                            ▼                    │
       │         │                     mak.clientes (ERP)          │
       │         │                                                 │
       │         └────────────▶  superbot_lead_origins             │
       │                               │                           │
       │                               ▼                           │
       │                          sCart (Leads)                    │
       └───────────────────────────────────────────────────────────┘
```

---

*Documento gerado automaticamente com base nos arquivos DDL do sistema.*
