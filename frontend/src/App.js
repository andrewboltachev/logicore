import React, { useState, useEffect, useRef } from "react";
import logo from "./logo.svg";
import "./App.scss";
import classd from "classd";
import "react-notifications/lib/notifications.css";
import { axios, extend, update } from "./imports";
import { Button, Modal } from "react-bootstrap";
import { v4 as uuidv4 } from "uuid";
import {
  NotificationContainer,
  NotificationManager,
} from "react-notifications";
import { alert, confirm } from "react-bootstrap-confirmation";
import moment from "moment";

import {
  BrowserRouter as Router,
  Switch as Routes,
  Route,
  Link,
  useLocation,
  useHistory,
  useNavigate,
} from "react-router-dom";
import {
  useLocalStorage,
  useApi,
  moveUp,
  moveDown,
  range,
  capitalize,
  partition2,
  orderBy,
  getURLParameterByName,
  useWindowSize,
  useDebounce,
  changeURLParameter,
} from "./utils";

import { ComponentType, ReactNode } from "react";
import { jsx } from "@emotion/react";

import {
  validateDefinition,
  definitionIsInvalid,
  pathToUpdate,
  FormComponent,
  FormWithValidation,
} from "./logicore-forms";

const HomePage = () => {
  return "hello world";
}

const mainComponents = {
  HomePage,
};

const MainWrapper = ({ result, onChange }) => {
  const Component = mainComponents[result?.template];
  return (
    <>
      {Component && result && <Component {...{ ...result, onChange }} />}
    </>
  );
};

const wrapperComponents = {
  MainWrapper,
};

const BaseLayout = () => {
  const loc = useLocation();
  const navigate = useNavigate();
  const apiUrl = "/api2" + loc.pathname + loc.search;
  const [result, loading, _] = useApi(apiUrl, loc.key);
  const [show, setShow] = useState(false);

  const reload = () => {
    navigate(loc.pathname);
  };
  useEffect(
    (_) => {
      console.log("GET API returned", result, window.actionToConsume);
      if (result?.current_date) window.current_date = result.current_date;
      if (!result_worth_processing({ result, loc, navigate })) return;
      if (window.actionToConsume) {
      }
    },
    [result]
  );

  const onChange = async (data, setErrors, customHandler) => {
    let resp;
    if (window._react_form_has_files) {
      //console.log(gatherFileUids(data)); return;
      const formData = new FormData();
      for (const [k, v] of Object.entries(gatherFileUids(data))) {
        formData.append(k, v);
      }
      formData.append('data', JSON.stringify(data));
      resp = await axios.post(apiUrl, formData);
      /*
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
       */
    } else {
      resp = await axios.post(apiUrl, {
        data,
      });
    }
    const result = resp.data;
    console.log("POST API returned", resp);
    if (customHandler) {
      customHandler(result);
    } else {
      if (setErrors) setErrors(null, null);
      if (!result_worth_processing({ result, loc, navigate })) return;
      if (result?.action === "setErrors") {
        if (setErrors) setErrors(result.errors, result.error);
      }
      if (result?.action === "closeWindow") {
        window.the_msg = result?.the_msg;
        window.close();
      }
    }
    return resp.data;
  };

  const Wrapper = wrapperComponents[result?.wrapper];

  if (result?.navigate || !Wrapper) return <div />;

  return <>
    <Wrapper {...{ loc, navigate, result, apiUrl, onChange }} />
  </>;
};

function App() {
  return (
    <>
      <Router>
        <Routes>
          <Route>
            <BaseLayout />
          </Route>
        </Routes>
      </Router>
      <NotificationContainer enterTimeout={10} leaveTimeout={10} />
    </>
  );
}

export default App;
