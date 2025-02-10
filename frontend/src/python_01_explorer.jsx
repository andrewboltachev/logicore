import {onPath} from "./editors/commons";
import React, {useContext, useState, useEffect, useRef, useCallback, forwardRef, useMemo} from "react";
import {getByPath, setByPath} from "./logicore-forms";
import {ModalContext} from "./runModal";
import _ from "lodash";
import { useLocalStorage } from "@uidotdev/usehooks";

import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
import {axios} from "./imports.jsx";
hljs.registerLanguage('python', python);

/*function highlight(data_type, data) {
  return new Promise((resolve, reject) => {
    resolve()
  }
}*/

function getRectParams(r) {
  const {top, left, width, height} = {...r.toJSON()};
  return {top, left, width, height};
}

/*hljs.addPlugin( {
    'after:highlightElement': (...args) => {
        // move the language from the result into the dataset
        console.log('afterHighlight', args);
    },
    'after:highlight': (...args) => {
        // move the language from the result into the dataset
        console.log('afterHighlight', args);
    },
})*/

function mouseUpHandler(
    event,
    textAreaRef,
    setTextOverlayShouldBeVisible,
    setTextSelection,
    cursorClickStartRef,
    shouldUseCursor,
    parentRef,
    lineHeight,
) {
}
function mouseDownHandler(
    event,
) {
}


const CodeDisplay = ({code, highlighted}) => {
    const codeRef = useRef(null);
    const [position, setPosition] = useState({x: 0, y: 0});
    /*const spans = useEffect(() => {
        let node = codeRef.current;
        [...node.children].forEach(c => c.remove());
        if (!code) return;
        const spanClick = (e) => {
            console.log(e.target.dataset.i);
        };
        Array.from(code).forEach((ch, i) => {
            const span = document.createElement('span');
            span.innerText = ch;
            span.dataset['i'] = i;
            span.style.fontWeight = 'bold';
            span.onclick = spanClick;
            node.appendChild(span);
        });
    }, [code]);*/
    const lines = useMemo(() => {
        return code.split('\n').map((s) => s.length + 1);
    }, [code]);
    const handleMovement = useCallback(() => {
        if (!lines) return;
        if (!codeRef.current) return;
        //console.log(codeRef.current.selectionEnd);
        let s = 0;
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const left = codeRef.current.selectionEnd - s;
            if (left < line) {
                setPosition({y: i, x: left});
                return;
            }
            s += line;
        }
    }, [lines]);
    const handleKeydownWithinTextArea = useCallback((e) => {
        //
        handleMovement();
    });
    return (<>
        <pre>{JSON.stringify([codeRef?.current?.selectionEnd, position])}</pre>
    <div className="form-control flex-grow-1" style={{flex: 1, position: "relative", overflow: "auto"}}>
                <div style={{position: "absolute", top: 0, left: 0}}>
                    <textarea
                        id="code-textarea"
                        ref={codeRef}
                        className="code-textarea"
                        onSelect={() => {
                            handleMovement();
                        }}
                        onMouseUp={event =>
                            mouseUpHandler(
                                event,
                            )
                        }
                        onMouseDown={event => mouseDownHandler(event)}
                        aria-label={'file content'}
                        aria-readonly
                        //this prevents the virtual keyboard from being popped up when a user is on mobile
                        inputMode={'none'}
                        tabIndex={0}
                        aria-multiline
                        aria-haspopup={false}
                        //needed to disable grammarly so that random code snippets don't get highlighted as grammar errors
                        data-gramm="false"
                        data-gramm_editor="false"
                        data-enable-grammarly="false"
                        style={{
                            borderColor: "transparent",
                            borderWidth: 0,
                            backgroundColor: "transparent",
                            //caretColor: "transparent",
                            //columnRuleColor: "transparent",
                            color: "transparent",
                            caretColor: "black",
                            //color: "transparent",
                            display: "inline-block",
                            outlineColor: "transparent",
                            overscrollBehavior: "none",
                            position: "absolute",
                            margin: 0,
                            padding: "6px 12px",
                            top: 0,
                            right: 0,
                            bottom: 0,
                            left: 0,
                            textWrap: "nowrap",
                        }}
                        value={code}
                        onKeyDown={handleKeydownWithinTextArea}
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                        autoComplete="off"
                        data-ms-editor="false"
                        onDrop={e => {
                            /*
                            const text = e.dataTransfer.getData('Text')
                            try {
                                // eslint-disable-next-line no-restricted-syntax
                                const url = new URL(text)
                                window.open(url, '_blank')?.focus()
                            } catch {
                                //the thing dropped was not a URL, catch but don't do anything
                            }*/
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
                            //setIsTextAreaFocused(true)
                        }}
                    />
                    {<div style={{pointerEvents: "none", userSelect: "none", whiteSpace: "pre", padding: "6px 12px"}} id="python_01_explorer_code"
                      dangerouslySetInnerHTML={{__html: highlighted}}></div>}
                    <div className="caret" style={{
                        position: "absolute",
                        top: 6 + 23.992 * position.y,
                        left: 12 - 1 + 9.602 * position.x,
                        width: 2,
                        height: 24,
                        backgroundColor: "black",
                        zIndex: 9999,
                        pointerEvents: "none",
                        userSelect: "none"
                    }}/>
                </div>
        </div>
    </>);
};

const Python01Explorer = () => {
    // Основной
    const [code, setCode] = useLocalStorage("PYTHON_01_EXPLORER_CODE", "");
    // Производные
    const [tree, setTree] = useState(null);
    const [highlighted, setHighlighted] = useState("");

    useEffect(() => {
        const highlighted = hljs.highlight(code, {language: "python"});
        setHighlighted(highlighted.value);
        axios.post(
            "/python-to-match_result/",
            {
                code
            }
        )
    }, [code]);

    const {runModal} = useContext(ModalContext);
    let t = _.identity;
    return (
        <div className="container-fluid flex-grow-1 d-flex py-3" style={{overflow: "hidden"}}>
            <div className="row align-items-stretch flex-grow-1" style={{overflow: "hidden"}}>
                <div className="col d-flex flex-column">
                    <h5>
                        Grammar (Pseudo-Python)!{" "}
                    </h5>
                    <textarea
                        className="form-control flex-grow-1"
                    />
                </div>
                <div className="col d-flex flex-column" style={{overflow: "hidden"}}>
                    <div style={{overflow: "hidden"}}>
                    <h5>
                      Python code
                        <button className="btn btn-sm btn-primary mx-2" onClick={(e) => {
                          (async () => {
                            const result = await runModal({
                                title: t("Insert Python code"),
                                fields: {
                                    type: "Fields",
                                    fields: [
                                        {
                                            type: "TextareaField",
                                            k: "val",
                                            label: t("Code"),
                                            required: false,
                                        },
                                    ],
                                },
                                modalSize: "md",
                                value: {
                                    val: '',
                                },
                            });
                            if (result) {
                                setCode(result.val);
                            }
                          })();
                        }}
                        >
                           Insert Python Code
                        </button>
                    </h5>
                    </div>
                    <CodeDisplay code={code} highlighted={highlighted} />
                </div>
            </div>
            </div>
    );
}

export default Python01Explorer;