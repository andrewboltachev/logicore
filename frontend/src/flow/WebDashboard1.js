import React, { useState, useEffect, useRef, memo } from "react";
import {
  FieldLabel,
  FormComponent,
} from "../logicore-forms";
import { v4 as uuidv4 } from "uuid";

export default function ZenDocument1Field({
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
  return (
    <FieldLabel definition={definition} id={id} context={context}>
      <div className="container my-5">
        <FormComponent
          definition={{
            type: 'Fields',
            fields: [
              {k: 'name', 'label': 'Zen Desc', 'type': 'TextField'},
              {k: 'keys', 'type': 'ForeignKeyListField', addWhat: 'field',
                fields: [
                  {
                    k: 'key',
                    type: 'TextField',
                    label: 'Key',
                  },
                  {
                    k: 'type',
                    type: 'SelectField',
                    label: 'Type',
                    options: [
                      {value: 'quantity', label: 'Quantity'},
                      {value: 'choice', label: 'Choice'},
                    ]
                  },
                  {
                    k: 'params',
                    'master_field': 'type',
                    type: 'DefinedField',
                    definitions: {
                      quantity: {
                        type: 'Fields',
                        fields: [
                          {
                            k: 'min',
                            type: 'NumberField',
                            label: 'Min',
                          },
                          {
                            k: 'max',
                            type: 'NumberField',
                            label: 'Max',
                          },
                        ]
                      },
                    },
                  },
                ],
              }
            ],
          }}
          value={value}
          onChange={onChange}
          path={[]}
          error={null}
          onReset={_ => _}
        />
      </div>
    </FieldLabel>
  );
};

