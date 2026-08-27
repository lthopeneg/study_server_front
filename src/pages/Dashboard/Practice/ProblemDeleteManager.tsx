import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../services/api';

type ProblemSummary = {
    id: number;
    language: string;
    runtime_platform: 'dotnet' | 'dotnet_framework' | null;
    project_type: string | null;
    major_topic: string;
    minor_topic: string;
    difficulty: string;
    status: 'draft' | 'published';
};

const difficultyLabels: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
};

const projectTypeLabels: Record<string, string> = {
    console: 'Console',
    aspnet_core_mvc: 'ASP.NET Core MVC',
    aspnet_core_web_api: 'ASP.NET Core Web API',
    aspnet_mvc5: 'ASP.NET MVC 5',
    aspnet_web_api2: 'ASP.NET Web API 2',
};

const ProblemDeleteManager = () => {
    const [problems, setProblems] = useState<ProblemSummary[]>([]);
    const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [deletingIds, setDeletingIds] = useState<Set<number>>(() => new Set());
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

    const allSelected = problems.length > 0 && problems.every((problem) => selectedIds.has(problem.id));
    const selectedProblems = useMemo(
        () => problems.filter((problem) => selectedIds.has(problem.id)),
        [problems, selectedIds],
    );

    const removeDeleted = (deletedIds: number[]) => {
        const deleted = new Set(deletedIds);
        setProblems((current) => current.filter((problem) => !deleted.has(problem.id)));
        setSelectedIds((current) => new Set([...current].filter((id) => !deleted.has(id))));
    };

    const deleteOne = async (problem: ProblemSummary) => {
        if (!window.confirm(`문제 #${problem.id}을(를) 삭제하시겠습니까? 삭제한 문제는 복구할 수 없습니다.`)) return;
        setDeletingIds(new Set([problem.id]));
        setMessage('');
        try {
            await api.delete(`/api/practice/problems/${problem.id}`);
            removeDeleted([problem.id]);
            setMessage(`문제 #${problem.id}을(를) 삭제했습니다.`);
        } catch {
            setMessage(`문제 #${problem.id}을(를) 삭제하지 못했습니다.`);
        } finally {
            setDeletingIds(new Set());
        }
    };

    const deleteSelected = async () => {
        const ids = selectedProblems.map((problem) => problem.id);
        if (!ids.length) return;
        if (!window.confirm(`선택한 문제 ${ids.length}개를 모두 삭제하시겠습니까? 삭제한 문제는 복구할 수 없습니다.`)) return;
        setDeletingIds(new Set(ids));
        setMessage('');
        try {
            const response = await api.post('/api/practice/problems/delete-batch', { problem_ids: ids });
            removeDeleted(response.data.data.deleted_ids);
            setMessage(`문제 ${ids.length}개를 삭제했습니다.`);
        } catch {
            setMessage('선택한 문제를 일괄 삭제하지 못했습니다. 목록을 새로고침한 뒤 다시 시도해주세요.');
        } finally {
            setDeletingIds(new Set());
        }
    };

    if (isLoading) return <div className="practice-status">저장된 문제를 불러오고 있습니다.</div>;

    return (
        <div className="problem-visibility-manager problem-delete-manager">
            <div className="problem-manager-guide">
                <div>
                    <strong>문제 삭제 관리</strong>
                    <span>개별 삭제하거나 체크박스로 여러 문제를 선택해 한 번에 삭제할 수 있습니다.</span>
                </div>
                <span>{problems.length}개 문제 세트</span>
            </div>

            <div className="problem-delete-toolbar">
                <span>{selectedIds.size}개 선택됨</span>
                <button type="button" disabled={!selectedIds.size || deletingIds.size > 0} onClick={deleteSelected}>
                    선택 문제 삭제
                </button>
            </div>

            {message && <div className="problem-manager-message">{message}</div>}

            {problems.length === 0 ? (
                <div className="practice-empty-state compact">
                    <h2>삭제할 문제가 없습니다</h2>
                    <p>현재 저장된 문제 세트가 없습니다.</p>
                </div>
            ) : (
                <div className="problem-manager-table-wrap">
                    <table className="problem-manager-table">
                        <thead>
                            <tr>
                                <th className="problem-delete-check-cell">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={(event) => setSelectedIds(event.target.checked
                                            ? new Set(problems.map((problem) => problem.id))
                                            : new Set())}
                                        aria-label="전체 문제 선택"
                                    />
                                </th>
                                <th>문제 번호</th>
                                <th>언어</th>
                                <th>실행 환경</th>
                                <th>대주제</th>
                                <th>소주제</th>
                                <th>난이도</th>
                                <th>상태</th>
                                <th>삭제</th>
                            </tr>
                        </thead>
                        <tbody>
                            {problems.map((problem) => {
                                const isDeleting = deletingIds.has(problem.id);
                                return (
                                    <tr key={problem.id} className={selectedIds.has(problem.id) ? 'selected-for-delete' : ''}>
                                        <td className="problem-delete-check-cell">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(problem.id)}
                                                disabled={deletingIds.size > 0}
                                                onChange={(event) => setSelectedIds((current) => {
                                                    const next = new Set(current);
                                                    if (event.target.checked) next.add(problem.id);
                                                    else next.delete(problem.id);
                                                    return next;
                                                })}
                                                aria-label={`문제 ${problem.id} 선택`}
                                            />
                                        </td>
                                        <td>#{problem.id}</td>
                                        <td>{problem.language}</td>
                                        <td>{problem.language === 'C#' && problem.runtime_platform
                                            ? `${problem.runtime_platform === 'dotnet_framework' ? '.NET Framework' : '.NET'} · ${projectTypeLabels[problem.project_type ?? ''] ?? '미지정'}`
                                            : '-'}</td>
                                        <td>{problem.major_topic}</td>
                                        <td>{problem.minor_topic}</td>
                                        <td>{difficultyLabels[problem.difficulty] ?? problem.difficulty}</td>
                                        <td>{problem.status === 'published' ? '활성' : '비활성'}</td>
                                        <td>
                                            <button className="problem-delete-button" type="button" disabled={deletingIds.size > 0} onClick={() => deleteOne(problem)}>
                                                {isDeleting ? '삭제 중...' : '삭제'}
                                            </button>
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

export default ProblemDeleteManager;
