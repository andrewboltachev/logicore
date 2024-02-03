// Global libs
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

// React
import React, { useState, useContext, useRef, useEffect, useCallback } from "react";

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
} from 'reactflow';
import 'reactflow/dist/style.css';

// Module-local
import "./logicore1.scss";

const eV = (e) => e.target.value || "";


const NODE_CLASSES = [
  {
    label: 'General',
    options: [
    ],
  },
  {
    label: 'MatchPattern',
    options: [
    ],
  },
];

const editableItems = {
  Node: {
  },
  Edge: {
  },
};

function MatchNode({ data, isConnectable }) {
  const onChange = useCallback((evt) => {
    console.log(evt.target.value);
  }, []);

  return (
    <div style={{width: 50, height: 50, borderRadius: 50, border: "2px solid black", display: 'flex', alignItems: 'center', justifyContent: 'center'}}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} />
      <div>{'[]'}</div>
      <Handle
        type="source"
        position={Position.Bottom}
        id="a"
        isConnectable={isConnectable}
      />
      <Handle type="source" position={Position.Bottom} id="b" isConnectable={isConnectable} />
    </div>
  );
}


function Flow({ storageKey, prevStorageKey, value, onChange, saveButton }) {
  const nodes = value?.nodes || [];
  const edges = value?.edges || [];

  const setNodes = onPath(value, onChange, ["nodes"]).onChange;
  const setEdges = onPath(value, onChange, ["edges"]).onChange;

  const [selectedNodes, setSelectedNodes] = useState([]);
  const [selectedEdges, setSelectedEdges] = useState([]);

  const onConnect = useCallback(async (params) => {
    /*const result = await runModal({
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
    if (result)
    setEdges(addEdge(
      {
        ...update(params, {data: {$auto: {subtype: {$set: result.subtype.value}}}, label: {$set: result.subtype.value}}),
        markerEnd: {
          type: MarkerType.ArrowClosed,
          width: 30,
          height: 120,
          color: '#000000',
        },
        //style: {
        //  strokeWidth: 2,
        //  stroke: '#000000',
        //},
      },
      edges
    ));*/
  }, [setEdges]);

  const onNodesChange = (changes) => onChange(update(value, {nodes: {$apply: (v) => applyNodeChanges(changes, v)}}));
  const onEdgesChange = (changes) => onChange(update(value, {edges: {$apply: (v) => applyEdgeChanges(changes, v)}}));

  const { runModal } = useContext(ModalContext);

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

  /*useOnSelectionChange({
    onChange: ({ nodes, edges }) => {
      setSelectedNodes(nodes);
      setSelectedEdges(edges);
    },
  });*/
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
              {NODE_CLASSES.map(({ label, options }) => (
                <>
                  {options.map(({ k, label, value }) => (
                    <Dropdown.Item key={label} href="#" onClick={(e) => {
                      const id = "id_" + uuidv4();
                      e.preventDefault();
                      setNodes([...nodes, {
                        id,
                        position: { x: 0, y: 0 },
                        data: { subtype: k, label: k },
                        //...v,
                      }]);
                    }}>
                      {n}
                    </Dropdown.Item>
                  ))}
                  <Dropdown.Divider />
                </>
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
      <div className="col-md-5 d-flex flex-column">
        <div className="flex-grow-1">
          hello
          {LastSelectedThingComponent ? (<>
            {lastSelectedThing.type === "Edge" ? <BackAndForth {...theProps} /> : null}
            <LastSelectedThingComponent
              {...theProps}
            />
          </>) : null}
        </div>
        <hr />
        <div className="flex-grow-1">
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

