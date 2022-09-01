import React, {
  useState,
  useEffect,
  useCallback,
  forwardRef,
  useMemo,
  useRef,
  useContext,
} from "react";
import {
  BrowserRouter as Router,
  Switch as Routes,
  Route,
  Link,
  useLocation,
  useHistory,
} from "react-router-dom";

const HomeView = () => {
  return <div className="container my-4">
    <div className="col-md-8">
      <h1>Andrei Boltachev</h1>
      <h5 className="text-muted">Full-stack software developer</h5>
    </div>
    <div className="col-md-4">
      <img alt="" src="/" />
    </div>
  </div>;
};


export default HomeView;
