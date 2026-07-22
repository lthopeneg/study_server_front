import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../services/api';

interface NotesDashboardProps {
    filePath?: string;
}

const NotesDashboard: React.FC<NotesDashboardProps> = ({ filePath = '연구_진행_지침.md' }) => {
    const [content, setContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const fetchGuideline = async () => {
            setIsLoading(true);
            try {
                const res = await api.get(`/api/notes/file?path=${encodeURIComponent(filePath)}`);
                if (res.data.status === 'success') {
                    setContent(res.data.content);
                } else {
                    setContent('파일을 불러오지 못했습니다: ' + res.data.message);
                }
            } catch (error: any) {
                setContent('파일 로드 중 오류가 발생했습니다.\n' + error.message);
            } finally {
                setIsLoading(false);
            }
        };

        fetchGuideline();
    }, [filePath]);

    return (
        <div style={{ padding: '2rem', height: '100%', overflowY: 'auto', backgroundColor: 'white' }}>
            {isLoading ? (
                <div style={{ color: '#64748b', textAlign: 'center', marginTop: '2rem' }}>
                    문서를 불러오는 중입니다...
                </div>
            ) : (
                <div style={{ 
                    width: '100%', 
                    color: '#334155', 
                    lineHeight: '1.6' 
                }}>
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
                        }}
                    >
                        {content}
                    </ReactMarkdown>
                </div>
            )}
        </div>
    );
};

export default NotesDashboard;
