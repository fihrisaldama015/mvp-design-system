import { createContext, useContext, useId } from "react";
import PropTypes from "prop-types";
import { FIELD_GAP, FieldCaption, FieldLabel } from "components/field/parts";
import { cn } from "utils/cn";

const FieldContext = createContext({ id: undefined, invalid: false, captionId: undefined });

/** useFieldControl — lets a control (Input, Select, ...) read the id, error state and caption id of the Field around it. */
export function useFieldControl() {
  return useContext(FieldContext);
}

/**
 * Field — label, control, hint and error message in one block. Put one control
 * inside it (Input, Textarea, Select, ...): the label is connected to it and it
 * turns red when `error` is set, with nothing to pass by hand. Label and caption
 * use the SHIELD Input look (md size), so `<Field label><Input /></Field>` looks the
 * same as `<Input label />`.
 */
export function Field({ label, required, hint, error, children, className }) {
  const id = useId();
  const captionId = `${id}-caption`;
  const caption = error || hint;
  return (
    <FieldContext.Provider value={{ id, invalid: !!error, captionId: caption ? captionId : undefined }}>
      <div className={cn("flex flex-col", FIELD_GAP.md, className)}>
        {label && (
          <FieldLabel htmlFor={id} required={required}>
            {label}
          </FieldLabel>
        )}
        {children}
        {caption && (
          <FieldCaption id={captionId} danger={!!error} alert={!!error}>
            {caption}
          </FieldCaption>
        )}
      </div>
    </FieldContext.Provider>
  );
}

Field.propTypes = {
  /** Label text above the control. */
  label: PropTypes.string,
  /** Shows a red asterisk after the label. */
  required: PropTypes.bool,
  /** Helper text under the control. Hidden while there is an error. */
  hint: PropTypes.string,
  /** Error message. Turns the control red and replaces the hint. */
  error: PropTypes.string,
  /** The control: an Input, Textarea or Select. */
  children: PropTypes.node.isRequired,
  /** Extra classes, for layout only. */
  className: PropTypes.string,
};
