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

const nodeLabelsAndParamNames = {
  'MatchObjectOnly': {
    label: '{o}',
  },
  'MatchArray': {
    label: '[*]',
  },
  'MatchStringExact': {
    label: '"!"',
  },
  'MatchNumberExact': {
    label: '1!',
  },
  'MatchBoolExact': {
    label: 't|f!',
  },
  'MatchNull': {
    label: 'null',
  },
  'MatchStringAny': {
    label: '""?',
  },
  'MatchNumberAny': {
    label: '1?',
  },
  'MatchBoolAny': {
    label: 't|f?',
  },
  'MatchAny': {
    label: '∀',
  },
  'MatchNone': {
    label: '∅',
  },
  'MatchOr': {
    label: '||',
  },
  'MatchIfThen': {
    label: 'if',
    paramNames: ['cond', 'Error text', 'out'],
  },
};

const matchPatternDataConstructors = d2[0].contents;
const matchPatternDataConstructorsRefactored = walk(matchPatternDataConstructors, _.identity, refactorAppT);

// 0 is MatchPattern
const d2AsMap = Object.fromEntries(matchPatternDataConstructorsRefactored.map(({tag, ...item}) => {
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
    options: Object.entries(nodeLabelsAndParamNames).map(([value, ctx]) => {
      const typeDef = d2AsMap[value];
      return { value, ...ctx, typeDef };
    }),
  },
];


// ADT for hipsters
class OutputHandleStrategy {};

class SingleOutput extends OutputHandleStrategy {
  canHaveOutputEdge (existingEdges) {
    return !existingEdges.length;
  }

  async askForNewEdgeLabel (existingEdges) {
    return null;
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
            k: "name",
            label: "Key",
            required: true,
            options: this.labels.map((n) => ({value: n, label: n, disabled: _.includes(existingEdges.map(({ label }) => label), n)})),
          },
        ],
      },
      modalSize: "md",
      value: {name: null},
    });
    if (result) {
      return result.name.value;
    }
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
            k: "name",
            label: "Key",
            required: true,
          },
        ],
      },
      modalSize: "md",
      value: {name: null},
      validate: ({ name }) => {
        if (_.includes(existingEdges.map(({ label }) => label), name)) {
          return {name: "Edge with this key already exists"};
        }
      },
    });
    if (result) {
      return result.name;
    }
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

const SourceNodeComponent = ({ nodes, edges, setNodes, setEdges, selected }) => {
}

class SourceNodeFunctionality extends NodeFunctionality {
  hasOutputHandle () {
    return true;
  }

  canHaveOutputEdge (existingEdges) {
    console.log('canHaveOutputEdge checks', existingEdges);
    return !existingEdges.length;
  }

  async askForNewEdgeLabel (existingEdges) {
    const result = await window.runModal({
      title: "Add edge",
      fields: {
        type: "Fields",
        fields: [
          {
            type: "SelectField",
            k: "name",
            label: "Type",
            required: true,
            options: this.labels.map((n) => ({value: n, label: n, disabled: _.includes(existingEdges.map(({ label }) => label), n)})),
          },
        ],
      },
      modalSize: "md",
      value: {name: null},
    });
    if (result) {
      return result.label;
    }
  }
  getComponentForNode () {
    //return SourceNodeComponent;
  }
};

const MATCHPATTERN = { 
    "type": "ConT",
    "value": "MatchPattern"
};

const KEYMAP_OF_MATCHPATTERN = {
  type: 'AppT1',
  target: { type: 'ConT', value: 'KeyMap' },
  params: [ { type: 'ConT', value: 'MatchPattern' } ]
};

const KeysEdgeComponent = ({ value, onChange }) => {
  return <div>
    <h2>Edit arrow</h2>
    <h2>Edit arrow</h2>
    <h2>Edit arrow</h2>
    <h2>Edit arrow</h2>
    <h2>Edit arrow</h2>
    <div>
    </div>
  </div>;
}


class MatchNodeFunctionality extends NodeFunctionality {
  hasOutputHandle () {
    return !!this._getOutputHandleStrategy();
  }

  canHaveOutputEdge (existingEdges) {
    return this._getOutputHandleStrategy().canHaveOutputEdge(existingEdges);
  }

  askForNewEdgeLabel (existingEdges) {
    return this._getOutputHandleStrategy().askForNewEdgeLabel(existingEdges);
  }

  _getOutputHandleStrategy () {
    if (this.c.typeDef.contents.length === 0) {
      return null;
    } else if (this.c.typeDef.contents.length === 1) {
      if (_.isEqual(this.c.typeDef.contents[0], KEYMAP_OF_MATCHPATTERN)) {
        return new KeysOutput();
      } else if (_.isEqual(this.c.typeDef.contents[0], MATCHPATTERN)) {
        return new SingleOutput();
      }
      //console.warn('Cannot define output handle strategy for type', this.c.typeDef.contents[0]);
      return null;
    } else {
      const result = [];
      for (const [item, name] of _.zip(this.c.typeDef.contents, this.c.paramNames)) {
        if (_.isEqual(item, MATCHPATTERN)) {
          result.push(name);
        } else if (item.type === 'AppT1' && !item.params.length && _.isEqual(item.target, MATCHPATTERN)) {
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
  }
};


const nodeFunctionalityClasses = {
  SourceNodeFunctionality,
  MatchNodeFunctionality,
};

const getNodeFunctionality = (node) => {
  const cls = nodeFunctionalityClasses[`${node.type}Functionality`];
  return new cls(node);
};


function SourceNode({ data, selected, isConnectable }) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

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
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);
  const n = getNodeFunctionality(node);

  return (
    <div style={{width: 50, height: 50, borderRadius: 50, border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Handle type="target" position={Position.Left} isConnectable={isConnectable} />
      <div>{n.c.label}</div>
      {!!n.hasOutputHandle() && <Handle type="source" position={Position.Right} isConnectable={isConnectable} />}
    </div>
  );
}

const nodeTypes = { SourceNode, MatchNode };


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

  const setNodes = onPath(value, onChange, ["nodes"]).onChange;
  const setEdges = onPath(value, onChange, ["edges"]).onChange;

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
      NotificationManager.warning("", t('Cannot create with the same source and target (that\'s thin category after all)'), 2000);
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
    setNodes(nodes.filter((o) => !_.includes(selectedNodes.map(({id}) => id), o.id)));
    setEdges(edges.filter((o) => !_.includes(selectedEdges.map(({id}) => id), o.id)));
  }, [deletePressed])

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
        console.log('the value', value);
        return {
          LastSelectedThingComponent,
          lastSelectedComponentProps: {
            nodes,
            edges,
            ...onPathPlus(value, onChange, [pathBase, {matching: ({id}) => id === lastSelectedThing.value.id}]),
          }
        };
      }
    }, [lastSelectedThing?.value.id, value, onChange]
  );
  return (<>
    <div className="row align-items-stretch flex-grow-1">
      <div className="col-md-7 d-flex flex-column">
        <div className="btn-group">
          {saveButton}
          <Dropdown>
            <Dropdown.Toggle variant="success" id="dropdown-basic">
              Add
            </Dropdown.Toggle>
            <Dropdown.Menu>
              {NODE_CLASSES.map(({ options, type, ...parentItem }) => (
                <React.Fragment key={type}>
                  {options.map(({ label, value, ...item }) => {
                    return (
                      <Dropdown.Item key={label} href="#" onClick={(e) => {
                        e.preventDefault();
                        const id = "id_" + uuidv4();
                        console.log('type', type);
                        setNodes([...nodes, {
                          id,
                          position: { x: 0, y: 0 },
                          type,
                          data: { value },
                        }]);
                      }}>
                        {label}
                      </Dropdown.Item>
                    );
                  })}
                  <Dropdown.Divider />
                </React.Fragment>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <ReactFlow
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
        <div>
          {LastSelectedThingComponent && <LastSelectedThingComponent {...lastSelectedComponentProps} />}
        </div>
        <hr />
        <div>
          world
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

