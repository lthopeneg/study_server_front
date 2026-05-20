# 1단계: 빌드 환경 (Builder Stage)
FROM node:18-alpine AS builder

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 매니저 파일 복사 및 설치
COPY package.json package-lock.json ./
RUN npm install

# 소스 코드 복사 및 빌드
COPY . .
RUN npm run build

# 2단계: 실행 환경 (Production Stage)
FROM nginx:alpine

# 기존의 기본 Nginx 설정 파일 삭제
RUN rm /etc/nginx/conf.d/default.conf

# 우리가 만든 커스텀 Nginx 설정 파일 복사
COPY nginx.conf /etc/nginx/conf.d

# Builder 단계에서 생성된 빌드 결과물(dist)을 Nginx의 서빙 폴더로 복사
COPY --from=builder /app/dist /usr/share/nginx/html

# 컨테이너가 사용할 포트
EXPOSE 80

# Nginx 실행
CMD ["nginx", "-g", "daemon off;"]
