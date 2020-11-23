var z = require('zero-fill')
  , n = require('numbro')
  , Phenotypes = require('../../../lib/phenotype');

const SHORT_PERIOD_DELTA = 30*60*1000;
const MEDIUM_PERIOD_DELTA = 3*60*60*1000;
const LONG_PERIOD_DELTA = 24*60*60*1000;

function percent(startVal, endVal) {
  return ((endVal / startVal) - 1) * 100;
}

function onStableTrend(s) {
  // TODO If long term stable, detect min and max and place buy order with limits
}

var pointsWaitingTheLight = 0;
var initialExpectedGain = 10;

module.exports = {
    name: 'trend_aware',
    description: 'Funcy stuff that do stuff keeping an eye on the trend',

    getOptions: function() {
        this.option('period', 'period length, same as --period_length', String, '2m')
        this.option('period_length', 'period length, same as --period', String, '2m')
        this.option('min_periods', 'min. number of history periods', Number, 52)
    },

    calculate: function(s) {
        if(!s.lookback[0]) {
            return;
        }

        const closePrice = s.period.close;
        var shortTermOpen = 0;0
        var mediumTermOpen = 0;
        var longTermOpen = 0;

        const now = s.period.time;
        var shortTermTime = now - SHORT_PERIOD_DELTA;
        var mediumTermTime = now - MEDIUM_PERIOD_DELTA;
        var longTermTime = now - LONG_PERIOD_DELTA;

        s.lookback.some(t => {
            if(t.time > shortTermTime) {
                shortTermOpen = t.open;
            }
            if(t.time > mediumTermTime) {
                mediumTermOpen = t.open;
            }
            if(t.time > longTermTime) {
                longTermOpen = t.open;
                return false;
            }
            return true;
        });

        s.shortTrend = percent(shortTermOpen, closePrice);
        s.mediumTrend = percent(mediumTermOpen, closePrice);
        s.longTrend = percent(longTermOpen, closePrice);
    },

    onPeriod: function(s, cb) {
        s.signal = null;
        const currentPrice = (s.period.open + s.period.close) / 2;

        if(s.last_signal === 'buy') {
            if(!s.maxPriceSincePurchased) {
                s.maxPriceSincePurchased = currentPrice;
            } else {
                s.maxPriceSincePurchased = Math.max(currentPrice, s.maxPriceSincePurchased);
            }

            const expectedGainPercent = Math.max(1, initialExpectedGain - (pointsWaitingTheLight / 100));
            const stopLossPercent = Math.min(-10, -20 + (pointsWaitingTheLight / 30));
            ++pointsWaitingTheLight;

            // Stop if loss or trending down
            if(false
                || percent(s.last_buy_price, currentPrice) >= expectedGainPercent
                //|| ((percent(s.last_buy_price, currentPrice) - percent(s.last_buy_price, s.maxPriceSincePurchased)) < -1 && percent(s.last_buy_price, currentPrice) > 1)
                || percent(s.maxPriceSincePurchased, currentPrice) < stopLossPercent
            ) {
                s.signal = 'sell';
                //initialExpectedGain = Math.max(5, expectedGainPercent) * 2;
                initialExpectedGain = 10;
                pointsWaitingTheLight = 0;
                if(s.last_signal !== 'sell') {
                    s.minPriceSinceSold = 0;
                }
                console.log('sell', s.last_buy_price, s.maxPriceSincePurchased, currentPrice, percent(parseFloat(s.last_buy_price), currentPrice));
                cb();
                return;
            }
        }

        if(s.longTrend < -1) {
            // Negative Trend
            // if(s.last_signal === 'buy') {
            //     s.signal = 'sell';
            //     console.log('**NEGATIVE PERIOD**');
            // }
        } else if(s.longTrend > 1) {
            // Positive Trend
            if(s.last_signal === 'buy') {
                // if(!s.maxPriceSincePurchased) {
                //     s.maxPriceSincePurchased = currentPrice;
                // } else {
                //     s.maxPriceSincePurchased = Math.max(currentPrice, s.maxPriceSincePurchased);
                // }
                //33
                // // Stop if loss or trending down
                // if(//percent(parseFloat(s.last_buy_price), currentPrice) < -3 ||
                //     (percent(s.last_buy_price, currentPrice) - percent(s.maxPriceSincePurchased, currentPrice)) < -3 ||
                //     percent(s.maxPriceSincePurchased, currentPrice) < -5) {
                //     s.signal = 'sell';
                //     if(s.last_signal !== 'sell') {
                //         s.minPriceSinceSold = 0;
                //     }
                //     console.log('sell', s.last_buy_price, s.maxPriceSincePurchased, currentPrice, percent(parseFloat(s.last_buy_price), currentPrice));
                // }
            } else {
                if(!s.minPriceSinceSold) {
                    s.minPriceSinceSold = currentPrice;
                } else {
                    s.minPriceSinceSold = Math.min(currentPrice, s.minPriceSinceSold);
                }

                if(percent(s.minPriceSinceSold, currentPrice) > 1) {
                    s.signal = 'buy';
                    if(s.last_signal !== 'buy') {
                        s.maxPriceSincePurchased = 0;
                    }
                    console.log('buy', s.longTrend, s.last_sell_price, s.minPriceSinceSold, currentPrice);
                }

                // if(s.mediumTrend > 3) {
                //     s.signal = 'buy';
                //     if(s.last_signal !== 'buy') {
                //         s.maxPriceSincePurchased = 0;
                //     }
                // }
            }

        } else {
            onStableTrend(s);
        }
        cb();
    },

    onReport: function (s) {
      var cols = []
      if (typeof s.longTrend === 'number') {
        var color = 'grey'
        if (s.longTrend > 0) {
          color = 'green'
        } else if (s.longTrend < 0) {
          color = 'red'
        }
        cols.push(z(8, n(s.longTrend).format('+00.0000'), ' ')[color])
      }
      else {
        cols.push('         ')
      }
      return cols
  },

  phenotypes: {
      // -- common
      period_length: Phenotypes.RangePeriod(1, 120, 'm'),
      min_periods: Phenotypes.Range(1, 100),
      markdown_buy_pct: Phenotypes.RangeFloat(-1, 5),
      markup_sell_pct: Phenotypes.RangeFloat(-1, 5),
      order_type: Phenotypes.ListOption(['maker', 'taker']),
      sell_stop_pct: Phenotypes.Range0(1, 50),
      buy_stop_pct: Phenotypes.Range0(1, 50),
      profit_stop_enable_pct: Phenotypes.Range0(1, 20),
      profit_stop_pct: Phenotypes.Range(1,20),

      // -- strategy
      trend_ema: Phenotypes.Range(1, 40),
      oversold_rsi_periods: Phenotypes.Range(5, 50),
      oversold_rsi: Phenotypes.Range(20, 100)
  }
}
/* Made by gab*/
