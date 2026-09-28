import { useState } from "react";
import { MAX_PLAYER_LEVEL, UNIT_TYPES } from "../games/constants";
import type { MonsterCategory, UnitTypeId } from "../games/types";

export type DebugBrush = "start" | "goal" | "empty" | "natural" | "player" | "permanent";

interface Props {
  brush: DebugBrush | null;
  onBrushChange: (brush: DebugBrush | null) => void;
  onClearMap: () => void;
  onSetGold: (gold: number) => void;
  onSetPlayerLevel: (level: number) => void;
  onAddUnit: (typeId: UnitTypeId) => void;
  onSpawnMonsters: (
    category: MonsterCategory,
    count: number,
    bossStage?: number,
    finalBossPhase?: 1 | 2 | 3,
  ) => void;
  onClearMonsters: () => void;
  onSetTimer: (seconds: number) => void;
  onClose: () => void;
}

const BRUSHES: { value: DebugBrush; label: string }[] = [
  { value: "start", label: "시작점" },
  { value: "goal", label: "골 지점" },
  { value: "empty", label: "빈칸" },
  { value: "natural", label: "자연벽" },
  { value: "player", label: "설치벽" },
  { value: "permanent", label: "파괴불가" },
];

const BOSS_OPTIONS = [
  { value: "5", label: "5 인간 보스" },
  { value: "10", label: "10 육지 보스" },
  { value: "15", label: "15 조류 보스" },
  { value: "20", label: "20 인간 보스" },
  { value: "25", label: "25 육지 보스" },
  { value: "30", label: "30 조류 보스" },
  { value: "33", label: "33 인간 최종 보스" },
  { value: "34", label: "34 육지 최종 보스" },
  { value: "35", label: "35 조류 최종 보스" },
  { value: "36-1", label: "FINAL 1단계" },
  { value: "36-2", label: "FINAL 2단계" },
  { value: "36-3", label: "FINAL 3단계" },
] as const;

export default function DebugPanel(props: Props) {
  const [gold, setGold] = useState(500);
  const [level, setLevel] = useState(1);
  const [unitType, setUnitType] = useState<UnitTypeId>("swordsman");
  const [monsterCategory, setMonsterCategory] = useState<MonsterCategory>("human");
  const [bossSelection, setBossSelection] = useState("normal");
  const [monsterCount, setMonsterCount] = useState(1);
  const [timer, setTimer] = useState(40);

  return (
    <aside className="debugPanel" aria-label="디버그 모드">
      <div className="debugHeader"><strong>DEBUG MODE</strong><button type="button" onClick={props.onClose}>닫기</button></div>

      <section>
        <button type="button" className="debugWide" onClick={props.onClearMap}>빈 맵으로 초기화</button>
        <span className="debugHint">도구 선택 후 맵 셀을 클릭</span>
        <div className="debugBrushGrid">
          {BRUSHES.map(({ value, label }) => (
            <button key={value} type="button" className={props.brush === value ? "active" : ""}
              onClick={() => props.onBrushChange(props.brush === value ? null : value)}>{label}</button>
          ))}
        </div>
      </section>

      <section className="debugInline">
        <label>골드 <input type="number" min="0" value={gold} onChange={(e) => setGold(Number(e.target.value))} /></label>
        <button type="button" onClick={() => props.onSetGold(gold)}>적용</button>
      </section>

      <section className="debugInline">
        <label>레벨 <input type="number" min="1" max={MAX_PLAYER_LEVEL} value={level} onChange={(e) => setLevel(Number(e.target.value))} /></label>
        <button type="button" onClick={() => props.onSetPlayerLevel(level)}>적용</button>
      </section>

      <section className="debugInline">
        <select value={unitType} onChange={(e) => setUnitType(e.target.value as UnitTypeId)}>
          {(Object.keys(UNIT_TYPES) as UnitTypeId[]).map((id) => <option key={id} value={id}>{UNIT_TYPES[id].name}</option>)}
        </select>
        <button type="button" onClick={() => props.onAddUnit(unitType)}>창고에 추가</button>
      </section>

      <section>
        <div className="debugInline">
          <select disabled={bossSelection !== "normal"} value={monsterCategory} onChange={(e) => setMonsterCategory(e.target.value as MonsterCategory)}>
            <option value="human">인간</option><option value="land">육지</option><option value="flying">조류</option>
          </select>
          <select value={bossSelection} onChange={(e) => setBossSelection(e.target.value)}>
            <option value="normal">일반 몬스터</option>
            {BOSS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <input className="debugCount" type="number" min="1" max="100" value={monsterCount} onChange={(e) => setMonsterCount(Number(e.target.value))} />
        </div>
        <button
          type="button"
          className="debugWide"
          onClick={() => {
            if (bossSelection === "normal") {
              props.onSpawnMonsters(monsterCategory, monsterCount);
              return;
            }
            const [stageText, phaseText] = bossSelection.split("-");
            props.onSpawnMonsters(
              monsterCategory,
              monsterCount,
              Number(stageText),
              phaseText ? Number(phaseText) as 1 | 2 | 3 : undefined,
            );
          }}
        >몬스터 즉시 소환</button>
        <button type="button" className="debugWide" onClick={props.onClearMonsters}>소환 몬스터 초기화</button>
      </section>

      <section className="debugInline">
        <label>타이머 <input type="number" min="1" max="9999" value={timer} onChange={(e) => setTimer(Number(e.target.value))} /></label>
        <button type="button" onClick={() => props.onSetTimer(timer)}>초 적용</button>
      </section>
    </aside>
  );
}

