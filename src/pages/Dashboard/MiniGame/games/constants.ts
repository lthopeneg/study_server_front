import type {
  MonsterCategory,
  SpecType,
  UnitTypeDef,
  UnitTypeId,
} from "./types";

export const ROWS = 7;
export const COLS = 20;
export const CELL_COUNT = ROWS * COLS;

export const START_GOLD = 180;
export const START_LIFE = 10;
export const START_PLAYER_LEVEL = 1;
export const MAX_PLAYER_LEVEL = 10;
export const BASE_UNIT_DEPLOY_LIMIT = 3;
export const XP_PURCHASE_COST = 20;
export const XP_PER_PURCHASE = 10;
export const getRequiredXp = (level: number) => 20 + (level - 1) * 10;
export const getUnitDeployLimit = (level: number) =>
  BASE_UNIT_DEPLOY_LIMIT + level - 1;
export const UNIT_SELL_PRICES: Record<1 | 2 | 3, number> = {
  1: 10,
  2: 35,
  3: 110,
};
export const PLAYER_WALL_COST = 10;
export const NATURAL_DESTROY_COST = 20;
export const PLAYER_WALL_REFUND_RATE = 0.5;
export const PLAYER_WALL_LIMIT = 18;
export const UNIT_RANGE_TILES = 1.5;

export const NATURAL_WALL_COUNT = 10;
export const PERMANENT_WALL_MIN = 2;
export const PERMANENT_WALL_MAX = 3;

export const PROTOTYPE_WAVES = 36;
export const FINAL_STAGE = 36;
export const MONSTERS_PER_WAVE = 25;
export const MONSTER_SPAWN_MS = 320;
export const BOSS_WAVE_INTERVAL = 5;
export const isFinalStage = (wave: number) => wave === FINAL_STAGE;
export const isBossWave = (wave: number) =>
  wave > 0 && (wave % BOSS_WAVE_INTERVAL === 0 || (wave >= 33 && wave <= FINAL_STAGE));
export const getWaveMonsterCount = (wave: number) =>
  wave === 31
    ? 45
    : wave === 32
      ? 55
      : MONSTERS_PER_WAVE + Math.floor((wave - 1) / 3) * 2;

// 일반 웨이브는 5:3:2 비율로 섞고 주력 유형을 매 스테이지 순환한다.
const MONSTER_MIX: readonly MonsterCategory[] = [
  "human", "land", "human", "flying", "land",
  "human", "flying", "human", "land", "human",
];
const MONSTER_ROTATION: readonly MonsterCategory[] = ["human", "land", "flying"];
export const getWaveMonsterCategory = (wave: number, spawnIndex: number): MonsterCategory => {
  const rotation = (wave - 1) % MONSTER_ROTATION.length;
  const categoryIndex = MONSTER_ROTATION.indexOf(MONSTER_MIX[spawnIndex % MONSTER_MIX.length]);
  return MONSTER_ROTATION[(categoryIndex + rotation) % MONSTER_ROTATION.length];
};
export const getWaveComposition = (wave: number): Record<MonsterCategory, number> => {
  const counts: Record<MonsterCategory, number> = { human: 0, land: 0, flying: 0 };
  if (isFinalStage(wave)) {
    return { human: 1, land: 1, flying: 1 };
  }
  if (isBossWave(wave)) {
    counts[getBossCategory(wave)] = 1;
    return counts;
  }
  const total = getWaveMonsterCount(wave);
  for (let index = 0; index < total; index++) {
    counts[getWaveMonsterCategory(wave, index)] += 1;
  }
  return counts;
};
export const getBossCategory = (wave: number): MonsterCategory => {
  if (wave === 33 || isFinalStage(wave)) return "human";
  if (wave === 34) return "land";
  if (wave === 35) return "flying";
  return MONSTER_ROTATION[(Math.floor(wave / BOSS_WAVE_INTERVAL) - 1) % MONSTER_ROTATION.length];
};
export const getBossHp = (wave: number) => {
  if (wave === 33) return 6500;
  if (wave === 34) return 7500;
  if (wave === 35) return 8500;
  if (isFinalStage(wave)) return 15000;
  return Math.round(BOSS_HP * 1.75 ** (Math.floor(wave / BOSS_WAVE_INTERVAL) - 1));
};
// 1차 밸런스: 인간은 기준형, 육지는 느리고 튼튼하며 조류는 빠르고 약하다.
export const MONSTER_STATS: Record<MonsterCategory, { hp: number; speed: number }> = {
  human: { hp: 40, speed: 1.4 },
  land: { hp: 55, speed: 1.15 },
  flying: { hp: 30, speed: 1.7 },
};
export const MONSTER_HP_GROWTH_PER_WAVE = 0.16;
export const getMonsterHp = (category: MonsterCategory, wave: number) =>
  Math.round(
    MONSTER_STATS[category].hp *
    (1 + Math.max(0, wave - 1) * MONSTER_HP_GROWTH_PER_WAVE) *
    (wave === 31 ? 1.35 : wave === 32 ? 1.65 : 1),
  );
export const BOSS_HP = 300;
export const BOSS_SNIPER_DAMAGE_MULTIPLIER = 3; // 즉사 발동 시 보스 대상 테스트 피해 배율
export const FIRE_BURN_CHANCE = 0.10;
export const ICE_SLOW_CHANCE = 0.10;
export const LIGHTNING_PARALYZE_CHANCE = 0.10;
export const SNIPER_EXECUTE_CHANCE = 0.05;

// 신규 룰 관련 상수
export const MAX_MONSTER_LAPS = 5; // 5회 완주 시 즉시 게임 오버
export const WAVE_TIME_LIMIT_SEC = 40; // 웨이브 제한시간 40초
export const FINAL_WAVE_TIME_LIMIT_SEC = 90;
export const getWaveTimeLimit = (wave: number) =>
  isFinalStage(wave) ? FINAL_WAVE_TIME_LIMIT_SEC : WAVE_TIME_LIMIT_SEC;
export const SHOP_DRAW_COST = 20;
export const UPGRADE_DRAW_COST = 30;
export const MONSTER_KILL_GOLD = 2;
export const BOSS_KILL_GOLD = 10;
export const WAVE_CLEAR_GOLD = 30;
export const BOSS_CLEAR_GOLD = 60;
export const getBossClearGold = (wave: number) =>
  isFinalStage(wave)
    ? 300
    : BOSS_CLEAR_GOLD + (Math.floor(wave / BOSS_WAVE_INTERVAL) - 1) * 20;
export const WAVE_TIMEOUT_GOLD = 10;
export const UPGRADE_DAMAGE_PER_LEVEL = 0.05; // +1업당 기본 피해량 5%

// 타입 상성 배율표
export const DAMAGE_MULTIPLIERS: Record<
  SpecType,
  Record<MonsterCategory, number>
> = {
  balance: {
    human: 1.0,
    land: 1.0,
    flying: 1.0,
  },
  land_spec: {
    human: 0.75,
    land: 1.0,
    flying: 0.5,
  },
  air_spec: {
    human: 0.75,
    land: 0.5,
    flying: 1.0,
  },
};

// 9종 유닛 상세 정의
export const UNIT_TYPES: Record<UnitTypeId, UnitTypeDef> = {
  // --- 전사 계열 ---
  swordsman: {
    id: "swordsman",
    name: "검사",
    icon: "⚔️",
    color: "#60a5fa",
    unitClass: "warrior",
    specType: "balance",
    cost: SHOP_DRAW_COST,
    damage: 11,
    rangeTiles: 1.5,
    attackIntervalMs: 500,
    description: "밸런스형 근접 전사 (인간/육지/조류 100%)",
  },
  dual_swordsman: {
    id: "dual_swordsman",
    name: "쌍검사",
    icon: "🗡️",
    color: "#38bdf8",
    unitClass: "warrior",
    specType: "land_spec",
    cost: SHOP_DRAW_COST,
    damage: 12, // 1회 공격 총 피해를 두 타격으로 분할
    rangeTiles: 1.3,
    attackIntervalMs: 450,
    description: "육지 특화 근접 전사 (1회 공격 당 2Hit 데미지)",
  },
  magic_swordsman: {
    id: "magic_swordsman",
    name: "마검사",
    icon: "🔮",
    color: "#818cf8",
    unitClass: "warrior",
    specType: "air_spec",
    cost: SHOP_DRAW_COST,
    damage: 10,
    rangeTiles: 1.8,
    attackIntervalMs: 700,
    description: "조류 특화 범위 전사 (주 대상 + 주변 최대 2마리 타격)",
  },

  // --- 마법사 계열 ---
  fire_mage: {
    id: "fire_mage",
    name: "화염술사",
    icon: "🔥",
    color: "#f87171",
    unitClass: "mage",
    specType: "balance",
    cost: SHOP_DRAW_COST,
    damage: 11,
    rangeTiles: 2.2,
    attackIntervalMs: 900,
    description: "밸런스형 범위 마법사 (10% 확률로 50% 화상 추가피해)",
  },
  ice_mage: {
    id: "ice_mage",
    name: "얼음술사",
    icon: "❄️",
    color: "#a78bfa",
    unitClass: "mage",
    specType: "land_spec",
    cost: SHOP_DRAW_COST,
    damage: 9,
    rangeTiles: 2.3,
    attackIntervalMs: 850,
    description: "육지 특화 CC 마법사 (10% 확률로 주변 적 1초간 50% 둔화)",
  },
  lightning_mage: {
    id: "lightning_mage",
    name: "번개술사",
    icon: "⚡",
    color: "#fbbf24",
    unitClass: "mage",
    specType: "air_spec",
    cost: SHOP_DRAW_COST,
    damage: 10,
    rangeTiles: 2.4,
    attackIntervalMs: 900,
    description: "조류 특화 CC 마법사 (10% 확률로 대상 1초간 마비/이동불가)",
  },

  // --- 사수 계열 ---
  rifleman: {
    id: "rifleman",
    name: "소총수",
    icon: "🎯",
    color: "#4ade80",
    unitClass: "ranger",
    specType: "balance",
    cost: SHOP_DRAW_COST,
    damage: 13,
    rangeTiles: 2.8,
    attackIntervalMs: 650,
    description: "밸런스형 원거리 사수 (긴 사거리, 안정적 단일 피해)",
  },
  shotgunner: {
    id: "shotgunner",
    name: "산탄총병",
    icon: "💥",
    color: "#f97316",
    unitClass: "ranger",
    specType: "land_spec",
    cost: SHOP_DRAW_COST,
    damage: 14,
    rangeTiles: 1.8,
    attackIntervalMs: 750,
    description: "육지 특화 범위 사수 (적과의 거리가 가까울수록 100%~50% 피해)",
  },
  sniper: {
    id: "sniper",
    name: "저격병",
    icon: "🏹",
    color: "#e879f9",
    unitClass: "ranger",
    specType: "air_spec",
    cost: SHOP_DRAW_COST,
    damage: 30,
    rangeTiles: 3.8,
    attackIntervalMs: 1800,
    description: "조류 특화 초장거리 사수 (매우 강한 피해, 5% 확률 일반적 즉사)",
  },
};
