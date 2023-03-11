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

// TODO
// migrate fn
// boxes boxes boxes
// ListT transform
// walk

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
  } else if (Array.isArray(value) && value.length === 0) {
    return firstIndent + "[]";
  } else if (Array.isArray(value)) {
    return (
      <>
        <span>
          {firstIndent + "["}
          <br />
          {value.map((v, i) => {
            return (
              <>
                <JSONNode value={v} level={lvl} />
                {i === value.length - 1 ? "" : ","}
                <br />
              </>
            );
          })}
          {indent + "]"}
        </span>
      </>
    );
  } else if (typeof value === "object" && Object.entries(value).length === 0) {
    return firstIndent + "{}";
  } else if (typeof value === "object") {
    const items = Object.entries(value);
    return (
      <>
        <span>
          {firstIndent + "{"}
          <br />
          {items.map(([k, v], i) => {
            return (
              <>
                {indent + "  "}
                {'"'}
                <span className="text-secondary">{k}</span>
                {'": '}
                <JSONNode value={v} level={lvl} noFirstIndent />
                {i === items.length - 1 ? "" : ","}
                <br />
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
  } else if (d.type === "App") {
    return getTypeFromDef(d.target);
  } else if (d.type === "AppT") {
    return getTypeFromDef(d.target);
  } else if (d.type === "ListT") {
    return "ListT";
  } else {
    console.log(d);
    throw new Error(`Not implemented: ${JSON.stringify(d)}`);
  }
};

// MatchPattern, MatchResult, Value
// KeyMap, ContextFreeGrammar, Text (Key) Scientific Bool
// ObjectKeyMatch, List

const applyTypeVars = (d, typeVars) => {
  if (!d) return d;
  if (d.type === "ConT") {
    return d;
  } else if (d.type === "App") {
    return update(d, {
      target: { $apply: (x) => applyTypeVars(x, typeVars) },
      params: { $each: { $apply: (x) => applyTypeVars(x, typeVars) } },
    });
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
    throw new Error(`Not implemented: ${JSON.stringify(d)}`);
  }
};

let ADTEditorNodeComponent = null;

const emptyToLast = (es) => {
  const items = [...es.map((x, i) => [x, i])];
  items.sort(([[kA, vA], iA], [[kB, vB], iB]) => {
    if (kA === "") return 1;
    if (kB === "") return -1;
    if (iA > iB) return 1;
    if (iA < iB) return -1;
    return 0;
  });
  return items.map(([x, i]) => x);
};
window.emptyToLast = emptyToLast;

const KeyMapNodeEditor = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  type,
  vars,
  selectedPath,
}) => {
  const currentValue = getByPath(value, path);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const isSelected =
    /*(!path?.length && !selectedPath?.length) ||*/ path.length ===
      selectedPath.length && path.every((e, i) => e == selectedPath[i]);
  if (!type) {
    throw new Error(`Not defined for type ${JSON.stringify(type)}`);
  }
  const options = type.contents.map(({ tag, contents }) => ({
    value: tag,
    label: tag,
    newValue: {
      tag,
      contents: contents.length === 1 ? null : contents.map((_) => null),
    },
  }));
  const constructor =
    type?.contents && currentValue?.tag
      ? type?.contents.find(({ tag }) => currentValue?.tag === tag)
      : null;
  const typeVars = {};
  const newTypeVars = { ...typeVars, ...type?.vars };
  const childType = type.contents[0].contents[0];
  if (!childType) {
    return (
      <div className="adt-editor-card">
        No child type:
        <br />
        <JSONNode value={type} />
      </div>
    );
  }
  const childTypeDef = callType(schema, childType);
  return (
    <div className="adt-editor-card">
      <div className="adt-editor-card-title">KeyMap</div>
      {/*<JSONNode value={type} />
      <br />*/}
      {emptyToLast(Object.entries(currentValue || {})).map(([k, v], i) => {
        return (
          <div>
            <a
              className="text-danger"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const current = { ...getByPath(value, path) };
                delete current[k];
                onChange(setByPath(value, path, current));
              }}
            >
              &times;
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault();
                runModal(
                  {
                    title: t("Change item key"),
                    fields: {
                      type: "Fields",
                      fields: [
                        {
                          type: "TextField",
                          k: "val",
                          label: t("Key"),
                          required: true,
                        },
                      ],
                    },
                    modalSize: "md",
                  },
                  {
                    val: k,
                  },
                  ({ val }) => {
                    const current = { ...getByPath(value, path) };
                    delete current[k];
                    current[val] = v;
                    onChange(setByPath(value, path, current));
                  }
                );
              }}
            >
              <span className="text-muted">{` ${k} `}</span>
            </a>
            <ADTEditorNodeComponent
              value={value}
              onChange={onChange}
              onSelect={onSelect}
              path={[...path, k]}
              schema={schema}
              type={childTypeDef}
              selectedPath={selectedPath}
            />
          </div>
        );
      })}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          runModal(
            {
              title: t("Add item"),
              fields: {
                type: "Fields",
                fields: [
                  {
                    type: "TextField",
                    k: "val",
                    label: t("Key"),
                    required: true,
                  },
                ],
              },
              modalSize: "md",
            },
            {
              val: "",
            },
            ({ val }) =>
              onChange(
                setByPath(value, path, {
                  ...(getByPath(value, path) || {}),
                  [val]: null,
                })
              )
          );
        }}
      >
        {"+ "}
        <Trans>Add</Trans>
      </a>
    </div>
  );
};

const TextNodeEditor = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  type,
  vars,
  selectedPath,
}) => {
  const currentValue = getByPath(value, path);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const isSelected =
    /*(!path?.length && !selectedPath?.length) ||*/ path.length ===
      selectedPath.length && path.every((e, i) => e == selectedPath[i]);
  if (!type) {
    throw new Error(`Not defined for type ${JSON.stringify(type)}`);
  }
  const options = type.contents.map(({ tag, contents }) => ({
    value: tag,
    label: tag,
    newValue: {
      tag,
      contents: contents.length === 1 ? null : contents.map((_) => null),
    },
  }));
  const constructor =
    type?.contents && currentValue?.tag
      ? type?.contents.find(({ tag }) => currentValue?.tag === tag)
      : null;
  const typeVars = {};
  const newTypeVars = { ...typeVars, ...type?.vars };
  return (
    <div>
      <a
        className="text-dark"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          runModal(
            {
              title: t("Change value"),
              fields: {
                type: "Fields",
                fields: [
                  {
                    type: "TextField",
                    k: "val",
                    label: t("Value"),
                    required: true,
                  },
                ],
              },
              modalSize: "md",
            },
            {
              val: currentValue,
            },
            ({ val }) => onChange(setByPath(value, path, val))
          );
        }}
      >
        {'"'}
        <span className="text-danger">{currentValue}</span>
        {'"'}
      </a>
    </div>
  );
};

const ScientificNodeEditor = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  type,
  vars,
  selectedPath,
}) => {
  const currentValue = getByPath(value, path);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const isSelected =
    /*(!path?.length && !selectedPath?.length) ||*/ path.length ===
      selectedPath.length && path.every((e, i) => e == selectedPath[i]);
  if (!type) {
    throw new Error(`Not defined for type ${JSON.stringify(type)}`);
  }
  const options = type.contents.map(({ tag, contents }) => ({
    value: tag,
    label: tag,
    newValue: {
      tag,
      contents: contents.length === 1 ? null : contents.map((_) => null),
    },
  }));
  const constructor =
    type?.contents && currentValue?.tag
      ? type?.contents.find(({ tag }) => currentValue?.tag === tag)
      : null;
  const typeVars = {};
  const newTypeVars = { ...typeVars, ...type?.vars };
  return (
    <div>
      <a
        className="text-dark"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          runModal(
            {
              title: t("Change value"),
              fields: {
                type: "Fields",
                fields: [
                  {
                    type: "NumberField",
                    k: "val",
                    label: t("Value"),
                    required: true,
                  },
                ],
              },
              modalSize: "md",
            },
            {
              val: currentValue,
            },
            ({ val }) => onChange(setByPath(value, path, val))
          );
        }}
      >
        <span className="text-primary">{currentValue || 0}</span>
      </a>
    </div>
  );
};

const BoolNodeEditor = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  type,
  vars,
  selectedPath,
}) => {
  const currentValue = getByPath(value, path);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const isSelected =
    /*(!path?.length && !selectedPath?.length) ||*/ path.length ===
      selectedPath.length && path.every((e, i) => e == selectedPath[i]);
  if (!type) {
    throw new Error(`Not defined for type ${JSON.stringify(type)}`);
  }
  const options = type.contents.map(({ tag, contents }) => ({
    value: tag,
    label: tag,
    newValue: {
      tag,
      contents: contents.length === 1 ? null : contents.map((_) => null),
    },
  }));
  const constructor =
    type?.contents && currentValue?.tag
      ? type?.contents.find(({ tag }) => currentValue?.tag === tag)
      : null;
  const typeVars = {};
  const newTypeVars = { ...typeVars, ...type?.vars };
  return (
    <div>
      <a
        className="text-primary"
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onChange(setByPath(value, path, !currentValue));
        }}
      >
        {currentValue ? "true" : "false"}
      </a>
    </div>
  );
};

const ListNodeEditor = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  type,
  vars,
  selectedPath,
}) => {
  const currentValue = getByPath(value, path);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const isSelected =
    /*(!path?.length && !selectedPath?.length) ||*/ path.length ===
      selectedPath.length && path.every((e, i) => e == selectedPath[i]);
  if (!type) {
    throw new Error(`Not defined for type ${JSON.stringify(type)}`);
  }
  const options = type.contents.map(({ tag, contents }) => ({
    value: tag,
    label: tag,
    newValue: {
      tag,
      contents: contents.length === 1 ? null : contents.map((_) => null),
    },
  }));
  const constructor =
    type?.contents && currentValue?.tag
      ? type?.contents.find(({ tag }) => currentValue?.tag === tag)
      : null;
  const typeVars = {};
  const newTypeVars = { ...typeVars, ...type?.vars };
  return (
    <div className="adt-editor-card">
      <div className="adt-editor-card-title">List</div>
      {/*<JSONNode value={type} />
      <br />*/}
      {currentValue?.map((_, i) => {
        return (
          <div>
            <a
              className="text-danger"
              href="#"
              onClick={(e) => {
                e.preventDefault();
                const current = [...getByPath(value, path)];
                current.splice(i, 1);
                onChange(setByPath(value, path, current));
              }}
            >
              &times;
            </a>
            <span className="text-muted">{` ${i} `}</span>
            <ADTEditorNodeComponent
              value={value}
              onChange={onChange}
              onSelect={onSelect}
              path={[...path, i]}
              schema={schema}
              type={callType(schema, type.contents[0].contents[0].param)}
              selectedPath={selectedPath}
            />
          </div>
        );
      })}
      <a
        href="#"
        onClick={(e) => {
          e.preventDefault();
          onChange(
            setByPath(value, path, [...(getByPath(value, path) || []), null])
          );
        }}
      >
        {"+ "}
        <Trans>Add</Trans>
      </a>
    </div>
  );
};

const standardNodeEditors = {
  KeyMapNodeEditor,
  KeyNodeEditor: TextNodeEditor,
  ListNodeEditor,
  // String Scientific Bool
  TextNodeEditor,
  ScientificNodeEditor,
  BoolNodeEditor,
};

const ADTEditorNode = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  type,
  vars,
  selectedPath,
}) => {
  const currentValue = getByPath(value, path);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const isSelected =
    /*(!path?.length && !selectedPath?.length) ||*/ path.length ===
      selectedPath.length && path.every((e, i) => e == selectedPath[i]);
  if (!type) {
    throw new Error(`Not defined for type ${JSON.stringify(type)}`);
  }
  const options = type.contents.map(({ tag, contents }) => ({
    value: tag,
    label: tag,
    newValue: {
      tag,
      contents: contents.length === 1 ? null : contents.map((_) => null),
    },
  }));
  const constructor =
    type?.contents && currentValue?.tag
      ? type?.contents.find(({ tag }) => currentValue?.tag === tag)
      : null;
  const typeVars = {};
  const newTypeVars = { ...typeVars, ...type?.vars };
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
          {/*{type?.value}
          <br />*/}
          {!currentValue ? (
            <>
              {"["}
              <Trans>not selected</Trans>
              {"]"}
            </>
          ) : (
            <>{currentValue?.tag + ""}</>
          )}
        </a>
      </div>
      {Array.isArray(constructor?.contents)
        ? constructor.contents.map((arg, i) => {
            const newPath = [...path, "contents"];
            if (constructor.contents.length > 1) {
              newPath.push(i);
            }
            return (
              <div>
                <ADTEditorNodeComponent
                  value={value}
                  onChange={onChange}
                  onSelect={onSelect}
                  path={newPath}
                  schema={schema}
                  type={callType(schema, arg)}
                  selectedPath={selectedPath}
                />
              </div>
            );
          })
        : null}
    </div>
  );
};

ADTEditorNodeComponent = (props) => {
  const { value, onChange, onSelect, path, schema, type, vars, selectedPath } =
    props;
  const standardNodeEditor = standardNodeEditors[`${type.value}NodeEditor`];
  let Component = standardNodeEditor || ADTEditorNode;
  return <Component {...props} />;
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

const collapseAppT = (typeCall) => {
  if (typeCall?.type === "AppT") {
    const t = collapseAppT(typeCall.target);
    let params = [typeCall.param];
    let target = t;
    if (t.type === "App") {
      params = [...t.params, ...params];
      target = t.target;
    }
    return { type: "App", target, params };
  }
  return typeCall;
};

const convertListT = (typeCall) => {
  if (typeCall?.type === "App") {
    let r = { ...typeCall };
    if (r.target && typeof r.target === "object" && r.target.type === "ListT") {
      r.target = { type: "ConT", value: "List" };
    }
    r.params = r.params?.map(convertListT);
    return r;
  }
  return typeCall;
};

const callType = (schema, typeCall) => {
  const c = convertListT(collapseAppT(typeCall));
  const tt = getTypeFromDef(c);
  for (const item of schema) {
    const { value, contents, vars } = item;
    if (value === tt) {
      const typeVars = {};
      for (let i = 0; i < vars?.length || 0; i++) {
        typeVars[vars[i]] = c.params[i];
      }
      return update(item, {
        contents: {
          $apply: (cs) => {
            return cs.map((cnst) =>
              update(cnst, {
                contents: {
                  $apply: (ccc) => ccc.map((pm) => applyTypeVars(pm, typeVars)),
                },
              })
            );
          },
        },
        $unset: ["vars"],
      });
    }
  }
  throw new Error(`No type for: ${tt}`);
};

const standardSchema = [
  {
    contents: [{ tag: "List", contents: [{ type: "VarT", value: "k1" }] }],
    value: "List",
    vars: ["k1"],
  },
  {
    contents: [{ tag: "KeyMap", contents: [{ type: "VarT", value: "k1" }] }],
    value: "KeyMap",
    vars: ["k1"],
  },
  {
    contents: [],
    value: "Text",
  },
  {
    contents: [],
    value: "Scientific",
  },
  {
    contents: [],
    value: "Bool",
  },
  {
    contents: [],
    value: "Null",
  },
];

const JSONMatcherEditor = ({ value, onChange, saveButton }) => {
  //const [value, onChange] = useState(exampleData.value);
  const [selectedPath, setSelectedPath] = useState([]);
  const processedSchema = [...standardSchema, ...schema];
  return (
    <div className="row align-items-stretch flex-grow-1">
      {/*<button type="button" onClick={e => {e.preventDefault(); setShow();}}>Modal</button>*/}
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1 adt-editor">
          <div className="adt-editor-wrapper">
            <div className="adt-editor-inner">
              {/*<JSONNode value={callType(schema, t2)} />*/}
              <ADTEditorNode
                value={value}
                onChange={onChange}
                onSelect={setSelectedPath}
                path={[]}
                type={callType(processedSchema, t2)}
                schema={processedSchema}
                selectedPath={selectedPath}
              />
            </div>
          </div>
        </div>
        <div className="d-grid">{saveButton}</div>
      </div>
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1 jsonmatcher-editor">
          <div className="adt-editor-wrapper">
            <div className="adt-editor-inner">
              <JSONNode value={value} onChange={onChange} />
            </div>
          </div>
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
