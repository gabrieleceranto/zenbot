const util = require('util')
const path = require('path')
const talib = require('talib')

const createCsvWriter = require('csv-writer').createArrayCsvWriter;
const csvFile = path.resolve(__dirname, '..', '..', '..', 'simulations', 'export.csv')

function getCsvWriter(s) {
    if (!s.csvWriter) {
        s.csvWriter = createCsvWriter({
          path: csvFile,
          header: getHeaders(s.options.lookback_periods)
        })
    }
    return s.csvWriter
}

function getHeaders(lookbackPeriods) {
    let headers = ['period_id', 'size', 'time']
    for (let i = 0; i < lookbackPeriods; ++i) {
        headers.push('open' + i)
        headers.push('high' + i)
        headers.push('low' + i)
        headers.push('close' + i)
        headers.push('volume' + i)
    }
    return headers
}

module.exports = {
  name: 'csv_exporter',
  description: 'Just do nothing. Exports on CSV.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '5m')
    this.option('period_length', 'period length, same as --period', String, '5m')
    this.option('lookback_periods', 'min. number of history periods', Number, 72)
    this.option('lookforward_periods', 'min. number of future periods to look to determine the outcome', Number, 18)
  },

  calculate: function (s) {
    // Do nothing
  },

  onPeriod: function (s, cb) {
      // console.log(util.inspect(s, {showHidden: false, depth: null}))
      let requiredPeriods = s.options.lookback_periods + s.options.lookforward_periods
      if (s.lookback && s.lookback.length >= requiredPeriods) {
          let futurePeriods = s.lookback.slice(0, s.options.lookforward_periods)
          let historyPeriods = s.lookback.slice(s.options.lookforward_periods, s.options.lookforward_periods + s.options.lookback_periods)
          let currentValue = historyPeriods[0].close

          let row = []
          row.push(s.period.period_id)
          row.push(s.period.size)
          row.push(s.period.time)
          row.push(s.period.open)
          row.push(s.period.high)
          row.push(s.period.low)
          row.push(s.period.close)
          row.push(s.period.volume)
          // historyPeriods.forEach((period) => {
          //     row.push(period.open)
          //     row.push(period.high)
          //     row.push(period.low)
          //     row.push(period.close)
          //     row.push(period.volume)
          // })
          for (let i=1; i<s.options.lookback_periods; ++i) {
              let period = historyPeriods[i]

              // Calculate % increase/decrease compared to the current value
              row.push((s.period.open   - period.open  ) / period.open  )
              row.push((s.period.high   - period.high  ) / period.high  )
              row.push((s.period.low    - period.low   ) / period.low   )
              row.push((s.period.close  - period.close ) / period.close )
              row.push((s.period.volume - period.volume) / period.volume)
          }

          getCsvWriter(s).writeRecords([row])
              .then(() => {
                  // console.log('Written ' + s.options.lookback_periods + ' periods')
                  cb()
              })
      } else {
          cb()
      }
  },

  onReport: function () {
    var cols = []
    return cols
  }
}
