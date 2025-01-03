// Global libs
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

// React
import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from "react";

// React modules
import { useTranslation, Trans } from "react-i18next";
import { Button, Modal, Dropdown } from "react-bootstrap";
import { useDraggable } from "react-use-draggable-scroll";
import { NotificationManager } from "../react-notifications";

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
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const eV = (e) => e.target.value || "";


// some things here...
/*const List = (...args) => {};
const $ = {};

const C1 = () => <List items={$}>
  <Dropdown.Menu>
    <List items={$.options}>
      <React.Fragment key={$.type}>
        {/ *!!i && <Dropdown.Divider />* /}
        <List items={$.options}>
          <Dropdown.Item key={$.label} href="#" onClick={void 0}>
            {$.label}
          </Dropdown.Item>
        </List>
      </React.Fragment>
    </List>
  </Dropdown.Menu>
</List>;

window.C1 = C1();*/


  var NODE_TYPES = [];
  var EDGE_TYPES = [];

export default function GraphEditor({ storageKey, prevStorageKey, value, onChange, beforeContent, definition }) {
  // TODO: refactor out storageKey stuff
	const nodes = value?.nodes || [];
	const edges = value?.edges || [];

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
  /*const lastSelectedThing = selectedNodes.length ? {type: "Node", value: selectedNodes[selectedNodes.length - 1]} : (
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
  }*/
  return (<>
    <div className="row align-items-stretch flex-grow-1">
      <div className="col d-flex flex-column">
        <div className="btn-group">
          {beforeContent}
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
        {/*LastSelectedThingComponent && (<>
          {lastSelectedThing.type === "Edge" ? <BackAndForth {...theProps} /> : null}
          <LastSelectedThingComponent
            {...theProps}
          />
        </>)*/}
    	</div>
    </div>
  </>);
}
