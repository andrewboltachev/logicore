import React, { useState, useEffect, useRef, memo } from "react";
import {
  formComponents,
  validateDefinition,
  definitionIsInvalid,
  FormComponent,
  GenericForm,
  formValidators,
  fieldsLayouts,
  FieldLabel,
} from "../logicore-forms";
import { v4 as uuidv4 } from "uuid";
import classd from "classd";
import keycode from "keycode";
import _ from "lodash";

import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
	useReactFlow,
} from 'react-flow-renderer';

import {
  pathToUpdate,
  getByPath,
  setByPath,
  update,
} from "../logicore-forms/utils";

import useModal from "../useModal";

import { Button, Modal } from "react-bootstrap";

import { Handle } from 'react-flow-renderer';

const changeNode = (id, newValue) => window.setNodes((nds) => nds.map(node => {
  if (node.id === id) {
    node.data = {...node.data, value: newValue};
  }
  return node;
}));

const unchainNode = (id) => {
  window.setEdges((eds) => eds.filter(edge => {
    return edge.target !== id;
  }));
}


const FileNode = memo((nodeProps) => {
  const { data, isConnectable, id } = nodeProps;
  return (
    <>
      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
      <div className="d-flex" style={{height: 20}}>
        {data?.dependant && <a href="#" onClick={e => {
          e.preventDefault();
          unchainNode(id);
        }} style={{color: "var(--bs-dark)"}}>
          <i className="fa fa-times" />
        </a>}
      </div>
      <input
        className="nodrag form-control form-control-sm"
        type="text"
        onChange={e => changeNode(id, e.target.value)}
        value={data.value}
        disabled={data.dependant}
      />
      <Handle
        type="source"
        position="right"
        id="a"
        style={{ top: 10, background: '#555' }}
        isConnectable={isConnectable}
      />
    </>
  );
});

const nodeTypes = {
  FileNode,
};

export default function PythonRefactoring1Field({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
  disabled,
}) {
  const id = "id_" + uuidv4();
  const { label } = definition;
  const [nodes, setNodes, onNodesChange] = useNodesState(value?.nodes || []);
  const [edges, setEdges, onEdgesChange] = useEdgesState(value?.edges || []);
  window.setNodes = setNodes;
  window.setEdges = setEdges;
  const onConnect = (params) => setEdges((eds) => addEdge(params, eds));
  const [reactFlowInstance, setReactFlowInstance] = useState({});
	const onInit = setReactFlowInstance;
  const syncGraph = () => {
  };

  useEffect(() => {
    onChange({
      nodes: Array.from(nodes),
      edges: Array.from(edges),
    });
  }, [nodes, edges]);

  const Modal1 = useModal({
    definition: {
      type: 'Fields',
      title: 'Add file',
      fields: [
        {
          k: 'foo1',
          type: 'SelectFileField',
        },
      ],
    },
    onChange: value => {
      console.log('add file', value);
    },
  });

  return (
    <FieldLabel definition={definition} id={id} context={context}>
      {Modal1.element}
      <div className="btn-group">
        <button className="btn btn-outline-secondary" type="button" onClick={Modal1.setShow}>
          <i className="fa fa-file" />
          {" "}
          Add file
        </button>
        <button className="btn btn-outline-secondary" type="button" onClick={syncGraph}>Sync</button>
      </div>
			<div style={{width: "100%", height: "80vh"}}>
				<ReactFlow
					nodes={nodes}
					edges={edges}
					onNodesChange={onNodesChange}
					onEdgesChange={onEdgesChange}
					onConnect={onConnect}
					onInit={onInit}
          nodeTypes={nodeTypes}
          onPaneClick={e => {
            e.persist();
            const id = 'id_' + uuidv4();
            /*reactFlowInstance.addNodes(
              {
                id,
                type: 'StringNode',
                data: {
                  value: 'Welcome to React Flow!',
                },
                position: { x: 250, y: 0 },
              },
            );*/
					}}
					fitView
					attributionPosition="top-right"
				>
					<MiniMap
						nodeStrokeColor={(n) => {
							if (n.style?.background) return n.style.background;
							if (n.type === 'input') return '#0041d0';
							if (n.type === 'output') return '#ff0072';
							if (n.type === 'default') return '#1a192b';

							return '#eee';
						}}
						nodeColor={(n) => {
							if (n.style?.background) return n.style.background;

							return '#fff';
						}}
						nodeBorderRadius={2}
					/>
					<Controls />
					<Background color="#aaa" gap={16} />
				</ReactFlow>
			</div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </FieldLabel>
  );
};

