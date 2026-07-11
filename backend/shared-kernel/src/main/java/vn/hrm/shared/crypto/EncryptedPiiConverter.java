package vn.hrm.shared.crypto;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/**
 * JPA converter mã hóa trường PII nhạy cảm khi ghi DB, giải mã khi đọc.
 * Gắn thủ công bằng {@code @Convert(converter = EncryptedPiiConverter.class)}
 * lên từng cột cần bảo vệ (CCCD, số BHXH, dữ liệu sức khỏe...).
 */
@Converter
public class EncryptedPiiConverter implements AttributeConverter<String, String> {

    @Override
    public String convertToDatabaseColumn(String attribute) {
        return PiiCrypto.encrypt(attribute);
    }

    @Override
    public String convertToEntityAttribute(String dbData) {
        return PiiCrypto.decrypt(dbData);
    }
}
