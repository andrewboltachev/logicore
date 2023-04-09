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

const FormModal = () => {
  const [value, onChange] = useState(null);
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState(null);
  const [config, setConfig] = useState({});
  const cb = useRef(null);
  const context = config?.context || {};
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
      console.log("run cb");
      cb?.current(value);
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
  const runModal = (config, value, cbNew) => {
    setConfig(config);
    onChange(value);
    cb.current = cbNew;
    setShow(true);
  };
  //container={(_) => document.getElementById("bootstrap-modals")}
  return (
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
  );
};

const modalComponents = {
  FormModal,
};

const ModalContext = createContext(null);

const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({});
  const runModal = (config) => {
    const id = "id_" + uuidv4();
    return new Promise((resolve, reject) => {
      setModals(
        update(modals, {
          [id]: {
            $set: { ...config, level: modals.length + 1, resolve, reject },
          },
        })
      );
    });
  };
  return (
    <ModalContext.Provider value={{ runModal }}>
      {_.sortBy(Object.entries(modals), ([_, { level }]) => level).map(
        ([id, config]) => {
          const { level, component, modalSize, title, resolve } = config;
          const closeThis = () => {
            setModals(update(modals, { $unset: [id] }));
            resolve(null);
          };
          const ModalComponent = modalComponents[component || "FormModal"];
          return (
            <Modal
              show={true}
              onHide={closeThis}
              animation={false}
              size={modalSize || "lg"}
            >
              <Modal.Header closeButton>
                <Modal.Title>{title || "Edit"}</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <ModalComponent id={id} {...config} />
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={closeThis}>
                  Close
                </Button>
                <Button variant="primary" onClick={closeThis}>
                  OK
                </Button>
              </Modal.Footer>
            </Modal>
          );
        }
      )}
      {children}
    </ModalContext.Provider>
  );
};

export { ModalProvider, ModalContext, modalComponents };
