import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../services/api';
import './WeeklyNotes.css';

type WeeklyNote = { name: string; title: string; order: number };

const WeeklyNotes = () => {
  const [notes, setNotes] = useState<WeeklyNote[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [loadedNote, setLoadedNote] = useState<{ name: string; content: string; error: string } | null>(null);
  const [query, setQuery] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api.get<{ notes: WeeklyNote[] }>('/api/notes', { signal: controller.signal })
      .then(({ data }) => {
        setNotes(data.notes);
        setSelectedName(data.notes[0]?.name ?? '');
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error('연구 노트 목록 조회 실패:', error);
          setListError('연구 노트 목록을 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setListLoading(false);
      });
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (!selectedName) return;
    const controller = new AbortController();
    api.get<{ content: string }>('/api/notes/content', {
      params: { name: selectedName },
      signal: controller.signal,
    })
      .then(({ data }) => setLoadedNote({ name: selectedName, content: data.content, error: '' }))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error('연구 노트 본문 조회 실패:', error);
          setLoadedNote({ name: selectedName, content: '', error: '연구 노트를 불러오지 못했습니다.' });
        }
      });
    return () => controller.abort();
  }, [selectedName]);

  const visibleNotes = useMemo(
    () => notes.filter((note) => note.title.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())),
    [notes, query],
  );
  const selectedNote = notes.find((note) => note.name === selectedName);
  const contentLoading = Boolean(selectedName && loadedNote?.name !== selectedName);
  const contentError = loadedNote?.name === selectedName ? loadedNote.error : '';
  const content = loadedNote?.name === selectedName ? loadedNote.content : '';

  return (
    <div className="weekly-notes">
      <header className="weekly-notes__header">
        <span className="weekly-notes__eyebrow">RESEARCH ARCHIVE</span>
        <h1>연구 노트</h1>
        <p>주차별 연구 기록을 모아 확인합니다.</p>
      </header>

      <div className="weekly-notes__layout">
        <aside aria-label="연구 노트 목록" className="weekly-notes__sidebar">
          <div className="weekly-notes__sidebar-heading">
            <h2>주차별 기록</h2>
            <span>{notes.length}개</span>
          </div>
          <label className="weekly-notes__search">
            <span className="sr-only">연구 노트 검색</span>
            <input
              onChange={(event) => setQuery(event.target.value)}
              placeholder="주차 검색"
              type="search"
              value={query}
            />
          </label>
          {listLoading && <p className="weekly-notes__message" role="status">목록을 불러오는 중입니다...</p>}
          {listError && <p className="weekly-notes__message weekly-notes__message--error" role="alert">{listError}</p>}
          {!listLoading && !listError && notes.length === 0 && <p className="weekly-notes__message">등록된 연구 노트가 없습니다.</p>}
          {!listLoading && !listError && notes.length > 0 && visibleNotes.length === 0 && <p className="weekly-notes__message">검색 결과가 없습니다.</p>}
          <div className="weekly-notes__list">
            {visibleNotes.map((note) => (
              <button
                aria-current={selectedName === note.name ? 'page' : undefined}
                className={`weekly-notes__item${selectedName === note.name ? ' weekly-notes__item--active' : ''}`}
                key={note.name}
                onClick={() => setSelectedName(note.name)}
                type="button"
              >
                <span className="weekly-notes__item-number">{String(note.order).padStart(2, '0')}</span>
                <span>{note.title}</span>
              </button>
            ))}
          </div>
        </aside>

        <article className="weekly-notes__article">
          {selectedNote && <div className="weekly-notes__article-heading"><span>RESEARCH NOTE</span><h2>{selectedNote.title}</h2></div>}
          {contentLoading && <p className="weekly-notes__message" role="status">본문을 불러오는 중입니다...</p>}
          {contentError && <p className="weekly-notes__message weekly-notes__message--error" role="alert">{contentError}</p>}
          {!selectedName && !listLoading && <p className="weekly-notes__message">왼쪽에서 연구 노트를 선택하세요.</p>}
          {!contentLoading && !contentError && content && (
            <div className="weekly-notes__markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </article>
      </div>
    </div>
  );
};

export default WeeklyNotes;
