const express = require("express")
const ccxt = require('ccxt');
const stochasticRSI = require('trading-indicator').stochasticrsi
const macd = require('trading-indicator').macd
const bb = require('trading-indicator').bb

const app = express()
const port = process.env.PORT || 8000

const binance = new ccxt.binance({
  apiKey : 'uPXWfCQpHqDIyxQ5wrWE5QExDmOVU1rmLyCFbwxnzdCm00ess88idKUeKQ7CbjEk',
  secret : 'trayW0HUXruRx8Dmq3cpYs5ZIujwTUdnwPAUc1qXHYnqWTU4Eo6TEhtsdRVwQ7vg',
  enableRateLimit: true,
  options:{
    adjustForTimeDifference: true
  },
})

const binanceFuture = new ccxt.binance({
  apiKey : 'uPXWfCQpHqDIyxQ5wrWE5QExDmOVU1rmLyCFbwxnzdCm00ess88idKUeKQ7CbjEk',
  secret : 'trayW0HUXruRx8Dmq3cpYs5ZIujwTUdnwPAUc1qXHYnqWTU4Eo6TEhtsdRVwQ7vg',
  enableRateLimit: true,
  options:{
    adjustForTimeDifference: true,
    defaultType: 'future'
  },
})

const timeframe = '15m'
const symbol = 'DOT/USDT'
let isPositionOpen = false
let positionHistory = []
let position = []



const openPosition = async (signal, closePrice, timestamp)=>{

  let pos = {
    type: String,
    price: Number,
    timestamp: String
  }

  try {
    if(signal == 1 && isPositionOpen == false){
      pos.type = 'BUY'
      pos.price = closePrice
      pos.timestamp = timestamp
      position.push(pos)
      isPositionOpen = true
      console.log(position)
    }else if(signal == -1 && isPositionOpen == true && position[0]?.type == 'BUY'){
      isPositionOpen = false
      position = []
      console.log(`CLOSED at ${closePrice} ${timestamp}`)
    }else if(signal == -1 && isPositionOpen == false){
      pos.type = 'SELL'
      pos.price = closePrice
      pos.timestamp = timestamp
      position.push(pos)
      isPositionOpen = true
      console.log(position)
    }else if(signal == 1 && isPositionOpen == true && position[0]?.type == 'SELL'){
      isPositionOpen = false
      position = []
      console.log(`CLOSED at ${closePrice} ${timestamp}`)
    }else{
      return
    }

    return pos

  } catch (error) {
    throw error
  }
}

const stochasticSignal = async (srsi)=>{
      let value = srsi[srsi.length - 2]
      let signal = 0

      if(value.k < 40 && value.d < 40 && value.k > value.d){
        if(signal != 1){
          signal = 1
        }else{
          signal=0
        }
      }else if(value.k > 60 && value.d > 60 && value.k < value.d){
        if(signal != -1){
          signal = -1
        }else{
          signal=0
        }
      }else{
        signal = 0
      }
      
      return signal
    }

const macdSignal = async (_macd)=>{
  let signal = 0

  let histogram = _macd[_macd.length - 1].histogram


  if(histogram < 0){
    if(signal != 1){
      signal = 1
    }else{
      signal = 0
    }
  }else if(histogram > 0){
    if(signal != -1){
      signal = -1
    }else{
      signal = 0
    }
  }else{
    signal = 0
  }
  
  return signal
}

const bollingerBand = async (bb,price) =>{
  const upper = bb[bb.length - 1].upper
  const middle = bb[bb.length - 1].middle
  const lower = bb[bb.length - 1].lower

  let signal = 0

  if(price >= upper){
    if(signal!= -1){
      signal = -1
    }else{
      signal = 0
    }
  }else if(price <= lower){
    if(signal != 1){
      signal = 1
    }else{
      signal = 0
    }
  }else{
    signal = 0
  }
  return signal
}


const test = async ()=>{
  try {
    const x = await binanceFuture.fetchTicker(symbol)
    let y = {}
    
    const _srsi = await stochasticRSI(3,3,14,14,"close","binance",symbol,timeframe,true,)
    const _srsiSignal = await stochasticSignal(_srsi)

    const _macd = await macd(12,26, 9,"close","binance",symbol,timeframe,true,);
    const _macdSignal = await macdSignal(_macd)

    const _bb = await bb(50, 2, "close", "binance", symbol, timeframe, true);
    const _bbSignal = await bollingerBand(_bb, x.last)

    y.symbol = `${symbol} ${timeframe}`
    y.stochasticRSI = _srsiSignal
    y.bb = _bbSignal
    y.macd = _macdSignal
    y.price = x.last
    y.timestamp = x.datetime

    console.log(y)

  } catch (error) {
    throw error
  }
}

// setInterval(() => {
//   test()
// }, 2000);

const {bollingerbands} = require('technicalindicators')
var period = 14

var input = {
period : period, 
values : [48.16,48.61,48.75,48.63,48.74,49.03,49.07,49.32,49.91,50.13,49.53,49.50,49.75,50.03,50.31,50.52,50.41,49.34,49.37,50.23,49.24,49.93,48.43,48.18,46.57,45.41,47.77,47.72,48.62,47.85] ,
stdDev : 2
    
}

console.log(bollingerbands(input))

app.listen(port, ()=> console.log('Server running'))

  

