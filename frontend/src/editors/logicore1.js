// Global libs
import _ from "lodash";
import { v4 as uuidv4 } from "uuid";

// React
import React, { useState, useContext, useRef, useEffect, useCallback } from "react";

// React modules
import { useTranslation, Trans } from "react-i18next";
import { Button, Modal } from "react-bootstrap";
import { useDraggable } from "react-use-draggable-scroll";
import { NotificationManager } from "react-notifications";

// Local React and general modules
import { ModalProvider, ModalContext, modalComponents } from "../runModal";
import { onPath, ScrollArea } from "./commons";
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
	useOnViewportChange,
	ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';

// Module-local
import "./logicore1.scss";

const eV = (e) => e.target.value || "";

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

function Flow({ value, onChange }) {
  /*const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);*/

	const nodes = value?.nodes || [];
	const edges = value?.edges || [];

	const setNodes = onPath(value, onChange, ["nodes"]).onChange;
	const setEdges = onPath(value, onChange, ["edges"]).onChange;

  const onConnect = useCallback((params) => setEdges(addEdge(params, edges)), [setEdges]);

	const onNodesChange = (changes) => onChange(update(value, {nodes: {$apply: (v) => applyNodeChanges(changes, v)}}));
	const onEdgesChange = (changes) => onChange(update(value, {edges: {$apply: (v) => applyEdgeChanges(changes, v)}}));

	const doAdd = () => {
  	const id = "id_" + uuidv4();
  	setNodes([...nodes, { id, position: { x: 0, y: 0 }, data: { label: '1' } }]);
	};

	const onInit = (instance) => {
		instance.setViewport(value?.viewport || {x: 0, y: 0, zoom: 1});
	};

  useOnViewportChange({
	  //onStart: useCallback((viewport: Viewport) => console.log('start', viewport), []),
		//onChange: useCallback((viewport: Viewport) => console.log('change', viewport), []),
		//onEnd: useCallback((viewport: Viewport) => console.log('end', viewport), []),
		onEnd: useCallback((viewport: Viewport) => onChange(update(value, {viewport: {$set: viewport}})), []),
	});

  return (<>
		<button className="btn btn-success" onClick={_ => doAdd()}>Add</button>
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
    <div className="row align-items-stretch flex-grow-1">
      <div className="col d-flex flex-column">
			  <ReactFlowProvider>
					<Flow {...{value, onChange}} />
			  </ReactFlowProvider>
				{saveButton}
    	</div>
      <div className="col d-flex flex-column">
    	</div>
    </div>
  );
};

export default {
  Editor: Logicore1Editor,
};

