import React, {useState} from 'react';
import './Sortable.scss';

import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';

import {SortableItem} from './SortableItem';

const grammar1 = {
    "tag": "MatchObjectOnly",
    "contents": {
        "cases": {
            "tag": "MatchArray",
            "contents": {
                "tag": "MatchObjectOnly",
                "contents": {
                    "body": {
                        "tag": "MatchObjectOnly",
                        "contents": {
                            "type": {
                                "tag": "MatchStringExact",
                                "contents": "IndentedBlock"
                            },
                            "body": {
                                "tag": "MatchAny"
                            }
                        }
                    },
                    "guard": {
                        "tag": "MatchNull"
                    },
                    "pattern": {
                        "tag": "MatchObjectOnly",
                        "contents": {
                            "type": {
                                "tag": "MatchStringExact",
                                "contents": "MatchValue"
                            },
                            "value": {
                                "tag": "MatchObjectOnly",
                                "contents": {
                                    "type": {
                                        "tag": "MatchStringExact",
                                        "contents": "SimpleString"
                                    },
                                    "value": {
                                        "tag": "MatchStringAny"
                                    }
                                }
                            }
                        }
                    },
                    "type": {
                        "tag": "MatchStringExact",
                        "contents": "MatchCase"
                    }
                }
            }
        },
        "subject": {
            "tag": "MatchObjectOnly",
            "contents": {
                "type": {
                    "tag": "MatchStringExact",
                    "contents": "Name"
                },
                "value": {
                    "tag": "MatchStringExact",
                    "contents": "__o"
                }
            }
        },
        "type": {
            "tag": "MatchStringExact",
            "contents": "Match"
        }
    }
};

const contentsKinds = {

}

function Sortable() {
    const [items, setItems] = useState([1, 2, 3]);
    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    return (<div className="grammar-tree">
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
        >
            <SortableContext
                items={items}
                strategy={verticalListSortingStrategy}
            >
                {items.map((id, i) => <SortableItem odd={i % 2 === 0} key={id} id={id} />)}
            </SortableContext>
        </DndContext>
    </div>);

    function handleDragEnd(event) {
        const {active, over} = event;

        if (active.id !== over.id) {
            setItems((items) => {
                const oldIndex = items.indexOf(active.id);
                const newIndex = items.indexOf(over.id);

                return arrayMove(items, oldIndex, newIndex);
            });
        }
    }
}

export default Sortable;
