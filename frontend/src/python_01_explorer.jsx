import {onPath} from "./editors/commons";
import React, {useContext, useState, useEffect, useRef, useCallback, forwardRef} from "react";
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

hljs.addPlugin( {
    'after:highlightElement': (...args) => {
        // move the language from the result into the dataset
        console.log('afterHighlight', args);
    },
    'after:highlight': (...args) => {
        // move the language from the result into the dataset
        console.log('afterHighlight', args);
    },
})

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
    if (!shouldUseCursor || event.defaultPrevented || !cursorClickStartRef) return

    if (event.button === 2) {
        event.preventDefault()
        event.stopPropagation()
        //it was a right click
    } else if (event.button === 0) {
        setTextOverlayShouldBeVisible(false)

        const screenSize = getCurrentSize(window.innerWidth)

        const isSmallScreen = screenSize < ScreenSize.medium
        const scrollTopOffset = parentRef.current?.getBoundingClientRect().top
            ? window.scrollY + parentRef.current?.getBoundingClientRect().top
            : isSmallScreen
                ? approximateBlobYOffsetMobile
                : approximateBlobYOffsetDesktop
        // Check if it the click is in the lines excluding the scroll bar
        if (parentRef.current && event.pageY > scrollTopOffset + parentRef.current?.clientHeight) {
            cursorClickStartRef.current = {startX: -2, startY: -2}
            return
        }
        const lineNumberOfClick = calculateLineNumberFromOffset(event.pageY, scrollTopOffset, lineHeight)
        const leftClickOffset = parentRef.current?.getBoundingClientRect().left || 0
        const xOffset = event.clientX - leftClickOffset - minLeftOffsetBlob

        let displayAtStart = false
        if (
            lineNumberOfClick < cursorClickStartRef.current.startY ||
            (lineNumberOfClick === cursorClickStartRef.current.startY && xOffset < cursorClickStartRef.current.startX)
        ) {
            displayAtStart = true
        }
        setTimeout(() => {
            if (textAreaRef && textAreaRef.current) {
                setTextSelection({
                    start: textAreaRef.current.selectionStart,
                    end: textAreaRef.current.selectionEnd,
                    keyboard: false,
                    displayStart: displayAtStart,
                })
            }
        }, 0)
    }
}
function mouseDownHandler(
    event,
    parentRef,
    shouldUseCursor,
    cursorClickStartRef,
    lineHeight,
) {
    if (!shouldUseCursor || event.defaultPrevented || !cursorClickStartRef) return
    if (event.button === 2) {
        event.preventDefault()
        event.stopPropagation()
        return
        //it was a right click
    } else if (event.button === 0) {
        //it was a left click

        // eslint-disable-next-line @github-ui/ui-commands/no-manual-shortcut-logic
        if (event.ctrlKey) {
            //it was a right click essentially
            event.preventDefault()
            event.stopPropagation()
            return
        }

        const screenSize = getCurrentSize(window.innerWidth)

        const isSmallScreen = screenSize < ScreenSize.medium
        const scrollTopOffset = parentRef.current?.getBoundingClientRect().top
            ? window.scrollY + parentRef.current?.getBoundingClientRect().top
            : isSmallScreen
                ? approximateBlobYOffsetMobile
                : approximateBlobYOffsetDesktop
        // Check if it the click is in the lines excluding the scroll bar
        if (parentRef.current && event.pageY > scrollTopOffset + parentRef.current?.clientHeight) {
            cursorClickStartRef.current = {startX: -2, startY: -2}
            return
        }
        const lineNumberOfClick = calculateLineNumberFromOffset(event.pageY, scrollTopOffset, lineHeight)
        const leftClickOffset = parentRef.current?.getBoundingClientRect().left || 0
        const xOffset = event.clientX - leftClickOffset - minLeftOffsetBlob
        cursorClickStartRef.current = {startX: xOffset, startY: lineNumberOfClick}
    }
}


const CodeDisplay = ({code, highlighted}) => {
    const codeRef = useRef(null);
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
    const handleKeydownWithinTextArea = useCallback((e) => {
        //e.preventDefault();
    });
    return (
        <div className="form-control flex-grow-1" style={{flex: 1, position: "relative", overflow: "auto"}}>
                <div style={{position: "absolute", top: 0, left: 0}}>
                    <textarea
                        className="code-textarea"
                        onMouseUp={event =>
                            mouseUpHandler(
                                event,
                                textAreaRef,
                                setTextOverlayShouldBeVisible,
                                setTextSelection,
                                cursorClickStartRef,
                                shouldUseCursor,
                                parentRef,
                                lineHeight,
                            )
                        }
                        onMouseDown={event => mouseDownHandler(event, parentRef, shouldUseCursor, cursorClickStartRef, lineHeight)}
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
                {<div style={{pointerEvents: "none", whiteSpace: "pre", padding: "6px 12px"}} id="python_01_explorer_code"
                      dangerouslySetInnerHTML={{__html: highlighted}}></div>}
                </div>
        </div>
    );
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