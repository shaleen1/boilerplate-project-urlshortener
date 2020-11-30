require("dotenv").config();
const express = require("express");
const cors = require("cors");
const app = express();
const bodyParser = require("body-parser");
var mongoose = require("mongoose");
var dns = require("dns");
const crypto = require("crypto");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});
console.log(mongoose.connection.readyState);

// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use("/public", express.static(`${process.cwd()}/public`));

app.use(bodyParser.urlencoded({ extended: false }));

app.get("/", function(req, res) {
  res.sendFile(process.cwd() + "/views/index.html");
});

var urlSchema = new mongoose.Schema({
  url: String,
  shortUrl: String
});
var Url = mongoose.model("Url", urlSchema);

app.post(
  "/api/shorturl/new",
  async function(req, res, next) {
    console.log("FUNCTION 1");
    var url = req.body.url;

    console.log("CHECKING FOR MATCHES...");
    var matchesFound = await Url.find({ url: url });

    if (matchesFound.length > 0) {
      console.log("MATCHES FOUND FOR URL");
      res.json(matchesFound[0]);
      return;
    } else {
      console.log("NO MATCHES FOUND; PROCEED");
      next();
    }
  },
  function(req, res, next) {
    console.log("FUNCTION 2");
    var url = req.body.url;

    console.log("URL: ", url);
    var httpRegex = /^(https?:\/\/)/;
    if (!httpRegex.test(url)) {
      console.log("NO HTTP/HTTPS");
      res.json({ error: "invalid url" });
      return;
    }
    if (/^(https:\/\/)/.test(url)) {
      console.log("CASE: HTTPS");
      var httpsDroppedUrl = url.slice(8);
      console.log("HTTPS DROPPED: ", httpsDroppedUrl);
      dns.lookup(httpsDroppedUrl, function(err, address, family) {
        console.log("ADDRESS: %j FAMILY: IPv%s", address, family);
        if (address == undefined) {
          console.log("INVALID HTTPS URL");
          res.json({ error: "invalid url" });
          return;
        }
        console.log("HTTPS: GOOD TO GO");
        next();
      });
    } else {
      console.log("CASE: HTTP");
      var httpDroppedUrl = url.slice(7);
      console.log("HTTP DROPPED: ", httpDroppedUrl);
      dns.lookup(httpDroppedUrl, function(err, address, family) {
        console.log("ADDRESS: %j FAMILY: IPv%s", address, family);
        if (address == undefined) {
          console.log("INVALID HTTP URL");
          res.json({ error: "invalid url" });
          return;
        }
        console.log("HTTP: GOOD TO GO");
        next();
      });
    }
  },
  function(req, res) {
    console.log("FUNCTION 3");
    var url = req.body.url;

    var newUrl =
      (Math.floor(Math.sqrt(url.length)) * 3).toString() +
      +Math.floor(Math.random() * 9999).toString() +
      Math.floor(Math.random() * 500).toString(); //random method to generate unique identifier
    console.log("SHORT URL GENERATED: ", newUrl);

    var data = new Url({
      url: url,
      shortUrl: newUrl
    });

    data.save(function(err) {
      if (err) {
        console.log("ERROR SAVING URL");
        res.send("Error; please try again");
        return;
      }
    });
    console.log("NO ERROR SAVING URL");
    res.json(data);
  }
);

app.get("/api/shorturl/:shortUrl", async function(req, res) {
  var shortUrl = req.params.shortUrl;

  console.log("FUNCTION 1");
  console.log("SHORT URL REQUESTED: ", shortUrl);

  console.log("CHECKING FOR MATCHES...");
  var matchesFound = await Url.find({ shortUrl: shortUrl });

  if (matchesFound.length > 0) {
    console.log("MATCHES FOUND FOR SHORTURL");
    var url = matchesFound[0]['url'];
    res.redirect(url); 
    console.log("REDIRECTED")
    return;
  } else {
    console.log("NO MATCHES FOUND");
    res.json({ error: "invalid url" });
    return;
  }
});







// Your first API endpoint
app.get("/api/hello", function(req, res) {
  res.json({ greeting: "hello API" });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});
