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

import GraphEditor from "./GraphEditor";


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

/*const Component = (node) => {
  const { data, selected, isConnectable, label } = node;
  let n = matchNodeOptions.find(({ value }) => value === node.data.value);

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
        <div>{n.label}</div>
      </div>
    );
  }
};*/


const definition = {
  nodes: [
    {type: 'FS'},
    {type: 'PythonFile'},
    {type: 'Data'},
  ],
  edges: [
    {type: 'Set'},
    {type: 'Grammar'},
  ]
};


const Logicore2Editor = ({
  revId,
  prevRevId,
  value,
  onChange,
  saveButton,
}) => {
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  return (
	  <ReactFlowProvider>
      <GraphEditor
        storageKey={`viewport-${revId}`}
        prevStorageKey={
          prevRevId ? `viewport-${prevRevId}` : null
        }
        {...{value, onChange}}
        beforeContent={saveButton}
      />
	  </ReactFlowProvider>
  );
};

export default {
  Editor: Logicore2Editor,
};
