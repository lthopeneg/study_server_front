import { useEffect, useState } from 'react';
import { api } from '../../../services/api';

type ProblemSummary = {
    id: number;
    language: string;
    major_topic: string;
    minor_topic: string;
    difficulty: string;
    creation_method: string;
    status: 'draft' | 'published';
    created_at: string | null;
};

const difficultyLabels: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
};

const ProblemVisibilityManager = () => {
    const [problems, setProblems] = useState<ProblemSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [changingId, setChangingId] = useState<number | null>(null);
    const [message, setMessage] = useState('');

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const response = await api.get('/api/practice/problems');
                setProblems(response.data.data ?? []);
            } catch {
                setMessage('저장된 문제 목록을 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProblems();
    }, []);

    const changeStatus = async (problem: ProblemSummary, published: boolean) => {
        const nextStatus = published ? 'published' : 'draft';
        setChangingId(problem.id);
        setMessage('');
        try {
            const response = await api.patch(`/api/practice/problems/${problem.id}/status`, { status: nextStatus });
            setProblems((current) => current.map((item) => item.id === problem.id ? response.data.data : item));
        } catch {
            setMessage('활성 상태를 변경하지 못했습니다.');
        } finally {
            setChangingId(null);
        }
    };

    if (isLoading) return <div className="practice-status">저장된 문제를 불러오고 있습니다.</div>;

    return (
        <div className="problem-visibility-manager">
            <div className="problem-manager-guide">
                <div>
                    <strong>문제 활성 관리</strong>
                    <span>스위치를 켜면 문제 목록에 표시되고, 끄면 비활성 상태로 전환됩니다.</span>
                </div>
                <span>{problems.length}개 문제 세트</span>
            </div>

            {message && <div className="problem-manager-message">{message}</div>}

            {problems.length === 0 ? (
                <div className="practice-empty-state compact">
                    <h2>저장된 문제가 없습니다</h2>
                    <p>문제 출제하기에서 문제 세트를 먼저 저장해주세요.</p>
                </div>
            ) : (
                <div className="problem-manager-table-wrap">
                    <table className="problem-manager-table">
                        <thead>
                            <tr>
                                <th>문제 번호</th>
                                <th>언어</th>
                                <th>대주제</th>
                                <th>소주제</th>
                                <th>난이도</th>
                                <th>상태</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((problem) => {
                                const isPublished = problem.status === 'published';
                                return (
                                    <tr key={problem.id}>
                                        <td>#{problem.id}</td>
                                        <td>{problem.language}</td>
                                        <td>{problem.major_topic}</td>
                                        <td>{problem.minor_topic}</td>
                                        <td>{difficultyLabels[problem.difficulty] ?? problem.difficulty}</td>
                                        <td>
                                            <div className="problem-manager-status">
                                                <span className={isPublished ? 'published' : 'draft'}>{isPublished ? '활성' : '비활성'}</span>
                                                <label className="visibility-switch">
                                                    <input
                                                        type="checkbox"
                                                        checked={isPublished}
                                                        disabled={changingId === problem.id}
                                                        onChange={(event) => changeStatus(problem, event.target.checked)}
                                                        aria-label={`문제 ${problem.id} 활성 상태`}
                                                    />
                                                    <span aria-hidden="true" />
                                                </label>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default ProblemVisibilityManager;
