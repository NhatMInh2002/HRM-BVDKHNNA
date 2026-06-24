-- V7: Thêm nhân viên test + attendance + leave + payroll data

-- =============================================
-- THÊM NHÂN VIÊN (tổng ~30 NV)
-- =============================================
INSERT INTO personnel.employees (id, employee_code, full_name, email, phone, gender, date_of_birth, join_date, status, contract_type, department_id, position, created_by)
SELECT
    gen_random_uuid(),
    e.code,
    e.full_name,
    e.email,
    e.phone,
    e.gender,
    e.dob::DATE,
    e.join_date::DATE,
    e.status,
    e.contract_type,
    (SELECT id FROM personnel.departments WHERE code = e.dept_code),
    e.position,
    'system'
FROM (VALUES
    -- Ban Giám đốc
    ('NV011', 'Trần Quang Hải',       'tq.hai@bvnghean.vn',      '0912000011', 'MALE',   '1975-02-10', '2010-01-01', 'ACTIVE',      'INDEFINITE',     'BGD',     'Phó Giám đốc'),
    ('NV012', 'Nguyễn Thị Lan',       'nt.lan@bvnghean.vn',      '0912000012', 'FEMALE', '1980-06-15', '2012-03-01', 'ACTIVE',      'INDEFINITE',     'BGD',     'Phó Giám đốc'),
    -- Phòng TCCB
    ('NV013', 'Lê Văn Mạnh',          'lv.manh@bvnghean.vn',     '0912000013', 'MALE',   '1987-09-20', '2015-06-01', 'ACTIVE',      'INDEFINITE',     'P-TCCB',  'Chuyên viên NS'),
    ('NV014', 'Phạm Thị Nga',         'pt.nga@bvnghean.vn',      '0912000014', 'FEMALE', '1991-12-05', '2018-02-01', 'ACTIVE',      'INDEFINITE',     'P-TCCB',  'Chuyên viên NS'),
    -- Phòng CNTT
    ('NV015', 'Đỗ Văn Oanh',          'dv.oanh@bvnghean.vn',     '0912000015', 'MALE',   '1993-03-28', '2020-08-01', 'ACTIVE',      'FIXED_TERM_2Y',  'P-CNTT',  'Kỹ sư hạ tầng'),
    ('NV016', 'Vũ Thị Phúc',          'vt.phuc@bvnghean.vn',     '0912000016', 'FEMALE', '1995-07-14', '2022-01-10', 'ACTIVE',      'FIXED_TERM_1Y',  'P-CNTT',  'Kỹ sư phần mềm'),
    -- Khoa Cấp cứu
    ('NV017', 'Hoàng Văn Quân',       'hv.quan@bvnghean.vn',     '0912000017', 'MALE',   '1984-01-22', '2013-05-01', 'ACTIVE',      'INDEFINITE',     'K-CC',    'Bác sĩ trưởng khoa'),
    ('NV018', 'Bùi Thị Roi',          'bt.roi@bvnghean.vn',      '0912000018', 'FEMALE', '1989-04-18', '2016-09-01', 'ACTIVE',      'INDEFINITE',     'K-CC',    'Bác sĩ'),
    ('NV019', 'Ngô Minh Sơn',         'nm.son@bvnghean.vn',      '0912000019', 'MALE',   '1992-08-30', '2019-12-01', 'ACTIVE',      'INDEFINITE',     'K-CC',    'Điều dưỡng'),
    ('NV020', 'Lý Thị Thu',           'lt.thu@bvnghean.vn',      '0912000020', 'FEMALE', '1996-11-05', '2022-06-15', 'PROBATION',   'PROBATION',      'K-CC',    'Điều dưỡng tập sự'),
    -- Khoa Nhi
    ('NV021', 'Trịnh Văn Uy',         'tv.uy@bvnghean.vn',       '0912000021', 'MALE',   '1983-05-12', '2012-10-01', 'ACTIVE',      'INDEFINITE',     'K-NHISS', 'Bác sĩ trưởng khoa'),
    ('NV022', 'Dương Thị Vân',        'dt.van@bvnghean.vn',      '0912000022', 'FEMALE', '1988-09-25', '2015-04-01', 'ACTIVE',      'INDEFINITE',     'K-NHISS', 'Bác sĩ'),
    -- Trung tâm Tim mạch
    ('NV023', 'Phan Đức Xuân',        'pd.xuan@bvnghean.vn',     '0912000023', 'MALE',   '1978-03-07', '2008-01-01', 'ACTIVE',      'INDEFINITE',     'TT-TM-NTM1', 'Trưởng trung tâm'),
    ('NV024', 'Đặng Thị Yến',         'dt.yen@bvnghean.vn',      '0912000024', 'FEMALE', '1985-07-19', '2014-08-01', 'ACTIVE',      'INDEFINITE',     'TT-TM-NTM1', 'Bác sĩ'),
    -- Phòng Tài chính
    ('NV025', 'Lê Văn Zung',          'lv.zung@bvnghean.vn',     '0912000025', 'MALE',   '1986-10-03', '2014-01-15', 'ACTIVE',      'INDEFINITE',     'P-TCKT',  'Kế toán trưởng'),
    -- Phòng Điều dưỡng
    ('NV026', 'Trần Thị Ái',          'tt.ai@bvnghean.vn',       '0912000026', 'FEMALE', '1989-02-14', '2016-03-01', 'ACTIVE',      'INDEFINITE',     'P-DD',    'Điều dưỡng'),
    ('NV027', 'Nguyễn Văn Bảo',       'nv.bao@bvnghean.vn',      '0912000027', 'MALE',   '1991-06-08', '2018-07-01', 'ACTIVE',      'FIXED_TERM_2Y',  'P-DD',    'Điều dưỡng'),
    -- Khoa Da liễu
    ('NV028', 'Phạm Thị Châu',        'pt.chau@bvnghean.vn',     '0912000028', 'FEMALE', '1982-12-20', '2011-09-01', 'ACTIVE',      'INDEFINITE',     'K-DALIEU','Bác sĩ trưởng khoa'),
    -- Nghỉ
    ('NV029', 'Võ Văn Đức',           'vv.duc@bvnghean.vn',      '0912000029', 'MALE',   '1990-04-15', '2017-05-01', 'ON_LEAVE',    'INDEFINITE',     'P-CNTT',  'Lập trình viên'),
    ('NV030', 'Hà Thị Ê',             'ht.e@bvnghean.vn',        '0912000030', 'FEMALE', '1994-08-22', '2021-10-01', 'TERMINATED',  'FIXED_TERM_1Y',  'K-PS',    'Điều dưỡng')
) AS e(code, full_name, email, phone, gender, dob, join_date, status, contract_type, dept_code, position)
WHERE EXISTS (SELECT 1 FROM personnel.departments WHERE code = e.dept_code)
ON CONFLICT (employee_code) DO NOTHING;

-- =============================================
-- ATTENDANCE RECORDS — tháng 6/2026
-- =============================================
INSERT INTO attendance.attendance_records (employee_id, work_date, check_in, check_out, status, created_by)
SELECT
    e.id,
    d.work_date,
    (d.work_date::TIMESTAMP + INTERVAL '7 hours' + (random() * 30 || ' minutes')::INTERVAL) AT TIME ZONE 'Asia/Ho_Chi_Minh',
    (d.work_date::TIMESTAMP + INTERVAL '17 hours' + (random() * 30 || ' minutes')::INTERVAL) AT TIME ZONE 'Asia/Ho_Chi_Minh',
    'PRESENT',
    'system'
FROM personnel.employees e
CROSS JOIN (
    SELECT generate_series(
        '2026-06-02'::DATE,
        '2026-06-21'::DATE,
        '1 day'::INTERVAL
    )::DATE AS work_date
) d
WHERE e.employee_code IN ('NV001','NV002','NV003','NV004','NV005','NV006','NV007','NV008','NV017','NV018')
  AND EXTRACT(DOW FROM d.work_date) NOT IN (0, 6)  -- bỏ thứ 7, CN
ON CONFLICT (employee_id, work_date) DO NOTHING;

-- NV009 có vài buổi nghỉ không phép
INSERT INTO attendance.attendance_records (employee_id, work_date, check_in, check_out, status, note, created_by)
SELECT e.id, d.work_date, NULL, NULL, 'ABSENT', 'Nghỉ không phép', 'system'
FROM personnel.employees e
CROSS JOIN (VALUES ('2026-06-09'::DATE), ('2026-06-10'::DATE), ('2026-06-16'::DATE)) AS d(work_date)
WHERE e.employee_code = 'NV009'
ON CONFLICT (employee_id, work_date) DO NOTHING;

-- =============================================
-- LEAVE REQUESTS
-- =============================================
INSERT INTO attendance.leave_requests (employee_id, leave_type, start_date, end_date, total_days, reason, status, created_by)
SELECT e.id, r.leave_type, r.start_date::DATE, r.end_date::DATE, r.total_days, r.reason, r.status, 'system'
FROM personnel.employees e
JOIN (VALUES
    ('NV002', 'ANNUAL',    '2026-06-05', '2026-06-06', 2.0, 'Nghỉ phép năm',         'APPROVED'),
    ('NV003', 'SICK',      '2026-06-10', '2026-06-10', 1.0, 'Ốm, có giấy bác sĩ',   'APPROVED'),
    ('NV004', 'PERSONAL',  '2026-06-15', '2026-06-15', 1.0, 'Việc gia đình',          'PENDING'),
    ('NV005', 'ANNUAL',    '2026-06-20', '2026-06-21', 2.0, 'Du lịch gia đình',       'APPROVED'),
    ('NV017', 'SICK',      '2026-06-03', '2026-06-04', 2.0, 'Khám định kỳ',           'APPROVED'),
    ('NV001', 'ANNUAL',    '2026-07-07', '2026-07-11', 5.0, 'Nghỉ phép hè',           'PENDING'),
    ('NV006', 'MATERNITY', '2026-07-01', '2026-12-31', 180.0,'Nghỉ thai sản',         'APPROVED'),
    ('NV008', 'PERSONAL',  '2026-06-18', '2026-06-18', 1.0, 'Đám cưới anh họ',       'REJECTED')
) AS r(emp_code, leave_type, start_date, end_date, total_days, reason, status)
ON r.emp_code = e.employee_code
ON CONFLICT DO NOTHING;

-- =============================================
-- PAYROLL RECORDS — tháng 5/2026
-- =============================================
INSERT INTO payroll.payroll_records (
    employee_id, period_year, period_month,
    basic_salary, total_allowance, ot_pay,
    gross_salary,
    bhxh_employee, bhyt_employee, bhtn_employee, pit,
    other_deduction, total_deduction, net_salary,
    working_days, actual_days, ot_hours,
    status, created_by
)
SELECT
    e.id,
    2026, 5,
    p.basic_salary,
    p.allowance,
    p.ot_pay,
    p.basic_salary + p.allowance + p.ot_pay AS gross_salary,
    ROUND((p.basic_salary + p.allowance) * 0.08, 0) AS bhxh,
    ROUND((p.basic_salary + p.allowance) * 0.015, 0) AS bhyt,
    ROUND((p.basic_salary + p.allowance) * 0.01, 0) AS bhtn,
    p.pit,
    0 AS other_deduction,
    ROUND((p.basic_salary + p.allowance) * 0.105, 0) + p.pit AS total_deduction,
    (p.basic_salary + p.allowance + p.ot_pay) - (ROUND((p.basic_salary + p.allowance) * 0.105, 0) + p.pit) AS net_salary,
    22, p.actual_days, p.ot_hours,
    p.status, 'system'
FROM personnel.employees e
JOIN (VALUES
    ('NV001', 25000000, 3000000,  500000, 2000000, 22, 4.0,  'PAID'),
    ('NV002', 20000000, 2500000,  300000, 1500000, 22, 0.0,  'PAID'),
    ('NV003', 18000000, 1500000,  600000, 1000000, 22, 8.0,  'PAID'),
    ('NV004', 16000000, 1200000,    0,     800000, 22, 0.0,  'PAID'),
    ('NV005', 17000000, 1500000,  200000, 900000,  22, 2.0,  'PAID'),
    ('NV006', 15000000, 1000000,    0,     700000, 22, 0.0,  'PAID'),
    ('NV007', 14000000,  800000,    0,     600000, 22, 0.0,  'PAID'),
    ('NV008', 16000000, 1200000,  100000, 800000,  22, 1.0,  'PAID'),
    ('NV009', 12000000,  500000,    0,     400000, 19, 0.0,  'APPROVED'),
    ('NV010', 17000000, 1500000,    0,     900000, 22, 0.0,  'PAID'),
    ('NV011', 22000000, 2800000,  400000, 1800000, 22, 3.0,  'PAID'),
    ('NV012', 21000000, 2600000,  350000, 1700000, 22, 2.0,  'PAID'),
    ('NV017', 30000000, 5000000, 1000000, 4000000, 20, 5.0,  'PAID'),
    ('NV018', 22000000, 2000000,  800000, 1500000, 22, 8.0,  'PAID'),
    ('NV023', 35000000, 6000000, 1500000, 5000000, 22, 6.0,  'PAID'),
    ('NV025', 19000000, 2000000,    0,    1200000, 22, 0.0,  'PAID')
) AS p(emp_code, basic_salary, allowance, ot_pay, pit, actual_days, ot_hours, status)
ON p.emp_code = e.employee_code
ON CONFLICT (employee_id, period_year, period_month) DO NOTHING;

-- Payroll tháng 6/2026 — DRAFT
INSERT INTO payroll.payroll_records (
    employee_id, period_year, period_month,
    basic_salary, total_allowance, ot_pay,
    gross_salary,
    bhxh_employee, bhyt_employee, bhtn_employee, pit,
    other_deduction, total_deduction, net_salary,
    working_days, actual_days, ot_hours,
    status, created_by
)
SELECT
    e.id, 2026, 6,
    p.basic_salary, p.allowance, 0,
    p.basic_salary + p.allowance,
    ROUND((p.basic_salary + p.allowance) * 0.08, 0),
    ROUND((p.basic_salary + p.allowance) * 0.015, 0),
    ROUND((p.basic_salary + p.allowance) * 0.01, 0),
    p.pit, 0,
    ROUND((p.basic_salary + p.allowance) * 0.105, 0) + p.pit,
    (p.basic_salary + p.allowance) - (ROUND((p.basic_salary + p.allowance) * 0.105, 0) + p.pit),
    22, 22, 0, 'DRAFT', 'system'
FROM personnel.employees e
JOIN (VALUES
    ('NV001', 25000000, 3000000, 2000000),
    ('NV002', 20000000, 2500000, 1500000),
    ('NV003', 18000000, 1500000, 1000000),
    ('NV004', 16000000, 1200000,  800000),
    ('NV005', 17000000, 1500000,  900000),
    ('NV017', 30000000, 5000000, 4000000),
    ('NV023', 35000000, 6000000, 5000000)
) AS p(emp_code, basic_salary, allowance, pit)
ON p.emp_code = e.employee_code
ON CONFLICT (employee_id, period_year, period_month) DO NOTHING;
