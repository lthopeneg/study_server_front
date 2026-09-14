import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import './LearningProgress.css';

type ProgressSummary = {
    total_problems: number;
    attempted_problems: number;
    completed_problems: number;
    total_topics: number;
    completed_topics: number;
    completion_rate: number;
    total_attempts: number;
};

type TopicStats = {
    name: string;
    total_problems: number;
    completed_problems: number;
    completed: boolean;
};

type LanguageProgress = {
    total_problems: number;
    attempted_problems: number;
    completed_problems: number;
    total_topics: number;
    completed_topics: number;
    completion_rate: number;
    major_topics: {
        name: string;
        total_topics: number;
        completed_topics: number;
        topics: TopicStats[];
    }[];
};

type LanguageStats = Record<string, LanguageProgress>;

type RecentAttempt = {
    id: number;
    problem_id: number | null;
    language: 'Python' | 'C#';
    major_topic: string;
    minor_topic: string;
    difficulty: string;
    correct: boolean;
    line_selection_correct: boolean;
    secure_blank_correct: boolean;
    attempted_at: string | null;
    problem_available: boolean;
};

type ProgressData = {
    summary: ProgressSummary;
    by_language: LanguageStats;
    recent_attempts: RecentAttempt[];
};

const difficultyLabels: Record<string, string> = {
    beginner: '초급', intermediate: '중급', advanced: '고급',
};

const LearningProgress = () => {
    const [data, setData] = useState<ProgressData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [reloadKey, setReloadKey] = useState(0);
    const [expandedLanguage, setExpandedLanguage] = useState<string | null>(null);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);

    useEffect(() => {
        const loadProgress = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await api.get('/api/user/learning-progress');
                setData(response.data.data);
            } catch {
                setError('학습 진도를 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        loadProgress();
    }, [reloadKey]);

    if (isLoading) return <div className="learning-progress-status">학습 진도를 불러오고 있습니다.</div>;
    if (error || !data) {
        return (
            <div className="learning-progress-status error">
                <p>{error}</p>
                <button type="button" onClick={() => setReloadKey((value) => value + 1)}>다시 시도</button>
            </div>
        );
    }

    return (
        <div className="learning-progress">
            <section className="progress-overview">
                <div className="progress-summary-grid">
                    <article><strong>{data.summary.completed_topics} / {data.summary.total_topics}</strong><span>완료한 보안 약점</span></article>
                    <article><strong>{data.summary.completed_problems}</strong><span>완료한 문제</span></article>
                    <article><strong>{data.summary.attempted_problems}</strong><span>도전한 문제</span></article>
                    <article><strong>{data.summary.total_attempts}</strong><span>전체 풀이 횟수</span></article>
                </div>
            </section>

            <section className="language-progress-section">
                <div className="progress-section-heading">
                    <div><h3>실습 진도</h3><p>언어를 선택해 보안 영역과 세부 보안 약점별 완료 상태를 확인합니다.</p></div>
                    <span>문제 풀이</span>
                </div>
                <div className="language-progress-grid">
                    {['Python', 'C#'].map((language) => {
                        const stats = data.by_language[language] ?? {
                            total_problems: 0, attempted_problems: 0, completed_problems: 0,
                            total_topics: 0, completed_topics: 0, completion_rate: 0, major_topics: [],
                        };
                        return (
                            <button
                                type="button"
                                key={language}
                                className={expandedLanguage === language ? 'active' : ''}
                                aria-expanded={expandedLanguage === language}
                                onClick={() => setExpandedLanguage((current) => current === language ? null : language)}
                            >
                                <div className="language-rate" style={{ '--progress': `${stats.completion_rate * 3.6}deg` } as React.CSSProperties}>
                                    <strong>{stats.completion_rate}%</strong>
                                </div>
                                <div className="language-card-copy">
                                    <strong>{language}</strong>
                                    <span>{stats.completed_topics} / {stats.total_topics}개 보안 약점 완료</span>
                                    <small>{stats.attempted_problems}개 문제 도전 · {stats.completed_problems}개 문제 완료</small>
                                </div>
                                <span aria-hidden="true">{expandedLanguage === language ? '▲' : '▼'}</span>
                            </button>
                        );
                    })}
                </div>
                {expandedLanguage && data.by_language[expandedLanguage] && (
                    <div className="topic-progress-panel">
                        {data.by_language[expandedLanguage].major_topics.map((major) => (
                            <section key={major.name}>
                                <header>
                                    <strong>{major.name}</strong>
                                    <span>{major.completed_topics} / {major.total_topics} 보안 약점</span>
                                </header>
                                <ul>
                                    {major.topics.map((topic) => (
                                        <li key={topic.name} className={topic.completed ? 'completed' : ''}>
                                            <span aria-hidden="true">{topic.completed ? '✓' : '○'}</span>
                                            <div><strong>{topic.name}</strong><small>{topic.completed_problems} / {topic.total_problems} 문제 완료</small></div>
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}
            </section>

            <section className="recent-attempt-section">
                <button type="button" className="history-toggle" aria-expanded={isHistoryOpen} onClick={() => setIsHistoryOpen((open) => !open)}>
                    <span><strong>최근 풀이 이력</strong><small>최근 제출 10건 · 한국시간 기준</small></span>
                    <span aria-hidden="true">{isHistoryOpen ? '▲' : '▼'}</span>
                </button>
                {isHistoryOpen && (data.recent_attempts.length === 0 ? (
                    <div className="progress-empty">
                        <p>아직 풀이 이력이 없습니다.</p>
                        <Link to="/practice/python">첫 문제 풀러 가기</Link>
                    </div>
                ) : (
                    <div className="recent-attempt-list">
                        {data.recent_attempts.map((attempt) => {
                            const content = (
                                <>
                                    <span className={`attempt-result ${attempt.correct ? 'correct' : 'wrong'}`}>
                                        {attempt.correct ? '완료' : '재도전 필요'}
                                    </span>
                                    <div>
                                        <strong>문제 #{attempt.problem_id ?? '삭제됨'} · {attempt.major_topic}</strong>
                                        <p>{attempt.minor_topic} · {difficultyLabels[attempt.difficulty] ?? attempt.difficulty}</p>
                                        <small>
                                            {attempt.language} · 1유형 {attempt.line_selection_correct ? '정답' : '오답'} · 2유형 {attempt.secure_blank_correct ? '정답' : '오답'}
                                        </small>
                                    </div>
                                    <time>{attempt.attempted_at ? new Date(attempt.attempted_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : ''}</time>
                                </>
                            );
                            return attempt.problem_available && attempt.problem_id ? (
                                <Link key={attempt.id} to={`/practice/${attempt.language === 'Python' ? 'python' : 'csharp'}/${attempt.problem_id}`}>{content}</Link>
                            ) : (
                                <article key={attempt.id} className="unavailable">{content}</article>
                            );
                        })}
                    </div>
                ))}
            </section>
        </div>
    );
};

export default LearningProgress;
