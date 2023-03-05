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

export default function runModal(props) {
  const { value, onChange, definition, error, context, onReset, path } = props;
  /* this is Fields, but renderedFields are thrown away */
  const [show, setShow] = useState(false);
  const [state, setState] = useState(value);
  const [errors, setErrors] = useState(null);
  useEffect(() => {
    //console.log('reset to', value);
    setState(value);
    setErrors(null);
  }, [show]);
  const onReset1 = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null);
  };
  const handleClose = (_) => setShow(false);
  const handleSubmit = () => {
    const error = validateDefinition(definition, state);
    setErrors(error);
    if (!definitionIsInvalid(definition, error, state)) {
      // ok
      console.log("onchaaaaaaaaaaaaaange", state);
      onChange(state);
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
  return {
    state,
    setShow,
    element: (
      <Modal
        show={show}
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
            <div>{JSON.stringify(state)}</div>
            <FormComponent
              definition={{ ...definition, layout: void 0 }}
              value={state}
              onChange={setState}
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
    ),
  };
}

const ModalContext = createContext(null);

const ModalProvider = () => {
  return (
    <>
      <Modal
        show={show}
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
              value={state}
              onChange={setState}
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
    </>
  );
};

export { ModalProvider };
