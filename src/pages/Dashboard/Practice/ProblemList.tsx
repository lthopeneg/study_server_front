import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { api } from '../../../services/api';
import { commonTopicGroups, pythonTopicGroups } from './practiceTopics';

type ProblemListProps = {
    language: 'Python' | 'C#';
};

type PublishedProblem = {
    id: number;
    language: string;
    major_topic: string;
    minor_topic: string;
    difficulty: string;
};

const difficultyLabels: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
};

const ProblemList = ({ language }: ProblemListProps) => {
    const topicGroups = language === 'Python' ? pythonTopicGroups : commonTopicGroups;
    const [majorTopic, setMajorTopic] = useState('');
    const [minorTopic, setMinorTopic] = useState('');
    const [problemNumber, setProblemNumber] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');
    const [appliedFilters, setAppliedFilters] = useState({ majorTopic: '', minorTopic: '', problemNumber: '' });
    const [problems, setProblems] = useState<PublishedProblem[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [loadError, setLoadError] = useState('');

    useEffect(() => {
        const fetchProblems = async () => {
            setIsLoading(true);
            setLoadError('');
            try {
                const response = await api.get('/api/practice/public/problems', { params: { language } });
                setProblems(response.data.data ?? []);
            } catch {
                setLoadError('문제 목록을 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProblems();
    }, [language]);

    const minorTopics = useMemo(
        () => topicGroups.find((group) => group.title === majorTopic)?.topics ?? [],
        [majorTopic, topicGroups],
    );

    const handleMajorTopicChange = (value: string) => {
        setMajorTopic(value);
        setMinorTopic('');
    };

    const handleSearch = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const conditions = [majorTopic, minorTopic, problemNumber && `문제 ${problemNumber}번`].filter(Boolean);
        setAppliedSearch(conditions.length > 0 ? conditions.join(' · ') : '전체 문제');
        setAppliedFilters({ majorTopic, minorTopic, problemNumber });
    };

    const filteredProblems = problems.filter((problem) => {
        if (appliedFilters.majorTopic && problem.major_topic !== appliedFilters.majorTopic) return false;
        if (appliedFilters.minorTopic && problem.minor_topic !== appliedFilters.minorTopic) return false;
        if (appliedFilters.problemNumber && problem.id !== Number(appliedFilters.problemNumber)) return false;
        return true;
    });

    return (
        <div className="practice-page">
            <header className="practice-page-header">
                <div>
                    <span className="practice-eyebrow">문제 리스트</span>
                    <h1>{language}</h1>
                    <p>{language} 시큐어코딩 문제를 풀고 학습 내용을 점검합니다.</p>
                </div>
            </header>

            <form className="practice-filter" onSubmit={handleSearch}>
                <div className="practice-filter-heading">
                    <strong>문제 찾아보기</strong>
                    <span>주제나 문제 번호로 원하는 문제를 검색합니다.</span>
                </div>

                <div className="practice-filter-controls">
                    <label>
                        <span>대주제</span>
                        <select value={majorTopic} onChange={(event) => handleMajorTopicChange(event.target.value)}>
                            <option value="">전체</option>
                            {topicGroups.map((group) => (
                                <option key={group.title} value={group.title}>{group.title}</option>
                            ))}
                        </select>
                    </label>

                    <span className="practice-filter-divider" aria-hidden="true">-</span>

                    <label>
                        <span>소주제</span>
                        <select
                            value={minorTopic}
                            onChange={(event) => setMinorTopic(event.target.value)}
                            disabled={!majorTopic || minorTopics.length === 0}
                        >
                            <option value="">
                                {language === 'C#' ? 'C# 분류 준비 중' : majorTopic ? '전체' : '대주제를 먼저 선택하세요'}
                            </option>
                            {minorTopics.map((topic) => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                        </select>
                    </label>

                    <span className="practice-filter-divider" aria-hidden="true">-</span>

                    <label className="practice-number-field">
                        <span>문제 번호</span>
                        <input
                            type="number"
                            min="1"
                            inputMode="numeric"
                            placeholder="번호 입력"
                            value={problemNumber}
                            onChange={(event) => setProblemNumber(event.target.value)}
                        />
                    </label>

                    <button type="submit">검색</button>
                </div>
            </form>

            {isLoading ? (
                <div className="practice-status">문제 목록을 불러오고 있습니다.</div>
            ) : loadError ? (
                <div className="practice-status practice-status-denied">{loadError}</div>
            ) : filteredProblems.length > 0 ? (
                <div className="published-problem-list">
                    {filteredProblems.map((problem) => (
                        <article key={problem.id}>
                            <span>문제 #{problem.id}</span>
                            <h2>문제 #{problem.id}</h2>
                            <p>{problem.major_topic} · {problem.minor_topic}</p>
                            <small>{difficultyLabels[problem.difficulty] ?? problem.difficulty}</small>
                        </article>
                    ))}
                </div>
            ) : (
                <div className="practice-empty-state">
                    <span className="practice-language-mark">{language === 'Python' ? 'PY' : 'C#'}</span>
                    <h2>등록된 문제가 없습니다</h2>
                    <p>
                        {appliedSearch
                            ? `${appliedSearch} 조건에 맞는 공개 문제가 없습니다.`
                            : '관리자가 공개한 문제가 이곳에 표시됩니다.'}
                    </p>
                </div>
            )}
        </div>
    );
};

export default ProblemList;
