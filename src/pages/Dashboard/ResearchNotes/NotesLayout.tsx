import { Link, Outlet, useLocation } from 'react-router-dom';
import './NotesLayout.css';

const menus = [
    { title: '연구 노트', path: '/notes/research' },
    { title: '실험 자료', path: '/notes/experiments' },
    { title: '결과', path: '/notes/results' },
];

const NotesLayout = () => {
    const location = useLocation();

    return (
        <div className="research-notes-layout">
            <aside className="research-notes-sidebar" aria-label="연구 자료 메뉴">
                <Link className="research-notes-title" to="/notes/research">연구 자료</Link>
                <nav className="research-notes-menu">
                    {menus.map((item) => {
                        const isActive = location.pathname.startsWith(item.path);
                        return (
                            <Link
                                key={item.path}
                                className={`research-notes-menu-item${isActive ? ' active' : ''}`}
                                to={item.path}
                            >
                                {item.title}
                            </Link>
                        );
                    })}
                </nav>
            </aside>

            <section className="research-notes-content">
                <Outlet />
            </section>
        </div>
    );
};

export default NotesLayout;
