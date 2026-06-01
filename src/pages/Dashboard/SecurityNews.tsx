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

    // 컴포넌트가 화면에 뜰 때 딱 한 번 실행됨 (API 호출)
    useEffect(() => {
        const fetchNews = async () => {
            try {
                const response = await api.get('/api/news');
                if (response.data.status === 'success') {
                    setNews(response.data.data);
                }
            } catch (error) {
                console.error('뉴스 불러오기 실패:', error);
            } finally {
                setLoading(false); // 로딩 끝!
            }
        };

        fetchNews();
    }, []);

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
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {news.map((item) => (
                        <a
                            key={item.id}
                            href={item.link}
                            target="_blank"             // 새 창에서 띄우기
                            rel="noopener noreferrer"   // 보안 취약점 방어 속성
                            style={{
                                display: 'block',
                                padding: '1.5rem',
                                backgroundColor: 'white',
                                borderRadius: '8px',
                                boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
                                textDecoration: 'none', // 링크 밑줄 제거
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
            )}
        </div>
    );
};

export default SecurityNews;
