# HRM Project — Decision & Change Log

Mỗi khi có quyết định kiến trúc, thay đổi yêu cầu, hoặc điều chỉnh kế hoạch — ghi vào đây.  
Format: `## [YYYY-MM-DD] — [Loại thay đổi]: [Tiêu đề ngắn]`

---

## [2026-06-19] — INIT: Khởi tạo dự án & thiết kế kiến trúc ban đầu

**Người quyết định:** (chưa xác định)  
**Nội dung:**
- Xác định yêu cầu: DNNN Việt Nam, 500–5,000 nhân viên, on-premises
- Chọn stack: Spring Boot + Next.js + PostgreSQL + Redis + MinIO + OpenSearch
- SSO: Microsoft Active Directory / Azure AD (SAML 2.0)
- Kiến trúc: Modular Monolith (thay vì microservices)
- Modules yêu cầu: Personnel, Attendance (GPS/QR), Payroll (BHXH/BHYT/thuế), Recruitment, KPI/360°, Approval Workflow, Reporting, ERP integrations

**Tài liệu liên quan:**
- `docs/adr/ADR-001-architecture-evaluation.md`
- `docs/implementation/phased-plan.md`

---

## [2026-06-19] — ADR-001: Đánh giá kiến trúc cho DNNN

**Quyết định:** Dùng Modular Monolith thay microservices  
**Lý do:** Đội IT DNNN ít kinh nghiệm K8s, ops burden cao không cần thiết ở quy mô này  
**Rủi ro được ghi nhận:**
- Thiếu DR site → cần bổ sung trước go-live
- Chưa có Data Classification layer (yêu cầu NĐ 13/2023)
- Chưa có chữ ký số (cần VNPT-CA hoặc Viettel-CA)
- Cần khai báo Cấp độ bảo mật theo TT12/2022
- Elasticsearch → thay bằng OpenSearch (license Apache 2.0)

**Chi tiết:** `docs/adr/ADR-001-architecture-evaluation.md`

---

<!-- Template cho entry tiếp theo:

## [YYYY-MM-DD] — [LOẠI]: [Tiêu đề]

**Người quyết định:**  
**Nội dung:**  
**Tác động:**  
**Tài liệu liên quan:**  

-->
