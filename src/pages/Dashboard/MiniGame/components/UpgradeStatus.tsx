import { UNIT_TYPES, UPGRADE_DAMAGE_PER_LEVEL } from "../games/constants";
import { getUpgradeLabel, getUpgradeLevels } from "../games/upgrades";
import type { DamageUpgrade } from "../games/upgrades";
import type { UnitTypeId } from "../games/types";

interface Props { upgrades: DamageUpgrade[]; }

export default function UpgradeStatus({ upgrades }: Props) {
  const current = (Object.keys(UNIT_TYPES) as UnitTypeId[])
    .map((typeId) => ({ typeId, levels: getUpgradeLevels(upgrades, typeId) }))
    .filter(({ levels }) => levels > 0);
  const latest = upgrades.at(-1);

  return (
    <section className="upgradeStatus panelBox">
      <h2>현재 업그레이드</h2>
      <p className="upgradeRule">+1업당 기본 피해량 +{UPGRADE_DAMAGE_PER_LEVEL * 100}%</p>
      {latest && <p className="latestUpgrade">최근: {getUpgradeLabel(latest)}</p>}
      {current.length === 0 ? (
        <p className="upgradeEmpty">적용된 업그레이드 없음</p>
      ) : (
        <div className="upgradeStatusList">
          {current.map(({ typeId, levels }) => (
            <span key={typeId}>{UNIT_TYPES[typeId].icon} {UNIT_TYPES[typeId].name} +{levels}</span>
          ))}
        </div>
      )}
    </section>
  );
}

