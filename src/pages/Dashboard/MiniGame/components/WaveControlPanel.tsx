import type { MonsterCategory } from "../games/types";

interface Props {
  composition: Record<MonsterCategory, number>;
  running: boolean;
  paused: boolean;
  gameEnded: boolean;
  onStart: () => void;
  onResume: () => void;
}

export default function WaveControlPanel({
  composition,
  running,
  paused,
  gameEnded,
  onStart,
  onResume,
}: Props) {
  const total = composition.human + composition.land + composition.flying;
  const percent = (count: number) => total > 0 ? Math.round(count / total * 100) : 0;

  return (
    <section className="waveControl panelBox">
      <h2>현재 웨이브 정보</h2>
      <div className="waveMix"><span>👨 인간</span><b>{percent(composition.human)}%</b></div>
      <div className="waveMix"><span>🐺 육지</span><b>{percent(composition.land)}%</b></div>
      <div className="waveMix"><span>🦅 조류</span><b>{percent(composition.flying)}%</b></div>
      {paused ? (
        <button className="waveStartButton" onClick={onResume}>▶ 웨이브 재개</button>
      ) : (
        <button className="waveStartButton" disabled={running || gameEnded} onClick={onStart}>
          ▶ 웨이브 시작
        </button>
      )}
    </section>
  );
}

