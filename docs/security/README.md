# Thư mục báo cáo bảo mật

Thư mục này chứa các báo cáo đánh giá bảo mật (pentest, code audit, threat model) của hệ thống HRM.

> ⚠️ **Các file báo cáo trong thư mục này KHÔNG được commit lên git** (xem `.gitignore`).
> Lý do: báo cáo liệt kê chi tiết lỗ hổng và cách khai thác — đưa lên repo (kể cả private)
> làm tăng bề mặt rủi ro. Báo cáo được lưu cục bộ và gửi trực tiếp cho người phụ trách.

Chỉ file `README.md` này được theo dõi trong git để ghi lại chính sách.

## Quy ước

- Đặt tên: `security-assessment-YYYY-MM-DD.md`
- Mỗi báo cáo nêu: phạm vi, phương pháp, phát hiện (theo mức độ), chuỗi tấn công, khuyến nghị vá.
- Lỗ hổng đã vá: ghi lại trong PR bảo mật tương ứng + `docs/changelog/CHANGELOG.md` (chỉ mô tả bản vá, không mô tả cách khai thác).
