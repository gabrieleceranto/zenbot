const util = require('util')
const request = require('request')

const PREDICTOR_ENDPOINT = 'http://192.168.0.46:5555'


module.exports = {
  name: 'external_predictor',
  description: 'Use an external predictor.',

  getOptions: function () {
    this.option('period', 'period length, same as --period_length', String, '5m')
    this.option('period_length', 'period length, same as --period', String, '5m')
    // For any reason, periods > 54 are valorized null by Zenbot
    this.option('lookback_periods', 'min. number of history periods', Number, 54)
  },

  calculate: function (s) {
    // Do nothing
  },

  onPeriod: function (s, cb) {
      // console.log(util.inspect(s, {showHidden: false, depth: null}))
      if (s.lookback && s.lookback.length >= s.options.lookback_periods) {
          let params = {}
          params['open0'  ] = s.period.open
          params['high0'  ] = s.period.high
          params['low0'   ] = s.period.low
          params['close0' ] = s.period.close
          params['volume0'] = s.period.volume
          for (let i = 1; i < s.options.lookback_periods; ++i) {
              let period = s.lookback[i]

              // Calculate % increase/decrease compared to the current value
              params['open'   + i] = ((s.period.open   - period.open  ) / period.open  )
              params['high'   + i] = ((s.period.high   - period.high  ) / period.high  )
              params['low'    + i] = ((s.period.low    - period.low   ) / period.low   )
              params['close'  + i] = ((s.period.close  - period.close ) / period.close )
              params['volume' + i] = ((s.period.volume - period.volume) / period.volume)
          }

          request.post(
              PREDICTOR_ENDPOINT,
              {json: params},
              (error, res, body) => {
                  if (error) {
                      console.error(error)
                      cb()
                      return
                  }

                  if (res.statusCode == 200) {
                      s.signal = body.result ? 'buy' : 'sell'
                  } else {
                      console.log(`statusCode: ${res.statusCode}`)
                      console.log(body)
                  }

                  cb()
              }
          )
      } else {
          cb()
      }
  },

  onReport: function () {
    var cols = []
    return cols
  }
}
