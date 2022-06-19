import React, { useState, useEffect, useRef, memo } from "react";
import {
  formComponents,
  validateDefinition,
  definitionIsInvalid,
  FormComponent,
  GenericForm,
  formValidators,
  fieldsLayouts,
  FieldLabel,
} from "./logicore-forms";
import { v4 as uuidv4 } from "uuid";
import classd from "classd";
import keycode from "keycode";
import _ from "lodash";
import { axios } from "./imports";

import {
  pathToUpdate,
  getByPath,
  setByPath,
  update,
} from "./logicore-forms/utils";

import { Button, Modal } from "react-bootstrap";

import PythonNode from "./file-formats/python";

export default function PickFilePositionsField({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
  disabled,
}) {
  const id = "id_" + uuidv4();
  const { label } = definition;
  const ref = useRef(null);

  const [val, setVal] = useState({});

  const getFileNodes = async () => {
    const resp = await axios.get(`/get-file-nodes/?path=${definition.filePath}&basePath=${definition.basePath}`);
    setVal(resp.data);
  }

  useEffect(() => {
    getFileNodes();
    /*setTimeout(() => {
      ref?.current.focus();
    }, 100);*/
  }, []);

  return (
    <FieldLabel definition={definition} id={id} context={context}>
        <div className="d-flex flex-column" style={{maxHeight: '60vh', fontFamily: "var(--bs-font-monospace)"}}>
        <div className="d-flex flex-column flex-1" style={{overflow: 'hidden'}}>
        <div className="flex-1" style={{overflowY: 'auto'}}>
          <div>
            {val?.code ? <PythonNode {...val.code} /> : <em>Loading...</em>}
          </div>
        </div>
        </div>
        </div>
      {error && <div className="invalid-feedback d-block">{error}</div>}
    </FieldLabel>
  );
};


