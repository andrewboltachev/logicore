import React, { useState, useEffect, useRef, memo } from "react";
import {
  FieldLabel,
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
    </FieldLabel>
  );
};

