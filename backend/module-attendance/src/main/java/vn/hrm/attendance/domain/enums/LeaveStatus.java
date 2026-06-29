package vn.hrm.attendance.domain.enums;

public enum LeaveStatus {
    PENDING,          // chờ trưởng phòng duyệt
    DEPT_APPROVED,    // trưởng phòng đã duyệt, chờ TCCB
    APPROVED,         // TCCB đã duyệt — hoàn tất
    REJECTED          // bị từ chối (ở bất kỳ cấp nào)
}
