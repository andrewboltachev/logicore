import { useState } from "react";
import exampleData from "./jsonmatcher_example";

import "./jsonmatcher.scss"

const Node = ({value, onChange}) => {
  if (value.tag === "MatchObjectFull") {
    return <span>
      <a className="text-secondary" href="#" onClick={e => e.preventDefault()}>{"\u25BC"}</a> {"{!}"}<br />
      {Object.entries(value.contents).map(([k, v]) => {
        return <span>
          <a className="text-danger" href="#" onClick={e => e.preventDefault()}>×</a>
          {" "}<input className="form-control bg-light" value={k} /><br />
          {"\t"}<Node value={v.contents} /><br />
        </span>;
      })}
      <a className="text-success" href="#" onClick={e => e.preventDefault()}>+</a>
    </span>;
  } else {
    return <span className="text-warning">unknown node: {value?.tag}</span>;
  }
};

// Nodes end

const JSONMatcherEditor = ({value1, onChange1, saveButton}) => {
  const [value, onChange] = useState(exampleData.value);
  console.log('st', value);
  return (
    <div className="row align-items-stretch flex-grow-1">
      <div className="col d-flex flex-column">
        <div className="form-control flex-grow-1 jsonmatcher-editor">
          <Node value={value} />
        </div>
        <div className="d-grid">
          {saveButton}
        </div>
      </div>
      <div className="col d-flex flex-column">
        <textarea className="form-control flex-grow-1" disabled></textarea>
        {/*<div className="d-grid">
          <button className="btn btn-success mt-2" type="button" onClick={_ => _}>
            <i className="fa fa-play-circle" />{" "}
            <Trans>Run</Trans>
          </button>
        </div>*/}
      </div>
    </div>
  );
}

export default {
  Editor: JSONMatcherEditor,
};
