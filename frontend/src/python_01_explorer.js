import {onPath} from "./editors/commons";
import React from "react";

const Python01Explorer = () => {
    return (
        <div className="container-fluid align-items-stretch flex-grow-1 d-flex py-3">
        <div className="row align-items-stretch flex-grow-1">
            <div className="col d-flex flex-column">
                <h5>
                    Grammar (Pseudo-Python){" "}
                    <button className="btn btn-sm btn-primary">
                        Grammar × Code -> Thin value
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