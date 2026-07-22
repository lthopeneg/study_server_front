import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { api } from '../../../services/api';

const ProblemBank = () => {
    const [cases, setCases] = useState<any[]>([]);
    const [selectedCaseId, setSelectedCaseId] = useState<string>('');
    const [caseContent, setCaseContent] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isCaseLoading, setIsCaseLoading] = useState(false);

    useEffect(() => {
        const fetchCases = async () => {
            try {
                const res = await api.get('/api/notes/file?path=Experiments/extended_cwe_dataset/extended_cases.json');
                if (res.data.status === 'success') {
                    const parsed = JSON.parse(res.data.content);
                    setCases(parsed);
                    if (parsed.length > 0) {
                        setSelectedCaseId(parsed[0].id);
                    }
                }
            } catch (error) {
                console.error("문제 은행 로드 실패", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchCases();
    }, []);

    useEffect(() => {
        if (!selectedCaseId) return;
        const fetchCaseContent = async () => {
            setIsCaseLoading(true);
            try {
                const res = await api.get(`/api/notes/file?path=Experiments/extended_cwe_dataset/cases/${selectedCaseId}.md`);
                if (res.data.status === 'success') {
                    setCaseContent(res.data.content);
                } else {
                    setCaseContent('마크다운 파일을 찾을 수 없습니다.');
                }
            } catch (error) {
                setCaseContent('마크다운 파일 로드 실패');
            } finally {
                setIsCaseLoading(false);
            }
        };
        fetchCaseContent();
    }, [selectedCaseId]);

    if (isLoading) return <div style={{ padding: '2rem' }}>데이터를 불러오는 중입니다...</div>;

    return (
        <div style={{ display: 'flex', height: '100%', backgroundColor: '#f8fafc' }}>
            {/* 리스트 영역 */}
            <div style={{ width: '320px', borderRight: '1px solid #e2e8f0', backgroundColor: 'white', overflowY: 'auto' }}>
                <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', backgroundColor: '#f8fafc', position: 'sticky', top: 0 }}>
                    <h3 style={{ margin: 0, color: '#1e293b' }}>문제 목록 ({cases.length}건)</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {cases.map((c) => (
                        <div 
                            key={c.id} 
                            onClick={() => setSelectedCaseId(c.id)}
                            style={{ 
                                padding: '1rem', 
                                borderBottom: '1px solid #e2e8f0', 
                                cursor: 'pointer',
                                backgroundColor: selectedCaseId === c.id ? '#eff6ff' : 'white',
                                transition: 'background-color 0.2s'
                            }}
                        >
                            <div style={{ fontWeight: 'bold', color: selectedCaseId === c.id ? '#1d4ed8' : '#334155', marginBottom: '0.3rem' }}>
                                {c.id}
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.8rem', color: '#64748b' }}>
                                <span style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{c.cwe}</span>
                                <span style={{ backgroundColor: '#f1f5f9', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{c.type}</span>
                                <span style={{ backgroundColor: c.decision === 'use' ? '#dcfce7' : '#fef9c3', color: c.decision === 'use' ? '#166534' : '#854d0e', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>{c.decision}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 내용 뷰어 영역 */}
            <div style={{ flex: 1, backgroundColor: 'white', overflowY: 'auto', padding: '2rem' }}>
                {isCaseLoading ? (
                    <div style={{ color: '#64748b' }}>문제를 불러오는 중입니다...</div>
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
                            {caseContent}
                        </ReactMarkdown>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProblemBank;
