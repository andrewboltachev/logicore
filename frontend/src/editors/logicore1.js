// Global libs
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

// React
import React, {useState, useContext, useRef, useEffect, useCallback, memo, useMemo} from "react";

// React modules
import { useTranslation, Trans } from "react-i18next";
import {Button, Dropdown, Modal} from "react-bootstrap";
import { useDraggable } from "react-use-draggable-scroll";
import { NotificationManager } from "react-notifications";

// Local React and general modules
import { ModalProvider, ModalContext, modalComponents } from "../runModal";
import { onPath, onPathPlus, ScrollArea } from "./commons";
import { axios } from "../imports";
import { update } from "../logicore-forms/utils";
import { useLocalStorage } from "../utils";
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
  formValidators,
} from "../logicore-forms";

import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  //useNodesState,
  //useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  useViewport,
  ReactFlowProvider,
  Handle, NodeProps, Position,
  useKeyPress,
  useOnSelectionChange,
  useReactFlow,
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
  MarkerType,
  useOnViewportChange,
  getBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Module-local
import "./logicore1.scss";
import d2 from "./d2.json";
import {BezierEdgeProps} from "reactflow";
import { JSONNode, callType } from "./jsonmatcher";

const walk = (value, post=_.identity, pre=_.identity) => {
  const items = pre(value);
  if (Array.isArray(items)) {
    return post(items.map(x => walk(x, post, pre)));
  } else if (items && typeof items === 'object') {
    return post(Object.fromEntries(Object.entries(items).map(([k, v]) => [k, walk(v, post, pre)])));
  } else {
    return post(items);
  }
}

function difference(setA, setB) {
  const _difference = new Set(setA);
  for (const elem of setB) {
    _difference.delete(elem);
  }
  return _difference;
}

const isStrictNumberStr = (s) => {
  return !!/^[1-9][0-9]+$/.exec(s);
}

const refactorAppT = (node) => {
  if (!!node && !Array.isArray(node) && typeof node === 'object') {
    if (node.type === 'AppT') {
      const params = [];
      let target = node;
      const f = (x) => {
        params.unshift(x.param);
        if (x.target.type === 'AppT') {
          f(x.target);
        } else {
          target = x.target;
        }
      };
      f(node);
      return {type: 'AppT1', target, params};
    }
  }
  return node;
}

const eV = (e) => e.target.value || "";

class ContentsStrategy {};
class KeysContentsStrategy extends ContentsStrategy {
  getContents(params) {
    const {node, edges, nodes, overrideMap} = params;
    return Object.fromEntries(edges.filter(({ source }) => source === node.id).map(({ label, target }) => {
      if (overrideMap?.[label]) {
        return [label, overrideMap?.[label]];
      } else {
        const nextNode = nodes.find(({ id }) => id === target);
        if (!nextNode) throw new Error("Next node not found");
        return [label, getNodeFunctionality(nextNode).toGrammar({ ...params, node: nextNode })];
      }
    }));
  }
};
class SeqContentsStrategy extends ContentsStrategy {
  getContents(params) {
    const {node, edges, nodes, overrideMap} = params;
    const result = [], indices = new Set();
    for (const { label, target } of edges.filter(({ source }) => source === node.id)) {
      if (!isStrictNumberStr(label + '')) {
        console.warn(`Isn't strict number string: ${label}`);
        continue;
      }
      const index = +label;
      indices.add(index);
      if (overrideMap?.[index]) {
        result[index] = overrideMap?.[index];
      } else {
        const nextNode = nodes.find(({ id }) => id === target);
        if (!nextNode) throw new Error("Next node not found");
        result[index] = getNodeFunctionality(nextNode).toGrammar({ ...params, node: nextNode });
      }
    }
    const missing = [];
    for (let i = 0; i < result.length; i++) {
      if (!indices.has(i)) missing.push(i);
    }
    if (missing.length) throw new Error(`Missing keys: ${missing.join(', ')}`);
    return result;
  }
};
class SingleContentsStrategy {
  getContents(params) {
    const {node, edges, nodes} = params;
    const { target } = edges.find(({ source }) => source === node.id);
    const nextNode = nodes.find(({ id }) => id === target);
    if (!nextNode) throw new Error("Next node not found");
    return getNodeFunctionality(nextNode).toGrammar({ ...params, node: nextNode });
  }
};

class ExactContentsStrategy {
  getContents({node, edges, nodes}) {
    return node.data.state;
  }
};

class NoneContentsStrategy {
  getContents({node, edges, nodes}) {
    return void 0;
  }
};

class MatchIfThenContentsStrategy {
  getContents(params) {
    const {node, edges, nodes, overrideMap} = params;
    const func = getNodeFunctionality(node);
    const labels = func._getOutputHandleStrategy().labels;
    const result = Object.fromEntries(edges.filter(({ source }) => source === node.id).map(({ label, target }) => {
      if (overrideMap?.[label]) {
        return [label, overrideMap?.[label]];
      } else {
        const nextNode = nodes.find(({ id }) => id === target);
        if (!nextNode) throw new Error("Next node not found");
        return [label, getNodeFunctionality(nextNode).toGrammar({ ...params, node: nextNode })];
      }
    }));
    for (const label of labels) {
      if (!result[label]) {
        throw new Error(`Can't get contents. Key missing: ${label}. Present keys: ${Object.keys(result).join(', ') || '(none)'}`);
      }
    }
    for (const k of Object.keys(result)) {
      if (!_.includes(labels, k)) {
        throw new Error(`Malformed contents. Extra key: ${k}`);
      }
    }
    /*const resultArr = [];
    for (const label of labels) {
      resultArr.push(result[label]);
    }*/
    // TODO Named in common
    return [result.cond, 'foo', result.out];
  }
};

const matchPatternNodeLabelsAndParamNames = {
  'MatchObjectOnly': {
    label: '{o}',
    contentsStrategy: KeysContentsStrategy,
  },
  'MatchRecord': {
    label: '{r}',
    contentsStrategy: SingleContentsStrategy,
  },
  'MatchArray': {
    label: '[*]',
    contentsStrategy: SingleContentsStrategy,
  },
  'MatchArrayContextFree': {
    label: '[…]',
    contentsStrategy: SingleContentsStrategy,
    connectsTo: 'ContextFreeNode',
  },
  'MatchStringExact': {
    label: '"!"',
    defaultValue: "",
    contentsStrategy: ExactContentsStrategy,
  },
  'MatchNumberExact': {
    label: '1!',
    defaultValue: 0,
    contentsStrategy: ExactContentsStrategy,
  },
  'MatchBoolExact': {
    label: 't|f!',
    defaultValue: false,
    contentsStrategy: ExactContentsStrategy,
  },
  'MatchNull': {
    label: 'null',
    contentsStrategy: NoneContentsStrategy,
  },
  'MatchStringAny': {
    label: '""?',
    contentsStrategy: NoneContentsStrategy,
  },
  'MatchNumberAny': {
    label: '1?',
    contentsStrategy: NoneContentsStrategy,
  },
  'MatchBoolAny': {
    label: 't|f?',
    contentsStrategy: NoneContentsStrategy,
  },
  'MatchAny': {
    label: '∀',
    contentsStrategy: NoneContentsStrategy,
  },
  'MatchNone': {
    label: '∅',
    contentsStrategy: NoneContentsStrategy,
  },
  'MatchOr': {
    label: '||',
    contentsStrategy: KeysContentsStrategy,
  },
  'MatchIfThen': {
    label: 'if',
    paramNames: ['cond', 'Error text', 'out'],
    contentsStrategy: MatchIfThenContentsStrategy,
  },
};

const contextFreeGrammarNodeLabelsAndParamNames = {
  'Seq': {
    label: 'Seq',
    contentsStrategy: SeqContentsStrategy,
  },
  'Star': {
    label: 'Star',
    contentsStrategy: SingleContentsStrategy,
  },
  'Plus': {
    label: 'Plus',
    contentsStrategy: SingleContentsStrategy,
  },
  'Optional': {
    label: 'Opt',
    contentsStrategy: SingleContentsStrategy,
  },
  'Or': {
    label: 'Or',
    contentsStrategy: KeysContentsStrategy,
  },
  'Char': {
    label: 'Char',
    contentsStrategy: SingleContentsStrategy,
  },
};

const matchPatternDataConstructors = d2[0].contents;
const matchPatternDataConstructorsRefactored = walk(matchPatternDataConstructors, _.identity, refactorAppT);
const contextFreeGrammarDataConstructors = d2[2].contents;

const cf = d2[0].contents.find(({tag}) => tag === 'MatchArrayContextFree').contents[0];

const contextFreeGrammarDataConstructorsRefactored = walk(callType(d2, cf).contents, _.identity, refactorAppT);

// 0 is MatchPattern
const d2AsMap_matchPattern = Object.fromEntries(matchPatternDataConstructorsRefactored.map(({tag, ...item}) => {
  return [tag, item];
}));


const d2AsMap_contextFreeGrammar = Object.fromEntries(contextFreeGrammarDataConstructorsRefactored.map(({tag, ...item}) => {
  return [tag, item];
}));


const edgesAreConnected = (edges, idFrom, idTo) => {
  let current = idTo;
  while (current) {
    if (current === idFrom) return true;
    const edge = edges.find(({ target }) => target === current);
    current = edge?.source;
  }
  return false;
};


const NODE_CLASSES = [
  {
    type: 'SourceNode',
    options: [
      {
        value: 'Source',
        label: 'Source',
      },
    ],
  },
  {
    type: 'MatchNode',
    options: Object.entries(matchPatternNodeLabelsAndParamNames).map(([value, ctx]) => {
      const typeDef = d2AsMap_matchPattern[value];
      return { value, ...ctx, typeDef };
    }),
  },
  {
    type: 'ContextFreeNode',
    options: Object.entries(contextFreeGrammarNodeLabelsAndParamNames).map(([value, ctx]) => {
      const typeDef = d2AsMap_contextFreeGrammar[value];
      return { value, ...ctx, typeDef };
    }),
  },
];


// ADT for hipsters
class OutputHandleStrategy {
  hasOutputHandle() { return true; }
};

class NoOutput extends OutputHandleStrategy {
  hasOutputHandle() { return false; }

  canHaveOutputEdge (existingEdges) {
    return false;
  }

  async askForNewEdgeLabel (existingEdges) {
    throw new Error("Must not call this");
  }

  suggestedOutputEdgeLabels (contents) {
    return [];
  }

  getForFunnelRequest({node, edgeLabel, result}) {
    throw new Error("Must not call this");
  }
}

class SingleOutput extends OutputHandleStrategy {
  canHaveOutputEdge (existingEdges) {
    return !existingEdges.length;
  }

  async askForNewEdgeLabel (existingEdges) {
    return null;
  }

  suggestedOutputEdgeLabels (contents) {
    return [null];
  }

  getForFunnelRequest({node, edgeLabel, result}) {
    return {"tag": node.data.value, "contents": result};
  }
};

class NamedOutput extends OutputHandleStrategy {
  constructor(labels) {
    super();
    this.labels = labels;
  }

  canHaveOutputEdge (existingEdges) {
    return existingEdges.length < this.labels.length;
  }

  async askForNewEdgeLabel (existingEdges) {
    const result = await window.runModal({
      title: "Add edge",
      fields: {
        type: "Fields",
        fields: [
          {
            type: "SelectField",
            k: "label",
            label: "Key",
            required: true,
            options: this.labels.map((n) => ({value: n, label: n, disabled: _.includes(existingEdges.map(({ label }) => label), n)})),
          },
        ],
      },
      modalSize: "md",
      value: {label: null},
    });
    if (result) {
      return result.label.value;
    }
  }

  suggestedOutputEdgeLabels (contents) {
    return this.labels;
  }

  getForFunnelRequest({node, edgeLabel, result, nodes, edges}) {
    const func = getNodeFunctionality(node);
    return func.toGrammar({node, nodes, edges, });
  }
};

const validateKeyDoesntAlreadyExist = (existingEdges) => ({ label }) => {
  if (_.includes(existingEdges.map(({ label }) => label), label)) {
    return {label: "Edge with this key already exists"};
  }
};

const validateIndexDoesntAlreadyExist = (existingEdges) => ({ label }) => {
  if (_.includes(existingEdges.map(({ label }) => +label), +label)) {
    return {label: "Edge with this index already exists"};
  }
};

class KeysOutput extends OutputHandleStrategy {
  canHaveOutputEdge (existingEdges) {
    return true;
  }

  async askForNewEdgeLabel (existingEdges) {
    const result = await window.runModal({
      title: "Add edge",
      fields: {
        type: "Fields",
        fields: [
          {
            type: "TextField",
            k: "label",
            label: "Key",
            required: true,
          },
        ],
      },
      modalSize: "md",
      value: {label: null},
      validate: validateKeyDoesntAlreadyExist(existingEdges),
    });
    if (result) {
      return result.label;
    }
  }

  suggestedOutputEdgeLabels (contents) {
    return _.keys(contents);
  }

  getForFunnelRequest({node, edgeLabel, result}) {
    // console.log('getForFunnelRequest', node, edgeLabel, result);
    //return [{"tag": node.data.value, "contents": []}, null];
    return {
      "tag": node.data.value,
      "contents": {
        [edgeLabel]: result
      }
    };
  }
};


class SeqOutput extends OutputHandleStrategy {
  canHaveOutputEdge (existingEdges) {
    return true;
  }

  async askForNewEdgeLabel (existingEdges) {
    const result = await window.runModal({
      title: "Add edge",
      fields: {
        type: "Fields",
        fields: [
          {
            type: "NumberField",
            k: "label",
            label: "Key",
            required: true,
          },
        ],
      },
      modalSize: "md",
      value: {label: null},
      validate: validateIndexDoesntAlreadyExist(existingEdges),
    });
    if (result) {
      return result.label;
    }
  }

  suggestedOutputEdgeLabels (contents) {
    return _.keys(contents);
  }

  getForFunnelRequest({node, edgeLabel, result}) {
    // console.log('getForFunnelRequest', node, edgeLabel, result);
    //return [{"tag": node.data.value, "contents": []}, null];
    return {
      "tag": node.data.value,
      "contents": {
        [edgeLabel]: result
      }
    };
  }
};


class NodeFunctionality {
  constructor(node) {
    this.node = node;
    const c = NODE_CLASSES.find(({ type }) => type === node.type);
    this.c = c.options.find(({value}) => value === node.data.value);
  }

  getComponentForEdge () {}
  getComponentForNode () {}
};


class SourceType {
  constructor({ state }) {
    this.state = state;
  }
  async runToFunnel (pattern, params) {}
}

formValidators.isValidJSON = (x) => {
  try {
    JSON.parse(x);
  } catch (e) {
    return e.message;
  }
  return null;
};

class SimpleValueSourceType extends SourceType {
  static value = 'simple_value';
  static label = 'Simple Value';
  static fields = {
    type: 'Fields',
    fields: [
      {
        'k': 'data',
        'type': 'TextareaField',
        'label': 'Data',
        'required': true,
        'validators': [{type: 'isValidJSON'}],
      }
    ]
  }

  async runToFunnel (pattern, params) {
    //const { t } = useTranslation();
    let t = _.identity;
    const search = new URLSearchParams(params).toString();
    let resp, elements = null, suggestions = null;
    try {
      resp = await axios.post(`/haskell-api/matchToFunnel?${search}`, {
        pattern,
        value: JSON.parse(this.state.params.data),
        ...(params || {}),
      });
      if (resp.data.error) {
        NotificationManager.warning("", resp.data.error);
        return;
      } else {
        elements = resp.data.funnel;
      }
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    try {
      resp = await axios.post(`/haskell-api/matchToFunnelSuggestions?${search}`, {
        pattern,
        value: JSON.parse(this.state.params.data),
        ...(params || {}),
      });
      if (resp.data.error) {
        NotificationManager.warning("", resp.data.error);
        return;
      } else {
        suggestions = resp.data.funnelSuggestions;
      }
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    return { elements, suggestions };
  }
}

class LocalJSONFileSourceType extends SourceType {
  static value = 'local_json_file';
  static label = 'Local JSON File';
  static fields = {
    type: 'Fields',
    fields: [
      {
        'k': 'filename',
        'type': 'TextField',
        'label': 'Filename (full)',
        'required': true,
      }
    ]
  }

  async runToFunnel (innerPattern, params) {
    //const { t } = useTranslation();
    let t = _.identity;
    const search = new URLSearchParams(params).toString();
    let resp, elements = null, suggestions = null;
    const pattern = {
      "tag": "MatchGetFromFile",
      "contents": [
        this.state.params.filename,
        innerPattern
      ]
    };
    try {
        resp = await axios.post(`/haskell-api/matchToFunnelOptimized?${search}`, {
        pattern,
        value: null,
        ...(params || {}),
      });
      if (resp.data.error) {
        NotificationManager.warning("", resp.data.error);
        return;
      } else {
        elements = resp.data.funnel;
      }
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    try {
      resp = await axios.post(`/haskell-api/matchToFunnelSuggestions?${search}`, {
        pattern,
        value: null,
        ...(params || {}),
      });
      if (resp.data.error) {
        NotificationManager.warning("", resp.data.error);
        return;
      } else {
        suggestions = resp.data.funnelSuggestions;
      }
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    return { elements, suggestions };
  }
}

const sourceTypes = [ SimpleValueSourceType, LocalJSONFileSourceType ];


const SourceNodeComponent = ({ value, onChange }) => {
  if (!value) return <div />; // TODO
  return <div>
    <h2>Edit source</h2>
    <div>
      <GenericForm
        key={value.id}
        data={value.data.state}
        onChange={(state) => onChange({...value, data: {...value.data, state}, selected: false })}
        fields={{
          type: "Fields",
          fields: [
            {
              type: 'SelectField',
              k: "type",
              label: "Value",
              required: false,
              options: sourceTypes.map(({ value, label }) => ({ value, label })),
            },
            {
              type: 'DefinedField',
              k: "params",
              label: "Value",
              required: false,
              master_field: 'type',
              definitions: Object.fromEntries(sourceTypes.map(({ value, fields }) => ([ value, fields ]))),
            },
          ],
        }}
      />
    </div>
  </div>;
}

class SourceNodeFunctionality extends NodeFunctionality {
  hasOutputHandle () {
    return true;
  }

  canHaveOutputEdge (existingEdges) {
    return !existingEdges.length;
  }

  async askForNewEdgeLabel (existingEdges) {
    return true;
  }

  getComponentForNode () {
    return SourceNodeComponent;
  }
};

const MATCHPATTERN = { 
    "type": "ConT",
    "value": "MatchPattern"
};

const KEYMAP_OF_MATCHPATTERN = {
  type: 'AppT1',
  target: { type: 'ConT', value: 'KeyMap' },
  params: [MATCHPATTERN]
};


const CONTEXTFREEGRAMMAR = {
  type: 'AppT1',
  target: { type: 'ConT', value: 'ContextFreeGrammar' },
  params: [ MATCHPATTERN ]
}

const KEYMAP_OF_CONTEXTFREEGRAMMAR = {
  type: 'AppT1',
  target: { type: 'ConT', value: 'KeyMap' },
  params: [CONTEXTFREEGRAMMAR]
};

const VECTOR_OF_CONTEXTFREEGRAMMAR = {
  type: 'AppT1',
  target: { type: 'ConT', value: 'Vector' },
  params: [CONTEXTFREEGRAMMAR]
};

const KeysEdgeComponent = ({ edges, value, onChange }) => {
  if (!value) return <div />; // TODO
  const siblingEdges = edges.filter(({ source, id }) => source === value.source && id !== value.id);
  return <div>
    <h2>Edit arrow</h2>
    <div>
      <GenericForm
        key={value.id}
        data={{ label: value.label }}
        onChange={({ label }) => onChange({...value, label, selected: false})}
        fields={{
          type: "Fields",
          fields: [
            {
              type: "TextField",
              k: "label",
              label: "Key",
              required: true,
            }
          ],
        }}
        validate={validateKeyDoesntAlreadyExist(siblingEdges)}
      />
    </div>
  </div>;
}

const SeqEdgeComponent = ({ edges, value, onChange }) => {
  if (!value) return <div />; // TODO
  const siblingEdges = edges.filter(({ source, id }) => source === value.source && id !== value.id);
  return <div>
    <h2>Edit arrow</h2>
    <div>
      <GenericForm
        key={value.id}
        data={{ label: value.label }}
        onChange={({ label }) => onChange({...value, label, selected: false})}
        fields={{
          type: "Fields",
          fields: [
            {
              type: "NumberField",
              k: "label",
              label: "Index",
              required: true,
            }
          ],
        }}
        validate={validateIndexDoesntAlreadyExist(siblingEdges)}
      />
    </div>
  </div>;
}

const MatchExactComponent = ({ fieldClass, required }) => ({ edges, value, onChange }) => {
  if (!value) return <div />; // TODO
  const siblingEdges = edges.filter(({ source, id }) => source === value.source && id !== value.id);
  return <div>
    <h2>Edit node</h2>
    <div>
      <GenericForm
        key={value.id}
        data={{ state: value.data.state }}
        onChange={({ state }) => onChange({...value, data: {...value.data, state}, selected: false })}
        fields={{
          type: "Fields",
          fields: [
            {
              type: fieldClass,
              k: "state",
              label: "Value",
              required,
            }
          ],
        }}
      />
    </div>
  </div>;
}

const exactComponents = Object.fromEntries(Object.entries({
  "String": {fieldClass: "TextareaField", required: false},
  "Number": {fieldClass: "NumberField", required: true},
  "Bool": {fieldClass: "BooleanField", required: false},
}).map(([k, v]) => [k, MatchExactComponent(v)]));


const wrapNode = ({node, result, edgeLabel, edges, nodes}) => {
  try {
    const ohs = getNodeFunctionality(node)._getOutputHandleStrategy();
    const r = ohs.getForFunnelRequest({node, edgeLabel, result, edges, nodes});
    return [r, null];
  } catch (e) {
    return [null, e.message];
  }
};


class FunnelMode {
  static tag = "MatchFunnel";
  static FunnelComponent ({ item }) {
    return item + '';
  }
  static params = {};
};

class RegularFunnelMode extends FunnelMode {
  static label = 'Funnel';
  static icon = "fas fa-angle-double-down";
  static FunnelComponent ({ item }) {
    return <div style={{
      position: 'relative',
      fontFamily: '"Monaco", monospace',
      fontSize: "0.75rem",
      lineHeight: "normal",
      whiteSpace: "pre",
    }}>
      <JSONNode value={item} />
    </div>;
  }
};

class KeysFunnelMode extends FunnelMode {
  static tag = "MatchFunnelKeys";
  static label = 'Keys';
  static icon = "fas fa-stream";
};

class PythonFunnelMode extends FunnelMode {
  static label = 'Python';
  static icon = "fab fa-python";
  static params = {'mode': 'Python'};
};


class JSONFunnelMode extends FunnelMode {
  static FunnelComponent ({ item }) {
    return <div style={{
      position: 'relative',
      fontFamily: '"Monaco", monospace',
      fontSize: "0.75rem",
      lineHeight: "normal",
      whiteSpace: "pre",
    }}>
      {JSON.stringify(item, null, 2)}
    </div>;
  }
}

const funnelModes = [ RegularFunnelMode, KeysFunnelMode, PythonFunnelMode ];

class MatchPatternSuggestion {
  async applySimpleSuggestion({tag, contents}, {nodes, edges, setNodes, setEdges, value}) {
    const updatedNode = {...value};
    updatedNode.data.value = tag;
    let state = null;
    if (tag === 'MatchStringExact') state = contents;
    if (tag === 'MatchNumberExact') state = contents;
    if (tag === 'MatchBoolExact') state = contents;
    updatedNode.data.state = state;

    const func = getNodeFunctionality(updatedNode);
    console.log('func', func);

    //const contentsArr = !contents ? [] : Array.isArray(contents) ? contents : [contents];
    const labels = func._getOutputHandleStrategy().suggestedOutputEdgeLabels(contents);
    const yStep = 100;
    let yPos = value.position.y - Math.round(yStep * labels.length / 2);
    setNodes(nds => modifyHelper([{matching: ({ id }) => id === value.id}], nds, _ => updatedNode));
    for (const label of labels) {
      const id = "id_" + uuidv4();
      const newNode = {
        id,
        position: { x: value.position.x + 250, y: yPos },
        type: 'MatchNode',
        data: { value: 'MatchAny', state: "" },
      };
      setNodes(nds => [...nds, newNode]);
      setEdges(eds => addEdge({
        id: `reactflow__edge-${value.id}-${id}`,
        source: value.id,
        //sourceHandle: null,
        target: id,
        //targetHandle: null,
        label,
        markerEnd,
      }, eds));
      yPos += yStep;
    }
    // XXX: here's actually the opposite of defaultValue that's required
    // const { defaultValue } = NODE_CLASSES.find(({ type }) => type === 'MatchNode').options.find(({ value }) => value === tag);
    //console.log('edges are', edges);
  }
}

class SimpleValueSuggestion extends MatchPatternSuggestion {
  async applySuggestion(contents, context) {
    this.applySimpleSuggestion(contents, context);
  }
}

class KeyBreakdownSuggestion extends MatchPatternSuggestion {
  async applySuggestion(keysMap, context) {
    const {nodes, edges, setNodes, setEdges, value} = context;
    const result = await window.runModal({
      title: "Select key",
      fields: {
        type: "Fields",
        fields: [
          {
            type: "SelectField",
            k: "label",
            label: "Key",
            required: true,
            options: Object.keys(keysMap).map((n) => ({value: n, label: n})),
          },
        ],
      },
      modalSize: "md",
      value: {label: null},
    });
    if (result !== null) {
      /*const selected = keysMap[result.label.value];
      const theTag = {
        tag: 'MatchOr',
        contents: Object.fromEntries(
          selected.map((option) => );
        ),
      };
      this.applySimpleSuggestion(theTag, context);*/
    }
  }
}

const matchPatternSuggestions = { SimpleValueSuggestion, KeyBreakdownSuggestion };

const MatchNodeComponent = (props) => {
  const { value, nodes, setNodes, edges, setEdges, funnel, setFunnel } = props;
  const ableToHaveSuggestions = useMemo(() => {
    if (!value) return false;
    if (!funnel?.suggestions?.length) return false;
    //console.log('edges', edges);
    return !edges?.filter(({ source }) => source === value.id).length; // No edges output from this node
  }, [!funnel?.suggestions?.length, edges, value]);
  if (!value) return '';
  const ExactComponent = exactComponents[value?.data.value.replace("Match", "").replace("Exact", "")];
  const funnelClick = async (funnelMode) => {
    console.log('clicked on', value);
    const { tag, params } = funnelMode;
    let result = { tag }, node = nodes.find(({ id }) => id === value.id), edge = null, error = null, source = null;
    console.log('the node found', node, value.id);
    outer: while (true) {
      edge = edges.find(({ target }) => target === node.id);
      if (!edge) {
        error = 'No source connected';
        break;
      }
      node = nodes.find(({ id }) => id === edge.source);
      if (!node) {
        error = 'Impossible error: edge without source node';
        break;
      }
      switch (node.type) {
        case 'SourceNode': {
          source = node;
          break outer;
        };
        case 'MatchNode': {
          [result, error] = wrapNode({ node, result, edgeLabel: edge.label, nodes, edges });
          break;
        };
        case 'ContextFreeNode': {
          [result, error] = wrapNode({ node, result, edgeLabel: edge.label, nodes, edges });
          break;
        };
        default: {
          error = `Unknown node type found: ${node.type}`;
          break outer;
        }
      }
    }
    if (error) {
      NotificationManager.error("", error, 5000);
      return;
    }
    const SourceType = sourceTypes.find(({ value }) => value === source.data.state.type.value);
    const sourceType = new SourceType(source.data);
    const data = await sourceType.runToFunnel(result, params);
    setFunnel(data ? {funnelMode, ...data} : null);
  };
  const applySuggestion = async ({ tag, contents }) => {
    const mps = new matchPatternSuggestions[tag];
    await mps.applySuggestion(contents, {nodes, edges, setNodes, setEdges, value});
  }
  return <div style={{top: 0, right: 0, bottom: 0, left: 0, position: "absolute", gridTemplateRows: "auto 1fr auto"}} className="d-grid">
    <div className="text-muted text-bold">{value?.data.value}</div>
    <div className="flex-1">
      {ExactComponent && <ExactComponent {...props} />}
    </div>
    <div className="d-flex">
      <div className="btn-group">
        {funnelModes.map((funnelMode) => {
          const { icon, key, label } = funnelMode;
          return (
            <button type="button" className="btn btn-primary" onClick={() => funnelClick(funnelMode)}>
              <i className={icon} />{" "}{label}
            </button>
          );
        })}
        <button type="button" className="btn btn-secondary" onClick={() => setFunnel({funnelMode: JSONFunnelMode, elements: [getNodeFunctionality(value).toGrammar({node: value, nodes, edges})]})}>
          <i className="fas fa-microchip" />{" "}Code
        </button>
      </div>
      <div style={{lineHeight: "36px", marginLeft: "12px"}}>{funnel && `${funnel.elements.length} element(s)`}</div>
      {!!funnel?.suggestions?.length && 
        <div className="btn-group" style={{marginLeft: "12px"}}>
          {funnel.suggestions.map(({ k, v }) => {
            return (
              <button type="button" className="btn btn-warning" onClick={async () => await applySuggestion(v)}>
                {k}
              </button>
            );
          })}
        </div>}
    </div>
  </div>;
};


class MatchNodeFunctionality extends NodeFunctionality {
  hasOutputHandle () {
    return this._getOutputHandleStrategy().hasOutputHandle();
  }

  canHaveOutputEdge (existingEdges) {
    return this._getOutputHandleStrategy().canHaveOutputEdge(existingEdges);
  }

  askForNewEdgeLabel (existingEdges) {
    return this._getOutputHandleStrategy().askForNewEdgeLabel(existingEdges);
  }

  _getOutputHandleStrategy () {
    if (this.c.typeDef.contents.length === 0) {
      return new NoOutput();
    } else if (this.c.typeDef.contents.length === 1) {
      const item = this.c.typeDef.contents[0];
      if (_.isEqual(item, KEYMAP_OF_MATCHPATTERN) || _.isEqual(item, KEYMAP_OF_CONTEXTFREEGRAMMAR)) {
        return new KeysOutput();
      } else if (_.isEqual(item, MATCHPATTERN) || _.isEqual(item, CONTEXTFREEGRAMMAR)) {
        return new SingleOutput();
      }
      // TODO (1) matchPattern on client (2) Resolve types (w/o vars) or (3) type inference?
      if (_.isEqual(item, VECTOR_OF_CONTEXTFREEGRAMMAR)) {
        return new SeqOutput();
      }
      console.warn('Cannot properly define output handle strategy for type', item);
      return new NoOutput();
    } else {
      const result = [];
      for (const [item, name] of _.zip(this.c.typeDef.contents, this.c.paramNames)) {
        if (_.isEqual(item, MATCHPATTERN) || _.isEqual(item, CONTEXTFREEGRAMMAR)) {
          result.push(name);
        } else if (item.type === 'AppT1' && !item.params.length && (_.isEqual(item.target, MATCHPATTERN) || _.isEqual(item.target, CONTEXTFREEGRAMMAR))) {
          result.push(name);
        }
      }
      return new NamedOutput(result);
    }
  }

  getComponentForEdge (arg) {
    if (this._getOutputHandleStrategy() instanceof KeysOutput) {
      return KeysEdgeComponent;
    }
    if (this._getOutputHandleStrategy() instanceof SeqOutput) {
      return SeqEdgeComponent;
    }
  }

  getComponentForNode () {
    return MatchNodeComponent;
  }

  toGrammar ({ node, nodes, edges, overrideMap }) {
    const st = new this.c.contentsStrategy(); // to call instance methods
    return {"tag": node.data.value, contents: st.getContents({ node, nodes, edges, overrideMap })};
  }
};

class ContextFreeNodeFunctionality extends MatchNodeFunctionality {}


const nodeFunctionalityClasses = {
  SourceNodeFunctionality,
  MatchNodeFunctionality,
  ContextFreeNodeFunctionality,
};

const getNodeFunctionality = (node) => {
  const cls = nodeFunctionalityClasses[`${node.type}Functionality`];
  return new cls(node);
};


function SourceNode({ data, selected, isConnectable }) {
  return (
    <div style={{width: 50, height: 50, border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      {/*<Handle type="target" position={Position.Left} isConnectable={isConnectable} />*/}
      <div>{'Src'}</div>
      <Handle type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}

function MatchNode(node) {
  const { data, selected, isConnectable } = node;
  const n = getNodeFunctionality(node);

  if (new Set(['MatchStringExact', 'MatchNumberExact', 'MatchBoolExact']).has(node.data.value)) {
    return (
      <div style={{minWidth: 50, maxWidth: 200, padding: "0 10px", width: 'auto', height: 50, borderRadius: 50, border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
        {node.data.value === 'MatchStringExact' && <code className="text-truncate">{node.data.state}</code>}
        {node.data.value === 'MatchNumberExact' && <code className="text-truncate" style={{color: 'blue'}}>{node.data.state}</code>}
        {node.data.value === 'MatchBoolExact' && <code style={{color: 'blue'}}>{node.data.state ? 'true' : 'false'}</code>}
      </div>
    );
  } else {
    return (
      <div style={{width: 50, height: 50, borderRadius: 50, border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
        <div>{n.c.label}</div>
        {!!n.hasOutputHandle() && <Handle type="source" position={Position.Right} isConnectable={isConnectable} />}
      </div>
    );
  }
}

function ContextFreeNode(node) {
  const { data, selected, isConnectable } = node;
  const n = getNodeFunctionality(node);

  return (
    <div style={{width: 50, height: 50, borderRadius: 50, border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <div>{n.c.label}</div>
      {!!n.hasOutputHandle() && <Handle type="source" position={Position.Right} isConnectable={isConnectable} />}
    </div>
  );
}

const nodeTypes = { SourceNode, MatchNode, ContextFreeNode };


/*const ArrowEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  //markerEnd,
}) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });
  return (<>
      <BaseEdge path={edgePath} markerEnd={markerEnd} />
      <EdgeLabelRenderer>foo</EdgeLabelRenderer>
  </>);
};*/
const identity = x => x;
/*const ArrowEdge = identity(
  ({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition = Position.Bottom,
    targetPosition = Position.Top,
    label,
    labelStyle,
    labelShowBg,
    labelBgStyle,
    labelBgPadding,
    labelBgBorderRadius,
    style,
    markerEnd,
    markerStart,
    pathOptions,
    interactionWidth,
    rfId,
  }: BezierEdgeProps) => {
    const [path, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
      curvature: pathOptions?.curvature,
    });
    console.log('markerEnd', markerEnd);
    return (
      <BaseEdge
        id={id}
        path={path}
        labelX={labelX}
        labelY={labelY}
        label={label}
        labelStyle={labelStyle}
        labelShowBg={labelShowBg}
        labelBgStyle={labelBgStyle}
        labelBgPadding={labelBgPadding}
        labelBgBorderRadius={labelBgBorderRadius}
        style={style}
        markerEnd={markerEnd}
        markerStart={markerStart}
        interactionWidth={interactionWidth}
      />
    );
  }
);


const edgeTypes = { ArrowEdge };*/

const markerEnd = {
  type: MarkerType.ArrowClosed,
  width: 30,
  height: 120,
  color: '#000000',
};

function Flow({ storageKey, prevStorageKey, value, onChange, saveButton }) {
  const { t } = useTranslation();

  const nodes = value?.nodes || [];
  const edges = value?.edges || [];

  const setNodes = onPathPlus(value, onChange, ["nodes"]).onChange;
  const setEdges = onPathPlus(value, onChange, ["edges"]).onChange;

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);

  const onConnect = useCallback(async (params) => {
    const sourceNode = nodes.find(n => n.id === params.source);
    const targetNode = nodes.find(n => n.id === params.target);
    const outcomingEdges = edges.filter(({ source }) => source === params.source);
    if (edgesAreConnected(edges, params.target, params.source)) {
      NotificationManager.warning("", t("Cannot create cycle"), 2000);
      return;
    }
    if (outcomingEdges.filter(({ target }) => target === params.target).length) {
      NotificationManager.warning("", t('Cannot create edge with the same source and target (that\'s thin category after all)'), 2000);
      return;
    }
    const sourceNodeFunctionality = getNodeFunctionality(sourceNode);
    if (!sourceNodeFunctionality.canHaveOutputEdge(outcomingEdges)) {
      NotificationManager.warning("", t('Cannot have output edge'), 2000);
      return;
    }
    const label = await sourceNodeFunctionality.askForNewEdgeLabel(outcomingEdges);
    if (label === void 0) { // undefined doesn't pass, null passes
      NotificationManager.warning("", t('No label provided'), 2000);
      return;
    }
    setEdges(addEdge(
      {
        ...params,
        label,
        markerEnd,
      },
      edges
    ));
  }, [setEdges]);

  const onNodesChange = (changes) => onChange(update(value, {nodes: {$apply: (v) => applyNodeChanges(changes, v)}}));
  const onEdgesChange = (changes) => onChange(update(value, {edges: {$apply: (v) => applyEdgeChanges(changes, v)}}));

  const { runModal } = useContext(ModalContext);
  window.runModal = runModal;

  const [initialized, setInitialized] = useState(null);

  const onInit = (instance) => {
    setInitialized(instance);
  };

  const [funnel, setFunnel] = useState(null);

  useEffect(() => {
    if (!storageKey) return;
    if (!initialized) return;
    let v = {x: 0, y: 0, zoom: 1};
    const state = JSON.parse(window.localStorage.getItem(storageKey))
    console.log('state from storageKey', state);
    if (state) {
      if (state) {
        v = state;
      }
    } else {
      //console.log("try read prev state", prevStorageKey);
      let prevState = null;
      try {
        prevState = JSON.parse(window.localStorage.getItem(prevStorageKey));
      } catch (e) {
        console.warn(e);
      }
      //console.log("got prev state", prevState);
      if (prevState) {
        v = prevState;
        //window.localStorage.setItem(storageKey, JSON.stringify(v));
      }
    }
    if (v) initialized.setViewport(v);
  }, [storageKey, initialized]);

  useOnViewportChange({
    onChange: ({x, y, zoom}: Viewport) => window.localStorage.setItem(storageKey, JSON.stringify({x, y, zoom}))
  });


  const deletePressed = useKeyPress('Delete');

  useEffect(() => {
    if (!deletePressed) return;
    const newNodes = nodes.filter((o) => !_.includes(selectedNodes.map(({id}) => id), o.id));
    const newNodesIds = newNodes.map(({id}) => id);
    setNodes(newNodes);
    setEdges(
      edges
      .filter((o) => !_.includes(selectedEdges.map(({id}) => id), o.id))
      .filter((o) => _.includes(newNodesIds, o.source))
      .filter((o) => _.includes(newNodesIds, o.target))
    );
  }, [deletePressed, nodes, edges])

  useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodes(nodes);
      setSelectedEdges(edges);
    },
  });
  const lastSelectedThing = selectedNodes.length ? {type: "Node", value: selectedNodes[selectedNodes.length - 1]} : (
    selectedEdges.length ? {type: "Edge", value: selectedEdges[selectedEdges.length - 1]} : null
  );
  const { LastSelectedThingComponent, lastSelectedComponentProps } = useMemo(
    () => {
      if (!lastSelectedThing) return {};
      let LastSelectedThingComponent = null, pathBase = null;
      if (lastSelectedThing) {
        if (lastSelectedThing.type === 'Edge') {
          const fnc = getNodeFunctionality(nodes.find(({ id }) => id === lastSelectedThing.value.source));
          LastSelectedThingComponent = fnc.getComponentForEdge(lastSelectedThing.value);
          pathBase = "edges";
        }
        if (lastSelectedThing.type === 'Node') {
          const fnc = getNodeFunctionality(lastSelectedThing.value);
          LastSelectedThingComponent = fnc.getComponentForNode();
          pathBase = "nodes";
        }
        return {
          LastSelectedThingComponent,
          lastSelectedComponentProps: {
            nodes,
            setNodes,
            edges,
            setEdges,
            funnel,
            setFunnel,
            ...onPathPlus(value, onChange, [pathBase, {matching: ({id}) => id === lastSelectedThing.value.id}]),
          }
        };
      }
    }, [lastSelectedThing?.value.id, value, onChange, edges, nodes, funnel, setFunnel]
  );
  useEffect(() => {
    // when changed
    setFunnel(null);
  }, [lastSelectedThing?.value?.id]);
  const viewport = useViewport();
  const ref = useRef();
  return (<>
    <div className="row align-items-stretch flex-grow-1">
      <div className="col-md-7 d-flex flex-column">
        <div className="btn-group">
          {/*<div>x: {viewport.x}, y: {viewport.y}, zoom: {viewport.zoom}</div>*/}
          {saveButton}
          <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic" className={"mt-2"}>
              Add
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {NODE_CLASSES.map(({ options, type, ...parentItem }, i) => (
                <React.Fragment key={type}>
                  {!!i && <Dropdown.Divider />}
                  {options.map(({ label, value, defaultValue, ...item }) => {
                    let position = {x: 0, y: 0};
                    if (ref.current && viewport) {
                      const { width, height } = ref.current.getBoundingClientRect();
                      position = {
                        x: (width / 2 - viewport.x) / viewport.zoom,
                        y: (height / 2 - viewport.y) / viewport.zoom,
                      }
                    }
                    return (
                      <Dropdown.Item key={label} href="#" onClick={(e) => {
                        e.preventDefault();
                        const id = "id_" + uuidv4();
                        setNodes([...nodes, {
                          id,
                          position,
                          type,
                          data: { value, state: defaultValue },
                        }]);
                      }}>
                        {label}
                      </Dropdown.Item>
                    );
                  })}
                </React.Fragment>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <ReactFlow
          ref={ref}
          onInit={onInit}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
      <div className="col-md-5 d-grid" style={{gridTemplateRows: "1fr auto 1fr"}}>
        <div style={{position: "relative"}}>
          {LastSelectedThingComponent && <LastSelectedThingComponent {...lastSelectedComponentProps} />}
        </div>
        <hr />
        <div style={{position: 'relative'}}>
          <div style={{position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, overflow: 'auto'}}>
            {funnel?.elements.map((item, i) => <React.Fragment key={i}>
              {!!i && <hr />}
              <div>
                <funnel.funnelMode.FunnelComponent item={item} />
              </div>
            </React.Fragment>)}
          </div>
        </div>
      </div>
    </div>
  </>);
}

const Logicore1Editor = ({
  revId,
  prevRevId,
  value,
  onChange,
  saveButton,
}) => {
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  /*const step1 = async () => {
    let result = null;
    let resp = null;
    try {
      resp = await axios.post("/python-api/step1", {
        grammar: value.grammar,
        code: value.code,
      });
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    if (resp.data.error) {
      NotificationManager.error("", resp.data.error, 50000);
      return;
    }
    NotificationManager.info("", t("Thin value generated"));
    onChange(
      update(value, {
        thinValue: { $set: JSON.stringify(resp.data.thinValue) },
      })
    );
  };*/
  return (
    <ReactFlowProvider>
      <Flow
        storageKey={`viewport-${revId}`}
        prevStorageKey={
          prevRevId ? `viewport-${prevRevId}` : null
        }
        {...{value, onChange, saveButton}}
      />
    </ReactFlowProvider>
  );
};

export default {
  Editor: Logicore1Editor,
};

