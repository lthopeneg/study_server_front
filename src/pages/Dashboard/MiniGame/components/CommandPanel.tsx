import { useEffect, useState } from "react";
import {
  MAX_PLAYER_LEVEL,
  SHOP_DRAW_COST,
  UPGRADE_DRAW_COST,
  XP_PER_PURCHASE,
  XP_PURCHASE_COST,
} from "../games/constants";

interface Props {
  gold: number;
  running: boolean;
  gameEnded: boolean;
  storageFull: boolean;
  playerLevel: number;
  pathVisible: boolean;
  gameSpeed: 1 | 2;
  onBuyUnit: () => void;
  onBuyUpgrade: () => void;
  onBuyXp: () => void;
  onTogglePath: () => void;
  onToggleSpeed: () => void;
  paused: boolean;
  onTogglePause: () => void;
  onStartWave: () => void;
  onNewMap: () => void;
  debugMode: boolean;
  finalStage: boolean;
  onToggleDebug: () => void;
}

interface CommandButtonProps {
  icon: string;
  label: string;
  hotkey: string;
  description: string;
  disabled?: boolean;
  active?: boolean;
  onClick: () => void;
}

function CommandButton(props: CommandButtonProps) {
  return (
    <button
      type="button"
      className={`commandCell ${props.active ? "active" : ""}`}
      disabled={props.disabled}
      onClick={props.onClick}
      data-tooltip={`${props.description}\n단축키 : ${props.hotkey}`}
      title={`${props.description}\n단축키 : ${props.hotkey}`}
      aria-keyshortcuts={props.hotkey}
    >
      <span className="commandIcon">{props.icon}</span>
      <span className="commandLabel">{props.label}</span>
    </button>
  );
}

export default function CommandPanel(props: Props) {
  const [confirmNewGame, setConfirmNewGame] = useState(false);
  const buyUnitDisabled = props.running || props.gameEnded || props.storageFull || props.gold < SHOP_DRAW_COST;
  const buyUpgradeDisabled = props.running || props.gameEnded || props.gold < UPGRADE_DRAW_COST;
  const buyXpDisabled = props.running || props.gameEnded || props.playerLevel >= MAX_PLAYER_LEVEL ||
    props.gold < XP_PURCHASE_COST;

  useEffect(() => {
    const handleShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        event.repeat || event.ctrlKey || event.altKey || event.metaKey || confirmNewGame ||
        target?.matches("input, textarea, select, [contenteditable='true']")
      ) return;

      const commands: Partial<Record<string, { disabled: boolean; run: () => void }>> = {
        KeyQ: { disabled: buyUnitDisabled, run: props.onBuyUnit },
        KeyW: { disabled: buyUpgradeDisabled, run: props.onBuyUpgrade },
        KeyE: { disabled: buyXpDisabled, run: props.onBuyXp },
        KeyA: { disabled: false, run: props.onToggleDebug },
        KeyS: { disabled: false, run: props.onTogglePath },
        KeyD: { disabled: false, run: props.onToggleSpeed },
        KeyZ: { disabled: !props.running, run: props.onTogglePause },
        KeyX: { disabled: props.running || props.gameEnded, run: props.onStartWave },
        KeyC: { disabled: props.running, run: () => setConfirmNewGame(true) },
      };
      const command = commands[event.code];
      if (!command || command.disabled) return;
      event.preventDefault();
      command.run();
    };

    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, [
    buyUnitDisabled, buyUpgradeDisabled, buyXpDisabled, confirmNewGame,
    props.gameEnded, props.onBuyUnit, props.onBuyUpgrade, props.onBuyXp,
    props.onStartWave, props.onTogglePath, props.onTogglePause,
    props.onToggleSpeed, props.onToggleDebug, props.running,
  ]);

  return (
    <section className="commandPanel panelBox">
      <div className="commandGrid">
        <CommandButton icon="🎲" label="유닛" hotkey="Q" disabled={buyUnitDisabled}
          description={`무작위 유닛을 구매해 창고에 보관합니다. 비용 ${SHOP_DRAW_COST}G.`}
          onClick={props.onBuyUnit} />
        <CommandButton icon="✨" label="업그레이드" hotkey="W" disabled={buyUpgradeDisabled}
          description={`무작위 피해 업그레이드를 구매합니다. 비용 ${UPGRADE_DRAW_COST}G.`}
          onClick={props.onBuyUpgrade} />
        <CommandButton icon="📘" label="경험치" hotkey="E" disabled={buyXpDisabled}
          description={`플레이어 경험치 ${XP_PER_PURCHASE}을 구매합니다. 비용 ${XP_PURCHASE_COST}G.`}
          onClick={props.onBuyXp} />
        <CommandButton icon="🛠" label={`디버그 ${props.debugMode ? "ON" : "OFF"}`} hotkey="A"
          active={props.debugMode} description="테스트용 디버그 설정 창을 켜거나 끕니다."
          onClick={props.onToggleDebug} />
        <CommandButton icon="🧭" label={`경로 ${props.pathVisible ? "ON" : "OFF"}`} hotkey="S"
          active={props.pathVisible} description="몬스터의 현재 최단 경로 표시를 켜거나 끕니다."
          onClick={props.onTogglePath} />
        <CommandButton icon="⏩" label={`${props.gameSpeed}× 배속`} hotkey="D"
          active={props.gameSpeed === 2} description="전투 진행 속도를 1배와 2배 사이에서 전환합니다."
          onClick={props.onToggleSpeed} />
        <CommandButton icon={props.paused ? "▶️" : "⏸️"} label={props.paused ? "재개" : "일시정지"} hotkey="Z"
          disabled={!props.running} active={props.paused}
          description={props.paused ? "일시정지된 웨이브를 다시 진행합니다." : "진행 중인 웨이브를 일시정지합니다."}
          onClick={props.onTogglePause} />
        <CommandButton icon={props.finalStage ? "👑" : "▶️"} label={props.finalStage ? "최종전 시작" : "웨이브 시작"} hotkey="X" disabled={props.running || props.gameEnded}
          description={props.finalStage ? "FINAL STAGE의 최종 보스전을 시작합니다." : "현재 스테이지의 웨이브를 시작합니다."}
          onClick={props.onStartWave} />
        <CommandButton icon="🎲" label="새 게임" hotkey="C" disabled={props.running}
          description="현재 진행을 초기화하고 새로운 무작위 맵으로 시작합니다."
          onClick={() => setConfirmNewGame(true)} />
      </div>
      {confirmNewGame && (
        <div className="confirmOverlay" role="presentation" onClick={() => setConfirmNewGame(false)}>
          <div className="confirmDialog" role="dialog" aria-modal="true" aria-labelledby="new-game-title" onClick={(event) => event.stopPropagation()}>
            <strong id="new-game-title">새 게임을 시작할까요?</strong>
            <p>현재 진행 상황이 모두 초기화됩니다.</p>
            <div className="confirmActions">
              <button type="button" onClick={() => setConfirmNewGame(false)}>취소</button>
              <button type="button" className="danger" onClick={() => { setConfirmNewGame(false); props.onNewMap(); }}>새 게임</button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

