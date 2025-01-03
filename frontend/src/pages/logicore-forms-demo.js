import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useMemo,
  useRef,
  useContext,
} from "react";
import {
  BrowserRouter as Router,
  Switch as Routes,
  Route,
  Link,
  useLocation,
  useHistory,
} from "react-router-dom";

import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import { alert, confirm } from "react-bootstrap-confirmation-v2";

import {
  validateDefinition,
  definitionIsInvalid,
  pathToUpdate,
  FormComponent,
  GenericForm,
  formComponents,
  FieldLabel,
  interceptors,
  fieldsLayouts,
  getByPath,
  setByPath,
  modifyHelper,
} from "../logicore-forms";
import { axios, extend, update } from "../imports";

const INITIAL_DATA = `{
  "type": "Fields",
  "fields": [
    {
      "type": "TextField",
      "k": "name",
      "label": "Name",
      "required": true
    },
    {
      "type": "UUIDListField",
      "k": "items",
      "addWhat": "item",
      "layout": "WithDeleteButton",
      "fields": [
        {
          "type": "TextField",
          "k": "name",
          "label": "Item Name",
          "required": true
        },
        {
          "type": "NumberField",
          "k": "count",
          "label": "Count"
        }
      ]
    }
  ]
}`;

const INITIAL_VALUE = {"items":[{"uuid":"a93160df-c79e-42b1-8405-c2b037e1e11c","name":"Avocado","count":"1"},{"uuid":"c78ad501-7bcd-48f2-96c1-49f1e07ab010","name":"Eggs","count":"2"},{"uuid":"ad01c8e4-37f0-4084-9308-3394ab9a43a0","name":"fish fillet","count":"1"}],"name":"Things I eat in a day"};

const HomeView = () => {
  const [text, setText] = useState(INITIAL_DATA);
  const [fields, setFields] = useState(JSON.parse(INITIAL_DATA));
  const [state, setState] = useState(INITIAL_VALUE);
  const [errors, setErrors] = useState({});
  const [lastValue, setLastValue] = useState(INITIAL_VALUE);
  const onReset = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    const errors = validateDefinition(fields, state);
    setErrors(errors, null);
    if (!definitionIsInvalid(fields, errors, state)) {
      // ok
      setLastValue(state);
    } else {
      NotificationManager.error(
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
      }, 50);
    }
  };
  return <div className="container-fluid my-4">
    <div className="row">
      <div className="col-md-4">
        <Link to="/">&lt; Back</Link>
      </div>
      <div className="col-md-4 d-flex justify-content-center">
        <h3>Logicore-forms demo</h3>
      </div>
      <div className="col-md-4 d-flex justify-content-center">
        Docs &amp; GitHub repo: Coming soon :-)
      </div>
    </div>
    <div className="row my-5">
      <div className="col-md-4">
        Schema (JSON):
        <textarea className="form-control" style={{height: "75vh", fontFamily: "Monaco, Menlo, Consolas, monospace"}} value={text} onChange={e => setText(e.target.value)}>
        </textarea>
        <button
          className="btn btn-primary my-2"
          onClick={_ => {
          let x = null;
            try {
              x = JSON.parse(text);
            } catch (e) {
              x = e.message + '';
            }
            setFields(x);
            setState({});
            setErrors({});
            setLastValue(null);
          }}
        >Update  -&gt;</button>
      </div>
      {typeof fields === 'string' ? <div className="col-md-4 text-danger">
          Error:
          <hr style={{marginTop: 0}} />
          <code>{fields}</code>
        </div> : <div className="col-md-4">
          <form onSubmit={onSubmit}>
         Form:
          <hr style={{marginTop: 0}} />
            <FormComponent
              definition={fields}
              value={state}
              onChange={setState}
              error={errors}
              onReset={onReset}
              path={[]}
            />
        <div className="btn-group my-3">
          <button type="submit" className="btn btn-primary">Submit</button>
          <button type="button" className="btn btn-outline-secondary" onClick={_ => { setState(null); setErrors(null); }}>Reset</button>
        </div>
        </form>
      </div>}
      <div className="col-md-4">
          Last value submitted:
          <hr style={{marginTop: 0}} />
          <code style={{whiteSpace: 'pre'}}>{JSON.stringify(lastValue, null, 2)}</code>
      </div>
    </div>
  </div>;
};


export default HomeView;
