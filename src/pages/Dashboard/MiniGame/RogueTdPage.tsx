/* 게임 루프는 React 렌더링과 별도로 매 프레임 최신 전투 상태를 ref에 동기화한다. */
/* eslint-disable react-hooks/immutability, react-hooks/refs, react-hooks/exhaustive-deps, react-hooks/set-state-in-effect, no-irregular-whitespace */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import GameBoard from "./components/GameBoard";
import StorageBoard from "./components/StorageBoard";
import SynergyHud from "./components/SynergyHud";
import CommandPanel from "./components/CommandPanel";
import UpgradeStrip from "./components/UpgradeStrip";
import GameLog from "./components/GameLog";
import type { GameLogEntry } from "./components/GameLog";
import UnitDetailPanel from "./components/UnitDetailPanel";
import DamageReport from "./components/DamageReport";
import type { WaveDamageEntry } from "./components/DamageReport";
import ContextActionMenu from "./components/ContextActionMenu";
import DebugPanel from "./components/DebugPanel";
import type { DebugBrush } from "./components/DebugPanel";
import { generateMap } from "./games/mapGenerator";
import { findShortestPath, toRC } from "./games/pathfinding";
import {
  getSpecSynergyDamageMultiplier,
  getSynergyState,
  MAGE_STATUS_CHANCE_BONUS,
  RANGER_RANGE_BONUS_TILES,
  WARRIOR_ATTACK_SPEED_BONUS,
} from "./games/synergies";
import {
  BOSS_KILL_GOLD,
  BOSS_SNIPER_DAMAGE_MULTIPLIER,
  DAMAGE_MULTIPLIERS,
  CELL_COUNT,
  FIRE_BURN_CHANCE,
  getWaveTimeLimit,
  getBossCategory,
  getBossClearGold,
  getBossHp,
  getRequiredXp,
  getUnitDeployLimit,
  getMonsterHp,
  getWaveMonsterCategory,
  getWaveComposition,
  getWaveMonsterCount,
  ICE_SLOW_CHANCE,
  isFinalStage,
  isBossWave,
  LIGHTNING_PARALYZE_CHANCE,
  MAX_MONSTER_LAPS,
  MAX_PLAYER_LEVEL,
  MONSTER_KILL_GOLD,
  MONSTER_SPAWN_MS,
  MONSTER_STATS,
  NATURAL_DESTROY_COST,
  PLAYER_WALL_COST,
  PLAYER_WALL_LIMIT,
  PLAYER_WALL_REFUND_RATE,
  PROTOTYPE_WAVES,
  SHOP_DRAW_COST,
  SNIPER_EXECUTE_CHANCE,
  START_GOLD,
  START_LIFE,
  START_PLAYER_LEVEL,
  UNIT_SELL_PRICES,
  UNIT_TYPES,
  UPGRADE_DAMAGE_PER_LEVEL,
  UPGRADE_DRAW_COST,
  WAVE_CLEAR_GOLD,
  WAVE_TIMEOUT_GOLD,
  WAVE_TIME_LIMIT_SEC,
  XP_PER_PURCHASE,
  XP_PURCHASE_COST,
} from "./games/constants";
import {
  getUpgradeLabel,
  getUpgradeLevels,
  rollDamageUpgrade,
} from "./games/upgrades";
import type { DamageUpgrade } from "./games/upgrades";
import type {
  CellData,
  Monster,
  MonsterCategory,
  Projectile,
  StorageUnit,
  Unit,
  UnitTypeId,
} from "./games/types";

const ALL_UNIT_TYPES: UnitTypeId[] = [
  "swordsman",
  "dual_swordsman",
  "magic_swordsman",
  "fire_mage",
  "ice_mage",
  "lightning_mage",
  "rifleman",
  "shotgunner",
  "sniper",
];
const DEBUG_ACCESS_CODE = "0427";

const getRandomUnitType = (): UnitTypeId => {
  const idx = Math.floor(Math.random() * ALL_UNIT_TYPES.length);
  return ALL_UNIT_TYPES[idx];
};

export default function RogueTdPage() {
  const initial = useMemo(() => generateMap(), []);
  const [grid, setGrid] = useState<CellData[]>(initial.grid);
  const [start, setStart] = useState(initial.start),
    [goal, setGoal] = useState(initial.goal);
  const [path, setPath] = useState(initial.path),
    [pathVisible, setPathVisible] = useState(true);
  const [gold, setGold] = useState(START_GOLD),
    [life, setLife] = useState(START_LIFE),
    [wave, setWave] = useState(1);
  const [playerLevel, setPlayerLevel] = useState(START_PLAYER_LEVEL);
  const [playerXp, setPlayerXp] = useState(0);
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [gameSpeed, setGameSpeed] = useState<1 | 2>(1);
  const [debugMode, setDebugMode] = useState(false);
  const [debugBrush, setDebugBrush] = useState<DebugBrush | null>(null);
  const [debugCodePromptOpen, setDebugCodePromptOpen] = useState(false);
  const [debugCodeInput, setDebugCodeInput] = useState("");
  const [debugCodeError, setDebugCodeError] = useState(false);
  const [gameResult, setGameResult] = useState<"playing" | "won" | "lost">(
    "playing",
  );
  const [units, setUnits] = useState<Unit[]>([]),
    [selectedUnitId, setSelectedUnitId] = useState<number | null>(null);
  const [monsters, setMonsters] = useState<Monster[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const nextProjectile = useRef(1);
  const [toSpawn, setToSpawn] = useState(0),
    [status, setStatus] = useState("유닛을 구매한 뒤 자연벽에 배치해봐.");
  const nextUnit = useRef(1),
    nextMonster = useRef(1),
    lastSpawnGameMs = useRef(0),
    lastFrame = useRef(0);

  // 전투·상태이상·제한시간은 일시정지와 배속을 공유하는 게임 시간을 사용한다.
  const gameTimeMs = useRef(0);
  const waveTimeRemainingMs = useRef(WAVE_TIME_LIMIT_SEC * 1000);
  const [waveTimeRemainingSec, setWaveTimeRemainingSec] = useState(WAVE_TIME_LIMIT_SEC);

  // 창고(보관함 4x5 = 20칸) state
  const [storageSlots, setStorageSlots] = useState<(StorageUnit | null)[]>(
    Array(20).fill(null),
  );
  const [selectedStorageIndex, setSelectedStorageIndex] = useState<
    number | null
  >(null);
  const [activeCellIndex, setActiveCellIndex] = useState<number | null>(null);
  const [activeStorageIndex, setActiveStorageIndex] = useState<number | null>(null);
  const [mapPlacementTarget, setMapPlacementTarget] = useState<number | null>(null);
  const [highlightMapPlacement, setHighlightMapPlacement] = useState(false);
  const [upgrades, setUpgrades] = useState<DamageUpgrade[]>([]);
  const [damageReportWave, setDamageReportWave] = useState<number | null>(null);
  const [waveDamageReport, setWaveDamageReport] = useState<WaveDamageEntry[]>([]);
  const [gameLogs, setGameLogs] = useState<GameLogEntry[]>([
    { id: 1, message: "새 게임을 시작했습니다." },
  ]);
  const nextLog = useRef(2);
  const waveDamageRef = useRef<Record<number, number>>({});
  const waveUnitsRef = useRef<Unit[]>([]);

  const wallCount = grid.filter((c) => c.type === "player").length;
  const unitDeployLimit = getUnitDeployLimit(playerLevel);
  const synergy = useMemo(() => getSynergyState(units), [units]);
  const waveComposition = useMemo(() => getWaveComposition(wave), [wave]);
  const waveCompositionTotal = waveComposition.human + waveComposition.land + waveComposition.flying;
  const wavePercent = (count: number) => waveCompositionTotal > 0
    ? Math.round(count / waveCompositionTotal * 100)
    : 0;
  const waveMonsterTotal = isBossWave(wave) ? 1 : getWaveMonsterCount(wave);
  const waveTimeLimit = getWaveTimeLimit(wave);
  const remainingMonsterCount = running ? monsters.length + toSpawn : waveMonsterTotal;
  const requiredPlayerXp = playerLevel < MAX_PLAYER_LEVEL ? getRequiredXp(playerLevel) : 0;
  const playerXpPercent = playerLevel < MAX_PLAYER_LEVEL
    ? Math.min(100, playerXp / requiredPlayerXp * 100)
    : 100;
  const highestMonsterLaps = monsters.reduce((highest, monster) => Math.max(highest, monster.laps), 0);

  const handleToggleDebug = () => {
    if (debugMode) {
      setDebugMode(false);
      setDebugBrush(null);
      return;
    }
    setDebugCodeInput("");
    setDebugCodeError(false);
    setDebugCodePromptOpen(true);
  };

  const submitDebugCode = () => {
    if (debugCodeInput !== DEBUG_ACCESS_CODE) {
      setDebugCodeError(true);
      setDebugCodeInput("");
      return;
    }
    setDebugMode(true);
    setDebugBrush(null);
    setDebugCodePromptOpen(false);
    setDebugCodeError(false);
    setStatus("🛠 디버그 모드를 활성화했습니다.");
  };
  const selectedDetailUnit = selectedUnitId !== null
    ? units.find((unit) => unit.id === selectedUnitId) ?? null
    : selectedStorageIndex !== null
      ? storageSlots[selectedStorageIndex]
      : null;
  const addLog = useCallback((message: string) => {
    setGameLogs((current) => [...current.slice(-99), { id: nextLog.current++, message }]);
  }, []);

  // 3개 이상 모인 유닛 조합(승급 가능 키) 계산
  const combinableKeys = useMemo(() => {
    const counts: Record<string, number> = {};
    storageSlots.forEach((s) => {
      if (s && s.tier < 3) {
        const key = `${s.typeId}_${s.tier}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });
    units.forEach((u) => {
      if (u.tier < 3) {
        const key = `${u.typeId}_${u.tier}`;
        counts[key] = (counts[key] || 0) + 1;
      }
    });

    const set = new Set<string>();
    Object.entries(counts).forEach(([key, cnt]) => {
      if (cnt >= 3) set.add(key);
    });
    return set;
  }, [storageSlots, units]);

  const resetMap = useCallback(() => {
    const m = generateMap();
    setGrid(m.grid);
    setStart(m.start);
    setGoal(m.goal);
    setPath(m.path);
    setGold(START_GOLD);
    setLife(START_LIFE);
    setWave(1);
    setPlayerLevel(START_PLAYER_LEVEL);
    setPlayerXp(0);
    setUnits([]);
    setMonsters([]);
    setProjectiles([]);
    setStorageSlots(Array(20).fill(null));
    setSelectedStorageIndex(null);
    setActiveCellIndex(null);
    setActiveStorageIndex(null);
    setMapPlacementTarget(null);
    setHighlightMapPlacement(false);
    setUpgrades([]);
    setDamageReportWave(null);
    setWaveDamageReport([]);
    nextLog.current = 2;
    setGameLogs([{ id: 1, message: "새 게임을 시작했습니다." }]);
    waveDamageRef.current = {};
    waveUnitsRef.current = [];
    monstersRef.current = [];
    projectilesRef.current = [];
    unitsRef.current = [];
    setToSpawn(0);
    setRunning(false);
    setPaused(false);
    pausedRef.current = false;
    setGameSpeed(1);
    gameTimeMs.current = 0;
    waveTimeRemainingMs.current = WAVE_TIME_LIMIT_SEC * 1000;
    lastSpawnGameMs.current = 0;
    setGameResult("playing");
    setSelectedUnitId(null);
    setWaveTimeRemainingSec(WAVE_TIME_LIMIT_SEC);
    setStatus("새 맵 생성 완료. 유닛을 구매한 뒤 자연벽에 배치해봐.");
  }, []);

  function recalc(next: CellData[]) {
    const p = findShortestPath(next, start, goal);
    if (p) setPath(p);
    return p;
  }

  // 상점에서 유닛 구매 -> 창고로 보관
  const handleBuyShopUnit = () => {
    if (gold < SHOP_DRAW_COST || running || gameResult !== "playing") return;

    const emptySlotIdx = storageSlots.findIndex((s) => s === null);
    if (emptySlotIdx === -1) {
      setStatus("⚠️ 창고가 가득 찼어! 맵에 유닛을 먼저 배치해줘.");
      return;
    }

    const typeId = getRandomUnitType();
    const newStorageUnitId = nextUnit.current++;

    setGold((g) => g - SHOP_DRAW_COST);
    setStorageSlots((slots) =>
      slots.map((s, idx) =>
        idx === emptySlotIdx
          ? { id: newStorageUnitId, typeId, tier: 1 }
          : s,
      ),
    );
    clearInteraction();
    setStatus(
      `🛒 [${UNIT_TYPES[typeId].name}] 구매 완료! 창고 📦${emptySlotIdx + 1}번 칸에 보관되었어.`,
    );
    addLog(`${UNIT_TYPES[typeId].name}을(를) 뽑았습니다.`);
  };

  const handleBuyUpgrade = () => {
    if (
      running ||
      gameResult !== "playing" ||
      gold < UPGRADE_DRAW_COST
    ) return;

    const upgrade = rollDamageUpgrade();
    setGold((g) => g - UPGRADE_DRAW_COST);
    setUpgrades((current) => [...current, upgrade]);
    setStatus(`✨ ${getUpgradeLabel(upgrade)} 획득! 피해량 +${upgrade.levels * UPGRADE_DAMAGE_PER_LEVEL * 100}%`);
    addLog(`${getUpgradeLabel(upgrade)}을(를) 획득했습니다.`);
  };

  const handleBuyXp = () => {
    if (running || gameResult !== "playing" || playerLevel >= MAX_PLAYER_LEVEL || gold < XP_PURCHASE_COST) return;

    let nextLevel = playerLevel;
    let nextXp = playerXp + XP_PER_PURCHASE;
    while (nextLevel < MAX_PLAYER_LEVEL && nextXp >= getRequiredXp(nextLevel)) {
      nextXp -= getRequiredXp(nextLevel);
      nextLevel += 1;
    }
    if (nextLevel >= MAX_PLAYER_LEVEL) nextXp = 0;

    setGold((g) => g - XP_PURCHASE_COST);
    setPlayerLevel(nextLevel);
    setPlayerXp(nextXp);
    setStatus(nextLevel > playerLevel
      ? `🎉 플레이어 Lv.${nextLevel}! 유닛 배치 한도가 ${getUnitDeployLimit(nextLevel)}기로 증가했어.`
      : `📘 경험치 +${XP_PER_PURCHASE} (${nextXp}/${getRequiredXp(nextLevel)})`);
    if (nextLevel > playerLevel) addLog(`플레이어가 Lv.${nextLevel}로 레벨업했습니다.`);
  };

  const handleSellStorageUnit = (index: number) => {
    if (running) return;
    const unit = storageSlots[index];
    if (!unit) return;
    const price = UNIT_SELL_PRICES[unit.tier as 1 | 2 | 3];
    setStorageSlots((slots) => slots.map((slot, idx) => idx === index ? null : slot));
    setGold((g) => g + price);
    if (selectedStorageIndex === index) setSelectedStorageIndex(null);
    setStatus(`💰 [${UNIT_TYPES[unit.typeId].name} ${"★".repeat(unit.tier)}] 판매 완료! +${price}G`);
    addLog(`${UNIT_TYPES[unit.typeId].name}을(를) 팔아서 ${price}골드를 획득했습니다.`);
  };

  // 수동 3성 승급 버튼 핸들러
  const handleCombineUnits = (typeId: UnitTypeId, tier: number, mapUnitId?: number) => {
    if (running || tier >= 3) return;

    let needed = 3;
    const newStorageSlots = [...storageSlots];
    const newUnits = [...units];
    const anchorUnit = mapUnitId === undefined
      ? null
      : newUnits.find((unit) => unit.id === mapUnitId) ?? null;
    let resultCell: number | null = anchorUnit?.cell ?? null;

    // 맵에서 승급을 누른 유닛은 먼저 재료로 사용하고 그 자리를 결과 위치로 고정한다.
    if (anchorUnit) {
      const anchorIndex = newUnits.findIndex((unit) => unit.id === anchorUnit.id);
      newUnits.splice(anchorIndex, 1);
      needed -= 1;
    }

    // 창고의 동일 유닛을 재료로 사용한다.
    for (let i = 0; i < newStorageSlots.length && needed > 0; i++) {
      const s = newStorageSlots[i];
      if (s && s.typeId === typeId && s.tier === tier) {
        newStorageSlots[i] = null;
        needed--;
      }
    }

    // 부족한 재료는 맵에 배치된 동일 유닛에서 사용한다.
    for (let i = newUnits.length - 1; i >= 0 && needed > 0; i--) {
      const u = newUnits[i];
      if (u.typeId === typeId && u.tier === tier) {
        if (resultCell === null) resultCell = u.cell;
        newUnits.splice(i, 1);
        needed--;
      }
    }

    if (needed > 0) {
      setStatus("⚠️ 승급에 필요한 동일 유닛 3개가 부족해!");
      return;
    }

    const upgradedId = nextUnit.current++;
    if (anchorUnit) {
      const def = UNIT_TYPES[typeId];
      newUnits.push({
        id: upgradedId,
        typeId,
        tier: tier + 1,
        cell: anchorUnit.cell,
        rangeTiles: def.rangeTiles,
        damage: def.damage,
        attackIntervalMs: def.attackIntervalMs,
        cooldownMs: 0,
        targetId: null,
      });
    } else {
      const emptySlotIdx = newStorageSlots.findIndex((s) => s === null);
      if (emptySlotIdx !== -1) {
        newStorageSlots[emptySlotIdx] = {
          id: upgradedId,
          typeId,
          tier: tier + 1,
        };
      } else if (resultCell !== null) {
        const def = UNIT_TYPES[typeId];
        newUnits.push({
          id: upgradedId,
          typeId,
          tier: tier + 1,
          cell: resultCell,
          rangeTiles: def.rangeTiles,
          damage: def.damage,
          attackIntervalMs: def.attackIntervalMs,
          cooldownMs: 0,
          targetId: null,
        });
      } else {
        setStatus("⚠️ 승급된 유닛을 보관할 공간이 부족해!");
        return;
      }
    }

    setStorageSlots(newStorageSlots);
    setUnits(newUnits);
    const targetDef = UNIT_TYPES[typeId];
    setStatus(
      `✨ [${targetDef.name}] ${tier}성 유닛 3개로 ${tier + 1}성 승급 완료! (${"★".repeat(tier + 1)})${anchorUnit ? " 기존 위치 유지" : ""}`,
    );
    addLog(`${targetDef.name}이(가) ${tier + 1}성 승급에 성공했습니다.`);
  };

  const clearInteraction = () => {
    setSelectedUnitId(null);
    setSelectedStorageIndex(null);
    setActiveCellIndex(null);
    setActiveStorageIndex(null);
    setMapPlacementTarget(null);
    setHighlightMapPlacement(false);
  };

  const clearDebugCombat = () => {
    setRunning(false);
    setPaused(false);
    pausedRef.current = false;
    setToSpawn(0);
    setMonsters([]);
    setProjectiles([]);
    monstersRef.current = [];
    projectilesRef.current = [];
  };

  const handleDebugClearMap = () => {
    const nextGrid: CellData[] = Array.from({ length: CELL_COUNT }, () => ({ type: "empty" }));
    clearDebugCombat();
    clearInteraction();
    setGrid(nextGrid);
    setPath(findShortestPath(nextGrid, start, goal) ?? [start, goal]);
    setUnits([]);
    unitsRef.current = [];
    setStatus("🛠 디버그: 빈 맵으로 초기화했습니다.");
  };

  const handleDebugCellClick = (cellIndex: number) => {
    if (!debugBrush) return;
    if (debugBrush === "start" && cellIndex === goal) {
      setStatus("⚠️ 시작점과 골 지점은 같은 칸에 둘 수 없습니다.");
      return;
    }
    if (debugBrush === "goal" && cellIndex === start) {
      setStatus("⚠️ 시작점과 골 지점은 같은 칸에 둘 수 없습니다.");
      return;
    }

    const nextGrid = grid.map((cell) => ({ ...cell }));
    let nextStart = start;
    let nextGoal = goal;
    if (debugBrush === "start") {
      nextStart = cellIndex;
      nextGrid[cellIndex] = { type: "empty" };
    } else if (debugBrush === "goal") {
      nextGoal = cellIndex;
      nextGrid[cellIndex] = { type: "empty" };
    } else {
      if (cellIndex === start || cellIndex === goal) {
        setStatus("⚠️ 시작점과 골 지점에는 벽을 놓을 수 없습니다.");
        return;
      }
      nextGrid[cellIndex] = debugBrush === "player"
        ? { type: "player", cost: 0, bornWave: wave - 1 }
        : { type: debugBrush };
    }

    const nextPath = findShortestPath(nextGrid, nextStart, nextGoal);
    if (!nextPath) {
      setStatus("⚠️ 경로가 완전히 막히는 설정은 적용할 수 없습니다.");
      return;
    }
    clearDebugCombat();
    clearInteraction();
    setGrid(nextGrid);
    setStart(nextStart);
    setGoal(nextGoal);
    setPath(nextPath);
    if (debugBrush === "empty" || debugBrush === "permanent") {
      setUnits((current) => current.filter((unit) => unit.cell !== cellIndex));
    }
    setStatus(`🛠 디버그 맵 도구 적용: ${debugBrush}`);
  };

  const handleDebugAddUnit = (typeId: UnitTypeId) => {
    const emptyIndex = storageSlots.findIndex((slot) => slot === null);
    if (emptyIndex < 0) {
      setStatus("⚠️ 창고가 가득 찼습니다.");
      return;
    }
    const unit = { id: nextUnit.current++, typeId, tier: 1 };
    setStorageSlots((slots) => slots.map((slot, index) => index === emptyIndex ? unit : slot));
    setStatus(`🛠 디버그: ${UNIT_TYPES[typeId].name}을(를) 창고에 추가했습니다.`);
  };

  const handleDebugSpawnMonsters = (
    category: MonsterCategory,
    requestedCount: number,
    bossStage?: number,
    requestedFinalPhase?: 1 | 2 | 3,
  ) => {
    if (path.length < 2) {
      setStatus("⚠️ 유효한 경로를 먼저 만들어 주세요.");
      return;
    }
    const count = Math.min(100, Math.max(1, Math.floor(requestedCount || 1)));
    const boss = bossStage !== undefined;
    const isFinalBoss = bossStage === 36;
    const finalBossPhase = isFinalBoss ? requestedFinalPhase ?? 1 : undefined;
    const spawnCategory = boss
      ? isFinalBoss
        ? finalBossPhase === 1 ? "human" : finalBossPhase === 2 ? "land" : "flying"
        : getBossCategory(bossStage)
      : category;
    const maxHp = boss ? getBossHp(bossStage) : getMonsterHp(spawnCategory, wave);
    const hp = isFinalBoss
      ? Math.round(maxHp * (finalBossPhase === 1 ? 1 : finalBossPhase === 2 ? 0.6 : 0.3))
      : maxHp;
    const created: Monster[] = Array.from({ length: count }, (_, index) => ({
      id: nextMonster.current++,
      isBoss: boss,
      bossStage,
      isFinalBoss,
      finalBossPhase,
      category: spawnCategory,
      hp,
      maxHp,
      pathStep: 0,
      progress: -index * 0.35,
      speedTilesPerSecond: MONSTER_STATS[spawnCategory].speed,
      laps: 0,
    }));
    const nextMonsters = running ? [...monstersRef.current, ...created] : created;
    monstersRef.current = nextMonsters;
    setMonsters([...nextMonsters]);
    setProjectiles([]);
    projectilesRef.current = [];
    setToSpawn(0);
    setGameResult("playing");
    setPaused(false);
    pausedRef.current = false;
    if (!running) {
      waveDamageRef.current = {};
      waveUnitsRef.current = units.map((unit) => ({ ...unit }));
      if (waveTimeRemainingMs.current <= 0) {
        waveTimeRemainingMs.current = waveTimeLimit * 1000;
        setWaveTimeRemainingSec(waveTimeLimit);
      }
    }
    setRunning(true);
    lastFrame.current = performance.now();
    const monsterLabel = isFinalBoss
      ? `FINAL BOSS ${finalBossPhase}단계`
      : boss
        ? `${bossStage}스테이지 보스`
        : `${spawnCategory} 몬스터`;
    setStatus(`🛠 디버그: ${monsterLabel} ${count}마리를 소환했습니다.`);
  };

  const handleDebugSetTimer = (seconds: number) => {
    const safeSeconds = Math.min(9999, Math.max(1, Math.floor(seconds || 1)));
    waveTimeRemainingMs.current = safeSeconds * 1000;
    setWaveTimeRemainingSec(safeSeconds);
    setStatus(`🛠 디버그: 제한시간을 ${safeSeconds}초로 설정했습니다.`);
  };

  const handleDebugClearMonsters = () => {
    clearDebugCombat();
    waveDamageRef.current = {};
    setStatus("🛠 디버그: 소환된 몬스터를 모두 초기화했습니다.");
  };

  const storageToMapUnit = (storageUnit: StorageUnit, cell: number): Unit => {
    const def = UNIT_TYPES[storageUnit.typeId];
    return {
      id: storageUnit.id,
      typeId: storageUnit.typeId,
      tier: storageUnit.tier,
      cell,
      rangeTiles: def.rangeTiles,
      damage: def.damage,
      attackIntervalMs: def.attackIntervalMs,
      cooldownMs: 0,
      targetId: null,
    };
  };

  const mapToStorageUnit = (unit: Unit): StorageUnit => ({
    id: unit.id,
    typeId: unit.typeId,
    tier: unit.tier,
  });

  const recallMapUnit = (unitId: number) => {
    const unit = units.find((item) => item.id === unitId);
    const emptyIndex = storageSlots.findIndex((slot) => slot === null);
    if (!unit || emptyIndex < 0) {
      setStatus("⚠️ 창고가 가득 차서 회수할 수 없어!");
      return;
    }
    setUnits((current) => current.filter((item) => item.id !== unitId));
    setStorageSlots((slots) => slots.map((slot, index) =>
      index === emptyIndex ? mapToStorageUnit(unit) : slot));
    setStatus(`📥 [${UNIT_TYPES[unit.typeId].name}] 창고 회수 완료.`);
    clearInteraction();
  };

  const sellMapUnit = (unitId: number) => {
    const unit = units.find((item) => item.id === unitId);
    if (!unit) return;
    const price = UNIT_SELL_PRICES[unit.tier as 1 | 2 | 3];
    setUnits((current) => current.filter((item) => item.id !== unitId));
    setGold((current) => current + price);
    setStatus(`💰 [${UNIT_TYPES[unit.typeId].name}] 판매 완료! +${price}G`);
    addLog(`${UNIT_TYPES[unit.typeId].name}을(를) 팔아서 ${price}골드를 획득했습니다.`);
    clearInteraction();
  };

  const handleSelectStorageSlot = (index: number) => {
    if (running) return;
    if (activeStorageIndex === index) {
      clearInteraction();
      setStatus("선택을 해제했어.");
      return;
    }
    const clicked = storageSlots[index];

    if (mapPlacementTarget !== null && clicked) {
      if (units.length >= unitDeployLimit) {
        setStatus(`⚠️ 현재 배치 한도는 ${unitDeployLimit}기야.`);
        return;
      }
      setUnits((current) => [...current, storageToMapUnit(clicked, mapPlacementTarget)]);
      setStorageSlots((slots) => slots.map((slot, slotIndex) => slotIndex === index ? null : slot));
      setStatus(`✅ [${UNIT_TYPES[clicked.typeId].name}] 배치 완료.`);
      clearInteraction();
      return;
    }

    const selectedMapUnit = units.find((unit) => unit.id === selectedUnitId);
    if (selectedMapUnit) {
      if (clicked) {
        const replacement = storageToMapUnit(clicked, selectedMapUnit.cell);
        setUnits((current) => current.map((unit) => unit.id === selectedMapUnit.id ? replacement : unit));
        setStorageSlots((slots) => slots.map((slot, slotIndex) =>
          slotIndex === index ? mapToStorageUnit(selectedMapUnit) : slot));
        setStatus("🔄 맵 유닛과 창고 유닛의 자리를 교환했어.");
      } else {
        setUnits((current) => current.filter((unit) => unit.id !== selectedMapUnit.id));
        setStorageSlots((slots) => slots.map((slot, slotIndex) =>
          slotIndex === index ? mapToStorageUnit(selectedMapUnit) : slot));
        setStatus("📥 유닛을 선택한 창고 칸으로 옮겼어.");
      }
      clearInteraction();
      return;
    }

    if (selectedStorageIndex !== null && selectedStorageIndex !== index) {
      setStorageSlots((slots) => {
        const next = [...slots];
        [next[selectedStorageIndex], next[index]] = [next[index], next[selectedStorageIndex]];
        return next;
      });
      setStatus("🔄 창고 유닛의 자리를 교환했어.");
      clearInteraction();
      return;
    }

    if (clicked) {
      setSelectedStorageIndex(index);
      setSelectedUnitId(null);
      setActiveStorageIndex(index);
      setActiveCellIndex(null);
      setHighlightMapPlacement(false);
      setStatus(`📦 [${UNIT_TYPES[clicked.typeId].name}] 선택됨.`);
    } else {
      clearInteraction();
    }
  };

  const installWall = (cellIndex: number) => {
    if (gold < PLAYER_WALL_COST || wallCount >= PLAYER_WALL_LIMIT) return;
    const next = grid.map((cell) => ({ ...cell }));
    next[cellIndex] = { type: "player", bornWave: wave, cost: PLAYER_WALL_COST };
    const nextPath = findShortestPath(next, start, goal);
    if (!nextPath) {
      setStatus("🚫 출발점과 도착점을 완전히 막을 수 없어.");
      return;
    }
    setGrid(next);
    setPath(nextPath);
    setGold((current) => current - PLAYER_WALL_COST);
    setStatus(`🧱 벽 설치 완료. -${PLAYER_WALL_COST}G`);
    clearInteraction();
  };

  const removeWall = (cellIndex: number) => {
    const cell = grid[cellIndex];
    if (units.some((unit) => unit.cell === cellIndex)) return;
    const next = grid.map((item) => ({ ...item }));
    next[cellIndex] = { type: "empty" };
    if (cell.type === "natural") {
      if (gold < NATURAL_DESTROY_COST) return;
      setGold((current) => current - NATURAL_DESTROY_COST);
      setStatus(`🔨 자연벽 제거 완료. -${NATURAL_DESTROY_COST}G`);
    } else if (cell.type === "player") {
      const refund = cell.bornWave === wave
        ? (cell.cost ?? PLAYER_WALL_COST)
        : Math.floor((cell.cost ?? PLAYER_WALL_COST) * PLAYER_WALL_REFUND_RATE);
      setGold((current) => current + refund);
      setStatus(`🔨 벽 제거 완료. +${refund}G`);
    }
    setGrid(next);
    recalc(next);
    clearInteraction();
  };

  function onCellClick(cellIndex: number) {
    if (debugMode && debugBrush) {
      handleDebugCellClick(cellIndex);
      return;
    }
    if (running) return;
    if (activeCellIndex === cellIndex) {
      clearInteraction();
      setStatus("선택을 해제했어.");
      return;
    }
    const cell = grid[cellIndex];
    if (cellIndex === start || cellIndex === goal || cell.type === "permanent") {
      clearInteraction();
      return;
    }

    const clickedUnit = units.find((unit) => unit.cell === cellIndex);
    const validUnitCell = cell.type === "player" || cell.type === "natural";
    const selectedStorage = selectedStorageIndex === null
      ? null
      : storageSlots[selectedStorageIndex];

    if (selectedStorage && validUnitCell) {
      if (clickedUnit) {
        const replacementUnit = storageToMapUnit(selectedStorage, cellIndex);
        setUnits((current) => current.map((unit) =>
          unit.id === clickedUnit.id ? replacementUnit : unit));
        setStorageSlots((slots) => slots.map((slot, index) =>
          index === selectedStorageIndex ? mapToStorageUnit(clickedUnit) : slot));
        setStatus("🔄 맵 유닛과 창고 유닛의 자리를 교환했어.");
      } else {
        if (units.length >= unitDeployLimit) {
          setStatus(`⚠️ 현재 배치 한도는 ${unitDeployLimit}기야.`);
          return;
        }
        setUnits((current) => [
          ...current,
          storageToMapUnit(selectedStorage, cellIndex),
        ]);
        setStorageSlots((slots) => slots.map((slot, index) =>
          index === selectedStorageIndex ? null : slot));
        setStatus(`✅ [${UNIT_TYPES[selectedStorage.typeId].name}] 배치 완료.`);
      }
      clearInteraction();
      return;
    }

    const selectedMapUnit = units.find((unit) => unit.id === selectedUnitId);
    if (selectedMapUnit && selectedMapUnit.cell !== cellIndex && validUnitCell) {
      if (clickedUnit) {
        setUnits((current) => current.map((unit) =>
          unit.id === selectedMapUnit.id
            ? { ...unit, cell: cellIndex }
            : unit.id === clickedUnit.id
              ? { ...unit, cell: selectedMapUnit.cell }
              : unit));
        setStatus("🔄 두 유닛의 위치를 교환했어.");
      } else {
        setUnits((current) => current.map((unit) =>
          unit.id === selectedMapUnit.id ? { ...unit, cell: cellIndex } : unit));
        setStatus("✅ 유닛 위치를 옮겼어.");
      }
      clearInteraction();
      return;
    }

    setMapPlacementTarget(null);
    setHighlightMapPlacement(false);
    setActiveStorageIndex(null);
    setSelectedStorageIndex(null);
    setActiveCellIndex(cellIndex);
    if (clickedUnit) {
      setSelectedUnitId(clickedUnit.id);
      setStatus(`⚔️ [${UNIT_TYPES[clickedUnit.typeId].name}] 선택됨. 메뉴를 누르거나 다른 유닛과 자리를 바꿀 수 있어.`);
    } else {
      setSelectedUnitId(null);
    }
  }

  function startWave() {
    if (running || gameResult !== "playing") return;
    setPaused(false);
    pausedRef.current = false;
    setGrid((g) =>
      g.map((c) =>
        c.type === "player" && c.bornWave === wave
          ? { ...c, bornWave: wave - 1 }
          : c,
      ),
    );
    clearInteraction();
    setMonsters([]);
    setProjectiles([]);
    const restedUnits = units.map((unit) => ({
      ...unit,
      cooldownMs: 0,
      targetId: null,
      lastAttackTimeMs: undefined,
    }));
    unitsRef.current = restedUnits;
    setUnits(restedUnits);
    waveDamageRef.current = {};
    waveUnitsRef.current = restedUnits.map((unit) => ({ ...unit }));
    monstersRef.current = [];
    projectilesRef.current = [];
    setToSpawn(isBossWave(wave) ? 1 : getWaveMonsterCount(wave));
    gameTimeMs.current = 0;
    waveTimeRemainingMs.current = waveTimeLimit * 1000;
    lastSpawnGameMs.current = 0;
    setWaveTimeRemainingSec(waveTimeLimit);
    setRunning(true);
    lastFrame.current = performance.now();
    setStatus(
      isFinalStage(wave)
        ? `👑 FINAL STAGE 시작! ${waveTimeLimit}초 안에 최종 보스를 처치해!`
        : isBossWave(wave)
          ? `👹 보스 웨이브 ${wave} 시작! ${waveTimeLimit}초 안에 보스를 처치해!`
          : `🌊 웨이브 ${wave} 시작! (제한시간 ${waveTimeLimit}초)`,
    );
    addLog(`${wave}스테이지가 시작되었습니다.`);
  }

  function resumeWave() {
    if (!running || !paused || document.visibilityState === "hidden") return;
    const now = performance.now();
    lastFrame.current = now;
    pausedRef.current = false;
    setPaused(false);
  }

  function togglePause() {
    if (!running) return;
    if (paused) {
      resumeWave();
      return;
    }
    pausedRef.current = true;
    setPaused(true);
  }

  const monstersRef = useRef<Monster[]>([]);
  const unitsRef = useRef<Unit[]>([]);
  const projectilesRef = useRef<Projectile[]>([]);

  useEffect(() => {
    unitsRef.current = units;
  }, [units]);

  useEffect(() => {
    if (running) return;
    pausedRef.current = false;
    setPaused(false);
  }, [running]);

  useEffect(() => {
    if (!running) return;

    const pauseWave = () => {
      pausedRef.current = true;
      setPaused(true);
    };
    const pauseIfHidden = () => {
      if (document.visibilityState === "hidden") pauseWave();
    };

    document.addEventListener("visibilitychange", pauseIfHidden);
    window.addEventListener("blur", pauseWave);
    pauseIfHidden();
    return () => {
      document.removeEventListener("visibilitychange", pauseIfHidden);
      window.removeEventListener("blur", pauseWave);
    };
  }, [running]);

  // 통합 단일 RAF 게임 루프
  useEffect(() => {
    if (!running || paused) return;
    let raf = 0;

    const frame = (now: number) => {
      if (pausedRef.current) return;
      const realDt = Math.min(40, Math.max(0, now - lastFrame.current));
      lastFrame.current = now;
      if (waveTimeRemainingMs.current <= 0) return;
      const dt = Math.min(realDt * gameSpeed, waveTimeRemainingMs.current);
      gameTimeMs.current += dt;
      waveTimeRemainingMs.current -= dt;
      const gameNow = gameTimeMs.current;

      setWaveTimeRemainingSec(Math.ceil(waveTimeRemainingMs.current / 1000));

      // 1. 일반 웨이브는 유형별 비율대로, 5의 배수 웨이브는 보스 1마리 스폰
      if (toSpawn > 0 && gameNow - lastSpawnGameMs.current >= MONSTER_SPAWN_MS) {
        lastSpawnGameMs.current = gameNow;
        setToSpawn((n) => n - 1);

        const isBoss = isBossWave(wave);
        const category = isBoss
          ? getBossCategory(wave)
          : getWaveMonsterCategory(wave, getWaveMonsterCount(wave) - toSpawn);
        const hp = isBoss ? getBossHp(wave) : getMonsterHp(category, wave);
        const isFinalBoss = isFinalStage(wave);
        const lateWaveSpeedMultiplier = wave === 31 ? 1.08 : wave === 32 ? 1.15 : 1;

        monstersRef.current.push({
          id: nextMonster.current++,
          isBoss,
          bossStage: isBoss ? wave : undefined,
          isFinalBoss,
          finalBossPhase: isFinalBoss ? 1 : undefined,
          category,
          hp,
          maxHp: hp,
          pathStep: 0,
          progress: 0,
          speedTilesPerSecond: MONSTER_STATS[category].speed * lateWaveSpeedMultiplier,
          laps: 0,
        });
      }

      // 2. 몬스터 이동 & 완주(laps) 순환 이동 처리
      let instantGameOver = false;

      for (const m of monstersRef.current) {
        if (m.isFinalBoss) {
          const hpRatio = m.hp / m.maxHp;
          const nextPhase: 1 | 2 | 3 = hpRatio > 2 / 3 ? 1 : hpRatio > 1 / 3 ? 2 : 3;
          if (nextPhase !== m.finalBossPhase) {
            m.finalBossPhase = nextPhase;
            m.category = nextPhase === 1 ? "human" : nextPhase === 2 ? "land" : "flying";
            m.speedTilesPerSecond = MONSTER_STATS[m.category].speed;
            m.slowUntilMs = undefined;
            m.paralyzeUntilMs = undefined;
            m.statusImmunityUntilMs = gameNow + 800;
            const phaseName = nextPhase === 2 ? "육지형" : "조류형";
            setStatus(`👑 최종 보스가 ${phaseName} 형태로 변환했습니다!`);
            addLog(`FINAL BOSS가 ${phaseName} 형태로 변환했습니다.`);
          }
        }
        // 둔화/마비 속도 적용
        let currentSpeed = m.speedTilesPerSecond;
        if (m.paralyzeUntilMs && gameNow < m.paralyzeUntilMs) {
          currentSpeed = 0; // 마비: 0% 속도
        } else if (m.slowUntilMs && gameNow < m.slowUntilMs) {
          currentSpeed *= 0.5; // 둔화: 50% 속도
        }

        m.progress += currentSpeed * (dt / 1000);
        while (m.progress >= 1) {
          m.progress -= 1;
          m.pathStep++;

          // 도착 지점(G) 도착 시 -> 몬스터 삭제 안 하고 laps + 1 후 S로 재입장!
          if (m.pathStep >= path.length - 1) {
            m.laps += 1;
            m.pathStep = 0;
            m.progress = 0;

            // 5회 완주 즉시 게임 오버 규칙!
            if (!m.isBoss && m.laps >= MAX_MONSTER_LAPS) {
              instantGameOver = true;
            }
          }
        }
      }

      if (instantGameOver) {
        setRunning(false);
        projectilesRef.current = [];
        setProjectiles([]);
        setGameResult("lost");
        setDamageReportWave(wave);
        setWaveDamageReport(waveUnitsRef.current.map((unit) => ({
          unitId: unit.id,
          typeId: unit.typeId,
          tier: unit.tier,
          damage: waveDamageRef.current[unit.id] ?? 0,
        })));
        setStatus("💀 몬스터 5회 완주! 즉시 게임 오버!");
        addLog("몬스터가 5바퀴를 완주해 게임이 종료되었습니다.");
        return;
      }

      // 3. 투사체 이동 & 명중 판정 (상성 데미지 + 9종 유닛 스킬 + 1초 상태이상 공통 면역)
      const remainingProjectiles: Projectile[] = [];
      let killGold = 0;

      const getMonsterPos = (m: Monster) => {
        const a = path[Math.min(m.pathStep, path.length - 1)] ?? start;
        const b = path[Math.min(m.pathStep + 1, path.length - 1)] ?? a;
        const [ar, ac] = toRC(a);
        const [br, bc] = toRC(b);
        return [ar + (br - ar) * m.progress, ac + (bc - ac) * m.progress];
      };

      const getMonDist = (m1: Monster, m2: Monster) => {
        const [r1, c1] = getMonsterPos(m1);
        const [r2, c2] = getMonsterPos(m2);
        return Math.hypot(r1 - r2, c1 - c2);
      };

      const getSourceDist = (p: Projectile, m: Monster) => {
        const [sourceRow, sourceCol] = toRC(p.fromCell);
        const [monsterRow, monsterCol] = getMonsterPos(m);
        return Math.hypot(monsterRow - sourceRow, monsterCol - sourceCol);
      };

      const getAreaDamage = (p: Projectile, m: Monster, distanceFactor = 1) =>
        Math.max(1, Math.round(
          p.baseDamage *
          DAMAGE_MULTIPLIERS[p.specType][m.category] *
          getSpecSynergyDamageMultiplier(p.specType, m.category, synergy) *
          distanceFactor,
        ));

      const dealDamage = (m: Monster, damage: number, sourceUnitId: number) => {
        if (m.hp <= 0 || damage <= 0) return 0;
        const actualDamage = Math.min(m.hp, damage);
        m.hp -= actualDamage;
        waveDamageRef.current[sourceUnitId] =
          (waveDamageRef.current[sourceUnitId] ?? 0) + actualDamage;
        m.lastHitTime = gameNow;
        if (m.hp <= 0) killGold += m.isBoss ? BOSS_KILL_GOLD : MONSTER_KILL_GOLD;
        return actualDamage;
      };

      for (const p of projectilesRef.current) {
        if (p.delayMs > 0) {
          p.delayMs = Math.max(0, p.delayMs - dt);
          remainingProjectiles.push(p);
          continue;
        }
        p.progress += dt / p.durationMs;
        if (p.progress >= 1) {
          const targetMon = monstersRef.current.find(
            (m) => m.id === p.targetId,
          );
          if (targetMon && targetMon.hp > 0) {
            // 주 대상 명중 시점 위치 주변 1.5타일 몬스터 그룹
            const nearbyMonsters = monstersRef.current.filter(
              (m) => m.hp > 0 && getMonDist(targetMon, m) <= 1.5,
            );

            // 🔮 마검사: 주 대상 + 주변 1.5타일 이내 최대 2마리 (총 3마리) 범위 피해
            if (p.effectType === "magic_swordsman") {
              const splashList = [
                targetMon,
                ...nearbyMonsters.filter((m) => m.id !== targetMon.id),
              ].slice(0, 3);
              splashList.forEach((m) => {
                dealDamage(m, getAreaDamage(p, m), p.sourceUnitId);
              });
            }
            // 🔥 화염술사: 주 대상 주변 범위 피해 + 테스트 확률 화상
            else if (p.effectType === "fire") {
              nearbyMonsters.forEach((m) => {
                const actualDamage = dealDamage(m, getAreaDamage(p, m), p.sourceUnitId);

                // 실제 입힌 피해의 50%만큼 즉시 화상 피해
                const isImmune =
                  m.statusImmunityUntilMs && gameNow < m.statusImmunityUntilMs;
                if (
                  m.hp > 0 &&
                  !isImmune &&
                  Math.random() < FIRE_BURN_CHANCE + MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]
                ) {
                  const burnExtraDmg = Math.round(actualDamage * 0.5);
                  if (burnExtraDmg > 0) {
                    dealDamage(m, burnExtraDmg, p.sourceUnitId);
                    m.burnEffectUntilMs = gameNow + 520;
                    m.statusImmunityUntilMs = gameNow + 1000;
                  }
                }
              });
            }
            // 💥 산탄총병: 적마다 사수와의 거리·상성을 따로 적용
            else if (p.effectType === "shotgun") {
              nearbyMonsters.forEach((m) => {
                const distance = getSourceDist(p, m);
                if (m.id !== targetMon.id && distance > p.rangeTiles) return;
                const ratio = Math.min(1, distance / p.rangeTiles);
                dealDamage(m, getAreaDamage(p, m, 1 - ratio * 0.5), p.sourceUnitId);
              });
            }
            // 일반 타격 / 얼음술사 / 번개술사 / 저격병
            else {
              if (p.effectType === "sniper") {
                if (targetMon.isBoss) {
                  targetMon.sniperImpactUntilMs = gameNow + 480;
                  dealDamage(targetMon, p.damage * BOSS_SNIPER_DAMAGE_MULTIPLIER, p.sourceUnitId);
                  setStatus(`🎯 [저격] 보스에게 중대 피해!`);
                } else {
                  dealDamage(targetMon, targetMon.hp, p.sourceUnitId);
                  setStatus(`🎯 [저격] 몬스터 #${targetMon.id} 헤드샷 즉사!`);
                }
              } else {
                dealDamage(targetMon, p.damage, p.sourceUnitId);
              }

              // ❄️ 얼음술사 둔화: 주 대상 주변 1.5타일 안의 모든 몬스터에게 1초 50% 둔화 적용!
              if (p.effectType === "ice") {
                nearbyMonsters.forEach((m) => {
                  const isImmune =
                    m.statusImmunityUntilMs && gameNow < m.statusImmunityUntilMs;
                  if (m.hp > 0 && !isImmune) {
                    m.slowUntilMs = gameNow + 1000;
                    m.statusImmunityUntilMs = gameNow + 1000; // 1초 면역
                  }
                });
              }

              // ⚡ 번개술사 마비: 단일 1초 마비
              if (p.effectType === "lightning") {
                const isImmune =
                  targetMon.statusImmunityUntilMs &&
                  gameNow < targetMon.statusImmunityUntilMs;
                if (targetMon.hp > 0 && !isImmune) {
                  targetMon.paralyzeUntilMs = gameNow + 1000;
                  targetMon.statusImmunityUntilMs = gameNow + 1000; // 1초 면역
                }
              }

            }
          }
        } else {
          remainingProjectiles.push(p);
        }
      }

      // 사망 몬스터 제거 & 골드 지급
      monstersRef.current = monstersRef.current.filter((m) => m.hp > 0);
      if (killGold > 0) {
        setGold((g) => g + killGold);
      }
      projectilesRef.current = remainingProjectiles;

      // 4. 유닛 사격 및 투사체 생성 (9종 유닛 스킬 개별 동작)
      for (const unit of unitsRef.current) {
        unit.cooldownMs = Math.max(0, unit.cooldownMs - dt);
        if (unit.cooldownMs > 0) continue;

        const uDef = UNIT_TYPES[unit.typeId];
        const rangeTiles = unit.rangeTiles + (
          uDef.unitClass === "ranger"
            ? RANGER_RANGE_BONUS_TILES[synergy.classTiers.ranger]
            : 0
        );
        const [unitRow, unitCol] = toRC(unit.cell);

        const getDistance = (monster: Monster) => {
          const a = path[Math.min(monster.pathStep, path.length - 1)] ?? start;
          const b = path[Math.min(monster.pathStep + 1, path.length - 1)] ?? a;
          const [ar, ac] = toRC(a);
          const [br, bc] = toRC(b);
          const monsterRow = ar + (br - ar) * monster.progress;
          const monsterCol = ac + (bc - ac) * monster.progress;
          return Math.hypot(monsterRow - unitRow, monsterCol - unitCol);
        };

        const inRange = monstersRef.current.filter(
          (m) => m.hp > 0 && getDistance(m) <= rangeTiles,
        );

        let target = inRange.find((m) => m.id === unit.targetId);
        if (!target) {
          target = [...inRange].sort(
            (a, b) => getDistance(a) - getDistance(b),
          )[0];
        }

        if (!target) {
          unit.targetId = null;
          continue;
        }

        const targetPathCell = path[Math.min(target.pathStep, path.length - 1)] ?? start;
        const nextTargetPathCell = path[Math.min(target.pathStep + 1, path.length - 1)] ?? targetPathCell;
        const [, targetCol] = toRC(targetPathCell);
        const [, nextTargetCol] = toRC(nextTargetPathCell);
        const interpolatedTargetCol = targetCol + (nextTargetCol - targetCol) * target.progress;
        if (interpolatedTargetCol !== unitCol) {
          unit.facing = interpolatedTargetCol < unitCol ? "left" : "right";
        }
        unit.targetId = target.id;
        unit.cooldownMs = uDef.unitClass === "warrior"
          ? unit.attackIntervalMs / (1 + WARRIOR_ATTACK_SPEED_BONUS[synergy.classTiers.warrior])
          : unit.attackIntervalMs;
        unit.lastAttackTimeMs = gameNow;

        // 상성 배율 계산
        const multiplier = DAMAGE_MULTIPLIERS[uDef.specType][target.category] *
          getSpecSynergyDamageMultiplier(uDef.specType, target.category, synergy);
        const upgradeLevels = getUpgradeLevels(upgrades, unit.typeId);
        const baseDmg = uDef.damage * (
          1 + (unit.tier - 1) * 0.5 + upgradeLevels * UPGRADE_DAMAGE_PER_LEVEL
        );
        const calculatedDamage = Math.max(1, Math.round(baseDmg * multiplier));

        // 유닛별 투사체 이펙트 및 발사 개수 분기
        if (unit.typeId === "dual_swordsman") {
          // 쌍검사: 두 타격의 합이 최종 피해량과 같도록 분배
          const firstHitDamage = Math.ceil(calculatedDamage / 2);
          const secondHitDamage = Math.floor(calculatedDamage / 2);
          projectilesRef.current.push({
            id: nextProjectile.current++,
            sourceUnitId: unit.id,
            sourceTypeId: unit.typeId,
            fromCell: unit.cell,
            targetId: target.id,
            damage: firstHitDamage,
            baseDamage: baseDmg,
            specType: uDef.specType,
            rangeTiles,
            progress: 0,
            delayMs: 180,
            durationMs: 140,
            effectType: "normal",
          });
          projectilesRef.current.push({
            id: nextProjectile.current++,
            sourceUnitId: unit.id,
            sourceTypeId: unit.typeId,
            fromCell: unit.cell,
            targetId: target.id,
            damage: secondHitDamage,
            baseDamage: baseDmg,
            specType: uDef.specType,
            rangeTiles,
            progress: 0,
            delayMs: 180,
            durationMs: 200,
            effectType: "normal",
          });
        } else {
          let effectType: Projectile["effectType"] = "normal";

          if (unit.typeId === "fire_mage") {
            effectType = "fire"; // 화염 범위
          } else if (unit.typeId === "magic_swordsman") {
            effectType = "magic_swordsman";
          } else if (
            unit.typeId === "ice_mage" &&
            Math.random() < ICE_SLOW_CHANCE + MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]
          ) {
            effectType = "ice";
          } else if (
            unit.typeId === "lightning_mage" &&
            Math.random() < LIGHTNING_PARALYZE_CHANCE + MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]
          ) {
            effectType = "lightning";
          } else if (unit.typeId === "shotgunner") {
            effectType = "shotgun"; // 산탄 범위
          } else if (unit.typeId === "sniper" && Math.random() < SNIPER_EXECUTE_CHANCE) {
            effectType = "sniper";
          }

          projectilesRef.current.push({
            id: nextProjectile.current++,
            sourceUnitId: unit.id,
            sourceTypeId: unit.typeId,
            fromCell: unit.cell,
            targetId: target.id,
            damage: calculatedDamage,
            baseDamage: baseDmg,
            specType: uDef.specType,
            rangeTiles,
            progress: 0,
            delayMs: 180,
            durationMs: 180,
            effectType,
          });
        }
      }

      // 5. State 일괄 갱신
      setMonsters([...monstersRef.current]);
      setProjectiles([...projectilesRef.current]);

      raf = requestAnimationFrame(frame);
    };

    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [running, paused, gameSpeed, path, start, toSpawn, upgrades, synergy, wave]);

  // 제한시간 종료 또는 몬스터 소멸 시 웨이브 완료 체크
  useEffect(() => {
    if (!running) return;

    if (life <= 0) {
      setRunning(false);
      projectilesRef.current = [];
      setProjectiles([]);
      setGameResult("lost");
      setStatus("💀 생명력 0 이하! 게임 오버");
      addLog("라이프가 0이 되어 게임이 종료되었습니다.");
      return;
    }

    const allSpawned = toSpawn === 0;
    const allCleared = monsters.length === 0;
    const timeExpired = waveTimeRemainingSec <= 0;

    if (allSpawned && (allCleared || timeExpired)) {
      setRunning(false);
      projectilesRef.current = [];
      setProjectiles([]);
      const restedUnits = unitsRef.current.map((unit) => ({
        ...unit,
        cooldownMs: 0,
        targetId: null,
        lastAttackTimeMs: undefined,
      }));
      unitsRef.current = restedUnits;
      setUnits(restedUnits);
      setDamageReportWave(wave);
      setWaveDamageReport(waveUnitsRef.current.map((unit) => ({
        unitId: unit.id,
        typeId: unit.typeId,
        tier: unit.tier,
        damage: waveDamageRef.current[unit.id] ?? 0,
      })));

      if (timeExpired && monsters.some((monster) => monster.isBoss)) {
        setGameResult("lost");
        setStatus("💀 제한시간 안에 보스를 처치하지 못해 게임 오버!");
        addLog(`${wave}스테이지 보스를 제한시간 안에 처치하지 못했습니다.`);
        return;
      }

      // 제한시간 초과 시 남아있는 몬스터 수만큼 Life 차감
      if (timeExpired && monsters.length > 0) {
        const remainingCount = monsters.length;
        const remainingLife = Math.max(0, life - remainingCount);
        setLife(remainingLife);
        addLog(`라이프가 ${remainingCount} 감소했습니다. (${remainingLife}/${START_LIFE})`);
        if (remainingLife === 0) {
          setGameResult("lost");
          setStatus(
            `💀 제한시간 종료! 남아있는 몬스터 ${remainingCount}마리로 Life가 0이 되어 게임 오버!`,
          );
          return;
        }
        setStatus(
          `⏱️ 제한시간 종료! 남아있는 몬스터 ${remainingCount}마리로 인해 Life -${remainingCount}`,
        );
      }

      const clearGold = isBossWave(wave)
        ? getBossClearGold(wave)
        : monsters.length > 0
          ? WAVE_TIMEOUT_GOLD
          : WAVE_CLEAR_GOLD;
      setGold((g) => g + clearGold);
      addLog(`${wave}스테이지가 종료되었습니다. 보상 ${clearGold}골드를 획득했습니다.`);

      if (wave >= PROTOTYPE_WAVES) {
        setGameResult("won");
        setStatus("🎉 FINAL BOSS를 처치했습니다! 게임 클리어!");
        addLog("FINAL STAGE를 클리어해 게임을 완료했습니다.");
      } else {
        setWave((w) => w + 1);
        waveTimeRemainingMs.current = getWaveTimeLimit(wave + 1) * 1000;
        setWaveTimeRemainingSec(getWaveTimeLimit(wave + 1));
      }
    }
  }, [monsters.length, toSpawn, running, life, wave, waveTimeRemainingSec]);

  const renderCellMenu = (cellIndex: number) => {
    const cell = grid[cellIndex];
    const unit = units.find((item) => item.cell === cellIndex);

    if (unit) {
      const comboKey = `${unit.typeId}_${unit.tier}`;
      const canCombine = unit.tier < 3 && combinableKeys.has(comboKey);
      const sellPrice = UNIT_SELL_PRICES[unit.tier as 1 | 2 | 3];
      return (
        <ContextActionMenu actions={{
          left: { label: "회수", onClick: () => recallMapUnit(unit.id) },
          right: { label: `판매 ${sellPrice}G`, onClick: () => sellMapUnit(unit.id) },
          bottom: {
            label: "승급",
            disabled: !canCombine,
            onClick: () => {
              handleCombineUnits(unit.typeId, unit.tier, unit.id);
              clearInteraction();
            },
          },
        }} />
      );
    }

    if (cell.type === "empty") {
      return (
        <ContextActionMenu actions={{
          top: {
            label: `벽 ${PLAYER_WALL_COST}G`,
            disabled: gold < PLAYER_WALL_COST || wallCount >= PLAYER_WALL_LIMIT,
            onClick: () => installWall(cellIndex),
          },
        }} />
      );
    }

    const hasStorageUnit = storageSlots.some((slot) => slot !== null);
    const refund = cell.type === "player"
      ? (cell.bornWave === wave
        ? (cell.cost ?? PLAYER_WALL_COST)
        : Math.floor((cell.cost ?? PLAYER_WALL_COST) * PLAYER_WALL_REFUND_RATE))
      : 0;
    const removeLabel = cell.type === "natural"
      ? `제거 ${NATURAL_DESTROY_COST}G`
      : `제거 +${refund}G`;

    return (
      <ContextActionMenu actions={{
        top: {
          label: removeLabel,
          disabled: cell.type === "natural" && gold < NATURAL_DESTROY_COST,
          onClick: () => removeWall(cellIndex),
        },
        left: {
          label: "유닛 배치",
          disabled: !hasStorageUnit || units.length >= unitDeployLimit,
          onClick: () => {
            setMapPlacementTarget(cellIndex);
            setActiveCellIndex(null);
            setSelectedUnitId(null);
            setSelectedStorageIndex(null);
            setHighlightMapPlacement(false);
            setStatus("📦 배치할 창고 유닛을 선택해줘.");
          },
        },
      }} />
    );
  };

  const renderSlotMenu = (index: number) => {
    const unit = storageSlots[index];
    if (!unit) return null;
    const comboKey = `${unit.typeId}_${unit.tier}`;
    const canCombine = unit.tier < 3 && combinableKeys.has(comboKey);
    const sellPrice = UNIT_SELL_PRICES[unit.tier as 1 | 2 | 3];
    return (
      <ContextActionMenu actions={{
        top: {
          label: "유닛 배치",
          disabled: units.length >= unitDeployLimit,
          onClick: () => {
            setSelectedStorageIndex(index);
            setSelectedUnitId(null);
            setActiveStorageIndex(null);
            setHighlightMapPlacement(true);
            setStatus("✨ 금색으로 표시된 맵 칸을 선택해줘.");
          },
        },
        left: {
          label: "승급",
          disabled: !canCombine,
          onClick: () => {
            handleCombineUnits(unit.typeId, unit.tier);
            clearInteraction();
          },
        },
        right: {
          label: `판매 ${sellPrice}G`,
          onClick: () => {
            handleSellStorageUnit(index);
            clearInteraction();
          },
        },
      }} />
    );
  };

  return (
    <main className="gamePage">
      {debugCodePromptOpen && (
        <div className="confirmOverlay" role="presentation">
          <form
            className="confirmDialog debugAccessDialog"
            onSubmit={(event) => { event.preventDefault(); submitDebugCode(); }}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setDebugCodePromptOpen(false);
                setDebugCodeError(false);
              }
            }}
          >
            <strong>디버그 모드 인증</strong>
            <p>디버그 모드를 활성화하려면 접근 번호를 입력하세요.</p>
            <input
              className="debugAccessInput"
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={4}
              value={debugCodeInput}
              onChange={(event) => {
                setDebugCodeInput(event.target.value.replace(/\D/g, "").slice(0, 4));
                setDebugCodeError(false);
              }}
              aria-label="디버그 접근 번호"
              autoFocus
            />
            {debugCodeError && <span className="debugAccessError">접근 번호가 올바르지 않습니다.</span>}
            <div className="confirmActions">
              <button type="button" onClick={() => { setDebugCodePromptOpen(false); setDebugCodeError(false); }}>취소</button>
              <button type="submit">확인</button>
            </div>
          </form>
        </div>
      )}
      {debugMode && (
        <DebugPanel
          brush={debugBrush}
          onBrushChange={setDebugBrush}
          onClearMap={handleDebugClearMap}
          onSetGold={(value) => setGold(Math.max(0, Math.floor(value || 0)))}
          onSetPlayerLevel={(value) => { setPlayerLevel(Math.min(MAX_PLAYER_LEVEL, Math.max(1, Math.floor(value || 1)))); setPlayerXp(0); }}
          onAddUnit={handleDebugAddUnit}
          onSpawnMonsters={handleDebugSpawnMonsters}
          onClearMonsters={handleDebugClearMonsters}
          onSetTimer={handleDebugSetTimer}
          onClose={() => { setDebugMode(false); setDebugBrush(null); }}
        />
      )}
      <div className="gameLayout">
        <aside className="leftRail">
          <section className="brandPanel panelBox">
            <div className="brandLogo" role="img" aria-label="Rogue Path Defense" />
          </section>
          <SynergyHud synergy={synergy} />
          <GameLog entries={gameLogs} />
        </aside>

        <section className="centerStage">
          <header className="topHud panelBox">
            <div className="stageSummary topStage">
              <strong className={isFinalStage(wave) ? "finalStageTitle" : ""}>
                {isFinalStage(wave) ? "FINAL STAGE" : `${isBossWave(wave) ? "BOSS " : ""}STAGE ${wave}`}
              </strong>
            </div>
            <div className={`waveTimer ${running && waveTimeRemainingSec <= 10 ? "danger" : ""}`}>
              <span>TIME</span>
              <strong>{running ? waveTimeRemainingSec : waveTimeLimit}</strong>
            </div>
            <div className="lapSummary">
              <span>최고 바퀴 수</span>
              <strong className={highestMonsterLaps >= MAX_MONSTER_LAPS ? "allDanger" : ""}>
                <em className={highestMonsterLaps >= 4 ? "danger" : ""}>{highestMonsterLaps}</em>/{MAX_MONSTER_LAPS}
              </strong>
            </div>
            <div className="topWaveSummary">
              <div><strong>현재 웨이브 정보</strong><span>남은 몹 {remainingMonsterCount}/{waveMonsterTotal}</span></div>
              <p>👨 {wavePercent(waveComposition.human)}%　🐺 {wavePercent(waveComposition.land)}%　🦅 {wavePercent(waveComposition.flying)}%</p>
            </div>
          </header>

          <GameBoard
            grid={grid}
            start={start}
            goal={goal}
            path={path}
            pathVisible={pathVisible}
            units={units}
            monsters={monsters}
            selectedUnitId={selectedUnitId}
            rangerRangeBonusTiles={RANGER_RANGE_BONUS_TILES[synergy.classTiers.ranger]}
            warriorAttackSpeedBonus={WARRIOR_ATTACK_SPEED_BONUS[synergy.classTiers.warrior]}
            upgrades={upgrades}
            onCellClick={onCellClick}
            projectiles={projectiles}
            gameNowMs={gameTimeMs.current}
            animationPaused={!running || paused}
            animationSpeed={gameSpeed}
            activeCellIndex={activeCellIndex}
            highlightedPlacementCells={highlightMapPlacement}
            renderCellMenu={renderCellMenu}
          />

          <UpgradeStrip upgrades={upgrades} />
          <div className="centerWorkspace">
            <UnitDetailPanel unit={selectedDetailUnit} upgrades={upgrades} synergy={synergy} emptyMessage={status} />
            <StorageBoard
              slots={storageSlots}
              selectedIndex={selectedStorageIndex}
              running={running}
              onSelectSlot={handleSelectStorageSlot}
              combinableKeys={combinableKeys}
              activeIndex={activeStorageIndex}
              placementSelectionActive={mapPlacementTarget !== null}
              renderSlotMenu={renderSlotMenu}
              upgrades={upgrades}
              warriorAttackSpeedBonus={WARRIOR_ATTACK_SPEED_BONUS[synergy.classTiers.warrior]}
              rangerRangeBonusTiles={RANGER_RANGE_BONUS_TILES[synergy.classTiers.ranger]}
            />
          </div>
        </section>

        <aside className="rightRail">
          <DamageReport wave={damageReportWave} entries={waveDamageReport} />
          <section className="playerResourcePanel panelBox">
            <div className="playerLevelRow">
              <strong>LV. {playerLevel}</strong>
              <span>{playerLevel >= MAX_PLAYER_LEVEL ? "최고 레벨" : `EXP ${playerXp}/${requiredPlayerXp}`}</span>
            </div>
            <div className="xpTrack"><span style={{ width: `${playerXpPercent}%` }} /></div>
            <div className="resourceRow">
              <span>❤️ LIFE <b>{life}/{START_LIFE}</b></span>
              <span>💰 GOLD <b>{gold}</b></span>
            </div>
            <div className="capacityRow">
              <span>⚔️ 배치 <b>{units.length}/{unitDeployLimit}</b></span>
              <span>🧱 벽 <b>{wallCount}/{PLAYER_WALL_LIMIT}</b></span>
            </div>
          </section>
          <CommandPanel
            gold={gold}
            running={running}
            gameEnded={gameResult !== "playing"}
            storageFull={storageSlots.every((slot) => slot !== null)}
            playerLevel={playerLevel}
            pathVisible={pathVisible}
            gameSpeed={gameSpeed}
            paused={paused}
            onBuyUnit={handleBuyShopUnit}
            onBuyUpgrade={handleBuyUpgrade}
            onBuyXp={handleBuyXp}
            onTogglePath={() => setPathVisible((visible) => !visible)}
            onToggleSpeed={() => setGameSpeed((speed) => speed === 1 ? 2 : 1)}
            onTogglePause={togglePause}
            onStartWave={startWave}
            onNewMap={resetMap}
            debugMode={debugMode}
            finalStage={isFinalStage(wave)}
            onToggleDebug={handleToggleDebug}
          />
        </aside>
      </div>
    </main>
  );
}

