import ReactDOM from 'react-dom';
import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useMemo,
  useRef,
  useContext,
} from "react";
import { v4 as uuidv4 } from "uuid";
import classd from "classd";
import { Button, Modal } from "react-bootstrap";
import {
  moveUp,
  moveDown,
  range,
  capitalize,
  partition2,
  orderBy,
} from "./utils";

import {
  formComponents,
  validateDefinition,
  definitionIsInvalid,
  FormComponent,
  GenericForm,
  formValidators,
  fieldsLayouts,
} from "./core";

import {
  pathToUpdate,
  getByPath,
  setByPath,
  update,
} from "./utils";

Object.assign(formValidators, {
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
});

const formEmptyPred = {
  BooleanField: (x) => !x,
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
  return (<>
    <RequiredWrapper required={definition.required}>
      {definition.label}
    </RequiredWrapper>
    {children}
  </>);
};


const BooleanField = ({
  value,
  onChange,
  error,
  definition,
  context,
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
          onChange(path, e.target.checked);
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
TextField.isEmpty = (x) => !x;
Object.assign(formComponents, {
  TextField,
});

const TextareaField = ({
  value,
  onChange,
  error,
  definition,
  context,
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
          onChange(path, e.target.value);
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
            onChange(path, e.target.value);
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


const ModalLayoutWrapper = ({ children }) => <div className="field-container">{children}</div>;

const ModalLayout = (props) => {
  const { value, onChange, definition, error, context, onReset, path } = props;
  /* this is Fields, but renderedFields are thrown away */
	const [show, setShow] = useState(false);
	const [state, setState] = useState(value);
	const [errors, setErrors] = useState(null);
  useEffect(() => {
    //console.log('reset to', value);
    setState(value);
    setErrors(null);
  }, [show]);
  const onReset1 = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };
	const handleClose = _ => setShow(false);
  const handleSubmit = () => {
    const error = validateDefinition(definition, state);
    setErrors(error);
    if (!definitionIsInvalid(definition, error, state)) {
      // ok
      onChange(state);
      onReset(path);
      handleClose();
    } else {
      /*NotificationManager.error(
        "Please fix the errors below",
        "Error"
      );
      setTimeout(() => {
        try {
          document
            .getElementsByClassName("invalid-feedback d-block")[0]
            .parentNode.scrollIntoViewIfNeeded();
        } catch (e) {
          console.warn(e);
        }
      }, 50);*/
    }
  };
  return (<div>
    <button
      className="btn btn-primary"
      type="button"
      onClick={e => {
        setShow(true);
      }}>
      <i className="fa fa-plus" />
      {" "}
      Add
    </button>
		<Modal show={show} onHide={handleClose} animation={false} container={_ => document.getElementById('bootstrap-modals')} size={context?.modalSize || "lg"}>
			<Modal.Header closeButton>
				<Modal.Title>{definition.title || "Edit"}</Modal.Title>
			</Modal.Header>
			<Modal.Body>
        <div>
        <FormComponent
          definition={{...definition, layout: void 0}}
          value={state}
          onChange={setState}
          error={errors}
          onReset={onReset1}
          path={[]}
          context={{
            ...context,
						forceLabelWidth: '100%',
						labelPlacement: 'horizontalPlus',
					}}
        />
        </div>
      </Modal.Body>
			<Modal.Footer>
				<Button variant="secondary" onClick={handleClose}>
					Close
				</Button>
				<Button variant="primary" onClick={handleSubmit}>
					OK
				</Button>
			</Modal.Footer>
    </Modal>
    {error?.__own && <div className="invalid-feedback d-block">{error.__own + ''}</div>}
  </div>);
};
Object.assign(fieldsLayouts, {
  ModalLayout,
});

export {
  validateDefinition,
  definitionIsInvalid,
  pathToUpdate,
  FormComponent,
  formComponents,
  GenericForm,
  FieldLabel,
};
