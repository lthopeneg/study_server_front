type ProblemListProps = {
    language: 'Python' | 'C#';
};

const ProblemList = ({ language }: ProblemListProps) => {
    return (
        <div className="practice-page">
            <header className="practice-page-header">
                <div>
                    <span className="practice-eyebrow">문제 리스트</span>
                    <h1>{language}</h1>
                    <p>{language} 시큐어코딩 문제를 풀고 학습 내용을 점검합니다.</p>
                </div>
            </header>

            <div className="practice-empty-state">
                <span className="practice-language-mark">{language === 'Python' ? 'PY' : 'C#'}</span>
                <h2>등록된 문제가 없습니다</h2>
                <p>문제가 등록되면 난이도와 출제 범위별로 이곳에 표시됩니다.</p>
            </div>
        </div>
    );
};

export default ProblemList;
