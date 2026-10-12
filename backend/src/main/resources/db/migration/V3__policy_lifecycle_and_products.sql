-- V3__policy_lifecycle_and_products.sql
-- Expand policy lifecycle: products, renewal linking, cancellation, and endorsements

ALTER TABLE policies
    ADD COLUMN product_code VARCHAR(50) NOT NULL DEFAULT 'COMPREHENSIVE',
    ADD COLUMN deductible_amount NUMERIC(15, 2) DEFAULT 500.00,
    ADD COLUMN cancellation_reason TEXT,
    ADD COLUMN cancelled_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN renewed_from_id BIGINT REFERENCES policies(id) ON DELETE SET NULL;

CREATE INDEX idx_policies_renewed_from ON policies(renewed_from_id);
CREATE INDEX idx_policies_product_code ON policies(product_code);

CREATE TABLE endorsements (
    id BIGSERIAL PRIMARY KEY,
    endorsement_number VARCHAR(50) NOT NULL UNIQUE,
    policy_id BIGINT NOT NULL REFERENCES policies(id) ON DELETE CASCADE,
    endorsement_type VARCHAR(50) NOT NULL,
    reason TEXT NOT NULL,
    changes_summary TEXT NOT NULL,
    effective_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_endorsements_policy_id ON endorsements(policy_id);
