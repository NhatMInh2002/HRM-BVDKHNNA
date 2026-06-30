package vn.hrm.app.auth;

import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.util.Base64;

/**
 * TOTP (Time-based One-Time Password) theo RFC 6238 — tương thích Google/Microsoft Authenticator.
 * Không phụ thuộc thư viện ngoài: chỉ dùng javax.crypto có sẵn trong JDK.
 */
@Service
public class TotpService {

    private static final int CODE_DIGITS   = 6;
    private static final int TIME_STEP_SEC = 30;
    private static final String HMAC_ALGO  = "HmacSHA1";
    private static final SecureRandom RANDOM = new SecureRandom();

    /** Sinh secret ngẫu nhiên 20 byte, mã hóa Base32 (chuẩn cho otpauth:// URI). */
    public String generateSecret() {
        byte[] bytes = new byte[20];
        RANDOM.nextBytes(bytes);
        return base32Encode(bytes);
    }

    /** URI để vẽ QR code — Authenticator app quét cái này. */
    public String buildOtpAuthUri(String secret, String accountLabel, String issuer) {
        String encodedIssuer  = urlEncode(issuer);
        String encodedAccount = urlEncode(accountLabel);
        return "otpauth://totp/" + encodedIssuer + ":" + encodedAccount
                + "?secret=" + secret
                + "&issuer=" + encodedIssuer
                + "&algorithm=SHA1&digits=" + CODE_DIGITS + "&period=" + TIME_STEP_SEC;
    }

    /** Kiểm tra mã 6 số người dùng nhập — cho phép lệch ±1 bước (30s) để bù trễ đồng hồ. */
    public boolean verifyCode(String secret, String code) {
        if (code == null || !code.matches("\\d{6}")) return false;
        long currentStep = System.currentTimeMillis() / 1000L / TIME_STEP_SEC;
        for (long step = currentStep - 1; step <= currentStep + 1; step++) {
            if (generateCode(secret, step).equals(code)) return true;
        }
        return false;
    }

    private String generateCode(String base32Secret, long timeStep) {
        try {
            byte[] key = base32Decode(base32Secret);
            byte[] data = ByteBuffer.allocate(8).putLong(timeStep).array();

            Mac mac = Mac.getInstance(HMAC_ALGO);
            mac.init(new SecretKeySpec(key, HMAC_ALGO));
            byte[] hash = mac.doFinal(data);

            int offset = hash[hash.length - 1] & 0x0F;
            int binary = ((hash[offset] & 0x7F) << 24)
                    | ((hash[offset + 1] & 0xFF) << 16)
                    | ((hash[offset + 2] & 0xFF) << 8)
                    | (hash[offset + 3] & 0xFF);

            int otp = binary % (int) Math.pow(10, CODE_DIGITS);
            return String.format("%0" + CODE_DIGITS + "d", otp);
        } catch (Exception e) {
            throw new RuntimeException("Lỗi sinh mã TOTP: " + e.getMessage(), e);
        }
    }

    private static final String BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

    private String base32Encode(byte[] data) {
        StringBuilder sb = new StringBuilder();
        int bits = 0, value = 0;
        for (byte b : data) {
            value = (value << 8) | (b & 0xFF);
            bits += 8;
            while (bits >= 5) {
                sb.append(BASE32_ALPHABET.charAt((value >>> (bits - 5)) & 0x1F));
                bits -= 5;
            }
        }
        if (bits > 0) {
            sb.append(BASE32_ALPHABET.charAt((value << (5 - bits)) & 0x1F));
        }
        return sb.toString();
    }

    private byte[] base32Decode(String base32) {
        String clean = base32.trim().toUpperCase().replace("=", "");
        int bits = 0, value = 0, index = 0;
        byte[] result = new byte[clean.length() * 5 / 8];
        for (char c : clean.toCharArray()) {
            int charValue = BASE32_ALPHABET.indexOf(c);
            if (charValue < 0) continue;
            value = (value << 5) | charValue;
            bits += 5;
            if (bits >= 8) {
                result[index++] = (byte) ((value >>> (bits - 8)) & 0xFF);
                bits -= 8;
            }
        }
        return result;
    }

    private String urlEncode(String s) {
        return java.net.URLEncoder.encode(s, java.nio.charset.StandardCharsets.UTF_8).replace("+", "%20");
    }
}
