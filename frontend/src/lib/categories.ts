'use client'

export type CategoryKey =
  | 'trinh_do'
  | 'chuc_vu'
  | 'dan_toc'
  | 'ton_giao'
  | 'loai_hop_dong'
  | 'quan_huyen'
  | 'phuong_xa'

export interface CategoryItem {
  id: string
  label: string
  order: number
  active: boolean
}

export const CATEGORY_META: Record<CategoryKey, { title: string; description: string }> = {
  trinh_do:      { title: 'Trình độ',       description: 'Trình độ học vấn / chuyên môn' },
  chuc_vu:       { title: 'Chức vụ',         description: 'Chức danh công việc' },
  dan_toc:       { title: 'Dân tộc',         description: '54 dân tộc Việt Nam (Nghị định 05/2011/NĐ-CP)' },
  ton_giao:      { title: 'Tôn giáo',        description: 'Tín ngưỡng / tôn giáo' },
  loai_hop_dong: { title: 'Loại hợp đồng',   description: 'Theo Luật Viên chức 2010 sửa đổi 2019 & Bộ luật Lao động 2019' },
  quan_huyen:    { title: 'Quận/huyện',      description: '21 đơn vị hành chính cấp huyện tỉnh Nghệ An' },
  phuong_xa:     { title: 'Phường/xã',       description: 'Đơn vị hành chính cấp xã tỉnh Nghệ An' },
}

const DEFAULTS: Record<CategoryKey, string[]> = {
  trinh_do: [
    'Tiến sĩ', 'Thạc sĩ',
    'Bác sĩ CK II', 'Bác sĩ CK I', 'Bác sĩ',
    'Dược sĩ CK I', 'Dược sĩ',
    'Điều dưỡng CK I', 'Điều dưỡng',
    'Kỹ sư', 'Cử nhân', 'Cao đẳng', 'Trung cấp', 'Khác',
  ],

  chuc_vu: [
    'Giám đốc', 'Phó giám đốc',
    'Trưởng khoa', 'Phó trưởng khoa',
    'Trưởng phòng', 'Phó trưởng phòng',
    'Trưởng tổ', 'Phó trưởng tổ',
    'Bác sĩ', 'Y tá', 'Hộ sinh',
    'Điều dưỡng', 'Kỹ thuật viên',
    'Dược sĩ', 'Nhân viên',
  ],

  // ── 54 dân tộc Việt Nam (Nghị định 05/2011/NĐ-CP) ──────────────────────────
  dan_toc: [
    'Kinh', 'Tày', 'Thái', 'Mường', 'Khmer', 'Hoa', 'Nùng',
    'H\'Mông', 'Dao', 'Gia Rai', 'Ngái', 'Ê Đê', 'Ba Na',
    'Xơ Đăng', 'Sán Chay', 'Cơ Ho', 'Chăm', 'Sán Dìu', 'Hrê',
    'Mnông', 'Ra Glai', 'Xtiêng', 'Bru - Vân Kiều', 'Thổ', 'Giáy',
    'Cơ Tu', 'Gié - Triêng', 'Mạ', 'Khơ Mú', 'Co', 'Ta Ôi',
    'Chơ Ro', 'Kháng', 'Xinh Mun', 'Hà Nhì', 'Chu Ru', 'Lào',
    'La Chí', 'La Ha', 'Phù Lá', 'La Hủ', 'Lự', 'Lô Lô', 'Chứt',
    'Mảng', 'Pà Thẻn', 'Cờ Lao', 'Bố Y', 'Cống', 'Si La',
    'Pu Péo', 'Brâu', 'Ơ Đu', 'Rơ Măm',
  ],

  ton_giao: [
    'Không', 'Phật giáo', 'Công giáo (Thiên Chúa giáo)', 'Tin lành',
    'Cao đài', 'Phật giáo Hòa Hảo', 'Hồi giáo (Islam)',
    'Tịnh độ Cư sĩ Phật hội', 'Bửu Sơn Kỳ Hương', 'Khác',
  ],

  // ── Loại hợp đồng theo Luật Viên chức & Bộ luật Lao động ───────────────────
  loai_hop_dong: [
    // Viên chức (Luật Viên chức 2010, sửa đổi 2019)
    'HĐ làm việc không xác định thời hạn (viên chức)',
    'HĐ làm việc xác định thời hạn 12–60 tháng (viên chức)',
    // Công chức (không ký HĐ — quyết định tuyển dụng)
    'Quyết định tuyển dụng công chức',
    // Hợp đồng lao động (Bộ luật Lao động 2019)
    'HĐ lao động không xác định thời hạn',
    'HĐ lao động xác định thời hạn 12–36 tháng',
    'HĐ lao động theo công việc dưới 12 tháng',
    // Thử việc
    'HĐ thử việc (tối đa 2 tháng)',
    // Đặc thù bệnh viện
    'HĐ chuyên môn kỹ thuật y tế',
    'HĐ khoán việc / dịch vụ',
  ],

  // ── 21 đơn vị hành chính cấp huyện tỉnh Nghệ An ────────────────────────────
  quan_huyen: [
    // Đô thị
    'Thành phố Vinh',
    'Thị xã Cửa Lò',
    'Thị xã Thái Hòa',
    'Thị xã Hoàng Mai',
    // Huyện đồng bằng / ven biển
    'Huyện Diễn Châu',
    'Huyện Yên Thành',
    'Huyện Quỳnh Lưu',
    'Huyện Nghi Lộc',
    'Huyện Hưng Nguyên',
    'Huyện Nam Đàn',
    'Huyện Đô Lương',
    'Huyện Thanh Chương',
    'Huyện Nghĩa Đàn',
    'Huyện Tân Kỳ',
    'Huyện Anh Sơn',
    // Huyện miền núi
    'Huyện Quỳ Hợp',
    'Huyện Quỳ Châu',
    'Huyện Con Cuông',
    'Huyện Tương Dương',
    'Huyện Kỳ Sơn',
    // Huyện mới (tách từ Quỳnh Lưu 2019)
    // Hoàng Mai đã lên thị xã — đã liệt kê trên
  ],

  // ── Phường/xã/thị trấn tỉnh Nghệ An ────────────────────────────────────────
  phuong_xa: [
    // ── TP. VINH (25 đơn vị) ──
    'P. Lê Mao (TP. Vinh)',
    'P. Lê Lợi (TP. Vinh)',
    'P. Trường Thi (TP. Vinh)',
    'P. Cửa Nam (TP. Vinh)',
    'P. Quang Trung (TP. Vinh)',
    'P. Đội Cung (TP. Vinh)',
    'P. Hưng Bình (TP. Vinh)',
    'P. Hưng Phúc (TP. Vinh)',
    'P. Hưng Dũng (TP. Vinh)',
    'P. Hà Huy Tập (TP. Vinh)',
    'P. Bến Thủy (TP. Vinh)',
    'P. Hồng Sơn (TP. Vinh)',
    'P. Trung Đô (TP. Vinh)',
    'P. Vinh Tân (TP. Vinh)',
    'P. Đông Vĩnh (TP. Vinh)',
    'P. Hưng Hòa (TP. Vinh)',
    'P. Lạc Sơn (TP. Vinh)',
    'P. Quán Bàu (TP. Vinh)',
    'X. Nghi Phú (TP. Vinh)',
    'X. Nghi Kim (TP. Vinh)',
    'X. Nghi Liên (TP. Vinh)',
    'X. Nghi Ân (TP. Vinh)',
    'X. Nghi Đức (TP. Vinh)',
    'X. Hưng Chính (TP. Vinh)',
    'X. Hưng Lộc (TP. Vinh)',
    // ── TX. CỬA LÒ (7 đơn vị) ──
    'P. Nghi Thủy (TX. Cửa Lò)',
    'P. Nghi Tân (TX. Cửa Lò)',
    'P. Thu Thủy (TX. Cửa Lò)',
    'P. Nghi Hương (TX. Cửa Lò)',
    'P. Nghi Hải (TX. Cửa Lò)',
    'P. Nghi Thu (TX. Cửa Lò)',
    'X. Nghi Yên (TX. Cửa Lò)',
    // ── TX. THÁI HÒA (9 đơn vị) ──
    'P. Hòa Hiếu (TX. Thái Hòa)',
    'P. Quang Phong (TX. Thái Hòa)',
    'P. Quang Tiến (TX. Thái Hòa)',
    'X. Nghĩa Mỹ (TX. Thái Hòa)',
    'X. Tây Hiếu (TX. Thái Hòa)',
    'X. Nghĩa Thuận (TX. Thái Hòa)',
    'X. Đông Hiếu (TX. Thái Hòa)',
    'X. Nghĩa Tiến (TX. Thái Hòa)',
    'X. Nghĩa Hòa (TX. Thái Hòa)',
    // ── TX. HOÀNG MAI (9 đơn vị) ──
    'P. Quỳnh Dị (TX. Hoàng Mai)',
    'P. Quỳnh Lập (TX. Hoàng Mai)',
    'P. Quỳnh Thiện (TX. Hoàng Mai)',
    'P. Mai Hùng (TX. Hoàng Mai)',
    'P. Quỳnh Trang (TX. Hoàng Mai)',
    'X. Quỳnh Lộc (TX. Hoàng Mai)',
    'X. Quỳnh Vinh (TX. Hoàng Mai)',
    'X. Quỳnh Liên (TX. Hoàng Mai)',
    'X. Tiến Thủy (TX. Hoàng Mai)',
    // ── H. DIỄN CHÂU (39 đơn vị) ──
    'TT. Diễn Châu (H. Diễn Châu)',
    'X. Diễn Lâm (H. Diễn Châu)', 'X. Diễn Đoài (H. Diễn Châu)',
    'X. Diễn Trường (H. Diễn Châu)', 'X. Diễn Yên (H. Diễn Châu)',
    'X. Diễn Hoàng (H. Diễn Châu)', 'X. Diễn Hùng (H. Diễn Châu)',
    'X. Diễn Mỹ (H. Diễn Châu)', 'X. Diễn Bình (H. Diễn Châu)',
    'X. Diễn Ngọc (H. Diễn Châu)', 'X. Diễn Kỷ (H. Diễn Châu)',
    'X. Diễn Xuân (H. Diễn Châu)', 'X. Diễn Thái (H. Diễn Châu)',
    'X. Diễn Đồng (H. Diễn Châu)', 'X. Diễn Bích (H. Diễn Châu)',
    'X. Diễn Hải (H. Diễn Châu)', 'X. Diễn Kim (H. Diễn Châu)',
    'X. Diễn Vạn (H. Diễn Châu)', 'X. Diễn An (H. Diễn Châu)',
    'X. Diễn Phú (H. Diễn Châu)', 'X. Diễn Thịnh (H. Diễn Châu)',
    // ── H. YÊN THÀNH ──
    'TT. Yên Thành (H. Yên Thành)',
    'X. Mã Thành (H. Yên Thành)', 'X. Tiến Thành (H. Yên Thành)',
    'X. Lăng Thành (H. Yên Thành)', 'X. Tân Thành (H. Yên Thành)',
    'X. Đức Thành (H. Yên Thành)', 'X. Kim Thành (H. Yên Thành)',
    'X. Hậu Thành (H. Yên Thành)', 'X. Hùng Thành (H. Yên Thành)',
    'X. Đô Thành (H. Yên Thành)', 'X. Thọ Thành (H. Yên Thành)',
    'X. Nhân Thành (H. Yên Thành)', 'X. Viên Thành (H. Yên Thành)',
    'X. Long Thành (H. Yên Thành)', 'X. Minh Thành (H. Yên Thành)',
    'X. Bắc Thành (H. Yên Thành)', 'X. Phú Thành (H. Yên Thành)',
    'X. Xuân Thành (H. Yên Thành)', 'X. Công Thành (H. Yên Thành)',
    'X. Hoa Thành (H. Yên Thành)', 'X. Quang Thành (H. Yên Thành)',
    // ── H. QUỲNH LƯU ──
    'TT. Cầu Giát (H. Quỳnh Lưu)',
    'X. Quỳnh Thắng (H. Quỳnh Lưu)', 'X. Quỳnh Tân (H. Quỳnh Lưu)',
    'X. Quỳnh Châu (H. Quỳnh Lưu)', 'X. Quỳnh Hoa (H. Quỳnh Lưu)',
    'X. Quỳnh Mỹ (H. Quỳnh Lưu)', 'X. Quỳnh Thanh (H. Quỳnh Lưu)',
    'X. Quỳnh Hưng (H. Quỳnh Lưu)', 'X. Quỳnh Giang (H. Quỳnh Lưu)',
    'X. Quỳnh Văn (H. Quỳnh Lưu)', 'X. Ngọc Sơn (H. Quỳnh Lưu)',
    'X. Quỳnh Tam (H. Quỳnh Lưu)', 'X. Quỳnh Hồng (H. Quỳnh Lưu)',
    'X. Quỳnh Yên (H. Quỳnh Lưu)', 'X. Tân Sơn (H. Quỳnh Lưu)',
    'X. Quỳnh Bá (H. Quỳnh Lưu)', 'X. Quỳnh Diện (H. Quỳnh Lưu)',
    // ── H. NGHI LỘC ──
    'TT. Quán Hành (H. Nghi Lộc)',
    'X. Nghi Lâm (H. Nghi Lộc)', 'X. Nghi Văn (H. Nghi Lộc)',
    'X. Nghi Kiều (H. Nghi Lộc)', 'X. Nghi Công Bắc (H. Nghi Lộc)',
    'X. Nghi Công Nam (H. Nghi Lộc)', 'X. Nghi Thịnh (H. Nghi Lộc)',
    'X. Nghi Trung (H. Nghi Lộc)', 'X. Nghi Trường (H. Nghi Lộc)',
    'X. Nghi Diên (H. Nghi Lộc)', 'X. Nghi Phong (H. Nghi Lộc)',
    'X. Nghi Xuân (H. Nghi Lộc)', 'X. Nghi Hưng (H. Nghi Lộc)',
    'X. Nghi Hoa (H. Nghi Lộc)', 'X. Nghi Long (H. Nghi Lộc)',
    'X. Nghi Xá (H. Nghi Lộc)', 'X. Nghi Mỹ (H. Nghi Lộc)',
    'X. Nghi Thuận (H. Nghi Lộc)', 'X. Nghi Thiết (H. Nghi Lộc)',
    'X. Nghi Lâm (H. Nghi Lộc)', 'X. Phúc Thọ (H. Nghi Lộc)',
    // ── H. HƯNG NGUYÊN ──
    'TT. Hưng Nguyên (H. Hưng Nguyên)',
    'X. Hưng Trung (H. Hưng Nguyên)', 'X. Hưng Yên Bắc (H. Hưng Nguyên)',
    'X. Hưng Yên Nam (H. Hưng Nguyên)', 'X. Hưng Thái (H. Hưng Nguyên)',
    'X. Hưng Tây (H. Hưng Nguyên)', 'X. Hưng Đạo (H. Hưng Nguyên)',
    'X. Hưng Mỹ (H. Hưng Nguyên)', 'X. Hưng Thịnh (H. Hưng Nguyên)',
    'X. Hưng Lĩnh (H. Hưng Nguyên)', 'X. Hưng Lợi (H. Hưng Nguyên)',
    'X. Hưng Khánh (H. Hưng Nguyên)', 'X. Hưng Phúc (H. Hưng Nguyên)',
    'X. Hưng Long (H. Hưng Nguyên)', 'X. Hưng Tiến (H. Hưng Nguyên)',
    'X. Hưng Xuân (H. Hưng Nguyên)', 'X. Châu Nhân (H. Hưng Nguyên)',
    'X. Xuân Lam (H. Hưng Nguyên)',
    // ── H. NAM ĐÀN ──
    'TT. Nam Đàn (H. Nam Đàn)',
    'X. Nam Hưng (H. Nam Đàn)', 'X. Nam Nghĩa (H. Nam Đàn)',
    'X. Nam Thanh (H. Nam Đàn)', 'X. Nam Anh (H. Nam Đàn)',
    'X. Nam Xuân (H. Nam Đàn)', 'X. Nam Thái (H. Nam Đàn)',
    'X. Xuân Hòa (H. Nam Đàn)', 'X. Hùng Tiến (H. Nam Đàn)',
    'X. Thượng Tân Lộc (H. Nam Đàn)', 'X. Kim Liên (H. Nam Đàn)',
    'X. Vân Diên (H. Nam Đàn)', 'X. Nam Lộc (H. Nam Đàn)',
    'X. Hồng Long (H. Nam Đàn)', 'X. Đông Viên (H. Nam Đàn)',
    'X. Nam Giang (H. Nam Đàn)', 'X. Xuân Lâm (H. Nam Đàn)',
    'X. Nam Cường (H. Nam Đàn)', 'X. Khánh Sơn (H. Nam Đàn)',
    'X. Trung Phúc Cường (H. Nam Đàn)',
    // ── H. ĐÔ LƯƠNG ──
    'TT. Đô Lương (H. Đô Lương)',
    'X. Giang Sơn Đông (H. Đô Lương)', 'X. Giang Sơn Tây (H. Đô Lương)',
    'X. Lam Sơn (H. Đô Lương)', 'X. Bồi Sơn (H. Đô Lương)',
    'X. Hồng Sơn (H. Đô Lương)', 'X. Bài Sơn (H. Đô Lương)',
    'X. Ngọc Sơn (H. Đô Lương)', 'X. Bắc Sơn (H. Đô Lương)',
    'X. Tràng Sơn (H. Đô Lương)', 'X. Thượng Sơn (H. Đô Lương)',
    'X. Trung Sơn (H. Đô Lương)', 'X. Xuân Sơn (H. Đô Lương)',
    'X. Minh Sơn (H. Đô Lương)', 'X. Thuận Sơn (H. Đô Lương)',
    'X. Đặng Sơn (H. Đô Lương)', 'X. Đông Sơn (H. Đô Lương)',
    'X. Nam Sơn (H. Đô Lương)', 'X. Tân Sơn (H. Đô Lương)',
    'X. Văn Sơn (H. Đô Lương)', 'X. Lưu Sơn (H. Đô Lương)',
    'X. Quang Sơn (H. Đô Lương)', 'X. Thái Sơn (H. Đô Lương)',
    'X. Mỹ Sơn (H. Đô Lương)',
    // ── H. THANH CHƯƠNG ──
    'TT. Thanh Chương (H. Thanh Chương)',
    'X. Cát Văn (H. Thanh Chương)', 'X. Thanh Nho (H. Thanh Chương)',
    'X. Hạnh Lâm (H. Thanh Chương)', 'X. Thanh Sơn (H. Thanh Chương)',
    'X. Thanh Liên (H. Thanh Chương)', 'X. Thanh Văn (H. Thanh Chương)',
    'X. Đồng Văn (H. Thanh Chương)', 'X. Ngọc Lâm (H. Thanh Chương)',
    'X. Thanh Đồng (H. Thanh Chương)', 'X. Thanh Ngọc (H. Thanh Chương)',
    'X. Thanh Dương (H. Thanh Chương)', 'X. Thanh Lĩnh (H. Thanh Chương)',
    'X. Thanh Khê (H. Thanh Chương)', 'X. Võ Liệt (H. Thanh Chương)',
    'X. Thanh Long (H. Thanh Chương)', 'X. Thanh Thịnh (H. Thanh Chương)',
    'X. Thanh An (H. Thanh Chương)', 'X. Thanh Hà (H. Thanh Chương)',
    'X. Thanh Giang (H. Thanh Chương)', 'X. Thanh Tùng (H. Thanh Chương)',
    'X. Thanh Lương (H. Thanh Chương)', 'X. Thanh Xuân (H. Thanh Chương)',
    'X. Thanh Hòa (H. Thanh Chương)',
    // ── H. NGHĨA ĐÀN ──
    'TT. Nghĩa Đàn (H. Nghĩa Đàn)',
    'X. Nghĩa Mai (H. Nghĩa Đàn)', 'X. Nghĩa Yên (H. Nghĩa Đàn)',
    'X. Nghĩa Lạc (H. Nghĩa Đàn)', 'X. Nghĩa Lâm (H. Nghĩa Đàn)',
    'X. Nghĩa Sơn (H. Nghĩa Đàn)', 'X. Nghĩa Lợi (H. Nghĩa Đàn)',
    'X. Nghĩa Bình (H. Nghĩa Đàn)', 'X. Nghĩa Thịnh (H. Nghĩa Đàn)',
    'X. Nghĩa Minh (H. Nghĩa Đàn)', 'X. Nghĩa Phú (H. Nghĩa Đàn)',
    'X. Nghĩa Hiếu (H. Nghĩa Đàn)', 'X. Nghĩa Hưng (H. Nghĩa Đàn)',
    'X. Nghĩa Hội (H. Nghĩa Đàn)', 'X. Nghĩa Thọ (H. Nghĩa Đàn)',
    'X. Nghĩa Liên (H. Nghĩa Đàn)', 'X. Nghĩa Khánh (H. Nghĩa Đàn)',
    'X. Nghĩa Đức (H. Nghĩa Đàn)',
    // ── H. TÂN KỲ ──
    'TT. Tân Kỳ (H. Tân Kỳ)',
    'X. Tân Hợp (H. Tân Kỳ)', 'X. Tân Phú (H. Tân Kỳ)',
    'X. Tân Xuân (H. Tân Kỳ)', 'X. Giai Xuân (H. Tân Kỳ)',
    'X. Tiên Kỳ (H. Tân Kỳ)', 'X. Tân Long (H. Tân Kỳ)',
    'X. Đồng Văn (H. Tân Kỳ)', 'X. Nghĩa Bình (H. Tân Kỳ)',
    'X. Tân An (H. Tân Kỳ)', 'X. Kỳ Sơn (H. Tân Kỳ)',
    'X. Phú Sơn (H. Tân Kỳ)', 'X. Tân Hương (H. Tân Kỳ)',
    'X. Nghĩa Dũng (H. Tân Kỳ)', 'X. Tân Hòa (H. Tân Kỳ)',
    'X. Nghĩa Hoàn (H. Tân Kỳ)',
    // ── H. ANH SƠN ──
    'TT. Anh Sơn (H. Anh Sơn)',
    'X. Thọ Sơn (H. Anh Sơn)', 'X. Thành Sơn (H. Anh Sơn)',
    'X. Bình Sơn (H. Anh Sơn)', 'X. Tam Sơn (H. Anh Sơn)',
    'X. Đỉnh Sơn (H. Anh Sơn)', 'X. Hùng Sơn (H. Anh Sơn)',
    'X. Cẩm Sơn (H. Anh Sơn)', 'X. Đức Sơn (H. Anh Sơn)',
    'X. Tường Sơn (H. Anh Sơn)', 'X. Hoa Sơn (H. Anh Sơn)',
    'X. Tào Sơn (H. Anh Sơn)', 'X. Vĩnh Sơn (H. Anh Sơn)',
    'X. Lạng Sơn (H. Anh Sơn)', 'X. Hội Sơn (H. Anh Sơn)',
    'X. Long Sơn (H. Anh Sơn)', 'X. Khai Sơn (H. Anh Sơn)',
    'X. Lĩnh Sơn (H. Anh Sơn)', 'X. Phúc Sơn (H. Anh Sơn)',
    // ── H. QUỲ HỢP ──
    'TT. Quỳ Hợp (H. Quỳ Hợp)',
    'X. Yên Hợp (H. Quỳ Hợp)', 'X. Châu Tiến (H. Quỳ Hợp)',
    'X. Châu Hồng (H. Quỳ Hợp)', 'X. Đồng Hợp (H. Quỳ Hợp)',
    'X. Châu Thành (H. Quỳ Hợp)', 'X. Liên Hợp (H. Quỳ Hợp)',
    'X. Châu Lộc (H. Quỳ Hợp)', 'X. Tam Hợp (H. Quỳ Hợp)',
    'X. Châu Cường (H. Quỳ Hợp)', 'X. Châu Quang (H. Quỳ Hợp)',
    'X. Thọ Hợp (H. Quỳ Hợp)', 'X. Minh Hợp (H. Quỳ Hợp)',
    'X. Nghĩa Xuân (H. Quỳ Hợp)', 'X. Châu Thái (H. Quỳ Hợp)',
    'X. Châu Đình (H. Quỳ Hợp)', 'X. Văn Lợi (H. Quỳ Hợp)',
    'X. Nam Sơn (H. Quỳ Hợp)', 'X. Châu Lý (H. Quỳ Hợp)',
    'X. Hạ Sơn (H. Quỳ Hợp)', 'X. Bắc Sơn (H. Quỳ Hợp)',
    // ── H. QUỲ CHÂU ──
    'TT. Tân Lạc (H. Quỳ Châu)',
    'X. Châu Bình (H. Quỳ Châu)', 'X. Châu Thuận (H. Quỳ Châu)',
    'X. Châu Hội (H. Quỳ Châu)', 'X. Châu Nga (H. Quỳ Châu)',
    'X. Châu Tiến (H. Quỳ Châu)', 'X. Châu Hạnh (H. Quỳ Châu)',
    'X. Châu Thắng (H. Quỳ Châu)', 'X. Châu Phong (H. Quỳ Châu)',
    'X. Châu Bính (H. Quỳ Châu)', 'X. Châu Hoàn (H. Quỳ Châu)',
    'X. Diên Lãm (H. Quỳ Châu)',
    // ── H. CON CUÔNG ──
    'TT. Con Cuông (H. Con Cuông)',
    'X. Bình Chuẩn (H. Con Cuông)', 'X. Lạng Khê (H. Con Cuông)',
    'X. Cam Lâm (H. Con Cuông)', 'X. Thạch Ngàn (H. Con Cuông)',
    'X. Đôn Phục (H. Con Cuông)', 'X. Mậu Đức (H. Con Cuông)',
    'X. Châu Khê (H. Con Cuông)', 'X. Chi Khê (H. Con Cuông)',
    'X. Bồng Khê (H. Con Cuông)', 'X. Yên Khê (H. Con Cuông)',
    'X. Lục Dạ (H. Con Cuông)', 'X. Môn Sơn (H. Con Cuông)',
    // ── H. TƯƠNG DƯƠNG ──
    'TT. Thạch Giám (H. Tương Dương)',
    'X. Tam Quang (H. Tương Dương)', 'X. Tam Thái (H. Tương Dương)',
    'X. Tam Đình (H. Tương Dương)', 'X. Yên Hòa (H. Tương Dương)',
    'X. Yên Na (H. Tương Dương)', 'X. Lưu Kiền (H. Tương Dương)',
    'X. Xá Lượng (H. Tương Dương)', 'X. Tam Hợp (H. Tương Dương)',
    'X. Nhôn Mai (H. Tương Dương)', 'X. Mai Sơn (H. Tương Dương)',
    'X. Nga My (H. Tương Dương)', 'X. Xiêng My (H. Tương Dương)',
    'X. Lượng Minh (H. Tương Dương)', 'X. Hữu Khuông (H. Tương Dương)',
    // ── H. KỲ SƠN ──
    'TT. Mường Xén (H. Kỳ Sơn)',
    'X. Mỹ Lý (H. Kỳ Sơn)', 'X. Bắc Lý (H. Kỳ Sơn)',
    'X. Keng Đu (H. Kỳ Sơn)', 'X. Đoọc Mạy (H. Kỳ Sơn)',
    'X. Huổi Tụ (H. Kỳ Sơn)', 'X. Mường Lống (H. Kỳ Sơn)',
    'X. Na Loi (H. Kỳ Sơn)', 'X. Nậm Cắn (H. Kỳ Sơn)',
    'X. Bảo Nam (H. Kỳ Sơn)', 'X. Phà Đánh (H. Kỳ Sơn)',
    'X. Bảo Thắng (H. Kỳ Sơn)', 'X. Hữu Lập (H. Kỳ Sơn)',
    'X. Tà Cạ (H. Kỳ Sơn)', 'X. Chiêu Lưu (H. Kỳ Sơn)',
    'X. Mường Típ (H. Kỳ Sơn)', 'X. Hữu Kiệm (H. Kỳ Sơn)',
    'X. Tây Sơn (H. Kỳ Sơn)', 'X. Mường Ải (H. Kỳ Sơn)',
    'X. Na Ngoi (H. Kỳ Sơn)', 'X. Nậm Càn (H. Kỳ Sơn)',
  ],
}

const STORAGE_PREFIX = 'hrm_dm_'

function storageKey(key: CategoryKey) {
  return STORAGE_PREFIX + key
}

export function getCategory(key: CategoryKey): CategoryItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(storageKey(key))
    if (raw) return JSON.parse(raw)
  } catch {}
  const items = DEFAULTS[key].map((label, i) => ({
    id: `${key}_${i}`,
    label,
    order: i,
    active: true,
  }))
  saveCategory(key, items)
  return items
}

export function saveCategory(key: CategoryKey, items: CategoryItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(storageKey(key), JSON.stringify(items))
}

export function getActiveLabels(key: CategoryKey): string[] {
  return getCategory(key)
    .filter(i => i.active)
    .sort((a, b) => a.order - b.order)
    .map(i => i.label)
}

// Xóa cache để load lại defaults (dùng khi cần reset)
export function resetCategory(key: CategoryKey) {
  if (typeof window === 'undefined') return
  localStorage.removeItem(storageKey(key))
}
