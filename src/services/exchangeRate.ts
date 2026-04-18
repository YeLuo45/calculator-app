// Exchange rate service using frankfurter.app API
import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@exchange_rates';
const CACHE_TIMESTAMP_KEY = '@exchange_rates_timestamp';
const CACHE_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

export interface ExchangeRates {
  [currency: string]: number;
}

export interface CachedRates {
  rates: ExchangeRates;
  timestamp: number;
  base: string;
}

// Supported currencies
export const SUPPORTED_CURRENCIES = [
  { code: 'USD', name: '美元', symbol: '$' },
  { code: 'CNY', name: '人民币', symbol: '¥' },
  { code: 'EUR', name: '欧元', symbol: '€' },
  { code: 'GBP', name: '英镑', symbol: '£' },
  { code: 'JPY', name: '日元', symbol: '¥' },
  { code: 'KRW', name: '韩元', symbol: '₩' },
  { code: 'HKD', name: '港币', symbol: 'HK$' },
];

// frankfurter.app supports: AUD, BRL, BGN, CAD, CNY, HRK, CZK, DKK, GBP, HKD, HUF, IDR, ILS, INR, ISK, JPY, KRW, MXN, MYR, NOK, NZD, PHP, PLN, RON, SEK, SGD, THB, TRY, USD, ZAR, EUR
// Note: CNY is supported directly since 2023-12
// KRW is supported

const BASE_URL = 'https://api.frankfurter.app';

export const fetchExchangeRates = async (baseCurrency: string = 'USD'): Promise<CachedRates> => {
  try {
    // Try to get cached rates first
    const cached = await getCachedRates();
    const now = Date.now();
    
    // If cache is valid and same base currency, return cached
    if (cached && cached.base === baseCurrency && (now - cached.timestamp) < CACHE_EXPIRY_MS) {
      console.log('Using cached exchange rates');
      return cached;
    }
    
    // Fetch fresh rates
    console.log('Fetching fresh exchange rates from API');
    const response = await fetch(`${BASE_URL}/latest?from=${baseCurrency}`);
    
    if (!response.ok) {
      throw new Error(`HTTP error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Build rates object including the base currency
    const rates: ExchangeRates = {
      [baseCurrency]: 1,
      ...data.rates,
    };
    
    const cachedRates: CachedRates = {
      rates,
      timestamp: now,
      base: baseCurrency,
    };
    
    // Save to cache
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(cachedRates.rates));
    await AsyncStorage.setItem(CACHE_TIMESTAMP_KEY, cachedRates.timestamp.toString());
    
    return cachedRates;
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    
    // Try to get stale cache as fallback
    const cached = await getCachedRates();
    if (cached) {
      console.log('Using stale cached rates due to network error');
      return cached;
    }
    
    // Return default rates if everything fails
    return getDefaultRates();
  }
};

export const getCachedRates = async (): Promise<CachedRates | null> => {
  try {
    const ratesJson = await AsyncStorage.getItem(CACHE_KEY);
    const timestampStr = await AsyncStorage.getItem(CACHE_TIMESTAMP_KEY);
    
    if (!ratesJson || !timestampStr) {
      return null;
    }
    
    const rates: ExchangeRates = JSON.parse(ratesJson);
    const timestamp = parseInt(timestampStr, 10);
    
    return {
      rates,
      timestamp,
      base: 'USD',
    };
  } catch {
    return null;
  }
};

export const getDefaultRates = (): CachedRates => {
  // Fallback rates (approximate) when offline and no cache
  return {
    base: 'USD',
    timestamp: 0,
    rates: {
      USD: 1,
      EUR: 0.92,
      GBP: 0.79,
      JPY: 149.5,
      KRW: 1330,
      HKD: 7.82,
      CNY: 7.24,
    },
  };
};

// Convert amount from one currency to another
export const convertCurrency = async (
  amount: number,
  fromCurrency: string,
  toCurrency: string
): Promise<number> => {
  if (fromCurrency === toCurrency) return amount;
  
  const cached = await fetchExchangeRates(fromCurrency);
  const rates = cached.rates;
  
  // If we have direct rate
  if (rates[toCurrency] !== undefined) {
    // Convert: amount * (toRate / fromRate)
    // Since rates are based on fromCurrency, just multiply
    const fromRate = rates[fromCurrency] || 1;
    const toRate = rates[toCurrency];
    return amount * (toRate / fromRate);
  }
  
  // Need to convert through USD as intermediate
  const fromRateUSD = rates[fromCurrency] || 1;
  const toRateUSD = rates[toCurrency];
  
  if (!toRateUSD) {
    throw new Error(`Currency ${toCurrency} not supported`);
  }
  
  // Convert to USD first, then to target
  const usdAmount = amount / fromRateUSD;
  return usdAmount * toRateUSD;
};

export const isRatesExpired = (cached: CachedRates | null): boolean => {
  if (!cached) return true;
  return Date.now() - cached.timestamp > CACHE_EXPIRY_MS;
};
