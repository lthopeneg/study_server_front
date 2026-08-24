import { useOutletContext } from 'react-router-dom';
import type { PracticeOutletContext } from './PracticeLayout';
import CreateProblemForm from './CreateProblemForm';
import ProblemVisibilityManager from './ProblemVisibilityManager';

type ManagementMode = 'create' | 'edit' | 'delete';

const managementCopy: Record<ManagementMode, { title: string; description: string }> = {
    create: {
        title: '문제 출제하기',
        description: '연구노트를 출제 범위로 선택하고 새 문제를 생성하는 화면이 들어갈 자리입니다.',
    },
    edit: {
        title: '문제 수정하기',
        description: '등록된 문제의 내용, 정답, 해설과 난이도를 수정하는 화면이 들어갈 자리입니다.',
    },
    delete: {
        title: '문제 삭제하기',
        description: '삭제할 문제를 조회하고 확인하는 화면이 들어갈 자리입니다.',
    },
};

const ProblemManagement = ({ mode }: { mode: ManagementMode }) => {
    const { isAdmin, isRoleLoading } = useOutletContext<PracticeOutletContext>();
    const copy = managementCopy[mode];

    if (isRoleLoading) {
        return <div className="practice-status">관리자 권한을 확인하고 있습니다.</div>;
    }

    if (!isAdmin) {
        return (
            <div className="practice-status practice-status-denied">
                <h1>접근할 수 없습니다</h1>
                <p>문제 관리 기능은 관리자 계정만 사용할 수 있습니다.</p>
            </div>
        );
    }

    return (
        <div className="practice-page">
            <header className="practice-page-header">
                <div>
                    <span className="practice-eyebrow">문제 관리 · 관리자 전용</span>
                    <h1>{copy.title}</h1>
                    <p>{copy.description}</p>
                </div>
            </header>

            {mode === 'create' ? (
                <CreateProblemForm />
            ) : mode === 'edit' ? (
                <ProblemVisibilityManager />
            ) : (
                <div className="practice-empty-state compact">
                    <h2>관리 기능 준비 중</h2>
                    <p>문제 데이터 구조와 API가 확정되면 이 영역에 실제 관리 도구를 연결합니다.</p>
                </div>
            )}
        </div>
    );
};

export default ProblemManagement;
