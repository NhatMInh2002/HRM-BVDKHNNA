package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.Contract;
import vn.hrm.personnel.domain.enums.ContractStatus;
import vn.hrm.personnel.domain.enums.ContractType;
import vn.hrm.personnel.dto.ContractRequest;
import vn.hrm.personnel.dto.ContractResponse;
import vn.hrm.personnel.repository.ContractRepository;
import vn.hrm.personnel.repository.EmployeeRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ContractService {

    private final ContractRepository contractRepo;
    private final EmployeeRepository employeeRepo;

    public List<ContractResponse> getByEmployee(UUID employeeId) {
        return contractRepo.findByEmployeeIdOrderByStartDateDesc(employeeId)
                .stream().map(ContractResponse::from).toList();
    }

    /** Hợp đồng sắp hết hạn trong 30 ngày tới (dùng cho dashboard cảnh báo) */
    public List<ContractResponse> getExpiringSoon(int days) {
        LocalDate from = LocalDate.now();
        LocalDate to   = from.plusDays(days);
        return contractRepo.findExpiringBetween(from, to)
                .stream().map(ContractResponse::from).toList();
    }

    @Transactional
    public ContractResponse create(ContractRequest req, String currentUser) {
        if (contractRepo.existsByContractNumber(req.contractNumber()))
            throw new IllegalArgumentException("Số hợp đồng đã tồn tại: " + req.contractNumber());

        var employee = employeeRepo.findById(req.employeeId())
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên"));

        var contract = Contract.builder()
                .employee(employee)
                .contractNumber(req.contractNumber())
                .contractType(ContractType.valueOf(req.contractType()))
                .status(ContractStatus.ACTIVE)
                .startDate(req.startDate())
                .endDate(req.endDate())
                .signDate(req.signDate())
                .signerName(req.signerName())
                .position(req.position())
                .departmentName(req.departmentName())
                .baseSalary(req.baseSalary())
                .salaryGrade(req.salaryGrade())
                .salaryCoefficient(req.salaryCoefficient())
                .allowancePosition(req.allowancePosition())
                .allowanceSeniority(req.allowanceSeniority())
                .allowanceOther(req.allowanceOther())
                .attachmentUrl(req.attachmentUrl())
                .attachmentName(req.attachmentName())
                .notes(req.notes())
                .createdBy(currentUser)
                .build();

        // Cập nhật contractType trên Employee cho nhất quán
        employee.setContractType(ContractType.valueOf(req.contractType()));

        return ContractResponse.from(contractRepo.save(contract));
    }

    @Transactional
    public ContractResponse updateStatus(UUID id, String status, String currentUser) {
        var contract = contractRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng"));
        contract.setStatus(ContractStatus.valueOf(status));
        return ContractResponse.from(contractRepo.save(contract));
    }

    @Transactional
    public ContractResponse update(UUID id, ContractRequest req, String currentUser) {
        var contract = contractRepo.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy hợp đồng"));

        contract.setContractType(ContractType.valueOf(req.contractType()));
        contract.setStartDate(req.startDate());
        contract.setEndDate(req.endDate());
        contract.setSignDate(req.signDate());
        contract.setSignerName(req.signerName());
        contract.setPosition(req.position());
        contract.setDepartmentName(req.departmentName());
        contract.setBaseSalary(req.baseSalary());
        contract.setSalaryGrade(req.salaryGrade());
        contract.setSalaryCoefficient(req.salaryCoefficient());
        contract.setAllowancePosition(req.allowancePosition());
        contract.setAllowanceSeniority(req.allowanceSeniority());
        contract.setAllowanceOther(req.allowanceOther());
        contract.setAttachmentUrl(req.attachmentUrl());
        contract.setAttachmentName(req.attachmentName());
        contract.setNotes(req.notes());

        return ContractResponse.from(contractRepo.save(contract));
    }
}
