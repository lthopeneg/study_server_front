import {
  AIR_DAMAGE_BONUS,
  BALANCE_DAMAGE_BONUS,
  LAND_DAMAGE_BONUS,
  MAGE_STATUS_CHANCE_BONUS,
  RANGER_RANGE_BONUS_TILES,
  WARRIOR_ATTACK_SPEED_BONUS,
} from "../games/synergies";
import type { SynergyState } from "../games/synergies";

interface Props { synergy: SynergyState; }
interface SynergyItemProps {
  name: string;
  count: number;
  tier: number;
  description: string;
  values: readonly number[];
  formatValue: (value: number) => string;
  colorClass: string;
}

const getNextThreshold = (count: number) =>
  count >= 15 ? 15 : (Math.floor(count / 3) + 1) * 3;

function SynergyItem({
  name,
  count,
  tier,
  description,
  values,
  formatValue,
  colorClass,
}: SynergyItemProps) {
  const threshold = getNextThreshold(count);
  return (
    <div className={`synergyItem ${colorClass}`}>
      <div className="synergyItemTitle">
        <strong>{name}</strong>
        <span>{count}/{threshold}{count >= 15 ? " MAX" : ""}</span>
      </div>
      <div className="synergyEffectPreview">
        <span className="synergyEffectName">{description} :</span>
        <span className="synergyValues">
          {values.slice(1).map((value, index) => (
            <span key={index} className={`synergyValue ${tier === index + 1 ? "active" : ""}`}>
              {formatValue(value)}{index < values.length - 2 ? " /" : ""}
            </span>
          ))}
        </span>
      </div>
    </div>
  );
}

export default function SynergyHud({ synergy }: Props) {
  const { classCounts, specCounts, classTiers, specTiers } = synergy;
  const percent = (value: number) => `${Math.round(value * 100)}%`;
  const percentPoint = (value: number) => `${Math.round(value * 100)}%p`;
  const tiles = (value: number) => `${value}칸`;

  return (
    <section className="synergyShell panelBox">
      <h2>현재 적용중인 시너지</h2>
      <div className="synergyList">
        <SynergyItem name="전사" count={classCounts.warrior} tier={classTiers.warrior}
          description="전사 유닛 공격 속도 증가" values={WARRIOR_ATTACK_SPEED_BONUS}
          formatValue={percent} colorClass="warrior" />
        <SynergyItem name="마법사" count={classCounts.mage} tier={classTiers.mage}
          description="마법사 상태이상 확률 증가" values={MAGE_STATUS_CHANCE_BONUS}
          formatValue={percentPoint} colorClass="mage" />
        <SynergyItem name="사수" count={classCounts.ranger} tier={classTiers.ranger}
          description="사수 유닛 사거리 증가" values={RANGER_RANGE_BONUS_TILES}
          formatValue={tiles} colorClass="ranger" />
        <SynergyItem name="밸런스" count={specCounts.balance} tier={specTiers.balance}
          description="모든 적 대상 피해 증가" values={BALANCE_DAMAGE_BONUS}
          formatValue={percent} colorClass="balance" />
        <SynergyItem name="육지" count={specCounts.land_spec} tier={specTiers.land_spec}
          description="육지마수 대상 피해 증가" values={LAND_DAMAGE_BONUS}
          formatValue={percent} colorClass="land" />
        <SynergyItem name="조류" count={specCounts.air_spec} tier={specTiers.air_spec}
          description="조류마수 대상 피해 증가" values={AIR_DAMAGE_BONUS}
          formatValue={percent} colorClass="air" />
      </div>
    </section>
  );
}

