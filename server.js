require('dotenv').config()
const Sentry = require('./sentry')
var express = require('express')
var app = express()
var port = process.env.PORT || 8080
var bodyParser = require('body-parser')
var api = require('./api')
var db = require('./db')
var notion = require ('./notion')
const ShopifyAPI = require('shopify-node-api')

console.log(db)

// imageGenerator.generateFromDirectory('./public/images/backgrounds/');

// The request handler must be the first middleware on the app
app.use(Sentry.Handlers.requestHandler())

// Enforce https
function requireHTTPS (req, res, next) {
  // The 'x-forwarded-proto' check is for Heroku
  if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== 'development') {
    return res.redirect('https://' + req.get('host') + req.url)
  }
  next()
}
console.log(process.env.NODE_ENV)
if (process.env.NODE_ENV !== 'development') {
  app.use(requireHTTPS)
}

// Run Notion check
notion();

// parse application/json and look for raw text
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.text())
app.use(bodyParser.json({ type: 'application/json' }))

// configure our app to handle CORS requests
app.use(function (req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST')
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type, Authorization')
  next()
})

// Static files
app.use(express.static(__dirname + '/public'))

app.get('/debug-sentry', function mainHandler (req, res) {
  throw new Error('My first Sentry error!')
})

app.route('/product')
  .post(function (req, res) {
    if (req.body.priceParams == null || req.body.productParams == null) {
      res.json({ error: 'Missing priceParams or productParams.' })
      Sentry.captureException(new Error('Missing priceParams or productParams.'))
      return
    }
    if (req.body.weightParams == null) {
      res.json({ error: 'Missing weightParams' })
      return
    }
    api.calculatePrice(req.body, (err, priceObj) => {
      if (err) {
        console.error(err)
        Sentry.captureException(err)
      }
      req.body.productParams.product.variants[0].price = priceObj.precio
      api.calculateWeight(req.body, (weightObj) => {
        req.body.productParams.product.variants[0].grams = weightObj.weight
        console.log(req.body.productParams)
        api.postProduct(req.body.productParams, (err, data) => {
          if (err) {
            console.log(err)
            Sentry.captureException(err)
          }
          console.log(res.json(data))
        })
      })
    })
  })

// Get the metafield width and height
app.route('/dimensions/:productId')
  .get(function (req, res) {
    api.getDimensions(req.params.productId, (response) => {
      res.json(response)
    })
  })

// Get the imageURL for a product ID
app.route('/imageurl/:productId')
  .get(function (req, res) {
    api.getImageUrl(req.params.productId, (err, response) => {
      if (err) {
        console.error(err)
        Sentry.captureException(err)
      }
      res.json(response)
    })
  })

// Get the imageURL for a product ID
app.route('/inventory')
  .get(function (req, res) {
    const inventory = {
      frames: db.Frames || [],
      paspartus: db.Paspartus || [],
      paspartuWidths: (db.SimulatorVariables[0] || {}).paspartuWidths || '',
      acrilics: db.Acrilics || [],
      backgrounds: db.Backgrounds || [],
      frameCategories: (db.FrameCategories || [])
        .slice()
        .sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0)),
      simulatorTexts: (db.SimulatorTexts || [])
        .filter(t => t.active !== false)
        .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
    }
    res.json(inventory)
  })

// Get the name for a product ID
app.route('/name/:productId')
  .get(function (req, res) {
    api.getName(req.params.productId, (err, response) => {
      if (err) {
        console.error(err)
        Sentry.captureException(err)
      }
      res.json(response)
    })
  })

// Calculate the price
app.route('/calculateprice')
  .post(function (req, res) {
    api.calculatePrice(req.body, (err, response) => {
      if (err) {
        console.error(err)
        Sentry.captureException(err)
      }
      res.json(response)
    })
  })

// Calculate the weight
app.route('/calculateWeight')
  .post(function (req, res) {
    api.calculateWeight(req.body, (response) => {
      res.json(response)
    })
  })
// Generate Production Orders
app.route('/ordenDeProduccion')
  .post(function (req, res) {
    api.orderPaid(req.body, function (err, data) {
      if (err) {
        Sentry.captureException(err)
        return err
      } else {
        res.json(data)
      }
    })
  })

// Sign up email for alert
app.route('/backInStockSignUp')
  .post(function (req, res) {
    api.alertSignUp(req.body, function (err, data) {
      if (err) {
        Sentry.captureException(err)
        return err
      } else {
        console.log(data)
        res.json(data)
      }
    })
  })

  // Post products
app.route('/suscripcion/new')
.post(async function (req, res) {
  // {
  //   email: 'email',
  //   name: 'name',
  //   description: 'asdfsdf',
  //   img: './asdfasdf/asdf.png',
  //   marcos: [
  //     {
  //       name: 'a',
  //       description: 'a',
  //       price: '2',
  //       img: '../images/upload.png'
  //     },
  //     {
  //       name: 'b',
  //       description: 'b',
  //       price: '3',
  //       img: '../images/upload.png'
  //     }
  //   ]
  // }
  const collection = await api.createCollection(req.body)
  res.json(collection)
})

// The error handler must be before any other error middleware and after all controllers
app.use(Sentry.Handlers.errorHandler())

app.listen(port)
console.log('App listening on port ' + port)
