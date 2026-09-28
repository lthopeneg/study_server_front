/* 경로 애니메이션은 표시 경로 변경 시 프레임 위치를 즉시 초기화한다. */
/* eslint-disable react-hooks/set-state-in-effect, no-useless-assignment */
import type {
  CellData,
  Monster,
  MonsterCategory,
  Projectile,
  Unit,
} from "../games/types";
import { COLS, ROWS, UNIT_TYPES } from "../games/constants";
import { useEffect, useState, type ReactNode } from "react";
import type { DamageUpgrade } from "../games/upgrades";
import { getUpgradeLevels } from "../games/upgrades";
import { UNIT_EFFECT_CLASSES, UNIT_SPRITE_CLASSES } from "../games/unitSprites";
import UnitTooltip from "./UnitTooltip";

const START_POINT_IMAGE = new URL("../images/start-point.png", import.meta.url).href;
const END_POINT_IMAGE = new URL("../images/end-point.png", import.meta.url).href;
const NATURAL_WALL_IMAGE = new URL("../images/natural-wall.png", import.meta.url).href;
const PERMANENT_WALL_IMAGE = new URL("../images/permanent-wall.png", import.meta.url).href;
const PLAYER_WALL_IMAGE = new URL("../images/player-wall.png", import.meta.url).href;
const ROAD_GRASS_IMAGE = new URL("../images/road-grass.png", import.meta.url).href;
const ROAD_STRAIGHT_IMAGE = new URL("../images/road-straight.png", import.meta.url).href;
const ROAD_CORNER_IMAGE = new URL("../images/road-corner.png", import.meta.url).href;
const ROAD_THREEWAY_IMAGE = new URL("../images/road-threeway.png", import.meta.url).href;
const ROAD_FOURWAY_IMAGE = new URL("../images/road-fourway.png", import.meta.url).href;

function getRoadTile(cellIndex: number, pathCells: Set<number>) {
  if (!pathCells.has(cellIndex)) return { src: ROAD_GRASS_IMAGE, rotation: 0 };

  const row = Math.floor(cellIndex / COLS);
  const col = cellIndex % COLS;
  const up = row > 0 && pathCells.has(cellIndex - COLS);
  const right = col < COLS - 1 && pathCells.has(cellIndex + 1);
  const down = row < ROWS - 1 && pathCells.has(cellIndex + COLS);
  const left = col > 0 && pathCells.has(cellIndex - 1);
  const count = Number(up) + Number(right) + Number(down) + Number(left);

  if (count === 4) return { src: ROAD_FOURWAY_IMAGE, rotation: 0 };
  if (count === 3) {
    const rotation = !up ? 0 : !right ? 90 : !down ? 180 : 270;
    return { src: ROAD_THREEWAY_IMAGE, rotation };
  }
  if (count === 2) {
    if (up && down) return { src: ROAD_STRAIGHT_IMAGE, rotation: 0 };
    if (left && right) return { src: ROAD_STRAIGHT_IMAGE, rotation: 90 };
    const rotation = up && left ? 0 : up && right ? 90 : right && down ? 180 : 270;
    return { src: ROAD_CORNER_IMAGE, rotation };
  }
  if (count === 1) {
    return { src: ROAD_STRAIGHT_IMAGE, rotation: left || right ? 90 : 0 };
  }
  return { src: ROAD_GRASS_IMAGE, rotation: 0 };
}

interface Props {
  grid: CellData[];
  start: number;
  goal: number;
  path: number[];
  pathVisible: boolean;
  units: Unit[];
  monsters: Monster[];
  selectedUnitId: number | null;
  rangerRangeBonusTiles: number;
  warriorAttackSpeedBonus: number;
  upgrades: DamageUpgrade[];
  onCellClick: (i: number) => void;
  projectiles: Projectile[];
  gameNowMs: number;
  animationPaused: boolean;
  animationSpeed: 1 | 2;
  activeCellIndex: number | null;
  highlightedPlacementCells: boolean;
  renderCellMenu: (cellIndex: number) => ReactNode;
}

const MONSTER_SPRITE_CLASSES: Record<MonsterCategory, string> = {
  human: "enemyHumanSprite",
  land: "enemyLandSprite",
  flying: "enemyFlySprite",
};
const BOSS_SPRITE_CLASSES: Partial<Record<number, string>> = {
  5: "bossStage05Sprite",
  10: "bossStage10Sprite",
  15: "bossStage15Sprite",
  20: "bossStage20Sprite",
  25: "bossStage25Sprite",
  30: "bossStage30Sprite",
  33: "bossStage33Sprite",
  34: "bossStage34Sprite",
  35: "bossStage35Sprite",
};
const FINAL_BOSS_SPRITE_CLASSES: Record<1 | 2 | 3, string> = {
  1: "finalBossPhase1Sprite",
  2: "finalBossPhase2Sprite",
  3: "finalBossPhase3Sprite",
};
const BOSS_NAMES: Record<MonsterCategory, string> = {
  human: "밸런스형",
  land: "육지형",
  flying: "조류형",
};

export default function GameBoard(p: Props) {
  const [pathPulseStart, setPathPulseStart] = useState(0);
  const visiblePath = p.path.slice(1, -1);
  const pathCells = new Set(p.path);
  const pathIndexByCell = new Map(visiblePath.map((cellIndex, index) => [cellIndex, index]));
  const unitByCell = new Map(p.units.map((u) => [u.cell, u]));
  const selectedUnit = p.units.find((u) => u.id === p.selectedUnitId) ?? null;
  const selectedUnitRange = selectedUnit
    ? selectedUnit.rangeTiles + (UNIT_TYPES[selectedUnit.typeId].unitClass === "ranger"
      ? p.rangerRangeBonusTiles
      : 0)
    : 0;
  const now = p.gameNowMs;

  useEffect(() => {
    setPathPulseStart(0);
    if (!p.pathVisible || visiblePath.length === 0) return;
    const interval = window.setInterval(() => {
      setPathPulseStart((start) => (start + 1) % (visiblePath.length + 2));
    }, 150);
    return () => window.clearInterval(interval);
  }, [p.path, p.pathVisible, visiblePath.length]);

  return (
    <div className="boardShell">
      <div
        className="board"
        style={{
          gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${ROWS}, minmax(0, 1fr))`,
          aspectRatio: `${COLS} / ${ROWS}`,
        }}
      >
        {p.grid.map((cell, i) => {
          const u = unitByCell.get(i);
          const roadTile = getRoadTile(i, pathCells);
          const pathIndex = pathIndexByCell.get(i);
          const pathPulseOrder = pathIndex === undefined ? -1 : pathIndex - pathPulseStart;
          const showPathPulse = p.pathVisible && pathPulseOrder >= 0 && pathPulseOrder < 3;
          const spriteClass = u ? UNIT_SPRITE_CLASSES[u.typeId] : null;
          const attackAge = u?.lastAttackTimeMs === undefined
            ? Number.POSITIVE_INFINITY
            : now - u.lastAttackTimeMs;
          const classes = ["cell", cell.type];
          if (i === p.start) classes.push("start");
          if (i === p.goal) classes.push("goal");
          if (showPathPulse)
            classes.push("path");
          if (u?.id === p.selectedUnitId) classes.push("selectedUnit");
          if (u) classes.push("unitOccupied");
          if (i === p.activeCellIndex) classes.push("menuOpen");
          if (
            p.highlightedPlacementCells &&
            (cell.type === "natural" || cell.type === "player") &&
            !u
          ) classes.push("placementCandidate");
          return (
            <div
              key={i}
              className={classes.join(" ")}
              role="button"
              tabIndex={0}
              onClick={() => p.onCellClick(i)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") p.onCellClick(i);
              }}
            >
              <img
                className="terrainTile"
                src={roadTile.src}
                alt=""
                style={{ transform: `rotate(${roadTile.rotation}deg) scale(1.02)` }}
                aria-hidden="true"
              />
              {cell.type === "natural" && (
                <img className={`wallTileImage structureTile naturalStructure ${u ? "occupiedStructure" : ""}`} src={NATURAL_WALL_IMAGE} alt="자연 진지" />
              )}
              {cell.type === "permanent" && (
                <img className={`wallTileImage structureTile permanentStructure ${u ? "occupiedStructure" : ""}`} src={PERMANENT_WALL_IMAGE} alt="영구 진지" />
              )}
              {cell.type === "player" && (
                <img className={`wallTileImage structureTile playerStructure ${u ? "occupiedStructure" : ""}`} src={PLAYER_WALL_IMAGE} alt="설치 진지" />
              )}
              {showPathPulse && (
                <span
                  className={`pathMarker pathMarker-${pathPulseOrder + 1}`}
                  aria-hidden="true"
                />
              )}

              {!u && (
                <span className="cellContent">
                  {i === p.start
                    ? <img className="endpointMarker" src={START_POINT_IMAGE} alt="시작점" />
                    : i === p.goal
                      ? <img className="endpointMarker" src={END_POINT_IMAGE} alt="도착점" />
                      : ""}
                </span>
              )}

              {u && (
                <div className="unitWrapper" key={u.id}>
                  {spriteClass ? (
                    <span
                      className={`unit ${spriteClass} ${u.facing === "left" ? "facingLeft" : ""} ${attackAge >= 0 && attackAge < 360 ? "attacking" : ""}`}
                      role="img"
                      aria-label={UNIT_TYPES[u.typeId].name}
                    />
                  ) : (
                    <span
                      className="unit"
                      style={{ color: UNIT_TYPES[u.typeId]?.color }}
                    >
                      {UNIT_TYPES[u.typeId]?.icon ?? "⚔️"}
                    </span>
                  )}
                  {u.tier > 1 && (
                    <span className="unitTierBadge">
                      {"★".repeat(u.tier)}
                    </span>
                  )}
                  <UnitTooltip
                    typeId={u.typeId}
                    tier={u.tier}
                    upgradeLevels={getUpgradeLevels(p.upgrades, u.typeId)}
                    warriorAttackSpeedBonus={p.warriorAttackSpeedBonus}
                    rangerRangeBonusTiles={p.rangerRangeBonusTiles}
                  />
                </div>
              )}
              {i === p.activeCellIndex && p.renderCellMenu(i)}
            </div>
          );
        })}

        {selectedUnit && (
          <span
            className="unitRange"
            style={{
              left: `${(((selectedUnit.cell % COLS) + 0.5) / COLS) * 100}%`,
              top: `${((Math.floor(selectedUnit.cell / COLS) + 0.5) / ROWS) * 100}%`,
              width: `${(selectedUnitRange * 2 * 100) / COLS}%`,
            }}
          />
        )}

        {p.projectiles.filter((projectile) => projectile.delayMs <= 0).map((projectile) => {
          const [fromRow, fromCol] = [
            Math.floor(projectile.fromCell / COLS),
            projectile.fromCell % COLS,
          ];

          const startX = ((fromCol + 0.5) / COLS) * 100;
          const startY = ((fromRow + 0.5) / ROWS) * 100;

          const targetMonster = p.monsters.find(
            (m) => m.id === projectile.targetId,
          );

          // 다른 공격으로 목표가 먼저 제거되면 이펙트가 발사 유닛 위치로
          // 되돌아가 남아 보이지 않도록 즉시 숨긴다.
          if (!targetMonster) return null;

          let targetX = startX;
          let targetY = startY;

          const a =
            p.path[Math.min(targetMonster.pathStep, p.path.length - 1)] ??
            p.start;
          const b =
            p.path[Math.min(targetMonster.pathStep + 1, p.path.length - 1)] ??
            a;
          const ar = Math.floor(a / COLS),
            ac = a % COLS,
            br = Math.floor(b / COLS),
            bc = b % COLS;
          targetX =
            ((ac + (bc - ac) * targetMonster.progress + 0.5) / COLS) * 100;
          targetY =
            ((ar + (br - ar) * targetMonster.progress + 0.5) / ROWS) * 100;

          const currentX = startX + (targetX - startX) * projectile.progress;
          const currentY = startY + (targetY - startY) * projectile.progress;

          const dx = targetX - startX;
          const dy = targetY - startY;
          const angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;

          if (projectile.sourceTypeId === "lightning_mage") {
            return (
              <span
                key={projectile.id}
                className={`projectile projectileEffect lightningStrike ${UNIT_EFFECT_CLASSES[projectile.sourceTypeId]}`}
                style={{
                  left: `${targetX}%`,
                  top: `${targetY}%`,
                  transform: "translate(-50%, -50%) rotate(90deg) scaleX(1.45)",
                  animationDuration: `${projectile.durationMs}ms`,
                }}
                aria-hidden="true"
              />
            );
          }

          if (projectile.sourceTypeId === "shotgunner") {
            const dxCells = (dx * COLS) / 100;
            const dyCells = (dy * ROWS) / 100;
            const distanceCells = Math.hypot(dxCells, dyCells) || 1;
            const perpendicularCol = -dyCells / distanceCells;
            const perpendicularRow = dxCells / distanceCells;

            return [-2, -1, 0, 1, 2].map((pelletIndex) => {
              const spreadTiles = pelletIndex * 0.22 * projectile.progress;
              const pelletX = currentX + (perpendicularCol * spreadTiles * 100) / COLS;
              const pelletY = currentY + (perpendicularRow * spreadTiles * 100) / ROWS;
              return (
                <span
                  key={`${projectile.id}-${pelletIndex}`}
                  className={`projectile projectileEffect shotgunPellet ${UNIT_EFFECT_CLASSES[projectile.sourceTypeId]}`}
                  style={{
                    left: `${pelletX}%`,
                    top: `${pelletY}%`,
                    opacity: 1 - Math.abs(pelletIndex) * 0.13,
                    transform: `translate(-50%, -50%) rotate(${angleDeg + pelletIndex * 4}deg)`,
                    animationDuration: `${projectile.durationMs}ms`,
                  }}
                  aria-hidden="true"
                />
              );
            });
          }

          return (
            <span
              key={projectile.id}
              className={`projectile projectileEffect projectile-${projectile.sourceTypeId} ${projectile.effectType === "sniper" ? `sniperSpecialProjectile ${targetMonster.isBoss ? "bossSniperProjectile" : "executeSniperProjectile"}` : ""} ${UNIT_EFFECT_CLASSES[projectile.sourceTypeId]}`}
              style={{
                left: `${currentX}%`,
                top: `${currentY}%`,
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
                animationDuration: `${projectile.durationMs}ms`,
              }}
              aria-hidden="true"
            />
          );
        })}

        {p.monsters.map((m) => {
          const a = p.path[Math.min(m.pathStep, p.path.length - 1)] ?? p.start;
          const b = p.path[Math.min(m.pathStep + 1, p.path.length - 1)] ?? a;
          const ar = Math.floor(a / COLS),
            ac = a % COLS,
            br = Math.floor(b / COLS),
            bc = b % COLS;
          const x = ((ac + (bc - ac) * m.progress + 0.5) / COLS) * 100;
          const y = ((ar + (br - ar) * m.progress + 0.5) / ROWS) * 100;
          const moveDirection = br < ar
            ? "up"
            : br > ar
              ? "down"
              : bc < ac
                ? "left"
                : "right";

          const isHit = m.lastHitTime && now - m.lastHitTime < 150;
          const isImmune =
            m.statusImmunityUntilMs && now < m.statusImmunityUntilMs;
          const isSlow = m.slowUntilMs && now < m.slowUntilMs;
          const isParalyzed = m.paralyzeUntilMs && now < m.paralyzeUntilMs;
          const isBurning = m.burnEffectUntilMs && now < m.burnEffectUntilMs;
          const isBossSniperHit = m.sniperImpactUntilMs && now < m.sniperImpactUntilMs;
          const sniperSpecialTarget = p.projectiles.some((projectile) =>
            projectile.targetId === m.id &&
            projectile.sourceTypeId === "sniper" &&
            projectile.effectType === "sniper"
          );

          const hpPercent = Math.max(0, (m.hp / m.maxHp) * 100);
          const hpColor =
            hpPercent > 50 ? "#22c55e" : hpPercent > 25 ? "#f97316" : "#ef4444";
          const monsterSpriteClass =
            (m.isFinalBoss && m.finalBossPhase
              ? FINAL_BOSS_SPRITE_CLASSES[m.finalBossPhase]
              : undefined) ??
            (m.bossStage ? BOSS_SPRITE_CLASSES[m.bossStage] : undefined) ??
            MONSTER_SPRITE_CLASSES[m.category];

          return (
            <span
              key={m.id}
              className={`monster ${m.category} ${m.isBoss ? "boss" : ""} ${m.isFinalBoss ? "finalBoss" : ""} ${isHit ? "hitFlash" : ""} ${isBurning ? "burning" : ""} ${isBossSniperHit ? "bossSniperHit" : ""} ${
                isParalyzed ? "paralyzed" : isSlow ? "slowed" : ""
              }`}
              style={{ left: `${x}%`, top: `${y}%` }}
              title={m.isBoss
                ? `${m.isFinalBoss ? `FINAL BOSS ${m.finalBossPhase}단계` : `${BOSS_NAMES[m.category]} 보스`} HP ${m.hp}/${m.maxHp} | 완주 ${m.laps}회 (제한 없음)`
                : `[${m.category}] HP ${m.hp}/${m.maxHp} | Laps: ${m.laps}/5`}
            >
              <span
                className={`monsterSprite ${m.isBoss ? "bossSprite" : ""} ${monsterSpriteClass} move-${moveDirection}`}
                style={{
                  animationDuration: `${480 / p.animationSpeed}ms`,
                  animationPlayState: p.animationPaused ? "paused" : "running",
                }}
                aria-hidden="true"
              />
              {sniperSpecialTarget && (
                <span
                  className={`sniperSpecialMark ${m.isBoss ? "bossSniperMark" : "executeSniperMark"}`}
                  aria-hidden="true"
                />
              )}
              {isBurning && <span className="burnImpact" aria-hidden="true" />}
              {isBossSniperHit && <span className="bossSniperBurst" aria-hidden="true" />}

              {/* 완주 횟수 라벨 배지 */}
              {m.laps > 0 && (
                <span className="monsterLapBadge">
                  🔄 {m.laps}{m.isBoss ? "" : "/5"}
                </span>
              )}

              {/* 상태이상 표시 */}
              <div className="statusIcons">
                {isImmune && <span className="statusTag immune">🛑</span>}
                {isSlow && <span className="statusTag slow">❄️</span>}
                {isParalyzed && <span className="statusTag stun">⚡</span>}
              </div>

              {/* HP 바 */}
              <span className="monsterHp">
                <span
                  className="monsterHpFill"
                  style={{
                    width: `${hpPercent}%`,
                    backgroundColor: hpColor,
                  }}
                />
                <span className="monsterHpText">
                  {m.hp}/{m.maxHp}
                </span>
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

