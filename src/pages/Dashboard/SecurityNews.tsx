import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown'; // 마크다운 렌더링용 패키지

interface NewsItem {
    id: number;
    title: string;
    link: string;
    pub_date: string;
    source: string;
}

// AI 오늘의 뉴스용 타입
interface DailyMain {
    id: number;
    title: string;
    content_md: string;
    original_url: string;
    created_at: string;
    selection_reason: string;
}

const SecurityNews = () => {
    // 탭 상태 관리: 'main' (오늘의 메인 뉴스) 또는 'all' (전체 뉴스 리스트)
    const [activeTab, setActiveTab] = useState<'main' | 'all'>('main');

    // 오늘의 메인 뉴스 상태
    const [dailyMain, setDailyMain] = useState<DailyMain | null>(null);
    const [mainLoading, setMainLoading] = useState(true);

    // 전체 뉴스 리스트 상태
    const [news, setNews] = useState<NewsItem[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [inputPage, setInputPage] = useState("");

    // [API 통신] 오늘의 메인 뉴스 가져오기
    useEffect(() => {
        const fetchDailyMain = async () => {
            try {
                const response = await api.get('/api/news/daily-main');
                if (response.data.status === 'success' && response.data.data) {
                    setDailyMain(response.data.data);
                }
            } catch (error) {
                console.error('메인 뉴스 불러오기 실패:', error);
            } finally {
                setMainLoading(false);
            }
        };
        fetchDailyMain();
    }, []);

    // [API 통신] 전체 뉴스 리스트 가져오기 (페이지 바뀔 때마다)
    useEffect(() => {
        const fetchNews = async () => {
            setListLoading(true);
            try {
                const response = await api.get(`/api/news?page=${page}&limit=10`);
                if (response.data.status === 'success') {
                    setNews(response.data.data);
                    setTotalPages(response.data.total_pages);
                }
            } catch (error) {
                console.error('뉴스 리스트 불러오기 실패:', error);
            } finally {
                setListLoading(false);
            }
        };
        fetchNews();
    }, [page]);

    // 페이지네이션 함수들
    const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
    const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));
    const handleFirst = () => setPage(1);
    const handleLast = () => setPage(totalPages);

    const handleGoToPage = (e: React.FormEvent) => {
        e.preventDefault();
        const p = parseInt(inputPage);
        if (!isNaN(p) && p >= 1 && p <= totalPages) {
            setPage(p);
        } else {
            alert(`1부터 ${totalPages} 사이의 올바른 숫자를 입력해주세요.`);
        }
        setInputPage("");
    };

    return (
        <div style={{ padding: '1rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1e293b' }}>📰 시큐어 보안 뉴스</h2>
                    <p style={{ margin: 0, color: '#64748b' }}>AI가 분석한 오늘의 핵심 기사와 실시간 뉴스 리스트</p>
                </div>

                {/* 탭 전환 버튼 UI (애플리케이션 느낌의 깔끔한 디자인 적용) */}
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => setActiveTab('main')}
                        style={{
                            padding: '0.8rem 1.5rem',
                            backgroundColor: activeTab === 'main' ? '#3b82f6' : '#f1f5f9',
                            color: activeTab === 'main' ? 'white' : '#64748b',
                            border: 'none',
                            borderRadius: '8px 8px 0 0',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: '0.2s',
                            boxShadow: activeTab === 'main' ? '0 -4px 10px rgba(59, 130, 246, 0.2)' : 'none'
                        }}
                    >
                        ⭐ 오늘의 메인 뉴스
                    </button>
                    <button
                        onClick={() => setActiveTab('all')}
                        style={{
                            padding: '0.8rem 1.5rem',
                            backgroundColor: activeTab === 'all' ? '#3b82f6' : '#f1f5f9',
                            color: activeTab === 'all' ? 'white' : '#64748b',
                            border: 'none',
                            borderRadius: '8px 8px 0 0',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            transition: '0.2s',
                            boxShadow: activeTab === 'all' ? '0 -4px 10px rgba(59, 130, 246, 0.2)' : 'none'
                        }}
                    >
                        전체 뉴스 리스트
                    </button>
                </div>
            </div>

            {/* [탭 1] 오늘의 메인 뉴스 렌더링 영역 */}
            {activeTab === 'main' && (
                <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '900px', margin: '0 auto' }}>
                    {mainLoading ? (
                        <div style={{ textAlign: 'center', color: '#64748b', padding: '3rem 0' }}>AI 기자를 부르고 있습니다... 🤖</div>
                    ) : dailyMain ? (
                        <div>
                            {/* 👈 [추가] AI의 선정 이유를 멋진 박스에 띄워줍니다 */}
                            {dailyMain.selection_reason && (
                                <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '1.5rem', marginBottom: '2rem', borderRadius: '0 8px 8px 0' }}>
                                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>💡 AI 편집장의 선정 이유</h4>
                                    <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>{dailyMain.selection_reason}</p>
                                </div>
                            )}
                            {/* DB에서 가져온 원문 제목을 가장 큰 헤더로 렌더링! */}
                            <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1rem', lineHeight: '1.4' }}>
                                {dailyMain.title}
                            </h1>
                            {/* AI가 작성한 마크다운 본문 렌더링 */}
                            <div style={{ lineHeight: '1.8', color: '#334155', fontSize: '1.05rem' }}>
                                <ReactMarkdown>{dailyMain.content_md}</ReactMarkdown>
                            </div>
                        </div>
                    ) : (
                        <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>
                            오늘 작성된 메인 뉴스가 없습니다.<br />(백엔드에서 generate_ai_news.py 를 실행해주세요!)
                        </div>
                    )}
                </div>
            )}

            {/* [탭 2] 기존 전체 뉴스 리스트 렌더링 영역 */}
            {activeTab === 'all' && (
                <div>
                    {listLoading ? (
                        <div style={{ textAlign: 'center', marginTop: '3rem', color: '#64748b' }}>뉴스를 열심히 불러오는 중입니다...</div>
                    ) : (
                        <>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                {news.map((item) => (
                                    <a
                                        key={item.id}
                                        href={item.link}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        style={{
                                            display: 'block',
                                            padding: '1.5rem',
                                            backgroundColor: 'white',
                                            borderRadius: '8px',
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                            textDecoration: 'none',
                                            color: 'inherit',
                                            transition: 'all 0.2s ease-in-out'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.transform = 'translateY(-3px)';
                                            e.currentTarget.style.boxShadow = '0 6px 15px rgba(0,0,0,0.1)';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.transform = 'translateY(0)';
                                            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0,0,0,0.05)';
                                        }}
                                    >
                                        <h3 style={{ marginTop: 0, marginBottom: '0.8rem', color: '#0f172a', fontSize: '1.1rem' }}>
                                            {item.title}
                                        </h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
                                            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{item.source}</span>
                                            <span>{item.pub_date}</span>
                                        </div>
                                    </a>
                                ))}
                            </div>

                            {/* 페이지네이션 영역 */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '3rem', paddingBottom: '2rem' }}>
                                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                                    <button onClick={handleFirst} disabled={page === 1} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: page === 1 ? '#f1f5f9' : 'white', color: page === 1 ? '#94a3b8' : '#3b82f6', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>처음으로</button>
                                    <button onClick={handlePrev} disabled={page === 1} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: page === 1 ? '#f1f5f9' : 'white', color: page === 1 ? '#94a3b8' : '#334155', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>이전</button>
                                    <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#475569', margin: '0 1rem' }}>{page} / {totalPages}</span>
                                    <button onClick={handleNext} disabled={page === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: page === totalPages ? '#f1f5f9' : 'white', color: page === totalPages ? '#94a3b8' : '#334155', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>다음</button>
                                    <button onClick={handleLast} disabled={page === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: page === totalPages ? '#f1f5f9' : 'white', color: page === totalPages ? '#94a3b8' : '#3b82f6', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>끝으로</button>
                                </div>

                                <form onSubmit={handleGoToPage} style={{ display: 'flex', gap: '0.5rem' }}>
                                    <input type="number" value={inputPage} onChange={(e) => setInputPage(e.target.value)} placeholder="페이지" style={{ padding: '0.5rem', width: '80px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center', outline: 'none' }} />
                                    <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>이동</button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    );
};

export default SecurityNews;
