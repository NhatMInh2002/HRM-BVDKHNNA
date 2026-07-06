package vn.hrm.personnel.service;

import lombok.RequiredArgsConstructor;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import vn.hrm.personnel.domain.Employee;
import vn.hrm.personnel.domain.enums.ContractType;
import vn.hrm.personnel.domain.enums.EmployeeStatus;
import vn.hrm.personnel.domain.enums.Gender;
import vn.hrm.personnel.repository.EmployeeRepository;

import java.io.ByteArrayOutputStream;
import java.time.format.DateTimeFormatter;
import java.util.EnumMap;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class EmployeeExcelService {

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    private static final Map<Gender, String> GENDER_LABELS = new EnumMap<>(Gender.class);
    private static final Map<EmployeeStatus, String> STATUS_LABELS = new EnumMap<>(EmployeeStatus.class);
    private static final Map<ContractType, String> CONTRACT_TYPE_LABELS = new EnumMap<>(ContractType.class);
    static {
        GENDER_LABELS.put(Gender.MALE, "Nam");
        GENDER_LABELS.put(Gender.FEMALE, "Nữ");
        GENDER_LABELS.put(Gender.OTHER, "Khác");

        STATUS_LABELS.put(EmployeeStatus.ACTIVE, "Đang làm việc");
        STATUS_LABELS.put(EmployeeStatus.ON_LEAVE, "Nghỉ phép dài hạn");
        STATUS_LABELS.put(EmployeeStatus.PROBATION, "Thử việc");
        STATUS_LABELS.put(EmployeeStatus.TERMINATED, "Đã nghỉ việc");
        STATUS_LABELS.put(EmployeeStatus.RETIRED, "Nghỉ hưu");

        CONTRACT_TYPE_LABELS.put(ContractType.INDEFINITE, "Không xác định thời hạn");
        CONTRACT_TYPE_LABELS.put(ContractType.FIXED_TERM_1Y, "Hợp đồng 1 năm");
        CONTRACT_TYPE_LABELS.put(ContractType.FIXED_TERM_2Y, "Hợp đồng 2 năm");
        CONTRACT_TYPE_LABELS.put(ContractType.PROBATION, "Hợp đồng thử việc");
        CONTRACT_TYPE_LABELS.put(ContractType.PART_TIME, "Bán thời gian");
    }

    private final EmployeeRepository employeeRepo;

    public byte[] exportExcel(String keyword, EmployeeStatus status, UUID departmentId) throws Exception {
        String kw = (keyword != null) ? keyword : "";
        var employees = employeeRepo.search(kw, status, departmentId,
                PageRequest.of(0, 5000, Sort.by("fullName"))).getContent();

        try (var wb = new XSSFWorkbook();
             var bos = new ByteArrayOutputStream()) {

            var sheet = wb.createSheet("Danh sach nhan vien");
            var headerFont = wb.createFont();
            headerFont.setBold(true);
            var headerStyle = wb.createCellStyle();
            headerStyle.setFont(headerFont);

            String[] headers = {
                "STT", "Ma NV", "Ho ten", "Gioi tinh", "Ngay sinh", "SDT", "Email",
                "Chuc vu", "Phong ban", "Loai hop dong", "Trang thai", "Ngay vao lam"
            };
            var hRow = sheet.createRow(0);
            for (int i = 0; i < headers.length; i++) {
                var cell = hRow.createCell(i);
                cell.setCellValue(headers[i]);
                cell.setCellStyle(headerStyle);
            }

            for (int i = 0; i < employees.size(); i++) {
                Employee e = employees.get(i);
                var row = sheet.createRow(i + 1);
                row.createCell(0).setCellValue(i + 1);
                row.createCell(1).setCellValue(str(e.getEmployeeCode()));
                row.createCell(2).setCellValue(str(e.getFullName()));
                row.createCell(3).setCellValue(e.getGender() != null ? GENDER_LABELS.get(e.getGender()) : "");
                row.createCell(4).setCellValue(e.getDateOfBirth() != null ? e.getDateOfBirth().format(DATE_FMT) : "");
                row.createCell(5).setCellValue(str(e.getPhone()));
                row.createCell(6).setCellValue(str(e.getEmail()));
                row.createCell(7).setCellValue(str(e.getPosition()));
                row.createCell(8).setCellValue(e.getDepartment() != null ? str(e.getDepartment().getName()) : "");
                row.createCell(9).setCellValue(e.getContractType() != null ? CONTRACT_TYPE_LABELS.get(e.getContractType()) : "");
                row.createCell(10).setCellValue(e.getStatus() != null ? STATUS_LABELS.get(e.getStatus()) : "");
                row.createCell(11).setCellValue(e.getJoinDate() != null ? e.getJoinDate().format(DATE_FMT) : "");
            }

            for (int i = 0; i < headers.length; i++) sheet.autoSizeColumn(i);
            wb.write(bos);
            return bos.toByteArray();
        }
    }

    private String str(String v) { return v != null ? v : ""; }
}
