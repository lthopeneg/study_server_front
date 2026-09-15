import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import './SecurityNews.css';

interface NewsItem {
    id: number;
    title: string;
    link: string;
    pub_date: string;
    source: string;
    ai_article_id: number | null;
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
    const [isAdmin, setIsAdmin] = useState(false);
    const [bookmarks, setBookmarks] = useState<Record<string, number>>({});
    const [bookmarkingKey, setBookmarkingKey] = useState('');
    const [bookmarkMessage, setBookmarkMessage] = useState('');
    const [generationMessage, setGenerationMessage] = useState('');
    const [generationResult, setGenerationResult] = useState<{ articleId: number; title: string } | null>(null);
    const [selectedNewsForGeneration, setSelectedNewsForGeneration] = useState<NewsItem | null>(null);
    const [generatingNewsId, setGeneratingNewsId] = useState<number | null>(null);
    const [historyRefreshKey, setHistoryRefreshKey] = useState(0);
    // 탭 상태 관리: 'main' (AI 메인 뉴스) 또는 'all' (전체 뉴스 리스트)
    const [activeTab, setActiveTab] = useState<'main' | 'all'>('main');

    // --- AI 뉴스 아카이브 전용 상태 ---
    // 'list': 히스토리 목록 화면, 'detail': 특정 기사 상세 화면
    const [aiViewMode, setAiViewMode] = useState<'list' | 'detail'>('list');
    const [aiHistory, setAiHistory] = useState<DailyMain[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyPage, setHistoryPage] = useState(1);
    const [historyTotalPages, setHistoryTotalPages] = useState(1);

    const [dailyMain, setDailyMain] = useState<DailyMain | null>(null);
    const [mainLoading, setMainLoading] = useState(true);

    const [news, setNews] = useState<NewsItem[]>([]);
    const [listLoading, setListLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [inputPage, setInputPage] = useState("");

    useEffect(() => {
        const loadBookmarks = async () => {
            try {
                const response = await api.get('/api/user/news-bookmarks');
                const bookmarkMap = Object.fromEntries((response.data.data ?? []).map((item: { id: number; item_type: string; news_id: number }) => [
                    `${item.item_type}:${item.news_id}`, item.id,
                ]));
                setBookmarks(bookmarkMap);
            } catch {
                setBookmarkMessage('스크랩 정보를 불러오지 못했습니다.');
            }
        };
        loadBookmarks();
    }, []);

    useEffect(() => {
        const loadRole = async () => {
            try {
                const response = await api.get('/api/user/profile');
                setIsAdmin(response.data.data?.role === 'ADMIN');
            } catch {
                setIsAdmin(false);
            }
        };
        loadRole();
    }, []);

    const toggleBookmark = async (itemType: 'security_news' | 'daily_main', newsId: number) => {
        const key = `${itemType}:${newsId}`;
        setBookmarkingKey(key);
        setBookmarkMessage('');
        try {
            const bookmarkId = bookmarks[key];
            if (bookmarkId) {
                await api.delete(`/api/user/news-bookmarks/${bookmarkId}`);
                setBookmarks((current) => {
                    const next = { ...current };
                    delete next[key];
                    return next;
                });
            } else {
                const response = await api.post('/api/user/news-bookmarks', { item_type: itemType, news_id: newsId });
                setBookmarks((current) => ({ ...current, [key]: response.data.data.id }));
            }
        } catch {
            setBookmarkMessage('뉴스 스크랩을 변경하지 못했습니다.');
        } finally {
            setBookmarkingKey('');
        }
    };

    const generateAiArticle = async () => {
        if (!selectedNewsForGeneration) return;
        const target = selectedNewsForGeneration;
        setSelectedNewsForGeneration(null);
        setGeneratingNewsId(target.id);
        setGenerationMessage('AI 기사를 작성하고 있습니다. 잠시만 기다려주세요.');
        try {
            const response = await api.post(`/api/news/${target.id}/generate-ai-article`);
            const articleId = response.data.data.id as number;
            setGenerationMessage('');
            setGenerationResult({ articleId, title: target.title });
            setNews((current) => current.map((item) => (
                item.id === target.id ? { ...item, ai_article_id: articleId } : item
            )));
            setHistoryPage(1);
            setHistoryRefreshKey((value) => value + 1);
        } catch (error: unknown) {
            const responseMessage = typeof error === 'object' && error !== null && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            setGenerationMessage(responseMessage ?? 'AI 기사를 작성하지 못했습니다.');
        } finally {
            setGeneratingNewsId(null);
        }
    };

    // [API] AI 뉴스 히스토리(목록) 가져오기
    useEffect(() => {
        if (activeTab === 'main' && aiViewMode === 'list') {
            const fetchAiHistory = async () => {
                setHistoryLoading(true);
                try {
                    const response = await api.get(`/api/news/ai-history?page=${historyPage}&limit=12`);
                    if (response.data.status === 'success') {
                        setAiHistory(response.data.data);
                        setHistoryTotalPages(Math.max(response.data.total_pages, 1));
                    }
                } catch (error) {
                    console.error('AI 히스토리 불러오기 실패:', error);
                } finally {
                    setHistoryLoading(false);
                }
            };
            fetchAiHistory();
        }
    }, [activeTab, aiViewMode, historyPage, historyRefreshKey]);

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

    const openAiArticle = (id: number) => {
        setGenerationResult(null);
        setActiveTab('main');
        void handleReadAiNews(id);
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
            {bookmarkMessage && <div className="news-bookmark-message" role="alert">{bookmarkMessage}</div>}
            {generationMessage && <div className="news-generation-message" role="status">{generationMessage}</div>}
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
                                <>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.5rem' }}>
                                    {aiHistory.map((item) => (
                                        <div
                                            key={item.id}
                                            className="ai-news-card"
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
                                        >
                                            <button
                                                type="button"
                                                className={`news-bookmark-button ${bookmarks[`daily_main:${item.id}`] ? 'active' : ''}`}
                                                aria-label={bookmarks[`daily_main:${item.id}`] ? 'AI 뉴스 스크랩 해제' : 'AI 뉴스 스크랩'}
                                                disabled={bookmarkingKey === `daily_main:${item.id}`}
                                                onClick={(event) => { event.stopPropagation(); void toggleBookmark('daily_main', item.id); }}
                                            >
                                                {bookmarks[`daily_main:${item.id}`] ? '★' : '☆'}
                                            </button>
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
                                {historyTotalPages > 1 && (
                                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '1rem', marginTop: '2rem' }}>
                                        <button
                                            onClick={() => setHistoryPage((current) => Math.max(current - 1, 1))}
                                            disabled={historyPage === 1}
                                            style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white', cursor: historyPage === 1 ? 'not-allowed' : 'pointer' }}
                                        >
                                            이전
                                        </button>
                                        <span style={{ color: '#475569', fontWeight: 'bold' }}>{historyPage} / {historyTotalPages}</span>
                                        <button
                                            onClick={() => setHistoryPage((current) => Math.min(current + 1, historyTotalPages))}
                                            disabled={historyPage === historyTotalPages}
                                            style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', borderRadius: '6px', backgroundColor: 'white', cursor: historyPage === historyTotalPages ? 'not-allowed' : 'pointer' }}
                                        >
                                            다음
                                        </button>
                                    </div>
                                )}
                                </>
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
                                    <button
                                        type="button"
                                        className={`news-detail-bookmark ${bookmarks[`daily_main:${dailyMain.id}`] ? 'active' : ''}`}
                                        disabled={bookmarkingKey === `daily_main:${dailyMain.id}`}
                                        onClick={() => void toggleBookmark('daily_main', dailyMain.id)}
                                    >
                                        {bookmarks[`daily_main:${dailyMain.id}`] ? '★ 스크랩됨' : '☆ 스크랩'}
                                    </button>
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
                                            {dailyMain.content_md.replace(/(?<!\])\((https?:\/\/[^\s)]+)\)/g, '(<$1>)')}
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
                                    <div className="news-list-item" key={item.id}>
                                    <a
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
                                    >
                                        <h3 style={{ marginTop: 0, marginBottom: '0.8rem', color: '#0f172a', fontSize: '1.1rem' }}>
                                            {item.title}
                                        </h3>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#94a3b8' }}>
                                            <span style={{ fontWeight: 'bold', color: '#3b82f6' }}>{item.source}</span>
                                            <span>{item.pub_date}</span>
                                        </div>
                                    </a>
                                    <div className="news-item-actions">
                                        {isAdmin && (
                                            item.ai_article_id ? (
                                                <button
                                                    type="button"
                                                    className="news-generate-button existing"
                                                    onClick={() => openAiArticle(item.ai_article_id as number)}
                                                >
                                                    AI 기사 보러가기
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="news-generate-button"
                                                    disabled={generatingNewsId !== null}
                                                    onClick={() => setSelectedNewsForGeneration(item)}
                                                >
                                                    {generatingNewsId === item.id ? '작성 중...' : 'AI 기사로 작성하기'}
                                                </button>
                                            )
                                        )}
                                        <button
                                            type="button"
                                            className={`news-bookmark-button ${bookmarks[`security_news:${item.id}`] ? 'active' : ''}`}
                                            aria-label={bookmarks[`security_news:${item.id}`] ? '뉴스 스크랩 해제' : '뉴스 스크랩'}
                                            disabled={bookmarkingKey === `security_news:${item.id}`}
                                            onClick={() => void toggleBookmark('security_news', item.id)}
                                        >
                                            {bookmarks[`security_news:${item.id}`] ? '★' : '☆'}
                                        </button>
                                    </div>
                                    </div>
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
            {selectedNewsForGeneration && (
                <div className="news-confirm-backdrop" role="presentation" onMouseDown={() => setSelectedNewsForGeneration(null)}>
                    <section role="dialog" aria-modal="true" aria-labelledby="news-generate-title" onMouseDown={(event) => event.stopPropagation()}>
                        <span className="news-confirm-icon" aria-hidden="true">AI</span>
                        <h2 id="news-generate-title">AI 기사로 작성할까요?</h2>
                        <p>선택한 원문을 분석해 새로운 AI 메인 뉴스를 작성합니다.</p>
                        <strong>{selectedNewsForGeneration.title}</strong>
                        <div>
                            <button type="button" onClick={() => setSelectedNewsForGeneration(null)}>취소</button>
                            <button type="button" className="confirm" autoFocus onClick={() => void generateAiArticle()}>작성 시작</button>
                        </div>
                    </section>
                </div>
            )}
            {generationResult && (
                <div className="news-confirm-backdrop" role="presentation" onMouseDown={() => setGenerationResult(null)}>
                    <section role="dialog" aria-modal="true" aria-labelledby="news-generation-complete-title" onMouseDown={(event) => event.stopPropagation()}>
                        <span className="news-confirm-icon complete" aria-hidden="true">✓</span>
                        <h2 id="news-generation-complete-title">기사 작성 완료</h2>
                        <p>기사 작성이 완료되었습니다. AI 메인 뉴스에서 확인할 수 있습니다.</p>
                        <strong>{generationResult.title}</strong>
                        <div>
                            <button type="button" onClick={() => setGenerationResult(null)}>닫기</button>
                            <button type="button" className="confirm" autoFocus onClick={() => openAiArticle(generationResult.articleId)}>기사 보러가기</button>
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
};

export default SecurityNews;
