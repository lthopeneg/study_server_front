import { UNIT_TYPES, UPGRADE_DAMAGE_PER_LEVEL } from "../games/constants";
import type { UnitTypeId } from "../games/types";

interface Props {
  typeId: UnitTypeId;
  tier: number;
  upgradeLevels: number;
  warriorAttackSpeedBonus: number;
  rangerRangeBonusTiles: number;
}

const CLASS_NAMES = { warrior: "전사", mage: "마법사", ranger: "사수" } as const;
const SPEC_NAMES = { balance: "밸런스", land_spec: "육지", air_spec: "조류" } as const;

const formatStat = (value: number) => Number(value.toFixed(2)).toLocaleString();

export default function UnitTooltip({
  typeId,
  tier,
  upgradeLevels,
  warriorAttackSpeedBonus,
  rangerRangeBonusTiles,
}: Props) {
  const unit = UNIT_TYPES[typeId];
  const baseDamage = unit.damage * (1 + (tier - 1) * 0.5);
  const upgradeDamage = unit.damage * upgradeLevels * UPGRADE_DAMAGE_PER_LEVEL;
  const totalDamage = baseDamage + upgradeDamage;
  const attackInterval = unit.unitClass === "warrior"
    ? unit.attackIntervalMs / (1 + warriorAttackSpeedBonus)
    : unit.attackIntervalMs;
  const attacksPerSecond = 1000 / attackInterval;
  const range = unit.rangeTiles + (unit.unitClass === "ranger" ? rangerRangeBonusTiles : 0);

  return (
    <div className="unitTooltip" role="tooltip">
      <strong style={{ color: unit.color }}>{unit.icon} {unit.name} {"★".repeat(tier)}</strong>
      <span>{CLASS_NAMES[unit.unitClass]} · {SPEC_NAMES[unit.specType]}</span>
      <span className="unitTooltipDamage">
        공격력 {formatStat(baseDamage)} <b className="upgradeStat">(+{formatStat(upgradeDamage)})</b>
        <b> = {formatStat(totalDamage)}</b>
      </span>
      <span>공격속도 초당 {formatStat(attacksPerSecond)}회</span>
      <span>사거리 {formatStat(range)}칸</span>
      <span className="unitTooltipDescription">{unit.description}</span>
    </div>
  );
}

