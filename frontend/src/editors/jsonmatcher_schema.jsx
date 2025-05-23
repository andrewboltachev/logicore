export default [
  {
    contents: [
      {
        contents: [
          {
            param: {
              param: { type: 'ConT', value: 'MatchPattern' },
              target: { type: 'ConT', value: 'ObjectKeyMatch' },
              type: 'AppT'
            },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchObjectFull'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchPattern' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          },
          {
            param: { type: 'ConT', value: 'Value' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchObjectWithDefaults'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchPattern' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchObjectOnly'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'ConT', value: 'MatchPattern' },
              target: { type: 'ConT', value: 'ObjectKeyMatch' },
              type: 'AppT'
            },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchObjectPartial'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchPattern' },
            target: { type: 'ConT', value: 'ContextFreeGrammar' },
            type: 'AppT'
          }
        ],
        tag: 'MatchArrayContextFree'
      },
      {
        contents: [{ type: 'ConT', value: 'MatchPattern' }],
        tag: 'MatchArrayOnly'
      },
      { contents: [{ type: 'ConT', value: 'Text' }], tag: 'MatchStringExact' },
      { contents: [{ type: 'ConT', value: 'Text' }], tag: 'MatchStringRegExp' },
      {
        contents: [{ type: 'ConT', value: 'Scientific' }],
        tag: 'MatchNumberExact'
      },
      { contents: [{ type: 'ConT', value: 'Bool' }], tag: 'MatchBoolExact' },
      { contents: [], tag: 'MatchStringAny' },
      { contents: [], tag: 'MatchNumberAny' },
      { contents: [], tag: 'MatchBoolAny' },
      { contents: [], tag: 'MatchNull' },
      { contents: [], tag: 'MatchAny' },
      { contents: [], tag: 'MatchIgnore' },
      { contents: [{ type: 'ConT', value: 'Value' }], tag: 'MatchDefault' },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchPattern' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchOr'
      },
      { contents: [{ type: 'ConT', value: 'MatchPattern' }], tag: 'MatchNot' },
      {
        contents: [
          { type: 'ConT', value: 'MatchPattern' },
          { type: 'ConT', value: 'MatchPattern' }
        ],
        tag: 'MatchAnd'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchPattern' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchArrayOr'
      },
      {
        contents: [
          { type: 'ConT', value: 'MatchPattern' },
          { type: 'ConT', value: 'Text' },
          { type: 'ConT', value: 'MatchPattern' }
        ],
        tag: 'MatchIfThen'
      },
      { contents: [], tag: 'MatchFunnel' },
      { contents: [], tag: 'MatchFunnelKeys' },
      { contents: [], tag: 'MatchFunnelKeysU' },
      { contents: [{ type: 'ConT', value: 'String' }], tag: 'MatchRef' }
    ],
    value: 'MatchPattern',
    vars: []
  },
  {
    contents: [
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchPattern' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          },
          {
            param: {
              param: { type: 'ConT', value: 'MatchResult' },
              target: { type: 'ConT', value: 'ObjectKeyMatch' },
              type: 'AppT'
            },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchObjectFullResult'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchPattern' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          },
          {
            param: {
              param: { type: 'ConT', value: 'MatchResult' },
              target: { type: 'ConT', value: 'ObjectKeyMatch' },
              type: 'AppT'
            },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchObjectPartialResult'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchResult' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          },
          {
            param: { type: 'ConT', value: 'Value' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          },
          {
            param: { type: 'ConT', value: 'Value' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchObjectWithDefaultsResult'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchResult' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          },
          {
            param: { type: 'ConT', value: 'Value' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchObjectOnlyResult'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchResult' },
            target: {
              param: { type: 'ConT', value: 'MatchPattern' },
              target: { type: 'ConT', value: 'ContextFreeGrammarResult' },
              type: 'AppT'
            },
            type: 'AppT'
          }
        ],
        tag: 'MatchArrayContextFreeResult'
      },
      {
        contents: [
          { type: 'ConT', value: 'MatchPattern' },
          {
            param: { type: 'ConT', value: 'Value' },
            target: { type: 'ListT' },
            type: 'AppT'
          }
        ],
        tag: 'MatchArrayOnlyResultEmpty'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchResult' },
            target: { type: 'ListT' },
            type: 'AppT'
          },
          {
            param: {
              param: { type: 'ConT', value: 'Value' },
              target: { type: 'ConT', value: 'Maybe' },
              type: 'AppT'
            },
            target: { type: 'ListT' },
            type: 'AppT'
          }
        ],
        tag: 'MatchArrayOnlyResultSome'
      },
      {
        contents: [{ type: 'ConT', value: 'Text' }],
        tag: 'MatchStringExactResult'
      },
      {
        contents: [
          { type: 'ConT', value: 'Text' },
          { type: 'ConT', value: 'Text' }
        ],
        tag: 'MatchStringRegExpResult'
      },
      {
        contents: [{ type: 'ConT', value: 'Scientific' }],
        tag: 'MatchNumberExactResult'
      },
      {
        contents: [{ type: 'ConT', value: 'Bool' }],
        tag: 'MatchBoolExactResult'
      },
      {
        contents: [{ type: 'ConT', value: 'Text' }],
        tag: 'MatchStringAnyResult'
      },
      {
        contents: [{ type: 'ConT', value: 'Scientific' }],
        tag: 'MatchNumberAnyResult'
      },
      {
        contents: [{ type: 'ConT', value: 'Bool' }],
        tag: 'MatchBoolAnyResult'
      },
      { contents: [], tag: 'MatchNullResult' },
      { contents: [{ type: 'ConT', value: 'Value' }], tag: 'MatchAnyResult' },
      {
        contents: [{ type: 'ConT', value: 'Value' }],
        tag: 'MatchIgnoreResult'
      },
      {
        contents: [{ type: 'ConT', value: 'Value' }],
        tag: 'MatchDefaultResult'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'MatchPattern' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          },
          { type: 'ConT', value: 'Key' },
          { type: 'ConT', value: 'MatchResult' }
        ],
        tag: 'MatchOrResult'
      },
      {
        contents: [
          { type: 'ConT', value: 'MatchPattern' },
          { type: 'ConT', value: 'Value' }
        ],
        tag: 'MatchNotResult'
      },
      {
        contents: [
          { type: 'ConT', value: 'MatchResult' },
          { type: 'ConT', value: 'MatchResult' }
        ],
        tag: 'MatchAndResult'
      },
      {
        contents: [
          { type: 'ConT', value: 'MatchPattern' },
          { type: 'ConT', value: 'Text' },
          { type: 'ConT', value: 'MatchResult' }
        ],
        tag: 'MatchIfThenResult'
      },
      {
        contents: [{ type: 'ConT', value: 'Value' }],
        tag: 'MatchFunnelResult'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'Value' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchFunnelKeysResult'
      },
      {
        contents: [
          {
            param: { type: 'ConT', value: 'Value' },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'MatchFunnelKeysUResult'
      },
      {
        contents: [
          { type: 'ConT', value: 'String' },
          { type: 'ConT', value: 'MatchResult' }
        ],
        tag: 'MatchRefResult'
      }
    ],
    value: 'MatchResult',
    vars: []
  },
  {
    contents: [
      {
        contents: [{ type: 'VarT', value: 'a_6989586621679066399' }],
        tag: 'Char'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'VarT', value: 'a_6989586621679066399' },
              target: { type: 'ConT', value: 'ContextFreeGrammar' },
              type: 'AppT'
            },
            target: { type: 'ListT' },
            type: 'AppT'
          }
        ],
        tag: 'Seq'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'VarT', value: 'a_6989586621679066399' },
              target: { type: 'ConT', value: 'ContextFreeGrammar' },
              type: 'AppT'
            },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          }
        ],
        tag: 'Or'
      },
      {
        contents: [
          {
            param: { type: 'VarT', value: 'a_6989586621679066399' },
            target: { type: 'ConT', value: 'ContextFreeGrammar' },
            type: 'AppT'
          }
        ],
        tag: 'Star'
      },
      {
        contents: [
          {
            param: { type: 'VarT', value: 'a_6989586621679066399' },
            target: { type: 'ConT', value: 'ContextFreeGrammar' },
            type: 'AppT'
          }
        ],
        tag: 'Plus'
      },
      {
        contents: [
          {
            param: { type: 'VarT', value: 'a_6989586621679066399' },
            target: { type: 'ConT', value: 'ContextFreeGrammar' },
            type: 'AppT'
          }
        ],
        tag: 'Optional'
      }
    ],
    value: 'ContextFreeGrammar',
    vars: ['a_6989586621679066399']
  },
  {
    contents: [
      {
        contents: [{ type: 'VarT', value: 'r_6989586621679070845' }],
        tag: 'CharNode'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'VarT', value: 'r_6989586621679070845' },
              target: {
                param: { type: 'VarT', value: 'g_6989586621679070844' },
                target: { type: 'ConT', value: 'ContextFreeGrammarResult' },
                type: 'AppT'
              },
              type: 'AppT'
            },
            target: { type: 'ListT' },
            type: 'AppT'
          }
        ],
        tag: 'SeqNode'
      },
      {
        contents: [
          {
            param: { type: 'VarT', value: 'g_6989586621679070844' },
            target: { type: 'ConT', value: 'ContextFreeGrammar' },
            type: 'AppT'
          }
        ],
        tag: 'StarNodeEmpty'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'VarT', value: 'r_6989586621679070845' },
              target: {
                param: { type: 'VarT', value: 'g_6989586621679070844' },
                target: { type: 'ConT', value: 'ContextFreeGrammarResult' },
                type: 'AppT'
              },
              type: 'AppT'
            },
            target: { type: 'ListT' },
            type: 'AppT'
          }
        ],
        tag: 'StarNodeValue'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'VarT', value: 'r_6989586621679070845' },
              target: {
                param: { type: 'VarT', value: 'g_6989586621679070844' },
                target: { type: 'ConT', value: 'ContextFreeGrammarResult' },
                type: 'AppT'
              },
              type: 'AppT'
            },
            target: { type: 'ListT' },
            type: 'AppT'
          },
          {
            param: { type: 'ConT', value: 'Int' },
            target: { type: 'ListT' },
            type: 'AppT'
          }
        ],
        tag: 'StarNodeIndexed'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'VarT', value: 'r_6989586621679070845' },
              target: {
                param: { type: 'VarT', value: 'g_6989586621679070844' },
                target: { type: 'ConT', value: 'ContextFreeGrammarResult' },
                type: 'AppT'
              },
              type: 'AppT'
            },
            target: { type: 'ListT' },
            type: 'AppT'
          }
        ],
        tag: 'PlusNode'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'VarT', value: 'r_6989586621679070845' },
              target: {
                param: { type: 'VarT', value: 'g_6989586621679070844' },
                target: { type: 'ConT', value: 'ContextFreeGrammarResult' },
                type: 'AppT'
              },
              type: 'AppT'
            },
            target: { type: 'ListT' },
            type: 'AppT'
          },
          {
            param: { type: 'ConT', value: 'Int' },
            target: { type: 'ListT' },
            type: 'AppT'
          }
        ],
        tag: 'PlusNodeIndexed'
      },
      {
        contents: [
          {
            param: {
              param: { type: 'VarT', value: 'g_6989586621679070844' },
              target: { type: 'ConT', value: 'ContextFreeGrammar' },
              type: 'AppT'
            },
            target: { type: 'ConT', value: 'KeyMap' },
            type: 'AppT'
          },
          { type: 'ConT', value: 'Key' },
          {
            param: { type: 'VarT', value: 'r_6989586621679070845' },
            target: {
              param: { type: 'VarT', value: 'g_6989586621679070844' },
              target: { type: 'ConT', value: 'ContextFreeGrammarResult' },
              type: 'AppT'
            },
            type: 'AppT'
          }
        ],
        tag: 'OrNode'
      },
      {
        contents: [
          {
            param: { type: 'VarT', value: 'r_6989586621679070845' },
            target: {
              param: { type: 'VarT', value: 'g_6989586621679070844' },
              target: { type: 'ConT', value: 'ContextFreeGrammarResult' },
              type: 'AppT'
            },
            type: 'AppT'
          }
        ],
        tag: 'OptionalNodeValue'
      },
      {
        contents: [
          {
            param: { type: 'VarT', value: 'g_6989586621679070844' },
            target: { type: 'ConT', value: 'ContextFreeGrammar' },
            type: 'AppT'
          }
        ],
        tag: 'OptionalNodeEmpty'
      }
    ],
    value: 'ContextFreeGrammarResult',
    vars: ['g_6989586621679070844', 'r_6989586621679070845']
  },
  {
    contents: [
      {
        contents: [{ type: 'VarT', value: 'a_6989586621679076961' }],
        tag: 'KeyReq'
      },
      {
        contents: [{ type: 'VarT', value: 'a_6989586621679076961' }],
        tag: 'KeyOpt'
      },
      { contents: [{ type: 'ConT', value: 'Value' }], tag: 'KeyExt' }
    ],
    value: 'ObjectKeyMatch',
    vars: ['a_6989586621679076961']
  }
]
