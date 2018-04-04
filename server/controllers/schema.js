var mongoose = require("mongoose");
var Schema = mongoose.Schema;
mongoose.Promise = global.Promise;
var orderScheme = new Schema({
  departure_point: {
      lat: {
        type: Number,
        required: true
      },
      lng: {
        type: Number,
        required: true
      },
      address: String
  },
  arrival_point: {
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    address: String
  },
  time: {
    text:  String,
    value: Number
  },
  distance: {
    text:  String,
    value: Number
  },
  price: Number,
  date:Date,
  arrivalDate: { type: Date, default: null },
  email: {
    type: String,
    required: true
  },
  status:{
    type: String,
    enum: ['in the store', 'on the way','delivered']},
  items: [
      {
          name: {
            type: String,
            required: true
          },
          weight: { type: Number, default: 1 },
      }
  ],
  emailSent:{type:Boolean,default:false   }
})
  
  var carScheme = new Schema({
    status:{
      type: String,
      enum: ['is busy', 'available'],
      default: 'available'},
    capacity:{ type: Number, default: 1 },
    orderId:{ type: String, default: null },
    endTime:{ type: Date, default: null },
    availableTime:{type: Date, default: Date.now()},
    active:{type:Boolean, default: false},
    nextOrders: {type:Array, default:[]},
    departure_point: {
      lat: { type: String, default: "51.066104098755986" },
      lng: { type: String, default: "24.756574630737305" },
      address: { type: String, default: "Т0311, Volyns'ka oblast, Ukraine" },
    },
    possible_arrival_point: {
      lat: String,
      lng: String,
      address: String
    }
  })


  module.exports={orderScheme,carScheme}