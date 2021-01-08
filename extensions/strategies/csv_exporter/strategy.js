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
    let headers = []
    for (let i = 0; i < lookbackPeriods; ++i) {
        headers.push('period_id' + i)
        headers.push('size' + i)
        headers.push('time' + i)
        headers.push('open' + i)
        headers.push('high' + i)
        headers.push('low' + i)
        headers.push('close' + i)
        headers.push('volume' + i)
        headers.push('close_time' + i)
        headers.push('latest_trade_time' + i)
        headers.push('last_try_trade' + i)
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
  },

  calculate: function (s) {
    // Do nothing
  },

  onPeriod: function (s, cb) {
      // console.log(util.inspect(s, {showHidden: false, depth: null}))
      if (s.lookback && s.lookback.length >= s.options.lookback_periods) {
          let row = []
          s.lookback.slice(0, s.options.lookback_periods).forEach((period) => {
              row.push(period.period_id)
              row.push(period.size)
              row.push(period.time)
              row.push(period.open)
              row.push(period.high)
              row.push(period.low)
              row.push(period.close)
              row.push(period.volume)
              row.push(period.close_time)
              row.push(period.latest_trade_time)
              row.push(period.last_try_trade)
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
