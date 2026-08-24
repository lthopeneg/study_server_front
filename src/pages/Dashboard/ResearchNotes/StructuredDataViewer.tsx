import { useMemo } from 'react';

type DataValue = string | number | boolean | null | DataValue[] | { [key: string]: DataValue };
type DataRecord = Record<string, DataValue>;

interface StructuredDataViewerProps {
    content: string;
    type: 'json' | 'csv';
}

const LABELS: Record<string, string> = {
    id: '식별자', source: '출처', week: '주차', cwe: 'CWE', type: '문제 유형',
    score: '점수', decision: '판정', finding: '검토 의견', path: '파일 경로',
    size: '크기', suffix: '형식', total_records: '누적 평가', average_score: '평균 점수',
    decision_counts: '판정별 건수', cwe_average_scores: 'CWE별 평균 점수',
    type_average_scores: '문제 유형별 평균 점수', file_count: '전체 파일 수', roots: '최상위 폴더',
    files: '파일 목록', project: '프로젝트',
};

const VALUE_LABELS: Record<string, string> = {
    use: '즉시 사용', revise_then_use: '수정 후 사용', regenerate: '재생성',
    line_selection: '취약 코드 선택형', secure_blank: '보완 코드 빈칸형', combined: '통합형',
    matched: '일치', none: '특이사항 없음', supplemental: '추가 데이터',
};

const formatLabel = (value: string) => LABELS[value] ?? value.replaceAll('_', ' ');
const formatScalar = (value: DataValue) => {
    if (value === null || value === '') return '-';
    if (typeof value === 'boolean') return value ? '예' : '아니오';
    if (typeof value === 'string') return VALUE_LABELS[value] ?? value;
    return String(value);
};

const parseCsv = (text: string): DataRecord[] => {
    const rows: string[][] = [];
    let row: string[] = [];
    let cell = '';
    let quoted = false;

    for (let index = 0; index < text.length; index += 1) {
        const character = text[index];
        const nextCharacter = text[index + 1];
        if (character === '"' && quoted && nextCharacter === '"') {
            cell += '"';
            index += 1;
        } else if (character === '"') {
            quoted = !quoted;
        } else if (character === ',' && !quoted) {
            row.push(cell.trim());
            cell = '';
        } else if ((character === '\n' || character === '\r') && !quoted) {
            if (character === '\r' && nextCharacter === '\n') index += 1;
            row.push(cell.trim());
            if (row.some(Boolean)) rows.push(row);
            row = [];
            cell = '';
        } else {
            cell += character;
        }
    }
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
    if (rows.length < 2) return [];

    const headers = rows[0];
    return rows.slice(1).map((values) => Object.fromEntries(
        headers.map((header, index) => [header, values[index] ?? '']),
    ));
};

const DataTable = ({ rows }: { rows: DataRecord[] }) => {
    const columns = Array.from(new Set(rows.flatMap((row) => Object.keys(row))));
    return (
        <div className="structured-table-wrap">
            <table className="structured-table">
                <thead><tr>{columns.map((column) => <th key={column}>{formatLabel(column)}</th>)}</tr></thead>
                <tbody>
                    {rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                            {columns.map((column) => {
                                const value = row[column];
                                const displayValue = typeof value === 'object' && value !== null
                                    ? JSON.stringify(value)
                                    : formatScalar(value);
                                return <td key={column} title={String(displayValue)}>{displayValue}</td>;
                            })}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const JsonObjectView = ({ data }: { data: DataRecord }) => {
    const primitiveEntries = Object.entries(data).filter(([, value]) => typeof value !== 'object' || value === null);
    const nestedEntries = Object.entries(data).filter(([, value]) => typeof value === 'object' && value !== null);

    return (
        <div className="structured-json">
            {primitiveEntries.length > 0 && (
                <section className="structured-summary-grid">
                    {primitiveEntries.map(([key, value]) => (
                        <div key={key}><span>{formatLabel(key)}</span><strong>{formatScalar(value)}</strong></div>
                    ))}
                </section>
            )}
            {nestedEntries.map(([key, value]) => (
                <section className="structured-section" key={key}>
                    <h2>{formatLabel(key)}</h2>
                    {Array.isArray(value) && value.every((item) => typeof item === 'object' && item !== null)
                        ? <DataTable rows={value as DataRecord[]} />
                        : Array.isArray(value)
                            ? <div className="structured-chips">{value.map((item, index) => <span key={index}>{formatScalar(item)}</span>)}</div>
                            : <DataTable rows={Object.entries(value as DataRecord).map(([itemKey, itemValue]) => ({ item: formatLabel(itemKey), value: formatScalar(itemValue) }))} />}
                </section>
            ))}
        </div>
    );
};

const StructuredDataViewer = ({ content, type }: StructuredDataViewerProps) => {
    const parsed = useMemo(() => {
        try {
            return type === 'json' ? JSON.parse(content) as DataValue : parseCsv(content);
        } catch {
            return null;
        }
    }, [content, type]);

    if (parsed === null || (Array.isArray(parsed) && parsed.length === 0)) {
        return <div className="structured-error"><p>구조화할 수 없는 데이터라 원문으로 표시합니다.</p><pre>{content}</pre></div>;
    }
    if (Array.isArray(parsed)) return <div className="structured-data"><DataTable rows={parsed as DataRecord[]} /></div>;
    if (typeof parsed === 'object') return <div className="structured-data"><JsonObjectView data={parsed as DataRecord} /></div>;
    return <div className="structured-data"><strong>{formatScalar(parsed)}</strong></div>;
};

export default StructuredDataViewer;
