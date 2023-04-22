import React, { useState, useContext, useRef, useEffect } from "react";
import exampleData from "./jsonmatcher_example";
import { update } from "../logicore-forms/utils";
import schema from "./jsonmatcher_schema";
import { ModalProvider, ModalContext } from "../runModal";
import { useDraggable } from "react-use-draggable-scroll";
import { useLocalStorage } from "../utils";
import { NotificationManager } from "react-notifications";
import { axios } from "../imports";
import _ from "lodash";

import { Button, Modal } from "react-bootstrap";

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
import { modalComponents } from "../runModal";
import { useTranslation, Trans } from "react-i18next";

// TODO
// migrate fn
// boxes boxes boxes
// ListT transform
// walk

const onPath = (value, onChange, path) => {
  return {
    value: getByPath(value, path),
    onChange: (newValue) => onChange(setByPath(value, path, newValue)),
  };
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
              <React.Fragment key={i}>
                <JSONNode value={v} level={lvl} />
                {i === value.length - 1 ? "" : ","}
                <br />
              </React.Fragment>
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
              <React.Fragment key={i}>
                {indent + "  "}
                {'"'}
                <span className="text-secondary">{k}</span>
                {'": '}
                <JSONNode value={v} level={lvl} noFirstIndent />
                {i === items.length - 1 ? "" : ","}
                <br />
              </React.Fragment>
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
  schemaConversions,
  type,
  vars,
  selectedPath,
  getActions,
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
      <div className="lc-adt-editor-card">
        No child type:
        <br />
        <JSONNode value={type} />
      </div>
    );
  }
  const childTypeDef = callType(schema, childType);
  return (
    <div className="lc-adt-editor-card">
      <div className="lc-adt-editor-card-title">KeyMap</div>
      {/*<JSONNode value={type} />
      <br />*/}
      {emptyToLast(Object.entries(currentValue || {})).map(([k, v], i) => {
        return (
          <div key={i}>
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
              onClick={async (e) => {
                e.preventDefault();
                const result = await runModal({
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
                  value: {
                    val: k,
                  },
                });
                if (result) {
                  const current = { ...getByPath(value, path) };
                  delete current[k];
                  current[result.val] = v;
                  onChange(setByPath(value, path, current));
                }
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
              schemaConversions={schemaConversions}
              type={childTypeDef}
              selectedPath={selectedPath}
              getActions={getActions}
            />
          </div>
        );
      })}
      <a
        href="#"
        onClick={async (e) => {
          e.preventDefault();
          const result = await runModal({
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
            value: {
              val: "",
            },
          });
          if (result) {
            onChange(
              setByPath(value, path, {
                ...(getByPath(value, path) || {}),
                [result.val]: null,
              })
            );
          }
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
  schemaConversions,
  type,
  vars,
  selectedPath,
  getActions,
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
        onClick={async (e) => {
          e.preventDefault();
          const result = await runModal({
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
            value: {
              val: currentValue,
            },
          });
          if (result) onChange(setByPath(value, path, result.val));
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
  schemaConversions,
  type,
  vars,
  selectedPath,
  getActions,
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
        onClick={async (e) => {
          e.preventDefault();
          const result = runModal({
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
            value: {
              val: currentValue,
            },
          });
          if (result) onChange(setByPath(value, path, result.val));
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
  schemaConversions,
  type,
  vars,
  selectedPath,
  getActions,
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
  schemaConversions,
  type,
  vars,
  selectedPath,
  getActions,
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
    <div className="lc-adt-editor-card">
      <div className="lc-adt-editor-card-title">List</div>
      {/*<JSONNode value={type} />
      <br />*/}
      {currentValue?.map((_, i) => {
        return (
          <div key={i}>
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
              schemaConversions={schemaConversions}
              type={callType(schema, type.contents[0].contents[0])}
              selectedPath={selectedPath}
              getActions={getActions}
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

const ValueNodeEditor = ({
  value,
  onChange,
  onSelect,
  path,
  schema,
  schemaConversions,
  type,
  vars,
  selectedPath,
  getActions,
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
        onClick={async (e) => {
          e.preventDefault();
          const result = runModal({
            title: t("Change value"),
            fields: {
              type: "Fields",
              fields: [
                {
                  type: "TextareaField",
                  k: "val",
                  label: t("Value"),
                  required: true,
                },
              ],
            },
            modalSize: "md",
            value: {
              val: JSON.stringify(currentValue),
            },
          });
          if (result) {
            onChange(setByPath(value, path, JSON.parse(result.val)));
          }
        }}
      >
        <JSONNode value={currentValue} />
      </a>
    </div>
  );
};

const standardNodeEditors = {
  KeyMapNodeEditor,
  KeyNodeEditor: TextNodeEditor,
  ListNodeEditor,
  ValueNodeEditor,
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
  schemaConversions,
  type,
  vars,
  selectedPath,
  getActions,
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
    <div className="lc-adt-editor-card">
      <div className="lc-adt-editor-card-title">
        {(getActions?.(type) || []).map(({ icon, run, className }, i) => {
          return (
            <a
              key={i}
              href="#"
              onClick={async (e) => {
                e.preventDefault();
                const r = await run({ value, path, onChange, runModal });
              }}
              className={`me-1 ${className || ""}`}
            >
              <i className={icon} />
            </a>
          );
        })}
        <a
          href="#"
          onClick={async (e) => {
            e.preventDefault();
            const result = await runModal({
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
              value: {
                tag:
                  options.find(({ value }) => value === currentValue?.tag) ||
                  null,
              },
            });
            if (result) {
              let r = null;
              if (result.tag?.newValue) {
                r = { ...result.tag?.newValue };
                if (currentValue?.tag && r?.tag) {
                  let c = schemaConversions[type?.value] || {};
                  c = c[currentValue?.tag] || {};
                  c = c[r?.tag];
                  if (c) {
                    r.contents = c(currentValue?.contents);
                  }
                }
              }
              onChange(setByPath(value, path, r));
            }
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
              <div key={i}>
                <ADTEditorNodeComponent
                  value={value}
                  onChange={onChange}
                  onSelect={onSelect}
                  path={newPath}
                  schema={schema}
                  schemaConversions={schemaConversions}
                  type={callType(schema, arg)}
                  selectedPath={selectedPath}
                  getActions={getActions}
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
  {
    contents: [],
    value: "Value",
  },
];

const ScrollArea = ({ storageKey, prevStorageKey, children }) => {
  const innerRef = useRef(null);
  const draggable = useDraggable(innerRef);
  const { events } = draggable;
  const [state, setState] = useLocalStorage(storageKey);
  useEffect(() => {
    if (!storageKey) return;
    if (state) {
      innerRef?.current.scrollTo(state[0], state[1]);
    } else {
      console.log("try read prev state", prevStorageKey);
      let prevState = null;
      try {
        prevState = JSON.parse(window.localStorage.getItem(prevStorageKey));
      } catch (e) {
        //
        console.warn(e);
      }
      console.log("got prev state", prevState);
      if (Array.isArray(prevState)) {
        innerRef?.current.scrollTo(prevState[0], prevState[1]);
        //setState(prevState[0], prevState[1]);
      }
    }
  }, [!state, storageKey]);
  return (
    <div className="lc-adt-editor">
      <div
        className="lc-adt-editor-wrapper"
        ref={innerRef}
        {...events}
        onScroll={(e) => {
          if (storageKey) setState([e.target.scrollLeft, e.target.scrollTop]);
        }}
      >
        <div className="lc-adt-editor-inner">{children}</div>
      </div>
    </div>
  );
};

const schemaConversions1 = {
  MatchPattern: {
    MatchObjectFull: { MatchObjectPartial: _.identity },
    MatchObjectPartial: { MatchObjectFull: _.identity },
  },
  MatchResult: {
    MatchObjectFullResult: { MatchObjectPartialResult: _.identity },
    MatchObjectPartialResult: { MatchObjectFullResult: _.identity },
    MatchStringAnyResult: { MatchStringExactResult: _.identity },
    MatchStringExactResult: { MatchStringAnyResult: _.identity },
    MatchNumberAnyResult: { MatchNumberExactResult: _.identity },
    MatchNumberExactResult: { MatchNumberAnyResult: _.identity },
    MatchBoolAnyResult: { MatchBoolExactResult: _.identity },
    MatchBoolExactResult: { MatchBoolAnyResult: _.identity },
  },
};

const ADTEditorGrammarValue = ({
  value,
  onChange,
  error,
  definition,
  context,
  path,
  disabled,
}) => {
  //const [value, onChange] = useState(exampleData.value);
  const [selectedPath, setSelectedPath] = useState([]);
  const processedSchema = [...standardSchema, ...schema];
  const right = onPath(value, onChange, ["right"]);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  return (
    <div className="row align-items-stretch flex-grow-1">
      {/*<button type="button" onClick={e => {e.preventDefault(); setShow();}}>Modal</button>*/}
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1" style={{ height: "70vh" }}>
          <ScrollArea
            storageKey={`scroll-left-${context?.revId}`}
            prevStorageKey={
              context?.prevRevId ? `scroll-left-${context?.prevRevId}` : null
            }
          >
            <ADTEditorNode
              {...onPath(value, onChange, ["left"])}
              onSelect={setSelectedPath}
              path={[]}
              type={callType(processedSchema, definition?.t1)}
              schema={processedSchema}
              schemaConversions={schemaConversions1}
              selectedPath={selectedPath}
              getActions={null}
            />
          </ScrollArea>
        </div>
        <div className="d-grid"></div>
      </div>
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1">
          <ScrollArea
            storageKey={`scroll-right-${context?.revId}`}
            prevStorageKey={
              context?.prevRevId ? `scroll-right-${context?.prevRevId}` : null
            }
          >
            <JSONNode value={right?.value} />
          </ScrollArea>
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
ADTEditorGrammarValue.isEmpty = (_) => false;
Object.assign(formComponents, {
  ADTEditorGrammarValue,
});

const ADTEditorGrammarValueModal = (config) => {
  const { resolve } = config;
  const { t } = useTranslation();
  const [value, onChange1] = useState(config.value);
  const [matchResult, setMatchResult] = useState(config.matchResult);
  const onChange = (v) => {
    setMatchResult(null);
    onChange1(v);
  };
  const [errors, setErrors] = useState(null);
  const context = config?.context || {};
  const onReset1 = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };
  const run = async () => {
    let result = null;
    let resp = null;
    try {
      resp = await axios.post("/haskell-api/matchPattern", {
        pattern: value.val.left,
        value: value.val.right,
      });
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    if (resp.data.error) {
      NotificationManager.error("", resp.data.error);
      return;
    }
    NotificationManager.info("", t("Pattern updated"));
    setMatchResult(resp.data.result);
  };
  const fullReset = () => {
    onChange1(config.value);
    setMatchResult(config.matchResult);
  };
  const handleSubmit = async () => {
    const error = validateDefinition(config?.fields, value);
    setErrors(error);
    if (!definitionIsInvalid(config?.fields, error, value)) {
      // ok
      resolve(matchResult);
      //onReset(path);
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
  return (
    <>
      <Modal.Body>
        <FormComponent
          definition={{ ...config?.fields, layout: void 0 }}
          value={value}
          onChange={onChange}
          error={errors}
          onReset={onReset1}
          path={[]}
          context={{
            ...context,
            forceLabelWidth: "100%",
            labelPlacement: "horizontalPlus",
            handleSubmit,
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" onClick={run}>
          Run
        </Button>
        <Button variant="danger" onClick={fullReset}>
          Reset
        </Button>
        <div className="flex-grow-1" />
        <Button variant="secondary" onClick={() => resolve(null)}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!matchResult}
        >
          Accept
        </Button>
      </Modal.Footer>
    </>
  );
};
const ADTEditorThinValueModal = (config) => {
  const initial = {
    val: JSON.stringify(config.value.right),
  };
  //console.log("INITIAL", initial);
  const { resolve } = config;
  const { t } = useTranslation();
  const [value, onChange1] = useState(initial);
  const [matchResult, setMatchResult] = useState(config.matchResult);
  const onChange = (v) => {
    setMatchResult(null);
    onChange1(v);
  };
  const [errors, setErrors] = useState(null);
  const context = config?.context || {};
  const onReset1 = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };
  const run = async () => {
    let result = null;
    let resp = null;
    let thinValue = null;
    try {
      thinValue = JSON.parse(value.val);
    } catch (e) {
      NotificationManager.warning(e.message, t("JSON parsing error"));
      console.error(e);
      return;
    }
    try {
      resp = await axios.post("/haskell-api/thinPattern", {
        pattern: config.value.left,
        thinValue,
      });
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    if (resp.data.error) {
      NotificationManager.error("", resp.data.error);
      return;
    }
    NotificationManager.info("", t("Pattern updated"));
    setMatchResult(resp.data.result);
  };
  const fullReset = () => {
    onChange1(initial);
    setMatchResult(config.matchResult);
  };
  const handleSubmit = async () => {
    const error = validateDefinition(config?.fields, value);
    setErrors(error);
    if (!definitionIsInvalid(config?.fields, error, value)) {
      // ok
      resolve(matchResult);
      //onReset(path);
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
  return (
    <>
      <Modal.Body>
        <FormComponent
          definition={{ ...config?.fields, layout: void 0 }}
          {...onPath(value, onChange, [])}
          error={errors}
          onReset={onReset1}
          path={[]}
          context={{
            ...context,
            forceLabelWidth: "100%",
            labelPlacement: "horizontalPlus",
            handleSubmit,
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="success" onClick={run}>
          Run
        </Button>
        <Button variant="danger" onClick={fullReset}>
          Reset
        </Button>
        <div className="flex-grow-1" />
        <Button variant="secondary" onClick={() => resolve(null)}>
          Close
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={!matchResult}
        >
          Accept
        </Button>
      </Modal.Footer>
    </>
  );
};
Object.assign(modalComponents, {
  ADTEditorGrammarValueModal,
  ADTEditorThinValueModal,
});

const UI1Editor = ({ revId, prevRevId, value, onChange, saveButton }) => {
  //const [value, onChange] = useState(exampleData.value);
  const [selectedPath, setSelectedPath] = useState([]);
  const processedSchema = [...standardSchema, ...schema];
  const right = onPath(value, onChange, ["right"]);
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const getActions = (theType) => {
    if (theType?.value === "MatchResult") {
      return [
        {
          icon: "fa fa-cog",
          className: "text-success",
          run: async ({ value, onChange, path, runModal }) => {
            console.log("willl work", value);
            const result = getByPath(value, path);
            let resp = null;
            let left = null;
            let right = null;
            try {
              resp = await axios.post("/haskell-api/matchResultToPattern", {
                result,
              });
            } catch (e) {
              NotificationManager.warning("", t("Unknown error"));
              return;
            }
            if (resp.data.error) {
              NotificationManager.error("", resp.data.error);
              return;
            }
            left = resp.data.pattern;
            try {
              resp = await axios.post("/haskell-api/matchResultToValue", {
                result,
              });
            } catch (e) {
              NotificationManager.warning("", t("Unknown error"));
              return;
            }
            if (resp.data.error) {
              NotificationManager.error("", resp.data.error);
              return;
            }
            right = resp.data.value;
            // else, if all ok
            const newMatchPattern = await runModal({
              title: t("Split into Grammar and Value"),
              component: "ADTEditorGrammarValueModal",
              fields: {
                type: "Fields",
                fields: [
                  {
                    type: "ADTEditorGrammarValue",
                    k: "val",
                    label: t("Value"),
                    required: true,
                    t1: {
                      type: "ConT",
                      value: "MatchPattern",
                    },
                  },
                ],
              },
              modalSize: "xl",
              value: {
                val: { left, right },
              },
            });
            if (newMatchPattern) {
              onChange(setByPath(value, path, newMatchPattern));
            }
          },
        },
        {
          icon: "fa fa-cog",
          className: "text-warning",
          run: async ({ value, onChange, path, runModal }) => {
            console.log("willl work", value);
            const result = getByPath(value, path);
            let resp = null;
            let left = null;
            let right = null;
            try {
              resp = await axios.post("/haskell-api/matchResultToPattern", {
                result,
              });
            } catch (e) {
              NotificationManager.warning("", t("Unknown error"));
              return;
            }
            if (resp.data.error) {
              NotificationManager.error("", resp.data.error);
              return;
            }
            left = resp.data.pattern;
            try {
              resp = await axios.post("/haskell-api/matchResultToThinValue", {
                result,
              });
            } catch (e) {
              NotificationManager.warning("", t("Unknown error"));
              return;
            }
            if (resp.data.error) {
              NotificationManager.error("", resp.data.error);
              return;
            }
            right = resp.data.thinValue;
            // else, if all ok
            const newMatchPattern = await runModal({
              title: t("Edit Thin Value"),
              component: "ADTEditorThinValueModal",
              fields: {
                type: "Fields",
                fields: [
                  {
                    type: "TextareaField",
                    k: "val",
                    label: t("Value"),
                    required: true,
                    t1: {
                      type: "ConT",
                      value: "MatchPattern",
                    },
                  },
                ],
              },
              modalSize: "xl",
              value: {
                left,
                right,
              },
            });
            if (newMatchPattern) {
              onChange(setByPath(value, path, newMatchPattern));
            }
          },
        },
      ];
    }
  };
  useEffect(() => {
    (async () => {
      if (!value.left) return;
      let resp = null,
        right = null;
      try {
        resp = await axios.post("/haskell-api/matchResultToValue", {
          result: value.left,
        });
      } catch (e) {
        NotificationManager.warning("", t("Unknown error"));
        return;
      }
      if (resp.data.error) {
        NotificationManager.error("", resp.data.error);
        return;
      }
      right = resp.data.value;
      onChange(update(value, { right: { $set: right } }));
    })();
  }, [value?.left]);
  return (
    <div className="row align-items-stretch flex-grow-1">
      {/*<button type="button" onClick={e => {e.preventDefault(); setShow();}}>Modal</button>*/}
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1">
          <ScrollArea
            storageKey={`scroll-left-${revId}`}
            prevStorageKey={prevRevId ? `scroll-left-${prevRevId}` : null}
          >
            <ADTEditorNode
              {...onPath(value, onChange, ["left"])}
              onSelect={setSelectedPath}
              path={[]}
              type={callType(processedSchema, t1)}
              schema={processedSchema}
              schemaConversions={schemaConversions1}
              selectedPath={selectedPath}
              getActions={getActions}
            />
          </ScrollArea>
        </div>
        <div className="d-grid">{saveButton}</div>
      </div>
      <div className="col d-flex flex-column">
        <div>
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-primary"
              type="button"
              onClick={async () => {
                const result = await runModal({
                  title: t("Insert JSON"),
                  fields: {
                    type: "Fields",
                    fields: [
                      {
                        type: "TextareaField",
                        k: "val",
                        label: t("Value"),
                        required: true,
                      },
                    ],
                  },
                  modalSize: "md",
                  value: {
                    val: "",
                  },
                });
                if (!result) return;
                let resp = null;
                let arg = null;
                try {
                  arg = JSON.parse(result.val);
                } catch (e) {
                  NotificationManager.error("", t("JSON parsing error"));
                }
                try {
                  resp = await axios.post("/haskell-api/valueToExactResult", {
                    value: arg,
                  });
                } catch (e) {
                  NotificationManager.warning("", t("Unknown error"));
                }
                if (resp.data.error) {
                  NotificationManager.error("", resp.data.error);
                } else {
                  NotificationManager.info("", t("Added JSON"));
                  onChange({ left: resp.data.result, right: arg });
                }
              }}
            >
              <i className="fa fa-paste" /> <Trans>Add JSON</Trans>
            </button>
          </div>
        </div>
        <div className="form-control flex-grow-1">
          <ScrollArea
            storageKey={`scroll-right-${revId}`}
            prevStorageKey={prevRevId ? `scroll-right-${prevRevId}` : null}
          >
            <JSONNode value={right?.value} />
          </ScrollArea>
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
  Editor: UI1Editor,
};
