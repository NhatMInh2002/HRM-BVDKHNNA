package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.EmployeeConcurrentAssignment;
import vn.hrm.personnel.domain.enums.ConcurrentRoleType;
import vn.hrm.personnel.dto.EmployeeConcurrentAssignmentRequest;
import vn.hrm.personnel.dto.EmployeeConcurrentAssignmentResponse;
import vn.hrm.personnel.repository.DepartmentRepository;
import vn.hrm.personnel.repository.EmployeeConcurrentAssignmentRepository;
import vn.hrm.personnel.repository.EmployeeRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeConcurrentAssignmentService {

    private final EmployeeConcurrentAssignmentRepository assignmentRepo;
    private final EmployeeRepository employeeRepo;
    private final DepartmentRepository departmentRepo;

    @Transactional
    public EmployeeConcurrentAssignmentResponse create(EmployeeConcurrentAssignmentRequest req, String actor) {
        var employee = employeeRepo.findById(req.employeeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên"));
        var department = departmentRepo.findById(req.departmentId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy khoa/phòng"));

        var assignment = EmployeeConcurrentAssignment.builder()
                .employee(employee)
                .department(department)
                .roleType(ConcurrentRoleType.valueOf(req.roleType()))
                .timePercent(req.timePercent())
                .decisionNumber(req.decisionNumber())
                .effectiveFrom(req.effectiveFrom())
                .effectiveTo(req.effectiveTo())
                .note(req.note())
                .createdBy(actor)
                .build();

        return EmployeeConcurrentAssignmentResponse.from(assignmentRepo.save(assignment));
    }

    @Transactional
    public void end(UUID id) {
        var assignment = assignmentRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy bản ghi kiêm nhiệm"));
        assignment.setEffectiveTo(LocalDate.now());
        assignmentRepo.save(assignment);
    }

    public List<EmployeeConcurrentAssignmentResponse> getByEmployee(UUID employeeId) {
        return assignmentRepo.findByEmployeeIdOrderByEffectiveFromDesc(employeeId)
                .stream().map(EmployeeConcurrentAssignmentResponse::from).toList();
    }

    public Optional<EmployeeConcurrentAssignmentResponse> getCurrent(UUID employeeId) {
        return assignmentRepo.findFirstByEmployeeIdAndEffectiveToIsNullOrderByEffectiveFromDesc(employeeId)
                .map(EmployeeConcurrentAssignmentResponse::from);
    }
}
