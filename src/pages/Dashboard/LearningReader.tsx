import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';

export type LearningSection = {
  id: string;
  title: string;
  kind: 'intro' | 'concept' | 'example' | 'code' | 'checklist' | 'quiz' | 'answer' | 'summary';
  markdown: string;
};

export type LearningBookLesson = {
  id: string;
  order: number;
  title: string;
  subtitle: string;
  estimatedMinutes: number;
  accent: string;
  keyMessage?: string;
  conceptMap?: { title: string; description: string }[];
  pdfFile?: string;
  pageCount?: number;
  sections: LearningSection[];
};

type Props = { courseTitle: string; scenarioMarkdown?: string; lesson: LearningBookLesson };

const renderInline = (text: string): ReactNode[] => {
  const chunks = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^)]+\))/g);
  return chunks.map((chunk, index) => {
    if (chunk.startsWith('`') && chunk.endsWith('`')) return <code key={index}>{chunk.slice(1, -1)}</code>;
    if (chunk.startsWith('**') && chunk.endsWith('**')) return <strong key={index}>{chunk.slice(2, -2)}</strong>;
    const link = chunk.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    if (link) return <a href={link[2]} key={index} rel="noreferrer" target="_blank">{link[1]}</a>;
    return <Fragment key={index}>{chunk}</Fragment>;
  });
};

const MarkdownContent = ({ markdown }: { markdown: string }) => {
  const lines = markdown.trim().split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;

  while (index < lines.length) {
    const line = lines[index].trimEnd();
    if (!line.trim()) { index += 1; continue; }

    if (line.startsWith('```')) {
      const language = line.slice(3).trim();
      const code: string[] = [];
      index += 1;
      while (index < lines.length && !lines[index].startsWith('```')) code.push(lines[index++]);
      index += 1;
      blocks.push(<div className="lesson-code" key={`code-${index}`}><span>{language || 'CODE'}</span><pre><code>{code.join('\n')}</code></pre></div>);
      continue;
    }

    if (line.startsWith('|') && lines[index + 1]?.trim().match(/^\|?[\s:|-]+\|$/)) {
      const rows: string[][] = [];
      rows.push(line.split('|').filter(Boolean).map((cell) => cell.trim()));
      index += 2;
      while (index < lines.length && lines[index].trim().startsWith('|')) {
        rows.push(lines[index].split('|').filter(Boolean).map((cell) => cell.trim()));
        index += 1;
      }
      blocks.push(<div className="lesson-table-wrap" key={`table-${index}`}><table><thead><tr>{rows[0].map((cell) => <th key={cell}>{renderInline(cell)}</th>)}</tr></thead><tbody>{rows.slice(1).map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}>{renderInline(cell)}</td>)}</tr>)}</tbody></table></div>);
      continue;
    }

    if (/^[-*] /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^[-*] /.test(lines[index].trim())) items.push(lines[index++].trim().slice(2));
      blocks.push(<ul key={`ul-${index}`}>{items.map((item) => <li key={item}>{renderInline(item)}</li>)}</ul>);
      continue;
    }

    if (/^\d+\. /.test(line)) {
      const items: string[] = [];
      while (index < lines.length && /^\d+\. /.test(lines[index].trim())) items.push(lines[index++].trim().replace(/^\d+\. /, ''));
      blocks.push(<ol key={`ol-${index}`}>{items.map((item) => <li key={item}>{renderInline(item)}</li>)}</ol>);
      continue;
    }

    if (line.startsWith('> ')) {
      blocks.push(<blockquote key={`quote-${index}`}>{renderInline(line.slice(2))}</blockquote>);
      index += 1;
      continue;
    }

    const paragraph = [line];
    index += 1;
    while (index < lines.length && lines[index].trim() && !/^(```|\||[-*] |\d+\. |> )/.test(lines[index].trim())) paragraph.push(lines[index++].trim());
    blocks.push(<p key={`p-${index}`}>{renderInline(paragraph.join(' '))}</p>);
  }

  return <>{blocks}</>;
};

const LearningReader = ({ courseTitle, scenarioMarkdown, lesson }: Props) => {
  const [fontScale, setFontScale] = useState(1);
  const [tocOpen, setTocOpen] = useState(false);
  const readerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    readerRef.current?.scrollTo({ top: 0 });
  }, [lesson.title]);

  const moveToSection = (id: string) => {
    readerRef.current?.querySelector(`#${CSS.escape(id)}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    setTocOpen(false);
  };

  return (
    <section className="lesson-reader" style={{ '--lesson-accent': lesson.accent, '--reader-scale': fontScale } as CSSProperties}>
      <div className="lesson-reader__toolbar">
        <button type="button" onClick={() => setTocOpen((value) => !value)} aria-expanded={tocOpen}>☰ 목차</button>
        <div className="lesson-reader__tools">
          {lesson.pdfFile && <a href={`/learning-content/foundations/${lesson.pdfFile}`} download>PDF 내려받기</a>}
          <button type="button" onClick={() => setFontScale((value) => Math.max(.9, value - .1))} aria-label="글자 작게">가−</button>
          <span>{Math.round(fontScale * 100)}%</span>
          <button type="button" onClick={() => setFontScale((value) => Math.min(1.2, value + .1))} aria-label="글자 크게">가+</button>
        </div>
      </div>

      {tocOpen && <nav className="lesson-reader__toc" aria-label="교안 목차">
        <strong>이 강의의 목차</strong>
        {lesson.sections.filter((section) => section.kind !== 'answer').map((section, index) => (
          <button type="button" key={section.id} onClick={() => moveToSection(section.id)}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</button>
        ))}
      </nav>}

      <div className="lesson-reader__scroll" ref={readerRef}>
        <article className="lesson-book">
          <header className="lesson-book__cover">
            <span>{courseTitle}</span>
            <p>LESSON {String(lesson.order).padStart(2, '0')}</p>
            <h2>{lesson.title}</h2>
            <strong>{lesson.subtitle}</strong>
            <div><span>SECURECODE SPACE</span><span>예상 학습 {lesson.estimatedMinutes}분</span></div>
          </header>

          <div className="lesson-book__body">
            {lesson.keyMessage && <div className="lesson-key-message"><span>KEY MESSAGE</span><strong>{lesson.keyMessage}</strong></div>}
            {lesson.conceptMap && <div className="lesson-concept-map">{lesson.conceptMap.map((concept) => <div key={concept.title}><span>{concept.title}</span><strong>{concept.description}</strong></div>)}</div>}
            {scenarioMarkdown && <aside className="lesson-scenario"><span>COMMON SCENARIO</span><h3>강의에서 함께 사용할 사례</h3><MarkdownContent markdown={scenarioMarkdown} /></aside>}
            {lesson.sections.map((section, index) => {
              const content = <MarkdownContent markdown={section.markdown} />;
              if (section.kind === 'answer') return <details className="lesson-section lesson-section--answer" id={section.id} key={section.id}><summary>정답과 해설 확인</summary><div>{content}</div></details>;
              return <section className={`lesson-section lesson-section--${section.kind}`} id={section.id} key={section.id}>
                <div className="lesson-section__number">{String(index + 1).padStart(2, '0')}</div>
                <div className="lesson-section__content"><span>{section.kind.toUpperCase()}</span><h3>{section.title}</h3>{content}</div>
              </section>;
            })}
          </div>

          <footer className="lesson-book__end"><span>SECURECODE SPACE</span><strong>이번 강의를 모두 읽었습니다.</strong></footer>
        </article>
      </div>
    </section>
  );
};

export default LearningReader;
