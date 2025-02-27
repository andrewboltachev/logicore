import React, { useState, useEffect, useRef, memo, createContext } from 'react'
import {
  formComponents,
  validateDefinition,
  definitionIsInvalid,
  FormComponent,
  GenericForm,
  formValidators,
  fieldsLayouts,
  FieldLabel
} from './logicore-forms'
import { v4 as uuidv4 } from 'uuid'
import classd from 'classd'
import _ from 'lodash'
import {
  pathToUpdate,
  getByPath,
  setByPath,
  update
} from './logicore-forms/utils'

import { Button, Modal } from 'react-bootstrap'

const FormModal = (config) => {
  const { resolve, validate } = config
  const [value, onChange] = useState(config.value)
  const [errors, setErrors] = useState(null)
  const context = config?.context || {}
  const onReset1 = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null)
  }
  const handleSubmit = () => {
    const error = validateDefinition(config?.fields, value)
    let outerError = null
    let isError = false
    if (definitionIsInvalid(config?.fields, error, value)) {
      setErrors(error)
      isError = true
    } else if (validate) {
      outerError = validate(value)
      if (outerError) {
        setErrors(outerError)
        isError = true
      }
    }
    console.log({ error, isError, validate, value, outerError })
    if (!isError) {
      // ok
      console.log('run cb', value)
      resolve(value)
      // onReset(path);
    } else {
      /* NotificationManager.error(
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
      }, 50); */
    }
  }
  return (
    <>
      <Modal.Body>
        <FormComponent
          definition={{ ...config?.fields, layout: void 0 }}
          value={value}
          onChange={onChange}
          error={errors}
          onReset={onReset1}
          path={[]}
          context={{
            ...context,
            forceLabelWidth: '100%',
            labelPlacement: 'horizontalPlus',
            handleSubmit
          }}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant='secondary' onClick={() => resolve(null)}>
          Close
        </Button>
        <Button variant='primary' onClick={handleSubmit}>
          OK
        </Button>
      </Modal.Footer>
    </>
  )
}

const modalComponents = {
  FormModal
}

const ModalContext = createContext(null)

const ModalProvider = ({ children }) => {
  const [modals, setModals] = useState({})
  const runModal = (config) => {
    const id = 'id_' + uuidv4()
    return new Promise((doResolve, doReject) => {
      const resolve = (result) => {
        setModals(update(modals, { $unset: [id] }))
        doResolve(result)
      }
      const reject = (error) => {
        setModals(update(modals, { $unset: [id] }))
        doReject(error)
      }
      setModals(
        update(modals, {
          [id]: {
            $set: { ...config, level: modals.length + 1, resolve, reject }
          }
        })
      )
    })
  }
  // container={(_) => document.getElementById("bootstrap-modals")}
  return (
    <ModalContext.Provider value={{ runModal }}>
      {_.sortBy(Object.entries(modals), ([_, { level }]) => level).map(
        ([id, config]) => {
          const { level, component, modalSize, title, resolve } = config
          const closeThis = () => resolve(null)
          const ModalComponent =
            typeof component === 'object'
              ? component
              : modalComponents[component || 'FormModal']
          return (
            <Modal
              key={id}
              show
              onHide={closeThis}
              animation={false}
              size={modalSize || 'lg'}
            >
              <Modal.Header closeButton>
                <Modal.Title>{title || 'Edit'}</Modal.Title>
              </Modal.Header>
              <ModalComponent id={id} {...config} />
            </Modal>
          )
        }
      )}
      {children}
    </ModalContext.Provider>
  )
}

export { ModalProvider, ModalContext, modalComponents }
