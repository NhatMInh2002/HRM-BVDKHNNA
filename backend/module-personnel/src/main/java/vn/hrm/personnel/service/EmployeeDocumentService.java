package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.EmployeeDocument;
import vn.hrm.personnel.domain.enums.DocumentType;
import vn.hrm.personnel.dto.EmployeeDocumentResponse;
import vn.hrm.personnel.dto.EmployeeDocumentUploadRequest;
import vn.hrm.personnel.repository.EmployeeDocumentRepository;
import vn.hrm.personnel.repository.EmployeeRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeDocumentService {

    private final EmployeeDocumentRepository documentRepo;
    private final EmployeeRepository employeeRepo;
    private final DocumentOcrService ocrService;

    @Transactional
    public EmployeeDocumentResponse register(EmployeeDocumentUploadRequest req, String actor) {
        var employee = employeeRepo.findById(req.employeeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên"));

        var doc = EmployeeDocument.builder()
                .employee(employee)
                .docType(DocumentType.valueOf(req.docType()))
                .fileUrl(req.fileUrl())
                .fileName(req.fileName())
                .uploadedBy(actor)
                .build();
        doc = documentRepo.save(doc);

        ocrService.processAsync(doc.getId());
        return EmployeeDocumentResponse.from(doc);
    }

    public List<EmployeeDocumentResponse> getByEmployee(UUID employeeId) {
        return documentRepo.findByEmployeeIdOrderByCreatedAtDesc(employeeId)
                .stream().map(EmployeeDocumentResponse::from).toList();
    }

    @Transactional
    public EmployeeDocumentResponse verify(UUID id, String actor) {
        var doc = documentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hồ sơ"));
        doc.setVerified(true);
        doc.setVerifiedBy(actor);
        doc.setVerifiedAt(LocalDateTime.now());
        return EmployeeDocumentResponse.from(documentRepo.save(doc));
    }
}
