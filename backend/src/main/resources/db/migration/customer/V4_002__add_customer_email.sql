-- Khách có thể đăng nhập bằng email (chưa có SĐT): SĐT không còn bắt buộc, thêm email.
alter table customer.customers alter column phone drop not null;
alter table customer.customers add column email varchar(255) unique;
alter table customer.customers add constraint ck_customer_contact check (phone is not null or email is not null);

comment on column customer.customers.phone is 'SĐT đăng nhập (+84...) – null nếu khách đăng nhập bằng email';
comment on column customer.customers.email is 'Email đăng nhập (chữ thường) – null nếu khách đăng nhập bằng SĐT';
