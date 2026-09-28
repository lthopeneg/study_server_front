import {
  FIRE_BURN_CHANCE,
  ICE_SLOW_CHANCE,
  LIGHTNING_PARALYZE_CHANCE,
  SNIPER_EXECUTE_CHANCE,
  UNIT_TYPES,
  UPGRADE_DAMAGE_PER_LEVEL,
} from "../games/constants";
import {
  AIR_DAMAGE_BONUS,
  BALANCE_DAMAGE_BONUS,
  LAND_DAMAGE_BONUS,
  MAGE_STATUS_CHANCE_BONUS,
  RANGER_RANGE_BONUS_TILES,
  WARRIOR_ATTACK_SPEED_BONUS,
} from "../games/synergies";
import type { SynergyState } from "../games/synergies";
import { getUpgradeLevels } from "../games/upgrades";
import type { DamageUpgrade } from "../games/upgrades";
import type { StorageUnit } from "../games/types";
import { UNIT_PORTRAIT_CLASSES } from "../games/unitSprites";

interface Props {
  unit: StorageUnit | null;
  upgrades: DamageUpgrade[];
  synergy: SynergyState;
  emptyMessage: string;
}

const CLASS_NAMES = { warrior: "전사", mage: "마법사", ranger: "사수" } as const;
const SPEC_NAMES = { balance: "밸런스", land_spec: "육지", air_spec: "조류" } as const;
const format = (value: number) => Number(value.toFixed(2)).toLocaleString();
const percent = (value: number) => `${Math.round(value * 100)}%`;

export default function UnitDetailPanel({ unit, upgrades, synergy, emptyMessage }: Props) {
  if (!unit) {
    return (
      <section className="unitDetailPanel unitDetailEmpty panelBox">
        <strong>유닛 상세정보</strong>
        <span>맵이나 창고에서 유닛을 선택해 주세요.</span>
        <small>{emptyMessage}</small>
      </section>
    );
  }

  const def = UNIT_TYPES[unit.typeId];
  const portraitClass = UNIT_PORTRAIT_CLASSES[unit.typeId];
  const upgradeLevels = getUpgradeLevels(upgrades, unit.typeId);
  const baseDamage = def.damage * (1 + (unit.tier - 1) * 0.5);
  const upgradeDamage = def.damage * upgradeLevels * UPGRADE_DAMAGE_PER_LEVEL;
  const baseAttacksPerSecond = 1000 / def.attackIntervalMs;
  const attackSpeedBonus = def.unitClass === "warrior"
    ? WARRIOR_ATTACK_SPEED_BONUS[synergy.classTiers.warrior]
    : 0;
  const rangeBonus = def.unitClass === "ranger"
    ? RANGER_RANGE_BONUS_TILES[synergy.classTiers.ranger]
    : 0;
  const mageBonus = def.unitClass === "mage"
    ? MAGE_STATUS_CHANCE_BONUS[synergy.classTiers.mage]
    : 0;
  const specBonus = def.specType === "balance"
    ? BALANCE_DAMAGE_BONUS[synergy.specTiers.balance]
    : def.specType === "land_spec"
      ? LAND_DAMAGE_BONUS[synergy.specTiers.land_spec]
      : AIR_DAMAGE_BONUS[synergy.specTiers.air_spec];
  const specTarget = def.specType === "balance" ? "모든 적" : def.specType === "land_spec" ? "육지 적" : "조류 적";

  const specialEffect = (() => {
    if (unit.typeId === "fire_mage") return <>{percent(FIRE_BURN_CHANCE)}<i>{mageBonus > 0 ? ` (+${percent(mageBonus)})` : ""}</i> 확률로 50% 화상 추가 피해</>;
    if (unit.typeId === "ice_mage") return <>{percent(ICE_SLOW_CHANCE)}<i>{mageBonus > 0 ? ` (+${percent(mageBonus)})` : ""}</i> 확률로 주변 적을 1초간 50% 둔화</>;
    if (unit.typeId === "lightning_mage") return <>{percent(LIGHTNING_PARALYZE_CHANCE)}<i>{mageBonus > 0 ? ` (+${percent(mageBonus)})` : ""}</i> 확률로 대상을 1초간 마비</>;
    if (unit.typeId === "sniper") return <>{percent(SNIPER_EXECUTE_CHANCE)} 확률로 일반 적 즉사</>;
    if (unit.typeId === "swordsman" || unit.typeId === "rifleman") return <>없음</>;
    return <>{def.description}</>;
  })();

  return (
    <section className="unitDetailPanel panelBox">
      <div
        className={`unitDetailPortrait ${portraitClass}`}
        style={{ color: def.color }}
        aria-hidden="true"
      >
      </div>
      <div className="unitDetailStats">
        <div className="unitDetailHeading">
          <span>{"★".repeat(unit.tier)}</span>
          <strong style={{ color: def.color }}>{def.name}</strong>
        </div>
        <dl>
          <div><dt>직업</dt><dd>{CLASS_NAMES[def.unitClass]}</dd></div>
          <div><dt>특화</dt><dd>{SPEC_NAMES[def.specType]}</dd></div>
          <div className="unitDetailGap"><dt>공격력</dt><dd>{format(baseDamage)} <b className="upgradeStat">(+{format(upgradeDamage)})</b></dd></div>
          <div><dt>공격속도</dt><dd>{format(baseAttacksPerSecond)}회/초 {attackSpeedBonus > 0 && <b className="synergyStat">(+{percent(attackSpeedBonus)})</b>}</dd></div>
          <div><dt>사거리</dt><dd>{format(def.rangeTiles)}칸 {rangeBonus > 0 && <b className="synergyStat">(+{format(rangeBonus)}칸)</b>}</dd></div>
          <div><dt>{specTarget} 피해</dt><dd>{specBonus > 0 ? <b className="synergyStat">+{percent(specBonus)}</b> : "없음"}</dd></div>
        </dl>
        <div className="unitSpecialEffect"><strong>특수효과</strong><p>{specialEffect}</p></div>
      </div>
    </section>
  );
}

