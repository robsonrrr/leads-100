# Credit Agent Integration

## Overview

The Leads-Agent is integrated with the CSuite Credit Agent to provide enhanced credit evaluation capabilities. This integration allows for:

- **Customer credit profile retrieval** from the centralized Credit Agent
- **Order credit evaluation** using the Policy Engine
- **Risky customer identification** with risk grades and scores
- **Credit decision recording** for audit and analytics

## Architecture

```
┌─────────────────────────────────────────┐
│              Leads-Agent                │
│    (Frontend + Backend + WhatsApp)      │
└─────────────────────────────────────────┘
                    │
                    ▼
        ┌───────────────────────┐
        │  CreditAgentClient.js │
        │  (Hybrid fallback)    │
        └───────────────────────┘
                    │
      ┌─────────────┴─────────────┐
      ▼                           ▼
┌──────────────────┐    ┌──────────────────┐
│   Credit Agent   │    │   Local DB       │
│   (Primary)      │    │   (Fallback)     │
│   Port 8010      │    │   mak.v_clientes │
└──────────────────┘    └──────────────────┘
```

## Configuration

Add the following environment variables to your `.env` file:

```bash
# Credit Agent API
CREDIT_API_URL=https://csuite.internut.com.br/credit
CREDIT_API_ENABLED=true
CREDIT_API_TIMEOUT_MS=5000
```

| Variable | Description | Default |
|----------|-------------|---------|
| `CREDIT_API_URL` | Base URL of the Credit Agent API | `https://csuite.internut.com.br/credit` |
| `CREDIT_API_ENABLED` | Enable/disable Credit Agent integration | `true` |
| `CREDIT_API_TIMEOUT_MS` | Request timeout in milliseconds | `5000` |

## API Endpoints

### 1. Get Credit Status

```
GET /api/v2/analytics/credit/:customerId
```

Returns the credit status for a specific customer. Uses Credit Agent when available, falls back to local database.

**Response:**
```json
{
  "success": true,
  "data": {
    "customer_id": 12345,
    "customer_name": "Empresa ABC",
    "credit_limit": 50000,
    "credit_used": 15000,
    "credit_available": 35000,
    "overdue_days": 0,
    "status": "OK",
    "can_convert": true,
    "message": "Crédito disponível",
    "risk_grade": "B",
    "risk_score": 75,
    "source": "credit_agent"
  }
}
```

### 2. Evaluate Credit for Order

```
POST /api/v2/analytics/credit/evaluate
```

Evaluates credit for a specific order using the Credit Agent's Policy Engine.

**Request Body:**
```json
{
  "customer_id": 12345,
  "order_id": "ORD-2026-001",
  "order_total": 25000,
  "terms_days": 30,
  "installments": 3,
  "down_payment_pct": 0.1,
  "pricing_status": "OK",
  "margin_ok": true
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "source": "credit_agent",
    "outcome": "ALLOW",
    "approved_amount": 25000,
    "conditions": null,
    "reasons": [],
    "risk_grade": "B",
    "risk_score": 75,
    "customer_profile": { ... }
  }
}
```

**Outcome Values:**
| Outcome | Description |
|---------|-------------|
| `ALLOW` | Order approved automatically |
| `RECOMMEND` | Approved with conditions (e.g., down payment) |
| `ESCALATE` | Requires human approval (credit committee) |
| `DENY` | Blocked (high risk, delinquency) |

### 3. Get Risky Customers

```
GET /api/v2/analytics/credit/risky-customers
```

Returns customers with elevated credit risk.

**Response:**
```json
{
  "success": true,
  "data": {
    "success": true,
    "source": "credit_agent",
    "customers": [
      {
        "customer_id": 12345,
        "risk_grade": "D",
        "risk_score": 25,
        "credit_limit": 10000,
        "credit_used": 15000,
        "days_past_due_max": 45
      }
    ],
    "count": 1
  }
}
```

### 4. Get Blocked Credits

```
GET /api/v2/analytics/credit/blocked?limit=50
```

Returns customers with blocked credit (exceeded limit or overdue).

### 5. Credit Agent Health Check

```
GET /api/v2/analytics/credit/health
```

Checks the health of the Credit Agent integration.

**Response:**
```json
{
  "success": true,
  "data": {
    "credit_agent": {
      "enabled": true,
      "base_url": "https://csuite.internut.com.br/credit",
      "success": true,
      "status": "ok"
    }
  }
}
```

## Fallback Behavior

The integration uses a **hybrid strategy**:

1. **Primary**: Credit Agent API (when `CREDIT_API_ENABLED=true`)
2. **Fallback**: Local database queries (`mak.v_clientes_credito` view)

If the Credit Agent is unavailable or returns an error, the system automatically falls back to local database queries. The `source` field in responses indicates which data source was used:

- `credit_agent` - Data from Credit Agent API
- `local_db` - Data from local database query
- `local_fallback` - Fallback evaluation logic
- `fallback` - Default values when no data available

## Usage in FinancialService

```javascript
import { financialService } from '../services/analytics/FinancialService.js';

// Get credit status
const status = await financialService.getCreditStatus(customerId, authToken);

// Evaluate credit for order
const evaluation = await financialService.evaluateCreditForOrder({
  customerId: 12345,
  orderId: 'ORD-001',
  orderTotal: 25000,
  termsDays: 30
}, authToken);

// Get risky customers
const risky = await financialService.getRiskyCustomers(authToken);
```

## Direct Client Usage

```javascript
import { creditAgentClient } from '../services/credit/CreditAgentClient.js';

// Check if enabled
if (creditAgentClient.isEnabled()) {
  // Get customer profile
  const profile = await creditAgentClient.getCustomerProfile(12345, authToken);
  
  // Build evaluation payload
  const payload = creditAgentClient.buildEvaluationPayload({
    customerId: 12345,
    orderId: 'ORD-001',
    orderTotal: 25000,
    // ... other options
  });
  
  // Evaluate credit
  const result = await creditAgentClient.evaluateCredit(payload, authToken);
}
```

## Files Modified/Created

| File | Description |
|------|-------------|
| `backend/src/v2/services/credit/CreditAgentClient.js` | HTTP client for Credit Agent API |
| `backend/src/v2/services/credit/index.js` | Module exports |
| `backend/src/v2/services/analytics/FinancialService.js` | Updated with hybrid credit strategy |
| `backend/src/v2/controllers/analytics.controller.js` | New credit evaluation endpoints |
| `backend/src/v2/routes/analytics.routes.js` | New credit routes |
| `backend/.env` | Credit Agent configuration |

## Credit Agent Endpoints (Reference)

The Credit Agent (`c-suite/agents/credit`) exposes:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/credit/health` | Health check |
| GET | `/credit/me` | Authenticated user |
| POST | `/credit/v1/request` | Store order snapshot |
| POST | `/credit/v1/evaluate` | Evaluate credit via Policy Engine |
| GET | `/credit/v1/decision/{order_id}` | Get order decision |
| GET | `/credit/v1/customer/{customer_id}` | Customer credit profile |
| GET | `/credit/v1/decisions/today` | Today's decisions |
| GET | `/credit/v1/risky-customers` | High-risk customers |

## Related Documentation

- [Credit Agent README](../../c-suite/agents/credit/README.md)
- [CSuite Ecosystem State](../../c-suite/docs/strategic/CSUITE_ECOSYSTEM_STATE.md)
- [Policy Engine Documentation](../../c-suite/agents/executive/README.md)
