import React, { useState, useEffect, useRef, memo, useContext } from 'react'
import {
  formComponents,
  validateDefinition,
  definitionIsInvalid,
  FormComponent,
  GenericForm,
  formValidators,
  fieldsLayouts,
  FieldLabel
} from '../logicore-forms'
import { v4 as uuidv4 } from 'uuid'
import classd from 'classd'
import keycode from 'keycode'
import _ from 'lodash'
import { axios } from '../imports'

import {
  pathToUpdate,
  getByPath,
  setByPath,
  update
} from '../logicore-forms/utils'

import { Button, Modal } from 'react-bootstrap'

let N = null

const handle_semicolon = ({ semicolon, default_semicolon, N }) => (
  <>{(semicolon === 'MaybeSentinel.DEFAULT' && default_semicolon) ? '; ' : null}{typeof semicolon === 'object' ? <N {...semicolon} /> : null}</>
)

const CodegenStateContext = React.createContext('CodegenStateContext')

const Indent = ({ indent }) => {
  const { default_indent } = useContext(CodegenStateContext)
  return new Array(default_indent * indent).fill(' ').join('')
}

const pythonNodes = {
  // 'encoding': 'utf-8',
  // 'default_indent': '    ',
  // 'default_newline': '\n',
  // 'has_trailing_newline': True,
  Module: ({ body, header, footer, default_indent, default_newline, has_trailing_newline }) => {
    const codegenState = {
      default_indent,
      default_newline,
      has_trailing_newline
    }
    return <CodegenStateContext.Provider value={codegenState}>{header.map((item, i) => <N key={i} {...item} />)}{body.map((item, i) => <N key={i} {...item} indent={0} />)}{footer.map((item, i) => <N key={i} {...item} />)}</CodegenStateContext.Provider>
  },
  Del: ({ whitespace_after_del, target, semicolon, default_semicolon }) => {
    return <>del<N {...whitespace_after_del} /><N {...target} />{handle_semicolon({ semicolon, default_semicolon })}</>
  },
  Pass: ({ semicolon, default_semicolon }) => {
    return <>pass{handle_semicolon({ semicolon, default_semicolon })}</>
  },
  Break: ({ semicolon, default_semicolon }) => {
    return <>break{handle_semicolon({ semicolon, default_semicolon })}</>
  },
  Continue: ({ semicolon, default_semicolon }) => {
    return <>continue{handle_semicolon({ semicolon, default_semicolon })}</>
  },
  Return: ({ value, whitespace_after_return, semicolon, default_semicolon }) => {
    return <>return{((whitespace_after_return === 'MaybeSentinel.DEFAULT') && value) ? ' ' : ''}{typeof whitespace_after_return === 'object' ? <N {...whitespace_after_return} /> : null}{value ? <N {...value} /> : null}{handle_semicolon({ semicolon, default_semicolon })}</>
  },
  Expr: ({ value, semicolon, default_semicolon }) => {
    return <><N {...value} />{handle_semicolon({ semicolon, default_semicolon })}</>
  },
  SimpleStatementLine: ({ leading_lines, body, indent, trailing_whitespace }) => {
    return <>{leading_lines.map((item, i) => <N key={i} {...item} />)}<Indent indent={indent} />{body?.length ? body.map((item, i) => <N key={i} {...item} default_semicolon={i !== (body.length - 1)} />) : 'pass'}<N {...trailing_whitespace} /></>
  },
  SimpleStatementSuite: ({ leading_whitespace, body, indent, trailing_whitespace }) => {
    return <>{leading_whitespace.map((item, i) => <N key={i} {...item} />)}<Indent indent={indent} />{body?.length ? body.map((item, i) => <N key={i} {...item} default_semicolon={i !== (body.length - 1)} />) : 'pass'}<N {...trailing_whitespace} /></>
  },
  Else: ({ leading_lines, body, indent, whitespace_before_colon }) => {
    return <>{leading_lines.map((item, i) => <N key={i} {...item} />)}<Indent indent={indent} />else<N {...whitespace_before_colon} />:<N {...body} /></>
  },
  If: ({ leading_lines, body, indent, test, whitespace_before_test, whitespace_after_test, is_elif, orelse }) => {
    return <>{leading_lines.map((item, i) => <N key={i} {...item} />)}<Indent indent={indent} />{is_elif ? 'elif' : 'if'}<N {...whitespace_before_test} /><N {...test} /><N {...whitespace_after_test} />:<N {...body} />{orelse ? <N {...orelse} is_elif={orelse.type === 'If'} /> : null}</>
  },
  AsName: ({ value, whitespace_before_as, whitespace_after_as, name }) => {
    return <><N {...whitespace_before_as} />as<N {...whitespace_after_as} /><N {...name} /></>
  },
  ExceptHandler: ({ value }) => {
  },
  SimpleString: ({ value }) => {
    return <>{value}</>
  },
  ImportFrom: ({ module }) => {
    return <>import * from <N {...module} /></>
  },
  Name: ({ value }) => {
    return <>{value}</>
  }
}

N = (props) => {
  const { type, default_indent, default_newline } = props
  const Component = pythonNodes[type]
  if (!Component) return <div>No type: {type}</div>
  console.log(type, Object.keys(props))
  return <Component {...props} />
}

const PythonNode = N

export default PythonNode
