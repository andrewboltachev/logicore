// Global libs
import _ from "lodash";

// React
import React, { useState, useContext, useRef, useEffect } from "react";

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
  getBezierPath, getMarkerEnd, getSimpleBezierPath,
} from 'reactflow';
import 'reactflow/dist/style.css';

/*
Data type:

 */

const Editor = (props) => {
  return (
    <div className="row align-items-stretch flex-grow-1">
      <div className="col-md-12">
        <div className="btn-group">{props.saveButton}</div>
        <ReactFlow
          ref={ref}
          onInit={onInit}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          defaultEdgeOptions={{type: 'ArrowEdge'}}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  );
}

export default {
  Editor,
};
