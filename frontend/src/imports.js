import axios from "axios";
import update, { extend } from "immutability-helper";

axios.defaults.xsrfHeaderName = "X-CSRFToken";

extend("$auto", function (value, object) {
  return object ? update(object, value) : update({}, value);
});
extend("$autoArray", function (value, object) {
  return object ? update(object, value) : update([], value);
});

export { axios, extend, update };
