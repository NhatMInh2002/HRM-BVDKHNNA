package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.hrm.personnel.domain.*;
import vn.hrm.personnel.dto.EmployeeProfileDto;
import vn.hrm.personnel.dto.EmployeeProfileDto.*;
import vn.hrm.personnel.repository.*;

import java.util.List;
import java.util.UUID;

/**
 * Đọc/ghi hồ sơ lý lịch mở rộng HS02-VC/BNV: cập nhật các trường bổ sung trên
 * Employee + thay thế toàn bộ 4 danh sách con (work history, trainings,
 * family relations, awards) theo kiểu replace-all cho đơn giản, tránh phải
 * diff từng dòng phía client.
 */
@Service
@RequiredArgsConstructor
public class EmployeeProfileService {

    private final EmployeeRepository employeeRepo;
    private final EmployeeWorkHistoryRepository workRepo;
    private final EmployeeTrainingRepository trainingRepo;
    private final EmployeeFamilyRelationRepository familyRepo;
    private final EmployeeAwardRepository awardRepo;

    @Transactional(readOnly = true)
    public EmployeeProfileDto get(UUID employeeId) {
        Employee e = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên"));

        List<WorkHistoryDto> work = workRepo.findByEmployeeIdOrderByDisplayOrderAscFromDateAsc(employeeId)
                .stream().map(w -> new WorkHistoryDto(
                        w.getFromDate(), w.getToDate(), w.getUnit(), w.getPosition(), w.getNote())).toList();

        List<TrainingDto> trainings = trainingRepo.findByEmployeeIdOrderByDisplayOrderAscFromDateAsc(employeeId)
                .stream().map(t -> new TrainingDto(
                        t.getFromDate(), t.getToDate(), t.getInstitution(),
                        t.getField(), t.getForm(), t.getDegree())).toList();

        List<FamilyRelationDto> family = familyRepo.findByEmployeeIdOrderBySideAscDisplayOrderAsc(employeeId)
                .stream().map(f -> new FamilyRelationDto(
                        f.getSide(), f.getRelation(), f.getFullName(), f.getBirthYear(), f.getDetail())).toList();

        List<AwardDto> awards = awardRepo.findByEmployeeIdOrderByTypeAscDisplayOrderAscYearAsc(employeeId)
                .stream().map(a -> new AwardDto(
                        a.getType(), a.getYear(), a.getTitle(), a.getDecisionNo(), a.getLevel())).toList();

        return new EmployeeProfileDto(
                e.getBirthPlace(), e.getNationalIdIssueDate(), e.getNationalIdIssuePlace(),
                e.getSocialInsuranceNo(), e.getHealthInsuranceNo(), e.getFamilyOrigin(),
                e.getJobBeforeRecruitment(), e.getRecruitmentDate(), e.getRecruitmentAgency(),
                e.getNgachCode(), e.getSalaryGrade(), e.getSalaryCoefficient(), e.getSalaryEffectiveDate(),
                e.getEducationGeneral(), e.getProfessionalDegree(), e.getPoliticalTheory(),
                e.getStateManagement(), e.getForeignLanguage(), e.getInformaticsLevel(),
                e.getPartyJoinDate(), e.getPartyOfficialDate(), e.getYouthUnionJoinDate(),
                e.getMilitaryServiceFrom(), e.getMilitaryServiceTo(), e.getWarInvalidClass(),
                e.getPolicyFamilyType(), e.getHealthStatus(), e.getHeightCm(), e.getWeightKg(),
                e.getBloodType(), e.getPersonalHistory(), e.getFamilyEconomy(),
                work, trainings, family, awards);
    }

    @Transactional
    public EmployeeProfileDto save(UUID employeeId, EmployeeProfileDto dto) {
        Employee e = employeeRepo.findById(employeeId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy nhân viên"));

        e.setBirthPlace(dto.birthPlace());
        e.setNationalIdIssueDate(dto.nationalIdIssueDate());
        e.setNationalIdIssuePlace(dto.nationalIdIssuePlace());
        e.setSocialInsuranceNo(dto.socialInsuranceNo());
        e.setHealthInsuranceNo(dto.healthInsuranceNo());
        e.setFamilyOrigin(dto.familyOrigin());
        e.setJobBeforeRecruitment(dto.jobBeforeRecruitment());
        e.setRecruitmentDate(dto.recruitmentDate());
        e.setRecruitmentAgency(dto.recruitmentAgency());
        e.setNgachCode(dto.ngachCode());
        e.setSalaryGrade(dto.salaryGrade());
        e.setSalaryCoefficient(dto.salaryCoefficient());
        e.setSalaryEffectiveDate(dto.salaryEffectiveDate());
        e.setEducationGeneral(dto.educationGeneral());
        e.setProfessionalDegree(dto.professionalDegree());
        e.setPoliticalTheory(dto.politicalTheory());
        e.setStateManagement(dto.stateManagement());
        e.setForeignLanguage(dto.foreignLanguage());
        e.setInformaticsLevel(dto.informaticsLevel());
        e.setPartyJoinDate(dto.partyJoinDate());
        e.setPartyOfficialDate(dto.partyOfficialDate());
        e.setYouthUnionJoinDate(dto.youthUnionJoinDate());
        e.setMilitaryServiceFrom(dto.militaryServiceFrom());
        e.setMilitaryServiceTo(dto.militaryServiceTo());
        e.setWarInvalidClass(dto.warInvalidClass());
        e.setPolicyFamilyType(dto.policyFamilyType());
        e.setHealthStatus(dto.healthStatus());
        e.setHeightCm(dto.heightCm());
        e.setWeightKg(dto.weightKg());
        e.setBloodType(dto.bloodType());
        e.setPersonalHistory(dto.personalHistory());
        e.setFamilyEconomy(dto.familyEconomy());
        employeeRepo.save(e);

        // Replace-all các danh sách con
        workRepo.deleteByEmployeeId(employeeId);
        if (dto.workHistory() != null) {
            short i = 0;
            for (WorkHistoryDto w : dto.workHistory()) {
                if (w.fromDate() == null || isBlank(w.unit())) continue;
                workRepo.save(EmployeeWorkHistory.builder()
                        .employeeId(employeeId).fromDate(w.fromDate()).toDate(w.toDate())
                        .unit(w.unit()).position(w.position()).note(w.note())
                        .displayOrder(i++).build());
            }
        }

        trainingRepo.deleteByEmployeeId(employeeId);
        if (dto.trainings() != null) {
            short i = 0;
            for (TrainingDto t : dto.trainings()) {
                if (isBlank(t.institution())) continue;
                trainingRepo.save(EmployeeTraining.builder()
                        .employeeId(employeeId).fromDate(t.fromDate()).toDate(t.toDate())
                        .institution(t.institution()).field(t.field()).form(t.form()).degree(t.degree())
                        .displayOrder(i++).build());
            }
        }

        familyRepo.deleteByEmployeeId(employeeId);
        if (dto.familyRelations() != null) {
            short i = 0;
            for (FamilyRelationDto f : dto.familyRelations()) {
                if (isBlank(f.relation()) || isBlank(f.fullName())) continue;
                familyRepo.save(EmployeeFamilyRelation.builder()
                        .employeeId(employeeId)
                        .side(isBlank(f.side()) ? "SELF" : f.side())
                        .relation(f.relation()).fullName(f.fullName())
                        .birthYear(f.birthYear()).detail(f.detail())
                        .displayOrder(i++).build());
            }
        }

        awardRepo.deleteByEmployeeId(employeeId);
        if (dto.awards() != null) {
            short i = 0;
            for (AwardDto a : dto.awards()) {
                if (isBlank(a.type()) || isBlank(a.title())) continue;
                awardRepo.save(EmployeeAward.builder()
                        .employeeId(employeeId).type(a.type()).year(a.year())
                        .title(a.title()).decisionNo(a.decisionNo()).level(a.level())
                        .displayOrder(i++).build());
            }
        }

        return get(employeeId);
    }

    private boolean isBlank(String s) { return s == null || s.isBlank(); }
}
