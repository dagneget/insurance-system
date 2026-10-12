-- V7__tariffs_authorities_and_ownership.sql
-- Tariffs configuration, underwriter authority limits, and agent/policy ownership

-- 1. Tariffs Configuration Table
CREATE TABLE tariffs (
    id BIGSERIAL PRIMARY KEY,
    product_code VARCHAR(50) UNIQUE NOT NULL,
    product_name VARCHAR(100) NOT NULL,
    base_rate_percentage NUMERIC(6,4) NOT NULL,
    min_premium NUMERIC(12,2) NOT NULL,
    tax_percentage NUMERIC(6,4) NOT NULL,
    standard_excess NUMERIC(12,2) NOT NULL,
    max_loading_percentage NUMERIC(6,4) NOT NULL,
    max_discount_percentage NUMERIC(6,4) NOT NULL,
    broker_commission_percentage NUMERIC(6,4) NOT NULL DEFAULT 0.1000,
    third_party_property_limit NUMERIC(12,2) DEFAULT 100000.00,
    is_active BOOLEAN DEFAULT TRUE NOT NULL,
    updated_by VARCHAR(100),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Seed Default Dynamic Tariffs
INSERT INTO tariffs (product_code, product_name, base_rate_percentage, min_premium, tax_percentage, standard_excess, max_loading_percentage, max_discount_percentage, broker_commission_percentage)
VALUES 
('COMPREHENSIVE', 'Comprehensive Motor Cover', 0.0450, 2500.00, 0.1500, 500.00, 0.3000, 0.2000, 0.1000),
('THIRD_PARTY', 'Statutory Third-Party Liability', 0.0150, 1000.00, 0.1500, 0.00, 0.1500, 0.1000, 0.0750),
('FIRE_AND_THEFT', 'Third-Party Fire & Theft', 0.0300, 1800.00, 0.1500, 350.00, 0.2000, 0.1500, 0.0850);

-- 2. Underwriter Authority Limits per User
CREATE TABLE underwriter_authorities (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT UNIQUE REFERENCES app_users(id) ON DELETE CASCADE,
    max_sum_insured NUMERIC(12,2) NOT NULL,
    max_loading_percentage NUMERIC(6,4) NOT NULL,
    max_discount_percentage NUMERIC(6,4) NOT NULL,
    can_approve_referrals BOOLEAN DEFAULT FALSE NOT NULL
);

-- Seed Authorities for Alexander Reed (Lead Underwriter) and Elena Rostova (Admin/Head of Underwriting)
INSERT INTO underwriter_authorities (user_id, max_sum_insured, max_loading_percentage, max_discount_percentage, can_approve_referrals)
SELECT id, 150000.00, 0.3000, 0.2000, TRUE FROM app_users WHERE username = 'alexander.uw';

INSERT INTO underwriter_authorities (user_id, max_sum_insured, max_loading_percentage, max_discount_percentage, can_approve_referrals)
SELECT id, 500000.00, 0.5000, 0.3000, TRUE FROM app_users WHERE username = 'elena.manager';

-- 3. Customer & Policy Ownership and KYC fields
ALTER TABLE customers
    ADD COLUMN agent_id BIGINT REFERENCES app_users(id),
    ADD COLUMN kyc_status VARCHAR(50) DEFAULT 'PENDING' NOT NULL;

ALTER TABLE policies
    ADD COLUMN agent_id BIGINT REFERENCES app_users(id),
    ADD COLUMN referral_flag BOOLEAN DEFAULT FALSE NOT NULL,
    ADD COLUMN referral_reason TEXT,
    ADD COLUMN underwriting_subjectivities TEXT,
    ADD COLUMN vehicle_market_value NUMERIC(12,2);

-- Assign existing demo customers and policies to David Kim (agent) for initial demo continuity
UPDATE customers 
SET agent_id = (SELECT id FROM app_users WHERE username = 'david.agent'),
    kyc_status = 'VERIFIED';

UPDATE policies 
SET agent_id = (SELECT id FROM app_users WHERE username = 'david.agent'),
    vehicle_market_value = 25000.00;
