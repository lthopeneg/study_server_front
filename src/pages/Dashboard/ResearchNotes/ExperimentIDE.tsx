import { useEffect, useMemo, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../services/api';
import StructuredDataViewer from './StructuredDataViewer';

type ExperimentTab = 'overview' | 'results' | 'artifacts' | 'logs';

interface Experiment { id: string; title: string; }

const TABS: { id: ExperimentTab; label: string }[] = [
    { id: 'overview', label: '개요' },
    { id: 'results', label: '결과' },
    { id: 'artifacts', label: '산출물' },
    { id: 'logs', label: '실행 기록' },
];

const WEEK_TITLES: Record<number, string> = {
    1: '프롬프트 구조', 2: '출력 규칙', 3: '하네스 상태', 4: '검토 흐름',
    5: '분리 프롬프트', 6: '품질 하네스', 7: '수정 파이프라인', 8: '프로세스 표준화',
    9: '재검토 반복', 10: '릴리스 패키지', 11: '최종 제출 준비', 12: '난이도 상태 테스트',
    13: 'CWE 교차 난이도 테스트', 14: '컨텍스트 상태 수정', 15: '문제 유형 추천',
    16: '외부 유형 검증', 17: '확장 CWE 파이프라인',
};

const getWeekNumber = (id: string) => Number(id.match(/^week(\d+)_/)?.[1] ?? -1);
const formatExperimentTitle = (id: string) => {
    const week = getWeekNumber(id);
    return week > 0 ? `${week}주차 · ${WEEK_TITLES[week] ?? '실험'}` : id.replaceAll('_', ' ');
};
const isReadableFile = (path: string) => /\.(md|txt|json|csv|py|html|ya?ml)$/i.test(path)
    && !path.split('/').includes('__pycache__');
const categorizeFile = (path: string): ExperimentTab => {
    const normalized = path.toLowerCase();
    const parts = normalized.split('/');
    const rootName = parts.at(-1);
    const topDirectory = parts[0];
    if (rootName === 'readme.md' || rootName === 'input_conditions.md') return 'overview';
    if (rootName === 'summary.md' || ['evaluation', 'review', 'reviewer'].includes(topDirectory)) return 'results';
    if (['logs', 'pipeline', 'states'].includes(topDirectory) || normalized.endsWith('.py')) return 'logs';
    return 'artifacts';
};
const getPreferredFile = (tab: ExperimentTab, tabFiles: string[]) => {
    if (tab === 'overview') return tabFiles.find((file) => file.toLowerCase() === 'readme.md') ?? tabFiles[0] ?? '';
    if (tab === 'results') return tabFiles.find((file) => file.toLowerCase() === 'summary.md') ?? tabFiles[0] ?? '';
    return tabFiles[0] ?? '';
};

const ExperimentIDE = () => {
    const [experiments, setExperiments] = useState<Experiment[]>([]);
    const [selectedExperiment, setSelectedExperiment] = useState('');
    const [files, setFiles] = useState<string[]>([]);
    const [activeTab, setActiveTab] = useState<ExperimentTab>('overview');
    const [selectedFile, setSelectedFile] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    const groupedFiles = useMemo(() => {
        const groups: Record<ExperimentTab, string[]> = { overview: [], results: [], artifacts: [], logs: [] };
        files.filter(isReadableFile).forEach((file) => groups[categorizeFile(file)].push(file));
        Object.values(groups).forEach((group) => group.sort((a, b) => a.localeCompare(b)));
        return groups;
    }, [files]);

    useEffect(() => {
        const fetchExperiments = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await api.get('/api/notes/experiments');
                const nextExperiments = ((response.data.experiments ?? []) as Experiment[])
                    .filter((experiment) => /^week\d+_/.test(experiment.id))
                    .sort((a, b) => getWeekNumber(b.id) - getWeekNumber(a.id));
                setExperiments(nextExperiments);
                setSelectedExperiment(nextExperiments[0]?.id ?? '');
            } catch {
                setError('실험 목록을 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchExperiments();
    }, []);

    useEffect(() => {
        if (!selectedExperiment) return;
        const fetchFiles = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await api.get(`/api/notes/experiment_files?id=${encodeURIComponent(selectedExperiment)}`);
                const nextFiles: string[] = response.data.files ?? [];
                const overviewFiles = nextFiles.filter(isReadableFile).filter((file) => categorizeFile(file) === 'overview');
                setFiles(nextFiles);
                setActiveTab('overview');
                setSelectedFile(getPreferredFile('overview', overviewFiles));
            } catch {
                setFiles([]);
                setError('실험 파일 목록을 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchFiles();
    }, [selectedExperiment]);

    useEffect(() => {
        if (!selectedExperiment || !selectedFile) return;
        const fetchContent = async () => {
            setIsLoading(true);
            setError('');
            try {
                const path = `Experiments/${selectedExperiment}/${selectedFile}`;
                const response = await api.get(`/api/notes/file?path=${encodeURIComponent(path)}`);
                setFileContent(response.data.content ?? '');
            } catch {
                setFileContent('');
                setError('파일 내용을 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchContent();
    }, [selectedExperiment, selectedFile]);

    const handleExperimentChange = (nextExperiment: string) => {
        setSelectedFile('');
        setFileContent('');
        setSelectedExperiment(nextExperiment);
    };

    const handleTabChange = (nextTab: ExperimentTab) => {
        setActiveTab(nextTab);
        setSelectedFile(getPreferredFile(nextTab, groupedFiles[nextTab]));
    };

    const selectedExtension = selectedFile.split('.').at(-1)?.toLowerCase();
    return (
        <div className="experiment-browser">
            <header className="experiment-header">
                <div>
                    <h1>{selectedExperiment ? formatExperimentTitle(selectedExperiment) : '실험 자료'}</h1>
                    <p>실험의 과정과 결과를 구분해서 확인합니다.</p>
                </div>
                <label className="experiment-select">
                    <span>실험 선택</span>
                    <select value={selectedExperiment} onChange={(event) => handleExperimentChange(event.target.value)}>
                        {experiments.map((experiment) => (
                            <option key={experiment.id} value={experiment.id}>{formatExperimentTitle(experiment.id)}</option>
                        ))}
                    </select>
                </label>
            </header>

            <nav className="experiment-tabs" aria-label="실험 자료 구분">
                {TABS.map((tab) => (
                    <button key={tab.id} className={activeTab === tab.id ? 'active' : ''}
                        disabled={groupedFiles[tab.id].length === 0} onClick={() => handleTabChange(tab.id)}>
                        {tab.label}<span>{groupedFiles[tab.id].length}</span>
                    </button>
                ))}
            </nav>

            <div className="experiment-toolbar">
                <label>
                    <span>파일 선택</span>
                    <select value={selectedFile} onChange={(event) => setSelectedFile(event.target.value)} disabled={!selectedFile}>
                        {groupedFiles[activeTab].map((file) => (
                            <option key={file} value={file}>{file.replaceAll('_', ' ')}</option>
                        ))}
                    </select>
                </label>
            </div>

            <main className="experiment-content">
                {isLoading && <div className="experiment-message">자료를 불러오는 중입니다...</div>}
                {!isLoading && error && <div className="experiment-message error">{error}</div>}
                {!isLoading && !error && !selectedFile && <div className="experiment-message">이 구분에 표시할 파일이 없습니다.</div>}
                {!isLoading && !error && selectedFile && selectedExtension === 'md' && (
                    <article className="experiment-markdown"><ReactMarkdown remarkPlugins={[remarkGfm]}>{fileContent}</ReactMarkdown></article>
                )}
                {!isLoading && !error && selectedFile && (selectedExtension === 'json' || selectedExtension === 'csv') && (
                    <StructuredDataViewer content={fileContent} type={selectedExtension} />
                )}
                {!isLoading && !error && selectedFile && !['md', 'json', 'csv'].includes(selectedExtension ?? '') && (
                    <pre className="experiment-code">{fileContent}</pre>
                )}
            </main>
        </div>
    );
};

export default ExperimentIDE;
