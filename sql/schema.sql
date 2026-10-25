-- Bảng ví dụ theo sách SQL Performance Explained (chương 1).
DROP TABLE IF EXISTS employees;

CREATE TABLE employees (
  employee_id   integer      NOT NULL,
  subsidiary_id integer      NOT NULL,
  first_name    varchar(255) NOT NULL,
  last_name     varchar(255) NOT NULL,
  date_of_birth date         NOT NULL,
  phone_number  varchar(255),
  PRIMARY KEY (employee_id, subsidiary_id)
);
