package vn.hrm.personnel.domain.enums;

/**
 * Loại hồ sơ do Phòng TCCB upload — mỗi loại nuôi một hệ số khác nhau khi
 * cấu hình lương (xem quy chế chi tiêu nội bộ, Điều 34).
 */
public enum DocumentType {
    APPOINTMENT_DECISION,   // Quyết định bổ nhiệm/phân công chức vụ → hệ số trách nhiệm
    DEGREE_CERTIFICATE,     // Bằng cấp/học hàm-vị → hệ số trình độ
    PRACTICE_LICENSE,       // Chứng chỉ hành nghề (CCHN)
    CONCURRENT_DECISION,    // Quyết định kiêm nhiệm/điều động → hệ số kiêm nhiệm
    LABOR_CONTRACT,         // Hợp đồng làm việc/lao động
    MERIT_RATING,           // Kết quả xếp loại thi đua A1-C2
    TIMESHEET               // Bảng chấm công
}
