package vn.hrm.personnel.dto;

import vn.hrm.personnel.domain.EmployeeDocument;
import vn.hrm.personnel.domain.enums.DocumentType;
import vn.hrm.personnel.domain.enums.OcrStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

public record EmployeeDocumentResponse(
        UUID id,
        UUID employeeId,
        DocumentType docType,
        String fileUrl,
        String fileName,
        OcrStatus ocrStatus,
        String extractedText,
        String matchedLabel,
        BigDecimal matchedCoefficient,
        UUID matchedDepartmentId,
        String matchedRoleType,
        BigDecimal matchedTimePercent,
        String matchConfidence,
        boolean verified,
        String uploadedBy,
        LocalDateTime createdAt
) {
    public static EmployeeDocumentResponse from(EmployeeDocument d) {
        return new EmployeeDocumentResponse(
                d.getId(), d.getEmployee().getId(), d.getDocType(), d.getFileUrl(), d.getFileName(),
                d.getOcrStatus(), d.getExtractedText(),
                d.getMatchedLabel(), d.getMatchedCoefficient(), d.getMatchedDepartmentId(),
                d.getMatchedRoleType(), d.getMatchedTimePercent(), d.getMatchConfidence(),
                d.isVerified(), d.getUploadedBy(), d.getCreatedAt()
        );
    }
}
