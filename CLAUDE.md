# HRM Project — Agent Index

> Đọc file này xong là đủ để bắt đầu. Chỉ đọc thêm file khác khi task yêu cầu.

## Stack & Deployment
Spring Boot (Modular Monolith) + Next.js + PostgreSQL + Redis + MinIO + OpenSearch  
Bệnh viện: **BỆNH VIỆN HỮU NGHỊ ĐA KHOA NGHỆ AN** · bvnghean.vn  
SSO: Azure AD / AD FS (SAML 2.0) · Deploy: On-premises · Repo: NhatMInh2002/HRM-BVDKHNNA

## Quy tắc không thay đổi
- Modular Monolith — KHÔNG microservices cho đến Phase 4+
- OpenSearch (không Elasticsearch — SSPL license)
- Mọi data ở on-premises, không cloud
- Audit log bất biến bắt buộc
- Lương/CCCD/sức khỏe: mã hóa + schema riêng (NĐ 13/2023)

## Trạng thái hiện tại
- Phase: **1 — Foundation** (chưa bắt đầu)
- Repo + CI/CD + branch protection: ✅ xong
- Tiếp theo: Kubernetes cluster + SSL + AD FS integration

## Đọc thêm khi cần (không đọc mặc định)

| Khi nào | File |
|---|---|
| Hỏi về tiến độ / phase | `docs/implementation/phased-plan.md` |
| Hỏi về quy định pháp lý | `docs/compliance/regulatory-checklist.md` |
| Hỏi về quyết định kiến trúc | `docs/adr/ADR-001-architecture-evaluation.md` |
| Xem lịch sử thay đổi | `docs/changelog/CHANGELOG.md` |
| Làm việc với UI/UX | `.claude/skills/ui-ux-designer.md` |
| Viết backend/API/DB | `.claude/skills/backend-engineer.md` |
| Review code / tiến độ | `.claude/skills/project-manager-reviewer.md` |
| Test / debug | `.claude/skills/tester-debugger.md` |
| Cuối phiên làm việc | `.claude/skills/memory.md` |
