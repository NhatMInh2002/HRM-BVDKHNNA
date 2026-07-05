package vn.hrm.personnel.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/** File đã upload qua /files/upload trước đó — request này chỉ đăng ký metadata + kích hoạt OCR. */
public record EmployeeDocumentUploadRequest(
        @NotNull UUID employeeId,
        @NotNull String docType,
        @NotNull String fileUrl,
        String fileName
) {}
