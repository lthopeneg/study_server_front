import { UNIT_TYPES } from "./constants";
import type { SpecType, UnitClass, UnitTypeId } from "./types";

export type DamageUpgrade =
  | { scope: "unit"; target: UnitTypeId; levels: number }
  | { scope: "class"; target: UnitClass; levels: number }
  | { scope: "spec"; target: SpecType; levels: number }
  | { scope: "all"; levels: number };

const UNIT_IDS = Object.keys(UNIT_TYPES) as UnitTypeId[];
const CLASSES: UnitClass[] = ["warrior", "mage", "ranger"];
const SPECS: SpecType[] = ["balance", "land_spec", "air_spec"];

const CLASS_NAMES: Record<UnitClass, string> = {
  warrior: "전사",
  mage: "마법사",
  ranger: "사수",
};

const SPEC_NAMES: Record<SpecType, string> = {
  balance: "밸런스",
  land_spec: "육지 특화",
  air_spec: "조류 특화",
};

function pickWeighted<T>(items: readonly T[], weights: readonly number[], random: () => number): T {
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  let roll = random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll < 0) return items[i];
  }
  return items[items.length - 1];
}

function pickUniform<T>(items: readonly T[], random: () => number): T {
  return items[Math.floor(random() * items.length)];
}

export function rollDamageUpgrade(random: () => number = Math.random): DamageUpgrade {
  // 범위별 총 확률: 개별 유닛 60%, 직업 25%, 특화 12%, 전체 3%.
  const scope = pickWeighted(["unit", "class", "spec", "all"] as const, [60, 25, 12, 3], random);
  const levels = scope === "all"
    ? pickWeighted([1, 2] as const, [80, 20], random)
    : pickWeighted([1, 2, 3] as const, [60, 30, 10], random);

  if (scope === "unit") return { scope, target: pickUniform(UNIT_IDS, random), levels };
  if (scope === "class") return { scope, target: pickUniform(CLASSES, random), levels };
  if (scope === "spec") return { scope, target: pickUniform(SPECS, random), levels };
  return { scope, levels };
}

export function upgradeAppliesToUnit(upgrade: DamageUpgrade, typeId: UnitTypeId): boolean {
  if (upgrade.scope === "all") return true;
  if (upgrade.scope === "unit") return upgrade.target === typeId;
  if (upgrade.scope === "class") return UNIT_TYPES[typeId].unitClass === upgrade.target;
  return UNIT_TYPES[typeId].specType === upgrade.target;
}

export function getUpgradeLevels(upgrades: readonly DamageUpgrade[], typeId: UnitTypeId): number {
  return upgrades.reduce(
    (sum, upgrade) => sum + (upgradeAppliesToUnit(upgrade, typeId) ? upgrade.levels : 0),
    0,
  );
}

export function getUpgradeLabel(upgrade: DamageUpgrade): string {
  const target = upgrade.scope === "all"
    ? "모든 유닛"
    : upgrade.scope === "unit"
      ? UNIT_TYPES[upgrade.target].name
      : upgrade.scope === "class"
        ? `${CLASS_NAMES[upgrade.target]} 전체`
        : `${SPEC_NAMES[upgrade.target]} 전체`;
  return `${target} +${upgrade.levels}업`;
}
