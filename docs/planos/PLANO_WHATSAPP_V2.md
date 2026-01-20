# Plano de Refatoração: WhatsApp Page v2.0

**Data:** 2026-01-20
**Status:** Rascunho
**Objetivo:** Criar uma nova versão do módulo WhatsApp com arquitetura robusta, sem bugs de estado e com UX moderna.

---

## 1. Diagnóstico da Versão Atual (v1.0)

### Problemas Identificados

| Problema | Severidade | Descrição |
|----------|------------|-----------|
| **Race Conditions** | 🔴 Crítico | Mensagens de contatos anteriores aparecendo ao trocar de conversa |
| **Arquitetura Monolítica** | 🟡 Médio | `WhatsAppPage.jsx` tem 699 linhas, mistura lógica e apresentação |
| **Componentes Duplicados** | 🟡 Médio | `WhatsAppConversation.jsx` e `ConversationTimeline.jsx` têm sobreposição de funcionalidade |
| **Sem Estado Global** | 🟡 Médio | Cada componente gerencia seu próprio estado, causando dessincronização |
| **Sem Testes** | 🟡 Médio | Nenhum teste unitário ou de integração |
| **UX Básica** | 🟢 Baixo | Sem indicadores de loading consistentes, sem feedback de erros |

### Estrutura Atual
```
frontend/src/
├── pages/
│   └── WhatsAppPage.jsx (699 linhas - MUITO GRANDE)
├── components/Superbot/
│   ├── WhatsAppConversation.jsx (485 linhas)
│   ├── ConversationTimeline.jsx (778 linhas)
│   ├── WhatsAppDashboard.jsx
│   ├── WhatsAppActivityWidget.jsx
│   └── IntentAnalysisPanel.jsx
└── services/
    └── superbot.service.js
```

---

## 2. Arquitetura Proposta (v2.0)

### 2.1 Princípios de Design

1. **Single Responsibility**: Cada componente faz UMA coisa bem
2. **State Centralization**: Usar Context + useReducer para estado global do WhatsApp
3. **Composition over Inheritance**: Componentes pequenos e composáveis
4. **Request Management**: AbortController em TODAS as requisições
5. **Error Boundaries**: Tratamento de erros em nível de componente

### 2.2 Nova Estrutura de Arquivos

```
frontend/src/
├── pages/
│   └── whatsapp/
│       ├── index.jsx              // Apenas roteamento
│       ├── WhatsAppLayout.jsx     // Layout principal
│       └── routes.jsx             // Sub-rotas
│
├── features/whatsapp/
│   ├── context/
│   │   ├── WhatsAppContext.jsx    // Context Provider
│   │   ├── whatsappReducer.js     // Reducer com todas as actions
│   │   └── whatsappActions.js     // Action creators
│   │
│   ├── hooks/
│   │   ├── useWhatsApp.js         // Hook principal (consume context)
│   │   ├── useConversation.js     // Hook para conversa selecionada
│   │   ├── useMessages.js         // Hook para mensagens com paginação
│   │   └── useCustomerSearch.js   // Hook para busca de contatos
│   │
│   ├── components/
│   │   ├── ContactList/
│   │   │   ├── index.jsx
│   │   │   ├── ContactItem.jsx
│   │   │   ├── ContactSearch.jsx
│   │   │   └── ContactFilters.jsx
│   │   │
│   │   ├── Conversation/
│   │   │   ├── index.jsx
│   │   │   ├── MessageBubble.jsx
│   │   │   ├── MediaViewer.jsx
│   │   │   ├── AudioPlayer.jsx
│   │   │   ├── DateSeparator.jsx
│   │   │   └── ConversationHeader.jsx
│   │   │
│   │   ├── Sidebar/
│   │   │   ├── index.jsx
│   │   │   ├── CustomerInfo.jsx
│   │   │   ├── CustomerLink.jsx
│   │   │   └── IntentAnalysis.jsx
│   │   │
│   │   └── common/
│   │       ├── LoadingState.jsx
│   │       ├── ErrorState.jsx
│   │       └── EmptyState.jsx
│   │
│   ├── services/
│   │   └── whatsapp.api.js        // API calls com AbortController
│   │
│   └── utils/
│       ├── formatters.js          // Formatação de datas, telefones
│       └── constants.js           // Cores, labels de intents
│
└── services/
    └── superbot.service.js        // DEPRECADO - migrar para features/
```

---

## 3. Detalhamento Técnico

### 3.1 Context e Estado Global

```javascript
// features/whatsapp/context/whatsappReducer.js

const initialState = {
  // Lista de contatos
  contacts: [],
  contactsLoading: false,
  contactsError: null,
  
  // Contato selecionado
  selectedContact: null,
  
  // Conversas do contato
  conversations: [],
  conversationsLoading: false,
  
  // Sessão selecionada
  selectedSession: null,
  
  // Mensagens da sessão
  messages: [],
  messagesLoading: false,
  messagesHasMore: true,
  messagesOffset: 0,
  
  // Filtros
  filters: {
    search: '',
    sellerId: null,
    dateRange: null,
  }
}

// Actions
const ACTIONS = {
  SET_CONTACTS: 'SET_CONTACTS',
  SET_CONTACTS_LOADING: 'SET_CONTACTS_LOADING',
  SELECT_CONTACT: 'SELECT_CONTACT',
  CLEAR_CONTACT: 'CLEAR_CONTACT',
  SET_CONVERSATIONS: 'SET_CONVERSATIONS',
  SELECT_SESSION: 'SELECT_SESSION',
  SET_MESSAGES: 'SET_MESSAGES',
  APPEND_MESSAGES: 'APPEND_MESSAGES',
  CLEAR_MESSAGES: 'CLEAR_MESSAGES',
  SET_FILTERS: 'SET_FILTERS',
  RESET_ALL: 'RESET_ALL',
}
```

### 3.2 Hook Principal com Abort Controller

```javascript
// features/whatsapp/hooks/useMessages.js

import { useRef, useCallback } from 'react'
import { useWhatsAppContext } from '../context/WhatsAppContext'
import { whatsappApi } from '../services/whatsapp.api'

export function useMessages() {
  const { state, dispatch } = useWhatsAppContext()
  const abortControllerRef = useRef(null)
  const currentSessionRef = useRef(null)
  
  const loadMessages = useCallback(async (sessionId, reset = false) => {
    // Cancelar requisição anterior
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Criar novo controller
    abortControllerRef.current = new AbortController()
    currentSessionRef.current = sessionId
    
    if (reset) {
      dispatch({ type: 'CLEAR_MESSAGES' })
    }
    
    dispatch({ type: 'SET_MESSAGES_LOADING', payload: true })
    
    try {
      const response = await whatsappApi.getMessages(sessionId, {
        limit: 50,
        offset: reset ? 0 : state.messagesOffset,
        signal: abortControllerRef.current.signal
      })
      
      // Verificar se ainda é a sessão correta
      if (sessionId !== currentSessionRef.current) {
        return // Descartar resultado obsoleto
      }
      
      dispatch({
        type: reset ? 'SET_MESSAGES' : 'APPEND_MESSAGES',
        payload: response.data
      })
    } catch (error) {
      if (error.name === 'AbortError') return
      dispatch({ type: 'SET_MESSAGES_ERROR', payload: error.message })
    }
  }, [state.messagesOffset, dispatch])
  
  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  
  return {
    messages: state.messages,
    loading: state.messagesLoading,
    hasMore: state.messagesHasMore,
    loadMessages,
    loadMore: () => loadMessages(currentSessionRef.current, false)
  }
}
```

### 3.3 Componente de Mensagem Simplificado

```javascript
// features/whatsapp/components/Conversation/MessageBubble.jsx

import { memo } from 'react'
import { Box, Paper, Typography } from '@mui/material'
import { COLORS, formatTimestamp } from '../../utils'
import MediaViewer from './MediaViewer'
import AudioPlayer from './AudioPlayer'

const MessageBubble = memo(({ message, showAIBadge = true }) => {
  const isIncoming = message.direction === 'incoming'
  
  return (
    <Box sx={{ display: 'flex', justifyContent: isIncoming ? 'flex-start' : 'flex-end', mb: 0.5 }}>
      <Paper sx={{ maxWidth: '70%', p: 1.5, bgcolor: isIncoming ? COLORS.incoming : COLORS.outgoing }}>
        {message.media_url && <MediaViewer message={message} />}
        {message.message_text && (
          <Typography variant="body2">{message.message_text}</Typography>
        )}
        <Typography variant="caption" color="text.secondary">
          {formatTimestamp(message.received_at)}
        </Typography>
      </Paper>
    </Box>
  )
})

// memo() evita re-renders desnecessários
export default MessageBubble
```

---

## 4. Fases de Implementação

### Fase 1: Fundação (Backend de Estado)
*Duração estimada: 2-3 horas*

- [ ] Criar estrutura de pastas `features/whatsapp/`
- [ ] Implementar `WhatsAppContext.jsx` e `whatsappReducer.js`
- [ ] Implementar `whatsapp.api.js` com AbortController em todas as chamadas
- [ ] Criar hooks básicos: `useWhatsApp`, `useContacts`, `useMessages`
- [ ] Testes unitários para reducer

### Fase 2: Componentes de Lista de Contatos
*Duração estimada: 2-3 horas*

- [ ] `ContactList/index.jsx` - Lista virtualizada
- [ ] `ContactItem.jsx` - Item de contato com avatar e preview
- [ ] `ContactSearch.jsx` - Busca com debounce
- [ ] `ContactFilters.jsx` - Filtro por vendedor/data

### Fase 3: Componentes de Conversa
*Duração estimada: 3-4 horas*

- [ ] `Conversation/index.jsx` - Container principal
- [ ] `MessageBubble.jsx` - Bolha de mensagem (memoizada)
- [ ] `AudioPlayer.jsx` - Player de áudio isolado
- [ ] `MediaViewer.jsx` - Visualizador de imagens/vídeos
- [ ] `DateSeparator.jsx` - Separador de datas
- [ ] Lazy loading de mensagens antigas

### Fase 4: Sidebar e Informações
*Duração estimada: 1-2 horas*

- [ ] `Sidebar/CustomerInfo.jsx` - Dados do cliente
- [ ] `Sidebar/CustomerLink.jsx` - Vinculação com Leads-Agent
- [ ] `Sidebar/IntentAnalysis.jsx` - Análise de intenção

### Fase 5: Layout e Integração
*Duração estimada: 2-3 horas*

- [ ] `WhatsAppLayout.jsx` - Layout responsivo
- [ ] Integrar com roteamento existente
- [ ] Migrar rota de `/whatsapp/:phone` para novo sistema
- [ ] Testes de integração

### Fase 6: Polish e Deploy
*Duração estimada: 1-2 horas*

- [ ] Estados de loading/error/empty consistentes
- [ ] Animações de transição
- [ ] Keyboard shortcuts
- [ ] Performance profiling
- [ ] Deploy e rollback da versão antiga

---

## 5. Checklist de Qualidade

### Antes de Considerar Completo

- [ ] **Zero Race Conditions**: Trocar rapidamente de contato 10x sem bugs
- [ ] **Memory Leaks**: Usar React DevTools para verificar componentes desmontados
- [ ] **Performance**: Listar 100+ contatos sem lag
- [ ] **Acessibilidade**: Navegação por teclado funciona
- [ ] **Responsivo**: Funciona em tablet (768px)
- [ ] **Offline Handling**: Exibe mensagem se API offline

---

## 6. Riscos e Mitigações

| Risco | Probabilidade | Mitigação |
|-------|---------------|-----------|
| Feature flag quebra em produção | Média | Deploy em horário de baixo tráfego |
| Performance ruim com muitos contatos | Baixa | Usar virtualização (react-window) |
| Conflito com código existente | Média | Manter v1 funcionando em paralelo |

---

## 7. Próximos Passos Imediatos

1. **Aprovar este plano**
2. **Criar branch `feature/whatsapp-v2`**
3. **Iniciar Fase 1: Fundação**

---

*Documento criado com base na análise de bugs da v1.0 e melhores práticas React.*
