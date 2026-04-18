// Unit conversion utilities

export type UnitCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed';

export interface UnitItem {
  name: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (v: number) => number;
}

// Length: base unit is meter
const lengthUnits: Record<string, UnitItem> = {
  meter: { name: '米', symbol: 'm', toBase: (v) => v, fromBase: (v) => v },
  centimeter: { name: '厘米', symbol: 'cm', toBase: (v) => v * 0.01, fromBase: (v) => v / 0.01 },
  millimeter: { name: '毫米', symbol: 'mm', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  kilometer: { name: '公里', symbol: 'km', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  inch: { name: '英寸', symbol: 'in', toBase: (v) => v * 0.0254, fromBase: (v) => v / 0.0254 },
  foot: { name: '英尺', symbol: 'ft', toBase: (v) => v * 0.3048, fromBase: (v) => v / 0.3048 },
  yard: { name: '码', symbol: 'yd', toBase: (v) => v * 0.9144, fromBase: (v) => v / 0.9144 },
  mile: { name: '英里', symbol: 'mi', toBase: (v) => v * 1609.344, fromBase: (v) => v / 1609.344 },
};

// Weight: base unit is kilogram
const weightUnits: Record<string, UnitItem> = {
  kilogram: { name: '千克', symbol: 'kg', toBase: (v) => v, fromBase: (v) => v },
  gram: { name: '克', symbol: 'g', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  milligram: { name: '毫克', symbol: 'mg', toBase: (v) => v * 0.000001, fromBase: (v) => v / 0.000001 },
  pound: { name: '磅', symbol: 'lb', toBase: (v) => v * 0.453592, fromBase: (v) => v / 0.453592 },
  ounce: { name: '盎司', symbol: 'oz', toBase: (v) => v * 0.0283495, fromBase: (v) => v / 0.0283495 },
  ton: { name: '吨', symbol: 't', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
};

// Temperature: base unit is Celsius
const temperatureUnits: Record<string, UnitItem> = {
  celsius: { name: '摄氏度', symbol: '°C', toBase: (v) => v, fromBase: (v) => v },
  fahrenheit: { name: '华氏度', symbol: '°F', toBase: (v) => (v - 32) * 5/9, fromBase: (v) => v * 9/5 + 32 },
  kelvin: { name: '开尔文', symbol: 'K', toBase: (v) => v - 273.15, fromBase: (v) => v + 273.15 },
};

// Area: base unit is square meter
const areaUnits: Record<string, UnitItem> = {
  squareMeter: { name: '平方米', symbol: 'm²', toBase: (v) => v, fromBase: (v) => v },
  squareCentimeter: { name: '平方厘米', symbol: 'cm²', toBase: (v) => v * 0.0001, fromBase: (v) => v / 0.0001 },
  squareKilometer: { name: '平方公里', symbol: 'km²', toBase: (v) => v * 1000000, fromBase: (v) => v / 1000000 },
  acre: { name: '英亩', symbol: 'ac', toBase: (v) => v * 4046.86, fromBase: (v) => v / 4046.86 },
  hectare: { name: '公顷', symbol: 'ha', toBase: (v) => v * 10000, fromBase: (v) => v / 10000 },
  mu: { name: '亩', symbol: '亩', toBase: (v) => v * 666.667, fromBase: (v) => v / 666.667 },
};

// Volume: base unit is liter
const volumeUnits: Record<string, UnitItem> = {
  liter: { name: '升', symbol: 'L', toBase: (v) => v, fromBase: (v) => v },
  milliliter: { name: '毫升', symbol: 'mL', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
  gallon: { name: '加仑(美)', symbol: 'gal', toBase: (v) => v * 3.78541, fromBase: (v) => v / 3.78541 },
  quart: { name: '夸脱', symbol: 'qt', toBase: (v) => v * 0.946353, fromBase: (v) => v / 0.946353 },
  cubicMeter: { name: '立方米', symbol: 'm³', toBase: (v) => v * 1000, fromBase: (v) => v / 1000 },
  cubicCentimeter: { name: '立方厘米', symbol: 'cm³', toBase: (v) => v * 0.001, fromBase: (v) => v / 0.001 },
};

// Speed: base unit is meter per second
const speedUnits: Record<string, UnitItem> = {
  meterPerSecond: { name: '米/秒', symbol: 'm/s', toBase: (v) => v, fromBase: (v) => v },
  kilometerPerHour: { name: '公里/小时', symbol: 'km/h', toBase: (v) => v / 3.6, fromBase: (v) => v * 3.6 },
  milePerHour: { name: '英里/小时', symbol: 'mph', toBase: (v) => v * 0.44704, fromBase: (v) => v / 0.44704 },
  knot: { name: '节', symbol: 'kn', toBase: (v) => v * 0.514444, fromBase: (v) => v / 0.514444 },
};

export const CATEGORY_UNITS: Record<UnitCategory, Record<string, UnitItem>> = {
  length: lengthUnits,
  weight: weightUnits,
  temperature: temperatureUnits,
  area: areaUnits,
  volume: volumeUnits,
  speed: speedUnits,
};

export const CATEGORY_NAMES: Record<UnitCategory, string> = {
  length: '长度',
  weight: '重量',
  temperature: '温度',
  area: '面积',
  volume: '体积',
  speed: '速度',
};

export const CATEGORY_KEYS: UnitCategory[] = ['length', 'weight', 'temperature', 'area', 'volume', 'speed'];

export const convertUnit = (
  value: number,
  fromUnit: string,
  toUnit: string,
  category: UnitCategory
): number => {
  const units = CATEGORY_UNITS[category];
  if (!units || !units[fromUnit] || !units[toUnit]) {
    return NaN;
  }
  
  const baseValue = units[fromUnit].toBase(value);
  return units[toUnit].fromBase(baseValue);
};
