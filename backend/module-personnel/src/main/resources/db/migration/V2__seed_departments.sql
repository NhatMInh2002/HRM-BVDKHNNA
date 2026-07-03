-- Seed danh sách phòng ban HNĐK Nghệ An
-- Cấu trúc phân cấp: nhóm cha → đơn vị thực tế

-- ── Nhóm cha ─────────────────────────────────────────────────────────────────
INSERT INTO personnel.departments (id, code, name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'GRP-BAN',        'BAN LÃNH ĐẠO'),
  ('00000000-0000-0000-0000-000000000002', 'GRP-PHONG',      'KHỐI PHÒNG BAN'),
  ('00000000-0000-0000-0000-000000000003', 'GRP-KHOA',       'KHỐI LÂM SÀNG & CẬN LÂM SÀNG'),
  ('00000000-0000-0000-0000-000000000004', 'GRP-TRUNGTAM',   'TRUNG TÂM CHUYÊN SÂU');

-- ── Ban Giám đốc ─────────────────────────────────────────────────────────────
INSERT INTO personnel.departments (code, name, parent_id) VALUES
  ('BGD', 'BAN GIÁM ĐỐC', '00000000-0000-0000-0000-000000000001');

-- ── Khối Phòng ban ───────────────────────────────────────────────────────────
INSERT INTO personnel.departments (code, name, parent_id) VALUES
  ('P-TCCB',    'PHÒNG TỔ CHỨC CÁN BỘ',                        '00000000-0000-0000-0000-000000000002'),
  ('P-KHTH',    'PHÒNG KẾ HOẠCH TỔNG HỢP',                     '00000000-0000-0000-0000-000000000002'),
  ('P-DD',      'PHÒNG ĐIỀU DƯỠNG',                             '00000000-0000-0000-0000-000000000002'),
  ('P-TCKT',    'PHÒNG TÀI CHÍNH KẾ TOÁN',                     '00000000-0000-0000-0000-000000000002'),
  ('P-CSHT',    'PHÒNG CƠ SỞ HẠ TẦNG VÀ TRANG THIẾT BỊ',      '00000000-0000-0000-0000-000000000002'),
  ('P-CNTT',    'PHÒNG CÔNG NGHỆ THÔNG TIN',                    '00000000-0000-0000-0000-000000000002'),
  ('P-QLCL',    'PHÒNG QUẢN LÝ CHẤT LƯỢNG',                    '00000000-0000-0000-0000-000000000002'),
  ('P-KTNS',    'PHÒNG KIỂM TOÁN NỘI BỘ',                      '00000000-0000-0000-0000-000000000002'),
  ('T-CTXH',    'TỔ CÔNG TÁC XÃ HỘI',                          '00000000-0000-0000-0000-000000000002'),
  ('T-HCQT',    'TỔ HÀNH CHÍNH QUẢN TRỊ',                      '00000000-0000-0000-0000-000000000002');

-- ── Khối Lâm sàng & Cận lâm sàng ────────────────────────────────────────────
INSERT INTO personnel.departments (code, name, parent_id) VALUES
  ('K-PS',      'KHOA PHỤ SẢN',                                 '00000000-0000-0000-0000-000000000003'),
  ('K-XQ',      'KHOA XQUANG',                                   '00000000-0000-0000-0000-000000000003'),
  ('K-TDCN',    'KHOA THĂM DÒ CHỨC NĂNG',                       '00000000-0000-0000-0000-000000000003'),
  ('K-KSNK',    'KHOA KIỂM SOÁT NHIỄM KHUẨN',                   '00000000-0000-0000-0000-000000000003'),
  ('K-CC',      'KHOA CẤP CỨU',                                  '00000000-0000-0000-0000-000000000003'),
  ('K-DUOC',    'KHOA DƯỢC',                                      '00000000-0000-0000-0000-000000000003'),
  ('K-KB',      'KHOA KHÁM BỆNH',                                 '00000000-0000-0000-0000-000000000003'),
  ('K-GMHS',    'KHOA GÂY MÊ HỒI SỨC',                          '00000000-0000-0000-0000-000000000003'),
  ('K-NTTN',    'KHOA NGOẠI THẬN - TIẾT NIỆU',                   '00000000-0000-0000-0000-000000000003'),
  ('K-NTH2',    'KHOA NGOẠI TỔNG HỢP 2',                         '00000000-0000-0000-0000-000000000003'),
  ('K-NTH1',    'KHOA NGOẠI TỔNG HỢP 1',                         '00000000-0000-0000-0000-000000000003'),
  ('K-NTG',     'KHOA NGOẠI TIÊU HÓA',                           '00000000-0000-0000-0000-000000000003'),
  ('K-PTTK',    'KHOA PHẪU THUẬT THẦN KINH CỘT SỐNG',           '00000000-0000-0000-0000-000000000003'),
  ('K-HHLS',    'KHOA HUYẾT HỌC LÂM SÀNG',                       '00000000-0000-0000-0000-000000000003'),
  ('K-CTCH',    'KHOA CHẤN THƯƠNG - CHỈNH HÌNH',                 '00000000-0000-0000-0000-000000000003'),
  ('K-PTTM',    'KHOA PHẪU THUẬT TẠO HÌNH THẨM MỸ',             '00000000-0000-0000-0000-000000000003'),
  ('K-NHISS',   'KHOA NHI - SƠ SINH',                            '00000000-0000-0000-0000-000000000003'),
  ('K-TMH',     'KHOA TAI MŨI HỌNG',                             '00000000-0000-0000-0000-000000000003'),
  ('K-RHM',     'KHOA RĂNG HÀM MẶT',                             '00000000-0000-0000-0000-000000000003'),
  ('K-MAT',     'KHOA MẮT',                                       '00000000-0000-0000-0000-000000000003'),
  ('K-HSTC',    'KHOA HỒI SỨC TÍCH CỰC',                         '00000000-0000-0000-0000-000000000003'),
  ('K-HSTNK',   'KHOA HỒI SỨC TÍCH CỰC NGOẠI KHOA',             '00000000-0000-0000-0000-000000000003'),
  ('K-NOILK',   'KHOA NỘI A - LÃO KHOA',                         '00000000-0000-0000-0000-000000000003'),
  ('K-DINHD',   'KHOA DINH DƯỠNG',                               '00000000-0000-0000-0000-000000000003'),
  ('K-NOITG',   'KHOA NỘI TIÊU HÓA',                             '00000000-0000-0000-0000-000000000003'),
  ('K-NODUHH',  'KHOA NỘI DỊ ỨNG - HÔ HẤP',                     '00000000-0000-0000-0000-000000000003'),
  ('K-DUMI',    'KHOA DỊ ỨNG - MIỄN DỊCH LÂM SÀNG',             '00000000-0000-0000-0000-000000000003'),
  ('K-NOITT',   'KHOA NỘI TIẾT',                                  '00000000-0000-0000-0000-000000000003'),
  ('K-NOITNLM', 'KHOA NỘI THẬN - TIẾT NIỆU - LỌC MÁU',          '00000000-0000-0000-0000-000000000003'),
  ('K-COXXK',   'KHOA NỘI CƠ - XƯƠNG - KHỚP',                    '00000000-0000-0000-0000-000000000003'),
  ('K-DALIEU',  'KHOA DA LIỄU',                                   '00000000-0000-0000-0000-000000000003'),
  ('K-YHCT',    'KHOA Y HỌC CỔ TRUYỀN',                           '00000000-0000-0000-0000-000000000003'),
  ('K-PHCN',    'KHOA PHỤC HỒI CHỨC NĂNG',                        '00000000-0000-0000-0000-000000000003'),
  ('K-TK',      'KHOA THẦN KINH',                                  '00000000-0000-0000-0000-000000000003'),
  ('K-CDDOC',   'KHOA CHỐNG ĐỘC',                                  '00000000-0000-0000-0000-000000000003'),
  ('K-BONG',    'KHOA BỎNG',                                        '00000000-0000-0000-0000-000000000003');

-- ── Khối Trung tâm chuyên sâu ────────────────────────────────────────────────
INSERT INTO personnel.departments (code, name, parent_id) VALUES
  ('TT-XN-HH',  'TRUNG TÂM XÉT NGHIỆM - KHOA HUYẾT HỌC',                       '00000000-0000-0000-0000-000000000004'),
  ('TT-XN-VS',  'TRUNG TÂM XÉT NGHIỆM - KHOA VI SINH',                          '00000000-0000-0000-0000-000000000004'),
  ('TT-XN-HS',  'TRUNG TÂM XÉT NGHIỆM - KHOA HÓA SINH',                         '00000000-0000-0000-0000-000000000004'),
  ('TT-XN-GPB', 'TRUNG TÂM XÉT NGHIỆM - KHOA GIẢI PHẪU BỆNH',                  '00000000-0000-0000-0000-000000000004'),
  ('TT-XN-DT',  'TRUNG TÂM XÉT NGHIỆM - KHOA DI TRUYỀN VÀ SINH HỌC PHÂN TỬ',  '00000000-0000-0000-0000-000000000004'),
  ('TT-HTSS',   'TRUNG TÂM HỖ TRỢ SINH SẢN',                                    '00000000-0000-0000-0000-000000000004'),
  ('TT-TM-NTM1','TRUNG TÂM TIM MẠCH - KHOA NỘI TIM MẠCH 1',                     '00000000-0000-0000-0000-000000000004'),
  ('TT-TM-NTM2','TRUNG TÂM TIM MẠCH - KHOA NỘI TIM MẠCH 2',                     '00000000-0000-0000-0000-000000000004'),
  ('TT-TM-PT',  'TRUNG TÂM TIM MẠCH - KHOA PHẪU THUẬT TIM MẠCH - LỒNG NGỰC',   '00000000-0000-0000-0000-000000000004'),
  ('TT-DTTDT',  'TRUNG TÂM ĐÀO TẠO VÀ CHỈ ĐẠO TUYẾN',                           '00000000-0000-0000-0000-000000000004'),
  ('TT-DQ',     'TRUNG TÂM ĐỘT QUỴ',                                              '00000000-0000-0000-0000-000000000004'),
  ('TT-NĐ-NK',  'TRUNG TÂM BỆNH NHIỆT ĐỚI - KHOA NHIỄM KHUẨN TỔNG HỢP',        '00000000-0000-0000-0000-000000000004'),
  ('TT-NĐ-VR',  'TRUNG TÂM BỆNH NHIỆT ĐỚI - KHOA VI RÚT - KÝ SINH TRÙNG',      '00000000-0000-0000-0000-000000000004');
