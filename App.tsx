import React, { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { StatusBar } from 'expo-status-bar';

// Types
type Operator = '+' | '-' | '×' | '÷' | '%';
type HistoryItem = { expression: string; result: string };

// Button definitions
interface ButtonDef {
  label: string;
  value: string;
  type: 'number' | 'operator' | 'action' | 'function';
  style?: 'accent' | 'secondary';
}

const BUTTONS: ButtonDef[][] = [
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
    { label: '0', value: '0', type: 'number' },
    { label: '.', value: '.', type: 'number' },
    { label: '⌫', value: 'BACK', type: 'action' },
    { label: '=', value: '=', type: 'operator', style: 'accent' },
  ],
];

// Evaluation logic
function evaluate(expr: string): string {
  try {
    // Replace display operators with JS operators
    let jsExpr = expr
      .replace(/×/g, '*')
      .replace(/÷/g, '/')
      .replace(/%/g, '/100');
    
    // Prevent unsafe evaluation
    if (!/^[\d\s+\-*/().]+$/.test(jsExpr)) {
      return 'Error';
    }

    const result = Function('"use strict"; return (' + jsExpr + ')')();
    
    if (!isFinite(result)) {
      return result === Infinity || result === -Infinity ? 'Error' : 'Error';
    }

    // Format result: remove unnecessary decimals
    const formatted = Number(result.toFixed(10)).toString();
    return formatted;
  } catch {
    return 'Error';
  }
}

// Format large numbers with commas
function formatDisplay(expr: string): string {
  return expr;
}

export default function App() {
  const [expression, setExpression] = useState<string>('');
  const [display, setDisplay] = useState<string>('0');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [showHistory, setShowHistory] = useState<boolean>(false);

  const handlePress = useCallback((btn: ButtonDef) => {
    if (btn.type === 'action') {
      if (btn.value === 'AC') {
        setExpression('');
        setDisplay('0');
      } else if (btn.value === 'BACK') {
        setExpression(prev => {
          const next = prev.slice(0, -1);
          return next;
        });
        setDisplay(prev => (prev.length > 1 ? prev.slice(0, -1) : '0'));
      }
    } else if (btn.type === 'operator' && btn.value === '=') {
      if (!expression) return;
      const result = evaluate(expression);
      setDisplay(result === 'Error' ? 'Error' : result);
      setHistory(prev => [{ expression, result }, ...prev].slice(0, 20));
      setExpression('');
    } else {
      const newExpr = expression + btn.value;
      setExpression(newExpr);
      // Live preview evaluation
      if (['+', '-', '×', '÷', '%'].some(op => newExpr.endsWith(op))) {
        setDisplay(btn.value);
      } else {
        const preview = evaluate(newExpr);
        setDisplay(preview === 'Error' ? newExpr : preview);
      }
    }
  }, [expression]);

  const renderButton = (btn: ButtonDef, index: number) => {
    const isWide = btn.label === '0';
    return (
      <TouchableOpacity
        key={`${btn.label}-${index}`}
        style={[
          styles.button,
          btn.type === 'number' && styles.buttonNumber,
          btn.type === 'operator' && styles.buttonOperator,
          btn.type === 'action' && styles.buttonAction,
          btn.style === 'accent' && styles.buttonAccent,
          btn.style === 'secondary' && styles.buttonSecondary,
          isWide && styles.buttonWide,
        ]}
        onPress={() => handlePress(btn)}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.buttonText,
          btn.type === 'number' && styles.buttonTextNumber,
          btn.type === 'operator' && styles.buttonTextOperator,
          btn.type === 'action' && styles.buttonTextAction,
          btn.style === 'accent' && styles.buttonTextAccent,
        ]}>
          {btn.label}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>计算器</Text>
        <TouchableOpacity onPress={() => setShowHistory(!showHistory)}>
          <Text style={styles.historyToggle}>{showHistory ? '关闭' : '历史'}</Text>
        </TouchableOpacity>
      </View>

      {/* Display */}
      <View style={styles.display}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.expressionScroll}>
          <Text style={styles.expressionText}>{formatDisplay(expression) || '0'}</Text>
        </ScrollView>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>{display}</Text>
      </View>

      {/* History Panel */}
      {showHistory && (
        <View style={styles.historyPanel}>
          <Text style={styles.historyTitle}>历史记录</Text>
          <ScrollView style={styles.historyList}>
            {history.length === 0 ? (
              <Text style={styles.historyEmpty}>暂无记录</Text>
            ) : (
              history.map((item, i) => (
                <View key={i} style={styles.historyItem}>
                  <Text style={styles.historyExpression}>{item.expression}</Text>
                  <Text style={styles.historyResult}>= {item.result}</Text>
                </View>
              ))
            )}
          </ScrollView>
        </View>
      )}

      {/* Button Pad */}
      <View style={styles.pad}>
        {BUTTONS.map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((btn, btnIndex) => renderButton(btn, btnIndex))}
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  historyToggle: {
    color: '#0a84ff',
    fontSize: 16,
  },
  display: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingBottom: 10,
    maxHeight: 120,
  },
  expressionScroll: {
    maxHeight: 30,
  },
  expressionText: {
    color: '#888',
    fontSize: 24,
    textAlign: 'right',
  },
  displayText: {
    color: '#fff',
    fontSize: 72,
    fontWeight: '300',
    textAlign: 'right',
  },
  historyPanel: {
    backgroundColor: '#1c1c1e',
    borderRadius: 16,
    marginHorizontal: 16,
    marginBottom: 10,
    padding: 16,
    maxHeight: 200,
  },
  historyTitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 10,
  },
  historyList: {
    flex: 1,
  },
  historyEmpty: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    paddingVertical: 20,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  historyExpression: {
    color: '#888',
    fontSize: 16,
  },
  historyResult: {
    color: '#fff',
    fontSize: 16,
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
  buttonNumber: {
    backgroundColor: '#333',
  },
  buttonOperator: {
    backgroundColor: '#333',
  },
  buttonAction: {
    backgroundColor: '#333',
  },
  buttonAccent: {
    backgroundColor: '#FF9500',
  },
  buttonSecondary: {
    backgroundColor: '#333',
  },
  buttonText: {
    fontSize: 32,
    fontWeight: '400',
  },
  buttonTextNumber: {
    color: '#fff',
  },
  buttonTextOperator: {
    color: '#fff',
  },
  buttonTextAction: {
    color: '#000',
  },
  buttonTextAccent: {
    color: '#fff',
  },
});
