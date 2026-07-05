package vn.hrm.personnel.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.hrm.personnel.domain.EmployeeDocument;
import vn.hrm.personnel.domain.enums.DocumentType;

import java.util.List;
import java.util.UUID;

public interface EmployeeDocumentRepository extends JpaRepository<EmployeeDocument, UUID> {

    List<EmployeeDocument> findByEmployeeIdOrderByCreatedAtDesc(UUID employeeId);

    List<EmployeeDocument> findByEmployeeIdAndDocTypeOrderByCreatedAtDesc(UUID employeeId, DocumentType docType);
}
