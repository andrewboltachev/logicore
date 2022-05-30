import React, { useState, useEffect } from "react";
import update, { extend } from "immutability-helper";

extend("$auto", function (value, object) {
  return object ? update(object, value) : update({}, value);
});
extend("$autoArray", function (value, object) {
  return object ? update(object, value) : update([], value);
});

export const move = function(existing, element, delta) {
  const array = [];
  const index = existing.indexOf(element);
  var newIndex = index + delta;
  console.log('new index', index, delta, newIndex);
  if ((newIndex > existing.length - 1) || (newIndex < 0)) {
    console.log('move edge case');
    return existing;
  }
  /*var indexes = [index, newIndex].sort(); //Sort the indixes
  array.splice(indexes[0], 2, array[indexes[1]], array[indexes[0]]); //Replace from lowest index, two elements, reverting the order*/
  const mapping = {[index]: newIndex, [newIndex]: index};
  for (let i = 0; i < existing.length; i++) {
    array.push(existing[typeof mapping[i] === 'number' ? mapping[i] : i]);
  }
  return array;
};

export const moveUp = function(array, element) {
  return move(array, element, -1);
};

export const moveDown = function(array, element) {
  return move(array, element, 1);
};

export const range = (start, end, step = 1) => {
  const forLoop = fn => {
    for (let x = start; x <= end; x += step) fn(x)
  }

  const between = (v, start, end) => v >= start && v <= end
  const hasValue = v => between(v, start, end) || between(v, end, start)

  const iterate = function* (mapFn) {
    for (let x = start; x <= end; x += step) yield mapFn ? mapFn(x) : x
  }

  const rangeObj = {}

  const createProp = v => ({ value: v })
  const map = createProp(mapFn => [...iterate(mapFn)])
  const forEach = createProp(forLoop)
  const includes = createProp(v => {
    for (let x = start; x <= end; x += step) {
      if (v === x) return true
    }
    return false
  })
  const has = createProp(hasValue)

  Object.defineProperties(rangeObj, {
    map,
    forEach,
    includes,
    has,
  })
  return rangeObj
}

export const capitalize = (s) => {
  if (!s) return s;
  return s[0].toUpperCase() + s.substr(1);
};

export const partition2 = (a) => {
  const r = [[]];
  for (let e of a) {
    if (r[r.length - 1].length === 2) r.push([]);
    r[r.length - 1].push(e);
  }
  return r;
};

export function orderBy(arr, selector, desc = false) {
  return [...arr].sort((a, b) => {
    a = selector(a);
    b = selector(b);

    if (a == b) return 0;
    return (desc ? a > b : a < b) ? -1 : 1;
  });
};

export function jj(data) { return JSON.parse(JSON.stringify(data)); };


export function removeOptions (options, notAllowedOptions) {
  return options?.filter(({ value }) => {
    return !value || !notAllowedOptions.has(value);
  }).map(({ value, options, ...props }) => {
    if (options) {
      return { ...props, options: removeOptions(options, notAllowedOptions) };
    } else {
      return { value, ...props };
    }
  });
};


export function updateFieldDefinition (fields, k, updateFn) {
  return fields?.map(field => {
    if (field.k) {
      if (field.k === k) {
        return updateFn(field);
      } else {
        return field;
      }
    } else if (field.fields) {
      return {...field, fields: updateFieldDefinition(field.fields, k, updateFn)};
    } else {
      return field;
    }
  });
};


export function modifyHelper (path, struct, f, variables) {
  if (!variables) variables = {};
  if (!path.length) return f(struct, variables);
  const [p, ...rest] = path;
  if (p === "*") {
    return (struct || []).map(el => modifyHelper(rest, el, f, variables));
  } else if (typeof p === "string") {
    return {...struct, [p]: modifyHelper(rest, struct[p], f, variables)};
  } else if (p.oneOf) {
    const result = {...struct};
    for (const k of p.oneOf) {
      //console.log('visiting oneOf', k, struct[k]);
      result[k] = modifyHelper(rest, struct[k], f, p.k ? {...variables, [p.k]: k} : variables);
    }
    return result;
  } else if (p.matching) {
    return (struct || []).map(el => {
      const matching = p.matching(el, variables);
      if (matching) {
        return modifyHelper(rest, el, f, p.k ? {...variables, [p.k]: matching} : variables);
      } else {
        return el;
      }
    });
  }
}

export function zipArrays(a,b){
    // pre-allocate an array to hold the results
    const rval=Array(Math.max(a.length, b.length));
    for(let i=0; i<rval.length; i++){
        rval[i]=[a[i],b[i]]
    }
    return rval
}

export function pathToUpdate (path, value) {
  let v = {},
    p,
    ee,
    vv_key;
  let r = v;
  for (const e of path) {
    const v_key = typeof e === "number" ? "$autoArray" : "$auto";
    v[v_key] = { [e]: {} };
    p = v;
    vv_key = v_key;
    ee = e;
    v = v[v_key][e];
  }
  p[vv_key][ee] = value;
  return r;
};

export function getByPath(struct, path) {
  let v = struct;
  for (const e of path) {
    const d = typeof e === "number" ? [] : {};
    v = (v || d)[e];
  }
  return v;
}

export function setByPath(struct, path, value) {
  return update(value, pathToUpdate(path, {$set: value}));
}

export { update };
