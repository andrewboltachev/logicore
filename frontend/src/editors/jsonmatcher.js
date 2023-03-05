import { useState } from "react";
import exampleData from "./jsonmatcher_example";
import { update } from "../utils";
import schema from "./jsonmatcher_schema";

import "./jsonmatcher.scss";

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
} from "../logicore-forms";
import runModal from "../runModal";

// MatchPattern, MatchResult, Value
// KeyMap, ContextFreeGrammar, Text (String, Key) Scientific Bool
// ObjectKeyMatch, List

const ADTEditorNode = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  type,
  selectedPath,
}) => {
  const isSelected =
    /*(!path?.length && !selectedPath?.length) ||*/ path.length ===
      selectedPath.length && path.every((e, i) => e == selectedPath[i]);
  if (!value) {
    return (
      <div className="adt-editor-card">
        <div className="adt-editor-card-title">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
            }}
          >
            [not selected]
          </a>
        </div>
      </div>
    );
  }
  return <div>111</div>;
};

const JSONNode = ({ value, onChange, level, noFirstIndent, path }) => {
  const lvl = (level || 0) + 1;
  const indent = new Array(lvl).join("  ");
  const firstIndent = noFirstIndent ? "" : indent;
  const thePath = path || [];
  /*if (value.tag === "MatchObjectFull" || value.tag === "MatchObjectPartial") {
    const smbl = {"MatchObjectFull": "!", "MatchObjectPartial": "?"}[value.tag];
    return <div className="d-inline-block">
      <a className="text-secondary" href="#" onClick={e => { e.preventDefault(); onChange({...value, collapse: !value.collapse}); }}>{value.collapse ? "\u25BA" : "\u25BC"}</a> {`{${smbl}}`}<br />
      {!value.collapse ? <>
      {Object.entries(value.contents).map(([k, v]) => {
        return <span>
          <a className="text-danger" href="#" onClick={e => e.preventDefault()}>×</a>
          {" "}<input className="form-control bg-light" value={k} onChange={e => e.target.value} /><br />
          {"    "}<JSONNode value={v.contents} />
        </span>;
      })}
          <a className="text-success" href="#" onClick={e => e.preventDefault()}>+</a>
      </> : null}
    </div>;
  } else if (value.tag === "MatchStringExact") {
    return <>
      "" <input className="form-control bg-light" value={value.contents} onChange={e => e.target.value} /><br />
    </>;
  } else {
    return <><span className="text-warning">unknown node: {value?.tag}</span><br /></>;
  }*/
  /*
   */
  if (typeof value === "string") {
    return (
      <>
        {firstIndent}
        {'"'}
        <span className="text-danger">{value}</span>
        {'"'}
      </>
    );
  } else if (typeof value === "number") {
    return (
      <>
        {firstIndent}
        <span className="text-primary">{value}</span>
      </>
    );
  } else if (typeof value === "boolean") {
    return (
      <>
        {firstIndent}
        <span className="text-primary">{value ? "true" : "false"}</span>
      </>
    );
  } else if (typeof value === null) {
    return (
      <>
        {firstIndent}
        <span className="text-primary">null</span>
      </>
    );
  } else if (Array.isArray(value)) {
    return (
      <>
        <span>
          {firstIndent + "["}
          <br />
          {value.map((v) => {
            return (
              <>
                <JSONNode value={v} level={lvl} />,<br />
              </>
            );
          })}
          {indent + "]"}
        </span>
      </>
    );
  } else if (typeof value === "object") {
    return (
      <>
        <span>
          {firstIndent + "{"}
          <br />
          {Object.entries(value).map(([k, v]) => {
            return (
              <>
                {indent + "  "}
                {'"'}
                <span className="text-secondary">{k}</span>
                {'": '}
                <JSONNode value={v} level={lvl} noFirstIndent />,<br />
              </>
            );
          })}
          {indent + "}"}
        </span>
      </>
    );
  } else {
    // error
    return <div className="text-danger">{value + ""}</div>;
  }
};

// Nodes end

const t1 = {
  type: "VarT",
  value: "MatchResult",
};

const JSONMatcherEditor = ({ value, onChange, saveButton }) => {
  //const [value, onChange] = useState(exampleData.value);
  const [selectedPath, setSelectedPath] = useState([]);
  return (
    <div className="row align-items-stretch flex-grow-1">
      {/*<button type="button" onClick={e => {e.preventDefault(); setShow();}}>Modal</button>*/}
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1 jsonmatcher-editor">
          <ADTEditorNode
            value={value}
            onChange={onChange}
            onSelect={setSelectedPath}
            path={[]}
            type={t1}
            schema={schema}
            selectedPath={selectedPath}
          />
        </div>
        <div className="d-grid">{saveButton}</div>
      </div>
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1 jsonmatcher-editor">
          <JSONNode value={value} onChange={onChange} />
        </div>
        {/*<div className="d-grid">
          <button className="btn btn-success mt-2" type="button" onClick={_ => _}>
            <i className="fa fa-play-circle" />{" "}
            <Trans>Run</Trans>
          </button>
        </div>*/}
      </div>
    </div>
  );
};

export default {
  Editor: JSONMatcherEditor,
};
