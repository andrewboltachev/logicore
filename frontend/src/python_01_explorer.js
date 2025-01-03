import {onPath} from "./editors/commons";
import React, {useContext, useState} from "react";
import {getByPath, setByPath} from "./logicore-forms";
import {ModalContext} from "./runModal";
import _ from "lodash";

const Python01Explorer = () => {
    const [code, setCode] = useState("");
    const { runModal } = useContext(ModalContext);
    let t = _.identity;
    return (
        <div className="container-fluid align-items-stretch flex-grow-1 d-flex py-3">
        <div className="row align-items-stretch flex-grow-1">
            <div className="col d-flex flex-column">
                <h5>
                    Grammar (Pseudo-Python)!{" "}
                    <button className="btn btn-sm btn-primary" onClick={(e) => {
                        /*const result = await runModal({
                            title: t("Insert Python code"),
                            fields: {
                                type: "Fields",
                                fields: [
                                    {
                                        type: "TextField",
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
                            /*const current = { ...getByPath(value, path) };
                            delete current[k];
                            current[result.val] = v;
                            onChange(setByPath(value, path, current));* /
                        }*/
                        console.log('ahah');
                    }}
                    >
                       Insert Python Code 
                    </button>
                </h5>
                <textarea
                    className="form-control flex-grow-1"
                />
                <h5>
                    Thin value (JSON)
                    <button className="btn btn-sm btn-primary">
                        Thin Value × Grammar -> Code
                    </button>
                </h5>
                <textarea className="form-control flex-grow-1" value="No thin value" disabled/>
            </div>
            <div className="col d-flex flex-column">
                <h5>
                Python code
                </h5>
                <textarea
                    className="form-control flex-grow-1"
                />
                <h5>Funnel Result</h5>
                <div className="form-control flex-grow-1"/>
            </div>
        </div>
        </div>
    );
}

export default Python01Explorer;
