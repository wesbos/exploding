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
      <p class="phone-eyebrow">A LITTLE ROOM TO THINK</p>
      <h2>Calculator</h2>
      <div class="calculator-readout">
        <p class="calculator-expression"></p>
        <output class="calculator-value" aria-label="Result" aria-live="polite" aria-atomic="true">0</output>
      </div>
      <p class="calculator-hint">Tap the keys. Or use your keyboard.<br>Backspace to delete. Esc to go home.</p>
    `
    const right = document.createElement('section')
    right.className = 'calculator-keypad'
    right.setAttribute('aria-label', 'Calculator keypad')
    const keys = [
      ['clear', 'AC', 'Clear all', 'utility'], ['sign', '\u00b1', 'Change sign', 'utility'], ['percent', '%', 'Percent', 'utility'], ['/', '\u00f7', 'Divide', 'operator'],
      ['7', '7'], ['8', '8'], ['9', '9'], ['*', '\u00d7', 'Multiply', 'operator'],
      ['4', '4'], ['5', '5'], ['6', '6'], ['-', '\u2212', 'Subtract', 'operator'],
      ['1', '1'], ['2', '2'], ['3', '3'], ['+', '+', 'Add', 'operator'],
      ['backspace', '\u232b', 'Delete last digit', 'utility'], ['0', '0'], ['.', '.', 'Decimal point'], ['=', '=', 'Equals', 'operator'],
    ]
    function update(key: string) {
      calculator.input(key)
      left.querySelector('output')!.textContent = calculator.display
      left.querySelector('.calculator-expression')!.textContent = calculator.expression
      left.querySelector('output')!.classList.toggle('long-result', calculator.display.length > 8)
      right.querySelectorAll<HTMLButtonElement>('[data-operator]').forEach(button => {
        button.setAttribute('aria-pressed', String(button.dataset.key === calculator.operator))
      })
    }
    for (const [key, label, name, kind] of keys) {
      const button = document.createElement('button')
      button.type = 'button'
      button.textContent = label
      button.dataset.key = key
      button.className = `calculator-key ${kind ?? 'digit'}`
      button.setAttribute('aria-label', name ?? label)
      if (['+', '-', '*', '/'].includes(key)) {
        button.dataset.operator = ''
        button.setAttribute('aria-pressed', 'false')
      }
      button.addEventListener('click', () => update(key))
      right.append(button)
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
