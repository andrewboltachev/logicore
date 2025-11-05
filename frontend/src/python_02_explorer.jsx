import { onPath } from './editors/commons'
import { update } from './imports.jsx'
import React, { useContext, useState, useEffect, useRef, useCallback, forwardRef, useMemo } from 'react'
import { getByPath, setByPath } from './logicore-forms'
import { ModalContext } from './runModal'
import _ from 'lodash'
import { useThrottle, useLocalStorage } from '@uidotdev/usehooks'

import { ReactFlow, applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import hljs from 'highlight.js/lib/core'
import python from 'highlight.js/lib/languages/python'
import { axios } from './imports.jsx'
import Sortable from "./components/sortable/Sortable.jsx";
import {DragNDrop} from "./components/draggable/DragNDrop.jsx";
// import {tree} from "d3-hierarchy";
import matcher_grammar from "./examples/matcher_grammar.json";
import {GrammarTrie} from "./components/grammar-trie/GrammarTrie";

hljs.registerLanguage('python', python)


const initialNodes = [
  { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' } },
  { id: 'n2', position: { x: 0, y: 100 }, data: { label: 'Node 2' } },
];
const initialEdges = [{ id: 'n1-n2', source: 'n1', target: 'n2' }];


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

const CodeDisplay = ({ code, onPositionChange, selectedPosition, selected }) => {
  const [highlighted, setHighlighted] = useState('')

  const codeRef = useRef(null)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const delayedPosition = useThrottle(position, 100)
  useEffect(() => {
    console.log(`onPositionChange: ${JSON.stringify(delayedPosition)}`)
    onPositionChange(delayedPosition)
  }, [delayedPosition, code, onPositionChange])
  const lines = useMemo(() => {
    return code.split('\n').map((s) => s.length + 1) // вместе с переносом
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
  useEffect(() => {
    const highlighted = hljs.highlight(code, { language: 'python' })
    setHighlighted(highlighted.value);
  }, [code])
  if (!highlighted) {
    return (
      <div className='form-control flex-grow-1' style={{ flex: 1, position: 'relative', overflow: 'auto' }} />
    )
  }
  return (
    <>
      {/*<pre>{JSON.stringify(selected)}</pre>*/}
      {/*<pre>{JSON.stringify(selectedPosition)}</pre>*/}
      <pre>{JSON.stringify([codeRef?.current?.selectionEnd, position])}</pre>
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
              textWrap: 'nowrap'
            }}
            value={code}
            onKeyDown={handleKeydownWithinTextArea}
            spellCheck={false}
            autoCorrect='off'
            autoCapitalize='off'
            autoComplete='off'
            data-ms-editor='false'
            onDrop={e => {
              /*
                            const text = e.dataTransfer.getData('Text')
                            try {
                                // eslint-disable-next-line no-restricted-syntax
                                const url = new URL(text)
                                window.open(url, '_blank')?.focus()
                            } catch {
                                //the thing dropped was not a URL, catch but don't do anything
                            } */
              return false
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
            style={{ pointerEvents: 'none', userSelect: 'none', whiteSpace: 'pre', padding: '6px 12px' }} id='python_02_explorer_code'
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
              userSelect: 'none'
            }}
          />
          {!!selectedPosition && _.range(selectedPosition.start.line, selectedPosition.end.line + 1).map((lineIndex) => {
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
            return <div key={lineIndex} style={{
              position: 'absolute',
              top: 6 + 24 * lineIndex,
              left: 12 - 1 + 9.602 * startPos,
              width: 9.602 * (endPos - startPos),
              height: 24,
              backgroundColor: 'yellow',
              opacity: 0.2,
              zIndex: 9998,
              pointerEvents: 'none',
              userSelect: 'none'
            }}></div>;
          })}
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

const Code01Wrapper = ({ code, setExpanded }) => {
  const [positions, setPositions] = useState(null)
  const [reversedPositions, setReversedPositions] = useState(null)

  const onPositionChange = useCallback((newPosition) => {
    // console.log('try onPositionChange', {positions, reversedPositions, newPosition})
    if (!reversedPositions) return;
    const newPath = (reversedPositions[newPosition.y] || {})[newPosition.x]
    if (!newPath) {
      setExpanded({})
      setSelected(null)
      return
    }
    const items = {}
    let current = ""
    const newExpanded = {"": true}
    for (const chunk of newPath.split('.')) {
      current += (current.length ? "." : "") + chunk
      newExpanded[current] = true
    }
    setExpanded(newExpanded)
    setSelected(newPath)
  }, [positions, reversedPositions]);

  const [selected, setSelected] = useState(null)
  const [tree, setTree] = useState(null)

  useEffect(() => {
    setTree(null)
    setPositions(null)
    setReversedPositions(null)
    setExpanded({})
    setSelected(null);

    (async () => {
      const resp = await axios.post(
          '/python-to-match-result/',
          {
            code
          }
      );
      setTree(resp.data.value)
      setPositions(resp.data.positions)
      setReversedPositions(resp.data.positions_reversed)
    })()
  }, [code, setExpanded])

  return (<>
    <code style={{whiteSpace: 'normal'}}>
      {/*{selected ? selected.split('.').join(' ') : null}*/}
      {/*{(selected === '') && '(root)'}*/}
      {/*{selected === null && '(not selected)'}*/}
    </code>
    <CodeDisplay code={code} onPositionChange={onPositionChange} selectedPosition={positions?.[selected]} selected={selected} />
  </>)
}

const Python02Explorer = () => {
  // Основной
  const [code, setCode] = useLocalStorage('PYTHON_02_EXPLORER_CODE', '')
  // Производные
  const [expanded, setExpanded] = useState({})

  const { runModal } = useContext(ModalContext)
  const t = _.identity
  return (
    <div className='container-fluid flex-grow-1 d-flex py-3' style={{ overflow: 'hidden' }}>
      <div className='row align-items-stretch flex-grow-1' style={{ overflow: 'hidden' }}>
        <div className='col d-flex flex-column flex-grow-1 gap-4'>
          <div className='col d-flex flex-column flex-grow-1 flex-shrink-0'>
            <h5>
              Structure
            </h5>
            <div className="form-control flex-grow-1">
              <GrammarTrie data={matcher_grammar} />
            </div>
          </div>
          <div className='col d-flex flex-column flex-grow-1 flex-shrink-0'>
            <h5>
              Structure
            </h5>
            <div className="form-control flex-grow-1 overflow-auto">
              <Sortable />
              <DragNDrop />
            </div>
          </div>
        </div>
        <div className='col d-flex flex-column flex-grow-1 gap-4'>
          <div className='col d-flex flex-column flex-grow-1'>
            <h5>
              Python code
              <button
                  className='btn btn-sm btn-primary mx-2' onClick={(e) => {
                (async () => {
                  const result = await runModal({
                    title: t('Insert Python code'),
                    fields: {
                      type: 'Fields',
                      fields: [
                        {
                          type: 'TextareaField',
                          k: 'val',
                          label: t('Code'),
                          required: false
                        }
                      ]
                    },
                    modalSize: 'md',
                    value: {
                      val: ''
                    }
                  })
                  if (result) {
                    setCode(result.val.replaceAll('\r\n', '\n'.replaceAll('\r', '\n')))
                  }
                })()
              }}
              >
                Insert Python Code
              </button>
            </h5>

            <div className='col d-flex flex-column' style={{ overflow: 'hidden' }}>
              <div style={{ overflow: 'hidden' }}>
              </div>
              <Code01Wrapper code={code} setExpanded={setExpanded} />
            </div>
          </div>
          <div className='col d-flex flex-column flex-grow-1'>
            <h5>
              Structure
            </h5>
            <div className="form-control flex-grow-1">wow2 </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Python02Explorer
