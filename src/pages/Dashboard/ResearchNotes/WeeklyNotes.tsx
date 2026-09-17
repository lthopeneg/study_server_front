import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../services/api';
import './WeeklyNotes.css';

type WeeklyNote = { name: string; title: string; order: number };
type Section = 'overview' | 'weekly' | 'evaluation' | 'methods';
type ResourceId = 'summary' | 'report' | 'index' | 'metrics' | 'scorecard' | 'architecture';
type Metrics = { total_records: number; average_score: number; decision_counts: Record<string, number>; cwe_average_scores: Record<string, number> };

const sections: { id: Section; label: string }[] = [
  { id: 'overview', label: '연구 개요' },
  { id: 'weekly', label: '주차별 기록' },
  { id: 'evaluation', label: '평가 결과' },
  { id: 'methods', label: '연구 방법' },
];
const resourceOptions: Record<Exclude<Section, 'weekly'>, { id: ResourceId; label: string }[]> = {
  overview: [{ id: 'summary', label: '연구 요약' }, { id: 'report', label: '최종 보고서' }],
  evaluation: [{ id: 'metrics', label: '품질 지표' }, { id: 'scorecard', label: '평가 기준' }],
  methods: [{ id: 'architecture', label: '시스템 구조' }, { id: 'index', label: '주차별 산출물' }],
};

const WeeklyNotes = () => {
  const [section, setSection] = useState<Section>('overview');
  const [resourceId, setResourceId] = useState<ResourceId>('summary');
  const [resources, setResources] = useState<Partial<Record<ResourceId, string>>>({});
  const [resourceError, setResourceError] = useState('');
  const [resourceLoading, setResourceLoading] = useState(false);
  const [resourceRetry, setResourceRetry] = useState(0);
  const [notes, setNotes] = useState<WeeklyNote[]>([]);
  const [selectedName, setSelectedName] = useState('');
  const [loadedNote, setLoadedNote] = useState<{ name: string; content: string; error: string } | null>(null);
  const [query, setQuery] = useState('');
  const [listLoading, setListLoading] = useState(true);
  const [listError, setListError] = useState('');
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    if (section === 'weekly' || resources[resourceId] !== undefined) return;
    const controller = new AbortController();
    api.get<{ content: string }>(`/api/notes/resources/${resourceId}`, { signal: controller.signal })
      .then(({ data }) => setResources((current) => ({ ...current, [resourceId]: data.content })))
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error('연구 자료 조회 실패:', error);
          setResourceError('연구 자료를 불러오지 못했습니다.');
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setResourceLoading(false);
      });
    return () => controller.abort();
  }, [resourceId, resourceRetry, resources, section]);

  const selectSection = (next: Section) => {
    setSection(next);
    setResourceError('');
    if (next !== 'weekly') {
      setResourceId(resourceOptions[next][0].id);
      setResourceLoading(resources[resourceOptions[next][0].id] === undefined);
    }
  };

  const selectResource = (id: ResourceId) => {
    setResourceId(id);
    setResourceError('');
    setResourceLoading(resources[id] === undefined);
  };

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
  }, [retryCount]);

  const retryList = () => {
    setListError('');
    setListLoading(true);
    setRetryCount((count) => count + 1);
  };

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
  const resourceContent = resources[resourceId];
  let metrics: Metrics | null = null;
  if (resourceId === 'metrics' && resourceContent) {
    try { metrics = JSON.parse(resourceContent) as Metrics; } catch { metrics = null; }
  }

  return (
    <div className="weekly-notes">
      <header className="weekly-notes__header">
        <span className="weekly-notes__eyebrow">RESEARCH ARCHIVE</span>
        <h1>연구 노트</h1>
        <p>연구의 흐름과 성과를 주차별 기록, 평가 결과와 함께 확인합니다.</p>
      </header>

      <nav className="weekly-notes__sections" aria-label="연구 자료 분류">
        {sections.map((item) => (
          <button
            aria-current={section === item.id ? 'page' : undefined}
            className={section === item.id ? 'weekly-notes__section weekly-notes__section--active' : 'weekly-notes__section'}
            key={item.id}
            onClick={() => selectSection(item.id)}
            type="button"
          >{item.label}</button>
        ))}
      </nav>

      {section === 'weekly' ? <div className="weekly-notes__layout">
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
          {listError && (
            <div className="weekly-notes__message weekly-notes__message--error" role="alert">
              <p>{listError}</p>
              <button className="weekly-notes__retry" onClick={retryList} type="button">다시 시도</button>
            </div>
          )}
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
          {selectedNote && <div className="weekly-notes__article-heading"><span>RESEARCH NOTE</span><h2>{selectedNote.title}</h2><button className="weekly-notes__artifact-link" onClick={() => { setSection('methods'); selectResource('index'); }} type="button">주차별 산출물 보기 →</button></div>}
          {contentLoading && <p className="weekly-notes__message" role="status">본문을 불러오는 중입니다...</p>}
          {contentError && <p className="weekly-notes__message weekly-notes__message--error" role="alert">{contentError}</p>}
          {!selectedName && !listLoading && <p className="weekly-notes__message">왼쪽에서 연구 노트를 선택하세요.</p>}
          {!contentLoading && !contentError && content && (
            <div className="weekly-notes__markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
            </div>
          )}
        </article>
      </div> : <div className="weekly-notes__resource">
        <div className="weekly-notes__resource-nav" aria-label="문서 선택">
          {resourceOptions[section].map((option) => (
            <button
              aria-pressed={resourceId === option.id}
              className={resourceId === option.id ? 'weekly-notes__resource-button weekly-notes__resource-button--active' : 'weekly-notes__resource-button'}
              key={option.id}
              onClick={() => selectResource(option.id)}
              type="button"
            >{option.label}</button>
          ))}
        </div>
        <article className="weekly-notes__article weekly-notes__article--resource">
          {resourceLoading && <p className="weekly-notes__message" role="status">자료를 불러오는 중입니다...</p>}
          {resourceError && <div className="weekly-notes__message weekly-notes__message--error" role="alert"><p>{resourceError}</p><button className="weekly-notes__retry" onClick={() => { setResourceError(''); setResourceLoading(true); setResourceRetry((count) => count + 1); }} type="button">다시 시도</button></div>}
          {!resourceLoading && !resourceError && resourceContent && resourceId === 'metrics' && metrics && (
            <div className="weekly-notes__metrics">
              <div className="weekly-notes__article-heading"><span>QUALITY REVIEW</span><h2>누적 품질 평가</h2></div>
              <div className="weekly-notes__metric-grid">
                <div><span>평가 건수</span><strong>{metrics.total_records}</strong></div>
                <div><span>평균 점수</span><strong>{metrics.average_score}</strong><small> / 12점</small></div>
                <div><span>즉시 사용</span><strong>{metrics.decision_counts.use ?? 0}</strong></div>
                <div><span>수정 후 사용</span><strong>{metrics.decision_counts.revise_then_use ?? 0}</strong></div>
                <div><span>재생성</span><strong>{metrics.decision_counts.regenerate ?? 0}</strong></div>
              </div>
              <h3>CWE별 평균 점수</h3>
              <div className="weekly-notes__metric-bars">
                {Object.entries(metrics.cwe_average_scores).map(([cwe, score]) => (
                  <div className="weekly-notes__metric-row" key={cwe}><span>{cwe}</span><div><i style={{ width: `${Math.max(0, Math.min(100, score / 12 * 100))}%` }} /></div><strong>{score.toFixed(2)}</strong></div>
                ))}
              </div>
            </div>
          )}
          {!resourceLoading && !resourceError && resourceContent && resourceId === 'metrics' && !metrics && <p className="weekly-notes__message weekly-notes__message--error">평가 데이터를 표시할 수 없습니다.</p>}
          {!resourceLoading && !resourceError && resourceContent && resourceId !== 'metrics' && <div className="weekly-notes__markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{resourceContent}</ReactMarkdown></div>}
        </article>
      </div>}
    </div>
  );
};

export default WeeklyNotes;
