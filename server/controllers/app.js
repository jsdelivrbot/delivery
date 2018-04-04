const mongoURL = 'mongodb://Anna2:Aa12345@ds247078.mlab.com:47078/delivery';
var cron = require('node-cron');
var CronJob = require('cron').CronJob;
var mongoose = require("mongoose");
var mongooseSchema = require('./schema');
var Promise = require('promise');
var _ = require('lodash');
var ordersDelivery  = require('../controllers/calculateOrdersDelivery');

module.exports = (app) => {
    mongoose.connect(mongoURL);
    var Cars = mongoose.model("Cars", mongooseSchema.carScheme);
    var Order = mongoose.model("Order",mongooseSchema.orderScheme,"order");

    //add new car 
    app.put('/car', (request, response)=>{
      console.log("here");
      var car = new Cars({});
      car.save((err)=>{
        if(err)
         return console.log(err);
        console.log("Saved");
      });
      response.send("Success");
    });

    app.delete('/car/:id', (req, res)=> {
      carDelete(req.params.id)
      .then(()=>{
        res.send("Success");
      })
    });
    
    function carDelete(carId){  
      return  Cars.remove({"_id":carId});
    }

    //update after change value of checkBox
    app.put('/car/:id', (req, res)=> {   
      return Cars.findById(req.params.id)
      .then((car)=>{
        var availableDate = new Date(Date.now());
        if(car.endTime){
          availableDate = car.endTime;
        }
        return Cars.update({"_id":car._id}, { $set: { active: !car.active,availableTime:availableDate }},{new:true})
      })
      .then(()=>{
        return Promise.resolve(ordersDelivery.recalculateAllOrdersQueue());
      })
      .then(()=>{
        res.send("Success");
      })
    });

    app.get('/data', (req, res)=> {
      return getCars()
      .then(data=>{
        res.send(data);
      })
    });

    function getCars(){
      return Cars.find();
    }
    
    app.get('/orders/:status',(req, res)=> {
      console.log("status",req.params.status);
      return getOrders(req.params.status)
      .then(data=>{
          res.send(data);
      })
    })

    function getOrders(status){
      if(status==='all'){
        return Order.find();
      }
      return Order.find({status:status});
    }


    function sendCar(orderId,carId){
      let finishTime;     
      return Promise.all([
        getDeliveryTimeForOrder(orderId),
        ordersDelivery.getStartAndEndPointsOfOrder(orderId)
      ])
      .then(data=>{
        finishTime=data[0];
        point = data[1][1];
       return Cars.findOneAndUpdate({"_id":carId},{ $set: { orderId: orderId,status:"is busy",endTime: finishTime,departure_point:point} },{new:true});
      })
      .then(car =>{ 
        if(!car){
          return;
        }
        return carOnTheWay(finishTime, car, orderId);
      })
    }

    function getDeliveryTimeForOrder(orderId){
      return Order.findById(orderId)
      .then(order => new Date(+Date.now()+Number(order.time.value)*1000))
    }

    function carOnTheWay(finishTime, car,orderId) {
      return Order.findOneAndUpdate({"_id":  orderId}, { "status": 'on the way'})
      .then(order=>{       
        var job = new CronJob(finishTime,()=> {
         console.log('here');
          return Promise.all([
            Order.findOneAndUpdate({ "_id": order._id }, { $set: { status: 'delivered', arrivalDate: Date.now() } }, { new: true }),
            Cars.findOneAndUpdate({ "_id": car._id }, { 
              $set: { orderId: null, status: "available", endTime: null },
              $pop: { nextOrders: -1 }
            }, { new: true })
          ]);
        },null,false,'Europe/Kiev');
        console.log("1");
        job.start();
      })
    }

    function takeNewOrders(){
      return Order.find({arrivalDate:null})
      .then(orders=>{
        return _.take(_.sortBy(orders, ['date']),10);
      })
    }
    
    // cron.schedule('* * * * *', ()=>{
    //   console.log('running a task every minute');
    //   return Cars.find({$and:[{status: "available"},{active:true}]})
    //   .then(cars=> { 
    //     let value = true;
    //     cars.forEach(car => {
    //       if(car.nextOrders.length>0){
    //         sendCar(car.nextOrders[0],car._id);
    //       }
    //       else{
    //         if(value){
    //           value = false;
    //           console.log("set estimete for new orders")
    //           takeNewOrders()
    //           .then(orders=>{
    //             return ordersDelivery.setEstimateForNewOrders(orders,[]);
    //           })
    //         }
    //       }
    //     });      
    //   });
    // });

    function getEstimateForOrder(orderId){
      return Order.findOne({"_id":orderId})
      .then(order=>{
        return order.arrivalDate;
      })
    }
    
    function getAllOrdersId(){
      return Order.find().map(i => i._id);
    }
    
    function getEstimateForOrders(ordersId){
      return new Promise(resolve=> {
        if(!ordersId){
          return getAllOrdersId()
          .then(resolve)
        }
        return resolve(ordersId);
      })
      .map(getEstimateForOrder); 
    }

    function getOrderStatus(orderId){
      return Order.findById(orderId)
      .then(order=> order.status)
    }

}

