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

// Module-local
import "./pythonmatcher.scss";

const eV = (e) => e.target.value || "";

const PythonMatcherEditor = ({
  revId,
  prevRevId,
  value,
  onChange,
  saveButton,
}) => {
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  const step1 = async () => {
    let result = null;
    let resp = null;
    try {
      resp = await axios.post("/python-api/step1", {
        grammar: value.grammar,
        code: value.code,
      });
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    if (resp.data.error) {
      NotificationManager.error("", resp.data.error, 50000);
      return;
    }
    NotificationManager.info("", t("Thin value generated"));
    onChange(
      update(value, {
        thinValue: { $set: JSON.stringify(resp.data.thinValue) },
      })
    );
  };
  const step2 = async () => {
    let result = null;
    let resp = null;
    let thinValue = null;
    try {
      thinValue = JSON.parse(value.thinValue);
    } catch (e) {
      NotificationManager.warning("", t("Thin value JSON parsing error"));
      console.error(e);
      return;
    }
    try {
      resp = await axios.post("/python-api/step2", {
        grammar: value.grammar,
        thinValue,
      });
    } catch (e) {
      NotificationManager.warning("", t("Unknown error"));
      console.error(e);
      return;
    }
    if (resp.data.error) {
      NotificationManager.error("", resp.data.error);
      return;
    }
    NotificationManager.info("", t("Code generated"));
    onChange(
      update(value, {
        code: { $set: resp.data.code },
      })
    );
  };
  return (
    <div className="row align-items-stretch flex-grow-1">
      <div className="col d-flex flex-column">
        <h5>
          Grammar (Pseudo-Python){" "}
          <button className="btn btn-sm btn-primary" onClick={step1}>
            Grammar × Code -&gt; Thin value
          </button>
        </h5>
        <textarea
          {...onPath(value, onChange, ["grammar"], eV)}
          className="form-control flex-grow-1"
        />
        <h5>
          Thin value (JSON)
          <button className="btn btn-sm btn-primary" onClick={step2}>
            Thin Value × Grammar -&gt; Code
          </button>
        </h5>
        {value?.thinValue ? <textarea
          {...onPath(value, onChange, ["thinValue"], eV)}
          className="form-control flex-grow-1"
        /> : <textarea className="form-control flex-grow-1" value="No thin value" disabled />}
        <div className="d-grid">{saveButton}</div>
      </div>
      <div className="col d-flex flex-column">
        <h5>
          Python code
          {/*<button className="btn btn-sm btn-primary">Run</button>*/}
        </h5>
        <textarea
          {...onPath(value, onChange, ["code"], eV)}
          className="form-control flex-grow-1"
        />
        <h5>Funnel Result</h5>
        <div className="form-control flex-grow-1" />
      </div>
    </div>
  );
};

export default {
  Editor: PythonMatcherEditor,
};
