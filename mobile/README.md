# HRM Nghệ An — App Android (WebView nội bộ)

App Android sideload (`.apk`) cho hệ thống HRM BV HNĐK Nghệ An — **không cần CH Play**.

## Đây là gì

App là **vỏ WebView** tải trực tiếp giao diện web nội bộ của hệ thống. Frontend là
Next.js chạy SSR + NextAuth phía máy chủ nên **không đóng gói offline được**; app chỉ
là "trình duyệt riêng" trỏ tới máy chủ HRM trong mạng bệnh viện. Ưu điểm: mọi tính năng
web (đăng nhập, lương, chấm công, hồ sơ, xuất PDF/Excel) hoạt động ngay, không phải viết lại.

Hỗ trợ sẵn: giữ phiên đăng nhập (cookie), tải ảnh/chữ ký lên (trình chọn tệp), tải file
xuống (DownloadManager), nút Back đi lại trong web.

## Đổi địa chỉ máy chủ

Sửa **một dòng duy nhất** rồi build lại — `app/src/main/res/values/strings.xml`:

```xml
<string name="server_url">https://hrm.bvnghean.vn</string>
```

Ví dụ:
- Máy chủ nội bộ HTTPS: `https://hrm.bvnghean.vn`
- Máy chủ LAN theo IP: `http://192.168.1.10:3000`
- Máy ảo Android trỏ về localhost máy tính: `http://10.0.2.2:3000`

> HTTP nội bộ và HTTPS self-signed đều được phép (`network_security_config.xml` đã bật
> cleartext + trust CA người dùng).

## Lấy file .apk

### Cách 1 — GitHub Actions (khuyến nghị, không cần cài gì)
Đã có workflow `.github/workflows/build-apk.yml`. Mỗi khi đẩy thay đổi trong `mobile/`,
GitHub tự build và đăng file `.apk` dạng **artifact**:
1. Vào tab **Actions** → workflow **Build Android APK** → chọn lần chạy mới nhất.
2. Kéo xuống mục **Artifacts** → tải `hrm-nghean-debug-apk`.
3. Giải nén được `app-debug.apk`.

Có thể bấm **Run workflow** để build thủ công.

### Cách 2 — Build tại máy có Android Studio / SDK
```bash
cd mobile
gradle assembleDebug          # hoặc ./gradlew nếu đã có wrapper
# → app/build/outputs/apk/debug/app-debug.apk
```

## Cài lên điện thoại (sideload)
1. Chép `app-debug.apk` vào điện thoại (USB / Zalo / email nội bộ).
2. Mở file → Android hỏi cho phép **"Cài đặt từ nguồn không xác định"** → bật cho ứng dụng đang mở.
3. Cài xong, mở app **HRM Nghệ An** — app tải thẳng giao diện HRM.

> Đây là bản **debug** (ký bằng khóa debug) đủ để chạy thử nội bộ. Khi phát hành chính
> thức nên tạo bản **release** ký bằng keystore riêng của bệnh viện.

## Cấu hình kỹ thuật
- `applicationId`: `vn.hrm.mobile` · `minSdk` 24 (Android 7.0+) · `targetSdk`/`compileSdk` 34
- Kotlin + AndroidX, không dùng Capacitor (vỏ WebView thuần, apk nhẹ)

## Hạn chế đã biết
- Tải file kiểu **blob** (một số nút xuất PDF/Excel tạo blob phía JS) có thể chưa lưu được
  qua DownloadManager — cần cầu nối base64 nếu muốn hỗ trợ đầy đủ. Tải qua URL trực tiếp thì OK.
- Chưa có push notification / sinh trắc học — có thể bổ sung sau nếu cần.
