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
import "./jsonmatcher.scss";
import exampleData from "./jsonmatcher_example";
import schema from "./jsonmatcher_schema";

const PythonMatcherEditor = ({
  revId,
  prevRevId,
  value,
  onChange,
  saveButton,
}) => {
  const { t } = useTranslation();
  const { runModal } = useContext(ModalContext);
  //const [value, onChange] = useState(exampleData.value);
  const [selectedPath, setSelectedPath] = useState([]);
  const processedSchema = [...standardSchema, ...schema];
  const [right, setRight] = useState({ value: null });
  const getActions = (theType) => {
    if (theType?.value === "MatchResult") {
      return [
        {
          icon: "fa fa-cog",
          className: "text-success",
          run: async ({ value, onChange, path, runModal }) => {
            console.log("willl work", value);
            const result = getByPath(value, path);
            let resp = null;
            let left = null;
            let right = null;
            try {
              resp = await axios.post("/haskell-api/matchResultToPattern", {
                result,
              });
            } catch (e) {
              NotificationManager.warning("", t("Unknown error"));
              return;
            }
            if (resp.data.error) {
              NotificationManager.error("", resp.data.error);
              return;
            }
            left = resp.data.pattern;
            try {
              resp = await axios.post("/haskell-api/matchResultToValue", {
                result,
              });
            } catch (e) {
              NotificationManager.warning("", t("Unknown error"));
              return;
            }
            if (resp.data.error) {
              NotificationManager.error("", resp.data.error);
              return;
            }
            right = resp.data.value;
            // else, if all ok
            const newMatchPattern = await runModal({
              title: t("Split into Grammar and Value"),
              component: "ADTEditorGrammarValueModal",
              fields: {
                type: "Fields",
                fields: [
                  {
                    type: "ADTEditorGrammarValue",
                    k: "val",
                    label: t("Value"),
                    required: true,
                    t1: {
                      type: "ConT",
                      value: "MatchPattern",
                    },
                  },
                ],
              },
              modalSize: "xl",
              value: {
                val: { left, right },
              },
            });
            if (newMatchPattern) {
              onChange(setByPath(value, path, newMatchPattern));
            }
          },
        },
        {
          icon: "fa fa-cog",
          className: "text-warning",
          run: async ({ value, onChange, path, runModal }) => {
            console.log("willl work", value);
            const result = getByPath(value, path);
            let resp = null;
            let left = null;
            let right = null;
            try {
              resp = await axios.post("/haskell-api/matchResultToPattern", {
                result,
              });
            } catch (e) {
              NotificationManager.warning("", t("Unknown error"));
              return;
            }
            if (resp.data.error) {
              NotificationManager.error("", resp.data.error);
              return;
            }
            left = resp.data.pattern;
            try {
              resp = await axios.post("/haskell-api/matchResultToThinValue", {
                result,
              });
            } catch (e) {
              NotificationManager.warning("", t("Unknown error"));
              return;
            }
            if (resp.data.error) {
              NotificationManager.error("", resp.data.error);
              return;
            }
            right = resp.data.thinValue;
            // else, if all ok
            const newMatchPattern = await runModal({
              title: t("Edit Thin Value"),
              component: "ADTEditorThinValueModal",
              fields: {
                type: "Fields",
                fields: [
                  {
                    type: "TextareaField",
                    k: "val",
                    label: t("Value"),
                    required: true,
                    t1: {
                      type: "ConT",
                      value: "MatchPattern",
                    },
                  },
                ],
              },
              modalSize: "xl",
              value: {
                left,
                right,
              },
            });
            if (newMatchPattern) {
              onChange(setByPath(value, path, newMatchPattern));
            }
          },
        },
      ];
    }
  };
  useEffect(() => {
    (async () => {
      if (!value?.left) return;
      let resp = null,
        right = null;
      try {
        resp = await axios.post("/haskell-api/matchResultToValue", {
          result: value.left,
        });
      } catch (e) {
        //NotificationManager.warning("", t("Unknown error"));
        setRight({ value: "---not defined---" });
        return;
      }
      if (resp.data.error) {
        //NotificationManager.error("", resp.data.error);
        setRight({ value: `Error: ${resp.data.error}` });
        return;
      }
      right = resp.data;
      setRight(right);
    })();
  }, [value?.left]);
  return (
    <div className="row align-items-stretch flex-grow-1">
      {/*<button type="button" onClick={e => {e.preventDefault(); setShow();}}>Modal</button>*/}
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1">
          <ScrollArea
            storageKey={`scroll-left-${revId}`}
            prevStorageKey={prevRevId ? `scroll-left-${prevRevId}` : null}
          >
            <ADTEditorNode
              {...onPath(value, onChange, ["left"])}
              onSelect={setSelectedPath}
              path={[]}
              type={callType(processedSchema, t1)}
              schema={processedSchema}
              schemaConversions={schemaConversions1}
              selectedPath={selectedPath}
              getActions={getActions}
            />
          </ScrollArea>
        </div>
        <div className="d-grid">{saveButton}</div>
      </div>
      <div className="col d-flex flex-column">
        <div>
          <div className="btn-group">
            <button
              className="btn btn-sm btn-outline-primary"
              type="button"
              onClick={async () => {
                const result = await runModal({
                  title: t("Insert JSON"),
                  fields: {
                    type: "Fields",
                    fields: [
                      {
                        type: "TextareaField",
                        k: "val",
                        label: t("Value"),
                        required: true,
                      },
                    ],
                  },
                  modalSize: "md",
                  value: {
                    val: "",
                  },
                });
                if (!result) return;
                let resp = null;
                let arg = null;
                try {
                  arg = JSON.parse(result.val);
                } catch (e) {
                  NotificationManager.error("", t("JSON parsing error"));
                }
                try {
                  resp = await axios.post("/haskell-api/valueToExactResult", {
                    value: arg,
                  });
                } catch (e) {
                  NotificationManager.warning("", t("Unknown error"));
                }
                if (resp.data.error) {
                  NotificationManager.error("", resp.data.error);
                } else {
                  NotificationManager.info("", t("Added JSON"));
                  onChange({ left: resp.data.result });
                }
              }}
            >
              <i className="fa fa-paste" /> <Trans>Add JSON</Trans>
            </button>
          </div>
        </div>
        <div className="form-control flex-grow-1">
          <ScrollArea
            storageKey={`scroll-right-${revId}`}
            prevStorageKey={prevRevId ? `scroll-right-${prevRevId}` : null}
          >
            <JSONNode value={right?.value} />
          </ScrollArea>
        </div>
        {/*<div className="d-grid">
          <button className="btn btn-success mt-2" type="button" onClick={_ => _}>
            <i className="fa fa-play-circle" />{" "}
            <Trans>Run</Trans>
          </button>
        </div>*/}
      </div>
    </div>
  );
};

export default {
  Editor: JSONMatcherEditor,
};
