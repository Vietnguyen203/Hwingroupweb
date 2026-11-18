-- Bảng lưu trữ giấy chứng nhận Vệ sinh an toàn thực phẩm, ISO/HACCP, kết quả kiểm nghiệm do Admin đăng tải
create table catalog.certificates (
    id              uuid primary key default uuid_generate_v7(),
    title           varchar(255) not null,
    cert_number     varchar(100),
    issuer          varchar(255) not null,
    issue_date      date,
    expiry_date     date,
    image_url       varchar(500) not null,
    category        varchar(50) not null default 'FOOD_SAFETY',
    description     text,
    active          boolean not null default true,
    sort_order      integer not null default 0,
    created_at      timestamptz not null default now(),
    updated_at      timestamptz not null default now()
);

create index idx_certificates_active_sort on catalog.certificates (active, sort_order);

comment on table catalog.certificates is 'Giấy chứng nhận VSATTP, ISO/HACCP và hồ sơ kiểm định thực phẩm';
comment on column catalog.certificates.category is 'FOOD_SAFETY, ISO_HACCP, TEST_REPORT, BUSINESS_LICENSE';

-- Nạp sẵn dữ liệu mẫu thực phẩm an toàn HWIN Food
insert into catalog.certificates (title, cert_number, issuer, issue_date, expiry_date, image_url, category, description, sort_order)
values
(
    'Giấy chứng nhận Cơ sở đủ điều kiện An toàn thực phẩm',
    'Số: 188/2024/ATTP-CNĐK',
    'Chi cục An toàn vệ sinh thực phẩm - Sở Y tế Hà Nội',
    '2024-03-15',
    '2027-03-15',
    '/sample/certificates/cert-vsattp.svg',
    'FOOD_SAFETY',
    'Chứng nhận cơ sở chế biến thực phẩm HWIN đạt đầy đủ các điều kiện vệ sinh an toàn thực phẩm theo Quy chuẩn kỹ thuật Quốc gia.',
    1
),
(
    'Chứng nhận Hệ thống Quản lý An toàn thực phẩm ISO 22000:2018',
    'Số: ISO-22000-HWIN-2023',
    'Tổ chức Chứng nhận Quốc tế TQC CQC',
    '2023-08-10',
    '2026-08-10',
    '/sample/certificates/cert-iso.svg',
    'ISO_HACCP',
    'Đạt tiêu chuẩn quốc tế ISO 22000:2018 cho quy trình sơ chế, bảo quản lạnh sâu và đóng gói thực phẩm thịt chín truyền thống.',
    2
),
(
    'Chứng nhận Phân tích mối nguy và điểm kiểm soát tới hạn (HACCP Codex)',
    'Số: HACCP-HWIN-0921',
    'Trung tâm Giám định & Chứng nhận Hợp chuẩn Quacert',
    '2023-11-20',
    '2026-11-20',
    '/sample/certificates/cert-haccp.svg',
    'ISO_HACCP',
    'Kiểm soát nghiêm ngặt 100% các điểm tới hạn CCP từ nguyên liệu thịt đầu vào đến thành phẩm bàn ăn.',
    3
),
(
    'Phiếu kết quả kiểm nghiệm an toàn thực phẩm & Vi sinh',
    'Số: KN-NIFC-2024-8891',
    'Viện Kiểm nghiệm An toàn vệ sinh thực phẩm Quốc gia (NIFC)',
    '2024-06-05',
    null,
    '/sample/certificates/cert-test-report.svg',
    'TEST_REPORT',
    'Kết quả định kỳ: Không chứa hàn the, không chất bảo quản cấm, chỉ tiêu vi sinh và kim loại nặng đạt chuẩn theo QCVN 8-2:2011/BYT.',
    4
);
