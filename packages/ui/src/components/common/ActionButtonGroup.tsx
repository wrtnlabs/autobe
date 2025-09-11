import { ActionButton } from "./ActionButton";

export function ActionButtonGroup(props: ActionButtonGroup.IProps) {
  //----
  // STYLES
  //----
  const containerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.375rem",
    flexShrink: 0,
  };

  //----
  // RENDER
  //----
  return (
    <div style={containerStyle}>
      {/* Edit button */}
      {props.onEdit && (
        <ActionButton
          variant="edit"
          onClick={(e) => {
            e.stopPropagation();
            props.onEdit?.();
          }}
        />
      )}

      {/* Delete button */}
      {props.onDelete && (
        <ActionButton
          variant="delete"
          onClick={(e) => {
            e.stopPropagation();
            props.onDelete?.();
          }}
        />
      )}

      {/* Save button */}
      {props.onSave && (
        <ActionButton
          variant="save"
          onClick={(e) => {
            e.stopPropagation();
            props.onSave?.();
          }}
        />
      )}

      {/* Cancel button */}
      {props.onCancel && (
        <ActionButton
          variant="cancel"
          onClick={(e) => {
            e.stopPropagation();
            props.onCancel?.();
          }}
        />
      )}
    </div>
  );
}

export namespace ActionButtonGroup {
  export interface IProps {
    /** Edit handler - if provided, edit button will be shown */
    onEdit?: () => void;

    /** Delete handler - if provided, delete button will be shown */
    onDelete?: () => void;

    /** Save handler - if provided, save button will be shown */
    onSave?: () => void;

    /** Cancel handler - if provided, cancel button will be shown */
    onCancel?: () => void;
  }
}
