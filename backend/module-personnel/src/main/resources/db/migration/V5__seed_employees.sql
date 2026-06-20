-- Seed test employees for development
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
    ('NV001', 'Nguyễn Văn An',      'nv.an@bvhanna.vn',      '0912000001', 'MALE',   '1985-03-15', '2015-01-10', 'ACTIVE',     'FULL_TIME',  'BGD',   'Giám đốc'),
    ('NV002', 'Trần Thị Bình',      'tt.binh@bvhanna.vn',    '0912000002', 'FEMALE', '1988-07-22', '2016-04-01', 'ACTIVE',     'FULL_TIME',  'P-TCCB','Trưởng phòng'),
    ('NV003', 'Lê Minh Cường',      'lm.cuong@bvhanna.vn',   '0912000003', 'MALE',   '1990-11-05', '2018-08-15', 'ACTIVE',     'FULL_TIME',  'P-CNTT','Lập trình viên'),
    ('NV004', 'Phạm Thị Dung',      'pt.dung@bvhanna.vn',    '0912000004', 'FEMALE', '1992-01-30', '2019-03-20', 'ACTIVE',     'FULL_TIME',  'P-TCKT','Kế toán viên'),
    ('NV005', 'Hoàng Văn Em',       'hv.em@bvhanna.vn',      '0912000005', 'MALE',   '1987-06-18', '2017-09-01', 'ACTIVE',     'FULL_TIME',  'P-DD',  'Điều dưỡng trưởng'),
    ('NV006', 'Vũ Thị Phương',      'vt.phuong@bvhanna.vn',  '0912000006', 'FEMALE', '1993-09-12', '2020-01-05', 'ACTIVE',     'FULL_TIME',  'P-KHTH','Chuyên viên KH'),
    ('NV007', 'Đặng Quốc Giang',    'dq.giang@bvhanna.vn',   '0912000007', 'MALE',   '1991-04-25', '2019-11-15', 'ACTIVE',     'PART_TIME',  'P-QLCL','Chuyên viên CL'),
    ('NV008', 'Bùi Thị Hoa',        'bt.hoa@bvhanna.vn',     '0912000008', 'FEMALE', '1989-12-08', '2016-06-01', 'ACTIVE',     'FULL_TIME',  'P-CSHT','Chuyên viên CSHT'),
    ('NV009', 'Ngô Văn Inh',        'nv.inh@bvhanna.vn',     '0912000009', 'MALE',   '1994-08-14', '2021-02-20', 'PROBATION',  'FULL_TIME',  'P-CNTT','Junior Developer'),
    ('NV010', 'Lý Thị Kim',         'lt.kim@bvhanna.vn',     '0912000010', 'FEMALE', '1986-05-03', '2015-07-10', 'ACTIVE',     'FULL_TIME',  'P-KTNS','Kiểm toán viên')
) AS e(code, full_name, email, phone, gender, dob, join_date, status, contract_type, dept_code, position)
WHERE EXISTS (SELECT 1 FROM personnel.departments WHERE code = e.dept_code);
