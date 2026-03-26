
interface Props {
  undoHandler: () => void;
  disabled: boolean;
  className?: string;
}

const UndoButton = ({ undoHandler, disabled, className }: Props) => {

  const onClick = () => {
    undoHandler();
  };
  return (
      <button
        className={`app-button ${className || ""}`.trim()}
        onClick={onClick}
        disabled={disabled}
        title="Undo last calendar swap"
      >
        Undo swap
      </button>
  );
};

export default UndoButton;
