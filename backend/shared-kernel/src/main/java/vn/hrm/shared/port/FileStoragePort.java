package vn.hrm.shared.port;

/**
 * Port cho phép các module đọc lại file đã upload (MinIO) mà không phụ thuộc
 * trực tiếp vào module app (nơi cấu hình MinIO client). App implement port này.
 */
public interface FileStoragePort {
    /** Đọc toàn bộ bytes của object theo key MinIO. Trả về null nếu không tìm thấy. */
    byte[] readBytes(String key);
}
