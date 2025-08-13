-- PostgreSQL 데이터베이스 설정 스크립트

-- 1. 데이터베이스 생성
CREATE DATABASE chackchack;

-- 2. 데이터베이스에 연결
\c chackchack;

-- 3. 사용자 생성 (선택사항)
-- CREATE USER chackchack_user WITH PASSWORD 'your_password';
-- GRANT ALL PRIVILEGES ON DATABASE chackchack TO chackchack_user;

-- TypeORM이 자동으로 테이블을 생성하므로 수동으로 테이블을 만들 필요 없음
-- synchronize: true 옵션이 설정되어 있음