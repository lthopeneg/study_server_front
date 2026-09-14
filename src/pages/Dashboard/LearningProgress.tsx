import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import './LearningProgress.css';

type ProgressSummary = {
    total_problems: number;
    attempted_problems: number;
    completed_problems: number;
    completion_rate: number;
    total_attempts: number;
};

type LanguageStats = Record<string, { total: number; attempted: number; completed: number }>;

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
                <div className="progress-ring" style={{ '--progress': `${data.summary.completion_rate * 3.6}deg` } as React.CSSProperties}>
                    <strong>{data.summary.completion_rate}%</strong>
                    <span>전체 완료율</span>
                </div>
                <div className="progress-summary-grid">
                    <article><strong>{data.summary.completed_problems}</strong><span>완료한 문제</span></article>
                    <article><strong>{data.summary.attempted_problems}</strong><span>도전한 문제</span></article>
                    <article><strong>{data.summary.total_problems}</strong><span>공개 문제</span></article>
                    <article><strong>{data.summary.total_attempts}</strong><span>전체 풀이 횟수</span></article>
                </div>
            </section>

            <section className="language-progress-section">
                <h3>언어별 진도</h3>
                <div className="language-progress-grid">
                    {['Python', 'C#'].map((language) => {
                        const stats = data.by_language[language] ?? { total: 0, attempted: 0, completed: 0 };
                        const rate = stats.total ? Math.round(stats.completed * 100 / stats.total) : 0;
                        return (
                            <article key={language}>
                                <div><strong>{language}</strong><span>{stats.completed} / {stats.total} 완료</span></div>
                                <div className="progress-bar"><span style={{ width: `${rate}%` }} /></div>
                                <small>{stats.attempted}개 문제 도전 · {rate}% 완료</small>
                            </article>
                        );
                    })}
                </div>
            </section>

            <section className="recent-attempt-section">
                <h3>최근 풀이 이력</h3>
                {data.recent_attempts.length === 0 ? (
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
                                    <time>{attempt.attempted_at ? new Date(attempt.attempted_at).toLocaleString('ko-KR') : ''}</time>
                                </>
                            );
                            return attempt.problem_available && attempt.problem_id ? (
                                <Link key={attempt.id} to={`/practice/${attempt.language === 'Python' ? 'python' : 'csharp'}/${attempt.problem_id}`}>{content}</Link>
                            ) : (
                                <article key={attempt.id} className="unavailable">{content}</article>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};

export default LearningProgress;
