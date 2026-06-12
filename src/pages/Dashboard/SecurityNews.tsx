import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';

interface NewsItem {
    id: number;
    title: string;
    link: string;
    pub_date: string;
    source: string;
}

interface DailyMain {
    id: number;
    title: string;
    content_md: string;
    original_url: string;
    created_at: string;
    selection_reason: string;
}

const SecurityNews = () => {
    // 탭 상태 관리: 'main' (AI 메인 뉴스) 또는 'all' (전체 뉴스 리스트)
    const [activeTab, setActiveTab] = useState<'main' | 'all'>('main');

    // --- AI 뉴스 아카이브 전용 상태 ---
    // 'list': 히스토리 목록 화면, 'detail': 특정 기사 상세 화면
    const [aiViewMode, setAiViewMode] = useState<'list' | 'detail'>('list');
    const [aiHistory, setAiHistory] = useState<DailyMain[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);

    const [dailyMain, setDailyMain] = useState<DailyMain | null>(null);
    const [mainLoading, setMainLoading] = useState(true);

    const [news, setNews] = useState<NewsItem[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [inputPage, setInputPage] = useState("");

    // [API] AI 뉴스 히스토리(목록) 가져오기
    useEffect(() => {
        if (activeTab === 'main' && aiViewMode === 'list') {
            const fetchAiHistory = async () => {
                setHistoryLoading(true);
                try {
                    const response = await api.get('/api/news/ai-history');
                    if (response.data.status === 'success') {
                        setAiHistory(response.data.data);
                    }
                } catch (error) {
                    console.error('AI 히스토리 불러오기 실패:', error);
                } finally {
                    setHistoryLoading(false);
                }
            };
            fetchAiHistory();
        }
    }, [activeTab, aiViewMode]);

    // [API] 전체 일반 뉴스 가져오기
    useEffect(() => {
        if (activeTab === 'all') {
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
        }
    }, [activeTab, page]);

    // AI 뉴스 카드 클릭 시 상세 조회
    const handleReadAiNews = async (id: number) => {
        setMainLoading(true);
        setAiViewMode('detail');
        try {
            const response = await api.get(`/api/news/daily-main?id=${id}`);
            if (response.data.status === 'success' && response.data.data) {
                setDailyMain(response.data.data);
            }
        } catch (error) {
            console.error('상세 뉴스 불러오기 실패:', error);
        } finally {
            setMainLoading(false);
        }
    };

    // 페이지네이션 함수들
    const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
    const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));
    const handleFirst = () => setPage(1);
    const handleLast = () => setPage(totalPages);
    const handleGoToPage = (e: React.FormEvent) => {
        e.preventDefault();
        const p = parseInt(inputPage);
        if (!isNaN(p) && p >= 1 && p <= totalPages) setPage(p);
        setInputPage("");
    };

    return (
        <div style={{ padding: '1rem 2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ marginTop: 0, marginBottom: '0.5rem', color: '#1e293b' }}>📰 시큐어 보안 뉴스</h2>
                    <p style={{ margin: 0, color: '#64748b' }}>AI가 분석한 오늘의 핵심 기사와 실시간 뉴스 리스트</p>
                </div>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button
                        onClick={() => { setActiveTab('main'); setAiViewMode('list'); }}
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
                        ⭐ AI 메인 뉴스
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

            {/* [탭 1] AI 메인 뉴스 영역 */}
            {activeTab === 'main' && (
                <div>
                    {aiViewMode === 'list' ? (
                        // --- 아카이브 목록 화면 ---
                        <div>
                            {historyLoading ? (
                                <div style={{ textAlign: 'center', marginTop: '3rem', color: '#64748b' }}>아카이브를 불러오는 중입니다...</div>
                            ) : aiHistory.length === 0 ? (
                                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '3rem 0' }}>작성된 AI 메인 뉴스가 없습니다.</div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {aiHistory.map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleReadAiNews(item.id)}
                                            style={{
                                                backgroundColor: 'white',
                                                padding: '1.5rem',
                                                borderRadius: '12px',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.05)',
                                                cursor: 'pointer',
                                                transition: 'transform 0.2s, box-shadow 0.2s',
                                                border: '1px solid #e2e8f0',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                justifyContent: 'space-between'
                                            }}
                                            onMouseEnter={(e) => {
                                                e.currentTarget.style.transform = 'translateY(-5px)';
                                                e.currentTarget.style.boxShadow = '0 10px 15px rgba(0,0,0,0.1)';
                                            }}
                                            onMouseLeave={(e) => {
                                                e.currentTarget.style.transform = 'translateY(0)';
                                                e.currentTarget.style.boxShadow = '0 4px 6px rgba(0,0,0,0.05)';
                                            }}
                                        >
                                            <div>
                                                <div style={{ fontSize: '0.85rem', color: '#3b82f6', fontWeight: 'bold', marginBottom: '0.8rem', display: 'inline-block', padding: '0.2rem 0.6rem', backgroundColor: '#eff6ff', borderRadius: '4px' }}>
                                                    📅 {item.created_at} AI 보안 뉴스
                                                </div>
                                                <h3 style={{ margin: '0 0 1.5rem 0', color: '#0f172a', fontSize: '1.15rem', lineHeight: '1.4', wordBreak: 'keep-all' }}>
                                                    {item.title}
                                                </h3>
                                            </div>
                                            <div style={{ color: '#64748b', fontSize: '0.9rem', textAlign: 'right', fontWeight: 'bold' }}>
                                                자세히 읽기 →
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ) : (
                        // --- 개별 상세 화면 ---
                        <div style={{ backgroundColor: 'white', padding: '3rem', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.05)', maxWidth: '900px', margin: '0 auto', position: 'relative' }}>
                            <button
                                onClick={() => setAiViewMode('list')}
                                style={{ position: 'absolute', top: '20px', left: '20px', padding: '8px 15px', backgroundColor: '#f1f5f9', border: 'none', borderRadius: '6px', color: '#475569', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}
                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#e2e8f0'}
                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
                            >
                                ← 목록으로 돌아가기
                            </button>

                            {mainLoading ? (
                                <div style={{ textAlign: 'center', color: '#64748b', padding: '4rem 0' }}>선택하신 뉴스를 불러오고 있습니다... 🚀</div>
                            ) : dailyMain ? (
                                <div style={{ marginTop: '2rem' }}>
                                    <div style={{ textAlign: 'center', marginBottom: '2rem', color: '#64748b', fontWeight: 'bold' }}>
                                        발행일: {dailyMain.created_at}
                                    </div>
                                    {dailyMain.selection_reason && (
                                        <div style={{ backgroundColor: '#f8fafc', borderLeft: '4px solid #3b82f6', padding: '1.5rem', marginBottom: '2rem', borderRadius: '0 8px 8px 0' }}>
                                            <h4 style={{ margin: '0 0 0.5rem 0', color: '#3b82f6' }}>💡 AI 편집장의 선정 이유</h4>
                                            <p style={{ margin: 0, color: '#475569', lineHeight: '1.6' }}>{dailyMain.selection_reason}</p>
                                        </div>
                                    )}
                                    <h1 style={{ fontSize: '2rem', color: '#0f172a', marginBottom: '1.5rem', lineHeight: '1.4' }}>
                                        {dailyMain.title}
                                    </h1>
                                    <div style={{ lineHeight: '1.8', color: '#334155', fontSize: '1.05rem' }}>
                                        <ReactMarkdown>
                                            {dailyMain.content_md.replace(/(?<!\])\((https?:\/\/[^\s\)]+)\)/g, '(<$1>)')}
                                        </ReactMarkdown>
                                    </div>
                                </div>
                            ) : null}
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
