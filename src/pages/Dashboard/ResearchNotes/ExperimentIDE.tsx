import React, { useState, useEffect } from 'react';
import Editor from '@monaco-editor/react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../services/api';

const ExperimentIDE = () => {
    const [experiments, setExperiments] = useState<any[]>([]);
    const [selectedExpId, setSelectedExpId] = useState<string>('');

    const [availableTabs, setAvailableTabs] = useState<{id: string, label: string, files: string[]}[]>([]);
    const [activeTab, setActiveTab] = useState<string>('');
    const [selectedFileMap, setSelectedFileMap] = useState<{[tabId: string]: string}>({});
    
    const [fileContent, setFileContent] = useState<string>('');
    const [output, setOutput] = useState<string>('');
    const [isRunning, setIsRunning] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        const fetchExperiments = async () => {
            try {
                const res = await api.get('/api/notes/experiments');
                if (res.data.status === 'success') {
                    const exps = res.data.experiments;
                    setExperiments(exps);
                    if (exps.length > 0) setSelectedExpId(exps[0].id);
                }
            } catch (error) {
                console.error("실험 목록 불러오기 실패:", error);
            }
        };
        fetchExperiments();
    }, []);

    useEffect(() => {
        if (!selectedExpId) return;
        const fetchFilesList = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/api/notes/experiment_files?id=${selectedExpId}`);
                if (res.data.status === 'success') {
                    const files = res.data.files as string[];
                    categorizeFiles(files);
                }
            } catch (error) {
                console.error("파일 목록 불러오기 실패:", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFilesList();
    }, [selectedExpId]);

    const categorizeFiles = (fileList: string[]) => {
        const tabs: {id: string, label: string, files: string[]}[] = [];

        const summaryFiles = fileList.filter(f => f.toLowerCase() === 'summary.md');
        if (summaryFiles.length > 0) tabs.push({id: 'summary', label: '📝 요약', files: summaryFiles});
        
        const promptFiles = fileList.filter(f => f.includes('input') || f.includes('dataset') || f.includes('docs') || f.includes('standards'));
        if (promptFiles.length > 0) tabs.push({id: 'prompt', label: '🤖 설계/입력', files: promptFiles});

        const codeFiles = fileList.filter(f => f.endsWith('.py') || f.endsWith('.html'));
        if (codeFiles.length > 0) tabs.push({id: 'code', label: '💻 코드', files: codeFiles});

        const probFiles = fileList.filter(f => f.startsWith('problem') && f.endsWith('.md'));
        if (probFiles.length > 0) tabs.push({id: 'problem', label: '❓ 문제 설명', files: probFiles});

        const logFiles = fileList.filter(f => f.startsWith('logs') && (f.endsWith('.json') || f.endsWith('.csv') || f.endsWith('.txt')));
        if (logFiles.length > 0) tabs.push({id: 'logs', label: '📋 검증 결과', files: logFiles});

        const readmeFiles = fileList.filter(f => f.toLowerCase() === 'readme.md');
        if (readmeFiles.length > 0) tabs.push({id: 'readme', label: '📖 README', files: readmeFiles});

        setAvailableTabs(tabs);

        if (tabs.length > 0) {
            setActiveTab(tabs[0].id);
            const initialMap: any = {};
            tabs.forEach(t => { initialMap[t.id] = t.files[0]; });
            setSelectedFileMap(initialMap);
        } else {
            setActiveTab('');
            setSelectedFileMap({});
            setFileContent('이 실험 폴더에는 확인 가능한 파일이 없습니다.');
        }
    };

    useEffect(() => {
        if (!selectedExpId || !activeTab) return;
        const targetFile = selectedFileMap[activeTab];
        if (!targetFile) {
            if (activeTab !== 'runtime_log') {
                setFileContent('');
            }
            return;
        }

        const loadContent = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/api/notes/file?path=Experiments/${selectedExpId}/${encodeURIComponent(targetFile)}`);
                if (res.data.status === 'success') {
                    setFileContent(res.data.content);
                } else {
                    setFileContent('파일 내용을 불러올 수 없습니다.');
                }
            } catch (error) {
                setFileContent('파일 로드 중 오류 발생');
            } finally {
                setIsLoading(false);
            }
        };
        loadContent();
    }, [selectedExpId, activeTab, selectedFileMap]);

    const handleFileSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedFileMap({
            ...selectedFileMap,
            [activeTab]: e.target.value
        });
    };

    const handleRunCode = async () => {
        if (activeTab !== 'code') return;
        setIsRunning(true);
        setOutput("실행 중...");
        
        if (!availableTabs.find(t => t.id === 'runtime_log')) {
            setAvailableTabs([...availableTabs, {id: 'runtime_log', label: '⚙️ 실행 터미널', files: []}]);
        }
        setActiveTab('runtime_log'); 

        try {
            const res = await api.post('/api/notes/run', { code: fileContent });
            if (res.data.status === 'success') {
                setOutput(res.data.output);
            } else {
                setOutput(`에러 발생: ${res.data.message}`);
            }
        } catch (error: any) {
            setOutput(`서버 통신 오류:\n${error.message}`);
        } finally {
            setIsRunning(false);
        }
    };

    const MarkdownViewer = ({ content }: { content: string }) => (
        <div style={{ padding: '2rem', overflowY: 'auto', color: '#334155', lineHeight: '1.6' }}>
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    h1: ({node, ...props}) => <h1 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e293b' }} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{ marginTop: '2rem', color: '#334155' }} {...props} />,
                    h3: ({node, ...props}) => <h3 style={{ marginTop: '1.5rem', color: '#475569' }} {...props} />,
                    ul: ({node, ...props}) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
                    li: ({node, ...props}) => <li style={{ marginBottom: '0.3rem' }} {...props} />,
                    code: ({node, ...props}) => <code style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.9em' }} {...props} />,
                    table: ({node, ...props}) => (
                        <div style={{ overflowX: 'auto', marginBottom: '1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <table style={{ borderCollapse: 'collapse', width: '100%', backgroundColor: 'white', textAlign: 'left' }} {...props} />
                        </div>
                    ),
                    th: ({node, ...props}) => <th style={{ borderBottom: '2px solid #e2e8f0', padding: '12px 16px', backgroundColor: '#f8fafc', color: '#1e293b', fontWeight: 'bold', whiteSpace: 'nowrap' }} {...props} />,
                    td: ({node, ...props}) => <td style={{ borderBottom: '1px solid #e2e8f0', padding: '12px 16px', color: '#475569', wordBreak: 'keep-all' }} {...props} />,
                    pre: ({node, ...props}) => <pre style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', overflowX: 'auto', border: '1px solid #e2e8f0' }} {...props} />
                }}
            >
                {content}
            </ReactMarkdown>
        </div>
    );

    return (
        <div style={{ display: 'flex', height: '100%', backgroundColor: '#f8fafc' }}>
            <div style={{ width: '220px', borderRight: '1px solid #e2e8f0', padding: '1rem', backgroundColor: 'white', overflowY: 'auto' }}>
                <h3 style={{ margin: '0 0 1rem 0', color: '#1e293b', fontSize: '1rem' }}>🔬 실험 이력 목록</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {experiments.map(exp => (
                        <button
                            key={exp.id}
                            onClick={() => setSelectedExpId(exp.id)}
                            style={{
                                textAlign: 'left',
                                padding: '0.6rem 0.8rem',
                                border: 'none',
                                borderRadius: '6px',
                                backgroundColor: selectedExpId === exp.id ? '#e0f2fe' : 'transparent',
                                color: selectedExpId === exp.id ? '#0284c7' : '#475569',
                                fontWeight: selectedExpId === exp.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '0.85rem',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                            }}
                        >
                            {exp.title}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                <div style={{ display: 'flex', gap: '0.2rem', padding: '1rem 1rem 0 1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', overflowX: 'auto' }}>
                    {availableTabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                padding: '0.8rem 1.5rem',
                                border: 'none',
                                backgroundColor: activeTab === tab.id ? 'white' : '#f1f5f9',
                                color: activeTab === tab.id ? '#3b82f6' : '#64748b',
                                fontWeight: activeTab === tab.id ? 'bold' : 'normal',
                                cursor: 'pointer',
                                borderTopLeftRadius: '8px',
                                borderTopRightRadius: '8px',
                                borderBottom: activeTab === tab.id ? '2px solid white' : '1px solid #e2e8f0',
                                transition: 'all 0.2s',
                                marginBottom: '-1px',
                                zIndex: activeTab === tab.id ? 1 : 0,
                                position: 'relative',
                                whiteSpace: 'nowrap'
                            }}
                        >
                            {tab.label}
                        </button>
                    ))}
                    
                    <div style={{ flex: 1 }} />
                    
                    {activeTab === 'code' && (
                        <button
                            onClick={handleRunCode}
                            disabled={isRunning || isLoading}
                            style={{
                                marginBottom: '0.5rem',
                                padding: '0.5rem 1.5rem',
                                backgroundColor: isRunning ? '#94a3b8' : '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                fontWeight: 'bold',
                                cursor: isRunning || isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem'
                            }}
                        >
                            {isRunning ? '⏳ 실행 중...' : '▶ 실행 (Run)'}
                        </button>
                    )}
                </div>

                {activeTab && activeTab !== 'runtime_log' && availableTabs.find(t => t.id === activeTab)?.files && (availableTabs.find(t => t.id === activeTab)!.files.length > 1) && (
                    <div style={{ padding: '0.5rem 1rem', backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 'bold' }}>파일 선택:</span>
                        <select 
                            value={selectedFileMap[activeTab] || ''} 
                            onChange={handleFileSelectChange}
                            style={{ padding: '0.3rem', borderRadius: '4px', border: '1px solid #cbd5e1', outline: 'none', color: '#334155' }}
                        >
                            {availableTabs.find(t => t.id === activeTab)!.files.map(f => (
                                <option key={f} value={f}>{f}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div style={{ flex: 1, backgroundColor: 'white', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    {isLoading ? (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
                            파일을 불러오는 중입니다...
                        </div>
                    ) : activeTab === 'runtime_log' ? (
                        <div style={{ flex: 1, padding: '1rem', backgroundColor: '#1e1e1e', color: '#d4d4d4', overflowY: 'auto', fontFamily: 'monospace' }}>
                            <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{output}</pre>
                        </div>
                    ) : activeTab === 'code' ? (
                        <div style={{ flex: 1 }}>
                            <Editor
                                height="100%"
                                language="python"
                                theme="vs-dark"
                                value={fileContent}
                                onChange={(value) => setFileContent(value || '')}
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                    wordWrap: 'on'
                                }}
                            />
                        </div>
                    ) : selectedFileMap[activeTab]?.endsWith('.json') || selectedFileMap[activeTab]?.endsWith('.csv') || selectedFileMap[activeTab]?.endsWith('.txt') ? (
                        <div style={{ padding: '2rem', overflowY: 'auto' }}>
                            <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'monospace', color: '#334155' }}>
                                {fileContent}
                            </pre>
                        </div>
                    ) : activeTab ? (
                        <MarkdownViewer content={fileContent} />
                    ) : (
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#94a3b8' }}>
                            선택된 실험 데이터가 없습니다.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ExperimentIDE;
