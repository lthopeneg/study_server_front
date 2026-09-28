import { UNIT_TYPES } from "../games/constants";
import { getUpgradeLevels } from "../games/upgrades";
import type { DamageUpgrade } from "../games/upgrades";
import type { UnitTypeId } from "../games/types";

export default function UpgradeStrip({ upgrades }: { upgrades: DamageUpgrade[] }) {
  return (
    <section className="upgradeStrip panelBox">
      <strong>현재 업그레이드</strong>
      {(Object.keys(UNIT_TYPES) as UnitTypeId[]).map((typeId) => (
        <span key={typeId}>{UNIT_TYPES[typeId].name} <b>+{getUpgradeLevels(upgrades, typeId)}</b></span>
      ))}
    </section>
  );
}

