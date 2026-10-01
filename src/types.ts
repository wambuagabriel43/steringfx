export type ForexPair = 'EURUSD' | 'GBPUSD' | 'USDJPY' | 'AUDUSD' | 'USDCAD' | 'USDCHF' | 'NZDUSD' | 'EURGBP' | 'EURJPY' | 'GBPJPY' | 'XAUUSD' | 'BTCUSD';

export type Timeframe = 'M1' | 'M5' | 'M15' | 'H1' | 'H4' | 'D1';

export type SignalDirection = 'STRONG_BUY' | 'BUY' | 'NEUTRAL' | 'SELL' | 'STRONG_SELL';

export type SentimentBias = 'BULLISH' | 'LEAN_BULLISH' | 'NEUTRAL' | 'LEAN_BEARISH' | 'BEARISH';

export interface Candle {
  time: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  ema20?: number;
  ema50?: number;
  ema200?: number;
  rsi?: number;
  upperBand?: number;
  lowerBand?: number;
  middleBand?: number;
}

export interface PairQuote {
  symbol: ForexPair;
  name: string;
  bid: number;
  ask: number;
  spreadPips: number;
  change24h: number;
  high24h: number;
  low24h: number;
  digits: number;
  pipSize: number;
  volatility: 'LOW' | 'MEDIUM' | 'HIGH';
  sentimentScore: number; // -1 to +1
}

export interface IndicatorSnapshot {
  rsi14: number;
  rsiStatus: 'OVERSOLD' | 'BULLISH_MOMENTUM' | 'NEUTRAL' | 'BEARISH_MOMENTUM' | 'OVERBOUGHT';
  ema20: number;
  ema50: number;
  ema200: number;
  emaTrend: 'STRONG_UPTREND' | 'UPTREND' | 'CONSOLIDATION' | 'DOWNTREND' | 'STRONG_DOWNTREND';
  macd: {
    macdLine: number;
    signalLine: number;
    histogram: number;
    crossover: 'BULLISH_CROSS' | 'BEARISH_CROSS' | 'NONE';
  };
  bollingerBands: {
    upper: number;
    middle: number;
    lower: number;
    percentB: number;
    bandwidth: number;
    status: 'SQUEEZE' | 'UPPER_TOUCH' | 'LOWER_TOUCH' | 'NORMAL';
  };
  atr14: number;
  atrPips: number;
  pivotPoints: {
    pivot: number;
    r1: number;
    r2: number;
    r3: number;
    s1: number;
    s2: number;
    s3: number;
  };
  candlestickPattern?: string;
}

export interface NewsItem {
  id: string;
  title: string;
  source: string;
  timeAgo: string;
  timestamp: number;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  currencies: string[];
  sentimentScore: number; // -1.0 to 1.0
  sentimentLabel: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  summary: string;
  tradingImplication: string;
}

export interface EconomicEvent {
  id: string;
  currency: string;
  event: string;
  time: string;
  impact: 'HIGH' | 'MEDIUM' | 'LOW';
  actual?: string;
  forecast: string;
  previous: string;
  status: 'UPCOMING' | 'COMPLETED';
}

export interface AIPrediction {
  pair: ForexPair;
  timeframe: Timeframe;
  generatedAt: number;
  signal: SignalDirection;
  confluenceScore: number; // 0 - 100%
  technicalScore: number; // 0 - 100%
  sentimentScore: number; // 0 - 100%
  entryPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  riskRewardRatio: string;
  potentialPipsRisk: number;
  potentialPipsReward: number;
  technicalSummary: string;
  sentimentSummary: string;
  aiRationale: string;
  keyDrivers: string[];
  invalidationLevel: number;
  riskWarning: string;
  recommendedPositionSizePercent: number;
  engine?: string;
  isLiveAI?: boolean;
}

export interface CurrencySentimentMeter {
  currency: string;
  score: number; // -100 to +100
  label: SentimentBias;
  newsCount: number;
  keyTheme: string;
}

export interface MT5SignalPayload {
  status: string;
  pair: string;
  timeframe: string;
  signal: string;
  action_code: number; // 1 = Buy, -1 = Sell, 0 = Hold
  confidence: number;
  entry: number;
  sl: number;
  tp1: number;
  tp2: number;
  technical_score: number;
  sentiment_score: number;
  timestamp: number;
  checksum: string;
  message: string;
}

export interface EASettings {
  apiUrl: string;
  magicNumber: number;
  riskPercent: number;
  fixedLot: number;
  useFixedLot: boolean;
  minConfidence: number;
  useTrailingStop: boolean;
  trailingStopPips: number;
  trailingStepPips: number;
  maxSpreadPips: number;
  maxSlippagePips: number;
  pollIntervalSeconds: number;
  allowAutoExecution: boolean;
  enableOnChartHUD: boolean;
  enableSoundAlerts: boolean;
  enablePushAlerts: boolean;
}

export interface BacktestTrade {
  id: string;
  tradeNumber: number;
  entryTime: number;
  exitTime: number;
  pair: ForexPair;
  timeframe: Timeframe;
  type: 'BUY' | 'SELL';
  entryPrice: number;
  exitPrice: number;
  stopLoss: number;
  takeProfit1: number;
  takeProfit2: number;
  lotSize: number;
  pnl: number;
  pnlPercent: number;
  pips: number;
  confidence: number;
  status: 'WON' | 'LOST';
  exitReason: 'TP1_HIT' | 'TP2_HIT' | 'SL_HIT' | 'TRAILING_STOP' | 'TIME_EXIT';
  rsiAtEntry: number;
  emaTrendAtEntry: string;
  sentimentScoreAtEntry: number;
  aiRationale: string;
}

export interface EquityPoint {
  time: number;
  dateStr: string;
  equity: number;
  balance: number;
  drawdownPercent: number;
  tradePnl?: number;
}

export interface BacktestResult {
  pair: ForexPair;
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
  initialBalance: number;
  finalBalance: number;
  netProfit: number;
  netProfitPercent: number;
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  profitFactor: number;
  maxDrawdownPercent: number;
  maxDrawdownAmount: number;
  totalPips: number;
  sharpeRatio: number;
  avgWinPips: number;
  avgLossPips: number;
  avgTradeDurationBars: number;
  expectancy: number;
  equityCurve: EquityPoint[];
  trades: BacktestTrade[];
  candles: Candle[];
}

export interface BacktestRequestParams {
  pair: ForexPair;
  timeframe: Timeframe;
  startDate: string;
  endDate: string;
  initialBalance: number;
  riskPercent: number;
  minConfidence: number;
  tpStrategy: 'TP1' | 'TP2' | 'DYNAMIC_TRAIL';
  rrRatio: number;
  spreadPips?: number;
  enableNewsFilter?: boolean;
}

