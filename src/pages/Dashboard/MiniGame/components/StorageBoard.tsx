import type { ReactNode } from "react";
import type { StorageUnit } from "../games/types";
import { UNIT_TYPES } from "../games/constants";
import { getUpgradeLevels } from "../games/upgrades";
import type { DamageUpgrade } from "../games/upgrades";
import UnitTooltip from "./UnitTooltip";
import { UNIT_SPRITE_CLASSES } from "../games/unitSprites";

interface Props {
  slots: (StorageUnit | null)[];
  selectedIndex: number | null;
  running: boolean;
  onSelectSlot: (index: number) => void;
  combinableKeys: Set<string>; // e.g. "swordsman_1"
  activeIndex: number | null;
  placementSelectionActive: boolean;
  renderSlotMenu: (index: number) => ReactNode;
  upgrades: DamageUpgrade[];
  warriorAttackSpeedBonus: number;
  rangerRangeBonusTiles: number;
}

export default function StorageBoard({
  slots,
  selectedIndex,
  running,
  onSelectSlot,
  combinableKeys,
  activeIndex,
  placementSelectionActive,
  renderSlotMenu,
  upgrades,
  warriorAttackSpeedBonus,
  rangerRangeBonusTiles,
}: Props) {
  const usedCount = slots.filter((s) => s !== null).length;

  return (
    <section className="storageShell">
      <div className="storageHeader">
        <div className="storageTitleGroup">
          <span className="storageTitle">📦 창고 (보관함 20칸)</span>
          <span className="storageBadge">
            {usedCount}/{slots.length}
          </span>
        </div>
      </div>

      <div className="storageBoard">
        {slots.map((unit, idx) => {
          if (!unit) {
            return (
              <button
                key={idx}
                className={`storageSlot empty ${
                  selectedIndex === idx ? "selected" : ""
                }`}
                onClick={() => onSelectSlot(idx)}
                disabled={running}
              >
                <span className="slotNum">{idx + 1}</span>
              </button>
            );
          }

          const unitDef = UNIT_TYPES[unit.typeId];
          const spriteClass = UNIT_SPRITE_CLASSES[unit.typeId];
          const isSelected = selectedIndex === idx;
          const comboKey = `${unit.typeId}_${unit.tier}`;
          const canCombine = !running && combinableKeys.has(comboKey) && unit.tier < 3;

          return (
            <div
              key={idx}
              className={`storageSlot filled ${isSelected ? "selected" : ""} ${activeIndex === idx ? "menuOpen" : ""} ${placementSelectionActive ? "placementSource" : ""}`}
              role="button"
              tabIndex={0}
              onClick={() => onSelectSlot(idx)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") onSelectSlot(idx);
              }}
              style={{ borderColor: isSelected ? "#60a5fa" : undefined }}
            >
              <span className="slotNum">{idx + 1}</span>
              <span
                className={`storageUnitIcon ${spriteClass}`}
                style={{ color: unitDef?.color }}
              >
                {spriteClass ? "" : unitDef?.icon ?? "❓"}
              </span>
              <span className="storageUnitName">
                {unitDef?.name} {"★".repeat(unit.tier)}
              </span>

              {canCombine && <span className="combineReady">승급 가능</span>}
              <UnitTooltip
                typeId={unit.typeId}
                tier={unit.tier}
                upgradeLevels={getUpgradeLevels(upgrades, unit.typeId)}
                warriorAttackSpeedBonus={warriorAttackSpeedBonus}
                rangerRangeBonusTiles={rangerRangeBonusTiles}
              />
              {activeIndex === idx && renderSlotMenu(idx)}
            </div>
          );
        })}
      </div>
    </section>
  );
}

