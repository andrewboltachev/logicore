import { update } from './imports.jsx'
import React, { useContext, useState, useEffect, useRef, useCallback, forwardRef, useMemo } from 'react'
import { ModalContext } from './runModal'
import _ from 'lodash'
import { useThrottle, useLocalStorage } from '@uidotdev/usehooks'

import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import {Link} from "react-router-dom";
import {getByPath} from "./logicore-forms/index.jsx";
hljs.registerLanguage('python', python)

function getRectParams (r) {
    const { top, left, width, height } = { ...r.toJSON() }
    return { top, left, width, height }
}

function mouseUpHandler (
    event,
    textAreaRef,
    setTextOverlayShouldBeVisible,
    setTextSelection,
    cursorClickStartRef,
    shouldUseCursor,
    parentRef,
    lineHeight
) {
}
function mouseDownHandler (
    event
) {

}

const HighlightedPositions = ({ positions, items, lines, zIndex, outstandingItem }) => (
    (Object.entries(items || {}).map(([k, selectedPositionData]) => {
        const selectedPosition = positions[k];
        if (!selectedPosition) {
            console.error('cannot get selected position', k, positions);
            return null;
        }
        return _.range(selectedPosition.start.line, selectedPosition.end.line + 1).map((lineIndex) => {
            // lineIndex -> 0-based
            let startPos = 0;
            let endPos = lines[lineIndex]
            if (lineIndex === selectedPosition.start.line) {
                startPos = selectedPosition.start.column
            }
            if (lineIndex === selectedPosition.end.line) {
                endPos = selectedPosition.end.column
            }
            // console.log(`wow: ${lineIndex} ${startPos} ${endPos}`)
            return <div key={lineIndex} data-code-path={k.replaceAll('.', '_')} style={{
                position: 'absolute',
                top: 6 + 24 * lineIndex,
                left: 12 - 1 + 9.602 * startPos,
                width: 9.602 * (endPos - startPos) + 3.5,
                height: 24,
                backgroundColor: selectedPositionData.color || 'yellow',
                opacity: !!selectedPositionData.opacity ? selectedPositionData.opacity : ((outstandingItem === k) ? 1 : 0.25),
                zIndex,
                pointerEvents: 'none',
                userSelect: 'none'
            }}></div>;
        });
    }))
);

const CodeDisplay = ({ code, positions, selectedPositions, highlightedPositions, outstandingItem }) => {
    const [highlighted, setHighlighted] = useState('')
    console.log({outstandingItem})

    const codeRef = useRef(null)
    const [position, setPosition] = useState({ x: 0, y: 0 })
    const lines = useMemo(() => {
        return code.split('\n').map((s) => s.length + 1) // вместе с переносом
    }, [code])
    useEffect(() => {
        const highlighted = hljs.highlight(code, { language: 'python' })
        setHighlighted(highlighted.value);
    }, [code])
    const handleMovement = useCallback(() => {
        if (!lines) return
        if (!codeRef.current) return
        // console.log(codeRef.current.selectionEnd);
        let s = 0
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i]
            const left = codeRef.current.selectionEnd - s
            if (left < line) {
                setPosition({ y: i, x: left })
                return
            }
            s += line
        }
    }, [lines])
    const handleKeydownWithinTextArea = useCallback((e) => {
        if (["ArrowUp", "ArrowRight", "ArrowDown", "ArrowLeft"].includes(e.code)) handleMovement()
    }, [handleMovement])
    if (!highlighted) {
        return (
            <div className='form-control flex-grow-1' style={{ flex: 1, position: 'relative', overflow: 'auto' }} />
        )
    }
    return (
        <>
            <div className='form-control flex-grow-1' style={{ flex: 1, position: 'relative', overflow: 'auto' }}>
                <div style={{ position: 'absolute', top: 0, left: 0 }}>
          <textarea
              id='code-textarea'
              ref={codeRef}
              className='code-textarea'
              onSelect={() => {
                  handleMovement()
              }}
              onMouseUp={event =>
                  mouseUpHandler(
                      event
                  )}
              onMouseDown={event => mouseDownHandler(event)}
              // onWheel={(event) => {
              //     function dispatchToScrollableParent(element, event) {
              //         let parent = element.parentNode;
              //         while (parent) {
              //             console.log(parent);
              //             if (parent.scrollHeight > parent.clientHeight) {
              //                 parent.dispatchEvent(new WheelEvent('wheel', {
              //                     deltaX: event.deltaX,
              //                     deltaY: event.deltaY,
              //                     deltaZ: event.deltaZ,
              //                 }));
              //                 return;
              //             }
              //             parent = parent.parentNode;
              //         }
              //     }
              //
              //     dispatchToScrollableParent(event.target, event);
              // }}
              aria-label='file content'
              aria-readonly
              // this prevents the virtual keyboard from being popped up when a user is on mobile
              inputMode='none'
              tabIndex={0}
              aria-multiline
              aria-haspopup={false}
              // needed to disable grammarly so that random code snippets don't get highlighted as grammar errors
              data-gramm='false'
              data-gramm_editor='false'
              data-enable-grammarly='false'
              style={{
                  borderColor: 'transparent',
                  borderWidth: 0,
                  backgroundColor: 'transparent',
                  // caretColor: "transparent",
                  // columnRuleColor: "transparent",
                  color: 'transparent',
                  caretColor: 'black',
                  // color: "transparent",
                  display: 'inline-block',
                  outlineColor: 'transparent',
                  overscrollBehavior: 'none',
                  position: 'absolute',
                  margin: 0,
                  padding: '6px 12px',
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                  textWrap: 'nowrap',
                  overflow: 'hidden',
                  zIndex: 10,
              }}
              value={code}
              onKeyDown={handleKeydownWithinTextArea}
              spellCheck={false}
              autoCorrect='off'
              autoCapitalize='off'
              autoComplete='off'
              data-ms-editor='false'
              onDrop={(e) => {
                  e.preventDefault();
                  return false;
              }}
              onPaste={e => {
                  e.preventDefault()
                  return false
              }}
              onChange={() => {
                  // empty on change handler
              }}
              onFocus={() => {
                  // setIsTextAreaFocused(true)
              }}
          />
                    <div
                        style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'pre', padding: '6px 12px', position: 'relative', zIndex: 10 }} id='python_01_explorer_code'
                        dangerouslySetInnerHTML={{ __html: highlighted }}
                    />
                    <div
                        className='caret' style={{
                        position: 'absolute',
                        top: 6 + 24 * position.y,
                        left: 12 - 1 + 9.602 * position.x,
                        width: 2,
                        height: 24,
                        backgroundColor: 'black',
                        zIndex: 9999,
                        pointerEvents: 'none',
                        userSelect: 'none',
                    }}
                    />
                    <HighlightedPositions zIndex={1} positions={positions} items={highlightedPositions} lines={lines} />
                    <HighlightedPositions outstandingItem={outstandingItem} zIndex={2} positions={positions} items={selectedPositions} lines={lines} />
                </div>
            </div>
        </>
    )
}

const Node = ({value, level= 0, path = null, expanded, setExpanded, selected, setSelected}) => {
    if (path === null) path = '';
    const isSelected = selected === path;
    const toggleSelected = useCallback((e) => {
        e.stopPropagation();
        setSelected(isSelected ? null : path)
    }, [isSelected, path, setSelected]);
    if (value === 'undefined') return 'Loading...';
    if (Array.isArray(value)) {
        // array
        if (!value.length) return '[]';
        return <>
            {value.map((child, index) => <div
                style={{background: isSelected ? 'lightyellow' : 'transparent'}}
                onClick={toggleSelected}
                key={index}>{_.repeat(' ', level)}- <Node value={child} path={`${path}${path.length ? '.' : ''}${index}`} level={level + 1} expanded={expanded} setExpanded={setExpanded} selected={selected} setSelected={setSelected} /></div>)}
        </>;
    } else if (value === null || typeof value === 'boolean' || typeof value === 'string' || typeof value === 'number') {
        //
        return <span onClick={toggleSelected} style={{color: 'rgb(3, 47, 98)', background: isSelected ? 'lightyellow' : 'transparent'}}>{JSON.stringify(value)}</span>
    } else if (typeof value === 'object') {
        console.assert(value.type)
        // object
        const vvalue = {...value};
        delete vvalue.type;
        const isExpanded = expanded[path];
        return <>
            <div style={{color: '#d63384'}}>{_.repeat(' ', level)}<a href={'#'} onClick={(e) => {
                e.preventDefault();
                setExpanded(update(expanded, {$toggle: [path]}));
            }}>{isExpanded ? <>&#9660;</> : <>&#9654;</>} {value.type}</a></div>
            {isExpanded && Object.entries(vvalue).map(([k, v]) => <div style={{background: isSelected ? 'lightyellow' : 'transparent'}} onClick={toggleSelected} key={k}>{_.repeat(' ', level)}<strong>{k}</strong>: <Node value={v} path={`${path}${path.length ? '.' : ''}${k}`} level={level + 1} expanded={expanded} setExpanded={setExpanded} selected={selected} setSelected={setSelected} /></div>)}
        </>;
    }
}

const RootedCopyExplorer = (props) => {
    // Основной
    const { code, foundItems } = props;

    const [foundItem, setFoundItem] = useState(null);
    // const [parentPath, setParentPath] = useState(null);
    const [hoveredParentPath, setHoveredParentPath] = useState(null);

    const foundItemTimeoutRef = useRef(null);

    useEffect(() => {
        if (foundItem) {
            foundItemTimeoutRef.current = setTimeout(() => {
                document.querySelector(`[data-code-path=${foundItem.replaceAll('.', '_')}]`).scrollIntoView({behavior: 'smooth'});
            }, 100);
        }
        //setParentPath(null);
        return () => {
            if (foundItemTimeoutRef.current !== null) clearTimeout(foundItemTimeoutRef.current);
        }
    }, [foundItem]);

    const selectedPositions = foundItems;

    useEffect(() => {
        setFoundItem(null);
        //setParentPath(null);
    }, [code]);

    const { runModal } = useContext(ModalContext)
    const t = _.identity

    const isCovered = (k) => {
        for (const child of props.parentPaths) {
            if (k.startsWith(child)) return child;
        }
        return null;
    }

    let parentPath = null;

    if (foundItem) {
        parentPath = isCovered(foundItem);
    }

    const highlightedParentPath = hoveredParentPath || parentPath;

    const highlightedPositions = {};
    if (hoveredParentPath && hoveredParentPath !== parentPath) {
        highlightedPositions[hoveredParentPath] = { color: 'purple', opacity: 0.1 };
    }

    if (parentPath) {
        highlightedPositions[parentPath] = { color: 'green', opacity: 0.5 };
    }

    let parentPaths = [];
    if (foundItem) {
        const l = foundItem.split('.');
        for (let i = 0; i < l.length; i++) if (/^[0-9]+$/.exec(l[i])) {
            parentPaths.push(l.slice(0, i + 1).join('.'));
        }
    }

    const displayedParentPath = highlightedParentPath || parentPath;

    const setParentPath = (path) => {
        props.onChange && props.onChange({
            filename: props.filename,
            path,
        });
    }

    return (
        <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <div className="container-fluid my-4">
                <div className="row">
                    <div className="col-1 d-flex justify-content-start align-items-center">
                        {props.has_prev && <Link to={`/rc/${props.id}/${props.index - 1}/`}><button className="btn btn-outline-secondary">
                            <i className={`fas fa-angle-double-left`} />
                        </button></Link>}
                    </div>
                    <div className="col-10 d-flex justify-content-start align-items-center">
                        <strong>File</strong><div className="badge text-bg-secondary mx-1">{props.index}</div><strong> out of </strong><div className="badge text-bg-secondary mx-1">{props.count}</div>
                        <code style={{fontSize: "1.2rem"}}>{props.filename}</code>
                    </div>
                    <div className="col-1 d-flex justify-content-end align-items-center">
                        {props.has_next && <Link to={`/rc/${props.id}/${props.index + 1}/`}><button className="btn btn-outline-secondary">
                            <i className={`fas fa-angle-double-right`} />
                        </button></Link>}
                    </div>
                </div>
            </div>
            <div className='container-fluid flex-grow-1 d-flex py-3' style={{ overflow: 'hidden' }}>
                <div className='row align-items-stretch flex-grow-1' style={{ overflow: 'hidden' }}>
                    <div className='col-3 d-flex flex-column'>
                        <h5>Select Node</h5>
                        <ul className="list-group">
                            {parentPath}
                            {Object.entries(foundItems).map(([k, v], i) => {
                                return (
                                    <li
                                        key={k}
                                        style={{overflow: 'hidden', cursor: 'pointer', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}
                                        className={`list-group-item ${(k === foundItem) ? "active" : ''}`}
                                        onClick={() => setFoundItem(k)}>
                                        <i className={`fas ${props.cancelledItems.includes(k) ? 'fa-times text-danger' : (!!isCovered(k) ? 'fa-check text-success' : 'fa-dot-circle text-warning')}`} />{"\u00a0"}{k}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className='col-3 d-flex flex-column'>
                        <h5>Select Parent</h5>
                        {!!foundItem && <>
                            <ul className="list-group">
                                {parentPaths.map((k, i) => {
                                    return (
                                        <li
                                            key={k}
                                            onMouseOver={(e) => {
                                                setHoveredParentPath(k);
                                            }}
                                            onMouseLeave={(e) => {
                                                setHoveredParentPath(null);
                                            }}
                                            style={{overflowWrap: 'anywhere', cursor: 'pointer'}}
                                            className={`list-group-item ${(k === parentPath) ? "active" : ''} ${(k === hoveredParentPath) ? "active" : ''}`}
                                            onClick={() => setParentPath(k)}>{k}</li>
                                    );
                                })}
                            </ul>
                            {(!!displayedParentPath && displayedParentPath !== '-') && <pre style={{fontSize: "1.2rem"}}>
                                {JSON.stringify((getByPath(props.serialized, displayedParentPath.split('.')) || {type: 'Undefined'}).type, null, 2)}
                            </pre>}
                        </>}
                    </div>
                    <div className='col-6 d-flex flex-column' style={{overflow: 'hidden'}}>
                        <div style={{overflow: 'hidden'}}>
                        <h5>Python code</h5>
                        </div>
                        <CodeDisplay
                            code={code}
                            onPositionChange={() => {}}
                            positions={props.positions}
                            outstandingItem={foundItem}
                            selectedPositions={selectedPositions} // [{start: ...}]
                            highlightedPositions={highlightedPositions} // [{start: ...}]
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default RootedCopyExplorer