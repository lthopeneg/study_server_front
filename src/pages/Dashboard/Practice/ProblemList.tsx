import { type FormEvent, useMemo, useState } from 'react';
import { commonTopicGroups, pythonTopicGroups } from './practiceTopics';

type ProblemListProps = {
    language: 'Python' | 'C#';
};

const ProblemList = ({ language }: ProblemListProps) => {
    const topicGroups = language === 'Python' ? pythonTopicGroups : commonTopicGroups;
    const [majorTopic, setMajorTopic] = useState('');
    const [minorTopic, setMinorTopic] = useState('');
    const [problemNumber, setProblemNumber] = useState('');
    const [appliedSearch, setAppliedSearch] = useState('');

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
    };

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
                            <option value="">전체 대주제</option>
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
                                {language === 'C#' ? 'C# 분류 준비 중' : majorTopic ? '전체 소주제' : '대주제를 먼저 선택하세요'}
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

            <div className="practice-empty-state">
                <span className="practice-language-mark">{language === 'Python' ? 'PY' : 'C#'}</span>
                <h2>등록된 문제가 없습니다</h2>
                <p>
                    {appliedSearch
                        ? `${appliedSearch} 조건에 맞는 문제가 이곳에 표시됩니다.`
                        : '문제가 등록되면 난이도와 출제 범위별로 이곳에 표시됩니다.'}
                </p>
            </div>
        </div>
    );
};

export default ProblemList;
