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
import "./logicore1.scss";

const eV = (e) => e.target.value || "";

const initialNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: '1' } },
  { id: '2', position: { x: 0, y: 100 }, data: { label: '2' } },
];

const initialEdges = [{ id: 'e1-2', source: '1', target: '2' }];

/*function Logicore1Node({ id, data }: NodeProps<NodeData>) {
  return (
    <div style={{ backgroundColor: 'yellow', borderRadius: 10 }}>
      Hello
    </div>
  );
}*/


const NODE_TYPES = [
  "FileSystem",
  "Data",
  "Multiplexer",
];

const EDGE_TYPES = [
  "Files",
  "Grammar",
  "Multiplexer",
  "Selector",
];

//const nodeTypes = {Logicore1Node};

const FileSystem = ({value, onChange}) => {
  const doChange = async ({path}) => {
    const resp = await axios.post("/logicore-api/FileSystem/do/", {path});
    onChange({files: resp.data.files, path});
  };
  return (
    <main>
      <GenericForm
        fields={{type: "Fields", fields: [{type: "TextField", k: "path", label: "Path", required: true}]}}
        data={value}
        onChange={doChange}
        path={[]}
      />
    </main>
  );
};

const Data = ({ value, onChange }) => {
  return (
    <main>
      <GenericForm
        fields={{type: "Fields", fields: [{type: "TextField", k: "data", label: "Data", required: true}]}}
        data={value}
        onChange={onChange}
        path={[]}
      />
    </main>
  );
};

const BackAndForth = ({ subtype, value, source, target }) => {
  const actions = {forwards: {buttonClass: "btn-success"}, backwards: {buttonClass: "btn-warning"}};
  return (
      <div className="btn-group">
        {Object.entries(actions).map(([k, v]) => (
          <button
            type="button" className={`btn ${v.buttonClass}`}
            onClick={async _ => {
              const resp = await axios.post(`/logicore-api/${subtype}/${k}/`, {
              });
            }}
          >{_.capitalize(k)}</button>
        ))}
      </div>
  );
}

const Files = ({ value, onChange, source }) => {
  const [files, setFiles] = useState(value || {});
  return (
    <main>
      <ul style={{overflowY: "scroll", height: 500}}>
        {source?.value?.files?.map(x => (
          <li k={x}>
            <input type="checkbox" id={`select-file-${x}`} checked={files[x]} onChange={_ => setFiles(update(files, {$toggle: [x]}))}/>
            {" "}
            <label for={`select-file-${x}`}>
              {x.substr(source.value.path.length + 1)}
            </label>
            </li>
        ))}</ul>
      {/*<GenericForm
        fields={{type: "Fields", fields: [{type: "TextField", k: "files", label: "Files", required: true}]}}
        data={value}
        onChange={onChange}
        path={[]}
      />*/}
        <button type="button" className="btn btn-success" onClick={_ => onChange(files)}>Save</button>
      </main>
  );
};

const Grammar = ({ value, onChange }) => {

};

const Multiplexer = ({ value, onChange }) => {

};

const Selector = ({ value, onChange }) => {

};

const editableItems = {
  Node: {
    FileSystem,
    Data,
  },
  Edge: {
    Files,
    Grammar,
    Multiplexer,
    Selector,
  },
};

/*const defaultValues = {
  Node: {
    FileSystem: {path: "", files: []},
  },
};*/

function Flow({ storageKey, prevStorageKey, value, onChange, saveButton }) {
  /*const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);*/

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
    if (result) setEdges(addEdge(update(params, {data: {$auto: {subtype: {$set: result.subtype.value}}}, label: {$set: "Files"}}), edges));
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
      //type: "Logicore1Node",
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
  return (<>
    <div className="row align-items-stretch flex-grow-1">
      <div className="col d-flex flex-column">
        <div className="btn-group">
          {saveButton}
          <button type="button" className="btn btn-success" onClick={_ => doAdd()}>Add</button>
        </div>
        <ReactFlow
          onInit={onInit}
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={/*nodeTypes*/ void 0}
        >
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
    	</div>
      <div className="col d-flex flex-column">
        {LastSelectedThingComponent ? (<>
          {lastSelectedThing.type === "Edge" ? <BackAndForth {...theProps} /> : null}
          <LastSelectedThingComponent
            {...theProps}
          />
        </>) : null}
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

