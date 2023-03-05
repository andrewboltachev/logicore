import React, { useState, useEffect, useRef, memo, createContext } from "react";
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
import _ from "lodash";
import {
  pathToUpdate,
  getByPath,
  setByPath,
  update,
} from "./logicore-forms/utils";

import { Button, Modal } from "react-bootstrap";

const ModalContext = createContext(null);

const ModalProvider = () => {
  const [value, onChange] = useState(null);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState(null);
  const [definition, setDefinition] = useState({});
  const [cb, setCallback] = useState({});
  const context = {};
  /*useEffect(() => {
    setState(value);
    setErrors(null);
  }, [show]);*/
  const onReset1 = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };
  const handleClose = (_) => setShow(false);
  const handleSubmit = () => {
    const error = validateDefinition(definition, value);
    setErrors(error);
    if (!definitionIsInvalid(definition, error, value)) {
      // ok
      cb && cb(value);
      //onReset(path);
      handleClose();
    } else {
      /*NotificationManager.error(
        "Please fix the errors below",
        "Error"
      );
      setTimeout(() => {
        try {
          document
            .getElementsByClassName("invalid-feedback d-block")[0]
            .parentNode.scrollIntoViewIfNeeded();
        } catch (e) {
          console.warn(e);
        }
      }, 50);*/
    }
  };
  const runModal = (definition, value, cb) => {
    setDefinition(definition);
    onChange(value);
    setCallback(cb);
    setShow(true);
  };
  return (
    <ModalContext.Provider runModal={runModal}>
      <Modal
        show={!!definition?.fields}
        onHide={handleClose}
        animation={false}
        container={(_) => document.getElementById("bootstrap-modals")}
        size={context?.modalSize || "lg"}
      >
        <Modal.Header closeButton>
          <Modal.Title>{definition.title || "Edit"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <FormComponent
              definition={{ ...definition, layout: void 0 }}
              value={value}
              onChange={onChange}
              error={errors}
              onReset={onReset1}
              path={[]}
              context={{
                ...context,
                forceLabelWidth: "100%",
                labelPlacement: "horizontalPlus",
                handleSubmit,
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            OK
          </Button>
        </Modal.Footer>
      </Modal>
    </ModalContext.Provider>
  );
};

export { ModalProvider, ModalContext };
