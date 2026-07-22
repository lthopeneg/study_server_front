import React, { useState, useEffect } from 'react';
import { api } from '../../../services/api';

const MetricsDashboard = () => {
    const [data, setData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMetrics = async () => {
            try {
                const res = await api.get('/api/notes/file?path=Reports/cumulative_evaluation_summary.json');
                if (res.data.status === 'success') {
                    setData(JSON.parse(res.data.content));
                }
            } catch (error) {
                console.error("지표 로드 실패", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchMetrics();
    }, []);

    if (isLoading) return <div style={{ padding: '2rem' }}>데이터를 불러오는 중입니다...</div>;
    if (!data) return <div style={{ padding: '2rem' }}>데이터가 없습니다.</div>;

    const { total_records, average_score, decision_counts, cwe_average_scores } = data;

    return (
        <div style={{ padding: '2rem', backgroundColor: 'white', minHeight: '100%', overflowY: 'auto' }}>
            <h2 style={{ color: '#1e293b', borderBottom: '2px solid #e2e8f0', paddingBottom: '0.5rem' }}>핵심 품질 지표</h2>
            
            <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem' }}>
                <div style={{ flex: 1, padding: '1.5rem', backgroundColor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#166534', fontWeight: 'bold' }}>총 누적 평가 레코드</div>
                    <div style={{ fontSize: '2.5rem', color: '#15803d', fontWeight: '900', marginTop: '0.5rem' }}>{total_records}건</div>
                </div>
                <div style={{ flex: 1, padding: '1.5rem', backgroundColor: '#eff6ff', borderRadius: '8px', border: '1px solid #bfdbfe', textAlign: 'center' }}>
                    <div style={{ fontSize: '0.9rem', color: '#1e40af', fontWeight: 'bold' }}>전체 평균 점수</div>
                    <div style={{ fontSize: '2.5rem', color: '#1d4ed8', fontWeight: '900', marginTop: '0.5rem' }}>{average_score.toFixed(2)}점</div>
                </div>
            </div>

            <div style={{ display: 'flex', gap: '2rem', marginTop: '2rem' }}>
                <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#334155' }}>판정 결과 비율</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <tbody>
                            {Object.entries(decision_counts || {}).map(([key, count]: any) => (
                                <tr key={key} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '0.8rem', color: '#475569', fontWeight: 'bold' }}>{key}</td>
                                    <td style={{ padding: '0.8rem', textAlign: 'right', color: '#0f172a' }}>{count}건</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ flex: 1 }}>
                    <h3 style={{ color: '#334155' }}>CWE별 평균 점수</h3>
                    <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '1rem' }}>
                        <tbody>
                            {Object.entries(cwe_average_scores || {}).map(([cwe, score]: any) => (
                                <tr key={cwe} style={{ borderBottom: '1px solid #e2e8f0' }}>
                                    <td style={{ padding: '0.8rem', color: '#475569', fontWeight: 'bold' }}>{cwe}</td>
                                    <td style={{ padding: '0.8rem', textAlign: 'right', color: '#0f172a' }}>{Number(score).toFixed(2)}점</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default MetricsDashboard;
