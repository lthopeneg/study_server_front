import { useMemo, useRef, useState } from 'react';
import { commonTopicGroups, pythonTopicGroups } from './practiceTopics';
import ProblemFileEditor, { type GeneratedVariant } from './ProblemFileEditor';
import { api } from '../../../services/api';

type CreationMethod = 'manual' | 'ai';
type PracticeLanguage = 'Python' | 'C#';
type ProjectType = 'console' | 'aspnet_core_mvc' | 'aspnet_core_web_api' | 'aspnet_mvc5' | 'aspnet_web_api2';
type QualityReport = {
    status: 'passed' | 'warning';
    repair_attempted: boolean;
    checks: { key: string; label: string; status: 'passed' | 'warning'; message: string }[];
};

const CreateProblemForm = () => {
    const [method, setMethod] = useState<CreationMethod>('manual');
    const [language, setLanguage] = useState<PracticeLanguage>('Python');
    const [majorTopic, setMajorTopic] = useState('');
    const [minorTopic, setMinorTopic] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');

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
                                {majorTopic ? '선택' : '대주제를 먼저 선택하세요'}
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
                </div>
            </section>

            {method === 'manual' ? (
                <ProblemFileEditor
                    key={language}
                    language={language}
                    runtimePlatform={language === 'C#' ? 'dotnet_framework' : null}
                    projectType={null}
                    majorTopic={majorTopic}
                    minorTopic={minorTopic}
                    difficulty={difficulty}
                />
            ) : (
                <AiCreationFields
                    key={`ai-${language}`}
                    language={language}
                    majorTopic={majorTopic}
                    minorTopic={minorTopic}
                    difficulty={difficulty}
                />
            )}
        </div>
    );
};

const AiCreationFields = ({ language, majorTopic, minorTopic, difficulty }: {
    language: PracticeLanguage;
    majorTopic: string;
    minorTopic: string;
    difficulty: string;
}) => {
    const [minimumFiles, setMinimumFiles] = useState(3);
    const [targetBlankCount, setTargetBlankCount] = useState(3);
    const [referenceScope, setReferenceScope] = useState<'latest' | 'all'>('latest');
    const [model, setModel] = useState<'gpt-5.6-luna' | 'gpt-5.6-terra' | 'gpt-5.6-sol'>('gpt-5.6-luna');
    const [scenario, setScenario] = useState('');
    const [extraRequest, setExtraRequest] = useState('');
    const [generatedVariants, setGeneratedVariants] = useState<GeneratedVariant[] | null>(null);
    const [resolvedProjectType, setResolvedProjectType] = useState<ProjectType | null>(null);
    const [qualityReport, setQualityReport] = useState<QualityReport | null>(null);
    const [generationKey, setGenerationKey] = useState(0);
    const [message, setMessage] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isGeneratedModalOpen, setIsGeneratedModalOpen] = useState(false);
    const generatedPreviewRef = useRef<HTMLDivElement | null>(null);

    const showGeneratedPreview = () => {
        setIsGeneratedModalOpen(false);
        requestAnimationFrame(() => generatedPreviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    };

    const generateProblem = async () => {
        if (!majorTopic || !minorTopic) {
            setMessage('대주제와 소주제를 선택해주세요.');
            return;
        }
        setMessage('');
        setIsGenerating(true);
        try {
            const response = await api.post('/api/practice/problems/generate', {
                language,
                runtime_platform: language === 'C#' ? 'dotnet_framework' : null,
                project_type: language === 'C#' ? 'auto' : null,
                major_topic: majorTopic,
                minor_topic: minorTopic,
                difficulty,
                minimum_files: minimumFiles,
                target_blank_count: targetBlankCount,
                reference_scope: referenceScope,
                model,
                scenario,
                extra_request: extraRequest,
            });
            setGeneratedVariants(response.data.data.variants);
            setResolvedProjectType(response.data.data.project_type ?? null);
            setQualityReport(response.data.data.quality_report ?? null);
            setGenerationKey((current) => current + 1);
            setIsGeneratedModalOpen(true);
            const warnings = response.data.data.warnings as string[] | undefined;
            setMessage(warnings?.length
                ? `AI 초안이 생성되었습니다. ${warnings.join(' ')}`
                : 'AI 초안이 생성되었습니다. 내용을 검토하고 수정한 뒤 저장해주세요.');
        } catch (error: unknown) {
            const responseMessage = typeof error === 'object' && error !== null && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            setMessage(responseMessage ?? 'AI 문제를 생성하지 못했습니다.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <>
        <section className="problem-create-section">
        <div className="problem-create-section-heading">
            <span>3</span>
            <div>
                <h2>AI 생성 설정</h2>
                <p>선택한 범위를 바탕으로 두 문제 유형의 초안을 한 쌍으로 생성합니다.</p>
            </div>
        </div>

        <div className="problem-create-grid ai-settings">
            {language === 'C#' && (
                <div className="wide ai-runtime-summary">
                    <strong>생성 환경</strong>
                    <span>C# · .NET Framework · MVC 5/Web API 2 자동 선택</span>
                </div>
            )}
            <label>
                <span>유형별 최소 파일 수</span>
                <input
                    type="number"
                    min="1"
                    max="20"
                    value={minimumFiles}
                    onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        if (Number.isInteger(nextValue)) setMinimumFiles(nextValue);
                    }}
                    onBlur={() => setMinimumFiles((current) => Math.min(20, Math.max(1, current)))}
                />
                <small>
                    1유형과 2유형에 각각 최소 {minimumFiles}개 파일을 생성합니다.
                </small>
            </label>
            <label>
                <span>연구노트 범위</span>
                <select value={referenceScope} onChange={(event) => setReferenceScope(event.target.value as 'latest' | 'all')}>
                    <option value="latest">최신 연구노트</option>
                    <option value="all">관련 연구노트 전체</option>
                </select>
            </label>
            <label>
                <span>2유형 목표 빈칸 수</span>
                <input
                    type="number"
                    min="1"
                    max="20"
                    value={targetBlankCount}
                    onChange={(event) => {
                        const nextValue = Number(event.target.value);
                        if (Number.isInteger(nextValue)) setTargetBlankCount(nextValue);
                    }}
                    onBlur={() => setTargetBlankCount((current) => Math.min(20, Math.max(1, current)))}
                />
                <small>
                    의미 있는 빈칸 {targetBlankCount}개를 목표로 하며, 억지로 만들기 어려우면 더 적게 생성될 수 있습니다.
                </small>
            </label>
            <label>
                <span>LLM 모델</span>
                <select
                    value={model}
                    onChange={(event) => setModel(event.target.value as typeof model)}
                >
                    <option value="gpt-5.6-luna">GPT-5.6 Luna · 기본/빠른 처리</option>
                    <option value="gpt-5.6-terra">GPT-5.6 Terra · 균형형</option>
                    <option value="gpt-5.6-sol">GPT-5.6 Sol · 품질 우선</option>
                </select>
            </label>
            <label className="wide ai-prompt-field">
                <span>문제 시나리오</span>
                <textarea value={scenario} onChange={(event) => setScenario(event.target.value)} maxLength={5000} rows={5} placeholder="AI가 문제에 사용할 서비스 상황과 기능을 입력하세요" />
            </label>
            <label className="wide ai-prompt-field">
                <span>추가 요청사항</span>
                <textarea value={extraRequest} onChange={(event) => setExtraRequest(event.target.value)} maxLength={5000} rows={5} placeholder="문제에 반영할 조건이 있으면 입력하세요" />
            </label>
        </div>

        <div className="ai-generation-notice">
            <div>
                <strong>생성 결과는 바로 공개되지 않습니다.</strong>
                <span>AI가 만든 두 유형을 미리보기에서 검토하고 수정한 뒤 등록합니다.</span>
            </div>
            <div>
                <strong>API 사용량</strong>
                <span>기본 생성 1회가 사용되며, 품질 검사 실패 시 자동 수정을 위해 API 요청이 1회 추가될 수 있습니다.</span>
            </div>
        </div>

        <div className="problem-create-actions">
            {message && <span className="problem-save-message">{message}</span>}
            <button type="button" className="primary" onClick={generateProblem} disabled={isGenerating}>
                {isGenerating ? 'AI 생성 중...' : 'AI 문제 세트 생성'}
            </button>
        </div>
        </section>
        {isGeneratedModalOpen && (
            <div className="practice-modal-backdrop" role="presentation" onMouseDown={() => setIsGeneratedModalOpen(false)}>
                <section
                    className="practice-confirm-modal generated"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby="generated-problem-modal-title"
                    onMouseDown={(event) => event.stopPropagation()}
                >
                    <span className="practice-confirm-modal-icon" aria-hidden="true">✓</span>
                    <h2 id="generated-problem-modal-title">문제 생성이 완료되었습니다</h2>
                    <p>생성된 두 문제 유형의 코드, 힌트와 정답을 확인한 뒤 저장해주세요.</p>
                    <div className="practice-confirm-modal-actions">
                        <button type="button" className="secondary" onClick={() => setIsGeneratedModalOpen(false)}>닫기</button>
                        <button type="button" className="primary" autoFocus onClick={showGeneratedPreview}>문제 확인하기</button>
                    </div>
                </section>
            </div>
        )}
        {generatedVariants && (
            <div ref={generatedPreviewRef}>
                {qualityReport && (
                    <section className={`problem-quality-report ${qualityReport.status}`}>
                        <div className="problem-quality-report-heading">
                            <div>
                                <strong>AI 문제 품질 검사</strong>
                                <span>{qualityReport.repair_attempted
                                    ? '초기 문제를 자동 수정한 뒤 다시 검사했습니다.'
                                    : '생성된 문제를 서버 규칙으로 검사했습니다.'}</span>
                            </div>
                            <em>{qualityReport.status === 'passed' ? '통과' : '검토 필요'}</em>
                        </div>
                        <ul>
                            {qualityReport.checks.map((check) => (
                                <li key={check.key} className={check.status}>
                                    <span>{check.status === 'passed' ? '✓' : '!'}</span>
                                    <div>
                                        <strong>{check.label}</strong>
                                        <small>{check.message}</small>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </section>
                )}
                <ProblemFileEditor
                    key={`ai-${generationKey}`}
                    language={language}
                    runtimePlatform={language === 'C#' ? 'dotnet_framework' : null}
                    projectType={resolvedProjectType}
                    majorTopic={majorTopic}
                    minorTopic={minorTopic}
                    difficulty={difficulty}
                    initialVariants={generatedVariants}
                    creationMethod="ai"
                    scenario={scenario}
                />
            </div>
        )}
        </>
    );
};

export default CreateProblemForm;
