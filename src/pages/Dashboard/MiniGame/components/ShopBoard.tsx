import {
  MAX_PLAYER_LEVEL,
  SHOP_DRAW_COST,
  UNIT_TYPES,
  UPGRADE_DAMAGE_PER_LEVEL,
  UPGRADE_DRAW_COST,
  XP_PER_PURCHASE,
  XP_PURCHASE_COST,
} from "../games/constants";
import { getUpgradeLabel, getUpgradeLevels } from "../games/upgrades";
import type { DamageUpgrade } from "../games/upgrades";
import type { UnitTypeId } from "../games/types";

interface Props {
  gold: number;
  running: boolean;
  gameEnded: boolean;
  storageFull: boolean;
  onBuyUnit: () => void;
  onBuyUpgrade: () => void;
  upgrades: DamageUpgrade[];
  playerLevel: number;
  onBuyXp: () => void;
}

export default function ShopBoard({
  gold,
  running,
  gameEnded,
  storageFull,
  onBuyUnit,
  onBuyUpgrade,
  upgrades,
  playerLevel,
  onBuyXp,
}: Props) {
  const canBuyUnit = !running && !gameEnded && !storageFull && gold >= SHOP_DRAW_COST;
  const canBuyUpgrade = !running && !gameEnded && gold >= UPGRADE_DRAW_COST;
  const canBuyXp = !running && !gameEnded && playerLevel < MAX_PLAYER_LEVEL &&
    gold >= XP_PURCHASE_COST;
  const upgradeState = (Object.keys(UNIT_TYPES) as UnitTypeId[])
    .map((typeId) => ({ typeId, levels: getUpgradeLevels(upgrades, typeId) }))
    .filter(({ levels }) => levels > 0);
  const latestUpgrade = upgrades.at(-1);

  return (
    <section className="shopShell">
      <div className="shopHeader">
        <span className="shopTitle">🏪 유닛 상점</span>
        <span className="shopSub">유닛이나 피해량 업그레이드를 무작위로 구매합니다.</span>
      </div>
      <div className="shopActions">
        <button
          className="shopBuyButton"
          type="button"
          onClick={onBuyUnit}
          disabled={!canBuyUnit}
        >
          🎲 유닛 구매 · {SHOP_DRAW_COST}G
        </button>
        <button
          className="shopBuyButton"
          type="button"
          onClick={onBuyUpgrade}
          disabled={!canBuyUpgrade}
        >
          ✨ 업그레이드 구매 · {UPGRADE_DRAW_COST}G
        </button>
        <button
          className="shopBuyButton"
          type="button"
          onClick={onBuyXp}
          disabled={!canBuyXp}
        >
          📘 경험 구매 · {XP_PURCHASE_COST}G
        </button>
      </div>
      <p className="shopHelp">
        경험치 +{XP_PER_PURCHASE} · 업그레이드 +1당 피해량 +{UPGRADE_DAMAGE_PER_LEVEL * 100}%
      </p>
      {storageFull && <p className="shopNotice">창고가 가득 찼습니다.</p>}
      {latestUpgrade && (
        <p className="latestUpgrade">마지막 획득: {getUpgradeLabel(latestUpgrade)}</p>
      )}
      <div className="shopUpgradeList">
        <strong>현재 피해 업그레이드</strong>
        {upgradeState.length === 0 ? (
          <span> 없음</span>
        ) : (
          <ul>
            {upgradeState.map(({ typeId, levels }) => (
              <li key={typeId}>{UNIT_TYPES[typeId].icon} {UNIT_TYPES[typeId].name} +{levels}업</li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

