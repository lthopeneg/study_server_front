import { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../../services/api';

type ProblemType = 'line_selection' | 'secure_blank';

type ProblemFile = {
    filename: string;
    content: string;
    display_order: number;
};

type ProblemVariant = {
    problem_type: ProblemType;
    hint: string;
    files: ProblemFile[];
};

type ProblemDetail = {
    id: number;
    language: 'Python' | 'C#';
    major_topic: string;
    minor_topic: string;
    difficulty: string;
    scenario: string;
    variants: ProblemVariant[];
};

type GradeVariant = {
    problem_type: ProblemType;
    correct: boolean;
    submitted_count?: number;
    expected_count?: number;
    correct_count?: number;
    total_count?: number;
    answers?: { filename: string; line: number; correct: boolean }[];
};

type GradeResult = {
    correct: boolean;
    variants: GradeVariant[];
};

const difficultyLabels: Record<string, string> = {
    beginner: '초급',
    intermediate: '중급',
    advanced: '고급',
};

const answerKey = (filename: string, line: number) => `${filename}:${line}`;

const ProblemSolver = () => {
    const { problemId } = useParams();
    const navigate = useNavigate();
    const [problem, setProblem] = useState<ProblemDetail | null>(null);
    const [activeType, setActiveType] = useState<ProblemType>('line_selection');
    const [activeFiles, setActiveFiles] = useState<Record<ProblemType, string>>({ line_selection: '', secure_blank: '' });
    const [selectedLines, setSelectedLines] = useState<Record<string, number[]>>({});
    const [blankAnswers, setBlankAnswers] = useState<Record<string, string>>({});
    const [result, setResult] = useState<GradeResult | null>(null);
    const [unlockedHints, setUnlockedHints] = useState<Set<ProblemType>>(() => new Set());
    const [message, setMessage] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchProblem = async () => {
            setIsLoading(true);
            setMessage('');
            try {
                const response = await api.get(`/api/practice/public/problems/${problemId}`);
                const detail = response.data.data as ProblemDetail;
                setProblem(detail);
                const firstFiles = Object.fromEntries(detail.variants.map((variant) => [
                    variant.problem_type,
                    variant.files[0]?.filename ?? '',
                ])) as Record<ProblemType, string>;
                setActiveFiles(firstFiles);
            } catch (error: unknown) {
                const responseMessage = typeof error === 'object' && error !== null && 'response' in error
                    ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                    : undefined;
                setMessage(responseMessage ?? '문제를 불러오지 못했습니다.');
            } finally {
                setIsLoading(false);
            }
        };
        fetchProblem();
    }, [problemId]);

    const variantMap = useMemo(() => new Map(
        problem?.variants.map((variant) => [variant.problem_type, variant]) ?? [],
    ), [problem]);
    const currentVariant = variantMap.get(activeType);
    const currentFile = currentVariant?.files.find((file) => file.filename === activeFiles[activeType])
        ?? currentVariant?.files[0];
    const blankLocations = useMemo(() => {
        const blankVariant = variantMap.get('secure_blank');
        return blankVariant?.files.flatMap((file) => file.content.split('\n').flatMap((line, index) =>
            line.includes('____') ? [{ filename: file.filename, line: index + 1 }] : [],
        )) ?? [];
    }, [variantMap]);

    const toggleLine = (filename: string, line: number) => {
        setResult(null);
        setSelectedLines((current) => {
            const lines = current[filename] ?? [];
            return {
                ...current,
                [filename]: lines.includes(line)
                    ? lines.filter((item) => item !== line)
                    : [...lines, line].sort((a, b) => a - b),
            };
        });
    };

    const submitAnswers = async () => {
        if (!problem) return;
        setIsSubmitting(true);
        setMessage('');
        try {
            const lineVariant = variantMap.get('line_selection');
            const response = await api.post(`/api/practice/public/problems/${problem.id}/submit`, {
                variants: [
                    {
                        problem_type: 'line_selection',
                        answers: lineVariant?.files.flatMap((file) =>
                            (selectedLines[file.filename] ?? []).map((line) => ({ filename: file.filename, line })),
                        ) ?? [],
                    },
                    {
                        problem_type: 'secure_blank',
                        answers: blankLocations.map((location) => ({
                            ...location,
                            answer: blankAnswers[answerKey(location.filename, location.line)] ?? '',
                        })),
                    },
                ],
            });
            const gradeResult = response.data.data as GradeResult;
            setResult(gradeResult);
            setUnlockedHints((current) => new Set([
                ...current,
                ...gradeResult.variants.filter((variant) => !variant.correct).map((variant) => variant.problem_type),
            ]));
        } catch (error: unknown) {
            const responseMessage = typeof error === 'object' && error !== null && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            setMessage(responseMessage ?? '답안을 제출하지 못했습니다.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <div className="practice-status">문제를 불러오고 있습니다.</div>;
    if (!problem) return <div className="practice-status practice-status-denied">{message || '문제를 찾을 수 없습니다.'}</div>;

    const currentResult = result?.variants.find((variant) => variant.problem_type === activeType);

    return (
        <div className="problem-solver">
            <header className="problem-solver-header">
                <button type="button" onClick={() => navigate(-1)}>← 목록으로</button>
                <div>
                    <span>문제 #{problem.id} · {difficultyLabels[problem.difficulty] ?? problem.difficulty}</span>
                    <h1>{problem.major_topic} · {problem.minor_topic}</h1>
                    {problem.scenario && <p>{problem.scenario}</p>}
                </div>
            </header>

            <div className="problem-type-tabs">
                <button type="button" className={activeType === 'line_selection' ? 'active' : ''} onClick={() => setActiveType('line_selection')}>
                    1유형 · 취약한 코드 찾기
                    {result && <em className={result.variants[0].correct ? 'correct' : 'wrong'}>{result.variants[0].correct ? '정답' : '오답'}</em>}
                </button>
                <button type="button" className={activeType === 'secure_blank' ? 'active' : ''} onClick={() => setActiveType('secure_blank')}>
                    2유형 · 빈칸 코드 작성
                    {result && <em className={result.variants[1].correct ? 'correct' : 'wrong'}>{result.variants[1].correct ? '정답' : '오답'}</em>}
                </button>
            </div>

            {currentVariant && currentFile && (
                <div className="problem-editor-workspace problem-solver-workspace">
                    <aside className="problem-file-list" aria-label="문제 파일 목록">
                        <strong>파일</strong>
                        {currentVariant.files.map((file) => (
                            <button
                                type="button"
                                key={file.filename}
                                title={file.filename}
                                className={file.filename === currentFile.filename ? 'active' : ''}
                                onClick={() => setActiveFiles((current) => ({ ...current, [activeType]: file.filename }))}
                            >
                                {file.filename}
                            </button>
                        ))}
                    </aside>

                    <SolutionCodeViewer
                        language={problem.language}
                        value={currentFile.content}
                        selectedLines={selectedLines[currentFile.filename] ?? []}
                        lineSelectable={activeType === 'line_selection'}
                        onToggleLine={(line) => toggleLine(currentFile.filename, line)}
                    />

                    <aside className="problem-solver-sidebar">
                        <section>
                            <strong>힌트</strong>
                            {unlockedHints.has(activeType) ? (
                                <p>{currentVariant.hint || '등록된 힌트가 없습니다.'}</p>
                            ) : (
                                <div className="solver-hint-locked">
                                    <span>한 번 이상 오답을 제출하면 힌트가 공개됩니다.</span>
                                </div>
                            )}
                        </section>
                        <section>
                            <strong>{activeType === 'line_selection' ? '선택한 라인' : '빈칸 정답'}</strong>
                            {activeType === 'line_selection' ? (
                                <SelectedLineSummary files={currentVariant.files} selectedLines={selectedLines} />
                            ) : (
                                <div className="solver-blank-list">
                                    {blankLocations.map((location) => {
                                        const key = answerKey(location.filename, location.line);
                                        const answerResult = currentResult?.answers?.find((item) =>
                                            item.filename === location.filename && item.line === location.line,
                                        );
                                        return (
                                            <label key={key} className={answerResult ? (answerResult.correct ? 'correct' : 'wrong') : ''}>
                                                <span>{location.filename} · {location.line}번 라인</span>
                                                <input
                                                    value={blankAnswers[key] ?? ''}
                                                    onChange={(event) => {
                                                        setResult(null);
                                                        setBlankAnswers((current) => ({ ...current, [key]: event.target.value }));
                                                    }}
                                                    placeholder="정답 입력"
                                                />
                                            </label>
                                        );
                                    })}
                                </div>
                            )}
                        </section>
                    </aside>
                </div>
            )}

            <div className="problem-solver-actions">
                <div>
                    {message && <span className="solver-message error">{message}</span>}
                    {result && (
                        <span className={`solver-message ${result.correct ? 'correct' : 'wrong'}`}>
                            {result.correct ? '두 유형 모두 정답입니다.' : '오답이 있습니다. 유형별 결과를 확인해주세요.'}
                        </span>
                    )}
                </div>
                <button type="button" onClick={submitAnswers} disabled={isSubmitting}>
                    {isSubmitting ? '채점 중...' : '답안 제출'}
                </button>
            </div>
        </div>
    );
};

const SelectedLineSummary = ({ files, selectedLines }: {
    files: ProblemFile[];
    selectedLines: Record<string, number[]>;
}) => {
    const selections = files.flatMap((file) => {
        const lines = selectedLines[file.filename] ?? [];
        return lines.length ? [{ filename: file.filename, lines }] : [];
    });
    if (!selections.length) return <p>코드의 라인 번호를 눌러 선택해주세요.</p>;
    return <ul>{selections.map((item) => <li key={item.filename}>{item.filename} · {item.lines.join(', ')}번</li>)}</ul>;
};

const SolutionCodeViewer = ({ language, value, selectedLines, lineSelectable, onToggleLine }: {
    language: 'Python' | 'C#';
    value: string;
    selectedLines: number[];
    lineSelectable: boolean;
    onToggleLine: (line: number) => void;
}) => {
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
    const decorationRef = useRef<ReturnType<Parameters<OnMount>[0]['createDecorationsCollection']> | null>(null);
    const toggleRef = useRef(onToggleLine);
    const selectableRef = useRef(lineSelectable);

    useEffect(() => {
        toggleRef.current = onToggleLine;
        selectableRef.current = lineSelectable;
    }, [lineSelectable, onToggleLine]);

    useEffect(() => {
        const editor = editorRef.current;
        if (!editor) return;
        decorationRef.current?.clear();
        decorationRef.current = editor.createDecorationsCollection(selectedLines.map((line) => ({
            range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
            options: { isWholeLine: true, className: 'selected-problem-line', linesDecorationsClassName: 'selected-problem-line-gutter' },
        })));
    }, [selectedLines]);

    const handleMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        editor.onMouseDown((event) => {
            if (!selectableRef.current) return;
            const lineTarget = event.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
                || event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN;
            if (lineTarget && event.target.position) toggleRef.current(event.target.position.lineNumber);
        });
    };

    return (
        <div className={`problem-code-editor${lineSelectable ? ' line-selectable' : ''}`}>
            <Editor
                height="560px"
                language={language === 'Python' ? 'python' : 'csharp'}
                value={value}
                onMount={handleMount}
                theme="vs-dark"
                options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbersMinChars: 3,
                    glyphMargin: lineSelectable,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                }}
            />
        </div>
    );
};

export default ProblemSolver;
