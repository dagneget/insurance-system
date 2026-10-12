-- V4: Payment Void and Ledger Audit Fields
ALTER TABLE payments
    ADD COLUMN IF NOT EXISTS void_reason VARCHAR(255),
    ADD COLUMN IF NOT EXISTS voided_at TIMESTAMP WITH TIME ZONE;
