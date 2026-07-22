import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../services/api';

const PromptList = () => {
    const [files, setFiles] = useState<string[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
    const [fileContent, setFileContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isContentLoading, setIsContentLoading] = useState(false);

    useEffect(() => {
        const fetchFiles = async () => {
            try {
                const res = await api.get('/api/notes/prompts');
                if (res.data.status === 'success') {
                    setFiles(res.data.files);
                    if (res.data.files.length > 0) {
                        setSelectedFile(res.data.files[0]);
                    }
                }
            } catch (error) {
                console.error("프롬프트 목록 로드 실패", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchFiles();
    }, []);

    useEffect(() => {
        if (!selectedFile) return;
        const fetchContent = async () => {
            setIsContentLoading(true);
            try {
                const res = await api.get(`/api/notes/file?path=Prompts/${encodeURIComponent(selectedFile)}`);
                if (res.data.status === 'success') {
                    setFileContent(res.data.content);
                } else {
                    setFileContent('파일을 찾을 수 없습니다.');
                }
            } catch (error) {
                setFileContent('파일 로드 실패');
            } finally {
                setIsContentLoading(false);
            }
        };
        fetchContent();
    }, [selectedFile]);

    if (isLoading) return <div style={{ padding: '2rem' }}>데이터를 불러오는 중입니다...</div>;

    return (
        <div style={{ display: 'flex', height: '100%', backgroundColor: '#f8fafc' }}>
            <div style={{ width: '280px', borderRight: '1px solid #e2e8f0', backgroundColor: 'white', overflowY: 'auto' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>프롬프트 파일</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {files.map((file) => (
                        <button 
                            key={file} 
                            onClick={() => setSelectedFile(file)}
                            style={{ 
                                padding: '0.8rem 1rem', 
                                border: 'none',
                                borderBottom: '1px solid #e2e8f0', 
                                cursor: 'pointer',
                                backgroundColor: selectedFile === file ? '#eff6ff' : 'white',
                                color: selectedFile === file ? '#1d4ed8' : '#334155',
                                fontWeight: selectedFile === file ? 'bold' : 'normal',
                                textAlign: 'left',
                                transition: 'background-color 0.2s',
                                wordBreak: 'break-all'
                            }}
                        >
                            {file}
                        </button>
                    ))}
                </div>
            </div>

            <div style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto', padding: '2rem' }}>
                {isContentLoading ? (
                    <div style={{ color: '#64748b' }}>문서를 불러오는 중입니다...</div>
                ) : (
                    <div style={{ maxWidth: '800px', margin: '0 auto', color: '#334155', lineHeight: '1.6' }}>
                        <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                                h1: ({node, ...props}) => <h1 style={{ borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem', color: '#1e293b' }} {...props} />,
                                h2: ({node, ...props}) => <h2 style={{ marginTop: '2rem', color: '#334155' }} {...props} />,
                                h3: ({node, ...props}) => <h3 style={{ marginTop: '1.5rem', color: '#475569' }} {...props} />,
                                ul: ({node, ...props}) => <ul style={{ paddingLeft: '1.5rem', marginBottom: '1rem' }} {...props} />,
                                li: ({node, ...props}) => <li style={{ marginBottom: '0.3rem' }} {...props} />,
                                code: ({node, ...props}) => <code style={{ backgroundColor: '#f1f5f9', padding: '0.2rem 0.4rem', borderRadius: '4px', fontSize: '0.9em' }} {...props} />,
                                pre: ({node, ...props}) => <pre style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', overflowX: 'auto', border: '1px solid #e2e8f0' }} {...props} />
                            }}
                        >
                            {fileContent}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PromptList;
