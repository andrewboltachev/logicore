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

const ModalProvider = ({ children }) => {
  const [value, onChange] = useState(null);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState(null);
  const [config, setConfig] = useState({});
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
    const error = validateDefinition(config?.fields, value);
    setErrors(error);
    if (!definitionIsInvalid(config?.fields, error, value)) {
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
  const runModal = (config, value, cb) => {
    setConfig(config);
    onChange(value);
    setCallback(cb);
    setShow(true);
  };
  //container={(_) => document.getElementById("bootstrap-modals")}
  return (
    <ModalContext.Provider value={{ runModal }}>
      <Modal
        show={show}
        onHide={handleClose}
        animation={false}
        size={context?.modalSize || "lg"}
      >
        <Modal.Header closeButton>
          <Modal.Title>{config.title || "Edit"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <FormComponent
              definition={{ ...config?.fields, layout: void 0 }}
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
      {children}
    </ModalContext.Provider>
  );
};

export { ModalProvider, ModalContext };
