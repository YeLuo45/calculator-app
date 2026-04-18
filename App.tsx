import React, { useState, useCallback, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView, useColorScheme, TextInput, Modal, Pressable } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme, MD3LightTheme, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { calculate, formatDisplayNumber, SCIENTIFIC_KEYS } from './src/utils/calculator';
import { CATEGORY_KEYS, CATEGORY_NAMES, convertUnit, CATEGORY_UNITS } from './src/utils/units';
import { fetchExchangeRates, SUPPORTED_CURRENCIES, convertCurrency, getDefaultRates, CachedRates } from './src/services/exchangeRate';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Types
type CalculatorMode = 'basic' | 'scientific' | 'convert';
type ConvertSubMode = 'unit' | 'currency';
type UnitCategory = 'length' | 'weight' | 'temperature' | 'area' | 'volume' | 'speed';

interface ButtonDef {
  label: string;
  value: string;
  type: 'number' | 'operator' | 'action' | 'function';
  style?: 'accent' | 'secondary' | 'special';
}

// Light Theme Colors
const lightColors = {
  primary: '#4CAF50',
  background: '#FAFAFA',
  surface: '#FFFFFF',
  buttonNumber: '#FFFFFF',
  buttonNumberText: '#212121',
  buttonOperator: '#E8F5E9',
  buttonOperatorText: '#4CAF50',
  buttonAccent: '#4CAF50',
  buttonAccentText: '#FFFFFF',
  buttonAction: '#F5F5F5',
  buttonActionText: '#212121',
  textPrimary: '#212121',
  textSecondary: '#757575',
  displayBg: '#FFFFFF',
};

// Dark Theme Colors
const darkColors = {
  primary: '#81C784',
  background: '#121212',
  surface: '#1E1E1E',
  buttonNumber: '#2D2D2D',
  buttonNumberText: '#FFFFFF',
  buttonOperator: '#1B5E20',
  buttonOperatorText: '#81C784',
  buttonAccent: '#4CAF50',
  buttonAccentText: '#FFFFFF',
  buttonAction: '#3D3D3D',
  buttonActionText: '#FFFFFF',
  textPrimary: '#FFFFFF',
  textSecondary: '#B0B0B0',
  displayBg: '#1E1E1E',
};

// Basic calculator buttons
const BASIC_BUTTONS: ButtonDef[][] = [
  [
    { label: 'AC', value: 'AC', type: 'action' },
    { label: '(', value: '(', type: 'function' },
    { label: ')', value: ')', type: 'function' },
    { label: '÷', value: '÷', type: 'operator', style: 'secondary' },
  ],
  [
    { label: '7', value: '7', type: 'number' },
    { label: '8', value: '8', type: 'number' },
    { label: '9', value: '9', type: 'number' },
    { label: '×', value: '×', type: 'operator', style: 'secondary' },
  ],
  [
    { label: '4', value: '4', type: 'number' },
    { label: '5', value: '5', type: 'number' },
    { label: '6', value: '6', type: 'number' },
    { label: '-', value: '-', type: 'operator', style: 'secondary' },
  ],
  [
    { label: '1', value: '1', type: 'number' },
    { label: '2', value: '2', type: 'number' },
    { label: '3', value: '3', type: 'number' },
    { label: '+', value: '+', type: 'operator', style: 'secondary' },
  ],
  [
    { label: '±', value: 'NEGATE', type: 'action' },
    { label: '0', value: '0', type: 'number' },
    { label: '.', value: '.', type: 'number' },
    { label: '=', value: '=', type: 'operator', style: 'accent' },
  ],
];

export default function App() {
  const systemColorScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemColorScheme === 'dark');
  
  useEffect(() => {
    setIsDark(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const colors = isDark ? darkColors : lightColors;

  const [mode, setMode] = useState<CalculatorMode>('basic');
  const [expression, setExpression] = useState<string>('');
  const [display, setDisplay] = useState<string>('0');
  const [history, setHistory] = useState<{ expression: string; result: string }[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  // Unit conversion state
  const [unitCategory, setUnitCategory] = useState<UnitCategory>('length');
  const [fromUnit, setFromUnit] = useState<string>('meter');
  const [toUnit, setToUnit] = useState<string>('centimeter');
  const [unitInput, setUnitInput] = useState<string>('');
  const [unitResult, setUnitResult] = useState<string>('');

  // Currency conversion state
  const [fromCurrency, setFromCurrency] = useState<string>('USD');
  const [toCurrency, setToCurrency] = useState<string>('CNY');
  const [currencyInput, setCurrencyInput] = useState<string>('');
  const [currencyResult, setCurrencyResult] = useState<string>('');
  const [exchangeRates, setExchangeRates] = useState<CachedRates | null>(null);
  const [ratesLoading, setRatesLoading] = useState<boolean>(false);
  const [convertSubMode, setConvertSubMode] = useState<ConvertSubMode>('unit');

  // Load exchange rates on mount
  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    setRatesLoading(true);
    try {
      const rates = await fetchExchangeRates('USD');
      setExchangeRates(rates);
    } catch (error) {
      console.error('Failed to load exchange rates:', error);
      setExchangeRates(getDefaultRates());
    }
    setRatesLoading(false);
  };

  // Get current units for selected category
  const getCurrentUnits = () => {
    return Object.entries(CATEGORY_UNITS[unitCategory] || {}).map(([key, val]) => ({
      key,
      ...val,
    }));
  };

  // Handle unit conversion
  const handleUnitConvert = useCallback(() => {
    const num = parseFloat(unitInput);
    if (isNaN(num)) {
      setUnitResult('');
      return;
    }
    const result = convertUnit(num, fromUnit, toUnit, unitCategory);
    setUnitResult(formatDisplayNumber(result.toPrecision(12)));
  }, [unitInput, fromUnit, toUnit, unitCategory]);

  useEffect(() => {
    handleUnitConvert();
  }, [handleUnitConvert]);

  // Handle currency conversion
  const handleCurrencyConvert = useCallback(async () => {
    const num = parseFloat(currencyInput);
    if (isNaN(num)) {
      setCurrencyResult('');
      return;
    }
    try {
      const result = await convertCurrency(num, fromCurrency, toCurrency);
      setCurrencyResult(result.toFixed(2));
    } catch (error) {
      console.error('Currency conversion error:', error);
      setCurrencyResult('Error');
    }
  }, [currencyInput, fromCurrency, toCurrency]);

  useEffect(() => {
    handleCurrencyConvert();
  }, [handleCurrencyConvert]);

  // Basic calculator logic
  const handleBasicPress = useCallback((btn: ButtonDef) => {
    if (btn.type === 'action') {
      if (btn.value === 'AC') {
        setExpression('');
        setDisplay('0');
      } else if (btn.value === 'NEGATE') {
        if (expression.startsWith('-')) {
          setExpression(expression.slice(1));
        } else if (expression) {
          setExpression('-' + expression);
        }
      }
    } else if (btn.type === 'operator' && btn.value === '=') {
      if (!expression) return;
      const result = calculate(expression);
      setDisplay(result === 'Error' ? 'Error' : formatDisplayNumber(result));
      setHistory(prev => [{ expression, result }, ...prev].slice(0, 20));
      setExpression('');
    } else {
      const newExpr = expression + btn.value;
      setExpression(newExpr);
      
      // Live preview
      if (['+', '-', '×', '÷', '(', ')'].some(op => newExpr.endsWith(op))) {
        setDisplay(btn.value === '(' ? '(' : btn.value);
      } else {
        const preview = calculate(newExpr);
        setDisplay(preview === 'Error' ? newExpr : formatDisplayNumber(preview));
      }
    }
  }, [expression]);

  // Scientific function handling
  const handleScientificPress = useCallback((func: string) => {
    if (func === 'π') {
      const newExpr = expression + 'π';
      setExpression(newExpr);
      const preview = calculate(newExpr);
      setDisplay(preview === 'Error' ? 'π' : formatDisplayNumber(preview));
    } else if (func === 'e') {
      const newExpr = expression + 'e';
      setExpression(newExpr);
      const preview = calculate(newExpr);
      setDisplay(preview === 'Error' ? 'e' : formatDisplayNumber(preview));
    } else if (['sin', 'cos', 'tan', 'log', 'ln', '√'].includes(func)) {
      const newExpr = expression + func + '(';
      setExpression(newExpr);
      setDisplay(func + '(');
    } else if (func === 'x²') {
      const newExpr = expression + '^2';
      setExpression(newExpr);
      const preview = calculate(newExpr);
      setDisplay(preview === 'Error' ? expression + '²' : formatDisplayNumber(preview));
    } else if (func === 'x³') {
      const newExpr = expression + '^3';
      setExpression(newExpr);
      const preview = calculate(newExpr);
      setDisplay(preview === 'Error' ? expression + '³' : formatDisplayNumber(preview));
    } else if (func === 'eˣ') {
      const newExpr = expression + 'e^';
      setExpression(newExpr);
      setDisplay('e^');
    } else if (func === '10ˣ') {
      const newExpr = expression + '10^';
      setExpression(newExpr);
      setDisplay('10^');
    } else if (func === 'C') {
      setExpression('');
      setDisplay('0');
    }
  }, [expression]);

  const renderButton = (
    btn: ButtonDef,
    onPress: () => void,
    key: string,
    isWide?: boolean
  ) => {
    const isSecondary = btn.style === 'secondary';
    const isAccent = btn.style === 'accent';
    const isSpecial = btn.style === 'special';

    let bgColor = colors.buttonNumber;
    let textColor = colors.buttonNumberText;

    if (isSecondary) {
      bgColor = colors.buttonOperator;
      textColor = colors.buttonOperatorText;
    } else if (isAccent) {
      bgColor = colors.buttonAccent;
      textColor = colors.buttonAccentText;
    } else if (isSpecial) {
      bgColor = colors.buttonAction;
      textColor = colors.buttonActionText;
    }

    return (
      <TouchableOpacity
        key={key}
        style={[
          styles.button,
          { backgroundColor: bgColor },
          isWide && styles.buttonWide,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text style={[styles.buttonText, { color: textColor }]}>{btn.label}</Text>
      </TouchableOpacity>
    );
  };

  // Render unit selector
  const renderUnitSelector = (
    value: string,
    onChange: (v: string) => void,
    units: { key: string; symbol: string; name: string }[]
  ) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
      {units.map(unit => (
        <TouchableOpacity
          key={unit.key}
          style={[
            styles.unitChip,
            value === unit.key && { backgroundColor: colors.primary },
          ]}
          onPress={() => onChange(unit.key)}
        >
          <Text style={[styles.unitChipText, value === unit.key && { color: '#FFF' }]}>
            {unit.symbol}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render currency selector
  const renderCurrencySelector = (
    value: string,
    onChange: (v: string) => void,
    currencies: { code: string; name: string; symbol: string }[]
  ) => (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.unitScroll}>
      {currencies.map(cur => (
        <TouchableOpacity
          key={cur.code}
          style={[
            styles.unitChip,
            value === cur.code && { backgroundColor: colors.primary },
          ]}
          onPress={() => onChange(cur.code)}
        >
          <Text style={[styles.unitChipText, value === cur.code && { color: '#FFF' }]}>
            {cur.code}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  // Render basic calculator pad
  const renderBasicPad = () => (
    <View style={styles.pad}>
      {BASIC_BUTTONS.map((row, rowIndex) => (
        <View key={rowIndex} style={styles.row}>
          {row.map((btn, btnIndex) =>
            renderButton(
              btn,
              () => handleBasicPress(btn),
              `basic-${rowIndex}-${btnIndex}`,
              btn.label === '0'
            )
          )}
        </View>
      ))}
    </View>
  );

  // Render scientific pad
  const renderScientificPad = () => (
    <View style={styles.pad}>
      {/* Scientific function row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sciScroll}>
        {SCIENTIFIC_KEYS[0].map((func, i) => (
          <TouchableOpacity
            key={`sci-func-${i}`}
            style={[styles.sciButton, { backgroundColor: colors.buttonOperator }]}
            onPress={() => handleScientificPress(func)}
          >
            <Text style={[styles.sciButtonText, { color: colors.buttonOperatorText }]}>{func}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Second row of scientific functions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sciScroll}>
        {SCIENTIFIC_KEYS[1].map((func, i) => (
          <TouchableOpacity
            key={`sci-func2-${i}`}
            style={[styles.sciButton, { backgroundColor: colors.buttonOperator }]}
            onPress={() => handleScientificPress(func)}
          >
            <Text style={[styles.sciButtonText, { color: colors.buttonOperatorText }]}>{func}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Basic pad */}
      {BASIC_BUTTONS.map((row, rowIndex) => (
        <View key={`basic-row-${rowIndex}`} style={styles.row}>
          {row.map((btn, btnIndex) =>
            renderButton(
              btn,
              () => handleBasicPress(btn),
              `basic-${rowIndex}-${btnIndex}`,
              btn.label === '0'
            )
          )}
        </View>
      ))}
    </View>
  );

  // Render unit conversion panel
  const renderUnitPanel = () => {
    const units = getCurrentUnits();
    
    return (
      <View style={styles.convertPanel}>
        <Text style={[styles.convertTitle, { color: colors.textPrimary }]}>
          {CATEGORY_NAMES[unitCategory]}
        </Text>

        {/* Category selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {CATEGORY_KEYS.map(cat => (
            <TouchableOpacity
              key={cat}
              style={[
                styles.categoryChip,
                unitCategory === cat && { backgroundColor: colors.primary },
              ]}
              onPress={() => {
                setUnitCategory(cat);
                const catUnits = Object.keys(CATEGORY_UNITS[cat] || {});
                setFromUnit(catUnits[0]);
                setToUnit(catUnits[1] || catUnits[0]);
                setUnitInput('');
                setUnitResult('');
              }}
            >
              <Text style={[styles.categoryChipText, unitCategory === cat && { color: '#FFF' }]}>
                {CATEGORY_NAMES[cat]}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* From unit */}
        <Text style={[styles.convertLabel, { color: colors.textSecondary }]}>从</Text>
        {renderUnitSelector(fromUnit, setFromUnit, units)}

        {/* Input */}
        <TextInput
          style={[styles.convertInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.primary }]}
          value={unitInput}
          onChangeText={setUnitInput}
          placeholder="输入数值"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />

        {/* To unit */}
        <Text style={[styles.convertLabel, { color: colors.textSecondary }]}>到</Text>
        {renderUnitSelector(toUnit, setToUnit, units)}

        {/* Result */}
        <View style={[styles.convertResult, { backgroundColor: colors.surface }]}>
          <Text style={[styles.convertResultText, { color: colors.primary }]}>
            {unitResult || '0'} {units.find(u => u.key === toUnit)?.symbol || ''}
          </Text>
        </View>
      </View>
    );
  };

  // Render currency conversion panel
  const renderCurrencyPanel = () => {
    return (
      <View style={styles.convertPanel}>
        <View style={styles.currencyHeader}>
          <Text style={[styles.convertTitle, { color: colors.textPrimary }]}>汇率换算</Text>
          {ratesLoading && <ActivityIndicator size="small" color={colors.primary} />}
        </View>

        {/* From currency */}
        <Text style={[styles.convertLabel, { color: colors.textSecondary }]}>从</Text>
        {renderCurrencySelector(fromCurrency, setFromCurrency, SUPPORTED_CURRENCIES)}

        {/* Input */}
        <TextInput
          style={[styles.convertInput, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.primary }]}
          value={currencyInput}
          onChangeText={setCurrencyInput}
          placeholder="输入金额"
          placeholderTextColor={colors.textSecondary}
          keyboardType="numeric"
        />

        {/* Swap button */}
        <TouchableOpacity
          style={[styles.swapButton, { backgroundColor: colors.buttonOperator }]}
          onPress={() => {
            const temp = fromCurrency;
            setFromCurrency(toCurrency);
            setToCurrency(temp);
          }}
        >
          <Text style={[styles.swapButtonText, { color: colors.buttonOperatorText }]}>⇄ 交换</Text>
        </TouchableOpacity>

        {/* To currency */}
        <Text style={[styles.convertLabel, { color: colors.textSecondary }]}>到</Text>
        {renderCurrencySelector(toCurrency, setToCurrency, SUPPORTED_CURRENCIES)}

        {/* Result */}
        <View style={[styles.convertResult, { backgroundColor: colors.surface }]}>
          <Text style={[styles.convertResultText, { color: colors.primary }]}>
            {currencyResult || '0'} {toCurrency}
          </Text>
        </View>

        {/* Exchange rate info */}
        {exchangeRates && exchangeRates.rates[toCurrency] && (
          <Text style={[styles.rateInfo, { color: colors.textSecondary }]}>
            1 {fromCurrency} = {exchangeRates.rates[toCurrency]?.toFixed(4)} {toCurrency}
          </Text>
        )}
      </View>
    );
  };

  const paperTheme = isDark
    ? { ...MD3DarkTheme, colors: { ...MD3DarkTheme.colors, primary: colors.primary } }
    : { ...MD3LightTheme, colors: { ...MD3LightTheme.colors, primary: colors.primary } };

  return (
    <PaperProvider theme={paperTheme}>
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar style={isDark ? 'light' : 'dark'} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>计算器</Text>
          <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
            <Text style={[styles.historyToggle, { color: colors.primary }]}>
              {showHistory ? '关闭' : '历史'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Mode Tab */}
        <View style={styles.modeTab}>
          <SegmentedButtons
            value={mode}
            onValueChange={(value) => setMode(value as CalculatorMode)}
            buttons={[
              { value: 'basic', label: '基础' },
              { value: 'scientific', label: '科学' },
              { value: 'convert', label: '转换' },
            ]}
            style={styles.segmentedButtons}
          />
        </View>

        {/* Display */}
        <View style={[styles.display, { backgroundColor: colors.displayBg }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.expressionScroll}>
            <Text style={[styles.expressionText, { color: colors.textSecondary }]}>
              {expression || ''}
            </Text>
          </ScrollView>
          <Text style={[styles.displayText, { color: colors.textPrimary }]} numberOfLines={1} adjustsFontSizeToFit>
            {display}
          </Text>
        </View>

        {/* History Panel */}
        {showHistory && mode === 'basic' && (
          <View style={[styles.historyPanel, { backgroundColor: colors.surface }]}>
            <Text style={[styles.historyTitle, { color: colors.textSecondary }]}>历史记录</Text>
            <ScrollView style={styles.historyList}>
              {history.length === 0 ? (
                <Text style={[styles.historyEmpty, { color: colors.textSecondary }]}>暂无记录</Text>
              ) : (
                history.map((item, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.historyItem}
                    onPress={() => {
                      setExpression(item.result);
                      setDisplay(item.result);
                      setShowHistory(false);
                    }}
                  >
                    <Text style={[styles.historyExpression, { color: colors.textSecondary }]}>
                      {item.expression}
                    </Text>
                    <Text style={[styles.historyResult, { color: colors.textPrimary }]}>
                      = {item.result}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>
        )}

        {/* Content based on mode */}
        {mode === 'basic' && renderBasicPad()}
        {mode === 'scientific' && renderScientificPad()}
        {mode === 'convert' && (
          <View style={styles.convertContainer}>
            <SegmentedButtons
              value={convertSubMode}
              onValueChange={(value) => setConvertSubMode(value as ConvertSubMode)}
              buttons={[
                { value: 'unit', label: '单位' },
                { value: 'currency', label: '汇率' },
              ]}
              style={styles.convertSegmented}
            />
            {convertSubMode === 'unit' ? renderUnitPanel() : renderCurrencyPanel()}
          </View>
        )}
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  historyToggle: {
    fontSize: 16,
  },
  modeTab: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  segmentedButtons: {
    borderRadius: 8,
  },
  display: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    minHeight: 100,
    justifyContent: 'flex-end',
  },
  expressionScroll: {
    maxHeight: 30,
  },
  expressionText: {
    fontSize: 24,
    textAlign: 'right',
  },
  displayText: {
    fontSize: 64,
    fontWeight: '300',
    textAlign: 'right',
  },
  historyPanel: {
    marginHorizontal: 16,
    borderRadius: 16,
    padding: 16,
    maxHeight: 200,
  },
  historyTitle: {
    fontSize: 14,
    marginBottom: 10,
  },
  historyList: {
    flex: 1,
  },
  historyEmpty: {
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128,128,128,0.2)',
  },
  historyExpression: {
    fontSize: 16,
  },
  historyResult: {
    fontSize: 16,
    fontWeight: '500',
  },
  pad: {
    paddingHorizontal: 12,
    paddingBottom: 30,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    flex: 1,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 6,
  },
  buttonWide: {
    flex: 2.3,
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '400',
  },
  sciScroll: {
    marginBottom: 8,
  },
  sciButton: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginRight: 8,
    minWidth: 50,
    alignItems: 'center',
  },
  sciButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  convertContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  convertSegmented: {
    marginBottom: 16,
  },
  convertPanel: {
    flex: 1,
  },
  convertTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryScroll: {
    marginBottom: 16,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  unitScroll: {
    marginBottom: 12,
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    backgroundColor: 'rgba(128,128,128,0.2)',
  },
  unitChipText: {
    fontSize: 14,
    color: '#666',
  },
  convertLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  convertInput: {
    borderWidth: 2,
    borderRadius: 12,
    padding: 16,
    fontSize: 24,
    marginBottom: 16,
  },
  swapButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 16,
  },
  swapButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  convertResult: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  convertResultText: {
    fontSize: 32,
    fontWeight: '500',
  },
  currencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  rateInfo: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 12,
  },
});
