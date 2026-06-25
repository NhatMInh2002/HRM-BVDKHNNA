package vn.hrm.attendance.domain.enums;

public enum LeaveType {
    // Nghỉ phép năm — Điều 113 BLLĐ 2019
    ANNUAL,

    // Nghỉ việc riêng có lương — Điều 115 BLLĐ 2019
    PERSONAL_MARRIAGE,       // Bản thân kết hôn (3 ngày)
    PERSONAL_CHILD_MARRIAGE, // Con kết hôn (1 ngày)
    BEREAVEMENT_LEVEL1,      // Tang chế cấp 1: bố/mẹ/vợ/chồng/con (3 ngày)
    BEREAVEMENT_LEVEL2,      // Tang chế cấp 2: ông/bà/anh/chị/em (1 ngày)

    // Nghỉ ốm — Luật BHXH 2014
    SICK,

    // Nghỉ thai sản — Điều 139 BLLĐ 2019
    MATERNITY,               // Lao động nữ (6 tháng)
    PATERNITY,               // Lao động nam khi vợ sinh (5–14 ngày)

    // Nghỉ bù
    COMPENSATORY,

    // Nghỉ không lương
    UNPAID,

    // Khác
    OTHER
}
