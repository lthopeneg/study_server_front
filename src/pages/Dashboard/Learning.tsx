import { useEffect, useMemo, useState } from 'react';
import foundationsCourseData from '../../data/foundationsCourse.json';
import LearningReader, { type LearningBookLesson, type LearningSection } from './LearningReader';
import './Learning.css';

type Lesson = { id: string; title: string; description: string; duration: string; completed: boolean; book?: LearningBookLesson; sections?: LearningSection[] };
type Course = { id: string; order: number; title: string; subtitle: string; itemCount: string; lessons: Lesson[] };

const foundationsCourse = foundationsCourseData as Omit<typeof foundationsCourseData, 'lessons'> & { lessons: LearningBookLesson[] };

const courses: Course[] = [
  {
    id: 'secure-coding-basics', order: 1, title: '시큐어코딩 기초 강의', subtitle: foundationsCourse.subtitle, itemCount: `${foundationsCourse.lessons.length}개 강의`,
    lessons: foundationsCourse.lessons.map((lesson) => ({ id: lesson.id, title: lesson.title, description: lesson.subtitle, duration: `${lesson.estimatedMinutes}분`, completed: false, book: lesson })),
  },
  {
    id: 'owasp-top-10', order: 2, title: 'OWASP Top 10:2025', subtitle: '주요 웹 애플리케이션 위험', itemCount: '10개 주제',
    lessons: [
      { id: 'owasp-a01', title: 'A01 접근 통제 실패', description: '사용자가 허용된 범위를 벗어난 기능과 데이터에 접근하는 위험을 알아봅니다.', duration: '26분', completed: false },
      { id: 'owasp-a02', title: 'A02 보안 설정 오류', description: '기본 설정과 불필요한 기능, 잘못된 보안 헤더가 만드는 공격 표면을 확인합니다.', duration: '22분', completed: false },
      { id: 'owasp-a03', title: 'A03 소프트웨어 공급망 실패', description: '외부 의존성과 빌드·배포 과정에서 발생할 수 있는 위험을 살펴봅니다.', duration: '25분', completed: false },
      { id: 'owasp-a04', title: 'A04 암호화 실패', description: '민감정보의 저장과 전송 과정에서 필요한 암호화 기준을 학습합니다.', duration: '24분', completed: false },
      { id: 'owasp-a05', title: 'A05 인젝션', description: 'SQL, 명령어, 템플릿 등 해석기에 전달되는 입력의 위험과 방어 원칙을 익힙니다.', duration: '32분', completed: false },
      { id: 'owasp-more', title: 'A06–A10 나머지 위험', description: '안전하지 않은 설계부터 예외 처리 실패까지 나머지 주요 위험을 순서대로 다룹니다.', duration: '5개 주제', completed: false },
    ],
  },
  {
    id: 'security-weaknesses', order: 3, title: '시큐어코딩 가이드 보안약점', subtitle: '가이드 기준 49개 항목', itemCount: '49개 보안약점',
    lessons: [
      { id: 'weakness-input', title: '입력 데이터 검증 및 표현', description: 'SQL 삽입, 경로 조작, 크로스사이트 스크립트 등 입력 데이터 관련 보안약점을 학습합니다.', duration: '분류 1', completed: false },
      { id: 'weakness-security-feature', title: '보안 기능', description: '인증, 접근 통제, 암호화와 중요정보 관리에 관련된 보안약점을 살펴봅니다.', duration: '분류 2', completed: false },
      { id: 'weakness-time-state', title: '시간 및 상태', description: '경쟁 조건과 세션 상태 등 실행 순서와 상태 관리에서 생기는 문제를 다룹니다.', duration: '분류 3', completed: false },
      { id: 'weakness-error', title: '에러 처리', description: '오류 메시지 노출과 부적절한 예외 처리로 발생하는 보안 문제를 확인합니다.', duration: '분류 4', completed: false },
      { id: 'weakness-code-quality', title: '코드 오류 및 캡슐화', description: '자원 관리와 코드 품질, 캡슐화 부족에서 발생하는 보안약점을 학습합니다.', duration: '분류 5·6', completed: false },
      { id: 'weakness-api', title: 'API 오용', description: '보안에 민감한 API를 잘못 사용하거나 계약을 위반하면서 생기는 위험을 다룹니다.', duration: '분류 7', completed: false },
    ],
  },
];

const allLessons = courses.flatMap((course) => course.lessons.map((lesson) => ({ ...lesson, course })));

const createPlaceholderSections = (lesson: Lesson): LearningSection[] => [
  { id: `${lesson.id}-preparing`, title: '교안 준비 중', kind: 'intro', markdown: `${lesson.description}\n\n이 과정의 교안은 아직 작성 중입니다. 검토가 끝난 콘텐츠만 순서대로 공개할 예정입니다.` },
];

const Learning = () => {
  const [expandedCourseId, setExpandedCourseId] = useState(courses[0].id);
  const [selectedLessonId, setSelectedLessonId] = useState(courses[0].lessons[0].id);
  const selected = useMemo(() => allLessons.find((item) => item.id === selectedLessonId) ?? allLessons[0], [selectedLessonId]);
  const selectedIndex = selected.course.lessons.findIndex((lesson) => lesson.id === selected.id);
  const completedCount = selected.course.lessons.filter((lesson) => lesson.completed).length;
  const progress = Math.round((completedCount / selected.course.lessons.length) * 100);

  useEffect(() => {
    document.body.classList.add('learning-classroom-open');
    return () => document.body.classList.remove('learning-classroom-open');
  }, []);

  const toggleCourse = (course: Course) => {
    const willExpand = expandedCourseId !== course.id;
    setExpandedCourseId(willExpand ? course.id : '');
    if (willExpand) setSelectedLessonId(course.lessons[0].id);
  };

  const moveLesson = (offset: number) => {
    const next = selected.course.lessons[selectedIndex + offset];
    if (next) setSelectedLessonId(next.id);
  };

  return (
    <div className="learning-classroom">
      <aside className="learning-sidebar" aria-label="학습 과정">
        <header className="learning-sidebar__heading">
          <span>SECURECODE CURRICULUM</span><h1>전체 학습 과정</h1><p>기초부터 보안약점까지 단계별로 학습합니다.</p>
        </header>

        <div className="learning-progress-card" aria-label={`${selected.course.title} 진행률 ${progress}%`}>
          <div><span>선택 과정 진행률</span><strong>{progress}%</strong></div>
          <div className="learning-progress-track" aria-hidden="true"><span style={{ width: `${progress}%` }} /></div>
          <small>진행 기록 연동 전 · {selected.course.itemCount}</small>
        </div>

        <nav className="learning-course-list" aria-label="과정 및 강의 목록">
          {courses.map((course) => {
            const expanded = expandedCourseId === course.id;
            return (
              <section className={`learning-course${expanded ? ' is-expanded' : ''}`} key={course.id}>
                <button className="learning-course__trigger" type="button" onClick={() => toggleCourse(course)} aria-expanded={expanded}>
                  <span className="learning-course__order">{String(course.order).padStart(2, '0')}</span>
                  <span className="learning-course__title"><strong>{course.title}</strong><small>{course.subtitle} · {course.itemCount}</small></span>
                  <span className="learning-course__chevron" aria-hidden="true">⌄</span>
                </button>
                {expanded && (
                  <div className="learning-course__lessons">
                    {course.lessons.map((lesson, index) => (
                      <button
                        className={`learning-lesson${lesson.id === selected.id ? ' is-active' : ''}${lesson.completed ? ' is-complete' : ''}`}
                        key={lesson.id} type="button" onClick={() => setSelectedLessonId(lesson.id)}
                        aria-current={lesson.id === selected.id ? 'step' : undefined}
                      >
                        <span>{lesson.completed ? '✓' : index + 1}</span><strong>{lesson.title}</strong><small>{lesson.duration}</small>
                      </button>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </nav>
      </aside>

      <main className="learning-stage">
        <header className="learning-stage__header">
          <div><span>{selected.course.title}</span><strong>{String(selectedIndex + 1).padStart(2, '0')} · {selected.title}</strong></div>
          <span className="learning-stage__duration">{selected.duration}</span>
        </header>
        <LearningReader key={selected.id} courseTitle={selected.course.title} scenarioMarkdown={selected.course.id === 'secure-coding-basics' ? foundationsCourse.scenarioMarkdown : undefined} lesson={selected.book ?? {
          id: selected.id,
          order: selectedIndex + 1,
          title: selected.title,
          subtitle: selected.description,
          estimatedMinutes: Number.parseInt(selected.duration, 10) || 20,
          accent: selected.course.order === 1 ? '#0284c7' : selected.course.order === 2 ? '#7c3aed' : '#0f766e',
          sections: selected.sections ?? createPlaceholderSections(selected),
        }} />
        <footer className="learning-stage__controls">
          <button type="button" disabled={selectedIndex === 0} onClick={() => moveLesson(-1)}>← 이전 강의</button>
          <div><strong>{selected.course.title}</strong><span>교안을 읽은 뒤 이전·다음 강의로 이동할 수 있습니다.</span></div>
          <button type="button" disabled={selectedIndex === selected.course.lessons.length - 1} onClick={() => moveLesson(1)}>다음 강의 →</button>
        </footer>
      </main>
    </div>
  );
};

export default Learning;
