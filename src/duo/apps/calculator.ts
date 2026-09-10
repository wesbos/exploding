import type { PhoneApp } from './types'

type Operator = '+' | '-' | '*' | '/'

export function createCalculator() {
  let display = '0'
  let stored: number | null = null
  let operator: Operator | null = null
  let replace = false
  let repeated: { operator: Operator; value: number } | null = null
  let expression = ''
  const symbols = { '+': '+', '-': '\u2212', '*': '\u00d7', '/': '\u00f7' }
  const format = (value: number) => Number.isFinite(value) ? String(Number(value.toPrecision(12))) : 'Error'
  function calculate(a: number, b: number, op: Operator) {
    return op === '+' ? a + b : op === '-' ? a - b : op === '*' ? a * b : a / b
  }
  function input(key: string) {
    if (key === 'clear' || (display === 'Error' && /^[0-9.]$/.test(key))) {
      display = '0'
      stored = null
      operator = null
      repeated = null
      expression = ''
      replace = false
      if (key === 'clear') return
    }
    if (display === 'Error') return
    if (/^[0-9.]$/.test(key)) {
      if (replace) { display = '0'; replace = false }
      if (!operator) { repeated = null; expression = '' }
      if (key === '.') {
        if (!display.includes('.')) display += '.'
      } else if (display.replace(/[-.]/g, '').length < 12) {
        display = display === '0' ? key : display === '-0' ? `-${key}` : display + key
      }
    } else if (key === 'sign') {
      display = display.startsWith('-') ? display.slice(1) : `-${display}`
    } else if (key === 'percent') {
      display = format(Number(display) / 100)
    } else if (key === 'backspace') {
      if (!replace) display = display.length > 1 ? display.slice(0, -1) : '0'
      if (display === '-') display = '0'
    } else if (key === '+' || key === '-' || key === '*' || key === '/') {
      if (operator && stored !== null && !replace) display = format(calculate(stored, Number(display), operator))
      stored = Number(display)
      operator = key
      expression = `${display} ${symbols[key]}`
      replace = true
      repeated = null
    } else if (key === '=') {
      const operation = operator ?? repeated?.operator
      const operand = operator ? Number(display) : repeated?.value
      if (operation && operand !== undefined) {
        const first = operator && stored !== null ? stored : Number(display)
        expression = `${format(first)} ${symbols[operation]} ${format(operand)} =`
        display = format(calculate(first, operand, operation))
        repeated = { operator: operation, value: operand }
      }
      stored = null
      operator = null
      replace = true
    }
  }
  return { input, get display() { return display }, get expression() { return expression }, get operator() { return operator } }
}

export const calculatorApp: PhoneApp = {
  id: 'calculator',
  name: 'Calculator',
  icon: '+',
  color: '#ff9f0a',
  create() {
    const calculator = createCalculator()
    const left = document.createElement('section')
    left.className = 'calculator-result'
    left.innerHTML = `
      <h2>History</h2>
      <ol class="calculator-history" aria-label="Previous calculations"></ol>
    `
    const right = document.createElement('section')
    right.className = 'calculator-main'
    right.setAttribute('aria-label', 'Calculator')
    right.innerHTML = `
      <div class="calculator-readout">
        <p class="calculator-expression"></p>
        <output class="calculator-value" aria-label="Result" aria-live="polite" aria-atomic="true">0</output>
      </div>
      <div class="calculator-keypad" role="group" aria-label="Calculator keypad"></div>
    `
    const keypad = right.querySelector('.calculator-keypad')!
    const keys = [
      ['backspace', '\u232b', 'Delete last digit', 'utility'], ['clear', 'AC', 'Clear all', 'utility'], ['percent', '%', 'Percent', 'utility'], ['/', '\u00f7', 'Divide', 'operator'],
      ['7', '7'], ['8', '8'], ['9', '9'], ['*', '\u00d7', 'Multiply', 'operator'],
      ['4', '4'], ['5', '5'], ['6', '6'], ['-', '\u2212', 'Subtract', 'operator'],
      ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'Add', 'operator'],
      ['sign', '\u00b1', 'Change sign'], ['0', '0'], ['.', '.', 'Decimal point'], ['=', '=', 'Equals', 'operator'],
    ]
    function update(key: string) {
      calculator.input(key)
      right.querySelector('output')!.textContent = calculator.display
      right.querySelector('.calculator-expression')!.textContent = calculator.expression
      right.querySelector('output')!.classList.toggle('long-result', calculator.display.length > 8)
      if (key === '=' && calculator.expression.endsWith('=')) {
        const entry = document.createElement('li')
        const expression = document.createElement('span')
        const result = document.createElement('strong')
        expression.textContent = calculator.expression
        result.textContent = calculator.display
        entry.append(expression, result)
        const history = left.querySelector('.calculator-history')!
        history.append(entry)
        entry.scrollIntoView({ block: 'nearest' })
      }
      right.querySelectorAll<HTMLButtonElement>('[data-operator]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.key === calculator.operator))
      })
    }
    for (const [key, label, name, kind] of keys) {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = label
      if (key === 'backspace') button.innerHTML = '<svg viewBox="0 0 30 24" aria-hidden="true"><path d="M11 3h14a3 3 0 0 1 3 3v12a3 3 0 0 1-3 3H11L2 12zM14 8l8 8m0-8-8 8" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>'
      if (key === 'sign') button.innerHTML = '<svg viewBox="0 0 30 30" aria-hidden="true"><path d="M3 8h10M8 3v10M18 23h10M7 27 23 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>'
      button.dataset.key = key
      button.className = `calculator-key ${kind ?? 'digit'}`
      button.setAttribute('aria-label', name ?? label)
      if (['+', '-', '*', '/'].includes(key)) {
        button.dataset.operator = ''
        button.setAttribute('aria-pressed', 'false')
      }
      button.addEventListener('click', () => update(key))
      keypad.append(button)
    }
    return {
      left, right,
      onKey(event) {
        if (event.ctrlKey || event.metaKey || event.altKey) return false
        const key = event.key === 'Enter' ? '=' : event.key === 'Backspace' ? 'backspace' : event.key === 'Delete' ? 'clear' : event.key === '%' ? 'percent' : event.key
        if (!/^[0-9.+*/=-]$/.test(key) && !['backspace', 'clear', 'percent'].includes(key)) return false
        update(key)
        return true
      },
    }
  },
}
