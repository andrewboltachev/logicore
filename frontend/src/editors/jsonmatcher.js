import { useState, useContext } from "react";
import exampleData from "./jsonmatcher_example";
import { update } from "../logicore-forms/utils";
import schema from "./jsonmatcher_schema";
import { ModalProvider, ModalContext } from "../runModal";

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
import { useTranslation, Trans } from "react-i18next";
import runModal from "../runModal";

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
  } else if (value === null) {
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

const getTypeFromDef = (d) => {
  if (d.type === "ConT") {
    return d.value;
  } else if (d.type === "AppT") {
    return getTypeFromDef(d.target);
  } else {
    console.log(d);
    throw new Error(`Not implemented: ${d.type}`);
  }
};

// MatchPattern, MatchResult, Value
// KeyMap, ContextFreeGrammar, Text (String, Key) Scientific Bool
// ObjectKeyMatch, List

const applyTypeVars = (d, typeVars) => {
  if (d.type === "ConT") {
    return d;
  } else if (d.type === "AppT") {
    return update(d, {
      target: { $apply: (x) => applyTypeVars(x, typeVars) },
      param: { $apply: (x) => applyTypeVars(x, typeVars) },
    });
  } else if (d.type === "VarT") {
    const v = typeVars[d?.value];
    if (!v) throw new Error(`No var to resolve: ${d?.value}`);
    return v;
  } else if (d.type === "ListT") {
    return d;
  } else {
    console.log(d);
    throw new Error(`Not implemented: ${d.type}`);
  }
};

const ADTEditorNode = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  type,
  typeVars,
  selectedPath,
}) => {
  const currentValue = getByPath(value, path);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const isSelected =
    /*(!path?.length && !selectedPath?.length) ||*/ path.length ===
      selectedPath.length && path.every((e, i) => e == selectedPath[i]);
  const typeDef = schema.find(({ value }) => value === getTypeFromDef(type));
  if (!typeDef) {
    throw new Error(`Not defined for type ${type}`);
  }
  const options = typeDef.contents.map(({ tag, contents }) => ({
    value: tag,
    label: tag,
    newValue: {
      tag,
      contents: contents.length === 1 ? null : contents.map((_) => null),
    },
  }));
  const constructorContents =
    typeDef?.contents && currentValue?.tag
      ? typeDef?.contents.find(({ tag }) => currentValue?.tag === tag).contents
      : [];
  return (
    <div className="adt-editor-card">
      <div className="adt-editor-card-title">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            runModal(
              {
                title: t("Edit Node"),
                fields: {
                  type: "Fields",
                  fields: [
                    {
                      type: "SelectField",
                      k: "tag",
                      label: "Type",
                      //required: true,
                      options,
                    },
                  ],
                },
                modalSize: "md",
              },
              {
                tag:
                  options.find(({ value }) => value === currentValue?.tag) ||
                  null,
              },
              ({ tag }) =>
                onChange(setByPath(value, path, tag?.newValue || null))
            );
          }}
        >
          {!currentValue ? <>[not selected]</> : <>{currentValue?.tag + ""}</>}
        </a>
      </div>
      {constructorContents.map((cnst) => (
        <div>
          <JSONNode value={applyTypeVars(cnst, typeVars)} />
        </div>
      ))}
    </div>
  );
};

// Nodes end

const t1 = {
  type: "ConT",
  value: "MatchResult",
};

const t2 = {
  param: {
    type: "ConT",
    value: "MatchResult",
  },
  target: {
    param: {
      type: "ConT",
      value: "MatchPattern",
    },
    target: {
      type: "ConT",
      value: "ContextFreeGrammarResult",
    },
    type: "AppT",
  },
  type: "AppT",
};

const tv2 = {
  r_6989586621682300744: {
    type: "ConT",
    value: "MatchResult",
  },
  g_6989586621682300743: {
    param: {
      param: {
        type: "ConT",
        value: "MatchPattern",
      },
      target: {
        type: "ConT",
        value: "ContextFreeGrammar",
      },
      type: "AppT",
    },
    target: {
      type: "ConT",
      value: "KeyMap",
    },
    type: "AppT",
  },
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
            type={t2}
            typeVars={tv2}
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
