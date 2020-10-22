'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
mongoose.connect(process.env.DB_URI, {useNewUrlParser:true, useUnifiedTopology:true});

let urlSchema = new mongoose.Schema({
  original: {type:String, required:true},
  short: Number,
});

let url  = mongoose.model('url', urlSchema)

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({extended:false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

let response = {};
const MATCH_REGEX = /^(?:https?:)?(?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n]+)/im;

app.post("/api/shorturl/new", (req, res) => {
  let requestUrl = req.body["url"];
  dns.lookup(requestUrl.match(MATCH_REGEX)[1], (err, address, family) => {
    if (err) {
      res.json({"error":"invalid URL"});
    } else {
      response['original_url'] = req.body['url'];
      let shortUrl = 1;
      url.findOne({})
        .sort({short: 'desc'})
        .exec((err, result) => {
        if (!err && result != undefined) {
          shortUrl = result.short + 1;
        }
        if (!err) {
          url.findOneAndUpdate(
            {original:req.body['url']},
            {original:req.body['url'], short: shortUrl},
            {new:true, upsert:true},
            (err, savedUrl) => {
              if (!err) {
                response["short_url"] = savedUrl.short;
                res.json(response);
              }
            }
          )
        }
      });
    }
  })
});

app.get("/api/shorturl/:id", (req, res) => {
  url.findOne({short:req.params.id}, (err, result) => {
    if (!err && result != undefined) {
      res.redirect(result.original);
    } else {
      res.send("Not Found");
    }
  })
})

app.listen(port, function () {
  console.log('Node.js listening ...');
});