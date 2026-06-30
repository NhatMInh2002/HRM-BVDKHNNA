# Checklist Tuân thủ Pháp lý — HRM DNNN Việt Nam

**Last updated:** 2026-06-30

---

## 1. Nghị định 13/2023/NĐ-CP — Bảo vệ Dữ liệu Cá nhân

| Yêu cầu | Trạng thái | Giải pháp kỹ thuật |
|---|---|---|
| Phân loại dữ liệu cá nhân nhạy cảm | ⬜ Todo | Data Classification Service — gắn nhãn từng trường |
| Mã hóa dữ liệu nhạy cảm (lương, CCCD, sức khỏe) | ⬜ Todo | Column-level encryption trong schema lương riêng |
| Ghi nhận lịch sử truy cập dữ liệu cá nhân | ✅ Done | Audit log bất biến (`audit.audit_log`, trigger chặn UPDATE/DELETE) — Employee CRUD, Leave approval, Permission |
| Cơ chế xóa/ẩn danh hóa khi hết hạn lưu trữ | ⬜ Todo | Data retention policy + scheduled purge job |
| Chính sách thu thập dữ liệu và đồng ý | ⬜ Todo | Consent form tại onboarding |

---

## 2. Thông tư 12/2022/TT-BTTTT — An toàn Thông tin Hệ thống CNTT

| Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|
| Xác định cấp độ an toàn thông tin (dự kiến Cấp 3) | ⬜ Todo | Làm việc với bộ phận ATTT nội bộ |
| Lập hồ sơ đề xuất cấp độ nộp cơ quan chủ quản | ⬜ Todo | Deadline: trước Phase 1 go-live |
| Đánh giá an toàn thông tin định kỳ | ⬜ Todo | Ít nhất 1 lần/năm sau khi vận hành |
| Phương án dự phòng thảm họa (DR) | ⬜ Todo | RTO ≤ 4h, RPO ≤ 1h — DR site tại địa điểm khác |
| Kiểm tra xâm nhập (pentest) | ⬜ Todo | Giai đoạn Phase 5 (tuần 41) |

---

## 3. Payroll & BHXH/Thuế

| Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|
| Tính BHXH 8% (NLĐ) + 17.5% (NSDLĐ) | ✅ Done | `PayrollService` — trần đóng = 20× lương cơ sở |
| Tính BHYT 1.5% (NLĐ) + 3% (NSDLĐ) | ✅ Done | |
| Tính BHTN 1% (NLĐ) + 1% (NSDLĐ) | ✅ Done | |
| Thuế TNCN lũy tiến 7 bậc | ✅ Done | Điều 22 Luật Thuế TNCN |
| Giảm trừ gia cảnh (bản thân 11tr + người phụ thuộc 4.4tr) | ✅ Done | |
| Kết nối cổng BHXH điện tử | ⬜ Todo | API BHXH Việt Nam |
| Kết nối e-Tax (Tổng cục Thuế) | ⬜ Todo | API nộp thuế điện tử |

---

## 4. Chữ ký số & Phê duyệt Pháp lý

| Yêu cầu | Trạng thái | Ghi chú |
|---|---|---|
| Chọn CA được Bộ TT&TT cấp phép | ⬜ Todo | VNPT-CA hoặc Viettel-CA |
| Tích hợp SDK chữ ký số vào Workflow Service | ⬜ Todo | Cho approval quyết định lương, hợp đồng |
| Lưu trữ văn bản đã ký có giá trị pháp lý | ⬜ Todo | MinIO + metadata chữ ký |

---

## 5. Bảo mật Kỹ thuật

| Yêu cầu | Trạng thái | Giải pháp |
|---|---|---|
| TLS 1.3 bắt buộc (không dùng TLS 1.0/1.1) | ✅ Done | Nginx — `ssl_protocols TLSv1.2 TLSv1.3` (dev: self-signed, prod: cần CA thật) |
| WAF chặn OWASP Top 10 | ⬜ Todo | ModSecurity |
| Xác thực đa yếu tố (MFA) cho admin | ⬜ Todo | Azure AD MFA policy |
| Audit log bất biến (không xóa/sửa được) | ✅ Done | `audit.audit_log` — DB trigger chặn UPDATE/DELETE (xem mục 1) |
| Backup hàng ngày + kiểm tra restore định kỳ | ⬜ Todo | Automated backup + monthly restore drill |
