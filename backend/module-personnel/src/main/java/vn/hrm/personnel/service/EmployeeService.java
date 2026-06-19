package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.domain.enums.EmployeeStatus;
import vn.hrm.personnel.dto.EmployeeRequest;
import vn.hrm.personnel.dto.EmployeeResponse;
import vn.hrm.personnel.repository.DepartmentRepository;
import vn.hrm.personnel.repository.EmployeeRepository;
import vn.hrm.shared.exception.HrmException;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class EmployeeService {

    private final EmployeeRepository employeeRepo;
    private final DepartmentRepository departmentRepo;

    public Page<EmployeeResponse> search(String keyword, EmployeeStatus status, UUID departmentId, Pageable pageable) {
        String kw = (keyword != null) ? keyword : "";
        return employeeRepo.search(kw, status, departmentId, pageable)
            .map(EmployeeResponse::from);
    }

    public EmployeeResponse getById(UUID id) {
        return employeeRepo.findById(id)
            .map(EmployeeResponse::from)
            .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên: " + id));
    }

    @Transactional
    public EmployeeResponse create(EmployeeRequest req, String createdBy) {
        if (employeeRepo.existsByEmployeeCode(req.employeeCode())) {
            throw HrmException.badRequest("DUPLICATE_EMPLOYEE_CODE", "Mã nhân viên đã tồn tại: " + req.employeeCode());
        }
        if (req.email() != null && employeeRepo.existsByEmail(req.email())) {
            throw HrmException.badRequest("DUPLICATE_EMAIL", "Email đã được sử dụng: " + req.email());
        }

        Employee employee = Employee.builder()
            .employeeCode(req.employeeCode())
            .fullName(req.fullName())
            .email(req.email())
            .phone(req.phone())
            .gender(req.gender())
            .dateOfBirth(req.dateOfBirth())
            .nationalId(req.nationalId())
            .joinDate(req.joinDate())
            .status(EmployeeStatus.ACTIVE)
            .contractType(req.contractType())
            .position(req.position())
            .createdBy(createdBy)
            .build();

        if (req.departmentId() != null) {
            employee.setDepartment(departmentRepo.findById(req.departmentId())
                .orElseThrow(() -> HrmException.notFound("DEPT_NOT_FOUND", "Không tìm thấy phòng ban: " + req.departmentId())));
        }
        if (req.managerId() != null) {
            employee.setManager(employeeRepo.findById(req.managerId())
                .orElseThrow(() -> HrmException.notFound("MANAGER_NOT_FOUND", "Không tìm thấy quản lý: " + req.managerId())));
        }

        return EmployeeResponse.from(employeeRepo.save(employee));
    }

    @Transactional
    public EmployeeResponse update(UUID id, EmployeeRequest req, String updatedBy) {
        Employee employee = employeeRepo.findById(id)
            .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên: " + id));

        if (!employee.getEmployeeCode().equals(req.employeeCode())
                && employeeRepo.existsByEmployeeCode(req.employeeCode())) {
            throw HrmException.badRequest("DUPLICATE_EMPLOYEE_CODE", "Mã nhân viên đã tồn tại: " + req.employeeCode());
        }

        employee.setEmployeeCode(req.employeeCode());
        employee.setFullName(req.fullName());
        employee.setEmail(req.email());
        employee.setPhone(req.phone());
        employee.setGender(req.gender());
        employee.setDateOfBirth(req.dateOfBirth());
        employee.setNationalId(req.nationalId());
        employee.setJoinDate(req.joinDate());
        employee.setContractType(req.contractType());
        employee.setPosition(req.position());

        if (req.departmentId() != null) {
            employee.setDepartment(departmentRepo.findById(req.departmentId())
                .orElseThrow(() -> HrmException.notFound("DEPT_NOT_FOUND", "Không tìm thấy phòng ban: " + req.departmentId())));
        } else {
            employee.setDepartment(null);
        }

        if (req.managerId() != null) {
            employee.setManager(employeeRepo.findById(req.managerId())
                .orElseThrow(() -> HrmException.notFound("MANAGER_NOT_FOUND", "Không tìm thấy quản lý: " + req.managerId())));
        } else {
            employee.setManager(null);
        }

        return EmployeeResponse.from(employeeRepo.save(employee));
    }

    @Transactional
    public void terminate(UUID id, String updatedBy) {
        Employee employee = employeeRepo.findById(id)
            .orElseThrow(() -> HrmException.notFound("EMPLOYEE_NOT_FOUND", "Không tìm thấy nhân viên: " + id));
        if (employee.getStatus() == EmployeeStatus.TERMINATED) {
            throw HrmException.badRequest("ALREADY_TERMINATED", "Nhân viên đã nghỉ việc");
        }
        employee.setStatus(EmployeeStatus.TERMINATED);
        employeeRepo.save(employee);
    }
}
