# Skill: Backend Engineer

## Role
Implement và maintain Spring Boot modular monolith cho HRM system. Tuân thủ các ràng buộc kỹ thuật và pháp lý của DNNN Việt Nam.

## Stack cụ thể
- **Runtime:** Java 21 (LTS) + Spring Boot 3.x
- **Build:** Maven (không dùng Gradle — dễ audit hơn trong môi trường DNNN)
- **DB:** PostgreSQL 15+ với Flyway migration
- **Cache:** Redis 7+
- **Object storage:** MinIO (S3-compatible)
- **Search:** OpenSearch 2.x (không dùng Elasticsearch — license SSPL)
- **API:** REST/JSON; OpenAPI 3 spec bắt buộc cho mọi endpoint mới
- **Auth:** Spring Security + SAML 2.0 SP + JWT (stateless cho API)

## Module Structure (Modular Monolith)
```
hrm-app/
├── module-personnel/     # Hồ sơ, hợp đồng, org chart
├── module-attendance/    # Chấm công, nghỉ phép, OT
├── module-payroll/       # Lương, BHXH/BHYT, thuế TNCN
├── module-recruitment/   # Tuyển dụng, onboarding
├── module-kpi/           # Mục tiêu, 360°, đánh giá
├── module-workflow/      # Approval engine, notification
├── module-report/        # Dashboard, export
├── shared-kernel/        # DTOs, exceptions, utils dùng chung
└── infra/                # DB config, security, storage, cache
```

**Quy tắc module boundary:**
- Module chỉ được gọi nhau qua interface trong `shared-kernel`, KHÔNG import trực tiếp class nội bộ
- Mỗi module có schema PostgreSQL riêng (personnel, attendance, payroll...)
- Module payroll: schema riêng + column encryption bắt buộc cho trường lương

## Checklist trước khi viết code mới

### Design
- [ ] Có OpenAPI spec (request/response schema) trước khi implement?
- [ ] Có Flyway migration script cho schema thay đổi?
- [ ] Module boundary có bị vi phạm không?

### Security (bắt buộc cho DNNN)
- [ ] Endpoint có `@PreAuthorize` với role phù hợp?
- [ ] Input validation với `@Valid` + Bean Validation?
- [ ] Không log dữ liệu nhạy cảm (lương, CCCD, password)?
- [ ] SQL dùng parameterized query (không string concat)?
- [ ] File upload kiểm tra MIME type + size limit?

### Data
- [ ] Trường nhạy cảm (lương, CCCD) có annotation `@Sensitive` và được mã hóa?
- [ ] Audit log được ghi cho mọi thao tác CREATE/UPDATE/DELETE?
- [ ] Có xử lý transaction rollback khi lỗi?

### Payroll (module đặc biệt)
Công thức bắt buộc theo luật Việt Nam hiện hành:
- BHXH NLĐ: 8% lương đóng BHXH (tối đa 20× lương cơ sở)
- BHYT NLĐ: 1.5% lương đóng BHYT
- BHTN NLĐ: 1% lương đóng BHTN
- Thuế TNCN: lũy tiến 7 bậc (5% → 35%), sau giảm trừ gia cảnh
- Giảm trừ bản thân: 11 triệu/tháng
- Giảm trừ người phụ thuộc: 4.4 triệu/người/tháng

## Code Standards
```java
// Đặt tên: tiếng Anh, snake_case cho DB, camelCase cho Java
// Comment: CHỈ khi logic không hiển nhiên — giải thích WHY, không WHAT
// Exception: dùng custom exception class, KHÔNG throw RuntimeException trực tiếp
// Response: wrap trong ApiResponse<T> thống nhất
// Pagination: mọi list endpoint phải có phân trang (Page<T>)
```

## Không làm
- Không dùng `@Transactional` trên toàn class — chỉ trên method cần thiết
- Không trả lỗi stack trace cho client — log internal, trả error code + message
- Không hardcode config (URL, secret) — dùng application.yml + env variable
- Không bỏ qua Flyway migration — không sửa schema bằng tay trực tiếp trên DB
