import React, { useState, useEffect, useRef, memo } from "react";
import {
  FieldLabel,
  FormComponent,
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

export default function WebDashboard1Field({
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
              {k: 'fields', 'type': 'ForeignKeyListField', addWhat: 'field',
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
            interceptor: 'RefsInterceptor',
            refsSource: ['fields'],
            refsNest: ['ordering'],
            refsTarget: ['field'],
            refsLabel: (item) => {
              return item?.name || '(no name)';
            },
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

