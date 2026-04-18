import { evaluate, format, pi, e as euler, factorial, sqrt, log, asin, acos, atan, pow, type MathType } from 'mathjs';

export type Operator = '+' | '-' | '×' | '÷' | '%' | '^' | '!' ;

export interface HistoryItem {
  expression: string;
  result: string;
}

// Convert display operators to mathjs operators
const toMathExpr = (expr: string): string => {
  return expr
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/π/g, `(${pi})`)
    .replace(/e(?![x])/g, `(${euler})`)
    .replace(/√\(/g, 'sqrt(')
    .replace(/\^/g, '^');
};

// Handle percentage: convert "50%" to "0.5", "50+10%" to "50+0.1"
const handlePercentage = (expr: string): string => {
  return expr.replace(/(\d+\.?\d*)%/g, (match, num) => {
    const value = parseFloat(num) / 100;
    return value.toString();
  });
};

const toNumber = (val: MathType): number => {
  if (typeof val === 'number') return val;
  if (typeof val === 'string') return parseFloat(val);
  if (val && typeof val === 'object' && 're' in val) {
    // Complex number - return magnitude or real part
    const c = val as { re: number; im: number };
    return c.im === 0 ? c.re : Math.sqrt(c.re * c.re + c.im * c.im);
  }
  return 0;
};

export const calculate = (expression: string): string => {
  if (!expression || expression.trim() === '') return '0';
  
  try {
    let processedExpr = expression;
    
    // Handle factorial - must be at end of expression
    processedExpr = processedExpr.replace(/(\d+)!/g, (_, num) => factorial(parseInt(num)).toString());
    
    // Handle percentage
    processedExpr = handlePercentage(processedExpr);
    
    // Convert display operators
    processedExpr = toMathExpr(processedExpr);
    
    const result = evaluate(processedExpr);
    const numResult = toNumber(result);
    
    if (!isFinite(numResult)) {
      return 'Error';
    }
    
    return format(numResult, { precision: 14, notation: 'auto' });
  } catch (err) {
    console.log('Calculation error:', err);
    return 'Error';
  }
};

// Live preview evaluation for partial expressions
export const previewCalculate = (expression: string): string => {
  if (!expression || expression.trim() === '') return '0';
  
  try {
    let processedExpr = expression;
    
    // Handle factorial (only complete ones)
    processedExpr = processedExpr.replace(/(\d+)!/g, (_, num) => factorial(parseInt(num)).toString());
    
    // Handle percentage
    processedExpr = handlePercentage(processedExpr);
    
    // Convert display operators
    processedExpr = toMathExpr(processedExpr);
    
    const result = evaluate(processedExpr);
    const numResult = toNumber(result);
    
    if (!isFinite(numResult)) {
      return expression;
    }
    
    return format(numResult, { precision: 14, notation: 'auto' });
  } catch {
    return expression;
  }
};

export const formatDisplayNumber = (value: string): string => {
  const num = parseFloat(value);
  if (isNaN(num)) return value;
  
  // If number is very large or very small, use scientific notation
  if (Math.abs(num) >= 1e12 || (Math.abs(num) < 1e-6 && num !== 0)) {
    return format(num, { notation: 'exponential', precision: 6 });
  }
  
  // For regular numbers, add thousand separators if integer part is >= 4 digits
  const parts = value.split('.');
  const intPart = parts[0].replace(/,/g, '');
  const decimalPart = parts[1];
  
  if (intPart.replace(/-/g, '').length >= 4 && !value.includes('e')) {
    const formatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    return decimalPart ? `${formatted}.${decimalPart}` : formatted;
  }
  
  return value;
};

// Scientific functions mapping for display
export const SCIENTIFIC_FUNCTIONS: Record<string, (x: number) => number> = {
  'sin': (x) => Math.sin(x),
  'cos': (x) => Math.cos(x),
  'tan': (x) => Math.tan(x),
  'sin⁻¹': (x) => Math.asin(x),
  'cos⁻¹': (x) => Math.acos(x),
  'tan⁻¹': (x) => Math.atan(x),
  'log': (x) => Math.log10(x),
  'ln': (x) => Math.log(x),
  '√': (x) => Math.sqrt(x),
  'x²': (x) => pow(x, 2) as number,
  'x³': (x) => pow(x, 3) as number,
  'eˣ': (x) => Math.exp(x),
  '10ˣ': (x) => Math.pow(10, x),
};

export const SCIENTIFIC_KEYS = [
  ['sin', 'cos', 'tan', 'log', 'ln', '√'],
  ['x²', 'x³', 'eˣ', '10ˣ', 'π', 'e'],
  ['(', ')', '!', '^'],
];
