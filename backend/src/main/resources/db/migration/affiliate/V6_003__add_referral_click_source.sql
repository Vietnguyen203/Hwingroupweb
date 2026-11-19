-- Nền tảng mà khách bấm link CTV từ đó (link có ?src=facebook|zalo|tiktok|youtube|instagram).
-- Click cũ và link không gắn src được xếp vào OTHER.
alter table affiliate.referral_clicks
    add column source varchar(16) not null default 'OTHER';

comment on column affiliate.referral_clicks.source is 'Nền tảng chia sẻ: FACEBOOK, ZALO, TIKTOK, YOUTUBE, INSTAGRAM; OTHER = khác / không gắn src / click trước khi có cột này';
