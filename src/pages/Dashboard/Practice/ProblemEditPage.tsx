import { useEffect, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router-dom';
import { api } from '../../../services/api';
import type { PracticeOutletContext } from './PracticeLayout';
import ProblemFileEditor, { type GeneratedVariant } from './ProblemFileEditor';

type EditableProblem = {
    id: number;
    language: 'Python' | 'C#';
    major_topic: string;
    minor_topic: string;
    difficulty: string;
    scenario: string;
    creation_method: 'manual' | 'ai';
    status: 'draft' | 'published';
    variants: GeneratedVariant[];
};

const ProblemEditPage = () => {
    const { problemId } = useParams();
    const navigate = useNavigate();
    const { isAdmin, isRoleLoading } = useOutletContext<PracticeOutletContext>();
    const [problem, setProblem] = useState<EditableProblem | null>(null);
    const [language, setLanguage] = useState<'Python' | 'C#'>('Python');
    const [majorTopic, setMajorTopic] = useState('');
    const [minorTopic, setMinorTopic] = useState('');
    const [difficulty, setDifficulty] = useState('beginner');
    const [scenario, setScenario] = useState('');
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        if (isRoleLoading || !isAdmin) return;
        const fetchProblem = async () => {
            setIsLoading(true);
            try {
                const response = await api.get(`/api/practice/problems/${problemId}`);
                const detail = response.data.data as EditableProblem;
                setProblem(detail);
                setLanguage(detail.language);
                setMajorTopic(detail.major_topic);
                setMinorTopic(detail.minor_topic);
                setDifficulty(detail.difficulty);
                setScenario(detail.scenario);
            } catch (error: unknown) {
                const responseMessage = typeof error === 'object' && error !== null && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
                setMessage(responseMessage ?? '문제 세트를 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProblem();
    }, [isAdmin, isRoleLoading, problemId]);

    const downloadProblem = async () => {
        if (!problem) return;
        setIsDownloading(true);
        setMessage('');
        try {
            const response = await api.get(`/api/practice/problems/${problem.id}/download`, { responseType: 'blob' });
            const url = URL.createObjectURL(response.data);
            const anchor = document.createElement('a');
            anchor.href = url;
            anchor.download = `practice_problem_${problem.id}.zip`;
            document.body.appendChild(anchor);
            anchor.click();
            anchor.remove();
            URL.revokeObjectURL(url);
        } catch {
            setMessage('문제 ZIP 파일을 다운로드하지 못했습니다.');
        } finally {
            setIsDownloading(false);
        }
    };

    if (isRoleLoading) return <div className="practice-status">관리자 권한을 확인하고 있습니다.</div>;
    if (!isAdmin) return <div className="practice-status practice-status-denied">문제 수정 권한이 없습니다.</div>;
    if (isLoading) return <div className="practice-status">문제 세트를 불러오고 있습니다.</div>;
    if (!problem) return <div className="practice-status practice-status-denied">{message || '문제를 찾을 수 없습니다.'}</div>;

    return (
        <div className="problem-create-form problem-edit-page">
            <section className="problem-create-section">
                <div className="problem-edit-heading">
                    <div className="problem-edit-heading-actions">
                        <button type="button" onClick={() => navigate('/practice/manage/edit')}>← 목록으로</button>
                        <button type="button" className="download" onClick={downloadProblem} disabled={isDownloading}>
                            {isDownloading ? '다운로드 중...' : '문제 다운로드'}
                        </button>
                    </div>
                    <div>
                        <span>문제 #{problem.id} · {problem.status === 'published' ? '활성' : '비활성'}</span>
                        <h1>문제 수정하기</h1>
                        <p>분류와 시나리오, 코드, 힌트 및 정답을 수정합니다.</p>
                    </div>
                </div>
                {message && <div className="problem-manager-message">{message}</div>}

                <div className="problem-create-grid problem-edit-metadata">
                    <label>
                        <span>언어</span>
                        <select value={language} onChange={(event) => setLanguage(event.target.value as 'Python' | 'C#')}>
                            <option value="Python">Python</option>
                            <option value="C#">C#</option>
                        </select>
                    </label>
                    <label>
                        <span>대주제</span>
                        <input value={majorTopic} maxLength={100} onChange={(event) => setMajorTopic(event.target.value)} />
                    </label>
                    <label>
                        <span>소주제</span>
                        <input value={minorTopic} maxLength={255} onChange={(event) => setMinorTopic(event.target.value)} />
                    </label>
                    <label>
                        <span>난이도</span>
                        <select value={difficulty} onChange={(event) => setDifficulty(event.target.value)}>
                            <option value="beginner">초급</option>
                            <option value="intermediate">중급</option>
                            <option value="advanced">고급</option>
                        </select>
                    </label>
                    <label className="wide">
                        <span>문제 시나리오</span>
                        <textarea rows={4} maxLength={20000} value={scenario} onChange={(event) => setScenario(event.target.value)} />
                    </label>
                </div>
            </section>

            <ProblemFileEditor
                key={problem.id}
                problemId={problem.id}
                language={language}
                majorTopic={majorTopic}
                minorTopic={minorTopic}
                difficulty={difficulty}
                scenario={scenario}
                creationMethod={problem.creation_method}
                initialVariants={problem.variants}
            />
        </div>
    );
};

export default ProblemEditPage;
