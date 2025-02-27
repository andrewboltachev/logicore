import globals from 'globals'
import { fixupPluginRules } from "@eslint/compat";
import pluginJs from '@eslint/js'
import pluginReact from 'eslint-plugin-react'
import pluginReactHooks from 'eslint-plugin-react-hooks'


/** @type {import('eslint').Linter.Config[]} */
export default [
  { files: ['**/*.{js,mjs,cjs,jsx}'] },
  { languageOptions: { globals: globals.browser } },
  pluginJs.configs.recommended,
  {
    ...pluginReact.configs.flat.recommended,
    settings: {
      react: {
        version: "detect",
      },
    },
  },
  // Even though eslint-plugin-react-hooks exposes configs.recommended, it is not yet compatible with the flat file config,
  // because it has plugins: [ 'react-hooks' ] property, but plugins should be an object
  // Once it is supported, replace with: eslintPluginReactHooks.configs.recommended,
  {
    plugins: {
      //"react": reactPlugin, // remove this if you already have another config object that adds the react plugin
      "react-hooks": fixupPluginRules(pluginReactHooks),
    },
    rules: {
      ...pluginReactHooks.configs.recommended.rules,
    },
  },
]
