import { useEffect, useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { api } from '../../../services/api';
import './Practice.css';

export type PracticeOutletContext = {
    isAdmin: boolean;
    isRoleLoading: boolean;
};

const problemMenus = [
    { title: 'Python', path: '/practice/python' },
    { title: 'C#', path: '/practice/csharp' },
];

const adminMenus = [
    { title: '문제 출제하기', path: '/practice/manage/create' },
    { title: '문제 수정하기', path: '/practice/manage/edit' },
    { title: '문제 삭제하기', path: '/practice/manage/delete' },
];

const PracticeLayout = () => {
    const location = useLocation();
    const [role, setRole] = useState<string | null>(null);
    const [isRoleLoading, setIsRoleLoading] = useState(true);

    useEffect(() => {
        const fetchRole = async () => {
            try {
                const response = await api.get('/api/user/profile');
                if (response.data.status === 'success') {
                    setRole(response.data.data.role);
                }
            } catch (error) {
                console.error('실습 메뉴 권한 조회 실패:', error);
            } finally {
                setIsRoleLoading(false);
            }
        };

        fetchRole();
    }, []);

    const isAdmin = role === 'ADMIN';

    const renderMenu = (item: { title: string; path: string }) => (
        <Link
            key={item.path}
            className={`practice-menu-item${
                location.pathname === item.path
                || ((item.path.endsWith('/python') || item.path.endsWith('/csharp')) && location.pathname.startsWith(`${item.path}/`))
                    ? ' active'
                    : ''
            }`}
            to={item.path}
        >
            {item.title}
        </Link>
    );

    return (
        <div className="practice-layout">
            <aside className="practice-sidebar" aria-label="실습 메뉴">
                <Link className="practice-title" to="/practice/python">실습</Link>

                <div className="practice-menu-section">
                    <h2>문제 리스트</h2>
                    <nav className="practice-menu">{problemMenus.map(renderMenu)}</nav>
                </div>

                {isAdmin && (
                    <div className="practice-menu-section practice-admin-section">
                        <h2>문제 관리</h2>
                        <span className="practice-admin-badge">관리자 전용</span>
                        <nav className="practice-menu">{adminMenus.map(renderMenu)}</nav>
                    </div>
                )}
            </aside>

            <section className="practice-content">
                <Outlet context={{ isAdmin, isRoleLoading } satisfies PracticeOutletContext} />
            </section>
        </div>
    );
};

export default PracticeLayout;
