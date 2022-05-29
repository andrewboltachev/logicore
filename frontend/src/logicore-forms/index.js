import React from "react";
import { v4 as uuidv4 } from "uuid";
import classd from "classd";

const formValidators = {
  maxLength: (s, { value }) =>
    (s + "").length >= value &&
    `Length shouldn\'t exceed ${value} characters (now: ${
      (s + "").length
    })`,
  minNumber: (s, { value }, definition) => {
    const f = parseFloat(s);
    if (f < value) return `Minimum value — ${value}`;
  },
  maxNumber: (s, { value }, definition) => {
    const f = parseFloat(s);
    if (f > value) return `Maximum value — ${value}`;
  },
};
const formEmptyPred = {
  BooleanField: (x) => !x,
  TextField: (x) => !x,
  TextareaField: (x) => !x || !x.replace("\n", ""),
  DecimalField: (x) => !x,
  NumberField: (x) => !x && x !== 0,
};


const RequiredWrapper = ({ required, children }) => (
  required ? (
    <span style={{ fontWeight: "bold" }}>
      {children} <span className="text-red">*</span>
    </span>
  ) : (
    <span style={{ fontWeight: "bold" }}>
      {children || null}
    </span>
  )
);

const FieldLabel = ({ definition, id, context, children }) => {
  return (
    <RequiredWrapper required={definition.required}>
      {definition.label}
    </RequiredWrapper>
  );
};


const BooleanField = ({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
  disabled
}) => {
  const id = "id_" + uuidv4();
  const { label } = definition;
  return (
    <div className="form-check text-dark">
      <input
        className="form-check-input"
        type="checkbox"
        checked={!!value}
        onChange={(e) => {
          onChange(e.target.checked);
          onReset(path);
        }}
        id={id}
        disabled={!!disabled}
      />
      <label className="form-check-label" htmlFor={id}>
        {definition.label}
      </label>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
};

const TextField = ({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
  disabled,
}) => {
  const id = "id_" + uuidv4();
  const { label } = definition;
  return (
    <FieldLabel definition={definition} id={id} context={context}>
    <input
        id={id}
        type={definition.subtype || "text"}
        className={classd`form-control ${{ "is-invalid": error }}`}
        value={value || ""}
        onChange={(e) => {
          onChange(e.target.value);
          onReset(path);
        }}
        placeholder={definition.placeholder || ''}
        style={context.style}
        disabled={!!disabled}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </FieldLabel>
  );
};

const TextareaField = ({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
}) => {
  const id = "id_" + uuidv4();
  const { label } = definition;
  return (
    <FieldLabel definition={definition} id={id} context={context}>
      <textarea
        id={id}
        type="text"
        className={classd`form-control ${{ "is-invalid": error }}`}
        value={value || ""}
        onChange={(e) => {
          if (definition.readonly) return;
          onChange(e.target.value);
          onReset(path);
        }}
      />
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </FieldLabel>
  );
};

const NumberField = ({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
}) => {
  const id = "id_" + uuidv4();
  const { label } = definition;
  const labelStyle = {};
  if (context.labelColor) {
    labelStyle.style = { color: context.labelColor };
  }
  const extra = {};
  for (const k of ["min", "max"]) {
    const v = (definition?.validators?.find(validator => validator.type === `${k}Number`) || {}).value;
    if (typeof v === "number") {
      extra[k] = v;
    }
  }
  //const values = [7, 5, 11];
  return (
    <FieldLabel definition={definition} id={id} context={context}>
      <div style={{display: "flex", alignItems: 'center'}} className="currency-input-wrapper">
        <input
          {...extra}
          id={id}
          type="number"
          className={classd`form-control ${{ "is-invalid": error }}`}
          value={(value + "") || ""}
          onChange={(e) => {
            onChange(e.target.value);
            onReset(path);
          }}
        />
        {definition.is_percent && <div style={{marginLeft: '0.25rem', fontSize: '0.825rem'}}>%</div>}
        {definition.suffix && <div style={{marginLeft: '0.25rem', fontSize: '0.825rem'}}>
          {definition.suffix}
        </div>}
      </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </FieldLabel>
  );
};
