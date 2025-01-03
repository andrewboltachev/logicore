import React, { useState, useEffect, useRef, memo } from "react";
import {
  FieldLabel,
  FormComponent,
  validateDefinition,
  definitionIsInvalid,
} from "../logicore-forms";
import { v4 as uuidv4 } from "uuid";

/* Ideas
 * 1. Form definition as schema. Validation using it
 * 2. RefField - reference to another place in a system
 * 3. (*) Scope of RefField (it's deletable area?) and dependencies - auto-removal
 * 4. (**) Links auto-establishment (e.g. document -> form) using strategy
 * 5. FlowField — close analogue of ForeignKeyListField
 *
 * Additional:
 * FormWithRefs <-> Graph conversion
 */
/*
{
            type: 'Fields',
            fields: [
              {k: 'fields', 'type': 'UUIDListField', addWhat: 'field',
                layout: 'WithDeleteButton',
                fields: [
                  {
                    k: 'name',
                    type: 'TextField',
                    label: 'Name',
                  },
                  {
                    k: 'type',
                    type: 'SelectField',
                    label: 'Type',
                    options: [
                      {value: 'CharField', label: 'CharField'},
                      {value: 'IntegerField', label: 'IntegerField'},
                      {value: 'BooleanField', label: 'BooleanField'},
                    ],
                  },
                ],
                //refValue: ({ name, i }) => {
                //  return {'value': i, label: name};
                //},
              },
              {k: 'ordering', 'type': 'ForeignKeyListField', addWhat: 'ordering',
                layout: 'WithDeleteButton',
                fields: [
                  {
                    k: 'field',
                    type: 'SelectField',
                    label: 'Field',
                  },
                ],
              },
            ],
              //interceptor: 'RefsInterceptor',
            refsSource: ['fields'],
            refsNest: ['ordering'],
            refsTarget: ['field'],
            refsLabel: (item) => {
              return item?.name || '(no name)';
            },
          }
          */

const FIELD_DEF = { 
  "type": "Fields",
  "fields": [
    { 
      "type": "Fields",
      "fields": [
        {
          "type": "TextField",
          "k": "k",
          "label": "K",
          "required": true, // TODO k not on fields?
        },
        {
          "type": "TextField",
          "k": "label",
          "label": "Label",
          "required": false,
        },
        {
          "type": "BooleanField",
          "k": "required",
          "label": "Required?",
          "required": false,
        },
        {
          "type": "SelectField",
          "k": "type",
          "label": "Type",
          "required": true,
          "options": [
            {"value": "Fields", "label": "Fields"},
            {"value": "HiddenField", "label": "HiddenField"},
            {"value": "TextField", "label": "TextField"},
            {"value": "TextareaField", "label": "TextareaField"},
            {"value": "BooleanField", "label": "BooleanField"},
            {"value": "NumberField", "label": "NumberField"},
            {"value": "SelectField", "label": "SelectField"},
            {"value": "DefinedField", "label": "DefinedField"},
            {"value": "ForeignKeyListField", "label": "ForeignKeyListField"},
          ],
        },
        // TODO validators (type-dependant?)
        {
          "type": "DefinedField",
          "k": "definition",
          "master_field": "type",
          "definitions": {
            "Fields": {
              "type": "Fields",
              "fields": [
                {
                  "type": "RecursiveListField",
                  "k": "fields",
                  "label": "Fields",
                  "definition_id": "id_of_the_field",
                  "layout": "WithDeleteButton",
                },
                {
                  "type": "TextField",
                  "k": "layout",
                  "label": "Layout", // TODO pre-fill?
                },
              ],
              "id": "id_of_the_fields",
            },
            "HiddenField": {"type": "Fields", "fields": []},
            "TextField": {
              "type": "Fields",
              "fields": [
                {
                  "type": "SelectField",
                  "k": "subtype",
                  "label": "Sub-type",
                  "options": [
                    {"value": "text", "label": "Text"},
                    {"value": "password", "label": "Password"},
                    {"value": "email", "label": "Email"},
                  ]
                },
                {
                  "type": "TextField",
                  "k": "placeholder",
                  "label": "Placeholder",
                },
              ]
            },
            "TextareaField": {
              "type": "Fields",
              "fields": [
                {
                  "type": "TextField",
                  "k": "placeholder",
                  "label": "Placeholder",
                },
              ]
            },
            "BooleanField": {"type": "Fields", "fields": []},
            "NumberField": {
              "type": "Fields",
              "fields": [
                {
                  "type": "TextField",
                  "k": "placeholder",
                  "label": "Placeholder",
                },
              ],
            },
            "SelectField": {
              "type": "Fields",
              "fields": [
                {
                  "type": "UUIDListField", // TODO
                  "k": "options",
                  "label": "Options",
                  "fields": [
                    {
                      "type": "TextField",
                      "k": "value",
                      "label": "Value",
                      "required": true,
                      // TODO validate machine-readable value?
                      // TODO interceptor-validate uniqueness for value
                    },
                    {
                      "type": "TextField",
                      "k": "label",
                      "label": "Label",
                      "required": true,
                    },
                  ],
                  "layout": "WithDeleteButton",
                },
                {
                  "type": "TextField",
                  "k": "placeholder",
                  "label": "Placeholder",
                  "required": false,
                },
                {
                  "type": "BooleanField",
                  "k": "multiple",
                  "label": "Multiple?",
                  "required": false,
                },
                /*{
                  "type": "BooleanField",
                  "k": "disabled",
                  "label": "Disabled?"
                  "required": false,
                },*/
              ]
            },
            "DefinedField": {
              "type": "Fields",
              "fields": [
                {
                  "type": "TextField",
                  "k": "master_field",
                  "label": "Master field",
                },
                {
                  "type": "UUIDListField", // MapField
                  "k": "definitions",
                  "label": "Definitions",
                  "fields": [
                    {
                      "type": "TextField",
                      "k": "value",
                      "label": "Value",
                      "required": true,
                      // TODO validate machine-readable value?
                      // TODO define order of complex/dynamic validation?
                    },
                    {
                      "type": "RecursiveField",
                      "k": "definition",
                      "label": "Definition",
                      "definition_id": "id_of_the_field",
                    },
                  ],
                  "layout": "WithDeleteButton",
                },
              ],
            },
            "ForeignKeyListField": {
              "type": "Fields",
              "fields": [
                {
                  "type": "RecursiveListField",
                  "k": "fields",
                  "label": "Fields",
                  "definition_id": "id_of_the_field",
                  "layout": "WithDeleteButton",
                },
                {
                  "type": "TextField",
                  "k": "layout",
                  "label": "Layout", // TODO pre-fill?
                },
                {
                  "type": "TextField",
                  "k": "wrapper",
                  "label": "Wrapper", // TODO pre-fill?
                },
              ],
            },
          },
        },
      ],
      "id": "id_of_the_field",
    },
  ],
  "interceptor": "recursiveFields",
};

function WebDashboard1Field({
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
  return (<>
    <FieldLabel definition={definition} id={id} context={context}>
      <div className="container-fluid my-5">
        <FormComponent
          definition={FIELD_DEF}
          value={value}
          onChange={onChange}
          path={path}
          error={error}
          onReset={onReset}
        />
        </div>
        <div className="container my-5">
          <code>{JSON.stringify(value)}</code>
        </div>
    </FieldLabel>
    </>
  );
};

WebDashboard1Field.isEmpty = (x) => false; // TODO remove
WebDashboard1Field.validatorRunner = (definition, value, parentValue, context) => {
  const current = FIELD_DEF;
  console.log('call validateDefinition', validateDefinition(current, value, parentValue, context));
  return validateDefinition(current, value, parentValue);
};
WebDashboard1Field.validatorChecker = (definition, error, value, parentValue, context) => {
  const current = FIELD_DEF;
  return definitionIsInvalid(current, error, value, parentValue, context);
};
export default WebDashboard1Field;
