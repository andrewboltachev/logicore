import React, {
  useState,
  useEffect,
  useRef,
  useContext,
  useMemo,
  useCallback,
  memo,
} from "react";
import logo from "./logo.svg";
import "./App.scss";
import classd from "classd";
import "react-notifications/lib/notifications.css";
import { axios, extend, update } from "./imports";
import {Button, Dropdown, ButtonGroup, Modal} from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import { alert, confirm } from "react-bootstrap-confirmation";
import moment from "moment";
import SelectFileField from "./selectFileField"; // register
import PickFilePositionsField from "./pickFilePositionsField"; // register

import { ModalProvider, ModalContext } from "./runModal";

import Container from "react-bootstrap/Container";
import Nav from "react-bootstrap/Nav";
import Navbar from "react-bootstrap/Navbar";
import NavDropdown from "react-bootstrap/NavDropdown";

import { debounce } from "lodash";

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
  removeLangFromPathName,
  addLangToPathName,
} from "./utils";

import ClojureGraph1Field from "./flow/ClojureGraph1";
import PythonRefactoring1Field from "./flow/PythonRefactoring1";
import ZenDocument1Field from "./flow/ZenDocument1";
import WebDashboard1Field from "./flow/WebDashboard1";

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

import { useTranslation, Trans } from "react-i18next";
import "./i18n";

// Editors - the main part of the system
import JSON_MATCHER from "./editors/jsonmatcher";
import PYTHON_MATCHER from "./editors/pythonmatcher";
import LOGICORE1 from "./editors/logicore1";
import LOGICORE2 from "./editors/logicore2";
import UI1 from "./editors/ui1";

const addLang = (url) => addLangToPathName(window.CURRENT_LANGUAGE, url);

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
        <div className="flex-grow-1">{renderedFields}</div>
        <a
          href="#"
          className="btn btn-sm btn-outline-danger"
          style={{ marginLeft: 16 }}
          onClick={(e) => {
            e.preventDefault();
            definition.onChangeParent(
              definition.parent.filter((x, i) => i != definition.index)
            );
          }}
        >
          ×
        </a>
      </div>
    </div>
  );
};

Object.assign(fieldsLayouts, {
  WithDeleteButton,
});

const ListView = ({ title, create_form, items, onChange, baseUrl }) => {
  const theBaseUrl = baseUrl || "/";
  return (
    <div className="container">
      <div className="d-flex align-items-center justify-content-between">
        <h1>{title}</h1>
        <FormComponent
          path={[]}
          definition={create_form.fields}
          value={create_form.data}
          onChange={onChange}
          onReset={(_) => _}
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
          {items?.map((item) => (
            <tr>
              <td>
                <Link to={`${baseUrl}${item.id}`}>{item.name}</Link>
              </td>
              <td>{item.kind}</td>
              <td>
                <button
                  className="btn btn-sm btn-outline-danger"
                  type="button"
                  onClick={(_) =>
                    confirm("Do you really want to delete this graph?").then(
                      (value) =>
                        value && onChange({ action: "delete", id: item.id })
                    )
                  }
                >
                  <i className="fa fa-times" />
                </button>
              </td>
            </tr>
          ))}
          {!items?.length && (
            <tr>
              <td>
                <em>No items</em>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const FiddleListView = ({ title, create_form, items, onChange, baseUrl }) => {
  const theBaseUrl = baseUrl || "/";
  return (
    <div className="container mt-3">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h3>{title}</h3>
          <h5 className="text-muted">My explorations</h5>
        </div>
        <Link to={baseUrl + "new"} className="btn btn-lg btn-success">
          <i className="fa fa-plus" /> New
        </Link>
      </div>
      <table className="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {items?.map((item) => (
            <tr>
              <td>
                <Link to={`${baseUrl}${item.id}`}>{item.name}</Link>
              </td>
              <td>{item.kind}</td>
              <td>
                <button
                  className="btn btn-sm btn-outline-danger"
                  type="button"
                  onClick={(_) =>
                    confirm("Do you really want to delete this graph?").then(
                      (value) =>
                        value && onChange({ action: "delete", id: item.id })
                    )
                  }
                >
                  <i className="fa fa-times" />
                </button>
              </td>
            </tr>
          ))}
          {!items?.length && (
            <tr>
              <td colSpan="2">
                <em>None yet</em>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

const LanguageView = ({ onChange }) => {
  const [text, setText] = useState("");
  const [result, setResult] = useState(null);
  return (
    <div className="container-fluid my-4">
      <div className="row">
        <div className="col-md-6 d-flex justify-content-center">
          <h3>Language</h3>
        </div>
        <div className="col-md-6 d-flex justify-content-center">Result</div>
      </div>
      <div className="row my-5">
        <div className="col-md-6">
          Code:
          <textarea
            className="form-control"
            style={{
              height: "75vh",
              fontFamily: "Monaco, Menlo, Consolas, monospace",
            }}
            value={text}
            onChange={(e) => setText(e.target.value)}
          ></textarea>
          <button
            className="btn btn-primary my-2"
            onClick={(_) => {
              setResult(null);
              onChange({ value: text }, null, ({ result }) =>
                setResult(result)
              );
            }}
          >
            Update -&gt;
          </button>
        </div>
        {typeof result === "string" ? (
          <div className="col-md-6 text-danger">
            Error:
            <hr style={{ marginTop: 0 }} />
            <code>{result}</code>
          </div>
        ) : (
          <div className="col-md-6">
            Result:
            <hr style={{ marginTop: 0 }} />
            <code style={{ whiteSpace: "pre" }}>
              {JSON.stringify(result, null, 2)}
            </code>
          </div>
        )}
      </div>
    </div>
  );
};

const CodeDisplay = (props) => {
  return (
    <div className="my-1">
      <span style={{ fontWeight: "bold" }}>{props?.definition?.label}</span>
      <textarea
        id="id_8c8c87ea-0942-4fbd-97a9-7af3fb3504a5"
        type="text"
        className="form-control"
        defaultValue={props?.value}
        readOnly
      />
    </div>
  );
};
CodeDisplay.validatorRunner = (definition, value, parentValue, context) => {
  return null;
};
CodeDisplay.validatorChecker = (
  definition,
  error,
  state,
  parentState,
  context
) => {
  return false;
};

const MatchObjectDefinition = {
  type: "Fields",
  fields: [
    {
      type: "UUIDListField",
      k: "arg0",
      label: "Array",
      fields: [
        {
          k: "key",
          type: "TextField",
          //"required": true,
          //"label": "Key",
        },
        {
          k: "value",
          type: "RecursiveField",
          definition_id: "grammar",
        },
      ],
      layout: "ADTKeyValue",
    },
  ],
};

const MatchArrayDefinition = {
  type: "Fields",
  fields: [
    {
      k: "element",
      type: "RecursiveField",
      definition_id: "grammar",
    },
  ],
};

const JSONMatchPattern = [
  {
    label: "Containers",
    color: "primary",
    children: [
      {
        key: "MatchObject",
        label: "{ ! }",
        title: "Object: All keys must match",
        empty: [[["", null]]],
        definition: MatchObjectDefinition,
      },
      {
        key: "MatchObjectPartial",
        label: "{ ? }",
        title: "Object: Only specified keys must match",
        empty: [[["", null]]],
        definition: MatchObjectDefinition,
      },
      {
        key: "MatchArray",
        label: "[ ! ]",
        title: "Array: All elements must match",
        empty: [[null]],
        definition: MatchArrayDefinition,
      },
      {
        key: "MatchArraySome",
        label: "[ ? ]",
        title: "Array: Some of the elements must match",
        empty: [[null]],
        definition: MatchArrayDefinition,
      },
      {
        key: "MatchArrayExact",
        label: "[ , ]",
        title: "Array: Literal (element-by-element) match",
        empty: [[null]],
        definition: {
          type: "Fields",
          fields: [
            {
              type: "UUIDListField",
              k: "arg0",
              label: "Array",
              fields: [
                {
                  k: "element",
                  type: "RecursiveField",
                  definition_id: "grammar",
                },
              ],
              layout: "ADTElement",
            },
          ],
        },
      },
      /*{
      key: "MatchArrayContextFree",
      label: "[ * ]",
      title: "Array: Match using context-free grammar",
      empty: [[null]],
    },*/
    ],
  },
  {
    label: "Literals",
    color: "success",
    children: [
      {
        key: "MatchString",
        label: '"abc"',
        title: "Match String",
        empty: ["wow!"],
        definition: {
          type: "Fields",
          fields: [
            {
              type: "TextField",
              k: "arg0",
            },
          ],
        },
      },
      {
        key: "MatchNumber",
        label: "123",
        title: "Match Number",
        empty: [0],
        definition: {
          type: "Fields",
          fields: [
            {
              type: "NumberField",
              k: "arg0",
            },
          ],
        },
      },
      {
        key: "MatchBool",
        label: "Y/N",
        title: "Match Boolean",
        empty: [false],
        definition: {
          type: "Fields",
          fields: [
            {
              type: "BooleanField",
              k: "arg0",
            },
          ],
        },
      },
      {
        key: "MatchNull",
        label: "Null",
        title: "Match Null",
      },
    ],
  },
  {
    label: "Conditions",
    color: "warning",
    children: [
      {
        key: "MatchSimpleOr",
        label: "a|b",
        title: "OR",
        definition: MatchObjectDefinition,
        empty: [["option1", null]],
      },
      {
        key: "MatchAny",
        label: "?",
        title: "OR",
      },
      {
        key: "MatchIfThen",
        label: "If",
        title: "«if-then» match",
        definition: {
          type: "Fields",
          fields: [
            {
              k: "arg0",
              type: "RecursiveField",
              definition_id: "grammar",
            },
            {
              k: "arg1",
              type: "RecursiveField",
              definition_id: "grammar",
            },
            {
              k: "arg2",
              type: "TextField",
            },
          ],
          layout: "ADTIfThen",
        },
        empty: [[null, null, ""]],
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
        label: "kU",
        title: "Match keys to funnel (unique)",
      },
    ],
  },
];

/*
{
  "type_name": "MatchPattern",
  "main_type":
  [
    {
      "tag": "MatchIfThen",
      "contents": ["MatchPattern", "MatchPattern", "String"],
      "emptyValue": [null, null, ""],
      //"validate": ...,
      //"widget": ...,
    },
  ],
  "other_types":
  {
    "String": {
    },
  }

const ADTFieldNode = ({value, path, error, onChange, level}) => {
}

const ADTField = ({value, onChange, definition}) => {
  const v = typeof value === "object" ? value : {};
	const Widget = definition?.adtDefintion?.[v?.type].widget;
  return (<div className="my-1">
    <span style={{fontWeight: 'bold'}}>{definition?.label}</span>
    <div className="form-control">
      <ADTFieldNode onChange={onChange} value={v} level={0} />
    </div>
  </div>);
};

const JSONMatchPatternField = (props) => {
	const {onChange, definition} = props;
  const value = typeof props.value === "object" ? props.value : {};
  //const Widget = JSONMatchPatternFieldWidgets[value?.type];
  return (<div className="my-1">
    <span style={{fontWeight: 'bold'}}>{definition?.label}</span>
    <div className="form-control">
      <ADTFieldNode onChange={onChange} value={value} level={0} />
    </div>
  </div>);
};
JSONMatchPatternField.validatorRunner = (definition, value, parentValue, context) => {
  return null;
};
JSONMatchPatternField.validatorChecker = (definition, error, state, parentState, context) => {
  return false;
};
*/

const ADTSelectField = ({
  value,
  onChange,
  error,
  definition,
  onReset,
  path,
  context,
  disabled,
}) => {
  const id = "id_" + uuidv4();
  const { label } = definition;
  let inner = null;
  const [editing, setEditing] = useState(false);
  return (
    <div style={{ flexShrink: 0 }}>
      {!value || editing ? (
        <div>
          <div className="d-flex" style={{ gridGap: 5 }}>
            {adtDefintion.map((g) => {
              return (
                <div style={{ flexShrink: 0 }}>
                  <div style={{ fontSize: "0.75rem" }}>{g.label}</div>
                  <div className="btn-group">
                    {g.children.map((t) => {
                      const active = t.key === value;
                      return (
                        <button
                          type="button"
                          className={classd`btn btn-sm btn${
                            !active ? "-outline" : ""
                          }-${g.color} fw-bold`}
                          style={{ flexShrink: 0 }}
                          onClick={(_) => {
                            if (!active) {
                              onChange(t.key);
                            }
                            setEditing(false);
                          }}
                        >
                          {t.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <button
          className="btn btn-sm btn-outline-dark"
          type="button"
          onClick={(_) => setEditing(true)}
          style={{ flexShrink: 0, whiteSpace: "nowrap" }}
        >
          {(adtDefintionItems.find((x) => x.key === value) || {}).label}
        </button>
      )}
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </div>
  );
};
ADTSelectField.isEmpty = (x) => !x;

Object.assign(formComponents, {
  CodeDisplay,
  //JSONMatchPatternField,
  ADTSelectField,
});

const CodeSearchSubmit = ({}) => {
  return (
    <div className="d-grid">
      <button className="btn btn-primary" type="submit">
        Save &amp; Run <i className="fas fa-play-circle" />
      </button>
    </div>
  );
};

Object.assign(submitButtonWidgets, {
  CodeSearchSubmit,
});

const CodeSearchLayout = (props) => {
  const { renderedFields } = props;
  return (
    <>
      <div
        className={classd`code-search ${{ "is-error": props.value.error }}`}
        style={{
          minHeight: "calc(max(100vh - 156px, 600px))",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridAutoRows: "1fr",
          gridGap: 20,
        }}
      >
        <div className="">{renderedFields[0]}</div>
        <div className="">{renderedFields[1]}</div>
        <div className="">{renderedFields[2]}</div>
        <div className="">{renderedFields[3]}</div>
      </div>
    </>
  );
};

const ADTNodeFields = (props) => {
  const { renderedFields } = props;
  return (
    <>
      <div
        className={classd`d-grid align-items-start`}
        style={{
          margin: "0 0 0 0",
          flexShrink: 0,
          gridGap: 5,
          gridAutoFlow: "column",
        }}
      >
        {renderedFields}
      </div>
    </>
  );
};

const ADTNodeFieldsWrapper = (props) => {
  const { renderedFields } = props;
  return (
    <>
      <strong>Grammar</strong>
      <div
        className="form-control"
        style={{
          position: "relative",
          minHeight: "40vh",
          overflow: "auto",
        }}
      >
        <div
          className={classd``}
          style={{
            margin: "0 0 0 0",
            position: "absolute",
          }}
        >
          <div className="" style={{}}>
            {renderedFields}
          </div>
        </div>
      </div>
    </>
  );
};

const ADTKeyValue = (props) => {
  const { renderedFields, definition } = props;
  return (
    <div className="d-flex">
      <a
        href="#"
        className="text-danger"
        style={{ marginRight: 5, padding: "0.5rem" }}
        onClick={(e) => {
          e.preventDefault();
          definition.onChangeParent(
            definition.parent.filter((x, i) => i != definition.index)
          );
        }}
      >
        ×
      </a>
      <div
        className={classd`d-flex`}
        style={{
          margin: "0 0 0 0",
          gridGap: 5,
          gridAutoFlow: "column",
        }}
      >
        {renderedFields.map((f) => (
          <div style={{ flexShrink: 0 }}>{f}</div>
        ))}
      </div>
    </div>
  );
};

const ADTElement = (props) => {
  const { renderedFields, definition } = props;
  return (
    <div className="d-flex">
      <a
        href="#"
        className="text-danger"
        style={{ marginRight: 5, padding: "0.5rem" }}
        onClick={(e) => {
          e.preventDefault();
          definition.onChangeParent(
            definition.parent.filter((x, i) => i != definition.index)
          );
        }}
      >
        ×
      </a>
      <div
        className={classd`d-flex`}
        style={{
          margin: "0 0 0 0",
          gridGap: 5,
          gridAutoFlow: "column",
        }}
      >
        {renderedFields.map((f) => (
          <div style={{ flexShrink: 0 }}>{f}</div>
        ))}
      </div>
    </div>
  );
};

const ADTIfThen = (props) => {
  const { renderedFields, definition } = props;
  return (
    <div>
      <label className="fw-bold">Pre-condition:</label>
      <div>{renderedFields[0]}</div>
      <label className="fw-bold">Condition:</label>
      <div>{renderedFields[1]}</div>
      <div className="d-flex align-items-center">
        <label className="fw-bold me-1">Error text:</label>
        <div>{renderedFields[2]}</div>
      </div>
    </div>
  );
};

Object.assign(fieldsLayouts, {
  CodeSearchLayout,
  ADTNodeFields,
  ADTKeyValue,
  ADTElement,
  ADTIfThen,
  ADTNodeFieldsWrapper,
});

const GenericForm2 = (props) => {
  return (
    <div>
      <nav className="navbar navbar-expand-lg navbar-light bg-light">
        <div className="container-fluid">
          <a className="navbar-brand" href="#">
            Logicore
          </a>
          <button
            className="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon" />
          </button>
          <div className="collapse navbar-collapse" id="navbarSupportedContent">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li className="nav-item">
                <Link
                  className="nav-link active"
                  aria-current="page"
                  to="/logicore-code/"
                >
                  Go Back
                </Link>
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
    </div>
  );
};

const JSONExplorerGadget = (props) => {
  const [state, setState] = useLocalStorage("LOGICORE_JSON_EXPLORER_DATA", {});
  const [result, setResult] = useState({});
  const [i, setI] = useState(0);
  return (
    <div style={{ overflow: "auto", height: "100vh" }}>
      <div style={{ minWidth: 1200, minHeight: 800 }}>
        <nav className="navbar navbar-expand-lg navbar-light bg-light">
          <div className="container-fluid">
            <a className="navbar-brand" href="#">
              JSON Explorer
            </a>
            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-expanded="false"
              aria-label="Toggle navigation"
            >
              <span className="navbar-toggler-icon" />
            </button>
            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav me-auto mb-2 mb-lg-0">
                <li className="nav-item">
                  <Link className="nav-link active" aria-current="page" to="/">
                    Visit home page
                  </Link>
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
            key={`s${i}`}
            notifyOnError
            data={{ ...state, ...result }}
            onChange={(newState) => {
              setState(newState);
              setResult({});
              props.onChange(newState, null, (resp) => {
                setResult(resp);
                setI(i + 1);
              });
            }}
            fields={{
              type: "Fields",
              fields: [
                { type: "TextareaField", k: "source", label: "Source JSON" },
                { k: "result", type: "CodeDisplay", label: "Result" },
                {
                  type: "Fields",
                  fields: [
                    {
                      type: "Fields",
                      fields: [
                        {
                          type: "ADTSelectField",
                          k: "grammar_type",
                          label: "Grammar",
                        },
                        {
                          type: "DefinedField",
                          k: "grammar_data",
                          label: "Grammar (structure)",
                          master_field: "grammar_type",
                          master_field_getter: (x) => x,
                          definitions: Object.fromEntries(
                            adtDefintionItems.map((x) => [
                              x.key,
                              x.definition || { type: "Fields", fields: [] },
                            ])
                          ),
                        },
                      ],
                      interceptor: "ADTNodeInterceptor",
                      adtDefintion: JSONMatchPattern,
                      id: "grammar",
                      layout: "ADTNodeFields",
                    },
                  ],
                  layout: "ADTNodeFieldsWrapper",
                  interceptor: "recursiveFields",
                  context: { formControlSm: true },
                },
                { k: "funnel", type: "CodeDisplay", label: "Funnel" },
              ],
              layout: "CodeSearchLayout",
            }}
            submitButtonWidget="CodeSearchSubmit"
          />
        </div>
      </div>
    </div>
  );
};

const PageNotFound = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>
        <Trans>Page not found</Trans>.{" "}
        <Link to="/">
          <Trans>Visit Home</Trans>
        </Link>
      </div>
    </div>
  );
};

const fiddleTypes = {
  JSON_MATCHER,
  PYTHON_MATCHER,
  LOGICORE1,
  LOGICORE2,
  UI1,
};

const Fiddle = (props) => {
  const [val, setVal] = useState(props.val);
  const [localChecked, setLocalChecked] = useState(false);
  const [dirty, setDirty] = useState(false);

  const draftPrefix = props.uuid ? `${props.uuid}/` : "";
  const draftKey = `${draftPrefix}${props.rev}`;
  const prevDraftKey = props.rev > 1 ? `${draftPrefix}${props.rev - 1}` : null;
  const draftId = `draft[${draftKey}]`;

  const { t } = useTranslation();
  const save = async () => {
    const currentSaved = window.localStorage.getItem(draftId);
    const currentDirty = dirty;

    // try the best
    window.localStorage.removeItem(draftId);
    setDirty(false);
    try {
      await props.onChange({ val });
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      if (currentSaved) window.localStorage.setItem(draftId, currentSaved);
      setDirty(currentDirty);
    }
  };
  useEffect(() => {
    setLocalChecked(false);
  }, [props.uuid]);

  const langChangeHookId = draftId + ".langChangeHook";
  const normalizeNull = (x) => (x === null ? "null" : x);

  useEffect(() => {
    if (localChecked) {
      saveToLocal(val);
    } else {
      (async () => {
        const rawV = window.localStorage.getItem(draftId) || "null";
        const v = JSON.parse(rawV);
        if (v) {
          window.localStorage.removeItem(draftId);
          if (rawV !== JSON.stringify(val)) {
            if (
              window.localStorage.getItem(langChangeHookId) ||
              (await confirm(t("Unsaved changes exist. Apply?"), {
                okText: t("Apply"),
                cancelText: t("Discard"),
              }))
            ) {
              window.localStorage.removeItem(langChangeHookId);
              setVal(v);
              setDirty(true);
            }
          }
        }
        setLocalChecked(true);
      })();
    }
  }, [val, localChecked]);

  const saveToLocal = useCallback(
    debounce((val) => {
      window.localStorage.setItem(draftId, JSON.stringify(val));
    }, 200),
    []
  );

  const valJSON = useMemo(() => JSON.stringify(val), [val]);
  const topValJSON = useMemo(() => JSON.stringify(props.val), [props.val]);

  const editVal = (v) => {
    const vJson = JSON.stringify(v);
    if (vJson !== valJSON) {
      setVal(v);
    }
    setDirty(vJson !== topValJSON);
  };

  const { Editor } = fiddleTypes[props.kind];

  if (!Editor) return `Not implemented: ${props.kind}`;

  const saveButton = (
    <button
      className="btn btn-primary mt-2"
      type="button"
      onClick={save}
      disabled={!dirty}
    >
      <i className="fas fa-save" /> <Trans>Save</Trans>
    </button>
  );

  return (
    <div className="container-fluid my-3 flex-grow-1 d-flex flex-column">
      <Editor
        revId={draftKey}
        prevRevId={prevDraftKey}
        value={val}
        onChange={editVal}
        saveButton={saveButton}
      />
    </div>
  );
};

const FiddleNotFound = () => {
  return (
    <div
      style={{
        position: "fixed",
        top: 56,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <div>
        <Trans>Tool not found.</Trans>{" "}
        <Link to={addLang("/toolbox/")}>
          <Trans>View available</Trans>
        </Link>
      </div>
    </div>
  );
};

const FiddleTypes = ({ items }) => {
  return (
    <div className="container">
      <h3 className="my-3">
        <Trans>Tool types</Trans>
      </h3>
      <ul>
        {items?.map((item) => {
          return (
            <li>
              <Link to={addLang(`/toolbox/${item.url}/`)}>{item.title}</Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const MyFiddleList = ({ items }) => {
  return (
    <div className="container">
      <h3 className="my-3">
        <Trans>My copies</Trans>
      </h3>
      {/*<ul>
        {items?.map((item) => {
          return (
            <li>
              <Link to={addLang(item.url)}>{item.title}</Link>
            </li>
          );
        })}
      </ul>*/}
      {/*className="d-grid" style={{gridAutoFlow: 'column', gap: '15px', gridTemplateColumns: "repeat(auto-fit, 18rem)"}}*/}
      <div 
        style={{display: 'flex', flexWrap: 'wrap', margin: -10}}
        >
        {items?.map((item) => {
          return (
            <div className="card" style={{ width: "18rem", margin: 10 }}>
              {/*<img src="..." className="card-img-top" alt="..." />*/}
              <div className="card-body">
                <h5 className="card-title">{item.title}</h5>
                <p className="card-text text-secondary fw-bold">
                  {item.kind}<br />
                </p>
                <Dropdown as={ButtonGroup} drop={"down-centered"}>
                  <Button href={addLang(item.url)} variant="success">Rev ({item.rev}) - {item.time_ago}</Button>

                  <Dropdown.Toggle split variant="success" id="dropdown-split-basic" />

                  <Dropdown.Menu>
                    {item.revs.map(item => (
                      <Dropdown.Item key={item.rev} href={addLang(item.url)}>Rev ({item.rev}) - {item.time_ago}</Dropdown.Item>
                    ))}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const mainComponents = {
  ListView,
  GenericForm,
  GenericForm2,
  JSONExplorerGadget,
  LogicoreFormsDemoView,
  LanguageView,
  PageNotFound,
  FiddleListView,
  // Fiddle begin
  FiddleTypes,
  MyFiddleList,
  FiddleNotFound,
  Fiddle,
  // Fiddle end
};

const MainWrapper = ({ result, onChange }) => {
  const Component = mainComponents[result?.template];
  return (
    <>{Component && result && <Component {...{ ...result, onChange }} />}</>
  );
};

const FiddleWrapper = ({ result, onChange }) => {
  let Component = mainComponents[result?.template];
  const loc = useLocation();
  const getUrl = (lang) => {
    const theUrl = loc.pathname + loc.search;
    return addLangToPathName(
      lang,
      removeLangFromPathName(window.CURRENT_LANGUAGE, theUrl)
    );
  };
  const { t } = useTranslation();
  return (
    <div
      className="d-flex flex-column"
      style={{ height: "calc(max(100vh, 700px))" }}
    >
      <Navbar bg="light" expand="lg">
        <div className="container-fluid">
          {/*<Navbar.Brand href="#home"><Trans>Tools</Trans></Navbar.Brand>*/}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Link className="nav-link" to={addLang("/")}>
                <i className="fas fa-arrow-circle-left"></i>{" "}
                <Trans>Back to main website</Trans>
              </Link>
              <Link className="nav-link" to={addLang("/toolbox/")}>
                <Trans>All tools</Trans>
              </Link>
              <Link className="nav-link" to={addLang("/toolbox/mine/")}>
                <Trans>Mine</Trans>
              </Link>
            </Nav>
            <Nav className="ml-auto">
              <NavDropdown
                title={
                  <>
                    <i className="fas fa-language"></i>{" "}
                    {window.CURRENT_LANGUAGE_NAME}
                  </>
                }
                id="basic-nav-dropdown"
                align="end"
              >
                {window.LANGUAGES.map(([code, name]) => {
                  return (
                    <NavDropdown.Item key={code} href={getUrl(code)}>
                      {name}
                    </NavDropdown.Item>
                  );
                })}
              </NavDropdown>
            </Nav>
          </Navbar.Collapse>
        </div>
      </Navbar>
      {Component && result && <Component {...{ ...result, onChange }} />}
    </div>
  );
};

const wrapperComponents = {
  MainWrapper,
  FiddleWrapper,
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
  if (Array.isArray(data))
    return data.reduce((a, b) => ({ ...a, ...gatherFileUids(b) }), null);
  if (data && typeof data === "object") {
    if (data.its_uid_for_file_to_upload_239r8h239rh239r) {
      const uid = data.its_uid_for_file_to_upload_239r8h239rh239r;
      return { [uid]: window[uid].file };
    }
    return Object.entries(data).reduce(
      (a, [_, b]) => ({ ...a, ...gatherFileUids(b) }),
      null
    );
  }
};

const BaseLayout = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const lang = window.CURRENT_LANGUAGE;
  const { t, i18n } = useTranslation();
  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [i18n.resolvedLanguage === lang]);
  let apiUrl = addLangToPathName(
    lang,
    "/api" + removeLangFromPathName(lang, loc.pathname + loc.search)
  );
  //
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
      formData.append("data", JSON.stringify(data));
      /*
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      */
      resp = await axios.post(apiUrl, formData);
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

  if (result?.navigate || result?.redirect || !Wrapper) return <div />;

  return (
    <>
      <Wrapper {...{ loc, navigate, result, apiUrl, onChange }} />
    </>
  );
};

const updateFieldsByPath = (fields, path, f) => {
  if (path.length) {
    const [pathHead, ...nextPath] = path;
    if (!fields.fields) return fields;
    const fields2 = fields.fields.map((field) =>
      field?.k === pathHead ? updateFieldsByPath(field, nextPath, f) : field
    );
    console.log("reassemble", fields2);
    return { ...fields, fields: fields2 };
  } else {
    return f(fields);
  }
};

const RefsInterceptor = {
  processFields({ fields, definition, value }) {
    const options = value[definition.refsSource].map((item) => ({
      value: item.uuid,
      label: definition.refsLabel(item),
    }));
    const ff = updateFieldsByPath(
      { fields },
      [...definition.refsNest, ...definition.refsTarget],
      (field) => ({ ...field, options })
    ).fields;
    return ff;
  },
  onChange(newValue, oldValue, definition, context) {
    let v = { ...newValue };
    if (newValue[definition.refsSource] !== oldValue[definition.refsSource]) {
      const available = Object.fromEntries(
        newValue[definition.refsSource].map((item) => [item.uuid, item])
      );
      const r = modifyHelper(definition.refsNest, v, (items) =>
        items
          .map((item) => {
            const v = getByPath(item, definition.refsTarget);
            const found = available[v?.value];
            if (!found || !v?.value) return null;
            const vv = v?.value
              ? { value: v.value, label: definition.refsLabel(found) }
              : null;
            return modifyHelper(definition.refsTarget, item, (_) => vv);
          })
          .filter((x) => x)
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
    }
    return v;
  },
};

const adtDefintion = JSONMatchPattern;

const adtDefintionItems = adtDefintion
  .map((x) => x.children)
  .reduce((a, b) => a.concat(b));

console.log(
  "!!!",
  Object.fromEntries(
    adtDefintionItems.map((x) => [
      x.key,
      x.definition || { type: "Fields", fields: [] },
    ])
  )
);

const ADTNodeInterceptor = {
  processFields({ fields, definition, value }) {
    return fields;
  },
  onChange(newValue, oldValue, definition, context) {
    const v = { ...newValue };
    if (oldValue?.grammar_type?.value !== newValue?.grammar_type?.value) {
      const e =
        adtDefintionItems.find((x) => x.key === newValue?.grammar_type?.value)
          ?.empty || [];
      //console.log('search in', definition?.adtDefintion.map(x=>x.children));
      v.grammar_data = Object.fromEntries(e.map((a, i) => [`arg${i}`, a]));
      //console.log(`selected empty for ${newValue?.grammar_type?.value}`, v.grammar_data);
    }
    return v;
  },
};

Object.assign(interceptors, {
  RefsInterceptor,
  ADTNodeInterceptor,
});

function App() {
  return (
    <ModalProvider>
      <Router>
        <Routes>
          <Route path="*" element={<BaseLayout />} />
        </Routes>
      </Router>
      <NotificationContainer enterTimeout={10} leaveTimeout={10} />
    </ModalProvider>
  );
}

export default App;
