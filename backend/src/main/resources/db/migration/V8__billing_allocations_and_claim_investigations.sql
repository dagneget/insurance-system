-- V8__billing_allocations_and_claim_investigations.sql
-- Premium billing schedules, payment allocations, claim loss adjusting, and idempotent claim payouts

-- 1. Premium Billing Schedules (Installments)
CREATE TABLE billing_schedules (
    id BIGSERIAL PRIMARY KEY,
    policy_id BIGINT REFERENCES policies(id) ON DELETE CASCADE NOT NULL,
    installment_number INT NOT NULL,
    total_installments INT NOT NULL,
    due_date DATE NOT NULL,
    amount_due NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    grace_period_days INT DEFAULT 15 NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING' NOT NULL
);

CREATE INDEX idx_billing_schedules_policy ON billing_schedules (policy_id);
CREATE INDEX idx_billing_schedules_status ON billing_schedules (status);
CREATE INDEX idx_billing_schedules_due_date ON billing_schedules (due_date);

-- 2. Payment Allocations
CREATE TABLE payment_allocations (
    id BIGSERIAL PRIMARY KEY,
    payment_id BIGINT REFERENCES payments(id) ON DELETE CASCADE NOT NULL,
    billing_schedule_id BIGINT REFERENCES billing_schedules(id) ON DELETE CASCADE NOT NULL,
    allocated_amount NUMERIC(12,2) NOT NULL,
    allocated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE INDEX idx_payment_allocations_pay ON payment_allocations (payment_id);
CREATE INDEX idx_payment_allocations_sched ON payment_allocations (billing_schedule_id);

-- 3. Void Maker-Checker Columns on Payments
ALTER TABLE payments
    ADD COLUMN maker_username VARCHAR(100),
    ADD COLUMN checker_username VARCHAR(100),
    ADD COLUMN void_status VARCHAR(50) DEFAULT 'NONE' NOT NULL;

-- 4. Claim Loss Investigations & Adjusting
CREATE TABLE claim_investigations (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT UNIQUE REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
    assigned_adjuster_id BIGINT REFERENCES app_users(id),
    claim_type VARCHAR(50) DEFAULT 'OWN_DAMAGE' NOT NULL,
    surveyor_name VARCHAR(150),
    surveyor_notes TEXT,
    repair_estimate NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    depreciation_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    excess_applied NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    salvage_value NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    sum_insured NUMERIC(12,2),
    market_value NUMERIC(12,2),
    is_total_loss BOOLEAN DEFAULT FALSE NOT NULL,
    fraud_flags JSONB,
    investigation_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL
);

CREATE INDEX idx_claim_investigations_claim ON claim_investigations (claim_id);
CREATE INDEX idx_claim_investigations_adjuster ON claim_investigations (assigned_adjuster_id);

-- 5. Claim Payouts with Idempotency Key
CREATE TABLE claim_payouts (
    id BIGSERIAL PRIMARY KEY,
    claim_id BIGINT UNIQUE REFERENCES claims(id) ON DELETE CASCADE NOT NULL,
    approved_amount NUMERIC(12,2) NOT NULL,
    disbursed_amount NUMERIC(12,2),
    payout_method VARCHAR(50),
    transaction_reference VARCHAR(100) UNIQUE,
    idempotency_key VARCHAR(100) UNIQUE,
    disbursed_by VARCHAR(100),
    disbursed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'PENDING_FINANCE' NOT NULL,
    notes TEXT
);

CREATE INDEX idx_claim_payouts_claim ON claim_payouts (claim_id);
CREATE INDEX idx_claim_payouts_status ON claim_payouts (status);

-- 6. Backfill Initial Billing Schedules for existing demo policies
INSERT INTO billing_schedules (policy_id, installment_number, total_installments, due_date, amount_due, amount_paid, status)
SELECT 
    p.id, 
    1, 
    1, 
    p.start_date, 
    p.premium, 
    COALESCE((SELECT SUM(amount) FROM payments WHERE policy_id = p.id AND status = 'SUCCESS'), 0),
    CASE 
        WHEN COALESCE((SELECT SUM(amount) FROM payments WHERE policy_id = p.id AND status = 'SUCCESS'), 0) >= p.premium THEN 'PAID'
        WHEN COALESCE((SELECT SUM(amount) FROM payments WHERE policy_id = p.id AND status = 'SUCCESS'), 0) > 0 THEN 'PARTIAL'
        ELSE 'PENDING'
    END
FROM policies p;
