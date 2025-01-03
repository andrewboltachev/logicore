// Global libs
import _ from "lodash";

// React
import React, { useState, useContext, useRef, useEffect } from "react";

// React modules
import { useTranslation, Trans } from "react-i18next";
import { Button, Modal } from "react-bootstrap";
import { useDraggable } from "react-use-draggable-scroll";
import { NotificationManager } from "../react-notifications";

// Local React and general modules
import { ModalProvider, ModalContext, modalComponents } from "../runModal";
import { axios } from "../imports";
import { update } from "../logicore-forms/utils";
import { useLocalStorage } from "../utils";
import {
  validateDefinition,
  definitionIsInvalid,
  pathToUpdate,
  FormComponent,
  GenericForm,
  formComponents,
  FieldLabel,
  interceptors,
  fieldsLayouts,
  submitButtonWidgets,
  getByPath,
  setByPath,
  modifyHelper,
} from "../logicore-forms";

export const onPath = (value, onChange, path, f) => {
  const handler = f || _.identity;
  return {
    value: getByPath(value, path),
    onChange: (newValue) => onChange(setByPath(value, path, handler(newValue))),
  };
};

export const onPathPlus = (value, onChange, path, f) => {
  const handler = f || _.identity;
  let result = void 0;
  const getter = (struct, variables) => {
    result = struct;
  }
  modifyHelper(path, value, getter, {});
  return {
    value: result,
    onChange: (newValue) => {
      const newValueHandler = typeof newValue === 'function' ? newValue : (() => newValue);
      onChange(oldValue => modifyHelper(path, oldValue, oldSubValue => handler(newValueHandler(oldSubValue)), {}));
    },
  };
};

export const ScrollArea = ({ storageKey, prevStorageKey, children }) => {
  const innerRef = useRef(null);
  const draggable = useDraggable(innerRef);
  const { events } = draggable;
  const [state, setState] = useLocalStorage(storageKey);
  useEffect(() => {
    if (!storageKey) return;
    if (state) {
      innerRef?.current.scrollTo(state[0], state[1]);
    } else {
      console.log("try read prev state", prevStorageKey);
      let prevState = null;
      try {
        prevState = JSON.parse(window.localStorage.getItem(prevStorageKey));
      } catch (e) {
        //
        console.warn(e);
      }
      console.log("got prev state", prevState);
      if (Array.isArray(prevState)) {
        innerRef?.current.scrollTo(prevState[0], prevState[1]);
        //setState(prevState[0], prevState[1]);
      }
    }
  }, [!state, storageKey]);
  return (
    <div className="lc-adt-editor">
      <div
        className="lc-adt-editor-wrapper"
        ref={innerRef}
        {...events}
        onScroll={(e) => {
          if (storageKey) setState([e.target.scrollLeft, e.target.scrollTop]);
        }}
      >
        <div className="lc-adt-editor-inner">{children}</div>
      </div>
    </div>
  );
};
