package vn.hrm.personnel.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Hồ sơ lý lịch HS02-VC/BNV. Dùng cho cả đọc (GET) lẫn ghi (PUT) các trường
 * mở rộng + 4 danh sách con. Các trường cơ bản (họ tên, CCCD...) vẫn quản lý
 * qua EmployeeRequest/EmployeeResponse, ở đây chỉ chứa phần bổ sung của HS02.
 */
public record EmployeeProfileDto(
        // Thông tin chung bổ sung
        String birthPlace,
        LocalDate nationalIdIssueDate,
        String nationalIdIssuePlace,
        String socialInsuranceNo,
        String healthInsuranceNo,
        String familyOrigin,
        String jobBeforeRecruitment,
        LocalDate recruitmentDate,
        String recruitmentAgency,
        // Ngạch/bậc & trình độ
        String ngachCode,
        Short salaryGrade,
        java.math.BigDecimal salaryCoefficient,
        LocalDate salaryEffectiveDate,
        String educationGeneral,
        String professionalDegree,
        String politicalTheory,
        String stateManagement,
        String foreignLanguage,
        String informaticsLevel,
        // Đoàn thể, quân đội, chính sách, sức khỏe
        LocalDate partyJoinDate,
        LocalDate partyOfficialDate,
        LocalDate youthUnionJoinDate,
        LocalDate militaryServiceFrom,
        LocalDate militaryServiceTo,
        String warInvalidClass,
        String policyFamilyType,
        String healthStatus,
        Short heightCm,
        Short weightKg,
        String bloodType,
        String personalHistory,
        String familyEconomy,
        // Danh sách con
        List<WorkHistoryDto> workHistory,
        List<TrainingDto> trainings,
        List<FamilyRelationDto> familyRelations,
        List<AwardDto> awards
) {
    public record WorkHistoryDto(
            LocalDate fromDate, LocalDate toDate, String unit, String position, String note) {}

    public record TrainingDto(
            LocalDate fromDate, LocalDate toDate, String institution,
            String field, String form, String degree) {}

    public record FamilyRelationDto(
            String side, String relation, String fullName, Short birthYear, String detail) {}

    public record AwardDto(
            String type, Short year, String title, String decisionNo, String level) {}
}
