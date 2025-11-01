import React, {useState} from 'react';
import {DndContext} from '@dnd-kit/core';

import {Droppable} from './Droppable';
import {Draggable} from './Draggable';

export function DragNDrop(props) {
    const [isDropped, setIsDropped] = useState(false);
    const draggableMarkup = (
        <Draggable>Drag me</Draggable>
    );

    return (
        <div>
            <button type="button" className="btn btn-outline-danger" onClick={() => setIsDropped(false)}>Reset</button>
            <DndContext onDragEnd={handleDragEnd}>
                {!isDropped ? draggableMarkup : null}
                <button type="button" className="btn btn-outline-dark" onClick={() => {setIsDropped(true)}}>After</button>
                <div style={{height: '700px', backgroundColor: 'var(--bs-light)'}}  />
                <Droppable>
                    {isDropped ? draggableMarkup : 'Drop here'}
                </Droppable>
            </DndContext>
        </div>
    );

    function handleDragEnd(event) {
        if (event.over && event.over.id === 'droppable') {
            setIsDropped(true);
        }
    }
}
