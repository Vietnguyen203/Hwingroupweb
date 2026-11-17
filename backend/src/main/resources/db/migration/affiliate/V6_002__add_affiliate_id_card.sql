-- Ảnh CCCD (mặt trước/sau) nộp khi đăng ký CTV. Chỉ lưu khóa file trong kho riêng tư (không có URL công khai).
alter table affiliate.affiliates
    add column id_card_front_key varchar(255),
    add column id_card_back_key  varchar(255);

comment on column affiliate.affiliates.id_card_front_key is 'Khóa file ảnh CCCD mặt trước trong kho riêng tư; chỉ ADMIN xem được';
comment on column affiliate.affiliates.id_card_back_key is 'Khóa file ảnh CCCD mặt sau trong kho riêng tư; chỉ ADMIN xem được';
