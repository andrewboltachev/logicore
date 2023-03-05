export default [
	{
		contents: [
			{
				contents: [
					{
						param: {
							param: {
								type: "ConT",
								value: "MatchPattern",
							},
							target: {
								type: "ConT",
								value: "ObjectKeyMatch",
							},
							type: "AppT",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
				],
				tag: "MatchObjectFull",
			},
			{
				contents: [
					{
						param: {
							param: {
								type: "ConT",
								value: "MatchPattern",
							},
							target: {
								type: "ConT",
								value: "ObjectKeyMatch",
							},
							type: "AppT",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
				],
				tag: "MatchObjectPartial",
			},
			{
				contents: [
					{
						param: {
							type: "ConT",
							value: "MatchPattern",
						},
						target: {
							type: "ConT",
							value: "ContextFreeGrammar",
						},
						type: "AppT",
					},
				],
				tag: "MatchArrayContextFree",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Text",
					},
				],
				tag: "MatchStringExact",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Scientific",
					},
				],
				tag: "MatchNumberExact",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Bool",
					},
				],
				tag: "MatchBoolExact",
			},
			{
				contents: [],
				tag: "MatchStringAny",
			},
			{
				contents: [],
				tag: "MatchNumberAny",
			},
			{
				contents: [],
				tag: "MatchBoolAny",
			},
			{
				contents: [],
				tag: "MatchNull",
			},
			{
				contents: [],
				tag: "MatchAny",
			},
			{
				contents: [
					{
						param: {
							type: "ConT",
							value: "MatchPattern",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
				],
				tag: "MatchOr",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "MatchPattern",
					},
					{
						type: "ConT",
						value: "String",
					},
					{
						type: "ConT",
						value: "MatchPattern",
					},
				],
				tag: "MatchIfThen",
			},
			{
				contents: [],
				tag: "MatchFunnel",
			},
			{
				contents: [],
				tag: "MatchFunnelKeys",
			},
			{
				contents: [],
				tag: "MatchFunnelKeysU",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "String",
					},
				],
				tag: "MatchRef",
			},
		],
		value: "MatchPattern",
		vars: [],
	},
	{
		contents: [
			{
				contents: [
					{
						param: {
							type: "ConT",
							value: "MatchPattern",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
					{
						param: {
							param: {
								type: "ConT",
								value: "MatchResult",
							},
							target: {
								type: "ConT",
								value: "ObjectKeyMatch",
							},
							type: "AppT",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
				],
				tag: "MatchObjectFullResult",
			},
			{
				contents: [
					{
						param: {
							type: "ConT",
							value: "MatchPattern",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
					{
						param: {
							param: {
								type: "ConT",
								value: "MatchResult",
							},
							target: {
								type: "ConT",
								value: "ObjectKeyMatch",
							},
							type: "AppT",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
				],
				tag: "MatchObjectPartialResult",
			},
			{
				contents: [
					{
						param: {
							type: "ConT",
							value: "MatchResult",
						},
						target: {
							param: {
								type: "ConT",
								value: "MatchPattern",
							},
							target: {
								type: "ConT",
								value: "ContextFreeGrammarResult",
							},
							type: "AppT",
						},
						type: "AppT",
					},
				],
				tag: "MatchArrayContextFreeResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Text",
					},
				],
				tag: "MatchStringExactResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Scientific",
					},
				],
				tag: "MatchNumberExactResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Bool",
					},
				],
				tag: "MatchBoolExactResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Text",
					},
				],
				tag: "MatchStringAnyResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Scientific",
					},
				],
				tag: "MatchNumberAnyResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Bool",
					},
				],
				tag: "MatchBoolAnyResult",
			},
			{
				contents: [],
				tag: "MatchNullResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Value",
					},
				],
				tag: "MatchAnyResult",
			},
			{
				contents: [
					{
						param: {
							type: "ConT",
							value: "MatchPattern",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
					{
						type: "ConT",
						value: "Key",
					},
					{
						type: "ConT",
						value: "MatchResult",
					},
				],
				tag: "MatchOrResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "MatchPattern",
					},
					{
						type: "ConT",
						value: "String",
					},
					{
						type: "ConT",
						value: "MatchResult",
					},
				],
				tag: "MatchIfThenResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Value",
					},
				],
				tag: "MatchFunnelResult",
			},
			{
				contents: [
					{
						param: {
							type: "ConT",
							value: "Value",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
				],
				tag: "MatchFunnelKeysResult",
			},
			{
				contents: [
					{
						param: {
							type: "ConT",
							value: "Value",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
				],
				tag: "MatchFunnelKeysUResult",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "String",
					},
					{
						type: "ConT",
						value: "MatchResult",
					},
				],
				tag: "MatchRefResult",
			},
		],
		value: "MatchResult",
		vars: [],
	},
	{
		contents: [
			{
				contents: [
					{
						type: "VarT",
						value: "a_6989586621682298768",
					},
				],
				tag: "Char",
			},
			{
				contents: [
					{
						param: {
							param: {
								type: "VarT",
								value: "a_6989586621682298768",
							},
							target: {
								type: "ConT",
								value: "ContextFreeGrammar",
							},
							type: "AppT",
						},
						target: {
							type: "ListT",
						},
						type: "AppT",
					},
				],
				tag: "Seq",
			},
			{
				contents: [
					{
						param: {
							param: {
								type: "VarT",
								value: "a_6989586621682298768",
							},
							target: {
								type: "ConT",
								value: "ContextFreeGrammar",
							},
							type: "AppT",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
				],
				tag: "Or",
			},
			{
				contents: [
					{
						param: {
							type: "VarT",
							value: "a_6989586621682298768",
						},
						target: {
							type: "ConT",
							value: "ContextFreeGrammar",
						},
						type: "AppT",
					},
				],
				tag: "Star",
			},
			{
				contents: [
					{
						param: {
							type: "VarT",
							value: "a_6989586621682298768",
						},
						target: {
							type: "ConT",
							value: "ContextFreeGrammar",
						},
						type: "AppT",
					},
				],
				tag: "Plus",
			},
			{
				contents: [
					{
						param: {
							type: "VarT",
							value: "a_6989586621682298768",
						},
						target: {
							type: "ConT",
							value: "ContextFreeGrammar",
						},
						type: "AppT",
					},
				],
				tag: "Optional",
			},
		],
		value: "ContextFreeGrammar",
		vars: ["a_6989586621682298768"],
	},
	{
		contents: [
			{
				contents: [
					{
						type: "VarT",
						value: "r_6989586621682300744",
					},
				],
				tag: "CharNode",
			},
			{
				contents: [
					{
						param: {
							param: {
								type: "VarT",
								value: "r_6989586621682300744",
							},
							target: {
								param: {
									type: "VarT",
									value: "g_6989586621682300743",
								},
								target: {
									type: "ConT",
									value: "ContextFreeGrammarResult",
								},
								type: "AppT",
							},
							type: "AppT",
						},
						target: {
							type: "ListT",
						},
						type: "AppT",
					},
				],
				tag: "SeqNode",
			},
			{
				contents: [
					{
						param: {
							type: "VarT",
							value: "g_6989586621682300743",
						},
						target: {
							type: "ConT",
							value: "ContextFreeGrammar",
						},
						type: "AppT",
					},
				],
				tag: "StarNodeEmpty",
			},
			{
				contents: [
					{
						param: {
							param: {
								type: "VarT",
								value: "r_6989586621682300744",
							},
							target: {
								param: {
									type: "VarT",
									value: "g_6989586621682300743",
								},
								target: {
									type: "ConT",
									value: "ContextFreeGrammarResult",
								},
								type: "AppT",
							},
							type: "AppT",
						},
						target: {
							type: "ListT",
						},
						type: "AppT",
					},
				],
				tag: "StarNodeValue",
			},
			{
				contents: [
					{
						param: {
							param: {
								type: "VarT",
								value: "r_6989586621682300744",
							},
							target: {
								param: {
									type: "VarT",
									value: "g_6989586621682300743",
								},
								target: {
									type: "ConT",
									value: "ContextFreeGrammarResult",
								},
								type: "AppT",
							},
							type: "AppT",
						},
						target: {
							type: "ListT",
						},
						type: "AppT",
					},
				],
				tag: "PlusNode",
			},
			{
				contents: [
					{
						param: {
							param: {
								type: "VarT",
								value: "g_6989586621682300743",
							},
							target: {
								type: "ConT",
								value: "ContextFreeGrammar",
							},
							type: "AppT",
						},
						target: {
							type: "ConT",
							value: "KeyMap",
						},
						type: "AppT",
					},
					{
						type: "ConT",
						value: "Key",
					},
					{
						param: {
							type: "VarT",
							value: "r_6989586621682300744",
						},
						target: {
							param: {
								type: "VarT",
								value: "g_6989586621682300743",
							},
							target: {
								type: "ConT",
								value: "ContextFreeGrammarResult",
							},
							type: "AppT",
						},
						type: "AppT",
					},
				],
				tag: "OrNode",
			},
			{
				contents: [
					{
						param: {
							type: "VarT",
							value: "r_6989586621682300744",
						},
						target: {
							param: {
								type: "VarT",
								value: "g_6989586621682300743",
							},
							target: {
								type: "ConT",
								value: "ContextFreeGrammarResult",
							},
							type: "AppT",
						},
						type: "AppT",
					},
				],
				tag: "OptionalNodeValue",
			},
			{
				contents: [
					{
						param: {
							type: "VarT",
							value: "g_6989586621682300743",
						},
						target: {
							type: "ConT",
							value: "ContextFreeGrammar",
						},
						type: "AppT",
					},
				],
				tag: "OptionalNodeEmpty",
			},
		],
		value: "ContextFreeGrammarResult",
		vars: ["g_6989586621682300743", "r_6989586621682300744"],
	},
	{
		contents: [
			{
				contents: [
					{
						type: "VarT",
						value: "a_6989586621682304000",
					},
				],
				tag: "KeyReq",
			},
			{
				contents: [
					{
						type: "VarT",
						value: "a_6989586621682304000",
					},
				],
				tag: "KeyOpt",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Value",
					},
				],
				tag: "KeyExt",
			},
		],
		value: "ObjectKeyMatch",
		vars: ["a_6989586621682304000"],
	},
	{
		contents: [
			{
				contents: [
					{
						type: "VarT",
						value: "a_6989586621682303999",
					},
				],
				tag: "MatchedVal",
			},
			{
				contents: [
					{
						type: "ConT",
						value: "Value",
					},
				],
				tag: "ExtraVal",
			},
		],
		value: "ArrayValMatch",
		vars: ["a_6989586621682303999"],
	},
];
