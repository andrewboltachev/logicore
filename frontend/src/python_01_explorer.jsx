import {onPath} from "./editors/commons";
import React, {useContext, useState, useEffect, useRef, useCallback} from "react";
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

        const { runModal } = useContext(ModalContext);
        let t = _.identity;
        const codeRef = useRef(null);
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
                            console.log('ahah');
                          })();
                        }}
                        >
                           Insert Python Code
                        </button>
                    </h5>
                    </div>
                    <div className="form-control flex-grow-1" style={{flex: 1, position: "relative", overflow: "auto"}}>
                      <div style={{position: "absolute", top: 0, left: 0, right: 0, bottom: 0, margin: "6px 12px" }}>
                          <div style={{position: "absolute", whiteSpace: "pre"}}>{Array.from(code).map((ch, i) => (<span key={i} style={{
                              color: "transparent"
                          }}>{ch}</span>))}</div>
                          {<div style={{pointerEvents: "none"}} ref={codeRef} id="python_01_explorer_code" dangerouslySetInnerHTML={{__html: highlighted}}></div>}
                      </div>
                    </div>
                </div>
            </div>
            </div>
    );
}

export default Python01Explorer;
