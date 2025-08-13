#!/bin/bash

echo "착착 백엔드 PostgreSQL 설정 스크립트"
echo "====================================="

# PostgreSQL 설치 확인
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL이 설치되지 않았습니다."
    echo "macOS: brew install postgresql"
    echo "또는 https://postgresapp.com 에서 다운로드"
    exit 1
fi

echo "PostgreSQL이 설치되어 있습니다."

# 데이터베이스 생성
echo "데이터베이스 생성 중..."
psql -U postgres -c "CREATE DATABASE chackchack;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ 데이터베이스 'chackchack'가 생성되었습니다."
else
    echo "ℹ️  데이터베이스가 이미 존재하거나 생성에 실패했습니다."
fi

# .env 파일 확인
if [ ! -f .env ]; then
    echo "⚠️  .env 파일이 없습니다. .env.example을 복사합니다..."
    cp .env.example .env
    echo "✅ .env 파일이 생성되었습니다. 필요시 수정하세요."
fi

echo ""
echo "설정 완료!"
echo "다음 명령어로 서버를 시작하세요:"
echo "  npm install"
echo "  npm run start:dev"