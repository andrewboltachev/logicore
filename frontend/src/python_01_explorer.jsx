import {onPath} from "./editors/commons";
import React, {useContext, useState, useEffect, useRef, useCallback} from "react";
import {getByPath, setByPath} from "./logicore-forms";
import {ModalContext} from "./runModal";
import _ from "lodash";
import { useLocalStorage } from "@uidotdev/usehooks";

import hljs from 'highlight.js/lib/core';
import python from 'highlight.js/lib/languages/python';
hljs.registerLanguage('python', python);

/*function highlight(data_type, data) {
  return new Promise((resolve, reject) => {
    resolve()
  }
}*/


const Python01Explorer = () => {
  // Основной
    const [code, setCode] = useLocalStorage("PYTHON_01_EXPLORER_CODE", "");
  // Производные
    const [tree, setTree] = useState(null);
    const [highlighted, setHighlighted] = useState("");

  useEffect(() => {
    const highlighted = hljs.highlight("python", code);
    setHighlighted(highlighted.value);
  }, [code]);

    const { runModal } = useContext(ModalContext);
    let t = _.identity;
    return (
        <div className="container-fluid align-items-stretch flex-grow-1 d-flex py-3">
        <div className="row align-items-stretch flex-grow-1">
            <div className="col d-flex flex-column">
                <h5>
                    Grammar (Pseudo-Python)!{" "}
                </h5>
                <textarea
                    className="form-control flex-grow-1"
                />
            </div>
            <div className="col d-flex flex-column">
                <div>
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
                <div id="python_01_explorer_code" className="form-control flex-grow-1" dangerouslySetInnerHTML={{__html: highlighted}}></div>
            </div>
        </div>
        </div>
    );
}

export default Python01Explorer;
