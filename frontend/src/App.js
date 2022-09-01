import React, { useState, useEffect, useRef, memo } from "react";
import logo from "./logo.svg";
import "./App.scss";
import classd from "classd";
import "react-notifications/lib/notifications.css";
import { axios, extend, update } from "./imports";
import { Button, Modal } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import { alert, confirm } from "react-bootstrap-confirmation";
import moment from "moment";
import SelectFileField from "./selectFileField"; // register
import PickFilePositionsField from "./pickFilePositionsField"; // register

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useHistory,
  useNavigate,
} from "react-router-dom";
import {
  useLocalStorage,
  useApi,
  moveUp,
  moveDown,
  range,
  capitalize,
  partition2,
  orderBy,
  getURLParameterByName,
  useWindowSize,
  useDebounce,
  changeURLParameter,
} from "./utils";

import ClojureGraph1Field from "./flow/ClojureGraph1";
import PythonRefactoring1Field from "./flow/PythonRefactoring1";
import ZenDocument1Field from "./flow/ZenDocument1";
import WebDashboard1Field from "./flow/WebDashboard1";

import HomeView from "./pages/home";

import { ComponentType, ReactNode } from "react";
import { jsx } from "@emotion/react";

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
} from "./logicore-forms";

const FolderField = ({
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
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </FieldLabel>
  );
};

Object.assign(formComponents, {
  PythonRefactoring1Field,
  ClojureGraph1Field,
  ZenDocument1Field,
  WebDashboard1Field,
  FolderField,
  SelectFileField,
  PickFilePositionsField,
});

const WithDeleteButton = ({ definition, renderedFields }) => {
  return (
    <div className="card mb-1">
    <div className="card-body d-flex align-items-start">
    <div className="flex-grow-1">
    {renderedFields}
    </div>
      <a
          href="#"
          className="btn btn-sm btn-outline-danger"
          style={{marginLeft: 16}}
          onClick={(e) => {
            e.preventDefault();
                definition.onChangeParent(
                  definition.parent.filter((x, i) => i != definition.index)
                );
          }}
      >×</a>
    </div>
    </div>
  );
};

Object.assign(fieldsLayouts, {
  WithDeleteButton,
});

const ListView = ({create_form, items, onChange}) => {
  return <div className="container">
    <div className="d-flex align-items-center justify-content-between">
      <h1>Stratagems</h1>
      <FormComponent
        path={[]}
        definition={create_form.fields}
        value={create_form.data}
        onChange={onChange}
        onReset={_ => _}
        error={null}
      />
    </div>
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Kind</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items?.map((item) => (<tr>
          <td><Link to={`/${item.id}`}>{item.name}</Link></td>
          <td>{item.kind}</td>
          <td>
            <button
              className="btn btn-sm btn-outline-danger"
              type="button"
              onClick={_ => confirm('Do you really want to delete this graph?').then(value => value && onChange({'action': 'delete', 'id': item.id}))}
            >
              <i className="fa fa-times" />
            </button>
          </td>
        </tr>))}
        {!items?.length && <tr>
          <td><em>No items</em></td>
        </tr>}
      </tbody>
    </table>
  </div>;
}

const mainComponents = {
  ListView,
  GenericForm,
  HomeView,
};

const MainWrapper = ({ result, onChange }) => {
  const Component = mainComponents[result?.template];
  return (
    <>
      {Component && result && <Component {...{ ...result, onChange }} />}
    </>
  );
};

const wrapperComponents = {
  MainWrapper,
};

const result_worth_processing = ({ result, loc, navigate }) => {
  if (result?.notification) {
    NotificationManager[result.notification.type]("", result.notification.text);
  }
  if (result?.redirect) {
    window.location.href = result.redirect;
    return false;
  }
  if (result?.navigate) {
    navigate(result.navigate);
    return false;
  }
  return true;
};

const gatherFileUids = (data) => {
  if (Array.isArray(data)) return data.reduce((a, b) => ({...a, ...gatherFileUids(b)}), null);
  if (data && typeof data === 'object') {
    if (data.its_uid_for_file_to_upload_239r8h239rh239r) {
      const uid = data.its_uid_for_file_to_upload_239r8h239rh239r;
      return {[uid]: window[uid].file};
    }
    return Object.entries(data).reduce((a, [_, b]) => ({...a, ...gatherFileUids(b)}), null);
  }
};

const BaseLayout = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const apiUrl = "/api" + loc.pathname + loc.search;
  const [result, loading, _] = useApi(apiUrl, loc.key);
  const [show, setShow] = useState(false);

  const reload = () => {
    navigate(loc.pathname);
  };
  useEffect(
    (_) => {
      console.log("GET API returned", result, window.actionToConsume);
      if (result?.current_date) window.current_date = result.current_date;
      if (!result_worth_processing({ result, loc, navigate })) return;
      if (window.actionToConsume) {
      }
    },
    [result]
  );

  const onChange = async (data, setErrors, customHandler) => {
    let resp;
    if (window._react_form_has_files) {
      //console.log(gatherFileUids(data)); return;
      const formData = new FormData();
      for (const [k, v] of Object.entries(gatherFileUids(data))) {
        formData.append(k, v);
      }
      formData.append('data', JSON.stringify(data));
      resp = await axios.post(apiUrl, formData);
      /*
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
       */
    } else {
      resp = await axios.post(apiUrl, {
        data,
      });
    }
    const result = resp.data;
    console.log("POST API returned", resp);
    if (customHandler) {
      customHandler(result);
    } else {
      if (setErrors) setErrors(null, null);
      if (!result_worth_processing({ result, loc, navigate })) return;
      if (result?.action === "setErrors") {
        if (setErrors) setErrors(result.errors, result.error);
      }
      if (result?.action === "closeWindow") {
        window.the_msg = result?.the_msg;
        window.close();
      }
    }
    return resp.data;
  };

  const Wrapper = wrapperComponents[result?.wrapper];

  if (result?.navigate || !Wrapper) return <div />;

  return <>
    <Wrapper {...{ loc, navigate, result, apiUrl, onChange }} />
  </>;
};

const updateFieldsByPath = (fields, path, f) => {
  if (path.length) {
    const [pathHead, ...nextPath] = path;
    if (!fields.fields) return fields;
    const fields2 = fields.fields.map(field => field?.k === pathHead ? updateFieldsByPath(field, nextPath, f) : field);
    console.log('reassemble', fields2);
    return {...fields, fields: fields2};
  } else {
    return f(fields);
  }
};

const RefsInterceptor = {
  processFields({ fields, definition, value }) {
    const options = value[definition.refsSource].map(item => ({value: item.uuid, label: definition.refsLabel(item)}));
    const ff = updateFieldsByPath({fields}, [...definition.refsNest, ...definition.refsTarget], field => ({...field, options})).fields;
    return ff;
  },
  onChange(newValue, oldValue, definition, context) {
    let v = {...newValue};
    if (newValue[definition.refsSource] !== oldValue[definition.refsSource]) {
      const available = Object.fromEntries(newValue[definition.refsSource].map(item => [item.uuid, item]));
      const r = modifyHelper(
        definition.refsNest, v, items => items.map(
          (item) => {
            const v = getByPath(item, definition.refsTarget);
            const found = available[v?.value];
            if (!found || !v?.value) return null;
            const vv = v?.value ? {value: v.value, label: definition.refsLabel(found)} : null;
            return modifyHelper(definition.refsTarget, item, _ => vv);
          }
        ).filter(x => x)
      ); /*setByPath(
        v,
        definition.refsNest,
        (getByPath(v, definition.refsNest) || []).map(
          (item) => {
            const v = getByPath(item, definition.refsTarget);
            const found = available[v?.value];
            if (!found && v?.value) return null;
            const vv = v?.value ? {value: v.value, label: definition.refsLabel(found)} : null;
            return setByPath(item, definition.refsTarget, vv);
          }
        ).filter(x => x)
      );*/
      return r;
    };
    return v;
  },
};

Object.assign(interceptors, {
  RefsInterceptor,
});

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="*" element={<BaseLayout />} />
        </Routes>
      </Router>
      <NotificationContainer enterTimeout={10} leaveTimeout={10} />
    </>
  );
}

export default App;
