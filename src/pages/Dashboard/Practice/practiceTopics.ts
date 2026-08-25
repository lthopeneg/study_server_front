export type PracticeTopicGroup = {
    title: string;
    topics: string[];
};

export const pythonTopicGroups: PracticeTopicGroup[] = [
    {
        title: '입력데이터 검증 및 표현',
        topics: [
            'SQL 삽입',
            '코드 삽입',
            '경로 조작 및 자원 삽입',
            '크로스사이트 스크립트(XSS)',
            '운영체제 명령어 삽입',
            '위험한 형식 파일 업로드',
            '신뢰되지 않은 URL 주소로 자동접속 연결',
            '부적절한 XML 외부 개체 참조',
            'XML 삽입',
            'LDAP 삽입',
            '크로스사이트 요청 위조(CSRF)',
            '서버사이드 요청 위조',
            'HTTP 응답분할',
            '정수형 오버플로우',
            '보안기능 결정에 사용되는 부적절한 입력값',
            '메모리 버퍼 오버플로우',
            '포맷 스트링 삽입',
        ],
    },
    {
        title: '보안기능',
        topics: [
            '적절한 인증 없는 중요 기능 허용',
            '부적절한 인가',
            '중요한 자원에 대한 잘못된 권한 설정',
            '취약한 암호화 알고리즘 사용',
            '암호화되지 않은 중요정보',
            '하드코드된 중요정보',
            '충분하지 않은 키 길이 사용',
            '적절하지 않은 난수 값 사용',
            '취약한 패스워드 허용',
            '비밀번호 평문 전송',
            '패스워드 관리 부재',
            '부적절한 전자서명 확인',
            '부적절한 인증서 유효성 검증',
            '사용자 하드디스크에 저장되는 쿠키를 통한 정보 노출',
            '주석문 안에 포함된 시스템 주요정보',
            '솔트 없이 일방향 해시 함수 사용',
            '무결성 검사 없는 코드 다운로드',
            '반복된 인증시도 제한 기능 부재',
        ],
    },
    {
        title: '시간 및 상태',
        topics: ['경쟁조건: 검사시점과 사용시점(TOCTOU)', '종료되지 않는 반복문 또는 재귀 함수'],
    },
    {
        title: '에러처리',
        topics: ['오류 메시지 정보노출', '오류상황 대응 부재', '부적절한 예외 처리'],
    },
    {
        title: '코드오류',
        topics: [
            'Null Pointer 역참조',
            '부적절한 자원 해제',
            '해제된 자원 사용',
            '초기화되지 않은 변수 사용',
            '신뢰할 수 없는 데이터의 역직렬화',
        ],
    },
    {
        title: '캡슐화',
        topics: [
            '잘못된 세션에 의한 데이터 정보 노출',
            '제거되지 않고 남은 디버그 코드',
            'Public 메소드로부터 반환된 Private 배열',
            'Private 배열에 Public 데이터 할당',
        ],
    },
    {
        title: 'API 오용',
        topics: ['DNS lookup에 의존한 보안결정', '취약한 API 사용'],
    },
];

export const commonTopicGroups: PracticeTopicGroup[] = pythonTopicGroups.map((group) => ({
    title: group.title,
    topics: [...group.topics],
}));
