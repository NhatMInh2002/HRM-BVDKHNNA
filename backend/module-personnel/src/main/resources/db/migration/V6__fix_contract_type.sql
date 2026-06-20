-- Fix invalid contract_type values inserted by V5 seed (FULL_TIME không có trong enum)
UPDATE personnel.employees
SET contract_type = 'INDEFINITE'
WHERE contract_type = 'FULL_TIME';
