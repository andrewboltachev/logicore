import React from "react";

function* indexed(items){
    let i = 0;
    for (const item of items) {
        yield [i, item];
        i++;
    }
}

function* allJSONItems(tree, path=null) {
    if (!path) path = '';
    yield [path, tree];
    if (Array.isArray(tree)) {
        console.log('array', tree);
        for (const [i, item] of indexed(tree)) {
            const newPath = `${path ? path + '.' : ''}${i}`;
            for (const element of allJSONItems(item, newPath)) {
                yield element;
            }
        }
    } else if (typeof tree === 'object' && tree !== null) {
        console.log('object', tree);
        for (const [k, item] of Object.entries(tree)) {
            const newPath = `${path ? path + '.' : ''}${k}`;
            for (const element of allJSONItems(item, newPath)) {
                yield element;
            }
        }
    }
};


const ContentsKind = {
    "MatchObjectOnly": "object",
    "MatchArray": "object",
    "MatchStringExact": "string",
    "MatchAny": "undefined",
    "MatchNull": "undefined",
    "MatchStringAny": "undefined"
};

const GrammarTrie = ({ data }) => {
    let value = null;
    // begin tag checker
    value = Array.from(allJSONItems(data)).filter(
        ([_, x]) => (x && typeof x === "object" && x.tag)
    ).map(
        ([_, x]) => [x.tag, typeof x.contents]
    );
    // end tag checker
    return (<div style={{position: "relative", minHeight: "40vh"}}>
        <pre style={{position: "absolute", left: "0", right: "0", top: "0", bottom: "0"}}>
            {JSON.stringify(Object.fromEntries(value), null, 2)}
        </pre>
    </div>);
};

export { GrammarTrie }
