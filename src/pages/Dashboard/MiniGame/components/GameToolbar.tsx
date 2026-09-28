interface Props {
  pathVisible: boolean;
  running: boolean;
  gameSpeed: 1 | 2;
  onTogglePath: () => void;
  onToggleSpeed: () => void;
  onNewMap: () => void;
}
export default function GameToolbar(p: Props) {
  return <section className="sideControls panelBox">
    <h2>보조 설정</h2>
    <button className={p.pathVisible ? "active" : ""} onClick={p.onTogglePath}>
      🧭 경로 {p.pathVisible ? "ON" : "OFF"}
    </button>
    <button className={p.gameSpeed === 2 ? "active" : ""} onClick={p.onToggleSpeed}>
      ⏩ 배속 {p.gameSpeed}×
    </button>
    <button disabled={p.running} onClick={p.onNewMap}>🎲 새 게임</button>
  </section>;
}

