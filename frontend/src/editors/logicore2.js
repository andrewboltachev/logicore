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

const BaseNodeComponent = (node) => {
  const { data, selected, isConnectable } = node;
  return (
    <div style={{width: 50, height: 50, borderRadius: 50, border: `2px solid ${selected ? 'red' : 'black'}`, display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Handle id="arrowTarget" type="target" position={Position.Left} isConnectable={isConnectable} />
      <div>{node.label}</div>
      <Handle id="arrowSource" type="source" position={Position.Right} isConnectable={isConnectable} />
    </div>
  );
}

const BaseEdgeComponent = undefined;

const SourceNodeComponent = ({}) => {

};

const FileNodeComponent = ({}) => {

};

const DataNodeComponent = ({}) => {

};

class Node {
  constructor () {

  }
}

class SourceNode extends Node {
  static component = SourceNodeComponent;
};

class FileNode extends Node {
  static component = FileNodeComponent;
};

class DataNode extends Node {
  static component = DataNodeComponent;
};

class Edge {
  constructor () {

  }
}

class FileSelectionEdge extends Edge {

}

class ManualSelectionEdge extends Edge {

}

class GrammarApplicationEdge extends Edge {

}

class FunctionApplicationEdge extends Edge {

}

const NODE_CLASSES = [SourceNode, FileNode, DataNode];
const EDGE_CLASSES = [FileSelectionEdge, ManualSelectionEdge, GrammarApplicationEdge, FunctionApplicationEdge];


const classes2types = (classes, baseComponent) => {
  const result = {};
  for (const cls of classes) {
    result[cls.name] = cls.component || baseComponent;
  }
  return result;
}

const NODE_TYPES = classes2types(NODE_CLASSES, BaseNodeComponent);
const EDGE_TYPES = classes2types(EDGE_CLASSES, BaseEdgeComponent);

const Logicore2Editor = ({
  revId,
  prevRevId,
  value,
  onChange,
  saveButton,
}) => {
  /*const { t } = useTranslation();
  const storageKey = `viewport-${revId}`;
  const prevStorageKey = prevRevId ? `viewport-${prevRevId}` : null;
  // TODO: refactor out storageKey stuff
	const nodes = value?.nodes || [];
	const edges = value?.edges || [];

  const editableItems = {};  // TODO

	const setNodes = onPath(value, onChange, ["nodes"]).onChange;
	const setEdges = onPath(value, onChange, ["edges"]).onChange;

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);

  const onConnect = useCallback(async (params) => {
    const result = await runModal({
      title: "Add edge",
      fields: {
        type: "Fields",
        fields: [
          {
            type: "SelectField",
            k: "subtype",
            label: "Type",
            required: true,
            options: EDGE_TYPES.map((n) => ({value: n, label: n})),
          },
        ],
      },
      modalSize: "md",
      value: {subtype: null},
    });
    if (result) setEdges(addEdge(update(params, {data: {$auto: {subtype: {$set: result.subtype.value}}}, label: {$set: result.subtype.value}}), edges));
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
            options: NODE_TYPES.map((n) => ({value: n, label: n})),
          },
        ],
      },
      modalSize: "md",
      value: {type: null},
    });
    if (!result) return;
    const t = result.type.value;
    setNodes([...nodes, {
      id,
      position: { x: 0, y: 0 },
      data: { subtype: t, label: t }
    }]);
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
  let LastSelectedThingComponent = null;
  const sourceAndTarget = {};
  if (lastSelectedThing) {
    LastSelectedThingComponent = (editableItems?.[lastSelectedThing?.type] || {})[lastSelectedThing?.value?.data?.subtype];
    if (lastSelectedThing.type === "Edge") {
      for (const k of ["source", "target"]) {
        sourceAndTarget[k] = onPathPlus(
          value,
          onChange,
          ["nodes", {matching: x => {
            return x.id === lastSelectedThing.value[k];
          }}, "data", "payload"]
        );
      }
    }
  }
  let theProps = {};
  if (lastSelectedThing) {
    theProps = {
      subtype: lastSelectedThing?.value?.data?.subtype,
      ...onPathPlus(value, onChange, [lastSelectedThing.type.toLowerCase() + "s", {matching: x => x.id === lastSelectedThing.value.id}, "data", "payload"]),
      ...sourceAndTarget
    };
  }

  return null;
  /*return (
	  <ReactFlowProvider>
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
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
    	</div>
      <div className="col d-flex flex-column">
        {LastSelectedThingComponent && (<>
          {lastSelectedThing.type === "Edge" ? <BackAndForth {...theProps} /> : null}
          <LastSelectedThingComponent
            {...theProps}
          />
        </>)}
    	</div>
    </div>
	  </ReactFlowProvider>
  );*/
};

export default {
  Editor: Logicore2Editor,
};
