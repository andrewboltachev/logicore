import React, { useState, useEffect, useRef, memo } from "react";
import {
  FieldLabel,
} from "../logicore-forms";
import { v4 as uuidv4 } from "uuid";

import ReactFlow, {
  addEdge,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
	useReactFlow,
} from 'react-flow-renderer';

import { Handle } from 'react-flow-renderer';

const ColorSelectorNode = memo(({ data, isConnectable }) => {
  return (
    <>
      <Handle
        type="target"
        position="left"
        style={{ background: '#555' }}
        onConnect={(params) => console.log('handle onConnect', params)}
        isConnectable={isConnectable}
      />
      <div>
        Custom Color Picker Node: <strong>{data.color}</strong>
      </div>
      <input
        className="nodrag"
        type="color"
        onChange={data.onChange}
        defaultValue={data.color}
      />
      <Handle
        type="source"
        position="right"
        id="a"
        style={{ top: 10, background: '#555' }}
        isConnectable={isConnectable}
      />
      <Handle
        type="source"
        position="right"
        id="b"
        style={{ bottom: 10, top: 'auto', background: '#555' }}
        isConnectable={isConnectable}
      />
    </>
  );
});

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


const StringNode = memo((nodeProps) => {
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


const Literal = memo((nodeProps) => {
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
      {data?.value}
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

const HEAD_SYMBOLS = {
  'Map': '{}',
  'MapEntry': '-{}',
  'Set': '#{}',
  'List': '()',
  'Vector': '[]',
};

const Head = memo((nodeProps) => {
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
      <Handle
        type="source"
        position="right"
        id="a"
        style={{ top: 10, background: '#555' }}
        isConnectable={isConnectable}
      />
    {HEAD_SYMBOLS[data?.subtype] || '?'}
    </>
  );
});

const nodeTypes = {
  StringNode,
  Literal,
  Head,
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
  const recalcGraph = () => {
    const updates = {};
    const dependant = {};
    const getNodeValue = id => {
      if (updates.hasOwnProperty(id)) {
        return updates[id];
      }
      for (const node of nodes) {
        if (node.id === id) {
          return node.data.value;
        }
      }
    }
    const checkNode = id => {
      const nodeValue = getNodeValue(id);
      for (const edge of edges) {
        if (edge.target === id) dependant[id] = true;
        if (edge.source === id) {
          updates[edge.target] = nodeValue;
          checkNode(edge.target);
        }
      }
    };
    for (const node of nodes) {
      checkNode(node.id);
    }
    setNodes((nds) => nds.map(node => {
      const update = updates[node.id];
      //if (!node.dependant !== !dependant[node.id]) {
      console.log('d', dependant[node.id]);
        node.data = {...node.data, dependant: dependant[node.id]};
      //}
      if (update) {
        node.data = {...node.data, value: update};
      }
      return node;
    }));
  };

  useEffect(() => {
    onChange({
      nodes: Array.from(nodes),
      edges: Array.from(edges),
    });
  }, [nodes, edges]);

  return (
    <FieldLabel definition={definition} id={id} context={context}>
      <button className="btn" type="button" onClick={recalcGraph}>Sync</button>
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
            reactFlowInstance.addNodes(
              {
                id,
                type: 'StringNode',
                data: {
                  value: 'Welcome to React Flow!',
                },
                position: { x: 250, y: 0 },
              },
            );
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

