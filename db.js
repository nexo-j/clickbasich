const admin = require('firebase-admin')

let serviceAccount

if (process.env.FIREBASE_SERVICE_ACCOUNT) {
  serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
} else {
  serviceAccount = require('./click-1554562120566-firebase-adminsdk-da56t-7617176fb3.json')
}


const Sentry = require('./sentry')

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://click-1554562120566.firebaseio.com'
})
const firestore = admin.firestore()

var db = {
  SimulatorVariables: [
    {
      MARGEN: 0,
      C_FIJO_DE_PRODUCCION: 0,
      C_FIJO_DE_VENTA: 0,
      C_FIJO_DE_VENTA_MARCO_GRANDE: 0,
      area_marco_grande: 0,
      margen_produccion: 0,
      impresion_cm2: 0,
      IVA: 0.19,
      paspartuWidths: '0,3,5,7',
      debug: true,
      photoWallDiscount: 0.1,
      fondo: 1
    }
  ]
}
const collections = ['Frames', 'Paspartus', 'Acrilics', 'SimulatorVariables', 'Backgrounds', 'FrameCategories', 'SimulatorTexts']
collections.forEach(collection => {
  const query = firestore.collection(collection)
  const observer = query.onSnapshot(querySnapshot => {
    db[collection] = []
    querySnapshot.forEach(doc => {
      db[collection].push(doc.data())
    })
  }, err => {
    console.log(`Encountered error: ${err}`)
    Sentry.captureException(err)
  }
  )
})

module.exports = db
