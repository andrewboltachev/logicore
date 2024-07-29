// Global libs
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

// React
import React, { useState, useContext, useRef, useEffect, useCallback } from "react";

// React modules
import { useTranslation, Trans } from "react-i18next";
import { Button, Modal, Dropdown } from "react-bootstrap";
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
  BaseEdge,
  getBezierPath, getMarkerEnd, getSimpleBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Module-local
import "./logicore2.scss";

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

// Stuff

class GraphComponent {
  constructor () {
  }
}

class Node extends GraphComponent {
  constructor () {
    super();

  }
  static component(node) {
    const { data, selected, isConnectable } = node;
    return (
      <div style={{width: 50, height: 50, borderRadius: 50, border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Handle id="arrowTarget" type="target" position={Position.Left} isConnectable={isConnectable} />
        <div>{node.label}</div>
        <Handle id="arrowSource" type="source" position={Position.Right} isConnectable={isConnectable} />
      </div>
    );
  }
}


class SourceType {
  constructor({ state }) {
    this.state = state;
  }
}


class LocalPathSourceType extends SourceType {
  static value = 'local_path';
  static label = 'Local Path';
  static fields = {
    type: 'Fields',
    fields: [
      {
        'k': 'data',
        'type': 'TextField',
        'label': 'Path',
        'required': true,
      }
    ]
  }
}

const sourceTypes = [ LocalPathSourceType ];

class SourceNode extends Node {
  static component(node) {
    const { data, selected, isConnectable } = node;
    return (
      <div style={{width: 50, height: 50, border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <div>{node.label}Src</div>
        <Handle id="arrowSource" type="source" position={Position.Right} isConnectable={isConnectable} />
      </div>
    );
  }

  static editComponent({ value, onChange }) {
    if (!value) return <div />; // TODO
    return <div>
      <h2>Edit source</h2>
      <div>
        <GenericForm
          key={value.id}
          data={value.data.payload}
          onChange={(payload) => onChange({...value, data: {...value.data, payload}, selected: false })}
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
};

class FileNode extends Node {
  static component(node) {
    const { data, selected, isConnectable } = node;
    return (
      <div style={{width: 50, height: 50, borderRadius: 50, background: 'white', border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
        <Handle id="arrowTarget" type="target" position={Position.Left} isConnectable={isConnectable} />
        <div>File</div>
        <Handle id="arrowTarget" type="source" position={Position.Right} isConnectable={isConnectable} />
      </div>
    );
  }

};

class DataNode extends Node {
};

class Edge extends GraphComponent {
  static sourceTypes = new Set();
  static targetTypes = new Set();

  constructor () {
    super();

  }
  static component(props) {
    const displayLabel = (label) => {
      if (typeof label === "string") return label;
      if (typeof label === "number") return label + '';
      if (label === null) return '';
      console.warn(`Uncommon label type: ${typeof label} (${label})`);
      return '';
    }
    const {
      id,
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    } = props;
    const [edgePath, labelX, labelY] = getSimpleBezierPath({
      sourceX,
      sourceY,
      targetX,
      targetY,
      sourcePosition,
      targetPosition,
    });
    const label = displayLabel(props.label) + (props.data?.optional ? '?' : '');
    return (
        <>
          <BaseEdge {...props} id={id} path={edgePath} labelX={labelX} labelY={labelY} label={label} animated={!!props.data?.optional} />
        </>
    );
  }
}

class FileSelectionEdge extends Edge {
  static sourceTypes = new Set(['SourceNode']);
  static targetTypes = new Set(['FileNode']);

  static editComponent({ value, onChange }) {
    if (!value) return <div />; // TODO
    return <div>
      <h2>Select file</h2>
      <div>
        <GenericForm
          key={value.id}
          data={value.data.payload}
          onChange={(payload) => onChange({...value, data: {...value.data, payload}, selected: false })}
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
}

class ManualSelectionEdge extends Edge {

}

class GrammarApplicationEdge extends Edge {

}

class FunctionApplicationEdge extends Edge {

}

const NODE_CLASSES = [SourceNode, FileNode, DataNode];
const EDGE_CLASSES = [FileSelectionEdge, ManualSelectionEdge, GrammarApplicationEdge, FunctionApplicationEdge];


const classes2types = (classes) => {
  const result = {};
  for (const cls of classes) {
    result[cls.name] = cls.component;
  }
  return result;
}

const NODE_TYPES = classes2types(NODE_CLASSES);
const EDGE_TYPES = classes2types(EDGE_CLASSES);

console.log('NODE_TYPES', NODE_TYPES);

const InnerEditor = ({
  revId,
  prevRevId,
  value,
  onChange,
  saveButton,
}) => {
  const { t } = useTranslation();
  const storageKey = `viewport-${revId}`;
  const prevStorageKey = prevRevId ? `viewport-${prevRevId}` : null;
  // TODO: refactor out storageKey stuff
	const nodes = value?.nodes || [];
	const edges = value?.edges || [];

	const setNodes = onPath(value, onChange, ["nodes"]).onChange;
	const setEdges = onPath(value, onChange, ["edges"]).onChange;

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);

  const onConnect = useCallback(async (params) => {
    const sourceNode = nodes.find((n) => n.id === params.source);
    const targetNode = nodes.find((n) => n.id === params.target);

    const options = EDGE_CLASSES.filter(
      (n) => {
        return n.sourceTypes.has(sourceNode.type) && n.targetTypes.has(targetNode.type);
      }
    ).map((n) => ({value: n.name, label: n.name}));
    if (!options.length) {
      NotificationManager.warning('Can\'t connect such nodes');
      return;
    }
    const result = await runModal({
      title: "Add edge",
      fields: {
        type: "Fields",
        fields: [
          {
            type: "SelectField",
            k: "type",
            label: "Type",
            required: true,
            options,
          },
        ],
      },
      modalSize: "md",
      value: {type: null},
    });
    if (result) setEdges(addEdge(update(params, {data: {$auto: {type: {$set: result.type.value}}}}), edges));
  }, [setEdges]);

	const onNodesChange = (changes) => onChange(update(value, {nodes: {$apply: (v) => applyNodeChanges(changes, v)}}));
	const onEdgesChange = (changes) => onChange(update(value, {edges: {$apply: (v) => applyEdgeChanges(changes, v)}}));

  const { runModal } = useContext(ModalContext);

	const doAdd = async () => {
  	const id = "id_" + uuidv4();
    const result = await runModal({
      title: "Add node",
      fields: {
        type: "Fields",
        fields: [
          {
            type: "SelectField",
            k: "type",
            label: "Type",
            required: true,
            options: NODE_CLASSES.map((n) => ({value: n.name, label: n.name})),
          },
        ],
      },
      modalSize: "md",
      value: {type: null},
    });
    if (!result) return;
    const t = result.type.value;
    const newNode = {
      id,
      position: { x: 0, y: 0 },
      data: { subtype: t, label: t, state: { payload: null } },
      type: result.type.value,
    };
    console.log('newNode', newNode);
    setNodes([...nodes, newNode]);
	};

  const [state, setState] = useLocalStorage(storageKey);

  const [initialized, setInitialized] = useState(null);

	const onInit = (instance) => {
    setInitialized(instance);
	};

  useEffect(() => {
    if (!storageKey) return;
    if (!initialized) return;
    //console.log('state', state);
    let v = {x: 0, y: 0, zoom: 1};
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
  }, [!state, storageKey, initialized]);

  const { x, y, zoom } = useViewport();

  useEffect(() => {
    //console.log(x, y, zoom);
    window.localStorage.setItem(storageKey, JSON.stringify({x, y, zoom}));
  }, [x, y, zoom]);

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
  let lastSelectedThingKind = null, lastSelectedObjectCtor = null, lastSelectedObject = null, LastSelectedThingComponent = null;
  if (lastSelectedThing) {
    lastSelectedThingKind = lastSelectedThing.type.toLowerCase() + "s";  // "nodes" or "edges"
    lastSelectedObjectCtor = (lastSelectedThingKind === "nodes" ? NODE_CLASSES : EDGE_CLASSES).find(
      (c) => {
        console.log('compare', c.name, lastSelectedThing.value.type);
        return c.name === lastSelectedThing.value.type;
      }
    );
    if (lastSelectedObjectCtor) {
      lastSelectedObject = new lastSelectedObjectCtor(lastSelectedThing);
      LastSelectedThingComponent = lastSelectedObjectCtor.editComponent;
    }
  }
  let theProps = {};
  if (lastSelectedThing && LastSelectedThingComponent) {
    theProps = {
      ...onPathPlus(value, onChange, [lastSelectedThingKind, {matching: x => x.id === lastSelectedThing.value.id}]),
    };
  }

  console.log('LastSelectedThingComponent', LastSelectedThingComponent, theProps);

  return (
    <div className="row align-items-stretch flex-grow-1">
      <div className="col d-flex flex-column">
        <div className="btn-group">
          {saveButton}
          <button type="button" className="btn btn-success mt-2" onClick={_ => doAdd()}>Add</button>
        </div>
        <ReactFlow
          onInit={onInit}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={NODE_TYPES}
          edgeTypes={EDGE_TYPES}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
    	</div>
      <div className="col d-flex flex-column">
        {LastSelectedThingComponent && (<>
          <LastSelectedThingComponent
            {...theProps}
          />
        </>)}
    	</div>
    </div>
  );
};


const Logicore2Editor = ({
  ...props
}) => {
  return <ReactFlowProvider><InnerEditor {...props} /></ReactFlowProvider>;
}

export default {
  Editor: Logicore2Editor,
};
