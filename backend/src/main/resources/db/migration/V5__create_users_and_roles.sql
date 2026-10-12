-- V5__create_users_and_roles.sql
-- Role-based authentication and user management schema

CREATE TABLE app_users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(80) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    customer_id BIGINT REFERENCES customers(id) ON DELETE SET NULL,
    auth_token VARCHAR(255) UNIQUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_app_users_username ON app_users (username);
CREATE INDEX idx_app_users_customer_id ON app_users (customer_id);
CREATE INDEX idx_app_users_auth_token ON app_users (auth_token);

CREATE TABLE user_roles (
    user_id BIGINT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    role_name VARCHAR(50) NOT NULL,
    PRIMARY KEY (user_id, role_name)
);

CREATE INDEX idx_user_roles_user_id ON user_roles (user_id);
CREATE INDEX idx_user_roles_role_name ON user_roles (role_name);

-- Seed Initial Actor Accounts (default password for all: password123)
-- SHA-256 of 'password123': ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f

-- 1. Policyholder 1: Abebe Bikila (customer_id = 1)
INSERT INTO app_users (username, password_hash, full_name, email, customer_id, auth_token, active)
VALUES ('abebe.customer', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Abebe Bikila', 'abebe.bikila@demo.test', 1, 'TOKEN-CUST-ABEBE-01', TRUE);

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_CUSTOMER' FROM app_users WHERE username = 'abebe.customer';

-- 2. Policyholder 2: Sara Tesfaye (customer_id = 2)
INSERT INTO app_users (username, password_hash, full_name, email, customer_id, auth_token, active)
VALUES ('sara.customer', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Sara Tesfaye', 'sara.tesfaye@demo.test', 2, 'TOKEN-CUST-SARA-02', TRUE);

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_CUSTOMER' FROM app_users WHERE username = 'sara.customer';

-- 3. Underwriting Lead: Alexander Reed
INSERT INTO app_users (username, password_hash, full_name, email, customer_id, auth_token, active)
VALUES ('alexander.uw', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Alexander Reed', 'alexander.reed@safemotor.demo', NULL, 'TOKEN-UW-ALEX-01', TRUE);

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_UNDERWRITER' FROM app_users WHERE username = 'alexander.uw';

-- 4. Senior Claims Adjuster: Sarah Chen
INSERT INTO app_users (username, password_hash, full_name, email, customer_id, auth_token, active)
VALUES ('sarah.claims', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Sarah Chen', 'sarah.chen@safemotor.demo', NULL, 'TOKEN-CLAIMS-SARAH-01', TRUE);

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_CLAIMS_OFFICER' FROM app_users WHERE username = 'sarah.claims';

-- 5. Finance / Billing Officer: Marcus Vance
INSERT INTO app_users (username, password_hash, full_name, email, customer_id, auth_token, active)
VALUES ('marcus.finance', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Marcus Vance', 'marcus.vance@safemotor.demo', NULL, 'TOKEN-FIN-MARCUS-01', TRUE);

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_FINANCE_OFFICER' FROM app_users WHERE username = 'marcus.finance';

-- 6. Field Insurance Agent: David Kim
INSERT INTO app_users (username, password_hash, full_name, email, customer_id, auth_token, active)
VALUES ('david.agent', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'David Kim', 'david.kim@safemotor.demo', NULL, 'TOKEN-AGENT-DAVID-01', TRUE);

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_AGENT' FROM app_users WHERE username = 'david.agent';

-- 7. Operations Director / Administrator (Multi-Role): Elena Rostova
INSERT INTO app_users (username, password_hash, full_name, email, customer_id, auth_token, active)
VALUES ('elena.manager', 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f', 'Elena Rostova', 'elena.rostova@safemotor.demo', NULL, 'TOKEN-ADMIN-ELENA-01', TRUE);

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_ADMIN' FROM app_users WHERE username = 'elena.manager';

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_UNDERWRITER' FROM app_users WHERE username = 'elena.manager';

INSERT INTO user_roles (user_id, role_name)
SELECT id, 'ROLE_CLAIMS_OFFICER' FROM app_users WHERE username = 'elena.manager';
