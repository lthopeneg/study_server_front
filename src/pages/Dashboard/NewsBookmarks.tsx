import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import './NewsBookmarks.css';

type NewsBookmark = {
    id: number;
    item_type: 'security_news' | 'daily_main';
    news_id: number;
    title: string;
    url: string;
    source: string | null;
    published_at: string | null;
    created_at: string | null;
    ai_article_id: number | null;
};

const NewsBookmarks = () => {
    const navigate = useNavigate();
    const [bookmarks, setBookmarks] = useState<NewsBookmark[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');
    const [removingId, setRemovingId] = useState<number | null>(null);

    useEffect(() => {
        const loadBookmarks = async () => {
            try {
                const response = await api.get('/api/user/news-bookmarks');
                setBookmarks(response.data.data ?? []);
            } catch {
                setError('스크랩한 뉴스를 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        loadBookmarks();
    }, []);

    const removeBookmark = async (bookmarkId: number) => {
        setRemovingId(bookmarkId);
        setError('');
        try {
            await api.delete(`/api/user/news-bookmarks/${bookmarkId}`);
            setBookmarks((current) => current.filter((item) => item.id !== bookmarkId));
        } catch {
            setError('뉴스 스크랩을 해제하지 못했습니다.');
        } finally {
            setRemovingId(null);
        }
    };

    const openBookmark = (item: NewsBookmark) => {
        if (item.ai_article_id) {
            navigate(`/news?articleId=${item.ai_article_id}`);
            return;
        }
        window.open(item.url, '_blank', 'noopener,noreferrer');
    };

    if (isLoading) return <div className="bookmark-status">스크랩한 뉴스를 불러오고 있습니다.</div>;

    return (
        <div className="news-bookmark-page">
            <header><div><h3>스크랩한 뉴스</h3><p>나중에 다시 확인할 보안 뉴스를 모아봅니다.</p></div><strong>{bookmarks.length}건</strong></header>
            {error && <div className="bookmark-error" role="alert">{error}</div>}
            {bookmarks.length === 0 ? (
                <div className="bookmark-status"><p>스크랩한 뉴스가 없습니다.</p><span>뉴스 화면에서 별표 버튼을 눌러 저장할 수 있습니다.</span></div>
            ) : (
                <div className="bookmark-list">
                    {bookmarks.map((item) => (
                        <article key={item.id}>
                            <button type="button" className="bookmark-link" onClick={() => openBookmark(item)}>
                                <span className="bookmark-kind">{item.item_type === 'daily_main' ? 'AI 메인 뉴스' : item.source || '보안 뉴스'}</span>
                                <h4>{item.title}</h4>
                                <p>{item.published_at || '발행일 미상'}</p>
                            </button>
                            <button type="button" className="bookmark-remove" disabled={removingId === item.id} onClick={() => void removeBookmark(item.id)}>
                                {removingId === item.id ? '해제 중...' : '스크랩 해제'}
                            </button>
                        </article>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NewsBookmarks;
