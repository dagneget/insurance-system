# Motor Insurance Management Demo MVP

A functional, demonstrable Motor Insurance Management MVP built with Angular 22, Spring Boot 3.4.3, PostgreSQL 16, and Podman.

## System Overview
- **Dashboard**: Database-derived aggregates (policy counts, premium totals, simulated payments, outstanding balances, open claims).
- **Customers**: Registration, search by name/phone, and profile management.
- **Vehicles**: Customer-linked vehicle registry with unique registration plate enforcement.
- **Policies**: Unique policy numbering (`POL-yyyy-XXXX`), date consistency checks, vehicle-customer relationship validation, and automatic premium balance tracking.
- **Simulated Payments**: Transaction ledger with unique reference constraints and prohibition of payments exceeding the remaining balance.
- **Claims Workflow**: Strict state machine: `SUBMITTED` → `UNDER_REVIEW` → `APPROVED` or `REJECTED` → `SETTLED`. Validates incident date within policy coverage, enforces approved amounts, and restricts settlements to approved claims.
- **Data Persistence**: Backed by PostgreSQL 16 in a persistent Podman volume with Flyway migrations and synthetic seed records.

---

## Prerequisites
- **Java**: OpenJDK 21 (installed at `/usr/lib/jvm/java-21-openjdk-amd64`)
- **Maven**: 3.9+
- **Node.js**: v22+
- **npm**: 10+
- **Podman**: 5.4+ with Docker Compose provider plugin

---

## Quick Start (Local Setup)

### 1. Environment Configuration
Copy `.env.example` to `.env` (already created with local defaults):
```bash
cp .env.example .env
```

### 2. Start PostgreSQL Container
Start the PostgreSQL container via Podman Compose:
```bash
podman compose up -d
podman compose ps
```
The database will be healthy and available on `127.0.0.1:5432/insurance_db`.

### 3. Run the Spring Boot Backend
From the root directory:
```bash
cd backend
mvn spring-boot:run
```
The API starts on `http://localhost:8080`.
Flyway automatically runs migrations (`V1__initial_schema.sql` and `V2__seed_data.sql`).

Health check endpoint:
```bash
curl http://localhost:8080/api/health
```

### 4. Run the Angular Frontend
From the root directory:
```bash
cd frontend
npm start
```
Open your browser to: **`http://localhost:4200`**

---

## Automated Verification & Tests

### Backend Tests
Run the JUnit 5 and Mockito business-rule test suite:
```bash
cd backend
mvn test
```
*Tests coverage: Policy customer/date validation, payment duplicates & overpayment limits, claim coverage dates, state transitions, and settlement thresholds.*

### Frontend Tests
Run Vitest unit tests for Angular:
```bash
cd frontend
npm test -- --watch=false
```

### End-to-End API Scenario Test
To execute the automated end-to-end rehearsal script covering customer creation, vehicle registration, policy issuance, simulated payments, claim processing, settlement, and aggregate updates:
```bash
python3 - << 'EOF'
import json, urllib.request

base = "http://localhost:8080/api"
print("Dashboard summary:")
with urllib.request.urlopen(f"{base}/dashboard/summary") as res:
    print(json.dumps(json.loads(res.read().decode()), indent=2))
EOF
```

---

## Known Boundaries & Limitations
- **Simulated Transactions**: Financial records represent simulated demonstration entries, not live monetary transfers.
- **Single Organization**: Single-tenant motor insurance line for local demonstration.
- **Out of Scope**: Production payment gateways, SMS/telecom integration, external identity services, and public network security hardening.
