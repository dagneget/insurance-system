-- V9__provision_missing_customer_users.sql
-- Ensure all existing customers have a policyholder login account in app_users and user_roles

DO $$
DECLARE
    r RECORD;
    v_clean_name TEXT;
    v_base_username TEXT;
    v_final_username TEXT;
    v_suffix INT;
    v_user_id BIGINT;
    v_pass_hash TEXT := 'ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f'; -- SHA-256 for password123
BEGIN
    FOR r IN (
        SELECT c.id, c.full_name, c.email
        FROM customers c
        LEFT JOIN app_users u ON u.customer_id = c.id
        WHERE u.id IS NULL
        ORDER BY c.id ASC
    ) LOOP
        -- Normalize full name into username
        v_clean_name := lower(trim(both '.' from regexp_replace(regexp_replace(r.full_name, '[^a-zA-Z0-9]+', '.', 'g'), '\.+', '.', 'g')));
        IF v_clean_name = '' OR v_clean_name IS NULL THEN
            v_clean_name := 'customer.' || r.id;
        END IF;

        v_base_username := v_clean_name || '.customer';
        v_final_username := v_base_username;
        v_suffix := 1;

        -- Check collisions against app_users
        WHILE EXISTS (SELECT 1 FROM app_users WHERE username = v_final_username) LOOP
            v_final_username := v_base_username || v_suffix;
            v_suffix := v_suffix + 1;
        END LOOP;

        -- Insert user record
        INSERT INTO app_users (username, password_hash, full_name, email, customer_id, active, created_at, updated_at)
        VALUES (v_final_username, v_pass_hash, r.full_name, r.email, r.id, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING id INTO v_user_id;

        -- Assign customer role
        INSERT INTO user_roles (user_id, role_name)
        VALUES (v_user_id, 'ROLE_CUSTOMER')
        ON CONFLICT DO NOTHING;
    END LOOP;
END $$;
