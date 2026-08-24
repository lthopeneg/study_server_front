import { useEffect, useState } from 'react';
import { api } from '../../../services/api';
import NotesDashboard from './NotesDashboard';

type ResearchSection = 'notes' | 'results';

interface ResearchFile {
    name: string;
    path: string;
}

interface ResearchFileBrowserProps {
    section: ResearchSection;
    title: string;
    description: string;
}

const getNoteOrder = (fileName: string) => {
    const match = fileName.match(/^(\d+)_/);
    return match ? Number(match[1]) : -1;
};

const getFileLabel = (file: ResearchFile, section: ResearchSection) => {
    if (section !== 'notes') return file.name;

    const match = file.name.match(/^\d+_(\d+월\s+\d+주차)(?:\.[^.]+)?$/);
    return match?.[1] ?? file.name;
};

const ResearchFileBrowser = ({ section, title, description }: ResearchFileBrowserProps) => {
    const [files, setFiles] = useState<ResearchFile[]>([]);
    const [selectedPath, setSelectedPath] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchFiles = async () => {
            setIsLoading(true);
            setError('');
            try {
                const response = await api.get(`/api/notes/section-files?section=${section}`);
                const responseFiles: ResearchFile[] = response.data.files ?? [];
                const nextFiles = section === 'notes'
                    ? [...responseFiles].sort((a, b) => getNoteOrder(b.name) - getNoteOrder(a.name))
                    : responseFiles;
                setFiles(nextFiles);
                setSelectedPath(nextFiles[0]?.path ?? '');
            } catch {
                setFiles([]);
                setSelectedPath('');
                setError('자료 목록을 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchFiles();
    }, [section]);

    return (
        <div className="research-file-browser">
            <header className="research-file-header">
                <div>
                    <h1>{title}</h1>
                    <p>{description}</p>
                </div>
                {!isLoading && files.length > 0 && (
                    <label className="research-file-select">
                        <span>문서 선택</span>
                        <select value={selectedPath} onChange={(event) => setSelectedPath(event.target.value)}>
                            {files.map((file) => (
                                <option key={file.path} value={file.path}>{getFileLabel(file, section)}</option>
                            ))}
                        </select>
                    </label>
                )}
            </header>

            {isLoading && <div className="research-file-message">자료 목록을 불러오는 중입니다...</div>}
            {!isLoading && error && <div className="research-file-message error">{error}</div>}
            {!isLoading && !error && !selectedPath && <div className="research-file-message">표시할 자료가 없습니다.</div>}
            {!isLoading && selectedPath && (
                <div className="research-file-content">
                    <NotesDashboard filePath={selectedPath} />
                </div>
            )}
        </div>
    );
};

export default ResearchFileBrowser;
