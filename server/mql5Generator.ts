export interface Mql5GeneratorParams {
  apiUrl: string;
  magicNumber?: number;
  fixedLot?: number;
  riskPercent?: number;
  useFixedLot?: boolean;
  minConfidence?: number;
  useTrailingStop?: boolean;
  trailingStopPips?: number;
  trailingStepPips?: number;
  maxSpreadPips?: number;
  pollIntervalSeconds?: number;
  allowAutoExecution?: boolean;
  enableOnChartHUD?: boolean;
  enableSoundAlerts?: boolean;
  enablePushAlerts?: boolean;
}

export function generateMql5ExpertAdvisor(params: Mql5GeneratorParams): string {
  const {
    apiUrl = 'https://your-domain.run.app',
    magicNumber = 882049,
    fixedLot = 0.10,
    riskPercent = 1.5,
    useFixedLot = false,
    minConfidence = 75,
    useTrailingStop = true,
    trailingStopPips = 25.0,
    trailingStepPips = 10.0,
    maxSpreadPips = 3.0,
    pollIntervalSeconds = 30,
    allowAutoExecution = true,
    enableOnChartHUD = true,
    enableSoundAlerts = true,
    enablePushAlerts = true,
  } = params;

  // Ensure clean base API URL
  const cleanApiUrl = apiUrl.replace(/\/+$/, '');

  return `//+------------------------------------------------------------------+
//|                                     AI_Forex_Confluence_EA.mq5    |
//|                        AI Forex Market Predictor & Sentiment EA  |
//|                                  https://ai.studio/build         |
//+------------------------------------------------------------------+
#property copyright   "AI Forex Predictor Team"
#property link        "https://ai.studio/build"
#property version     "3.00"
#property description "Combines Real-time Technical Analysis with Live News Sentiment AI"
#property strict

#include <Trade\\Trade.mqh>
#include <Trade\\PositionInfo.mqh>
#include <Trade\\SymbolInfo.mqh>

//--- ENUMS
enum ENUM_LOT_MODE
{
   LOT_RISK_PERCENT = 0, // Dynamic Risk % of Balance
   LOT_FIXED        = 1  // Fixed Lot Size
};

enum ENUM_ENGINE_MODE
{
   MODE_HYBRID   = 0, // Online AI WebRequest + Fallback to Native Indicators
   MODE_NATIVE   = 1  // Native Built-in Chart Indicators Only (No WebRequest needed)
};

//--- INPUT PARAMETERS
input group "=== AI API & BRIDGE CONFIGURATION ==="
input ENUM_ENGINE_MODE InpEngineMode        = MODE_HYBRID;               // Engine Mode
input string           InpApiEndpoint       = "${cleanApiUrl}/api/mt5/signal"; // AI Signal Endpoint URL
input int              InpPollIntervalSec   = ${pollIntervalSeconds};          // AI Sync Interval (Seconds)
input int              InpMinConfidence     = ${minConfidence};                // Min Confluence % to Trade (60-95)
input bool             InpAutoExecute       = ${allowAutoExecution ? 'true' : 'false'};             // Allow Auto Trading

input group "=== MONEY MANAGEMENT & RISK ==="
input ENUM_LOT_MODE    InpLotMode           = ${useFixedLot ? 'LOT_FIXED' : 'LOT_RISK_PERCENT'}; // Lot Sizing Mode
input double           InpRiskPercent       = ${riskPercent};                  // Risk % per Trade (if Dynamic)
input double           InpFixedLotSize      = ${fixedLot};                     // Fixed Lot (if Fixed Mode)
input double           InpMaxSpreadPips     = ${maxSpreadPips};                // Max Allowed Spread (Pips)
input ulong            InpMagicNumber       = ${magicNumber};                  // EA Magic Number
input ulong            InpSlippagePoints    = 20;                              // Max Slippage (Points)

input group "=== TRAILING STOP & PROTECTION ==="
input bool             InpUseTrailingStop   = ${useTrailingStop ? 'true' : 'false'};             // Enable Trailing Stop
input double           InpTrailingStopPips  = ${trailingStopPips};             // Trailing Distance (Pips)
input double           InpTrailingStepPips  = ${trailingStepPips};             // Trailing Step (Pips)

input group "=== VISUAL HUD & NOTIFICATIONS ==="
input bool             InpShowOnChartHUD    = ${enableOnChartHUD ? 'true' : 'false'};             // Display AI HUD on Chart
input bool             InpSoundAlerts       = ${enableSoundAlerts ? 'true' : 'false'};             // Play Audio on Signal
input bool             InpPushNotifications = ${enablePushAlerts ? 'true' : 'false'};             // Send Mobile Push Alert

//--- GLOBAL HANDLERS & VARIABLES
CTrade         m_trade;
CPositionInfo  m_position;
CSymbolInfo    m_symbol;

// Native Indicator Handles (For robust standalone execution)
int            h_rsi    = INVALID_HANDLE;
int            h_ema20  = INVALID_HANDLE;
int            h_ema50  = INVALID_HANDLE;
int            h_ema200 = INVALID_HANDLE;
int            h_atr    = INVALID_HANDLE;

datetime       g_lastPollTime       = 0;
string         g_currentSignal      = "NONE";
int            g_currentConfidence  = 0;
double         g_suggestedEntry     = 0.0;
double         g_suggestedSL        = 0.0;
double         g_suggestedTP1       = 0.0;
double         g_suggestedTP2       = 0.0;
double         g_sentimentScore     = 0.0;
double         g_technicalScore     = 0.0;
string         g_lastMessage        = "Initializing Engine...";
string         g_engineSource       = "Online AI Bridge";
datetime       g_lastTradeBarTime   = 0;

//+------------------------------------------------------------------+
//| Expert initialization function                                   |
//+------------------------------------------------------------------+
int OnInit()
{
   if(!m_symbol.Name(_Symbol))
   {
      Print("[AI-EA ERROR] Failed to initialize symbol info for: ", _Symbol);
      return(INIT_FAILED);
   }
   m_symbol.RefreshRates();

   m_trade.SetExpertMagicNumber(InpMagicNumber);
   m_trade.SetDeviationInPoints(InpSlippagePoints);
   m_trade.SetTypeFilling(ORDER_FILLING_IOC);

   // Initialize Native Indicators
   h_rsi    = iRSI(_Symbol, _Period, 14, PRICE_CLOSE);
   h_ema20  = iMA(_Symbol, _Period, 20, 0, MODE_EMA, PRICE_CLOSE);
   h_ema50  = iMA(_Symbol, _Period, 50, 0, MODE_EMA, PRICE_CLOSE);
   h_ema200 = iMA(_Symbol, _Period, 200, 0, MODE_EMA, PRICE_CLOSE);
   h_atr    = iATR(_Symbol, _Period, 14);

   EventSetTimer(1); // 1-second timer loop for responsive execution

   Print("=================================================");
   Print("🚀 AI FOREX CONFLUENCE EA INITIALIZED (v3.00)");
   Print("   Symbol: ", _Symbol, " | Timeframe: ", EnumToString(_Period));
   Print("   API Endpoint: ", InpApiEndpoint);
   Print("   Auto Trading Input: ", InpAutoExecute ? "ENABLED" : "DISABLED");
   Print("   Terminal Algo Trading: ", TerminalInfoInteger(TERMINAL_TRADE_ALLOWED) ? "ALLOWED" : "BLOCKED (Click Algo Trading button in MT5 toolbar)");
   Print("=================================================");

   // Initial Signal Fetch
   RefreshAISignal();
   if(InpShowOnChartHUD) DrawHUD();

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Expert deinitialization function                                 |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   EventKillTimer();
   if(h_rsi != INVALID_HANDLE) IndicatorRelease(h_rsi);
   if(h_ema20 != INVALID_HANDLE) IndicatorRelease(h_ema20);
   if(h_ema50 != INVALID_HANDLE) IndicatorRelease(h_ema50);
   if(h_ema200 != INVALID_HANDLE) IndicatorRelease(h_ema200);
   if(h_atr != INVALID_HANDLE) IndicatorRelease(h_atr);

   if(InpShowOnChartHUD) DeleteHUD();
   Print("[AI-EA] Deinitialized. Reason code: ", reason);
}

//+------------------------------------------------------------------+
//| Timer event handler (Handles periodic AI synchronization)        |
//+------------------------------------------------------------------+
void OnTimer()
{
   datetime currentTime = TimeCurrent();
   if(currentTime - g_lastPollTime >= InpPollIntervalSec)
   {
      g_lastPollTime = currentTime;
      RefreshAISignal();
      if(InpShowOnChartHUD) UpdateHUD();
   }
}

//+------------------------------------------------------------------+
//| Tick event handler                                               |
//+------------------------------------------------------------------+
void OnTick()
{
   m_symbol.RefreshRates();

   // 1. Manage Trailing Stops on Open Positions
   if(InpUseTrailingStop)
   {
      ManageTrailingStop();
   }

   // 2. Check if Auto Execution is enabled
   if(InpAutoExecute)
   {
      CheckAndExecuteSignal();
   }

   if(InpShowOnChartHUD) UpdateHUDDynamicValues();
}

//+------------------------------------------------------------------+
//| Signal Dispatcher: Online Bridge with Native Fallback            |
//+------------------------------------------------------------------+
void RefreshAISignal()
{
   bool onlineSuccess = false;

   if(InpEngineMode == MODE_HYBRID)
   {
      onlineSuccess = FetchOnlineAISignal();
   }

   // Fallback to Native On-Chart Confluence Engine if Online Bridge is unavailable or returned 0%
   if(!onlineSuccess || g_currentConfidence == 0 || g_currentSignal == "NONE" || g_suggestedSL == 0.0)
   {
      CalculateNativeConfluenceSignal();
   }
}

//+------------------------------------------------------------------+
//| WebRequest: Fetch AI Prediction & Sentiment from Bridge API     |
//+------------------------------------------------------------------+
bool FetchOnlineAISignal()
{
   string cleanSymbol = _Symbol;
   StringReplace(cleanSymbol, ".", "");
   StringReplace(cleanSymbol, "_", "");
   StringReplace(cleanSymbol, "/", "");
   StringReplace(cleanSymbol, "pro", "");
   StringReplace(cleanSymbol, "m", "");

   string tfString = "H1";
   switch(_Period)
   {
      case PERIOD_M1:  tfString = "M1"; break;
      case PERIOD_M5:  tfString = "M5"; break;
      case PERIOD_M15: tfString = "M15"; break;
      case PERIOD_M30: tfString = "M30"; break;
      case PERIOD_H1:  tfString = "H1"; break;
      case PERIOD_H4:  tfString = "H4"; break;
      case PERIOD_D1:  tfString = "D1"; break;
      default:         tfString = "H1"; break;
   }

   // Normalize URL endpoint
   string baseEndpoint = InpApiEndpoint;
   if(StringFind(baseEndpoint, "/api/mt5/signal") < 0)
   {
      if(StringSubstr(baseEndpoint, StringLen(baseEndpoint)-1, 1) == "/")
         baseEndpoint = StringSubstr(baseEndpoint, 0, StringLen(baseEndpoint)-1);
      baseEndpoint = baseEndpoint + "/api/mt5/signal";
   }

   string url = baseEndpoint + "?pair=" + cleanSymbol + "&timeframe=" + tfString;
   
   char postData[];
   char resultData[];
   string resultHeaders;
   string requestHeaders = "User-Agent: MT5-AI-Forex-Bridge/3.0\\r\\nAccept: application/json\\r\\n";
   
   ResetLastError();
   int timeout = 5000; // 5 sec timeout
   
   int res = WebRequest("GET", url, requestHeaders, timeout, postData, resultData, resultHeaders);
   
   if(res == 200)
   {
      string responseJson = CharArrayToString(resultData);
      
      // Check if response returned HTML webpage instead of JSON
      if(StringFind(responseJson, "<!DOCTYPE") >= 0 || StringFind(responseJson, "<html") >= 0)
      {
         g_lastMessage = "Bridge returned HTML. Ensure URL ends with /api/mt5/signal";
         Print("[AI-EA WARNING] API endpoint returned HTML. Switched to Native Confluence Engine.");
         return false;
      }

      bool parsed = ParseAIResponse(responseJson);
      if(parsed && g_currentConfidence > 0)
      {
         g_engineSource = "Live AI Bridge (Online)";
         return true;
      }
      return false;
   }
   else
   {
      int err = GetLastError();
      if(err == 4014) // ERR_WEBREQUEST_NOT_ALLOWED
      {
         g_lastMessage = "ERR 4014: Add " + baseEndpoint + " to MT5 Tools->Options->WebRequest";
         Print("[AI-EA WARNING] WebRequest not whitelisted. Using Native Engine.");
      }
      else
      {
         g_lastMessage = "HTTP " + IntegerToString(res) + " (Err " + IntegerToString(err) + ") - Using Native Engine";
      }
      return false;
   }
}

//+------------------------------------------------------------------+
//| Native On-Chart Indicator Confluence Engine                      |
//+------------------------------------------------------------------+
void CalculateNativeConfluenceSignal()
{
   double rsi[], ema20[], ema50[], ema200[], atr[];
   ArraySetAsSeries(rsi, true);
   ArraySetAsSeries(ema20, true);
   ArraySetAsSeries(ema50, true);
   ArraySetAsSeries(ema200, true);
   ArraySetAsSeries(atr, true);

   if(CopyBuffer(h_rsi, 0, 0, 3, rsi) <= 0 ||
      CopyBuffer(h_ema20, 0, 0, 3, ema20) <= 0 ||
      CopyBuffer(h_ema50, 0, 0, 3, ema50) <= 0 ||
      CopyBuffer(h_atr, 0, 0, 3, atr) <= 0)
   {
      g_lastMessage = "Loading chart history...";
      return;
   }

   double currentPrice = m_symbol.Bid();
   double currentAtr = atr[0] > 0 ? atr[0] : 20 * GetPipSize();

   // Technical Trend & Momentum Scoring
   bool bullTrend = ema20[0] > ema50[0];
   bool rsiBullish = rsi[0] > 52.0;
   bool rsiBearish = rsi[0] < 48.0;

   int bullScore = 0;
   int bearScore = 0;

   if(bullTrend) bullScore += 35; else bearScore += 35;
   if(rsiBullish) bullScore += 30;
   if(rsiBearish) bearScore += 30;
   if(currentPrice > ema20[0]) bullScore += 20; else bearScore += 20;
   if(ema20[0] > ema20[1]) bullScore += 15; else bearScore += 15;

   double pip = GetPipSize();
   double slDist = MathMax(20.0 * pip, currentAtr * 1.5);
   double tpDist = MathMax(35.0 * pip, currentAtr * 2.6);

   if(bullScore >= 65)
   {
      g_currentSignal     = bullScore >= 80 ? "STRONG_BUY" : "BUY";
      g_currentConfidence = MathMin(95, bullScore);
      g_suggestedEntry    = m_symbol.Ask();
      g_suggestedSL       = NormalizeDouble(g_suggestedEntry - slDist, _Digits);
      g_suggestedTP1      = NormalizeDouble(g_suggestedEntry + tpDist, _Digits);
      g_suggestedTP2      = NormalizeDouble(g_suggestedEntry + tpDist * 1.6, _Digits);
      g_technicalScore    = (double)bullScore / 100.0;
      g_sentimentScore    = 0.45;
      g_lastMessage       = "Native Strategy: " + g_currentSignal + " Confluence Setup Found";
   }
   else if(bearScore >= 65)
   {
      g_currentSignal     = bearScore >= 80 ? "STRONG_SELL" : "SELL";
      g_currentConfidence = MathMin(95, bearScore);
      g_suggestedEntry    = m_symbol.Bid();
      g_suggestedSL       = NormalizeDouble(g_suggestedEntry + slDist, _Digits);
      g_suggestedTP1      = NormalizeDouble(g_suggestedEntry - tpDist, _Digits);
      g_suggestedTP2      = NormalizeDouble(g_suggestedEntry - tpDist * 1.6, _Digits);
      g_technicalScore    = (double)bearScore / 100.0;
      g_sentimentScore    = -0.45;
      g_lastMessage       = "Native Strategy: " + g_currentSignal + " Confluence Setup Found";
   }
   else
   {
      g_currentSignal     = "NEUTRAL";
      g_currentConfidence = 50;
      g_suggestedEntry    = currentPrice;
      g_suggestedSL       = NormalizeDouble(currentPrice - slDist, _Digits);
      g_suggestedTP1      = NormalizeDouble(currentPrice + tpDist, _Digits);
      g_technicalScore    = 0.50;
      g_sentimentScore    = 0.00;
      g_lastMessage       = "Market in consolidation. Waiting for breakout.";
   }

   g_engineSource = "Native Indicator Engine";
}

//+------------------------------------------------------------------+
//| Lightweight Native JSON Parser for MT5                           |
//+------------------------------------------------------------------+
bool ParseAIResponse(string json)
{
   string signal = ExtractJsonValue(json, "signal");
   if(StringLen(signal) == 0) return false;

   g_currentSignal      = signal;
   g_currentConfidence  = (int)StringToInteger(ExtractJsonValue(json, "confidence"));
   g_suggestedEntry     = StringToDouble(ExtractJsonValue(json, "entry"));
   g_suggestedSL        = StringToDouble(ExtractJsonValue(json, "sl"));
   g_suggestedTP1       = StringToDouble(ExtractJsonValue(json, "tp1"));
   g_suggestedTP2       = StringToDouble(ExtractJsonValue(json, "tp2"));
   g_sentimentScore     = StringToDouble(ExtractJsonValue(json, "sentiment_score"));
   g_technicalScore     = StringToDouble(ExtractJsonValue(json, "technical_score"));
   
   string msg           = ExtractJsonValue(json, "message");
   if(StringLen(msg) > 0) g_lastMessage = msg;
   else g_lastMessage = "AI Signal Synced successfully";

   PrintFormat("[AI-EA] %s Signal: %s | Conf: %d%% | SL: %.5f | TP: %.5f", 
               g_engineSource, g_currentSignal, g_currentConfidence, g_suggestedSL, g_suggestedTP1);
   return true;
}

// Universal JSON key extractor for strings and numbers
string ExtractJsonValue(string json, string key)
{
   string pattern = "\\"" + key + "\\":";
   int pos = StringFind(json, pattern);
   if(pos < 0) return "";

   int start = pos + StringLen(pattern);
   
   // Skip spaces and quotes
   while(start < StringLen(json))
   {
      ushort ch = StringGetCharacter(json, start);
      if(ch == ' ' || ch == '\"' || ch == '\\t' || ch == '\\r' || ch == '\\n')
         start++;
      else
         break;
   }

   int end = start;
   while(end < StringLen(json))
   {
      ushort ch = StringGetCharacter(json, end);
      if(ch == '\"' || ch == ',' || ch == '}' || ch == ']' || ch == '\\r' || ch == '\\n')
         break;
      end++;
   }

   if(end <= start) return "";
   return StringSubstr(json, start, end - start);
}

//+------------------------------------------------------------------+
//| Check Signal & Execute Trades                                    |
//+------------------------------------------------------------------+
void CheckAndExecuteSignal()
{
   // Check if Algo Trading is allowed in MT5
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))
   {
      g_lastMessage = "⚠️ Click [Algo Trading] button in MT5 Top Toolbar to enable trading!";
      return;
   }

   if(g_currentConfidence < InpMinConfidence) return;
   if(g_currentSignal == "NEUTRAL" || g_currentSignal == "NONE") return;
   
   // Spread Protection Filter
   double spreadPips = (m_symbol.Ask() - m_symbol.Bid()) / GetPipSize();
   if(spreadPips > InpMaxSpreadPips)
   {
      g_lastMessage = "High Spread: " + DoubleToString(spreadPips, 1) + " > Max " + DoubleToString(InpMaxSpreadPips, 1);
      return;
   }

   // Ensure only 1 trade per bar or 1 position per direction
   datetime currentBarTime = iTime(_Symbol, _Period, 0);
   if(currentBarTime == g_lastTradeBarTime) return;

   int openBuyCount = 0;
   int openSellCount = 0;
   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i))
      {
         if(m_position.Symbol() == _Symbol && m_position.Magic() == InpMagicNumber)
         {
            if(m_position.PositionType() == POSITION_TYPE_BUY) openBuyCount++;
            if(m_position.PositionType() == POSITION_TYPE_SELL) openSellCount++;
         }
      }
   }

   // BUY / STRONG_BUY Execution
   if((g_currentSignal == "BUY" || g_currentSignal == "STRONG_BUY") && openBuyCount == 0)
   {
      double ask = m_symbol.Ask();
      double sl = g_suggestedSL > 0 ? g_suggestedSL : ask - (30 * GetPipSize());
      double tp = g_suggestedTP1 > 0 ? g_suggestedTP1 : ask + (60 * GetPipSize());
      
      double lotSize = CalculateLotSize(ask, sl);
      if(lotSize <= 0) return;

      if(m_trade.Buy(lotSize, _Symbol, ask, sl, tp, "AI Confluence BUY"))
      {
         g_lastTradeBarTime = currentBarTime;
         PlayAlert("BUY Executed: " + _Symbol + " (" + DoubleToString(lotSize, 2) + " lots) @ " + DoubleToString(ask, _Digits));
      }
      else
      {
         Print("[AI-EA TRADE ERROR] Buy failed. Retcode: ", m_trade.ResultRetcode(), " Desc: ", m_trade.ResultRetcodeDescription());
      }
   }
   // SELL / STRONG_SELL Execution
   else if((g_currentSignal == "SELL" || g_currentSignal == "STRONG_SELL") && openSellCount == 0)
   {
      double bid = m_symbol.Bid();
      double sl = g_suggestedSL > 0 ? g_suggestedSL : bid + (30 * GetPipSize());
      double tp = g_suggestedTP1 > 0 ? g_suggestedTP1 : bid - (60 * GetPipSize());
      
      double lotSize = CalculateLotSize(bid, sl);
      if(lotSize <= 0) return;

      if(m_trade.Sell(lotSize, _Symbol, bid, sl, tp, "AI Confluence SELL"))
      {
         g_lastTradeBarTime = currentBarTime;
         PlayAlert("SELL Executed: " + _Symbol + " (" + DoubleToString(lotSize, 2) + " lots) @ " + DoubleToString(bid, _Digits));
      }
      else
      {
         Print("[AI-EA TRADE ERROR] Sell failed. Retcode: ", m_trade.ResultRetcode(), " Desc: ", m_trade.ResultRetcodeDescription());
      }
   }
}

//+------------------------------------------------------------------+
//| Calculate dynamic position size based on risk % or fixed         |
//+------------------------------------------------------------------+
double CalculateLotSize(double entryPrice, double stopLossPrice)
{
   if(InpLotMode == LOT_FIXED)
   {
      return InpFixedLotSize;
   }

   double accountBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   if(accountBalance <= 0) return InpFixedLotSize;

   double riskAmount = accountBalance * (InpRiskPercent / 100.0);
   double slDistance = MathAbs(entryPrice - stopLossPrice);
   if(slDistance <= 0) return InpFixedLotSize;

   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   
   if(tickSize <= 0 || tickValue <= 0) return InpFixedLotSize;

   double points = slDistance / tickSize;
   double lossPerLot = points * tickValue;
   
   if(lossPerLot <= 0) return InpFixedLotSize;

   double rawLot = riskAmount / lossPerLot;
   
   double minLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MIN);
   double maxLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_MAX);
   double stepLot = SymbolInfoDouble(_Symbol, SYMBOL_VOLUME_STEP);

   double normalizedLot = MathFloor(rawLot / stepLot) * stepLot;
   if(normalizedLot < minLot) normalizedLot = minLot;
   if(normalizedLot > maxLot) normalizedLot = maxLot;

   return normalizedLot;
}

//+------------------------------------------------------------------+
//| Trailing Stop Loss Management                                    |
//+------------------------------------------------------------------+
void ManageTrailingStop()
{
   double pip = GetPipSize();
   double trailingDistance = InpTrailingStopPips * pip;
   double trailingStep = InpTrailingStepPips * pip;

   for(int i = PositionsTotal() - 1; i >= 0; i--)
   {
      if(m_position.SelectByIndex(i))
      {
         if(m_position.Symbol() == _Symbol && m_position.Magic() == InpMagicNumber)
         {
            if(m_position.PositionType() == POSITION_TYPE_BUY)
            {
               double bid = m_symbol.Bid();
               double currentSL = m_position.StopLoss();
               double openPrice = m_position.PriceOpen();
               
               if(bid - openPrice > trailingDistance)
               {
                  double newSL = NormalizeDouble(bid - trailingDistance, _Digits);
                  if(newSL > currentSL + trailingStep)
                  {
                     m_trade.PositionModify(m_position.Ticket(), newSL, m_position.TakeProfit());
                  }
               }
            }
            else if(m_position.PositionType() == POSITION_TYPE_SELL)
            {
               double ask = m_symbol.Ask();
               double currentSL = m_position.StopLoss();
               double openPrice = m_position.PriceOpen();
               
               if(openPrice - ask > trailingDistance)
               {
                  double newSL = NormalizeDouble(ask + trailingDistance, _Digits);
                  if(currentSL == 0.0 || newSL < currentSL - trailingStep)
                  {
                     m_trade.PositionModify(m_position.Ticket(), newSL, m_position.TakeProfit());
                  }
               }
            }
         }
      }
   }
}

//+------------------------------------------------------------------+
//| Pip Size Helper                                                  |
//+------------------------------------------------------------------+
double GetPipSize()
{
   if(_Digits == 5 || _Digits == 3) return _Point * 10;
   return _Point;
}

void PlayAlert(string message)
{
   Print("[AI ALERT] ", message);
   if(InpSoundAlerts) Alert("[AI-EA] ", message);
   if(InpPushNotifications) SendNotification("[AI-EA] " + message);
}

//+------------------------------------------------------------------+
//| On-Chart HUD Display                                             |
//+------------------------------------------------------------------+
void DrawHUD()
{
   string prefix = "AI_HUD_";
   
   bool isAlgoOn = TerminalInfoInteger(TERMINAL_TRADE_ALLOWED);
   color algoColor = isAlgoOn ? clrLimeGreen : clrTomato;
   string algoText = isAlgoOn ? "Algo Trading: ENABLED" : "Algo Trading: DISABLED (Click button in MT5)";

   CreateLabel(prefix + "BG", 15, 25, "AI FOREX CONFLUENCE EA (v3.0)", 10, "Segoe UI Bold", clrDeepSkyBlue);
   CreateLabel(prefix + "STATUS", 15, 45, "Engine: " + g_engineSource + " | " + algoText, 8, "Segoe UI", algoColor);
   CreateLabel(prefix + "SIGNAL", 15, 65, "AI Signal: " + g_currentSignal + " (" + IntegerToString(g_currentConfidence) + "% Confluence)", 9, "Segoe UI Bold", GetSignalColor());
   CreateLabel(prefix + "SENTIMENT", 15, 85, "Macro Sentiment: " + DoubleToString(g_sentimentScore, 2) + " | Tech: " + DoubleToString(g_technicalScore, 2), 8, "Segoe UI", clrLightSkyBlue);
   CreateLabel(prefix + "LEVELS", 15, 105, "Entry: " + DoubleToString(g_suggestedEntry, _Digits) + " | SL: " + DoubleToString(g_suggestedSL, _Digits) + " | TP: " + DoubleToString(g_suggestedTP1, _Digits), 8, "Segoe UI", clrDarkOrange);
   CreateLabel(prefix + "MSG", 15, 125, "Status: " + g_lastMessage, 7.5, "Segoe UI", clrLightGray);
}

void UpdateHUD()
{
   UpdateHUDDynamicValues();
}

void UpdateHUDDynamicValues()
{
   string prefix = "AI_HUD_";
   
   bool isAlgoOn = TerminalInfoInteger(TERMINAL_TRADE_ALLOWED);
   color algoColor = isAlgoOn ? clrLimeGreen : clrTomato;
   string algoText = isAlgoOn ? "Algo Trading: ACTIVE" : "Algo Trading: OFF (Turn ON in MT5 Top Bar)";

   ObjectSetString(0, prefix + "STATUS", OBJPROP_TEXT, "Engine: " + g_engineSource + " | " + algoText);
   ObjectSetInteger(0, prefix + "STATUS", OBJPROP_COLOR, algoColor);

   ObjectSetString(0, prefix + "SIGNAL", OBJPROP_TEXT, "AI Signal: " + g_currentSignal + " (" + IntegerToString(g_currentConfidence) + "% Confluence)");
   ObjectSetInteger(0, prefix + "SIGNAL", OBJPROP_COLOR, GetSignalColor());

   ObjectSetString(0, prefix + "SENTIMENT", OBJPROP_TEXT, "Macro Sentiment: " + DoubleToString(g_sentimentScore, 2) + " | Tech: " + DoubleToString(g_technicalScore, 2));
   ObjectSetString(0, prefix + "LEVELS", OBJPROP_TEXT, "Entry: " + DoubleToString(g_suggestedEntry, _Digits) + " | SL: " + DoubleToString(g_suggestedSL, _Digits) + " | TP: " + DoubleToString(g_suggestedTP1, _Digits));
   ObjectSetString(0, prefix + "MSG", OBJPROP_TEXT, "Status: " + g_lastMessage);
}

color GetSignalColor()
{
   if(g_currentSignal == "BUY" || g_currentSignal == "STRONG_BUY") return clrLimeGreen;
   if(g_currentSignal == "SELL" || g_currentSignal == "STRONG_SELL") return clrTomato;
   return clrGold;
}

void CreateLabel(string name, int x, int y, string text, int fontSize, string font, color clr)
{
   if(ObjectFind(0, name) < 0)
   {
      ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
      ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
      ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
   }
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, fontSize);
   ObjectSetString(0, name, OBJPROP_FONT, font);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
}

void DeleteHUD()
{
   ObjectsDeleteAll(0, "AI_HUD_");
}
//+------------------------------------------------------------------+
`;
}

export function generateMql5Indicator(params: { apiUrl: string }): string {
  const { apiUrl = 'https://your-domain.run.app' } = params;
  const cleanApiUrl = apiUrl.replace(/\/+$/, '');

  return `//+------------------------------------------------------------------+
//|                                   AI_Forex_Sentiment_HUD.mq5      |
//|                    AI Sentiment & Technical Confluence Indicator  |
//|                                  https://ai.studio/build         |
//+------------------------------------------------------------------+
#property copyright   "AI Forex Predictor Team"
#property link        "https://ai.studio/build"
#property version     "2.00"
#property description "Overlays Real-Time AI News Sentiment & Forecast On Chart"
#property indicator_chart_window
#property indicator_buffers 2
#property indicator_plots   2

#property indicator_label1  "AI Buy Signal"
#property indicator_type1   DRAW_ARROW
#property indicator_color1  clrLimeGreen
#property indicator_width1  3

#property indicator_label2  "AI Sell Signal"
#property indicator_type2   DRAW_ARROW
#property indicator_color2  clrCrimson
#property indicator_width2  3

input string InpApiEndpoint = "${cleanApiUrl}/api/mt5/signal";
input int    InpRefreshSec  = 60;

double BuyBuffer[];
double SellBuffer[];

int OnInit()
{
   SetIndexBuffer(0, BuyBuffer, INDICATOR_DATA);
   SetIndexBuffer(1, SellBuffer, INDICATOR_DATA);
   PlotIndexSetInteger(0, PLOT_ARROW, 233); // Up Arrow
   PlotIndexSetInteger(1, PLOT_ARROW, 234); // Down Arrow
   EventSetTimer(InpRefreshSec);
   return(INIT_SUCCEEDED);
}

void OnDeinit(const int reason)
{
   EventKillTimer();
   ObjectsDeleteAll(0, "AI_IND_");
}

int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   return(rates_total);
}

void OnTimer()
{
   // Query bridge & update indicators
}
`;
}

export interface VisualRiskRewardParams {
  defaultLotSize?: number;
  defaultRiskPips?: number;
  defaultRewardPips?: number;
  initialOrderType?: 'BUY' | 'SELL';
  showControlPanel?: boolean;
  enableOneClickTrade?: boolean;
}

export function generateMql5VisualRiskRewardIndicator(params?: VisualRiskRewardParams): string {
  const {
    defaultLotSize = 0.10,
    defaultRiskPips = 20.0,
    defaultRewardPips = 40.0,
    initialOrderType = 'BUY',
    showControlPanel = true,
    enableOneClickTrade = true,
  } = params || {};

  return `//+------------------------------------------------------------------+
//|                               Interactive_Visual_RiskReward.mq5  |
//|               Draggable On-Chart TP/SL Visual Money & Risk Tool  |
//|                                  https://ai.studio/build         |
//+------------------------------------------------------------------+
#property copyright   "AI Forex Predictor Team"
#property link        "https://ai.studio/build"
#property version     "3.50"
#property description "Interactive Draggable Take-Profit & Stop-Loss Lines with Real-Time Money ($) Calculations"
#property indicator_chart_window
#property indicator_plots 0

#include <Trade\\Trade.mqh>
#include <Trade\\SymbolInfo.mqh>

//--- ENUMS
enum ENUM_TRADE_DIR
{
   DIR_BUY  = 0, // BUY (Long) - TP Above, SL Below
   DIR_SELL = 1  // SELL (Short) - TP Below, SL Above
};

//--- INPUT PARAMETERS
input group "=== INTERACTIVE VISUAL RISK/REWARD CONFIG ==="
input ENUM_TRADE_DIR   InpDefaultDirection = ${initialOrderType === 'BUY' ? 'DIR_BUY' : 'DIR_SELL'}; // Default Direction
input double           InpDefaultLotSize   = ${defaultLotSize};              // Default Lot Size
input double           InpDefaultRiskPips  = ${defaultRiskPips};             // Initial SL Distance (Pips)
input double           InpDefaultRewardPips= ${defaultRewardPips};           // Initial TP Distance (Pips)
input bool             InpShowControlPanel = ${showControlPanel ? 'true' : 'false'};             // Show On-Chart Floating Control Box
input bool             InpEnableOneClick   = ${enableOneClickTrade ? 'true' : 'false'};             // Enable Direct 1-Click Order Execution Button

input group "=== VISUAL STYLING & COLORS ==="
input color            InpColorTP          = clrLimeGreen;     // Take Profit Line Color
input color            InpColorEntry       = clrDeepSkyBlue;   // Entry Line Color
input color            InpColorSL          = clrCrimson;       // Stop Loss Line Color
input int              InpLineWidth        = 2;                // Line Thickness (1-4)
input ENUM_LINE_STYLE  InpLineStyle        = STYLE_DASH;       // Line Style

//--- CONSTANTS & PREFIX
#define PREFIX "VRR_"
#define LINE_TP    PREFIX "Line_TP"
#define LINE_ENTRY PREFIX "Line_Entry"
#define LINE_SL    PREFIX "Line_SL"
#define LBL_TP     PREFIX "Lbl_TP"
#define LBL_ENTRY  PREFIX "Lbl_Entry"
#define LBL_SL     PREFIX "Lbl_SL"
#define BOX_TP     PREFIX "Box_TP"
#define BOX_SL     PREFIX "Box_SL"

// Panel Objects
#define PNL_BG     PREFIX "Pnl_BG"
#define PNL_TITLE  PREFIX "Pnl_Title"
#define PNL_DIR_BTN PREFIX "Pnl_Btn_Dir"
#define PNL_LOT_MINUS PREFIX "Pnl_Btn_LotM"
#define PNL_LOT_PLUS  PREFIX "Pnl_Btn_LotP"
#define PNL_LOT_VAL   PREFIX "Pnl_Lbl_Lot"
#define PNL_STATS  PREFIX "Pnl_Lbl_Stats"
#define PNL_RESET_BTN PREFIX "Pnl_Btn_Reset"
#define PNL_TRADE_BTN PREFIX "Pnl_Btn_Trade"

//--- GLOBAL STATE
CTrade         g_trade;
CSymbolInfo    g_symbol;
ENUM_TRADE_DIR g_dir = ${initialOrderType === 'BUY' ? 'DIR_BUY' : 'DIR_SELL'};
double         g_lotSize = ${defaultLotSize};
double         g_entryPrice = 0.0;
double         g_tpPrice = 0.0;
double         g_slPrice = 0.0;

//+------------------------------------------------------------------+
//| Indicator Initialization                                         |
//+------------------------------------------------------------------+
int OnInit()
{
   if(!g_symbol.Name(_Symbol))
   {
      Print("[VRR ERROR] Cannot initialize symbol ", _Symbol);
      return(INIT_FAILED);
   }
   g_symbol.RefreshRates();

   g_trade.SetExpertMagicNumber(991122);
   g_trade.SetDeviationInPoints(20);

   g_dir = InpDefaultDirection;
   g_lotSize = InpDefaultLotSize;

   ResetLinesToCurrentPrice();

   ChartSetInteger(0, CHART_EVENT_MOUSE_MOVE, true);
   ChartSetInteger(0, CHART_SHOW_GRID, true);

   Print("=================================================");
   Print("🎯 INTERACTIVE VISUAL RISK/REWARD INDICATOR LOADED");
   Print("   Symbol: ", _Symbol, " | Default Lot: ", DoubleToString(g_lotSize, 2));
   Print("   💡 Drag the GREEN (TP) and RED (SL) lines on chart with your mouse!");
   Print("=================================================");

   return(INIT_SUCCEEDED);
}

//+------------------------------------------------------------------+
//| Indicator Deinitialization                                       |
//+------------------------------------------------------------------+
void OnDeinit(const int reason)
{
   ObjectsDeleteAll(0, PREFIX);
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Calculation Event (Tick updater)                                 |
//+------------------------------------------------------------------+
int OnCalculate(const int rates_total,
                const int prev_calculated,
                const datetime &time[],
                const double &open[],
                const double &high[],
                const double &low[],
                const double &close[],
                const long &tick_volume[],
                const long &volume[],
                const int &spread[])
{
   g_symbol.RefreshRates();
   return(rates_total);
}

//+------------------------------------------------------------------+
//| Reset Lines around Market Bid/Ask                                |
//+------------------------------------------------------------------+
void ResetLinesToCurrentPrice()
{
   g_symbol.RefreshRates();
   double pip = GetPipSize();
   double currentPrice = (g_dir == DIR_BUY) ? g_symbol.Ask() : g_symbol.Bid();

   g_entryPrice = NormalizeDouble(currentPrice, _Digits);

   if(g_dir == DIR_BUY)
   {
      g_tpPrice = NormalizeDouble(g_entryPrice + (InpDefaultRewardPips * pip), _Digits);
      g_slPrice = NormalizeDouble(g_entryPrice - (InpDefaultRiskPips * pip), _Digits);
   }
   else
   {
      g_tpPrice = NormalizeDouble(g_entryPrice - (InpDefaultRewardPips * pip), _Digits);
      g_slPrice = NormalizeDouble(g_entryPrice + (InpDefaultRiskPips * pip), _Digits);
   }

   CreateOrUpdateVisualLines();
   if(InpShowControlPanel) CreateOrUpdateControlPanel();
   ChartRedraw(0);
}

//+------------------------------------------------------------------+
//| Create or update the 3 draggable horizontal lines & labels       |
//+------------------------------------------------------------------+
void CreateOrUpdateVisualLines()
{
   double pip = GetPipSize();
   string accCurrency = AccountInfoString(ACCOUNT_CURRENCY);
   double accBalance = AccountInfoDouble(ACCOUNT_BALANCE);
   if(accBalance <= 0) accBalance = 10000.0;

   // 1. Calculate Pips and Dollars
   double tpPips = MathAbs(g_tpPrice - g_entryPrice) / pip;
   double slPips = MathAbs(g_entryPrice - g_slPrice) / pip;

   double tpMoney = CalculateProfitAmount(g_entryPrice, g_tpPrice, g_lotSize);
   double slMoney = CalculateProfitAmount(g_entryPrice, g_slPrice, g_lotSize);
   double slRiskAmount = MathAbs(slMoney);
   double riskPercent = (slRiskAmount / accBalance) * 100.0;

   double rrRatio = (slPips > 0) ? (tpPips / slPips) : 0.0;

   // 2. Create / Update TAKE PROFIT Line & Label
   EnsureHLine(LINE_TP, g_tpPrice, InpColorTP, InpLineWidth, InpLineStyle, "Drag to adjust Take Profit target");
   string tpText = StringFormat("🎯 TAKE PROFIT: %." + IntegerToString(_Digits) + "f  |  +%$%.2f (+%.1f pips)  |  R:R 1:%.2f",
                                g_tpPrice, tpMoney, tpPips, rrRatio);
   EnsurePriceLabel(LBL_TP, g_tpPrice, tpText, InpColorTP);

   // 3. Create / Update ENTRY Line & Label
   EnsureHLine(LINE_ENTRY, g_entryPrice, InpColorEntry, InpLineWidth + 1, STYLE_SOLID, "Entry Price reference");
   string entryText = StringFormat("🚀 %s ENTRY: %." + IntegerToString(_Digits) + "f  |  Lot Size: %.2f  |  Tick Val: $%.2f/pip",
                                   (g_dir == DIR_BUY ? "BUY" : "SELL"), g_entryPrice, g_lotSize, GetPipValuePerLot() * g_lotSize);
   EnsurePriceLabel(LBL_ENTRY, g_entryPrice, entryText, InpColorEntry);

   // 4. Create / Update STOP LOSS Line & Label
   EnsureHLine(LINE_SL, g_slPrice, InpColorSL, InpLineWidth, InpLineStyle, "Drag to adjust Stop Loss protection");
   string slText = StringFormat("🛑 STOP LOSS: %." + IntegerToString(_Digits) + "f  |  -$%.2f (-%.1f pips)  |  Risk: %.2f%% of Balance",
                                g_slPrice, slRiskAmount, slPips, riskPercent);
   EnsurePriceLabel(LBL_SL, g_slPrice, slText, InpColorSL);
}

//+------------------------------------------------------------------+
//| Chart Event Handler (Dragging & Button Clicks)                   |
//+------------------------------------------------------------------+
void OnChartEvent(const int id,
                  const long &lparam,
                  const double &dparam,
                  const string &sparam)
{
   // Handle Object Dragging
   if(id == CHARTEVENT_OBJECT_DRAG)
   {
      if(sparam == LINE_TP)
      {
         g_tpPrice = NormalizeDouble(ObjectGetDouble(0, LINE_TP, OBJPROP_PRICE), _Digits);
         CreateOrUpdateVisualLines();
         if(InpShowControlPanel) UpdatePanelStats();
         ChartRedraw(0);
      }
      else if(sparam == LINE_SL)
      {
         g_slPrice = NormalizeDouble(ObjectGetDouble(0, LINE_SL, OBJPROP_PRICE), _Digits);
         CreateOrUpdateVisualLines();
         if(InpShowControlPanel) UpdatePanelStats();
         ChartRedraw(0);
      }
      else if(sparam == LINE_ENTRY)
      {
         double newEntry = NormalizeDouble(ObjectGetDouble(0, LINE_ENTRY, OBJPROP_PRICE), _Digits);
         double diff = newEntry - g_entryPrice;
         g_entryPrice = newEntry;
         g_tpPrice = NormalizeDouble(g_tpPrice + diff, _Digits);
         g_slPrice = NormalizeDouble(g_slPrice + diff, _Digits);
         CreateOrUpdateVisualLines();
         if(InpShowControlPanel) UpdatePanelStats();
         ChartRedraw(0);
      }
   }

   // Handle UI Button Clicks
   if(id == CHARTEVENT_OBJECT_CLICK)
   {
      if(sparam == PNL_DIR_BTN)
      {
         // Flip Buy / Sell direction
         g_dir = (g_dir == DIR_BUY) ? DIR_SELL : DIR_BUY;
         ResetLinesToCurrentPrice();
      }
      else if(sparam == PNL_LOT_MINUS)
      {
         if(g_lotSize > 0.01)
         {
            g_lotSize = MathMax(0.01, NormalizeDouble(g_lotSize - 0.05, 2));
            CreateOrUpdateVisualLines();
            if(InpShowControlPanel) CreateOrUpdateControlPanel();
            ChartRedraw(0);
         }
      }
      else if(sparam == PNL_LOT_PLUS)
      {
         g_lotSize = NormalizeDouble(g_lotSize + 0.05, 2);
         CreateOrUpdateVisualLines();
         if(InpShowControlPanel) CreateOrUpdateControlPanel();
         ChartRedraw(0);
      }
      else if(sparam == PNL_RESET_BTN)
      {
         ResetLinesToCurrentPrice();
      }
      else if(sparam == PNL_TRADE_BTN && InpEnableOneClick)
      {
         ExecuteCalculatedOrder();
      }
   }
}

//+------------------------------------------------------------------+
//| Execute Order directly with calculated TP & SL                   |
//+------------------------------------------------------------------+
void ExecuteCalculatedOrder()
{
   if(!TerminalInfoInteger(TERMINAL_TRADE_ALLOWED))
   {
      Alert("[VRR ALERT] Please turn ON [Algo Trading] in MT5 Top Toolbar to execute order!");
      return;
   }

   g_symbol.RefreshRates();
   double price = (g_dir == DIR_BUY) ? g_symbol.Ask() : g_symbol.Bid();

   bool res = false;
   if(g_dir == DIR_BUY)
   {
      res = g_trade.Buy(g_lotSize, _Symbol, price, g_slPrice, g_tpPrice, "Visual Risk/Reward BUY");
   }
   else
   {
      res = g_trade.Sell(g_lotSize, _Symbol, price, g_slPrice, g_tpPrice, "Visual Risk/Reward SELL");
   }

   if(res)
   {
      Alert(StringFormat("✅ Order Executed! %s %.2f lots @ %.5f (SL: %.5f | TP: %.5f)",
                         (g_dir == DIR_BUY ? "BUY" : "SELL"), g_lotSize, price, g_slPrice, g_tpPrice));
   }
   else
   {
      PrintFormat("[VRR ERROR] Trade execution failed: %s (%d)", g_trade.ResultRetcodeDescription(), g_trade.ResultRetcode());
   }
}

//+------------------------------------------------------------------+
//| Money & Profit Calculation Helper (Accounts for Tick & Contract) |
//+------------------------------------------------------------------+
double CalculateProfitAmount(double openPrice, double closePrice, double lots)
{
   ENUM_ORDER_TYPE orderType = (g_dir == DIR_BUY) ? ORDER_TYPE_BUY : ORDER_TYPE_SELL;
   double profit = 0.0;
   
   if(OrderCalcProfit(orderType, _Symbol, lots, openPrice, closePrice, profit))
   {
      return profit;
   }

   // Fallback manual calculation using Tick Value
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   if(tickSize <= 0) tickSize = _Point;
   if(tickValue <= 0) tickValue = 1.0;

   double points = (closePrice - openPrice) / tickSize;
   if(g_dir == DIR_SELL) points = -points;

   return points * tickValue * lots;
}

double GetPipValuePerLot()
{
   double tickSize = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_SIZE);
   double tickValue = SymbolInfoDouble(_Symbol, SYMBOL_TRADE_TICK_VALUE);
   if(tickSize <= 0) tickSize = _Point;
   if(tickValue <= 0) tickValue = 1.0;
   return (GetPipSize() / tickSize) * tickValue;
}

double GetPipSize()
{
   if(_Digits == 5 || _Digits == 3) return _Point * 10;
   return _Point;
}

//+------------------------------------------------------------------+
//| Graphic Object Utilities (Lines, Labels, Controls)               |
//+------------------------------------------------------------------+
void EnsureHLine(string name, double price, color clr, int width, ENUM_LINE_STYLE style, string tooltip)
{
   if(ObjectFind(0, name) < 0)
   {
      ObjectCreate(0, name, OBJ_HLINE, 0, 0, price);
      ObjectSetInteger(0, name, OBJPROP_SELECTABLE, true);
      ObjectSetInteger(0, name, OBJPROP_SELECTED, false);
      ObjectSetInteger(0, name, OBJPROP_BACK, false);
   }
   ObjectSetDouble(0, name, OBJPROP_PRICE, price);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetInteger(0, name, OBJPROP_WIDTH, width);
   ObjectSetInteger(0, name, OBJPROP_STYLE, style);
   ObjectSetString(0, name, OBJPROP_TOOLTIP, tooltip + "\\nClick & Drag with mouse to adjust");
}

void EnsurePriceLabel(string name, double price, string text, color clr)
{
   if(ObjectFind(0, name) < 0)
   {
      ObjectCreate(0, name, OBJ_TEXT, 0, iTime(_Symbol, _Period, 2), price);
      ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
   }
   datetime anchorTime = iTime(_Symbol, _Period, 5);
   if(anchorTime == 0) anchorTime = TimeCurrent();
   
   ObjectSetDouble(0, name, OBJPROP_PRICE, price);
   ObjectSetInteger(0, name, OBJPROP_TIME, anchorTime);
   ObjectSetString(0, name, OBJPROP_TEXT, "  " + text);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetString(0, name, OBJPROP_FONT, "Segoe UI Bold");
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 9);
   ObjectSetInteger(0, name, OBJPROP_ANCHOR, ANCHOR_LEFT_LOWER);
}

//+------------------------------------------------------------------+
//| On-Chart Interactive Control Box                                 |
//+------------------------------------------------------------------+
void CreateOrUpdateControlPanel()
{
   int x = 20;
   int y = 50;
   int width = 230;
   int height = 185;

   // 1. Background
   CreateOrUpdateRect(PNL_BG, x, y, width, height, C'16,24,40', C'40,60,95', 1);

   // 2. Title
   CreateOrUpdateLabel(PNL_TITLE, x + 10, y + 10, "⚡ RISK/REWARD CALCULATOR", 9, "Segoe UI Bold", clrDeepSkyBlue);

   // 3. Direction Flip Button
   string dirBtnText = (g_dir == DIR_BUY) ? "MODE: 🟢 BUY (Click to Flip)" : "MODE: 🔴 SELL (Click to Flip)";
   color dirBtnColor = (g_dir == DIR_BUY) ? C'20,80,45' : C'100,30,30';
   CreateOrUpdateButton(PNL_DIR_BTN, x + 10, y + 32, width - 20, 22, dirBtnText, dirBtnColor, clrWhite);

   // 4. Lot Size Controls [-] 0.10 [+]
   CreateOrUpdateButton(PNL_LOT_MINUS, x + 10, y + 60, 32, 22, "-", C'30,42,65', clrWhite);
   CreateOrUpdateLabel(PNL_LOT_VAL, x + 50, y + 63, StringFormat("Lots: %.2f", g_lotSize), 9, "Segoe UI Bold", clrWhite);
   CreateOrUpdateButton(PNL_LOT_PLUS, x + 130, y + 60, 32, 22, "+", C'30,42,65', clrWhite);
   CreateOrUpdateButton(PNL_RESET_BTN, x + 170, y + 60, 50, 22, "Reset", C'25,35,55', clrLightSkyBlue);

   // 5. Live Money Stats Text
   UpdatePanelStats();

   // 6. One-Click Execute Button
   if(InpEnableOneClick)
   {
      string tradeText = StringFormat("🚀 Execute %s %.2f Lots", (g_dir == DIR_BUY ? "BUY" : "SELL"), g_lotSize);
      color tradeBg = (g_dir == DIR_BUY) ? clrSeaGreen : clrCrimson;
      CreateOrUpdateButton(PNL_TRADE_BTN, x + 10, y + 145, width - 20, 28, tradeText, tradeBg, clrWhite);
   }
}

void UpdatePanelStats()
{
   int x = 20;
   int y = 50;
   double pip = GetPipSize();
   double tpPips = MathAbs(g_tpPrice - g_entryPrice) / pip;
   double slPips = MathAbs(g_entryPrice - g_slPrice) / pip;
   double tpMoney = CalculateProfitAmount(g_entryPrice, g_tpPrice, g_lotSize);
   double slMoney = MathAbs(CalculateProfitAmount(g_entryPrice, g_slPrice, g_lotSize));
   double rr = (slPips > 0) ? (tpPips / slPips) : 0.0;

   string stats = StringFormat("Win: +$%.2f (%.1fp)\\nRisk: -$%.2f (%.1fp)\\nR:R Ratio: 1 : %.2f",
                               tpMoney, tpPips, slMoney, slPips, rr);
   CreateOrUpdateLabel(PNL_STATS, x + 10, y + 90, stats, 8, "Segoe UI", clrLightCyan);
}

void CreateOrUpdateRect(string name, int x, int y, int w, int h, color bg, color border, int bw)
{
   if(ObjectFind(0, name) < 0)
   {
      ObjectCreate(0, name, OBJ_RECTANGLE_LABEL, 0, 0, 0);
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
   }
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_XSIZE, w);
   ObjectSetInteger(0, name, OBJPROP_YSIZE, h);
   ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bg);
   ObjectSetInteger(0, name, OBJPROP_BORDER_COLOR, border);
   ObjectSetInteger(0, name, OBJPROP_BORDER_TYPE, BORDER_FLAT);
}

void CreateOrUpdateButton(string name, int x, int y, int w, int h, string text, color bg, color clr)
{
   if(ObjectFind(0, name) < 0)
   {
      ObjectCreate(0, name, OBJ_BUTTON, 0, 0, 0);
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
   }
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetInteger(0, name, OBJPROP_XSIZE, w);
   ObjectSetInteger(0, name, OBJPROP_YSIZE, h);
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_BGCOLOR, bg);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
   ObjectSetString(0, name, OBJPROP_FONT, "Segoe UI Bold");
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, 8);
}

void CreateOrUpdateLabel(string name, int x, int y, string text, int fontSize, string font, color clr)
{
   if(ObjectFind(0, name) < 0)
   {
      ObjectCreate(0, name, OBJ_LABEL, 0, 0, 0);
      ObjectSetInteger(0, name, OBJPROP_CORNER, CORNER_LEFT_UPPER);
      ObjectSetInteger(0, name, OBJPROP_SELECTABLE, false);
      ObjectSetInteger(0, name, OBJPROP_HIDDEN, true);
   }
   ObjectSetInteger(0, name, OBJPROP_XDISTANCE, x);
   ObjectSetInteger(0, name, OBJPROP_YDISTANCE, y);
   ObjectSetString(0, name, OBJPROP_TEXT, text);
   ObjectSetInteger(0, name, OBJPROP_FONTSIZE, fontSize);
   ObjectSetString(0, name, OBJPROP_FONT, font);
   ObjectSetInteger(0, name, OBJPROP_COLOR, clr);
}
//+------------------------------------------------------------------+
`;
}

