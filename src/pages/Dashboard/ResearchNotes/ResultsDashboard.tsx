import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../services/api';

type ResultTab = 'summary' | 'report' | 'evaluation' | 'artifacts';

interface ResultFile { name: string; path: string; }
interface EvaluationSummary {
    total_records?: number;
    average_score?: number;
    decision_counts?: Record<string, number>;
}

const TABS: { id: ResultTab; label: string }[] = [
    { id: 'summary', label: '핵심 요약' },
    { id: 'report', label: '최종 보고서' },
    { id: 'evaluation', label: '평가 · 지표' },
    { id: 'artifacts', label: '산출물' },
];

const FILE_LABELS: Record<string, string> = {
    'executive_summary.md': '연구 요약',
    'final_research_progress_report.md': '최종 연구 진행 보고서',
    'cumulative_evaluation_summary.json': '누적 평가 요약',
    'cumulative_evaluation_records.csv': '누적 평가 기록',
    'common_flask_check_sample.json': '공통 Flask 검증 예시',
    'weekly_artifact_index.md': '주차별 연구 산출물',
    'artifact_manifest.json': '전체 산출물 목록',
    'system_architecture_diagram.md': '시스템 구조도',
    'web_content_mapping.md': '웹 콘텐츠 연결표',
};

const categorizeResult = (fileName: string): ResultTab => {
    if (fileName === 'executive_summary.md') return 'summary';
    if (fileName === 'final_research_progress_report.md') return 'report';
    if (fileName.includes('evaluation') || fileName === 'common_flask_check_sample.json') return 'evaluation';
    return 'artifacts';
};

const getPreferredResult = (tab: ResultTab, files: ResultFile[]) => {
    const preferredNames: Record<ResultTab, string> = {
        summary: 'executive_summary.md',
        report: 'final_research_progress_report.md',
        evaluation: 'cumulative_evaluation_summary.json',
        artifacts: 'weekly_artifact_index.md',
    };
    return files.find((file) => file.name === preferredNames[tab]) ?? files[0];
};

const ResultsDashboard = () => {
    const [files, setFiles] = useState<ResultFile[]>([]);
    const [activeTab, setActiveTab] = useState<ResultTab>('summary');
    const [selectedFile, setSelectedFile] = useState<ResultFile>();
    const [content, setContent] = useState('');
    const [metrics, setMetrics] = useState<EvaluationSummary>({});
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const groupedFiles = useMemo(() => {
        const groups: Record<ResultTab, ResultFile[]> = { summary: [], report: [], evaluation: [], artifacts: [] };
        files.forEach((file) => groups[categorizeResult(file.name)].push(file));
        return groups;
    }, [files]);

    useEffect(() => {
        const fetchResultFiles = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await api.get('/api/notes/section-files?section=results');
                const nextFiles: ResultFile[] = response.data.files ?? [];
                setFiles(nextFiles);
                setSelectedFile(getPreferredResult('summary', nextFiles.filter((file) => categorizeResult(file.name) === 'summary')));

                const metricFile = nextFiles.find((file) => file.name === 'cumulative_evaluation_summary.json');
                if (metricFile) {
                    const metricResponse = await api.get(`/api/notes/file?path=${encodeURIComponent(metricFile.path)}`);
                    setMetrics(JSON.parse(metricResponse.data.content));
                }
            } catch {
                setError('연구 결과를 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchResultFiles();
    }, []);

    useEffect(() => {
        if (!selectedFile) return;
        const fetchContent = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await api.get(`/api/notes/file?path=${encodeURIComponent(selectedFile.path)}`);
                setContent(response.data.content ?? '');
            } catch {
                setContent('');
                setError('결과 문서를 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [selectedFile]);

    const handleTabChange = (tab: ResultTab) => {
        setActiveTab(tab);
        setSelectedFile(getPreferredResult(tab, groupedFiles[tab]));
    };

    const extension = selectedFile?.name.split('.').at(-1)?.toLowerCase();
    const decisionCounts = metrics.decision_counts ?? {};

    return (
        <div className="results-dashboard">
            <header className="results-header">
                <div><h1>연구 결과</h1><p>누적 성과와 최종 산출물을 한곳에서 확인합니다.</p></div>
            </header>

            <section className="results-metrics" aria-label="핵심 연구 지표">
                <div><span>누적 평가</span><strong>{metrics.total_records ?? '-'}</strong><small>건</small></div>
                <div><span>평균 점수</span><strong>{metrics.average_score ?? '-'}</strong><small>점</small></div>
                <div><span>즉시 사용</span><strong>{decisionCounts.use ?? '-'}</strong><small>건</small></div>
                <div><span>수정 후 사용</span><strong>{decisionCounts.revise_then_use ?? '-'}</strong><small>건</small></div>
            </section>

            <nav className="results-tabs" aria-label="연구 결과 구분">
                {TABS.map((tab) => (
                    <button key={tab.id} className={activeTab === tab.id ? 'active' : ''}
                        disabled={groupedFiles[tab.id].length === 0} onClick={() => handleTabChange(tab.id)}>
                        {tab.label}<span>{groupedFiles[tab.id].length}</span>
                    </button>
                ))}
            </nav>

            <div className="results-toolbar">
                <label><span>문서 선택</span>
                    <select value={selectedFile?.path ?? ''}
                        onChange={(event) => setSelectedFile(files.find((file) => file.path === event.target.value))}>
                        {groupedFiles[activeTab].map((file) => (
                            <option key={file.path} value={file.path}>{FILE_LABELS[file.name] ?? file.name}</option>
                        ))}
                    </select>
                </label>
            </div>

            <main className="results-content">
                {isLoading && <div className="results-message">결과를 불러오는 중입니다...</div>}
                {!isLoading && error && <div className="results-message error">{error}</div>}
                {!isLoading && !error && selectedFile && extension === 'md' && (
                    <article className="results-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown></article>
                )}
                {!isLoading && !error && selectedFile && extension !== 'md' && <pre className="results-code">{content}</pre>}
            </main>
        </div>
    );
};

export default ResultsDashboard;
