# ADR-001: Đánh giá Kiến trúc HRM cho Doanh nghiệp Nhà nước Việt Nam

**Status:** Proposed  
**Date:** 2026-06-19  
**Deciders:** CTO / Trưởng ban CNTT / Trưởng ban Nhân sự / Bộ phận An toàn thông tin

---

## Context

Kiến trúc đề xuất: Next.js + Spring Boot + PostgreSQL + Redis + MinIO + OpenSearch, triển khai on-premises với Azure AD SSO (SAML 2.0) và TLS termination qua Nginx.

Môi trường: doanh nghiệp nhà nước Việt Nam, chịu ràng buộc:
- Nghị định 13/2023/NĐ-CP (bảo vệ dữ liệu cá nhân)
- Thông tư 12/2022/TT-BTTTT (an toàn thông tin)
- Luật An toàn thông tin mạng 2015
- Luật Lao động 2019 + quy định BHXH/BHYT/thuế TNCN

---

## Decision

Triển khai kiến trúc **Modular Monolith** (không phải microservices) cho Phase 1–3, với các bổ sung bắt buộc về DR, Data Classification, và chữ ký số.

---

## Options Considered

### Option A: Microservices (Kubernetes multi-service)
| Dimension | Assessment |
|---|---|
| Complexity | High |
| Ops burden | High — yêu cầu đội DevOps kinh nghiệm K8s |
| Scalability | Excellent |
| Team fit (DNNN IT) | Poor |
| Cost | High (infra + ops) |

**Pros:** Scale từng service độc lập, fault isolation  
**Cons:** Quá phức tạp cho đội IT nội bộ DNNN, khó audit cross-service, overhead ops cao

### Option B: Modular Monolith (Recommended)
| Dimension | Assessment |
|---|---|
| Complexity | Medium |
| Ops burden | Low — 1–2 artifact để deploy |
| Scalability | Good — tách module sau nếu cần |
| Team fit (DNNN IT) | Good |
| Cost | Low |

**Pros:** Dễ vận hành, dễ audit, dễ troubleshoot, có thể tách service sau  
**Cons:** Horizontal scaling toàn bộ app, cần kỷ luật module boundary

---

## Security Assessment

| Tiêu chí | Trạng thái | Ghi chú |
|---|---|---|
| TLS 1.3 + WAF | ✅ Đủ | Nginx + ModSecurity |
| SSO SAML 2.0 | ✅ Đủ | AD FS + Spring Security |
| Data residency | ✅ Đủ | 100% on-premises |
| Audit log bất biến | ✅ Đủ | Append-only table |
| Mã hóa dữ liệu nhạy cảm | ✅ Cơ bản | Cần thêm Data Classification |
| Disaster Recovery | ❌ Thiếu | Cần DR site (RTO ≤ 4h) |
| Security Level (TT12) | ⚠️ Chưa khai báo | Cần xác định Cấp độ 3 |
| Chữ ký số pháp lý | ❌ Thiếu | Cần tích hợp VNPT-CA / Viettel-CA |
| License phần mềm | ⚠️ | Thay Elasticsearch → OpenSearch |

---

## Consequences

- Dễ dàng vận hành hơn cho đội IT nội bộ
- Cần lập hồ sơ an toàn thông tin Cấp độ 3 nộp cơ quan chủ quản
- Cần DR site để đáp ứng yêu cầu tính liên tục của dịch vụ nhà nước
- Tích hợp chữ ký số là bắt buộc cho quy trình phê duyệt có giá trị pháp lý

---

## Action Items

1. - [ ] Xác định cấp độ bảo mật hệ thống (TT12) — làm việc với bộ phận ATTT
2. - [ ] Thiết kế DR site — PostgreSQL streaming replication sang site B (RTO ≤ 4h, RPO ≤ 1h)
3. - [ ] Thêm Data Classification layer cho trường nhạy cảm (CCCD, lương, sức khỏe)
4. - [ ] Tích hợp VNPT-CA hoặc Viettel-CA cho quy trình phê duyệt số
5. - [ ] Chuyển kiến trúc sang Modular Monolith
6. - [ ] Thay Elasticsearch bằng OpenSearch trong deployment config
