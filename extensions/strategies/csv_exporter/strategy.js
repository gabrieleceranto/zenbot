const util = require('util')

const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const csvWriter = createCsvWriter({
  path: 'csv-exporter.csv',
  header: [
    {id: 'period_id', title: 'period_id'},
    {id: 'size', title: 'size'},
    {id: 'time', title: 'time'},
    {id: 'open', title: 'open'},
    {id: 'high', title: 'high'},
    {id: 'low', title: 'low'},
    {id: 'close', title: 'close'},
    {id: 'volume', title: 'volume'},
    {id: 'close_time', title: 'close_time'},
    {id: 'latest_trade_time', title: 'latest_trade_time'},
    {id: 'last_try_trade', title: 'last_try_trade'},
  ]
});

/*
period:
   { period_id: '5m5238592',
     size: '5m',
     time: 1571577600000,
     open: 7147,
     high: 7147.7,
     low: 7140.2,
     close: 7140.2,
     volume: 9.263789180000002,
     close_time: 1571577899999,
     latest_trade_time: 1571577838989,
     last_try_trade: 1609872123573 }
*/

module.exports = {
  name: 'csv_exporter',
  description: 'Just do nothing. Exports on CSV.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '30m')
    this.option('period_length', 'period length, same as --period', String, '30m')
  },

  calculate: function (s) {
    // Do nothing
  },

  onPeriod: function (s, cb) {
      csvWriter.writeRecords([s.period])
          .then(() => {
              console.log('Written period ' + s.period.period_id)
              cb()
          })
  },

  onReport: function () {
    var cols = []
    return cols
  }
}
