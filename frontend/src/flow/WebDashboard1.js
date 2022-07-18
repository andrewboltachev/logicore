import React, { useState, useEffect, useRef, memo } from "react";
import {
  FieldLabel,
  FormComponent,
} from "../logicore-forms";
import { v4 as uuidv4 } from "uuid";

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
              },
              {k: 'ordering', 'type': 'ForeignKeyListField', addWhat: 'ordering',
                fields: [
                  {
                    k: 'field',
                    type: 'SelectField',
                    label: 'Field',
                  },
                ],
              },
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

