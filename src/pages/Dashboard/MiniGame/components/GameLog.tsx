import { useEffect, useRef } from "react";

export interface GameLogEntry { id: number; message: string; }

export default function GameLog({ entries }: { entries: GameLogEntry[] }) {
  const listRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const list = listRef.current;
    if (list) list.scrollTop = list.scrollHeight;
  }, [entries]);

  return (
    <section className="gameLog panelBox">
      <h2>LOG</h2>
      <div className="gameLogList" ref={listRef}>
        {entries.length === 0
          ? <p className="gameLogEmpty">게임 기록이 여기에 표시됩니다.</p>
          : entries.map((entry) => <p key={entry.id}>{entry.message}</p>)}
      </div>
    </section>
  );
}

