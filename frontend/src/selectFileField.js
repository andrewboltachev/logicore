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




const debouncedHandler = _.debounce((f, args) => f.apply(null, args), 100);

const useInternalValue = ({ value, onChange }) => {
  const [internalValue, setInternalValue] = useState(value);
  const [isFirst, setIsFirst] = useState(true);
  useEffect(() => {
    setIsFirst(false);
    if (!isFirst) debouncedHandler(onChange, [internalValue]);
  }, [internalValue]);
  return [internalValue, setInternalValue];
};

const ScrollableY = React.forwardRef(({ children, scroll, className, onChange, extra }, ref) => {
  const [internalScroll, setInternalScroll] = useInternalValue({
    value: scroll,
    onChange: v => onChange({ action: "scroll", scroll: v})
  });
  useEffect(() => {
    ref.current.scrollTo(0, internalScroll || 0);
  }, []);
  return <div className={className} onScroll={e => setInternalScroll(e.target.scrollTop)} ref={ref} tabIndex={0} {...extra}>
    {children}
  </div>;
});

const FileItem = ({ file, internalSelected, setInternalSelected }) => {
  const elementRef = useRef();
  useEffect(() => {
    if (internalSelected === file.filename) {
      elementRef?.current?.scrollIntoViewIfNeeded();
    }
  });
  return (<div
    className={classd`perspective__file ${{"perspective__file--selected": file.filename === internalSelected}}`}
    onClick={_ => setInternalSelected(file.filename)}
    ref={elementRef}
  
  >
    <div className="perspective__file-icon">
      <i className={file.icon || (file.dir ? 'fa fa-folder' : 'far fa-file')} />
    </div>
    <div className="perspective__file-field">{file.filename}</div>
  </div>);
}

const DirNode = React.forwardRef(({ value, onChange, onFocus, onTab }, ref) => {
  const { files, selected } = value;
  const [internalSelected, setInternalSelected] = useInternalValue({
    value: selected || null,
    onChange: v => onChange({ action: "select", selected: v})
  });
  useEffect(() => {
    setInternalSelected(selected);
  }, [selected, value]);
  const keyMoves = {down: 1, up: -1};
  const current = files.map(file => file.filename).indexOf(internalSelected);

  return (<div className="perspective__side">
    <code className="perspective__path">{value.path}</code>
    <ScrollableY
      ref={ref}
      className="perspective__content"
      scroll={value?.scroll}
      onChange={onChange}
      extra={
        {
          onMouseMove: e => {
            e.preventDefault();
          },
          onKeyDown: e => {
            e.preventDefault();
            e.persist();
            if (current === -1) return;
            if (keycode.isEventKey(e, "Enter")) {
              onChange({ action: "enter", enter: internalSelected, file: files[current]})
              return;
            }
            if (keycode.isEventKey(e, "Tab")) {
              onTab();
              return;
            }
            for (const [k, v] of Object.entries(keyMoves)) {
              if (keycode.isEventKey(e, k)) {
                const newIndex = current + v;
                if (newIndex >= 0 && newIndex <= files.length - 1) {
                  setInternalSelected(files[newIndex].filename);
                }
                return;
              }
            }
          },
          onFocus,
        }
      }
    >
      <div className="perspective__files">
        {files.map(file => <FileItem
          key={file.filename}
          file={file}
          internalSelected={internalSelected}
          setInternalSelected={setInternalSelected}
        />)}
      </div>
    </ScrollableY>
  </div>
  );
});

export default function SelectFileField({
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

  const [val, setVal] = useState({'files': [], 'path': '', selected: null});

  const getFiles = async (path) => {
    const resp = await axios.get(`/get-file/?path=${path}&basePath=${definition.basePath}`);
    setVal(resp.data);
  }

  useEffect(() => {
    getFiles(val.path);
    setTimeout(() => {
      ref?.current.focus();
    }, 100);
  }, []);

  return (
    <FieldLabel definition={definition} id={id} context={context}>
        <div className="d-flex flex-column" style={{maxHeight: '60vh'}}>
        <DirNode
          ref={ref}
          value={val}
          onChange={action => {
            if (action?.action === 'enter') {
              if (action?.file?.dir) {
                getFiles(val.path + action?.enter);
              } else if (/\.py$/i.exec(action?.file?.filename)) {
                console.log('wow python', val.path + action?.file?.filename);
                onChange(val.path + action?.file?.filename);
                context?.handleSubmit && context?.handleSubmit();
              }
            }
          }}
          onTab={_ => _}
          onFocus={_ => _}
        />
        </div>
        {error && <div className="invalid-feedback d-block">{error}</div>}
    </FieldLabel>
  );
};

