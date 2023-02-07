import React, { useState, useEffect } from "react";
import axios from "axios";
import axiosDefaults from "axios/lib/defaults";

axiosDefaults.xsrfCookieName = "csrftoken"
axiosDefaults.xsrfHeaderName = "X-CSRFToken"

export function useLocalStorage(key, initialValue) {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState(() => {
    try {
      // Get from local storage by key
      const item = window.localStorage.getItem(key);
      // Parse stored json or if none return initialValue
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      // If error also return initialValue
      console.log(error);
      return initialValue;
    }
  });
  // Return a wrapped version of useState's setter function that ...
  // ... persists the new value to localStorage.
  const setValue = (value) => {
    try {
      // Allow value to be a function so we have same API as useState
      const valueToStore =
        value instanceof Function ? value(storedValue) : value;
      // Save state
      setStoredValue(valueToStore);
      // Save to local storage
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      // A more advanced implementation would handle the error case
      console.log(error);
    }
  };
  return [storedValue, setValue];
}

export function useApi(url, ...params) {
  const [result, setResult] = useState();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log('will reload');
    setLoading(true);
    setResult(null);
    axios.get(url).then(r => {
      setResult(r.data);
      setLoading(false);
    });
  }, [url, ...params]);

  return [result, loading, setResult];
}

export const move = function(existing, index, delta) {
  const array = existing.slice();
  var newIndex = index + delta;
  if (newIndex < 0  || newIndex == array.length) return; //Already at the top or bottom.
  var indexes = [index, newIndex].sort(); //Sort the indixes
  array.splice(indexes[0], 2, array[indexes[1]], array[indexes[0]]); //Replace from lowest index, two elements, reverting the order
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

export const orderBy = function(arr, selector, desc = false) {
  return [...arr].sort((a, b) => {
    a = selector(a);
    b = selector(b);

    if (a == b) return 0;
    return (desc ? a > b : a < b) ? -1 : 1;
  });
};

export function getURLParameterByName(name, url = window.location.href) {
    name = name.replace(/[\[\]]/g, '\\$&');
    var regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)'),
        results = regex.exec(url);
    if (!results) return null;
    if (!results[2]) return '';
    return decodeURIComponent(results[2].replace(/\+/g, ' '));
}


export function useWindowSize() {
  // Initialize state with undefined width/height so server and client renders match
  // Learn more here: https://joshwcomeau.com/react/the-perils-of-rehydration/
  const [windowSize, setWindowSize] = useState(`${window.innerWidth}|${window.innerHeight}`);
  useEffect(() => {
    // Handler to call on window resize
    function handleResize() {
      // Set window width/height to state
      setWindowSize(`${window.innerWidth}|${window.innerHeight}`);
    }
    // Add event listener
    window.addEventListener("resize", handleResize);
    // Call handler right away so state gets updated with initial window size
    handleResize();
    // Remove event listener on cleanup
    return () => window.removeEventListener("resize", handleResize);
  }, []); // Empty array ensures that effect is only run on mount
  return windowSize;
}

export function useDebounce(value, delay) {
  // Состояние и сеттер для отложенного значения
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(
    () => {
      // Выставить debouncedValue равным value (переданное значение)
      // после заданной задержки
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      // Вернуть функцию очистки, которая будет вызываться каждый раз, когда ...
      // ... useEffect вызван снова. useEffect будет вызван снова, только если ...
      // ... value будет изменено (смотри ниже массив зависимостей).
      // Так мы избегаем изменений debouncedValue, если значение value ...
      // ... поменялось в рамках интервала задержки.
      // Таймаут очищается и стартует снова.
      // Что бы сложить это воедино: если пользователь печатает что-то внутри ...
      // ... нашего приложения в поле поиска, мы не хотим, чтобы debouncedValue...
      // ... не менялось до тех пор, пока он не прекратит печатать дольше, чем 500ms.
      return () => {
        clearTimeout(handler);
      };
    },
    // Вызывается снова, только если значение изменится
    // мы так же можем добавить переменную "delay" в массива зависимостей ...
    // ... если вы собираетесь менять ее динамически.
    [value]
  );

  return debouncedValue;
};

export function changeURLParameter (
  name,
  value,
  currentParams = window.location.search
) {
  const params = new URLSearchParams(currentParams); // TODO PROPERLY
  const result = {};
  for (const [k, v] of params) {
    result[k] = v;
  }
  result[name] = value;
  if (!value) delete result[name];
  return new URLSearchParams(result).toString();
};


export function removeLangFromPathName(lang, pathname) {
  if (lang === 'en') return pathname;
  const prefix = '/' + lang;
  if (pathname.startsWith(prefix)) {
    return pathname.substr(prefix.length);
  }
  return pathname;
}

export function addLangToPathName(lang, pathname) {
  if (lang === 'en') return pathname;
  return '/' + lang + pathname;
}
