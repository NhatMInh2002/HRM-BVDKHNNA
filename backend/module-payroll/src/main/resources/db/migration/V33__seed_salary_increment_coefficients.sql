-- ============================================================
-- V33: Seed bảng hệ số lương tăng thêm — Điều 34/35, tr.49-58
-- Số liệu đã đối chiếu 2 lần với bản scan quy chế chi tiêu nội bộ 2026.
-- ============================================================

-- 1. Hệ số trình độ chuyên môn (tr.49)
INSERT INTO payroll.qualification_coefficients (qualification_name, coefficient, display_order) VALUES
('Giáo sư, Phó Giáo sư', 6.05, 1),
('Tiến sĩ y học', 5.37, 2),
('Bác sĩ CK2, Tiến sĩ khác', 4.80, 3),
('Dược sĩ CK2', 4.40, 4),
('Bác sĩ nội trú', 3.95, 5),
('Thạc sĩ y học, Thạc sĩ Dược', 3.85, 6),
('Bác sĩ CK1, Dược sỹ CK1', 3.75, 7),
('Bác sĩ, Dược sỹ', 3.40, 8),
('Thạc sĩ khác (được giám đốc cử đi học)', 2.80, 9),
('Bác sĩ y tế công cộng', 2.70, 10),
('Đại học khác 5 năm', 2.60, 11),
('Đại học khác 4 năm', 2.50, 12),
('Điều dưỡng CK1, Điều dưỡng Thạc sĩ', 2.60, 13),
('Cử nhân đại học điều dưỡng/KTV/NHS/Vi sinh/Sinh học/KS Công nghệ thực phẩm', 2.20, 14),
('Cử nhân cao đẳng y, dược', 2.00, 15),
('Cao đẳng khác', 1.70, 16),
('Trung cấp y, dược', 1.50, 17),
('Trung cấp khác', 1.50, 18),
('Sơ cấp và lao động phổ thông', 1.30, 19)
ON CONFLICT DO NOTHING;

-- 2. Hệ số trách nhiệm/chức vụ (tr.50)
-- Kiêm nhiệm quản lý chức vụ thứ 2: hưởng 25% hệ số của vị trí này (dùng field
-- responsibility_secondary_coefficient trong salary_increment_configs).
INSERT INTO payroll.responsibility_coefficients (position_name, coefficient, display_order) VALUES
('Giám đốc bệnh viện', 5.5, 1),
('Phó giám đốc bệnh viện', 4.8, 2),
('Giám đốc Trung tâm', 3.5, 3),
('Trưởng khoa / Trưởng khoa thuộc trung tâm / Phó Giám đốc trung tâm', 3.1, 4),
('Trưởng phòng', 3.1, 5),
('Phụ trách khoa', 2.5, 6),
('Phụ trách phòng', 2.5, 7),
('Phó khoa / Trưởng phòng thuộc trung tâm / Phó khoa thuộc trung tâm', 2.0, 8),
('Phó phòng của bệnh viện / Trưởng các đơn vị', 2.0, 9),
('Phó phòng thuộc Trung tâm / Phó các đơn vị', 1.5, 10),
('Điều dưỡng trưởng khối hệ', 1.5, 11),
('Điều dưỡng trưởng Trung tâm', 1.2, 12),
('Điều dưỡng trưởng Khoa bệnh viện / khoa, phòng thuộc trung tâm', 1.1, 13),
('Văn phòng trưởng các phòng chức năng', 0.5, 14),
('Tổ trưởng (trung tâm/khoa/phòng), Thủ quỹ, Thủ kho (Dược, VTYT), Đội trưởng đội xe', 0.3, 15),
('Tổ phó các trung tâm', 0.1, 16)
ON CONFLICT DO NOTHING;

-- 3. Hệ số kiêm nhiệm đoàn thể (tr.50-51)
-- Lưu ý: nếu kiêm nhiệm nhiều vai trò đoàn thể, chỉ chọn 1 hệ số cao nhất (không cộng dồn).
INSERT INTO payroll.concurrent_role_coefficients (role_name, coefficient, display_order) VALUES
('Bí thư Đảng ủy', 3.0, 1),
('Phó bí thư Đảng ủy', 2.5, 2),
('Thường vụ Đảng ủy', 1.5, 3),
('Ban chấp hành Đảng ủy', 1.0, 4),
('Bí thư chi bộ', 0.3, 5),
('Phó bí thư chi bộ', 0.2, 6),
('Chủ tịch Công đoàn (không thuộc BCH Đảng ủy)', 1.0, 7),
('Chủ tịch Công đoàn (thuộc BCH Đảng ủy)', 0.4, 8),
('Phó chủ tịch Công đoàn', 0.3, 9),
('Thường vụ Công đoàn BV; Chủ tịch Hội Cựu chiến binh', 0.2, 10),
('Ban chấp hành Công đoàn bệnh viện', 0.1, 11),
('Chủ tịch Công đoàn khoa, phòng', 0.1, 12),
('Bí thư Đoàn Thanh niên', 0.3, 13),
('Phó Bí thư Đoàn Thanh niên', 0.2, 14),
('Thường vụ Đoàn Thanh niên', 0.1, 15),
('Ban chấp hành Đoàn Thanh niên', 0.05, 16),
('Chủ tịch Hội Cựu chiến binh', 0.3, 17),
('Phó chủ tịch Hội Cựu chiến binh', 0.2, 18),
('Ban thanh tra nhân dân', 0.05, 19),
('Thành viên hội đồng (thi đua/chuyên môn/KHKT/thuốc-điều trị/giải trình BHYT)', 0.1, 20)
ON CONFLICT DO NOTHING;

-- 4. Tỷ lệ xếp loại thi đua A1-C2 (tr.55)
-- Lưu ý: xếp loại cấp cá nhân phụ thuộc cơ chế phân bổ theo phân loại khoa/phòng
-- ("dồn toa") do Hội đồng thi đua quyết định trước — trường này chỉ ghi nhận kết quả
-- đã được duyệt, không tự tính quota.
INSERT INTO payroll.merit_rating_scale (rating_code, rating_name, percentage, display_order) VALUES
('A1', 'Hiệu quả kinh tế ≥ 80% trung bình toàn viện', 100, 1),
('A2', 'Hiệu quả kinh tế 60-80% trung bình toàn viện', 80, 2),
('B1', 'Hiệu quả kinh tế 40-60% trung bình toàn viện', 70, 3),
('B2', 'Hiệu quả kinh tế 20-40% trung bình toàn viện', 60, 4),
('C1', 'Hiệu quả kinh tế 0-20% trung bình toàn viện', 50, 5),
('C2', 'Hiệu quả kinh tế < 0% trung bình toàn viện', 0, 6)
ON CONFLICT DO NOTHING;
