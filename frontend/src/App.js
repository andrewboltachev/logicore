import React, { useState, useEffect, useRef, memo } from "react";
import logo from "./logo.svg";
import "./App.scss";
import classd from "classd";
import "react-notifications/lib/notifications.css";
import { axios, extend, update } from "./imports";
import { Button, Modal } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import { alert, confirm } from "react-bootstrap-confirmation";
import moment from "moment";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Link,
  useLocation,
  useHistory,
  useNavigate,
} from "react-router-dom";
import {
  useLocalStorage,
  useApi,
  moveUp,
  moveDown,
  range,
  capitalize,
  partition2,
  orderBy,
  getURLParameterByName,
  useWindowSize,
  useDebounce,
  changeURLParameter,
} from "./utils";

import { ComponentType, ReactNode } from "react";
import { jsx } from "@emotion/react";

import {
  validateDefinition,
  definitionIsInvalid,
  pathToUpdate,
  FormComponent,
  GenericForm,
  formComponents,
  FieldLabel,
} from "./logicore-forms";

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

const FlowField = ({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
  disabled,
}) => {
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
      <button className="btn" type="button" onClick={recalcGraph}>Recalc</button>
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

Object.assign(formComponents, {
  FlowField,
});

const ListView = ({create_form, items, onChange}) => {
  return <div className="container">
    <div className="d-flex align-items-center justify-content-between">
      <h1>Stratagems</h1>
      <FormComponent
        path={[]}
        definition={create_form.fields}
        value={create_form.data}
        onChange={onChange}
        onReset={_ => _}
        error={null}
      />
    </div>
    <table className="table">
      <thead>
        <tr>
          <th>Name</th>
          <th>Kind</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {items?.map((item) => (<tr>
          <td><Link to={`/${item.id}`}>{item.name}</Link></td>
          <td>{item.kind}</td>
          <td>
            <button
              className="btn btn-sm btn-outline-danger"
              type="button"
              onClick={_ => confirm('Do you really want to delete this graph?').then(value => value && onChange({'action': 'delete', 'id': item.id}))}
            >
              <i className="fa fa-times" />
            </button>
          </td>
        </tr>))}
        {!items?.length && <tr>
          <td><em>No items</em></td>
        </tr>}
      </tbody>
    </table>
  </div>;
}

const mainComponents = {
  ListView,
  GenericForm,
};

const MainWrapper = ({ result, onChange }) => {
  const Component = mainComponents[result?.template];
  return (
    <>
      {Component && result && <Component {...{ ...result, onChange }} />}
    </>
  );
};

const wrapperComponents = {
  MainWrapper,
};

const result_worth_processing = ({ result, loc, navigate }) => {
  if (result?.notification) {
    NotificationManager[result.notification.type]("", result.notification.text);
  }
  if (result?.redirect) {
    window.location.href = result.redirect;
    return false;
  }
  if (result?.navigate) {
    navigate(result.navigate);
    return false;
  }
  return true;
};

const gatherFileUids = (data) => {
  if (Array.isArray(data)) return data.reduce((a, b) => ({...a, ...gatherFileUids(b)}), null);
  if (data && typeof data === 'object') {
    if (data.its_uid_for_file_to_upload_239r8h239rh239r) {
      const uid = data.its_uid_for_file_to_upload_239r8h239rh239r;
      return {[uid]: window[uid].file};
    }
    return Object.entries(data).reduce((a, [_, b]) => ({...a, ...gatherFileUids(b)}), null);
  }
};

const BaseLayout = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const apiUrl = "/api" + loc.pathname + loc.search;
  const [result, loading, _] = useApi(apiUrl, loc.key);
  const [show, setShow] = useState(false);

  const reload = () => {
    navigate(loc.pathname);
  };
  useEffect(
    (_) => {
      console.log("GET API returned", result, window.actionToConsume);
      if (result?.current_date) window.current_date = result.current_date;
      if (!result_worth_processing({ result, loc, navigate })) return;
      if (window.actionToConsume) {
      }
    },
    [result]
  );

  const onChange = async (data, setErrors, customHandler) => {
    let resp;
    if (window._react_form_has_files) {
      //console.log(gatherFileUids(data)); return;
      const formData = new FormData();
      for (const [k, v] of Object.entries(gatherFileUids(data))) {
        formData.append(k, v);
      }
      formData.append('data', JSON.stringify(data));
      resp = await axios.post(apiUrl, formData);
      /*
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
       */
    } else {
      resp = await axios.post(apiUrl, {
        data,
      });
    }
    const result = resp.data;
    console.log("POST API returned", resp);
    if (customHandler) {
      customHandler(result);
    } else {
      if (setErrors) setErrors(null, null);
      if (!result_worth_processing({ result, loc, navigate })) return;
      if (result?.action === "setErrors") {
        if (setErrors) setErrors(result.errors, result.error);
      }
      if (result?.action === "closeWindow") {
        window.the_msg = result?.the_msg;
        window.close();
      }
    }
    return resp.data;
  };

  const Wrapper = wrapperComponents[result?.wrapper];

  if (result?.navigate || !Wrapper) return <div />;

  return <>
    <Wrapper {...{ loc, navigate, result, apiUrl, onChange }} />
  </>;
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route path="*" element={<BaseLayout />} />
        </Routes>
      </Router>
      <NotificationContainer enterTimeout={10} leaveTimeout={10} />
    </>
  );
}

export default App;
