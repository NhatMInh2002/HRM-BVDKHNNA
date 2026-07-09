package vn.hrm.shared.crypto;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * Mã hóa AES-256-GCM cho dữ liệu cá nhân nhạy cảm (CCCD, sức khỏe...)
 * theo yêu cầu NĐ 13/2023/NĐ-CP.
 *
 * <p>Ciphertext có tiền tố {@code enc:v1:} để phân biệt với dữ liệu
 * plaintext cũ — cho phép migrate dần: đọc được cả hai, ghi luôn mã hóa.
 *
 * <p>Khóa lấy từ biến môi trường {@code HRM_ENCRYPTION_KEY} (chuỗi bất kỳ,
 * được dẫn xuất qua SHA-256 thành khóa 256-bit). Môi trường production
 * BẮT BUỘC đặt biến này; nếu thiếu sẽ dùng khóa dev cố định và log cảnh báo.
 */
public final class PiiCrypto {

    public static final String PREFIX = "enc:v1:";
    private static final String ENV_KEY = "HRM_ENCRYPTION_KEY";
    private static final String DEV_FALLBACK = "hrm-dev-only-key-DO-NOT-USE-IN-PROD";
    private static final int GCM_IV_BYTES = 12;
    private static final int GCM_TAG_BITS = 128;
    /** Trần độ dài plaintext PII (ký tự). Các trường PII đều ngắn (CCCD, số BHXH,
     *  tình trạng sức khỏe); chặn ở đây để phép cộng độ dài mảng luôn bị giới hạn. */
    private static final int MAX_PLAINTEXT_LEN = 10_000;
    private static final SecureRandom RANDOM = new SecureRandom();

    private static volatile SecretKeySpec key;

    private PiiCrypto() {}

    private static SecretKeySpec key() {
        SecretKeySpec k = key;
        if (k == null) {
            synchronized (PiiCrypto.class) {
                if (key == null) {
                    String secret = System.getenv(ENV_KEY);
                    if (secret == null || secret.isBlank()) {
                        secret = DEV_FALLBACK;
                        System.err.println("[PiiCrypto] CẢNH BÁO: chưa đặt " + ENV_KEY
                                + " — đang dùng khóa dev. KHÔNG dùng cấu hình này ở production.");
                    }
                    try {
                        byte[] digest = MessageDigest.getInstance("SHA-256")
                                .digest(secret.getBytes(StandardCharsets.UTF_8));
                        key = new SecretKeySpec(digest, "AES");
                    } catch (Exception e) {
                        throw new IllegalStateException("Không khởi tạo được khóa mã hóa PII", e);
                    }
                }
                k = key;
            }
        }
        return k;
    }

    /** Mã hóa; trả về nguyên trạng nếu null/blank hoặc đã mã hóa sẵn. */
    public static String encrypt(String plain) {
        if (plain == null || plain.isBlank() || plain.startsWith(PREFIX)) return plain;
        if (plain.length() > MAX_PLAINTEXT_LEN)
            throw new IllegalArgumentException(
                    "Dữ liệu PII vượt quá độ dài cho phép (" + MAX_PLAINTEXT_LEN + " ký tự)");
        try {
            byte[] iv = new byte[GCM_IV_BYTES];
            RANDOM.nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, key(), new GCMParameterSpec(GCM_TAG_BITS, iv));
            // ct.length ≤ MAX_PLAINTEXT_LEN×4 (UTF-8) + tag → phép cộng dưới đây luôn bị giới hạn
            byte[] ct = cipher.doFinal(plain.getBytes(StandardCharsets.UTF_8));
            byte[] out = new byte[iv.length + ct.length];
            System.arraycopy(iv, 0, out, 0, iv.length);
            System.arraycopy(ct, 0, out, iv.length, ct.length);
            return PREFIX + Base64.getEncoder().encodeToString(out);
        } catch (Exception e) {
            throw new IllegalStateException("Mã hóa PII thất bại", e);
        }
    }

    /** Giải mã; dữ liệu không có tiền tố enc:v1: được coi là plaintext cũ và trả nguyên trạng. */
    public static String decrypt(String stored) {
        if (stored == null || !stored.startsWith(PREFIX)) return stored;
        try {
            byte[] all = Base64.getDecoder().decode(stored.substring(PREFIX.length()));
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key(),
                    new GCMParameterSpec(GCM_TAG_BITS, all, 0, GCM_IV_BYTES));
            byte[] plain = cipher.doFinal(all, GCM_IV_BYTES, all.length - GCM_IV_BYTES);
            return new String(plain, StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException("Giải mã PII thất bại — kiểm tra HRM_ENCRYPTION_KEY", e);
        }
    }
}
