import {Link} from "react-router-dom";
import React, {useContext, useEffect, useMemo, useRef} from "react";
import {ModalContext} from "../../runModal.jsx";
import { ReactFlow, Background, Controls } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useState, useCallback } from 'react';
import { applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { v4 as uuidv4 } from 'uuid'
import {Subject, bufferTime, filter, concatAll, mergeMap, groupBy, debounceTime} from 'rxjs';


import nodeTypes from './nodeTypes.jsx';

const nodeTypeOptions = Object.values(nodeTypes).map((nodeType) => ({
    value: nodeType.name,
    label: nodeType.name,
}));

function simpleLogDecorator(targetFn) {
    return function(...args) {
        console.log(`Calling function: ${targetFn.name}`);
        return targetFn.apply(this, args);
    };
}

/**
 * Custom hook to manage an RxJS batching stream.
 * @param {function} receiver - The function to call with the batched events.
 * @param {number} interval - The time window (in milliseconds) for batching.
 * @returns {Subject<any>} - The Subject/producer to send events to.
 */
function useFlowEventsBatcher(receiver) {
    const MOUSE_MOVE_INTERVAL = 200;
    const BATCH_INTERVAL = 50;
    // 1. Create the Subject (the producer) once using useMemo.
    const eventStream = useMemo(() => new Subject(), []);

    // 2. Manage the subscription lifecycle using useEffect.
    useEffect(() => {
        const subscription = eventStream.pipe(
            // Collect events into an array every 'interval' milliseconds
            // Ensure we only process batches with actual events
            //filter(batch => batch.length > 0),
            concatAll(),
            groupBy(event => event.type),
            mergeMap(group => {
                if (group.key === 'position') {
                    // Apply debouncing ONLY to mousemove events
                    return group.pipe(debounceTime(MOUSE_MOVE_INTERVAL));
                } else {
                    // Let all other events pass through immediately
                    return group;
                }
            }),
            bufferTime(BATCH_INTERVAL),
            filter(batch => batch.length)
        ).subscribe(batch => {
            // This is the RxJS equivalent of your 'receiver(batch)'
            receiver(batch);
        });

        // 3. Cleanup function: runs on component unmount
        return () => {
            // Unsubscribe to stop processing and prevent memory leaks
            subscription.unsubscribe();
            // Optional: Complete the subject if it won't be reused, although unsubscribe is often sufficient.
            eventStream.complete();
        };
    }, [eventStream, receiver]); // Dependencies: The stream object, receiver function, and interval

    // Return the Subject so the component can send events to it.
    return eventStream;
}

const Stratagem = ({ user, items, title, data: value, onChange, what, detail_base, breadcrumbs }) => {
    const {runModal} = useContext(ModalContext);
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);
    const onNodesChange = useCallback(
        (changes) => setNodes((nodesSnapshot) => applyNodeChanges(changes, nodesSnapshot)),
        [],
    );
    const onEdgesChange = useCallback(
        (changes) => setEdges((edgesSnapshot) => applyEdgeChanges(changes, edgesSnapshot)),
        [],
    );

    const [messages, setMessages] = useState([]);
    const [connectionStatus, setConnectionStatus] = useState('Connecting...');

    // The WebSocket reference
    const ws = React.useRef(null);

    // console.log({value});

    const throttleRef = React.useRef(null);

    const receiver = useCallback((batch) => {
        console.log(`Received batch of ${batch.length} events at ${Date.now()}`);
        for (const event of batch) {
            console.log(event);
        }
    }, []);

    // Get the producer/Subject from the hook
    const producer = useFlowEventsBatcher(receiver, 500);

    /*useEffect(() => {
            // 1. Establish the connection
            ws.current = new WebSocket(`wss://127.0.0.1:8008/ws/${value.id}`);

            // 2. Event Handlers

            // Connection established
            ws.current.onopen = () => {
                console.log('WebSocket Connected');
                setConnectionStatus('Connected');
            };

            // Receive messages from the server
            ws.current.onmessage = (event) => {
                console.log('Message received:', event.data);
                setMessages((prevMessages) => [...prevMessages, event.data]);
            };

            // Handle errors
            ws.current.onerror = (error) => {
                console.error('WebSocket Error:', error);
                setConnectionStatus('Error');
            };

            // Connection closed
            ws.current.onclose = () => {
                console.log('WebSocket Disconnected');
                setConnectionStatus('Disconnected');
            };

            // 3. Cleanup function: runs when the component unmounts
            return () => {
                if (ws.current) {
                    ws.current.close();
                }
            };
    }, []); // Empty dependency array means this runs only once on mount
     */

    // Function to send a message
    const sendMessage = (message) => {
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            ws.current.send(message);
        } else {
            console.warn('WebSocket not open. Cannot send message.');
        }
    };

    return (
        <div className='container-fluid mb-3' style={{flexGrow: 1, display: 'flex', flexDirection: 'column'}}>
            <div className='row align-items-stretch'>
                <div className='col-md-12 flex-grow-1 d-flex align-items-center py-3 gap-2'>
                    {!!breadcrumbs?.length && (
                        <nav aria-label="breadcrumb" className="flex-grow-1">
                            <ol className="breadcrumb" style={{background: '#e9ecef', padding: 10, borderRadius: 8, marginBottom: 0}}>
                                {breadcrumbs.map((item, i) => (
                                    <li key={i} className={`breadcrumb-item ${ !item.url ? 'active' : '' }`}>
                                        {item?.url ? (
                                            <Link to={item.url}>{item.title}</Link>
                                        ) : (
                                            <>{item.title}</>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    )}
                    <button type="button" className="btn btn-primary" onClick={async () => {
                        const result = await runModal({
                            title: `Add node`,
                            fields: {
                                type: 'Fields',
                                fields: [
                                    {
                                        type: 'SelectField',
                                        k: 'nodeType',
                                        label: 'Type',
                                        required: true,
                                        options: nodeTypeOptions,
                                    }
                                ],
                            },
                            modalSize: 'md',
                            value: { nodeType: nodeTypeOptions[0] }
                        });
                        if (result) {
                            onNodesChange([{
                                type: 'add',
                                item: {
                                    id: 'id_' + uuidv4(),
                                        position: { x: 250, y: 10 },
                                    data: {
                                        label: 'New Node',
                                        ...nodeTypes[result.nodeType.value].newData(),
                                    },
                                    type: 'default', // Or a custom type
                                }
                            }]);
                        }
                    }}>
                        <i className="fa fa-plus" />{" "}
                        New Node
                    </button>
                </div>
            </div>
            <div
                style={
                    {
                        display: 'flex',
                        flexWrap: 'wrap',
                        flexGrow: 1,
                        backgroundColor: 'var(--bs-gray-100)',
                        borderRadius: 8,
                    }
                }
            >
                <div style={{ height: '100%', width: '100%' }}>
                    <ReactFlow
                        nodes={nodes}
                        onNodesChange={(changes) => {
                            producer.next(changes);
                            onNodesChange(changes);
                        }}
                        edges={edges}
                        onEdgesChange={(changes) => {
                            producer.next(changes);
                            onEdgesChange(changes);
                        }}
                    >
                        <Background />
                        <Controls />
                    </ReactFlow>
                </div>
            </div>
        </div>
    );
}

export default Stratagem;
