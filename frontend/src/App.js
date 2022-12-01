import React, { useState, useEffect, useRef, useContext, memo } from "react";
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
import LogicoreFormsDemoView from "./pages/logicore-forms-demo";

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
  submitButtonWidgets,
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

const ListView = ({title, create_form, items, onChange, baseUrl}) => {
  const theBaseUrl = baseUrl || '/';
  return <div className="container">
    <div className="d-flex align-items-center justify-content-between">
      <h1>{title}</h1>
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
          <td><Link to={`${baseUrl}${item.id}`}>{item.name}</Link></td>
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

const LanguageView = ({onChange}) => {
  const [text, setText] = useState('');
  const [result, setResult] = useState(null);
  console.log('got result', result);
  return <div className="container-fluid my-4">
    <div className="row">
      <div className="col-md-6 d-flex justify-content-center">
        <h3>Language</h3>
      </div>
      <div className="col-md-6 d-flex justify-content-center">
        Result
      </div>
    </div>
    <div className="row my-5">
      <div className="col-md-6">
        Code:
        <textarea className="form-control" style={{height: "75vh", fontFamily: "Monaco, Menlo, Consolas, monospace"}} value={text} onChange={e => setText(e.target.value)}>
        </textarea>
        <button
          className="btn btn-primary my-2"
          onClick={_ => {
            setResult(null);
            onChange({value: text}, null, ({result}) => setResult(result));
          }}
        >Update  -&gt;</button>
      </div>
      {typeof result === 'string' ? <div className="col-md-6 text-danger">
          Error:
          <hr style={{marginTop: 0}} />
          <code>{result}</code>
        </div> : <div className="col-md-6">
          Result:
          <hr style={{marginTop: 0}} />
          <code style={{whiteSpace: 'pre'}}>{JSON.stringify(result, null, 2)}</code>
      </div>}
    </div>
  </div>;
};

const CodeDisplay = (props) => {
  return (<div className="my-1">
    <span style={{fontWeight: 'bold'}}>{props?.definition?.label}</span>
    <textarea id="id_8c8c87ea-0942-4fbd-97a9-7af3fb3504a5" type="text" className="form-control" defaultValue={props?.value} readOnly />
  </div>);
};
CodeDisplay.validatorRunner = (definition, value, parentValue, context) => {
  return null;
};
CodeDisplay.validatorChecker = (definition, error, state, parentState, context) => {
  return false;
};

const JSONMatchPatternFieldTypes = [
  {
    "label": "Containers",
    "color": "primary",
    children: [
    {
      key: "MatchObject",
      label: "{ ! }",
      title: "Object: All keys must match",
    },
    {
      key: "MatchObjectPartial",
      label: "{ ? }",
      title: "Object: Only specified keys must match",
    },
    {
      key: "MatchArray",
      label: "[ ! ]",
      title: "Array: All elements must match",
    },
    {
      key: "MatchArraySome",
      label: "[ ? ]",
      title: "Array: Some of the elements must match",
    },
    {
      key: "MatchArrayExact",
      label: "[ , ]",
      title: "Array: Literal (element-by-element) match",
    },
    {
      key: "MatchArrayContextFree",
      label: "[ * ]",
      title: "Array: Match using context-free grammar",
    },
  ]
  },
  {
    "label": "Literals",
    "color": "success",
    children: [
      {
        key: "MatchString",
        label: "\"abc\"",
        title: "Match String",
      },
      {
        key: "MatchNumber",
        label: "123",
        title: "Match Number",
      },
      {
        key: "MatchBool",
        label: "Y/N",
        title: "Match Boolean",
      },
      {
        key: "MatchNull",
        label: "Null",
        title: "Match Null",
      },
    ],
  },
  {
    "label": "Conditions",
    "color": "warning",
    children: [
      {
        key: "MatchSimpleOr",
        label: "a|b",
        title: "OR",
      },
      {
        key: "MatchAny",
        label: "?",
        title: "OR",
      },
    ],
  },
  {
    label: "Funnel",
    color: "dark",
    children: [
      {
        key: "MatchFunnel",
        label: "_",
        title: "Regular funnel",
      },
      {
        key: "MatchFunnelKeys",
        label: "k",
        title: "Match keys to funnel",
      },
      {
        key: "MatchFunnelKeysU",
        label: "k!",
        title: "Match keys to funnel (unique)",
      },
    ]
  },
];

const JSONMatchPatternFieldNode = ({value, path, onChange}) => {
    return <div>
      <div className="d-flex" style={{gridGap: 5}}>
      {JSONMatchPatternFieldTypes.map(g => {
        return <div>
          <div style={{fontSize: "0.75rem"}}>{g.label}</div>
          <div className="btn-group">
            {g.children.map(t => {
              const active = t.key === value.type;
              return <button type="button" className={classd`btn btn-sm btn${!active ? "-outline" : ""}-${g.color} fw-bold`} onClick={_ => {
                if (!active) {
                  onChange({type: t.key});
                }
              }}>{t.label}</button>;
          })}
          </div>
        </div>
      })}
        </div>
      </div>;
}

const JSONMatchPatternField = (props) => {
  const value = typeof props.value === "object" ? props.value : {};
  return (<div className="my-1">
    <span style={{fontWeight: 'bold'}}>{props?.definition?.label}</span>
    {/*<textarea type="text" className="form-control" defaultValue={props?.value} readOnly />*/}
    <div className="form-control">
      <JSONMatchPatternFieldNode onChange={props.onChange} value={value} />
    </div>
  </div>);
};
JSONMatchPatternField.validatorRunner = (definition, value, parentValue, context) => {
  return null;
};
JSONMatchPatternField.validatorChecker = (definition, error, state, parentState, context) => {
  return false;
};

Object.assign(formComponents, {
  CodeDisplay,
  JSONMatchPatternField,
});

const CodeSearchSubmit = ({}) => {
  return <div className="d-grid">
    <button className="btn btn-primary" type="submit">
      Save &amp; Run{" "}
      <i className="fas fa-play-circle" />
    </button>
  </div>;
};

Object.assign(submitButtonWidgets, {
  CodeSearchSubmit,
});

const CodeSearchLayout = (props) => {
  const { renderedFields } = props;
  return (<>
    <div className={classd`code-search ${{"is-error": props.value.error}}`} style={{
      minHeight: "calc(max(100vh - 200px, 500px))",
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gridGap: 20,
    }}>
      <div className="">{renderedFields[0]}</div>
      <div className="">{renderedFields[1]}</div>
      <div className="">{renderedFields[2]}</div>
      <div className="">{renderedFields[3]}</div>
    </div>
  </>);
};
Object.assign(fieldsLayouts, {
  CodeSearchLayout,
});

const GenericForm2 = (props) => {
  return <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">Logicore</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link active" aria-current="page" to="/logicore-code/">Go Back</Link>
              </li>
              {/*<li className="nav-item">
                <a className="nav-link" href="#">Link</a>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Dropdown
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li><a className="dropdown-item" href="#">Action</a></li>
                  <li><a className="dropdown-item" href="#">Another action</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#">Something else here</a></li>
                </ul>
              </li>
              <li className="nav-item">
                <a className="nav-link disabled">Disabled</a>
              </li>*/}
            </ul>
            {/*<form className="d-flex">
              <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
              <button className="btn btn-outline-success" type="submit">Search</button>
            </form>*/}
          </div>
        </div>
      </nav>
			<div className="container-fluid">
				<GenericForm {...props} />
			</div>
  </div>;
};

const JSONExplorerGadget = (props) => {
  const [state, setState] = useLocalStorage('LOGICORE_JSON_EXPLORER_DATA', {});
  return <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">JSON Explorer</a>
          <button className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link className="nav-link active" aria-current="page" to="/">Visit home page</Link>
              </li>
              {/*<li className="nav-item">
                <a className="nav-link" href="#">Link</a>
              </li>
              <li className="nav-item dropdown">
                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-bs-toggle="dropdown" aria-expanded="false">
                  Dropdown
                </a>
                <ul className="dropdown-menu" aria-labelledby="navbarDropdown">
                  <li><a className="dropdown-item" href="#">Action</a></li>
                  <li><a className="dropdown-item" href="#">Another action</a></li>
                  <li><hr className="dropdown-divider" /></li>
                  <li><a className="dropdown-item" href="#">Something else here</a></li>
                </ul>
              </li>
              <li className="nav-item">
                <a className="nav-link disabled">Disabled</a>
              </li>*/}
            </ul>
            {/*<form className="d-flex">
              <input className="form-control me-2" type="search" placeholder="Search" aria-label="Search" />
              <button className="btn btn-outline-success" type="submit">Search</button>
            </form>*/}
          </div>
        </div>
      </nav>
			<div className="container-fluid">
        <GenericForm
          notifyOnError
          data={state}
          onChange={setState}
          fields={{type: "Fields", fields: [
            {"type": "TextareaField", "k": "source", "label": "Source JSON", "required": true},
            {"type": "HiddenField", "k": "result"},
            {"type": "JSONMatchPatternField", "k": "grammar", "label": "Grammar (structure)", "required": true},
            {"type": "HiddenField", "k": "funnel"},
          ], layout: "CodeSearchLayout"}}
          submitButtonWidget="CodeSearchSubmit"
        />
			</div>
  </div>;
};

const mainComponents = {
  ListView,
  GenericForm,
  GenericForm2,
  JSONExplorerGadget,
  HomeView,
  LogicoreFormsDemoView,
  LanguageView,
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
