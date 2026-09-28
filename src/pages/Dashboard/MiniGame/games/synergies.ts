import { UNIT_TYPES } from "./constants";
import type { MonsterCategory, SpecType, Unit, UnitClass } from "./types";

export const SYNERGY_THRESHOLDS = [3, 6, 9, 12, 15] as const;

// 단계 0은 시너지 미발동. 아래 수치는 플레이 테스트용이다.
export const WARRIOR_ATTACK_SPEED_BONUS = [0, 0.05, 0.10, 0.15, 0.20, 0.25] as const;
export const MAGE_STATUS_CHANCE_BONUS = [0, 0.02, 0.04, 0.06, 0.08, 0.10] as const;
export const RANGER_RANGE_BONUS_TILES = [0, 0.15, 0.30, 0.45, 0.60, 0.75] as const;
export const BALANCE_DAMAGE_BONUS = [0, 0.03, 0.06, 0.09, 0.12, 0.15] as const;
export const LAND_DAMAGE_BONUS = [0, 0.05, 0.10, 0.15, 0.20, 0.25] as const;
export const AIR_DAMAGE_BONUS = [0, 0.05, 0.10, 0.15, 0.20, 0.25] as const;

export interface SynergyState {
  classCounts: Record<UnitClass, number>;
  specCounts: Record<SpecType, number>;
  classTiers: Record<UnitClass, number>;
  specTiers: Record<SpecType, number>;
}

export function getSynergyTier(count: number): number {
  for (let index = SYNERGY_THRESHOLDS.length - 1; index >= 0; index--) {
    if (count >= SYNERGY_THRESHOLDS[index]) return index + 1;
  }
  return 0;
}

export function getSynergyState(units: readonly Unit[]): SynergyState {
  const classCounts: Record<UnitClass, number> = { warrior: 0, mage: 0, ranger: 0 };
  const specCounts: Record<SpecType, number> = { balance: 0, land_spec: 0, air_spec: 0 };

  for (const unit of units) {
    const definition = UNIT_TYPES[unit.typeId];
    classCounts[definition.unitClass]++;
    specCounts[definition.specType]++;
  }

  return {
    classCounts,
    specCounts,
    classTiers: {
      warrior: getSynergyTier(classCounts.warrior),
      mage: getSynergyTier(classCounts.mage),
      ranger: getSynergyTier(classCounts.ranger),
    },
    specTiers: {
      balance: getSynergyTier(specCounts.balance),
      land_spec: getSynergyTier(specCounts.land_spec),
      air_spec: getSynergyTier(specCounts.air_spec),
    },
  };
}

export function getSpecSynergyDamageMultiplier(
  specType: SpecType,
  category: MonsterCategory,
  synergy: SynergyState,
): number {
  if (specType === "balance") return 1 + BALANCE_DAMAGE_BONUS[synergy.specTiers.balance];
  if (specType === "land_spec" && category === "land") {
    return 1 + LAND_DAMAGE_BONUS[synergy.specTiers.land_spec];
  }
  if (specType === "air_spec" && category === "flying") {
    return 1 + AIR_DAMAGE_BONUS[synergy.specTiers.air_spec];
  }
  return 1;
}
