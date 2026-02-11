export enum MistakeCategoryEnum {
  EMOTIONAL = 'emotional',
  RISK_MANAGEMENT = 'risk_management', 
  STRATEGY = 'strategy',
  TIMING = 'timing',
  TECHNICAL = 'technical',
  CUSTOM = 'custom'
}

export enum MistakeSeverity {
  LOW = 'low',
  MEDIUM = 'medium', 
  HIGH = 'high'
}

export enum EmotionalState {
  CONFIDENT = 'confident',
  FEARFUL = 'fearful',
  GREEDY = 'greedy',
  NEUTRAL = 'neutral',
  ANXIOUS = 'anxious',
  EUPHORIC = 'euphoric'
}

export interface MistakeCategory {
  id: string;
  name: string;
  description: string;
  category: MistakeCategoryEnum;
}

export interface PredefinedMistake {
  id: string;
  label: string;
  category: MistakeCategoryEnum;
  description: string;
  commonImpact?: string;
  learningTip?: string;
}

export interface TradeMistake {
  id: string;
  tradeId: string;
  mistakeType: string; // predefined mistake ID or custom label
  customLabel?: string;
  severity: MistakeSeverity;
  emotionalState?: EmotionalState;
  notes?: string;
  learningPoints?: string;
  preventionStrategy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CustomMistake {
  id: string;
  userId: string;
  label: string;
  category: MistakeCategoryEnum;
  description?: string;
  usageCount: number;
  createdAt: Date;
}

export interface MistakeAnalytics {
  totalMistakes: number;
  mistakesByCategory: Record<MistakeCategoryEnum, number>;
  mistakesBySeverity: Record<MistakeSeverity, number>;
  mostCommonMistakes: Array<{
    type: string;
    label: string;
    count: number;
    avgSeverity: MistakeSeverity;
    totalImpact: number;
  }>;
  mistakeFrequency: number; // percentage of trades with mistakes
  mistakeImpact: {
    totalLoss: number;
    avgLossPerMistake: number;
    worstMistakeType: string;
  };
  improvementTrend: Array<{
    period: string;
    mistakeCount: number;
    mistakeRate: number;
  }>;
  emotionalPatterns: Record<EmotionalState, number>;
}

export interface MistakeFilter {
  category?: MistakeCategoryEnum;
  severity?: MistakeSeverity;
  emotionalState?: EmotionalState;
  startDate?: Date;
  endDate?: Date;
  tradeId?: string;
}

export interface MistakeImpactAnalysis {
  tradesBefore: number;
  tradesAfter: number;
  pnlBefore: number;
  pnlAfter: number;
  winRateBefore: number;
  winRateAfter: number;
  avgHoldTimeBefore: number;
  avgHoldTimeAfter: number;
}

export interface MistakeTrend {
  period: string;
  mistakeCount: number;
  totalTrades: number;
  mistakeRate: number;
  totalImpact: number;
  avgSeverity: number;
}

// Predefined mistake categories following research pattern
export const PREDEFINED_MISTAKES: PredefinedMistake[] = [
  // Emotional Mistakes
  {
    id: 'emo_fomo',
    label: 'FOMO Entry',
    category: MistakeCategoryEnum.EMOTIONAL,
    description: 'Entered position due to fear of missing out',
    commonImpact: 'Buying at peaks, poor entry timing',
    learningTip: 'Wait for proper setups and stick to your strategy'
  },
  {
    id: 'emo_revenge',
    label: 'Revenge Trading',
    category: MistakeCategoryEnum.EMOTIONAL,
    description: 'Trading to recover from previous losses',
    commonImpact: 'Increased position size, poor decision making',
    learningTip: 'Take a break after losses to clear your head'
  },
  {
    id: 'emo_greed',
    label: 'Greed - Held Too Long',
    category: MistakeCategoryEnum.EMOTIONAL,
    description: 'Did not take profits when target was reached',
    commonImpact: 'Missed optimal exit points, gave back gains',
    learningTip: 'Set profit targets and stick to them'
  },
  {
    id: 'emo_panic',
    label: 'Panic Selling',
    category: MistakeCategoryEnum.EMOTIONAL,
    description: 'Sold position in panic during temporary dip',
    commonImpact: 'Realized unnecessary losses, missed recovery',
    learningTip: 'Trust your stop loss levels and analysis'
  },
  {
    id: 'emo_overconfident',
    label: 'Overconfidence',
    category: MistakeCategoryEnum.EMOTIONAL,
    description: 'Took excessive risk after winning streak',
    commonImpact: 'Larger than planned position sizes',
    learningTip: 'Stick to position sizing rules regardless of recent performance'
  },

  // Risk Management Mistakes
  {
    id: 'risk_no_stop',
    label: 'No Stop Loss',
    category: MistakeCategoryEnum.RISK_MANAGEMENT,
    description: 'Entered position without predetermined exit strategy',
    commonImpact: 'Large unexpected losses, portfolio damage',
    learningTip: 'Always set stop loss before entering any position'
  },
  {
    id: 'risk_large_size',
    label: 'Position Size Too Large',
    category: MistakeCategoryEnum.RISK_MANAGEMENT,
    description: 'Risked more than planned percentage of portfolio',
    commonImpact: 'Excessive drawdown, emotional stress',
    learningTip: 'Never risk more than 1-2% of portfolio on single trade'
  },
  {
    id: 'risk_moved_stop',
    label: 'Moved Stop Loss',
    category: MistakeCategoryEnum.RISK_MANAGEMENT,
    description: 'Changed stop loss to avoid taking planned loss',
    commonImpact: 'Larger losses than intended, broke trading rules',
    learningTip: 'Respect your initial stop loss placement'
  },
  {
    id: 'risk_no_plan',
    label: 'No Trading Plan',
    category: MistakeCategoryEnum.RISK_MANAGEMENT,
    description: 'Entered trade without clear entry/exit criteria',
    commonImpact: 'Poor execution, emotional decision making',
    learningTip: 'Always have a complete plan before entering'
  },
  {
    id: 'risk_overleveraged',
    label: 'Excessive Leverage',
    category: MistakeCategoryEnum.RISK_MANAGEMENT,
    description: 'Used too much leverage relative to account size',
    commonImpact: 'Forced liquidations, rapid account depletion',
    learningTip: 'Use conservative leverage until proven profitable'
  },

  // Strategy Mistakes
  {
    id: 'strat_wrong_setup',
    label: 'Wrong Setup',
    category: MistakeCategoryEnum.STRATEGY,
    description: 'Entered trade that did not match strategy criteria',
    commonImpact: 'Lower probability trades, inconsistent results',
    learningTip: 'Only take trades that perfectly match your setup'
  },
  {
    id: 'strat_no_confluence',
    label: 'Lack of Confluence',
    category: MistakeCategoryEnum.STRATEGY,
    description: 'Took trade without multiple confirming signals',
    commonImpact: 'Lower win rate, weaker setups',
    learningTip: 'Wait for at least 2-3 confirming indicators'
  },
  {
    id: 'strat_against_trend',
    label: 'Traded Against Trend',
    category: MistakeCategoryEnum.STRATEGY,
    description: 'Entered position contrary to higher timeframe trend',
    commonImpact: 'Fighting market momentum, lower success rate',
    learningTip: 'Align trades with higher timeframe direction'
  },
  {
    id: 'strat_bad_rr',
    label: 'Poor Risk/Reward Ratio',
    category: MistakeCategoryEnum.STRATEGY,
    description: 'Risk/reward ratio was unfavorable (less than 1:2)',
    commonImpact: 'Need high win rate to be profitable',
    learningTip: 'Target minimum 1:2 risk/reward on all trades'
  },

  // Timing Mistakes
  {
    id: 'time_bad_entry',
    label: 'Poor Entry Timing',
    category: MistakeCategoryEnum.TIMING,
    description: 'Entered too early or too late in the move',
    commonImpact: 'Worse fill prices, immediate drawdown',
    learningTip: 'Wait for proper confirmation before entering'
  },
  {
    id: 'time_bad_exit',
    label: 'Poor Exit Timing',
    category: MistakeCategoryEnum.TIMING,
    description: 'Exited position at suboptimal time',
    commonImpact: 'Left money on table or took unnecessary loss',
    learningTip: 'Follow your predetermined exit strategy'
  },
  {
    id: 'time_news_trade',
    label: 'Traded During News',
    category: MistakeCategoryEnum.TIMING,
    description: 'Entered position around high-impact news events',
    commonImpact: 'Extreme volatility, unpredictable price action',
    learningTip: 'Avoid trading 30 min before/after major news'
  },
  {
    id: 'time_low_volume',
    label: 'Low Volume Trading',
    category: MistakeCategoryEnum.TIMING,
    description: 'Traded during periods of low market activity',
    commonImpact: 'Wide spreads, poor execution, false signals',
    learningTip: 'Focus trading during active market hours'
  },

  // Technical Mistakes
  {
    id: 'tech_missed_signal',
    label: 'Missed Exit Signal',
    category: MistakeCategoryEnum.TECHNICAL,
    description: 'Failed to recognize technical exit signal',
    commonImpact: 'Gave back profits, held losing position too long',
    learningTip: 'Set alerts for key technical levels'
  },
  {
    id: 'tech_wrong_timeframe',
    label: 'Wrong Timeframe',
    category: MistakeCategoryEnum.TECHNICAL,
    description: 'Used inappropriate timeframe for trade duration',
    commonImpact: 'Noise instead of signal, poor entries/exits',
    learningTip: 'Match timeframe to intended hold period'
  },
  {
    id: 'tech_broke_support',
    label: 'Ignored Support/Resistance',
    category: MistakeCategoryEnum.TECHNICAL,
    description: 'Did not respect key technical levels',
    commonImpact: 'Poor entry/exit points, fought key levels',
    learningTip: 'Always identify and respect key S/R levels'
  }
];

export const MISTAKE_CATEGORIES = [
  {
    id: 'emotional',
    name: 'Emotional',
    description: 'Mistakes driven by emotions like fear, greed, or revenge',
    category: MistakeCategoryEnum.EMOTIONAL
  },
  {
    id: 'risk_management', 
    name: 'Risk Management',
    description: 'Mistakes related to position sizing, stop losses, and risk control',
    category: MistakeCategoryEnum.RISK_MANAGEMENT
  },
  {
    id: 'strategy',
    name: 'Strategy',
    description: 'Mistakes in trade setup selection and strategy execution',
    category: MistakeCategoryEnum.STRATEGY
  },
  {
    id: 'timing',
    name: 'Timing',
    description: 'Mistakes related to entry and exit timing',
    category: MistakeCategoryEnum.TIMING
  },
  {
    id: 'technical',
    name: 'Technical Analysis',
    description: 'Mistakes in reading charts and technical indicators',
    category: MistakeCategoryEnum.TECHNICAL
  },
  {
    id: 'custom',
    name: 'Custom',
    description: 'User-defined mistake categories',
    category: MistakeCategoryEnum.CUSTOM
  }
] as const;