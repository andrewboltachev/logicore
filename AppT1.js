const util = require('util');
const SIMPLE1 = [ // is a list
    {
        "param": {
            "type": "ConT",
            "value": "MatchPattern"
        },
        "target": {
            "type": "ConT",
            "value": "ContextFreeGrammar"
        },
        "type": "AppT"
    }
];

const SIMPLE2 = {
    "param": {
        "type": "ConT",
        "value": "MatchPattern"
    },
    "target": {
        "type": "ConT",
        "value": "KeyMap"
    },
    "type": "AppT"
};

const NESTED = {
    "param": {
        "type": "ConT",
        "value": "MatchResult"
    },
    "target": {
        "param": {
            "type": "ConT",
            "value": "MatchPattern"
        },
        "target": {
            "type": "ConT",
            "value": "ContextFreeGrammarResult"
        },
        "type": "AppT"
    },
    "type": "AppT"
}

const _ = { identity: x => x };

const walk = (value, post=_.identity, pre=_.identity) => {
  const items = pre(value);
  if (Array.isArray(items)) {
    return post(items.map(x => walk(x, post, pre)));
  } else if (items && typeof items === 'object') {
    return post(Object.fromEntries(Object.entries(items).map(([k, v]) => [k, walk(v, post, pre)])));
  } else {
    return post(items);
  }
}

const f1 = (node) => {
  if (!!node && !Array.isArray(node) && typeof node === 'object') {
    if (node.type === 'AppT') {
      const params = [];
      let target = node;
      const f = (x) => {
        params.unshift(x.param);
        if (x.target.type === 'AppT') {
          f(x.target);
        } else {
          target = x.target;
        }
      };
      f(node);
      return {type: 'AppT1', target, params};
    }
  }
  return node;
}

const log = (x) => process.stdout.write(util.inspect(x, {colors: true, depth: 50,  maxArrayLength: 200}));

log(walk(SIMPLE1, _.identity, f1));
console.log('\n');
log(walk(SIMPLE2, _.identity, f1));
console.log('\n');
log(walk(NESTED, _.identity, f1));
console.log('\n');
