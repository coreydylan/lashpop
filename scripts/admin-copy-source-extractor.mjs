import ts from 'typescript'

const USER_ATTRIBUTES = new Set([
  'alt',
  'aria-label',
  'aria-description',
  'placeholder',
  'title',
])

const USER_PROPERTIES = new Set([
  'body',
  'copy',
  'description',
  'detail',
  'empty',
  'error',
  'eyebrow',
  'heading',
  'help',
  'label',
  'linkLabel',
  'message',
  'name',
  'placeholder',
  'questions',
  'before',
  'check',
  'warning',
  'expectedResult',
  'acknowledgement',
  'steps',
  'vagaroSteps',
  'afterSyncSteps',
  'officialHelp',
  'screen',
  'screenshotAlt',
  'summary',
  'sub',
  'subtitle',
  'text',
  'title',
  'tooltip',
])

const USER_CALLS = new Set([
  'alert',
  'confirm',
  'setError',
  'setErrorMessage',
  'setLoadError',
  'setMessage',
  'setSaveError',
  'setStatusMessage',
])

const USER_CALL_PATTERN = /^set[A-Za-z0-9]*(?:Error|Message|Notice|Announcement)$/

const USER_VARIABLE = /(COPY|CONTENT|DESCRIPTION|FIELDS|LABELS?|MESSAGES?|META|OPTIONS|STATUS|TABS|TEXT|TOOLTIPS?|VIEWS|WORKFLOWS)$/i
const RENDER_CALLBACK_CALLS = new Set(['flatMap', 'map'])

function propertyName(node) {
  if (!node) return ''
  if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) return node.text
  return ''
}

function callName(expression) {
  if (ts.isIdentifier(expression)) return expression.text
  if (ts.isPropertyAccessExpression(expression)) return expression.name.text
  return ''
}

function isPlusToken(kind) {
  return kind === ts.SyntaxKind.PlusToken
}

function isRenderedBranchOperator(kind) {
  return kind === ts.SyntaxKind.AmpersandAmpersandToken
    || kind === ts.SyntaxKind.BarBarToken
    || kind === ts.SyntaxKind.QuestionQuestionToken
    || kind === ts.SyntaxKind.CommaToken
}

function normalize(text) {
  return text.replace(/\s+/g, ' ').trim()
}

function uniqueVariants(variants) {
  return [...new Map(variants.map((variant) => [`${variant.node.pos}:${variant.text}`, variant])).values()]
}

/**
 * Extract strings that can reach visible Admin UI from one TypeScript/TSX source file.
 *
 * This is deliberately a small static render-path analysis rather than a search for
 * every string literal. It follows JSX expressions, selected accessibility/copy
 * attributes, copy-shaped configuration, UI status calls and Error messages. It
 * follows local helpers invoked by those roots, but it does not inspect conditions,
 * comparison operands, IDs, routes or other DTO values merely because they are near
 * rendered code.
 */
export function extractAdminCopyStrings({ file = 'fixture.tsx', sourceText }) {
  const source = ts.createSourceFile(
    file,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  )

  const functions = new Map()
  const initializers = new Map()

  function indexDeclarations(node) {
    if (ts.isFunctionDeclaration(node) && node.name) {
      functions.set(node.name.text, node)
    }

    if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer) {
      initializers.set(node.name.text, node.initializer)
      if (ts.isArrowFunction(node.initializer) || ts.isFunctionExpression(node.initializer)) {
        functions.set(node.name.text, node.initializer)
      }
    }

    ts.forEachChild(node, indexDeclarations)
  }

  indexDeclarations(source)

  const entries = []

  function addVariants(variants) {
    for (const variant of uniqueVariants(variants)) {
      const text = normalize(variant.text)
      if (!text || text.startsWith('/') || text.startsWith('http')) continue
      entries.push({
        file,
        line: source.getLineAndCharacterOfPosition(variant.node.getStart(source)).line + 1,
        text,
      })
    }
  }

  function combine(left, right, node) {
    if (!left.length) return right
    if (!right.length) return left

    const combined = []
    for (const leftVariant of left) {
      for (const rightVariant of right) {
        combined.push({ text: `${leftVariant.text}${rightVariant.text}`, node })
      }
    }
    return combined
  }

  function returnExpressions(fn) {
    if (ts.isArrowFunction(fn) && !ts.isBlock(fn.body)) return [fn.body]
    if (!fn.body || !ts.isBlock(fn.body)) return []

    const returned = []

    function visitReturn(node) {
      if (node !== fn && ts.isFunctionLike(node)) return
      if (ts.isReturnStatement(node)) {
        if (node.expression) returned.push(node.expression)
        return
      }
      ts.forEachChild(node, visitReturn)
    }

    visitReturn(fn.body)
    return returned
  }

  function helperVariants(call, state) {
    let fn = null
    if (ts.isIdentifier(call.expression)) fn = functions.get(call.expression.text) ?? null
    else if (ts.isParenthesizedExpression(call.expression)
      && (ts.isArrowFunction(call.expression.expression) || ts.isFunctionExpression(call.expression.expression))) {
      fn = call.expression.expression
    }

    if (!fn || state.callStack.has(fn)) return []

    const substitutions = new Map(state.substitutions)
    for (const [index, parameter] of fn.parameters.entries()) {
      if (ts.isIdentifier(parameter.name) && call.arguments[index]) {
        substitutions.set(parameter.name.text, call.arguments[index])
      }
    }

    const nextState = {
      callStack: new Set([...state.callStack, fn]),
      identifiers: new Set(state.identifiers),
      substitutions,
    }

    return returnExpressions(fn).flatMap((expression) => expressionVariants(expression, nextState))
  }

  function objectPropertyVariants(object, wantedName, state) {
    for (const property of object.properties) {
      if (ts.isPropertyAssignment(property) && propertyName(property.name) === wantedName) {
        return expressionVariants(property.initializer, state)
      }
      if (ts.isShorthandPropertyAssignment(property) && property.name.text === wantedName) {
        return expressionVariants(property.name, state)
      }
    }
    return []
  }

  function jsxAttributeVariants(attributes, state) {
    return attributes.properties.flatMap((attribute) => {
      if (!ts.isJsxAttribute(attribute)
        || !USER_ATTRIBUTES.has(propertyName(attribute.name))
        || !attribute.initializer) return []

      if (ts.isStringLiteral(attribute.initializer)) {
        return [{ text: attribute.initializer.text, node: attribute.initializer }]
      }

      if (ts.isJsxExpression(attribute.initializer)) {
        return expressionVariants(attribute.initializer.expression, state)
      }

      return []
    })
  }

  function jsxVariants(node, state) {
    const attributes = ts.isJsxElement(node)
      ? jsxAttributeVariants(node.openingElement.attributes, state)
      : ts.isJsxSelfClosingElement(node)
        ? jsxAttributeVariants(node.attributes, state)
        : []

    if (ts.isJsxSelfClosingElement(node)) return attributes

    const children = node.children.flatMap((child) => {
      if (ts.isJsxText(child)) return [{ text: child.getText(source), node: child }]
      if (ts.isJsxExpression(child)) return expressionVariants(child.expression, state)
      if (ts.isJsxElement(child) || ts.isJsxSelfClosingElement(child) || ts.isJsxFragment(child)) {
        return jsxVariants(child, state)
      }
      return []
    })

    return [...attributes, ...children]
  }

  function renderCallbackVariants(call, state) {
    if (!ts.isPropertyAccessExpression(call.expression)
      || !RENDER_CALLBACK_CALLS.has(call.expression.name.text)) return []

    return call.arguments.flatMap((argument) => {
      if (!ts.isArrowFunction(argument) && !ts.isFunctionExpression(argument)) return []
      if (state.callStack.has(argument)) return []

      const nextState = {
        ...state,
        callStack: new Set([...state.callStack, argument]),
      }
      return returnExpressions(argument).flatMap((expression) => expressionVariants(expression, nextState))
    })
  }

  function expressionVariants(node, state = { callStack: new Set(), identifiers: new Set(), substitutions: new Map(), trustedCopyObject: false }) {
    if (!node) return []

    if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
      return [{ text: node.text, node }]
    }

    if (ts.isTemplateExpression(node)) {
      let variants = [{ text: node.head.text, node }]
      for (const span of node.templateSpans) {
        const expression = expressionVariants(span.expression, state)
        if (expression.length) variants = combine(variants, expression, node)
        variants = variants.map((variant) => ({ text: `${variant.text}${span.literal.text}`, node }))
      }
      return variants
    }

    if (ts.isConditionalExpression(node)) {
      // The condition contains state/DTO values, not copy. Only either rendered branch is copy.
      return [
        ...expressionVariants(node.whenTrue, state),
        ...expressionVariants(node.whenFalse, state),
      ]
    }

    if (ts.isBinaryExpression(node)) {
      if (isPlusToken(node.operatorToken.kind)) {
        return combine(
          expressionVariants(node.left, state),
          expressionVariants(node.right, state),
          node,
        )
      }

      if (isRenderedBranchOperator(node.operatorToken.kind)) {
        return [
          ...expressionVariants(node.left, state),
          ...expressionVariants(node.right, state),
        ]
      }

      // Equality, relational and arithmetic expressions are state, not rendered copy.
      return []
    }

    if (ts.isParenthesizedExpression(node)
      || ts.isAsExpression(node)
      || ts.isTypeAssertionExpression(node)
      || ts.isNonNullExpression(node)
      || ts.isSatisfiesExpression(node)) {
      return expressionVariants(node.expression, state)
    }

    if (ts.isIdentifier(node)) {
      if (state.identifiers.has(node.text)) return []
      const resolved = state.substitutions.get(node.text) ?? initializers.get(node.text)
      if (!resolved || ts.isArrowFunction(resolved) || ts.isFunctionExpression(resolved)) return []
      return expressionVariants(resolved, {
        ...state,
        identifiers: new Set([...state.identifiers, node.text]),
      })
    }

    if (ts.isPropertyAccessExpression(node)) {
      if (!ts.isIdentifier(node.expression)) return []
      const object = initializers.get(node.expression.text)
      if (!object || !ts.isObjectLiteralExpression(object)) return []
      return objectPropertyVariants(object, node.name.text, state)
    }

    if (ts.isElementAccessExpression(node)
      && ts.isIdentifier(node.expression)
      && node.argumentExpression
      && ts.isStringLiteralLike(node.argumentExpression)) {
      const object = initializers.get(node.expression.text)
      if (!object || !ts.isObjectLiteralExpression(object)) return []
      return objectPropertyVariants(object, node.argumentExpression.text, state)
    }

    if (ts.isCallExpression(node)) {
      const helper = helperVariants(node, state)
      if (helper.length) return helper
      const callback = renderCallbackVariants(node, state)
      if (callback.length) return callback
      if (ts.isIdentifier(node.expression) && node.expression.text === 'String' && node.arguments[0]) {
        return expressionVariants(node.arguments[0], state)
      }
      return []
    }

    if (ts.isArrayLiteralExpression(node)) {
      return node.elements.flatMap((element) => expressionVariants(element, state))
    }

    if (ts.isObjectLiteralExpression(node)) {
      return node.properties.flatMap((property) => {
        if (!ts.isPropertyAssignment(property)
          || (!state.trustedCopyObject && !USER_PROPERTIES.has(propertyName(property.name)))) return []
        return expressionVariants(property.initializer, state)
      })
    }

    if (ts.isJsxElement(node) || ts.isJsxSelfClosingElement(node) || ts.isJsxFragment(node)) {
      return jsxVariants(node, state)
    }

    return []
  }

  function variableName(node) {
    let current = node.parent
    while (current) {
      if (ts.isVariableDeclaration(current) && ts.isIdentifier(current.name)) return current.name.text
      current = current.parent
    }
    return ''
  }

  function visit(node) {
    if (ts.isJsxText(node)) {
      addVariants([{ text: node.getText(source), node }])
      return
    }

    if (ts.isJsxExpression(node)) {
      addVariants(expressionVariants(node.expression))
      return
    }

    if (ts.isJsxAttribute(node)) {
      if (USER_ATTRIBUTES.has(propertyName(node.name)) && node.initializer) {
        if (ts.isStringLiteral(node.initializer)) addVariants([{ text: node.initializer.text, node: node.initializer }])
        else if (ts.isJsxExpression(node.initializer)) addVariants(expressionVariants(node.initializer.expression))
      }
      return
    }

    if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name)
      if (USER_PROPERTIES.has(name) || USER_VARIABLE.test(variableName(node))) {
        addVariants(expressionVariants(node.initializer, {
          callStack: new Set(),
          identifiers: new Set(),
          substitutions: new Map(),
          trustedCopyObject: USER_VARIABLE.test(variableName(node)),
        }))
      }
      return
    }

    if (ts.isVariableDeclaration(node)
      && ts.isIdentifier(node.name)
      && node.initializer
      && USER_VARIABLE.test(node.name.text)) {
      addVariants(expressionVariants(node.initializer, {
        callStack: new Set(),
        identifiers: new Set(),
        substitutions: new Map(),
        trustedCopyObject: true,
      }))
      return
    }

    if (ts.isCallExpression(node) && node.arguments[0]) {
      const name = callName(node.expression)
      if (!USER_CALLS.has(name) && !USER_CALL_PATTERN.test(name)) {
        ts.forEachChild(node, visit)
        return
      }
      addVariants(expressionVariants(node.arguments[0]))
      return
    }

    if (ts.isNewExpression(node)
      && ts.isIdentifier(node.expression)
      && node.expression.text === 'Error'
      && node.arguments?.[0]) {
      addVariants(expressionVariants(node.arguments[0]))
      return
    }

    ts.forEachChild(node, visit)
  }

  visit(source)

  return [...new Map(entries.map((entry) => [`${entry.file}:${entry.line}:${entry.text}`, entry])).values()]
}
