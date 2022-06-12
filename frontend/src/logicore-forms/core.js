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
import update, { extend } from "immutability-helper";
import classd from "classd";
import {
  moveUp,
  moveDown,
  range,
  capitalize,
  partition2,
  orderBy,
  pathToUpdate,
  zipArrays,
} from "./utils";
import _ from "lodash";

export let validateDefinition, definitionIsInvalid;

// Main extension point

export let formComponents, FormComponent;

export let fieldsLayouts = {};

export let interceptors = {};

export let formDisplays = {};

export let formValidators = {};

export let submitButtonWidgets = {};

// Core field types

const FieldsBasicLayout = ({ definition, renderedFields }) => {
  return <>{renderedFields}</>;
};

const Fields = (fieldsProps) => {
  const interceptor = fieldsProps.definition?.interceptor ? interceptors[fieldsProps.definition?.interceptor] : null;
  let {
    definition,
    value,
    error,
    onReset,
    path,
    context,
    disabled
  } = fieldsProps;
  function onChange(v) {
    let vv = v;
    if (interceptor?.onChange) vv = interceptor.onChange(vv, value, definition, context);
    if (vv.then) { // contraversial
      vv.then(fieldsProps.onChange);
    } else {
      fieldsProps.onChange(vv);
    }
  };
  let Layout = FieldsBasicLayout;
  if (definition.layout) {
    Layout = fieldsLayouts[definition.layout];
  }
  let ItemWrapper = React.Fragment;
  if (definition.itemWrapper) {
    ItemWrapper = fieldsLayouts[definition.itemWrapper];
  }
  let theFields = definition.fields;
  if (interceptor && interceptor.processFields) {
    theFields = interceptor.processFields({ fields: definition.fields, definition, value, context });
  }
  let interceptorContext = {};
  if (interceptor && interceptor.fieldsContext) {
    interceptorContext = interceptor.fieldsContext({ fields: definition.fields, definition, value, context, onChange });
  }
  const renderedFields = theFields.map((child, i) => {
    const vvalue = !!child.k ? value?.[child.k] : value;
    const additionalProps = {};
    let imposed_value = void 0; // TODO use undefined
    if (child.type === 'DefinedField' && child.master_field) {
      console.log('CURRENT FOR', (value?.[child?.master_field] || {}).value);
      additionalProps.current =  child.definitions[(value?.[child?.master_field] || {}).value] || {type: 'Fields', fields: []}; // TODO assumption
    } else if (child.impositions) {
      imposed_value = child?.impositions?.[(value?.[child.master_field] || {}).value]; // TODO assumption
    }
    return (
      <ItemWrapper key={i}>
        <FormComponent
          definition={{
            index: definition.index,
            parent: definition.parent,
            onChangeParent: definition.onChangeParent,
            ...child,
            ...additionalProps,
          }}
          value={(imposed_value !== void 0) ? imposed_value : vvalue}
          error={!!child.k ? error?.[child.k] : error}
          context={{ ...context, ...definition.context, ...child.context, ...interceptorContext }}
          onChange={(imposed_value !== void 0) ? (_ => null) : ((v) =>
            onChange(
                { ...(value || {}), ...(!!child.k ? { [child.k]: v } : v) },
                definition.constraints || []
            ))
          }
          onReset={onReset}
          path={[...path, ...(!!child.k ? [child.k] : [])]}
          disabled={(imposed_value !== void 0) ? true : !!disabled}
        />
      </ItemWrapper>
    );
  });
  return (
    <Layout
      {...{ definition, value, onChange, error, onReset, path, context }}
      renderedFields={renderedFields}
    />
  );
};
Fields.validatorRunner = (definition, value, parentValue) => {
  let result = {};
  if (definition.validators) {
    result.__own = validatorsValidatorRunner(definition, value, parentValue);
  }
  for (const f of definition.fields) {
    if (f.k) {
      result[f.k] = validateDefinition(f, value?.[f.k], value);
    } else {
      result = { ...result, ...validateDefinition(f, value) };
    }
  }
  return result;
};
Fields.validatorChecker = (definition, error, state) => {
  if (error?.__own) return true;
  for (const f of definition.fields) {
    if (definitionIsInvalid(f, !!f.k ? error?.[f.k] : error, !!f.k ? state?.[f.k] : state, state)) {
      return true;
    }
  }
};

const DefinedField = ({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
  current,
}) => {
  const id = "id_" + uuidv4();
  const { label } = definition;
  const labelStyle = {};
  if (context.labelColor) {
    labelStyle.style = { color: context.labelColor };
  }
  // TODO
  let newCurrent = definition.current;
  return (<>
    <FormComponent
      context={{...context, ...definition.context}}
      value={value}
      onChange={x => {onChange(x); onReset(path);}}
      onReset={_ => {}}
      path={[]}
      error={(error && typeof error === 'object') ? error : null}
      definition={{...newCurrent, layout: newCurrent?.layout || definition?.layout, itemWrapper: definition.itemWrapper}}
    />
    {(error && typeof error === 'string') ? <div className="invalid-feedback d-block">{error + ''}</div> : null}
    </>
  );
};
DefinedField.isEmpty = (x) => false; // TODO remove
DefinedField.validatorRunner = (definition, value, parentValue) => {
  let result = {};
  const current = definition?.current ? definition.current : definition?.definitions?.[
    (parentValue?.[definition?.master_field] || {}).value
  ];
  if (!current || !current.fields) return null;
  for (const f of current.fields) {
    if (f.k) {
      result[f.k] = validateDefinition(f, value?.[f.k]);
    } else {
      result = { ...result, ...validateDefinition(f, value) };
    }
  }
  return result;
};
DefinedField.validatorChecker = (definition, error, value, parentValue) => {
  const current = definition?.current ? definition.current : definition?.definitions?.[
    (parentValue?.[definition?.master_field] || {}).value
  ];

  for (const f of (current?.fields || [])) {
    if (definitionIsInvalid(f, !!f.k ? error?.[f.k] : error, !!f.k ? value?.[f.k] : value)) {
      return true;
    }
  }
};


const DefaultForeignKeyListFieldWrapper = ({ children, addButton }) => (
  <div>{children}{addButton}</div>
);

const ForeignKeyListField = ({
  definition,
  value,
  onChange,
  error,
  onReset,
  path,
  context,
}) => {
  const interceptor = definition?.listInterceptor ? interceptors[definition?.listInterceptor] : null;
  const id = "id_" + uuidv4();
  const { label } = definition;
  const vvalue = value || [];
  const Wrapper = fieldsLayouts[definition.wrapper] || DefaultForeignKeyListFieldWrapper;
  const newValue = definition?.new_value || {};
  let processList = _ => {};
  let extraContext = {}
  if (interceptor?.processList) {
    extraContext = interceptor?.processList(
      { fields: definition.fields, definition, valueList: vvalue }
    );
  }
  return (
    <div>
      <Wrapper
        {...{ definition, value, onChange, error, onReset, path, context }}
        addButton={<button
          style={definition?.addButtonStyle || {}}
          type="button"
          onClick={(_) => onChange([...vvalue, newValue])}
        >
          Add {definition?.addWhat}
        </button>}
      >
        {vvalue.map((item, i) => {
          return (
            <FormComponent
              key={i}
              definition={{
                ...definition,
                type: "Fields",
                index: i,
                parent: vvalue,
                onChangeParent: onChange,
              }}
              value={item}
              error={(error || [])[i]}
              onChange={($set) => onChange(update(vvalue, { [i]: { $set } }))}
              context={{ ...context, ...definition.context, ...extraContext }}
              onReset={onReset}
              path={[...path, i]}
            />
          );
        })}
      </Wrapper>
    </div>
  );
};
ForeignKeyListField.isEmpty = (x) => !x || !x.length;
ForeignKeyListField.validatorRunner = (definition, value) => {
  if (definition.required && !value?.length) {
    return "This is required";
  }
  return (value || []).map((v) =>
    validateDefinition({ ...definition, type: "Fields" }, v, value)
  );
};
ForeignKeyListField.validatorChecker = (definition, error, state) => {
  if (typeof error === "string") return true;
  for (const [e, s] of zipArrays(error || [], state || [])) {
    if (definitionIsInvalid({ ...definition, type: "Fields" }, e, s, s)) {
      return true;
    }
  }
};

const HiddenField = ({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
}) => {
  return <></>;
};
HiddenField.isEmpty = _ => false;

const CustomDisplay = ({ definition, value, context }) => {
  let Widget = definition.widget;
  if (typeof Widget === 'string') Widget = formDisplays[Widget];
  if (!Widget) { console.warn("missing widget", definition.widget); return ""; };
  return <Widget definition={definition} value={value} context={context} />;
};
CustomDisplay.isEmpty = _ => false;
CustomDisplay.validatorChecker = (definition, error) => {
  return false;
};

formComponents = {
  // Collections/containers
  Fields,
  ForeignKeyListField,
  DefinedField,
  // Individual fields
  HiddenField,
  CustomDisplay,
};

// Core component

FormComponent = ({
  definition,
  error,
  value,
  onChange,
  path,
  onReset,
  context = {},
  disabled,
}) => {
  const Component = formComponents[definition.type];
  if (!Component)
    throw new Error(`No field type ${definition.type}`);
  return (
    <Component
      {...{ value, onChange, error, definition, context, path, onReset, disabled: disabled || definition?.disabled }}
    />
  );
};

// Validator runners
const validatorsValidatorRunner = (definition, value) => {
  const { type, required, validators } = definition;
  if (required && formComponents[type].isEmpty(value, definition)) {
    return "This is required";
  } else {
    for (const validator of validators || []) {
      const validatorError = formValidators[validator.type](
        value,
        validator,
        definition
      );
      if (validatorError) {
        return validatorError;
      }
    }
  }
};

validateDefinition = (definition, state, parentState) => {
  const validatorRunner =
    formComponents[definition.type].validatorRunner || validatorsValidatorRunner;
  let theFields = definition.fields;
  const interceptor = definition?.interceptor ? interceptors[definition?.interceptor] : null;
  if (interceptor && interceptor.processFields) {
    theFields = interceptor.processFields({ fields: definition.fields, definition, value: state });
  }
  return validatorRunner({...definition, fields: theFields}, state, parentState);
};

// Validator checkers
const validatorsValidatorChecker = (definition, error, state, parentState) => !!error;

definitionIsInvalid = (definition, error, state, parentState) => {
  const validatorChecker =
    formComponents[definition.type].validatorChecker || validatorsValidatorChecker;
  let theFields = definition.fields;
  const interceptor = definition?.interceptor ? interceptors[definition?.interceptor] : null;
  if (interceptor && interceptor.processFields) {
    theFields = interceptor.processFields({ fields: theFields, definition, value: state });
  }
  return validatorChecker(definition, error, state, parentState); 
};

const DefaultSubmitButtonWidget = _ => <button type="submit">Submit</button>;

const externalInterceptors = {
};


const interceptStateChange = _.debounce(({ oldState, newState, externalContext, setExternalContext, externalInterceptor, setState, serverContext }) => {
  //console.log('check');
  const intcpt = externalInterceptors[externalInterceptor];
  if (intcpt) {
    const newExternalContext = intcpt.getExternalContext({ state: newState, serverContext });
    setExternalContext(newExternalContext);
    if (JSON.stringify(externalContext) !== JSON.stringify()) {
      setState(state => intcpt.updateState({ state: newState, context: newExternalContext }));
    }
  }
}, 100, { leading: true, trailing: true });

const GenericFormContext = React.createContext({});

const addOptionById = (node, id, option) => {
  const result = {...node};
  if (node.fields?.length) {
    result.fields = node.fields.map(field => addOptionById(field, id, option))
  } else if (node?.id === id) {
    result.options.push(option); // TODO optgroup
  }
  return result;
};

const DefaultContainer = ({ children }) => <div>{children}</div>;

// Form with validation
export const GenericForm = (props) => {
  const { serverErrors, data, onChange, externalInterceptor, serverContext } = props;
  const [fields, setFields] = useState(props.fields);

  const [state, setState] = useState(data || {});
  const [externalContext, setExternalContext] = useState({});
  window.state = state; /// XXX hack
  const [errors, setErrors1] = useState(serverErrors || {});
  const [formWideError, setFormWideError] = useState(null);
  const setErrors = (es, e) => {
    setErrors1(es);
    setFormWideError(e);
  };
  const onReset = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };
  const SubmitContainerWrapper = React.Fragment;
  let SubmitButtonWidget = null;
  if (props.submitButtonWidget) SubmitButtonWidget = submitButtonWidgets[props.submitButtonWidget];
  const onSubmit = (onChange) => {
    const errors = validateDefinition(fields, state);
    setErrors(errors, null);
    if (!definitionIsInvalid(fields, errors, state)) {
      // ok
      onChange(state, setErrors);
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
  let ControlsClass = _ => null;
  const Container = DefaultContainer;

  //useEffect(() => {
  //  console.log('state changed', state);
  //}, [state]);


  const interceptSetState = (newState) => {
    setState(newState);
    interceptStateChange({ oldState: state, newState, externalContext, setExternalContext, externalInterceptor, setState, serverContext });
  };

  useEffect(() => {
    interceptStateChange({ oldState: null, newState: state, externalContext, setExternalContext, externalInterceptor, setState, serverContext });
  }, []);
  
  return (<GenericFormContext.Provider value={{
    onChange,
    addOptionById: (id, option) => {
      setFields(addOptionById(fields, id, option))
    },
  }}>
  <Container
    title={props.title}
    controls={<ControlsClass {...props} />}
    contentOutside={props.boxLayoutContentOutside}>
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(onChange);
        return false;
      }}
    >
    {formWideError && <div className="form-row normal-spacing"><div className="field-container">
      <div style={
        {border: '1px solid #E55934', borderRadius: 3, padding: 8, color: '#E55934', fontWeight: 'bold'}
      }>{formWideError}</div>
    </div></div>}
      <FormComponent
        definition={fields}
        value={state}
        onChange={interceptSetState}
        error={errors}
        onReset={onReset}
        path={[]}
        context={externalContext}
      />
      {!props.noStandardSubmitButton && !props.submitButtonWidget && <SubmitContainerWrapper>
        <div className="submit-button-container">
          <button disabled={false} className="btn btn-green" type="submit">
            <i className="fas fa-arrow-circle-right" /> {props?.formAction || 'Save'}
          </button>
        </div>
        </SubmitContainerWrapper>}
      {SubmitButtonWidget  && <SubmitButtonWidget
        {...props}
        value={state}
        onChange={setState}
        onChangeTop={onChange}
        onSubmit={onSubmit}
      />}
    </form>
  </Container>
  </GenericFormContext.Provider>);
};
