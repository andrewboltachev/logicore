// Global libs
import _ from "lodash";

// React
import React, { useState, useContext, useRef, useEffect } from "react";

// React modules
import { useTranslation, Trans } from "react-i18next";
import { Button, Modal } from "react-bootstrap";
import { useDraggable } from "react-use-draggable-scroll";
import { NotificationManager } from "react-notifications";

// Local React and general modules
import { ModalProvider, ModalContext, modalComponents } from "../runModal";
import { onPath, ScrollArea } from "./commons";
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


const Editor = (props) => {
  return (
    <div className="">
      <div className="row">
        <div className="col-md-3">1</div>
        <div className="col-md-9">2</div>
      </div>
    </div>
  );
}

export default {
  Editor,
};
