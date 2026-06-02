import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';

// 뉴스 데이터 타입 정의
interface NewsItem {
    id: number;
    title: string;
    link: string;
    pub_date: string;
    source: string;
}

const SecurityNews = () => {
    const [news, setNews] = useState<NewsItem[]>([]);
    const [loading, setLoading] = useState(true);

    // 페이지네이션을 위한 상태 추가
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // 페이지 번호가 바뀔 때마다 뉴스를 새로 불러옵니다
    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            try {
                // 백엔드에 페이지 번호(page)를 전달해서 10개씩 받아옴
                const response = await api.get(`/api/news?page=${page}&limit=10`);
                if (response.data.status === 'success') {
                    setNews(response.data.data);
                    setTotalPages(response.data.total_pages);
                }
            } catch (error) {
                console.error('뉴스 불러오기 실패:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [page]); // page 변수가 바뀔 때마다 이 함수가 다시 실행됨

    // 이전/다음 페이지 이동 함수
    const handlePrev = () => setPage((prev) => Math.max(prev - 1, 1));
    const handleNext = () => setPage((prev) => Math.min(prev + 1, totalPages));

    // 처음으로/끝으로 및 번호 직접 이동 함수 (새로 추가됨)
    const handleFirst = () => setPage(1);
    const handleLast = () => setPage(totalPages);
    const [inputPage, setInputPage] = useState("");

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
            <h2 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '1rem', marginTop: 0, color: '#1e293b' }}>
                📰 최신 보안 뉴스
            </h2>
            <p style={{ marginTop: '0.5rem', marginBottom: '2rem', color: '#64748b' }}>
                한국 주요 보안 매체(보안뉴스, 데일리시큐)의 실시간 최신 기사를 한눈에 확인하세요.
            </p>

            {loading ? (
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

                    {/* 하단 고급 페이지네이션 및 이동 버튼 영역 */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', marginTop: '3rem', paddingBottom: '2rem' }}>

                        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button onClick={handleFirst} disabled={page === 1} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: page === 1 ? '#f1f5f9' : 'white', color: page === 1 ? '#94a3b8' : '#3b82f6', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>처음으로</button>
                            <button onClick={handlePrev} disabled={page === 1} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: page === 1 ? '#f1f5f9' : 'white', color: page === 1 ? '#94a3b8' : '#334155', borderRadius: '6px', cursor: page === 1 ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>이전</button>

                            <span style={{ fontSize: '1rem', fontWeight: 'bold', color: '#475569', margin: '0 1rem' }}>
                                {page} / {totalPages}
                            </span>

                            <button onClick={handleNext} disabled={page === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: page === totalPages ? '#f1f5f9' : 'white', color: page === totalPages ? '#94a3b8' : '#334155', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>다음</button>
                            <button onClick={handleLast} disabled={page === totalPages} style={{ padding: '0.5rem 1rem', border: '1px solid #cbd5e1', backgroundColor: page === totalPages ? '#f1f5f9' : 'white', color: page === totalPages ? '#94a3b8' : '#3b82f6', borderRadius: '6px', cursor: page === totalPages ? 'not-allowed' : 'pointer', fontWeight: 'bold', transition: '0.2s' }}>끝으로</button>
                        </div>

                        {/* 특정 페이지 번호 직접 입력 이동 */}
                        <form onSubmit={handleGoToPage} style={{ display: 'flex', gap: '0.5rem' }}>
                            <input
                                type="number"
                                value={inputPage}
                                onChange={(e) => setInputPage(e.target.value)}
                                placeholder="페이지"
                                style={{ padding: '0.5rem', width: '80px', borderRadius: '4px', border: '1px solid #cbd5e1', textAlign: 'center', outline: 'none' }}
                            />
                            <button type="submit" style={{ padding: '0.5rem 1rem', backgroundColor: '#334155', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: '0.2s' }}>이동</button>
                        </form>
                    </div>
                </>
            )}
        </div>
    );
};

export default SecurityNews;
