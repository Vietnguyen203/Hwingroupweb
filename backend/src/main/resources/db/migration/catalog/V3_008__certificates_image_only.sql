-- Giấy chứng nhận chỉ cần ảnh bản scan: tiêu đề và cơ quan cấp trở thành tùy chọn (dữ liệu mẫu cũ giữ nguyên)
alter table catalog.certificates
    alter column title  drop not null,
    alter column issuer drop not null;
