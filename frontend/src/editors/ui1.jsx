// Global libs
import _ from 'lodash'

// React
import React, { useState, useContext, useRef, useEffect, useMemo, useCallback } from 'react'
import { v4 as uuidv4 } from 'uuid'

// React modules
import { useTranslation, Trans } from 'react-i18next'
import { useDraggable } from 'react-use-draggable-scroll'
import { NotificationManager } from '../react-notifications'
import { Button, Dropdown, Modal } from 'react-bootstrap'

// Local React and general modules
import { ModalProvider, ModalContext, modalComponents } from '../runModal'
import { axios } from '../imports'
import { update } from '../logicore-forms/utils'
import { useLocalStorage } from '../utils'
import { onPath, onPathPlus, ScrollArea } from './commons'
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
  modifyHelper
} from '../logicore-forms'

import {
  addEdge,
  MiniMap,
  Controls,
  Background,
  // useNodesState,
  // useEdgesState,
  applyNodeChanges,
  applyEdgeChanges,
  useViewport,
  ReactFlowProvider,
  Handle, Position,
  useKeyPress,
  useOnSelectionChange,
  useReactFlow,
  getStraightPath,
  BaseEdge,
  EdgeLabelRenderer,
  MarkerType,
  useOnViewportChange,
  getBezierPath, getSimpleBezierPath
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'

/*
Data type:

 */

const StateNode = ({ data, selected, isConnectable }) => {
  return (
    <div style={{ width: 50, height: 50, border: `2px solid ${selected ? 'red' : 'black'}`, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div>State</div>
      <Handle id='arrowSource' type='source' position={Position.Right} isConnectable={isConnectable} />
      <Handle id='arrowTarget' type='source' position={Position.Right} isConnectable={isConnectable} />
    </div>
  )
}

const nodeTypes = {
  StateNode
}
const edgeTypes = {}

const Editor = ({ value, onChange, saveButton }) => {
  const ref = useRef(null)
  const nodes = value?.nodes || []
  const edges = value?.edges || []

  const setNodes = onPathPlus(value, onChange, ['nodes']).onChange
  const setEdges = onPathPlus(value, onChange, ['edges']).onChange
  const onConnect = useCallback(() => {
  }, [])
  const onInit = useCallback(() => {
  }, [])
  const viewport = useViewport()
  const onNodesChange = (changes) => onChange(update(value, { nodes: { $apply: (v) => applyNodeChanges(changes, v) } }))
  const onEdgesChange = (changes) => onChange(update(value, { edges: { $apply: (v) => applyEdgeChanges(changes, v) } }))

  return (
    <div className='row align-items-stretch flex-grow-1'>
      <div className='col-md-12'>
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
          defaultEdgeOptions={{ type: 'ArrowEdge' }}
        >
          <div className='btn-group' style={{ zIndex: 1000 }}>
            {saveButton}
            <Dropdown>
              <Dropdown.Toggle variant='success' id='dropdown-basic' className='mt-2'>
                Add
              </Dropdown.Toggle>
              <Dropdown.Menu>
                {Object.keys(nodeTypes).map((k, i) => {
                  return (
                    <Dropdown.Item
                      key={k} href='#' onClick={(e) => {
                        e.preventDefault()
                        const id = 'id_' + uuidv4()
                        let position = { x: 0, y: 0 }
                        if (ref.current && viewport) {
                          const { width, height } = ref.current.getBoundingClientRect()
                          position = {
                            x: (width / 2 - viewport.x) / viewport.zoom,
                            y: (height / 2 - viewport.y) / viewport.zoom
                          }
                        }
                        setNodes([...nodes, {
                          id,
                          position,
                          type: k
                        // data: { value, state: defaultValue },
                        }])
                      }}
                    >
                      {k}
                    </Dropdown.Item>
                  )
                })}
              </Dropdown.Menu>
            </Dropdown>
          </div>
          <MiniMap />
          <Controls />
          <Background />
        </ReactFlow>
      </div>
    </div>
  )
}

const Wrapper = (props) => {
  return (
    <ReactFlowProvider>
      <Editor {...props} />
    </ReactFlowProvider>
  )
}

export default {
  Editor: Wrapper
}
