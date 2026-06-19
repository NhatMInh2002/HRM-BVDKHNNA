# HRM Project — Agent Context

## Project Overview
HRM (Human Resource Management) web application for a Vietnamese state-owned enterprise.
- **Scale:** 500–5,000 employees, medium concurrent load
- **Stack:** Spring Boot (backend) + Next.js (frontend) + PostgreSQL
- **Deployment:** On-premises data center
- **SSO:** Microsoft Active Directory / Azure AD (SAML 2.0 via AD FS)
- **Language:** Vietnamese UI, Vietnamese labor law compliance

## Architecture Decision: Modular Monolith (NOT microservices)
Use a modular monolith for Phase 1–3. Only split services when a module needs independent scaling (e.g., Payroll under month-end load). See `docs/adr/ADR-001-architecture-evaluation.md`.

## Regulatory Constraints (non-negotiable)
- **NĐ 13/2023/NĐ-CP** — Personal data protection; salary/CCCD/health data classified as sensitive
- **TT 12/2022/TT-BTTTT** — System security level must be formally declared (likely Cấp độ 3)
- **Luật Lao động 2019** — Leave, overtime, contract rules
- **BHXH/BHYT/BHTN + thuế TNCN** — Vietnamese payroll compliance
- **Chữ ký số** — Approval workflows require CA licensed by Bộ TT&TT (VNPT-CA or Viettel-CA)
- **Data residency** — All data must remain on-premises, no cloud storage

## Key Technical Decisions
| Decision | Choice | Reason |
|---|---|---|
| Architecture | Modular Monolith | Lower ops complexity for state enterprise IT teams |
| Database | PostgreSQL | Open-source, no license cost, audit-friendly |
| Search | OpenSearch (not Elasticsearch) | Apache 2.0 license — avoids SSPL procurement issues |
| Object storage | MinIO (on-prem) | S3-compatible, self-hosted, no data leaves premises |
| Cache / Session | Redis | JWT blacklist, rate limiting, session store |
| SSL | Internal CA + Nginx | TLS 1.3 enforced, no external CA dependency |
| Audit log | Immutable append-only table | Required for KTNN and internal audit |
| Salary data | Separate PostgreSQL schema + column encryption | NĐ 13/2023 sensitive data isolation |

## Module Checklist
- [ ] Personnel (profiles, contracts, org chart)
- [ ] Attendance (GPS/QR check-in, overtime, leave)
- [ ] Payroll (salary calc, BHXH/BHYT/tax)
- [ ] Recruitment + Onboarding
- [ ] KPI / 360° Evaluation
- [ ] Approval Workflows (with chữ ký số)
- [ ] Reporting & Dashboard
- [ ] ERP / Accounting / Biometric integrations

## Open Items (must resolve before Phase 1)
1. Confirm AD FS on-prem vs Azure AD Proxy (depends on internet access from data center)
2. Declare Security Level per TT12 — file with regulatory authority
3. Select CA provider: VNPT-CA or Viettel-CA
4. Design DR site (RTO ≤ 4h, RPO ≤ 1h)

## Agent Skills
Mỗi role có skill file riêng — đọc trước khi thực hiện công việc tương ứng:

| Khi nào | Skill file |
|---|---|
| Cuối phiên làm việc / lưu lại tiến độ | `.claude/skills/memory.md` |
| Thiết kế UI, màn hình, component | `.claude/skills/ui-ux-designer.md` |
| Viết API, service, DB, backend logic | `.claude/skills/backend-engineer.md` |
| Review code, kiểm tra tiến độ, quyết định kiến trúc | `.claude/skills/project-manager-reviewer.md` |
| Viết test, debug lỗi, smoke test sau deploy | `.claude/skills/tester-debugger.md` |

## Docs Index
- `docs/adr/ADR-001-architecture-evaluation.md` — Full architecture evaluation ADR
- `docs/architecture/system-overview.md` — Architecture diagram description
- `docs/implementation/phased-plan.md` — 44-week implementation plan
- `docs/compliance/regulatory-checklist.md` — Vietnamese regulatory requirements
- `docs/changelog/CHANGELOG.md` — All decisions and changes log
