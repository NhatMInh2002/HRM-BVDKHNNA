# Branch Protection Rules — Cấu hình thủ công trên GitHub

Sau khi push repo lên GitHub, vào **Settings → Branches → Add rule** và cấu hình:

## Branch: `main` (Production)

| Rule | Giá trị |
|---|---|
| Require a pull request before merging | ✅ bật |
| Required approvals | **2** (Tech Lead + 1 reviewer) |
| Dismiss stale reviews when new commits pushed | ✅ bật |
| Require review from Code Owners | ✅ bật |
| Require status checks to pass before merging | ✅ bật |
| Required checks | `Build & Test`, `Coverage Gate (≥ 70%)`, `Build`, `SAST — CodeQL`, `OWASP Dependency Check` |
| Require branches to be up to date before merging | ✅ bật |
| Do not allow bypassing the above settings | ✅ bật (kể cả admin) |
| Allow force pushes | ❌ tắt |
| Allow deletions | ❌ tắt |

## Branch: `develop` (Integration)

| Rule | Giá trị |
|---|---|
| Require a pull request before merging | ✅ bật |
| Required approvals | **1** |
| Require status checks to pass before merging | ✅ bật |
| Required checks | `Build & Test`, `Build`, `Secret Scan (Gitleaks)` |
| Allow force pushes | ❌ tắt |

## CODEOWNERS File
Tạo file `.github/CODEOWNERS` để chỉ định reviewer tự động:

```
# Backend modules — Tech Lead phải review
/backend/module-payroll/     @tech-lead @backend-lead
/backend/module-personnel/   @tech-lead
/backend/infra/security/     @tech-lead @security-lead

# Frontend
/frontend/                   @frontend-lead

# CI/CD và security config — Tech Lead bắt buộc
/.github/                    @tech-lead
```

## Workflow auto-merge

PR sẽ tự động merge vào `develop` khi:
1. Được gán label `auto-merge`
2. Có ít nhất 1 approval
3. Tất cả required checks xanh

Không áp dụng auto-merge cho `main` — merge vào main phải thủ công có chủ ý.
