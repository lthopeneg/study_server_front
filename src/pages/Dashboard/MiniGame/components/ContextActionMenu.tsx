export type MenuDirection = "top" | "left" | "right" | "bottom";

export interface ContextMenuAction {
  label: string;
  disabled?: boolean;
  onClick: () => void;
}

interface Props {
  actions: Partial<Record<MenuDirection, ContextMenuAction>>;
}

export default function ContextActionMenu({ actions }: Props) {
  return (
    <div className="contextActionMenu" onClick={(event) => event.stopPropagation()}>
      {(Object.entries(actions) as [MenuDirection, ContextMenuAction][]).map(([direction, action]) => (
        <button
          key={direction}
          type="button"
          className={`contextAction contextAction-${direction}`}
          disabled={action.disabled}
          onClick={action.onClick}
          title={action.label}
        >
          {action.label}
        </button>
      ))}
    </div>
  );
}

