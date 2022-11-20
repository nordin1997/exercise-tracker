const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
require('dotenv').config()

mongoose.connect(process.env.MONGO_URI,{ useNewUrlParser: true, useUnifiedTopology: true }).then(console.log('database connection successfull'))

const exerciseSchema = new mongoose.Schema({
  username:String,
  count: Number,
  log:[{
    description:{type:String, required:true},
    duration: {type:Number, required:true},
    date: String,
  }]
})

const Exercise = mongoose.model('Excercise',exerciseSchema)

app.use(cors())
app.use(bodyParser.urlencoded({extended: false}))
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/users', function (req,res){
  Exercise.create({username: req.body.username}, (err,data)=>{
    res.json({username: data.username, _id: data._id})
  })
})

app.get('/api/users', function (req,res) {
  Exercise.find({},"username _id",(err,data)=>{
    res.json(data)
  })
})

app.post('/api/users/:_id/exercises', function (req,res){            Exercise.findById({_id:req.params._id},(err,data)=>{
    data.log.push({description:req.body.description,duration:req.body.duration,date:   
    req.body.date?new Date(req.body.date).toDateString():new Date().toDateString()})
     data.count = data.log.length
     data.save()
  let newData = {username: data.username,
                 _id:data._id,
                 description: data.log[data.log.length-1].description,
                 duration:data.log[data.log.length-1].duration,
                 date:data.log[data.log.length-1].date}
  res.json(newData)
  })
  })

app.get('/api/users/:_id/logs',function (req,res) {
  console.log("query",req.query)
  // const {from,to,limit}=req.query
  function compareDates(date){
   return new Date(date.date).getTime()>=new Date(req.query.from).getTime() && new Date(date.date).getTime()<= new Date (req.query.to).getTime();
  }
  Exercise.findById({_id:req.params._id},function (error,data) {
    if (error) return console.log(error);
    console.log(data)
    // let newData = {username: data.username,
    //              _id:data._id,
    //              count: data.count,
    //              log: !req.query.from || !req.query.limit?
    //                data.log:data.log.filter(compareDates).slice(0, req.query.limit?req.query.limit:data.log.length),
    //                ...(req.query.from) && {from: new Date(req.query.from).toDateString()},
    //                ...(req.query.to) && {to: new Date(req.query.to).toDateString()}
    //               }
    let newData = {
  username: data.username,
  _id: data._id,
  count: data.count,
  log: !req.query.from&&!req.query.to&&!req.query.limit? data.log : !req.query.limit&&!req.query.from&&!req.query.to?data.log.filter(compareDates).slice(0,req.query.limit):data.log.slice(0,req.query.limit),
  ...(req.query.from) && { from: new Date(req.query.from).toDateString() },
  ...(req.query.to) && { to: new Date(req.query.to).toDateString() }
}
    console.log(req.query.limit)
    console.log(newData)
  res.json(newData)
  })
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
