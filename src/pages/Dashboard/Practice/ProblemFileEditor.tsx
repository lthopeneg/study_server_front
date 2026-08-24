import { useEffect, useMemo, useRef, useState } from 'react';
import Editor, { type OnMount } from '@monaco-editor/react';
import { api } from '../../../services/api';

type ProblemType = 'line_selection' | 'secure_blank';

export type GeneratedVariant = {
    problem_type: ProblemType;
    hint: string;
    files: { filename: string; content: string }[];
    answers: { filename: string; line: number; answer?: string }[];
};

type EditorFile = {
    id: string;
    filename: string;
    content: string;
};

type VariantState = {
    files: EditorFile[];
    activeFileId: string;
    hint: string;
    selectedLines: Record<string, number[]>;
    blankAnswers: Record<string, string>;
};

type ProblemFileEditorProps = {
    language: 'Python' | 'C#';
    majorTopic: string;
    minorTopic: string;
    difficulty: string;
    initialVariants?: GeneratedVariant[];
    creationMethod?: 'manual' | 'ai';
    scenario?: string;
};

let editorFileSequence = 0;

const makeEditorFileId = () => {
    editorFileSequence += 1;
    return `practice-file-${Date.now()}-${editorFileSequence}`;
};

const DEFAULT_FILENAMES = {
    Python: ['app.py', 'service.py', 'utils.py', 'models.py', 'config.py'],
    'C#': ['Program.cs', 'Service.cs', 'Utilities.cs', 'Models.cs', 'Configuration.cs'],
} as const;

const makeFile = (language: 'Python' | 'C#', index: number): EditorFile => ({
    id: makeEditorFileId(),
    filename: DEFAULT_FILENAMES[language][index]
        ?? `File${index + 1}.${language === 'Python' ? 'py' : 'cs'}`,
    content: '',
});

const makeVariant = (language: 'Python' | 'C#'): VariantState => {
    const file = makeFile(language, 0);
    return { files: [file], activeFileId: file.id, hint: '', selectedLines: {}, blankAnswers: {} };
};

const blankKey = (fileId: string, line: number) => `${fileId}:${line}`;

const hydrateVariants = (language: 'Python' | 'C#', generated?: GeneratedVariant[]): Record<ProblemType, VariantState> => {
    const result: Record<ProblemType, VariantState> = {
        line_selection: makeVariant(language),
        secure_blank: makeVariant(language),
    };
    if (!generated) return result;

    generated.forEach((variant) => {
        const files = variant.files.map((file) => ({ ...file, id: makeEditorFileId() }));
        if (files.length === 0) return;
        const fileIdByName = new Map(files.map((file) => [file.filename, file.id]));
        const selectedLines: Record<string, number[]> = {};
        const blankAnswers: Record<string, string> = {};
        variant.answers.forEach((answer) => {
            const fileId = fileIdByName.get(answer.filename);
            if (!fileId) return;
            if (variant.problem_type === 'line_selection') {
                selectedLines[fileId] = [...(selectedLines[fileId] ?? []), answer.line].sort((a, b) => a - b);
            } else {
                blankAnswers[blankKey(fileId, answer.line)] = answer.answer ?? '';
            }
        });
        result[variant.problem_type] = {
            files,
            activeFileId: files[0].id,
            hint: variant.hint,
            selectedLines,
            blankAnswers,
        };
    });
    return result;
};

const ProblemFileEditor = ({
    language,
    majorTopic,
    minorTopic,
    difficulty,
    initialVariants,
    creationMethod = 'manual',
    scenario = '',
}: ProblemFileEditorProps) => {
    const [activeType, setActiveType] = useState<ProblemType>('line_selection');
    const [variants, setVariants] = useState<Record<ProblemType, VariantState>>(
        () => hydrateVariants(language, initialVariants),
    );
    const [message, setMessage] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const currentVariant = variants[activeType];
    const activeFile = currentVariant.files.find((file) => file.id === currentVariant.activeFileId) ?? currentVariant.files[0];

    const updateCurrentVariant = (updater: (variant: VariantState) => VariantState) => {
        setVariants((current) => ({ ...current, [activeType]: updater(current[activeType]) }));
    };

    const updateActiveFile = (updates: Partial<EditorFile>) => {
        updateCurrentVariant((variant) => ({
            ...variant,
            files: variant.files.map((file) => file.id === activeFile.id ? { ...file, ...updates } : file),
        }));
    };

    const addFile = () => {
        updateCurrentVariant((variant) => {
            let index = variant.files.length;
            let file = makeFile(language, index);
            const filenames = new Set(variant.files.map((item) => item.filename));
            while (filenames.has(file.filename)) {
                index += 1;
                file = makeFile(language, index);
            }
            return { ...variant, files: [...variant.files, file], activeFileId: file.id };
        });
    };

    const removeFile = () => {
        if (currentVariant.files.length === 1) {
            setMessage('문제 유형마다 파일이 하나 이상 필요합니다.');
            return;
        }
        updateCurrentVariant((variant) => {
            const files = variant.files.filter((file) => file.id !== activeFile.id);
            const selectedLines = { ...variant.selectedLines };
            delete selectedLines[activeFile.id];
            const blankAnswers = Object.fromEntries(
                Object.entries(variant.blankAnswers).filter(([key]) => !key.startsWith(`${activeFile.id}:`)),
            );
            return { ...variant, files, activeFileId: files[0].id, selectedLines, blankAnswers };
        });
    };

    const renameActiveFile = (filename: string) => updateActiveFile({ filename });

    const toggleLine = (line: number) => {
        if (activeType !== 'line_selection') return;
        updateCurrentVariant((variant) => {
            const currentLines = variant.selectedLines[activeFile.id] ?? [];
            const nextLines = currentLines.includes(line)
                ? currentLines.filter((item) => item !== line)
                : [...currentLines, line].sort((a, b) => a - b);
            return { ...variant, selectedLines: { ...variant.selectedLines, [activeFile.id]: nextLines } };
        });
    };

    const blankLocations = useMemo(() => currentVariant.files.flatMap((file) =>
        file.content.split('\n').flatMap((line, index) => line.includes('____') ? [{ file, line: index + 1 }] : []),
    ), [currentVariant.files]);

    const saveProblem = async () => {
        setMessage('');
        setIsSaving(true);
        try {
            const payload = {
                title: `${minorTopic || majorTopic || language} 문제`,
                scenario,
                language,
                major_topic: majorTopic,
                minor_topic: minorTopic,
                difficulty,
                creation_method: creationMethod,
                variants: (['line_selection', 'secure_blank'] as ProblemType[]).map((problemType) => {
                    const variant = variants[problemType];
                    const answers = problemType === 'line_selection'
                        ? variant.files.flatMap((file) => (variant.selectedLines[file.id] ?? []).map((line) => ({ filename: file.filename, line })))
                        : variant.files.flatMap((file) => file.content.split('\n').flatMap((lineText, index) => {
                            const line = index + 1;
                            if (!lineText.includes('____')) return [];
                            return [{ filename: file.filename, line, answer: variant.blankAnswers[blankKey(file.id, line)] ?? '' }];
                        }));
                    return {
                        problem_type: problemType,
                        hint: variant.hint,
                        files: variant.files.map(({ filename, content }) => ({ filename, content })),
                        answers,
                    };
                }),
            };
            await api.post('/api/practice/problems', payload);
            setMessage('문제 세트가 저장되었습니다. 활성화 전까지 비활성 상태로 유지됩니다.');
        } catch (error: unknown) {
            const responseMessage = typeof error === 'object' && error !== null && 'response' in error
                ? (error as { response?: { data?: { message?: string } } }).response?.data?.message
                : undefined;
            setMessage(responseMessage ?? '문제 세트를 저장하지 못했습니다.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <section className="problem-create-section problem-editor-section">
            <div className="problem-create-section-heading">
                <span>3</span>
                <div>
                    <h2>문제 작성</h2>
                    <p>유형을 전환해도 각 유형에서 작성하던 파일과 정답은 유지됩니다.</p>
                </div>
            </div>

            <div className="problem-type-tabs">
                <button type="button" className={activeType === 'line_selection' ? 'active' : ''} onClick={() => setActiveType('line_selection')}>
                    1유형 · 취약한 코드 찾기
                </button>
                <button type="button" className={activeType === 'secure_blank' ? 'active' : ''} onClick={() => setActiveType('secure_blank')}>
                    2유형 · 빈칸 코드 작성
                </button>
            </div>

            <div className="problem-file-toolbar">
                <input value={activeFile.filename} onChange={(event) => renameActiveFile(event.target.value)} aria-label="현재 파일명" />
                <div>
                    <button type="button" onClick={addFile} title="파일 추가">+</button>
                    <button type="button" onClick={removeFile} title="현재 파일 제거">−</button>
                </div>
            </div>

            <div className="problem-editor-workspace">
                <aside className="problem-file-list" aria-label="문제 파일 목록">
                    <strong>파일</strong>
                    {currentVariant.files.map((file) => (
                        <button
                            type="button"
                            key={file.id}
                            className={file.id === activeFile.id ? 'active' : ''}
                            onClick={() => updateCurrentVariant((variant) => ({ ...variant, activeFileId: file.id }))}
                        >
                            {file.filename || '이름 없는 파일'}
                        </button>
                    ))}
                </aside>

                <CodeEditor
                    language={language}
                    value={activeFile.content}
                    selectedLines={currentVariant.selectedLines[activeFile.id] ?? []}
                    lineSelectable={activeType === 'line_selection'}
                    onChange={(content) => updateActiveFile({ content })}
                    onToggleLine={toggleLine}
                />

                <aside className="problem-answer-sidebar">
                    <label>
                        <span>{activeType === 'line_selection' ? '1유형' : '2유형'} 공통 힌트</span>
                        <textarea
                            rows={6}
                            value={currentVariant.hint}
                            onChange={(event) => updateCurrentVariant((variant) => ({ ...variant, hint: event.target.value }))}
                            placeholder="현재 유형의 모든 파일이 공유할 힌트를 입력하세요"
                        />
                    </label>
                    <div className="problem-answer-panel">
                        <strong>정답</strong>
                        {activeType === 'line_selection' ? (
                            <LineSelectionAnswers variant={currentVariant} />
                        ) : (
                            <BlankAnswers
                                locations={blankLocations}
                                answers={currentVariant.blankAnswers}
                                onChange={(key, answer) => updateCurrentVariant((variant) => ({
                                    ...variant,
                                    blankAnswers: { ...variant.blankAnswers, [key]: answer },
                                }))}
                            />
                        )}
                    </div>
                </aside>
            </div>

            <div className="problem-editor-guide">
                {activeType === 'line_selection'
                    ? '코드 편집기 왼쪽의 라인 번호를 클릭하면 정답으로 선택하거나 해제할 수 있습니다.'
                    : '코드에 언더바 4개(____)를 입력하면 해당 라인의 정답 입력칸이 자동으로 생성됩니다.'}
            </div>

            <div className="problem-create-actions">
                {message && <span className="problem-save-message">{message}</span>}
                <button type="button" className="secondary" onClick={saveProblem} disabled={isSaving}>
                    {isSaving ? '저장 중...' : '저장'}
                </button>
            </div>
        </section>
    );
};

const CodeEditor = ({ language, value, selectedLines, lineSelectable, onChange, onToggleLine }: {
    language: 'Python' | 'C#';
    value: string;
    selectedLines: number[];
    lineSelectable: boolean;
    onChange: (value: string) => void;
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

    const applyDecorations = (editor: Parameters<OnMount>[0], lines: number[]) => {
        decorationRef.current?.clear();
        decorationRef.current = editor.createDecorationsCollection(lines.map((line) => ({
            range: { startLineNumber: line, startColumn: 1, endLineNumber: line, endColumn: 1 },
            options: { isWholeLine: true, className: 'selected-problem-line', linesDecorationsClassName: 'selected-problem-line-gutter' },
        })));
    };

    const handleMount: OnMount = (editor, monaco) => {
        editorRef.current = editor;
        applyDecorations(editor, selectedLines);
        editor.onMouseDown((event) => {
            if (!selectableRef.current) return;
            const isLineTarget = event.target.type === monaco.editor.MouseTargetType.GUTTER_LINE_NUMBERS
                || event.target.type === monaco.editor.MouseTargetType.GUTTER_GLYPH_MARGIN;
            if (isLineTarget && event.target.position) toggleRef.current(event.target.position.lineNumber);
        });
    };

    return (
        <div className={`problem-code-editor${lineSelectable ? ' line-selectable' : ''}`}>
            <Editor
                height="520px"
                language={language === 'Python' ? 'python' : 'csharp'}
                value={value}
                onChange={(nextValue) => onChange(nextValue ?? '')}
                onMount={handleMount}
                theme="vs-dark"
                options={{
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbersMinChars: 3,
                    glyphMargin: lineSelectable,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 4,
                }}
            />
        </div>
    );
};

const LineSelectionAnswers = ({ variant }: { variant: VariantState }) => {
    const answers = variant.files.flatMap((file) => {
        const lines = variant.selectedLines[file.id] ?? [];
        return lines.length > 0 ? [{ filename: file.filename, lines }] : [];
    });
    if (answers.length === 0) return <p>선택된 라인이 없습니다.</p>;
    return <ul>{answers.map((answer) => <li key={answer.filename}><b>{answer.filename}</b> - {answer.lines.join(', ')}번 라인</li>)}</ul>;
};

const BlankAnswers = ({ locations, answers, onChange }: {
    locations: { file: EditorFile; line: number }[];
    answers: Record<string, string>;
    onChange: (key: string, answer: string) => void;
}) => {
    if (locations.length === 0) return <p>코드에 ____ 빈칸을 입력해주세요.</p>;
    return (
        <div className="blank-answer-list">
            {locations.map(({ file, line }) => {
                const key = blankKey(file.id, line);
                return (
                    <label key={key}>
                        <span>{file.filename} - {line}번 라인 정답</span>
                        <textarea rows={3} value={answers[key] ?? ''} onChange={(event) => onChange(key, event.target.value)} />
                    </label>
                );
            })}
        </div>
    );
};

export default ProblemFileEditor;
