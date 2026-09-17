import axios from 'axios';

type ResearchSubject = '목록' | '노트' | '자료';

export const researchErrorMessage = (error: unknown, subject: ResearchSubject): string => {
  const subjectWithObjectParticle = subject === '목록' ? '목록을' : `${subject}를`;
  if (!axios.isAxiosError(error)) return `${subjectWithObjectParticle} 불러오지 못했습니다. 다시 시도해 주세요.`;
  if (!error.response) return '서버에 연결할 수 없습니다. 네트워크 연결을 확인한 뒤 다시 시도해 주세요.';

  const { status, data } = error.response;
  const code = typeof data === 'object' && data !== null && 'code' in data ? data.code : undefined;
  if (status === 401) return '로그인이 필요합니다. 다시 로그인해 주세요.';
  if (status === 403) return '관리자 권한이 없어 연구 자료를 볼 수 없습니다.';
  if (code === 'NOTES_DIRECTORY_UNAVAILABLE') return '서버에서 연구 노트 폴더를 사용할 수 없습니다. 서버 설정을 확인해 주세요.';
  if (code === 'NOTE_NOT_FOUND') return '선택한 연구 노트 파일이 서버에 없습니다. 목록을 새로고침해 주세요.';
  if (code === 'RESOURCE_FILE_MISSING') return '이 연구 자료 파일이 서버에 없습니다. 연구 자료 배포 상태를 확인해 주세요.';
  if (code === 'RESOURCE_NOT_FOUND') return '요청한 연구 자료가 서버의 허용 목록에 없습니다.';
  if (code === 'NOTE_TOO_LARGE' || code === 'RESOURCE_TOO_LARGE') return '파일이 서버의 크기 제한을 초과해 표시할 수 없습니다.';
  if (status === 404) return '요청한 API 경로가 서버에 없습니다. 프론트·백엔드 배포 버전을 확인해 주세요.';
  if (status >= 500) return '서버에서 자료를 읽는 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.';
  return `${subjectWithObjectParticle} 불러오지 못했습니다. 다시 시도해 주세요.`;
};
