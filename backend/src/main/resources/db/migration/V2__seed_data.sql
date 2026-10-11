-- V2__seed_data.sql
-- Synthetic Demonstration Records for Motor Insurance System

-- Synthetic Customers
INSERT INTO customers (id, full_name, phone, email, created_at, updated_at) VALUES
(1, 'Abebe Bikila', '+251911234567', 'abebe.bikila@demo.test', NOW() - INTERVAL '60 days', NOW()),
(2, 'Sara Tesfaye', '+251922345678', 'sara.tesfaye@demo.test', NOW() - INTERVAL '45 days', NOW()),
(3, 'Dawit Haile', '+251933456789', 'dawit.haile@demo.test', NOW() - INTERVAL '20 days', NOW());

SELECT setval('customers_id_seq', (SELECT MAX(id) FROM customers));

-- Synthetic Vehicles
INSERT INTO vehicles (id, customer_id, registration_number, make, model, manufacture_year, created_at, updated_at) VALUES
(1, 1, '3-A12345', 'Toyota', 'Corolla', 2021, NOW() - INTERVAL '60 days', NOW()),
(2, 1, '3-B67890', 'Hyundai', 'Tucson', 2023, NOW() - INTERVAL '50 days', NOW()),
(3, 2, '2-C34567', 'Isuzu', 'D-Max', 2019, NOW() - INTERVAL '45 days', NOW()),
(4, 3, '3-D89012', 'Suzuki', 'Dzire', 2022, NOW() - INTERVAL '20 days', NOW());

SELECT setval('vehicles_id_seq', (SELECT MAX(id) FROM vehicles));

-- Synthetic Policies
INSERT INTO policies (id, policy_number, customer_id, vehicle_id, coverage_description, start_date, end_date, premium, status, created_at, updated_at) VALUES
(1, 'POL-2026-0001', 1, 1, 'Comprehensive Motor Insurance', '2026-01-01', '2026-12-31', 12000.00, 'ISSUED', NOW() - INTERVAL '60 days', NOW()),
(2, 'POL-2026-0002', 1, 2, 'Third-Party Liability Only', '2026-03-01', '2027-02-28', 4500.00, 'ISSUED', NOW() - INTERVAL '50 days', NOW()),
(3, 'POL-2026-0003', 2, 3, 'Commercial Vehicle Full Coverage', '2026-02-15', '2027-02-14', 18000.00, 'ISSUED', NOW() - INTERVAL '45 days', NOW()),
(4, 'POL-2026-0004', 3, 4, 'Private Motor Comprehensive', '2026-06-01', '2027-05-31', 8500.00, 'DRAFT', NOW() - INTERVAL '20 days', NOW());

SELECT setval('policies_id_seq', (SELECT MAX(id) FROM policies));

-- Synthetic Payments (Simulated)
INSERT INTO payments (id, policy_id, amount, transaction_reference, payment_method, status, note, payment_date, created_at) VALUES
(1, 1, 6000.00, 'DEMO-PAY-0001', 'DEMO', 'SUCCESS', 'Simulated 1st installment payment', NOW() - INTERVAL '58 days', NOW() - INTERVAL '58 days'),
(2, 1, 6000.00, 'DEMO-PAY-0002', 'DEMO', 'SUCCESS', 'Simulated 2nd installment payment (fully paid)', NOW() - INTERVAL '30 days', NOW() - INTERVAL '30 days'),
(3, 2, 2000.00, 'DEMO-PAY-0003', 'DEMO', 'SUCCESS', 'Simulated partial premium payment', NOW() - INTERVAL '48 days', NOW() - INTERVAL '48 days'),
(4, 3, 18000.00, 'DEMO-PAY-0004', 'DEMO', 'SUCCESS', 'Simulated full annual premium payment', NOW() - INTERVAL '44 days', NOW() - INTERVAL '44 days');

SELECT setval('payments_id_seq', (SELECT MAX(id) FROM payments));

-- Synthetic Claims
INSERT INTO claims (id, claim_number, policy_id, incident_date, description, requested_amount, status, decision_note, approved_amount, decision_date, settlement_amount, settlement_reference, settlement_note, settlement_date, created_at, updated_at) VALUES
(1, 'CLM-2026-0001', 1, '2026-05-10', 'Minor front bumper damage at intersection', 3500.00, 'SETTLED', 'Approved per inspection report', 3200.00, NOW() - INTERVAL '25 days', 3200.00, 'DEMO-SETTLE-0001', 'Simulated claim settlement disbursed', NOW() - INTERVAL '20 days', NOW() - INTERVAL '28 days', NOW()),
(2, 'CLM-2026-0002', 2, '2026-07-20', 'Cracked windshield due to gravel on highway', 1800.00, 'UNDER_REVIEW', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NOW() - INTERVAL '10 days', NOW()),
(3, 'CLM-2026-0003', 3, '2026-08-05', 'Side mirror knocked off while parked', 950.00, 'APPROVED', 'Standard replacement cost approved', 950.00, NOW() - INTERVAL '5 days', NULL, NULL, NULL, NULL, NOW() - INTERVAL '8 days', NOW());

SELECT setval('claims_id_seq', (SELECT MAX(id) FROM claims));
