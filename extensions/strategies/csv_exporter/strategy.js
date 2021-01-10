// const util = require('util')
const path = require('path')

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
    let headers = ['target', 'period_id', 'size', 'time']
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

          // Set to 1 (buy) when all the future periods are greater than the current value
          // Pretty raw check, but it's a beginning..
          let greaterPeriods = futurePeriods.filter(e => e.close >= (currentValue*.99))
          let outcome = greaterPeriods.length >= (s.options.lookforward_periods * .8);

          // console.log(currentValue, outcome)

          let row = [outcome|0]
          row.push(s.period.period_id)
          row.push(s.period.size)
          row.push(s.period.time)
          historyPeriods.forEach((period) => {
              row.push(period.open)
              row.push(period.high)
              row.push(period.low)
              row.push(period.close)
              row.push(period.volume)
          })
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
