/* 웨이브가 바뀌면 이전 페이지 선택을 즉시 초기화한다. */
/* eslint-disable react-hooks/set-state-in-effect */
import { UNIT_TYPES } from "../games/constants";
import type { UnitTypeId } from "../games/types";
import { useEffect, useState } from "react";

export interface WaveDamageEntry {
  unitId: number;
  typeId: UnitTypeId;
  tier: number;
  damage: number;
}

interface Props {
  wave: number | null;
  entries: WaveDamageEntry[];
}

export default function DamageReport({ wave, entries }: Props) {
  const [showLower, setShowLower] = useState(false);
  useEffect(() => setShowLower(false), [wave, entries]);
  if (wave === null) {
    return (
      <section className="damageReport">
        <div className="damageReportHeader">
          <strong>데미지 랭킹 TOP 5</strong>
        </div>
        <p className="damageEmpty">웨이브 종료 후 피해량과 점유율이 표시됩니다.</p>
      </section>
    );
  }
  const total = entries.reduce((sum, entry) => sum + entry.damage, 0);
  const sorted = [...entries].sort((a, b) => b.damage - a.damage);
  const visible = showLower ? sorted.slice(-5) : sorted.slice(0, 5);
  const visibleRankStart = showLower ? Math.max(1, sorted.length - 4) : 1;

  return (
    <section className="damageReport">
      <div className="damageReportHeader">
        <strong>{showLower ? "데미지 랭킹 BOTTOM 5" : "데미지 랭킹 TOP 5"}</strong>
        <span>총 {total.toLocaleString()}</span>
      </div>
      {sorted.length === 0 ? (
        <p className="damageEmpty">배치된 유닛이 없었습니다.</p>
      ) : (
        <div className="damageRows">
          {visible.map((entry, index) => {
            const def = UNIT_TYPES[entry.typeId];
            const share = total > 0 ? Math.round(entry.damage / total * 100) : 0;
            return (
              <div className="damageRow" key={entry.unitId}>
                <span>{visibleRankStart + index}. {def.name} {"★".repeat(entry.tier)}</span>
                <span>{entry.damage.toLocaleString()} ({share}%)</span>
              </div>
            );
          })}
        </div>
      )}
      {sorted.length > 5 && (
        <button className="damagePageButton" type="button" onClick={() => setShowLower((value) => !value)}>
          {showLower ? "TOP 5 보기" : "BOTTOM 5 보기"}
        </button>
      )}
    </section>
  );
}

