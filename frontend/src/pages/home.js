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

import "./home.scss";

const HomeView = () => {
  return <div className="container my-4">
    <div className="row" style={{flexDirection: "row-reverse"}}>
      <div className="col-md-4 personal-photo-container">
        <img className="personal-photo" style={{borderRadius: 15, opacity: 0.75}} alt="" src="/static/JAU2gYJOCdI.jpg" />
      </div>
      <div className="col-md-8">
        <h1>Andrei Boltachev</h1>
        <h5 className="text-muted">Full-stack software developer</h5>
        <div className="my-5">
          <dl>
            <dt>Technologies</dt>
            <dd>Python/Django <span className="text-muted">(~11 years)</span>, ReactJS <span className="text-muted">(~6 years)</span>, Clojure/ClojureScript <span className="text-muted">(~6 years)</span>, Linux/Git/Vim/Emacs etc <span className="text-muted">(~11 years)</span></dd>
            <dt>Links</dt>
            <dd><a target="_blank" href="https://github.com/andrewboltachev">GitHub</a>, <a target="_blank" href="https://www.linkedin.com/in/andrewboltachev/">LinkedIn</a></dd>
            <dt>Experience</dt>
            <dd>
              <p>For last 11 years I worked (please see work history on LinkedIn) both solely and as a part of the team (and in a senior position reviewing work of others) in many medium-size projects, mainly startups as a full-stack web developer.</p>
              <p>Products I worked on include different kinds of dashboards, CRM systems and marketplace websites.</p>
            </dd>
            <dt>Interests &amp; own projects</dt>
            <dd>
              <p>Modern ideas I believe in are functional and declarative programming, low-code systems and refactoring tools (to improve quality of existing code).</p>
              <p>During my career, I created few tools that help building systems more quickly and efficiently:<ul>
            <li><a target="_blank" href="https://github.com/andrewboltachev/mega-copy">Mega-copy</a>, a tool that helps edit and copy code in bulk (mainly in Python/Django/ReactJS projects)</li>
            <li><Link to="/logicore-forms-demo">Logicore-forms</Link> — declarative form generator for ReactJS with extension for Django</li>
          </ul>
          </p>
            </dd>
          </dl>
        </div>
      </div>
    </div>
  </div>;
};


export default HomeView;
