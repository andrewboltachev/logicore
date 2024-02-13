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

const nodeLabelsAndParamNames = {
  'MatchObjectOnly': {
    label: '{o}',
  },
  'MatchArray': {
    label: '[*]',
  },
  'MatchStringExact': {
    label: '"!"',
    defaultValue: "",
  },
  'MatchNumberExact': {
    label: '1!',
    defaultValue: 0,
  },
  'MatchBoolExact': {
    label: 't|f!',
    defaultValue: false,
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


const GraphDef = {
  nodeClasses: [
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
    }
  ],
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
        definition={GraphDef}
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

