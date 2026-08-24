import { useMemo, useState } from 'react';
import { commonTopicGroups, pythonTopicGroups } from './practiceTopics';
import ProblemFileEditor from './ProblemFileEditor';

type CreationMethod = 'manual' | 'ai';
type PracticeLanguage = 'Python' | 'C#';

const CreateProblemForm = () => {
    const [method, setMethod] = useState<CreationMethod>('manual');
    const [language, setLanguage] = useState<PracticeLanguage>('Python');
    const [majorTopic, setMajorTopic] = useState('');
    const [minorTopic, setMinorTopic] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');
    const [title, setTitle] = useState('');
    const [scenario, setScenario] = useState('');

    const topicGroups = language === 'Python' ? pythonTopicGroups : commonTopicGroups;
    const minorTopics = useMemo(
        () => topicGroups.find((group) => group.title === majorTopic)?.topics ?? [],
        [majorTopic, topicGroups],
    );

    const changeLanguage = (value: PracticeLanguage) => {
        setLanguage(value);
        setMajorTopic('');
        setMinorTopic('');
    };

    const changeMajorTopic = (value: string) => {
        setMajorTopic(value);
        setMinorTopic('');
    };

    return (
        <div className="problem-create-form">
            <section className="problem-create-section">
                <div className="problem-create-section-heading">
                    <span>1</span>
                    <div>
                        <h2>출제 방식</h2>
                        <p>한 문제 세트에는 두 가지 문제 유형이 함께 포함됩니다.</p>
                    </div>
                </div>

                <div className="creation-method-toggle" role="group" aria-label="출제 방식 선택">
                    <button
                        type="button"
                        className={method === 'manual' ? 'active' : ''}
                        onClick={() => setMethod('manual')}
                    >
                        <strong>직접 출제하기</strong>
                        <span>문제와 정답을 관리자가 직접 작성합니다.</span>
                    </button>
                    <button
                        type="button"
                        className={method === 'ai' ? 'active' : ''}
                        onClick={() => setMethod('ai')}
                    >
                        <strong>AI로 출제하기</strong>
                        <span>연구노트를 바탕으로 문제 초안을 생성합니다.</span>
                    </button>
                </div>
            </section>

            <section className="problem-create-section">
                <div className="problem-create-section-heading">
                    <span>2</span>
                    <div>
                        <h2>출제 기준</h2>
                        <p>언어와 보안약점 분류, 난이도를 지정합니다.</p>
                    </div>
                </div>

                <div className="problem-create-grid">
                    <label>
                        <span>언어</span>
                        <select value={language} onChange={(event) => changeLanguage(event.target.value as PracticeLanguage)}>
                            <option value="Python">Python</option>
                            <option value="C#">C#</option>
                        </select>
                    </label>
                    <label>
                        <span>대주제</span>
                        <select value={majorTopic} onChange={(event) => changeMajorTopic(event.target.value)}>
                            <option value="">선택</option>
                            {topicGroups.map((group) => (
                                <option key={group.title} value={group.title}>{group.title}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>소주제</span>
                        <select
                            value={minorTopic}
                            onChange={(event) => setMinorTopic(event.target.value)}
                            disabled={!majorTopic || minorTopics.length === 0}
                        >
                            <option value="">
                                {language === 'C#' ? 'C# 분류 준비 중' : majorTopic ? '선택' : '대주제를 먼저 선택하세요'}
                            </option>
                            {minorTopics.map((topic) => (
                                <option key={topic} value={topic}>{topic}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        <span>난이도</span>
                        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                            <option value="beginner">초급</option>
                            <option value="intermediate">중급</option>
                            <option value="advanced">고급</option>
                        </select>
                    </label>
                    <label>
                        <span>문제 세트 수</span>
                        <input type="number" min="1" max="10" defaultValue="1" />
                    </label>
                </div>
            </section>

            {method === 'manual' ? (
                <>
                    <section className="problem-create-section problem-shared-fields">
                        <div className="problem-create-stack">
                            <label>
                                <span>문제 제목</span>
                                <input value={title} onChange={(event) => setTitle(event.target.value)} type="text" placeholder="문제를 구분할 제목을 입력하세요" />
                            </label>
                            <label>
                                <span>문제 설명 및 시나리오</span>
                                <textarea value={scenario} onChange={(event) => setScenario(event.target.value)} rows={4} placeholder="두 문제 유형이 함께 사용할 상황과 요구사항을 입력하세요" />
                            </label>
                        </div>
                    </section>
                    <ProblemFileEditor
                        key={language}
                        language={language}
                        title={title}
                        scenario={scenario}
                        majorTopic={majorTopic}
                        minorTopic={minorTopic}
                        difficulty={difficulty}
                    />
                </>
            ) : <AiCreationFields />}
        </div>
    );
};

const AiCreationFields = () => (
    <section className="problem-create-section">
        <div className="problem-create-section-heading">
            <span>3</span>
            <div>
                <h2>AI 생성 설정</h2>
                <p>선택한 범위를 바탕으로 두 문제 유형의 초안을 한 쌍으로 생성합니다.</p>
            </div>
        </div>

        <div className="problem-create-grid ai-settings">
            <label>
                <span>연구노트 범위</span>
                <select defaultValue="latest">
                    <option value="latest">최신 연구노트</option>
                    <option value="select">직접 선택</option>
                    <option value="all">전체 연구노트</option>
                </select>
            </label>
            <label className="wide">
                <span>추가 요청사항</span>
                <textarea rows={4} placeholder="문제에 반영할 조건이 있으면 입력하세요" />
            </label>
        </div>

        <div className="ai-generation-notice">
            <div>
                <strong>생성 결과는 바로 공개되지 않습니다.</strong>
                <span>AI가 만든 두 유형을 미리보기에서 검토하고 수정한 뒤 등록합니다.</span>
            </div>
            <div>
                <strong>예상 API 비용</strong>
                <span>모델과 연구노트 범위를 연결하면 생성 전에 계산됩니다.</span>
            </div>
        </div>

        <div className="problem-create-actions">
            <button type="button" className="primary">AI 문제 세트 생성</button>
        </div>
    </section>
);

export default CreateProblemForm;
