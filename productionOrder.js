const PDFDocument = require('pdfkit')
const Sentry = require('./sentry')
const fs = require('fs')
var ShopifyAPI = require('shopify-node-api')
var Holidays = require('date-holidays')
var hd = new Holidays()
var fetch = require('node-fetch')
const util = require('util')
const stream = require('stream')
const { page } = require('pdfkit')
const BinPacking3D = require('binpackingjs').BP3D
var { Item, Bin, Packer } = BinPacking3D
const nodemailer = require("nodemailer");


Bin.prototype.getPackedVolume = function () {
  let packedVolume = 0
  this.items.forEach(item => { packedVolume += item.getVolume() })
  return packedVolume
}

Bin.prototype.getRemainingVolume = function () {
  return this.getVolume() - this.getPackedVolume()
}

const finished = util.promisify(stream.finished)

// require('isomorphic-fetch'); // or another library of choice.
var Dropbox = require('dropbox').Dropbox

var dbx = new Dropbox({ accessToken: 'oK83n37MsKAAAAAAAALuokN40SYyddE89uk_Wx4Ht0C0Z75y0N0FpaMhYqwKNT4s', fetch: fetch }) // Alejandro's Dropbox for production
// var dbx = new Dropbox({ accessToken: 'p6c1u_db1TgAAAAAAAAnlNosApad-tx0BLcU95gUrYHNCKEn9OXxCUH9LWBj3m64', fetch: fetch }) // Pablo's dropbox for testing

hd.init('CO')

const Shopify = new ShopifyAPI({
  shop: 'viumarqueteria', // MYSHOP.myshopify.com
  shopify_api_key: '396551abcfff904e353a6d706a706869', // Your API key
  access_token: '0e7d5ae8b3b6a7b69e709ca4c037f955' // Your API password
})

/**
   * Get Product metafield. Each metafield is a marco
   * @param {integer} id
   */
function getMetafields (id) {
  return new Promise((resolve, reject) => {
    Shopify.get('/admin/products/' + id + '/metafields.json', (err, data, headers) => {
      if (err) {
        reject(err)
      }
      resolve(data.metafields)
    })
  })
}

Date.prototype.isWeekend = function () {
  if (this.getDay() === 0 || this.getDay() === 6) return true
  return false
}

function sumWorkingDays (startDate, numDays) {
  while (numDays > 0) {
    while (startDate.isWeekend() || hd.isHoliday(startDate)) {
      startDate.setDate(startDate.getDate() + 1)
    }
    startDate.setDate(startDate.getDate() + 1)
    numDays -= 1
  }
  return startDate
}

function getProductImages (productId) {
  console.log(` --- Get Product Images for ${productId} ---- `)
  return new Promise(function (resolve, reject) {
    Shopify.get('/admin/api/2024-01/products/' + productId + '/images.json',
      function (err, data, headers) {
        if (err) {
          reject(err)
        }
        resolve(data.images)
      })
  })
}

function getOrders (fromTime) {
  console.log('--- Get Orders ---')
  return new Promise(function (resolve, reject) {
    Shopify.get('/admin/api/2024-01/orders.json?fields=customer,name,line_items,note_attributes,shipping_address,financial_status,id,created_at,note&updated_at_min=' + fromTime.toISOString(),
      function (err, data, headers) {
        if (err) {
          reject(err)
        }
        resolve(data.orders)
      })
  })
}

function getImageBase64 (url) {
  return new Promise(function (resolve, reject) {
    fetch(url)
      .then(res => res.buffer())
      .then(buffer => {
        resolve(buffer)
      })
      .catch(e => reject(e))
  })
}

function materialFondo (paspartu, area) {
  if (paspartu === 'transparent' || paspartu === 'Acrilico') return 'Acrilico'
  if (area < 2400) return 'MDF'
  return 'Espuma'
}
/**
 * Caluclates Box. Assumes Y bigger than X
 * @param {Array} marcos each marco has an array of dimensions i.e [ [ 15,30,5],...]
 */
function calculateBox (marcos) {
  const margin = {
    x: 4, // 4cm of margin both right and left
    y: 4, // 4cm of margin both top and down
    z: 0 // No margin height
  }
  const boxes = {
    Fedex: [33, 27, 6],
    A: [55, 40, 8],
    B: [73, 58, 8],
    'B Gorda': [73, 58, 20],
    C: [90, 70, 8],
    'C oversize': [90, 90, 8],
    D: [120, 85, 6]
  }
  // Bin packer library
  var bins = []
  var items = []
  var result = []
  // Convert Marcos to Items and sort largest to smallest
  marcos.forEach((marco) => items.push(new Item(`${marco[0]}x${marco[1]}x${marco[2]} - ${Math.random() * 100}`, marco[0] + margin.x * 2, marco[1] + margin.y * 2, marco[2] + margin.z * 2, 1)))
  items.sort((a, b) => b.getVolume() - a.getVolume())
  // Convert Boxes to Bins and sort largest to smallest
  for (var box in boxes) {
    bins.push(new Bin(box, boxes[box][0], boxes[box][1], boxes[box][2], 1000))
  }
  // Check for Items larger than any box
  var intialItems = items.length
  while (items.length > 0) {
    intialItems = items.length
    var packer = new Packer()
    var possibleBoxes = []
    for (var binIndex = 0; binIndex < bins.length; binIndex++) {
      packer = new Packer()
      items.forEach(item => packer.addItem(item))
      bins[binIndex].items = []
      packer.addBin(bins[binIndex])
      packer.pack()
      if (packer.items.length === 0 && packer.unfitItems.length === 0) {
        possibleBoxes.push(bins[binIndex])
      }
    }
    // All fits into one box
    if (possibleBoxes.length > 0) {
      result.push(possibleBoxes.reduce((a, b) => {
        return a.getVolume() < b.getVolume() ? a : b
      }))
    } else { // Doesn't fit into one box, selected best box and filter packed items
      var binsWithItems = bins.filter((bin) => bin.getItems().length > 0)
      if (binsWithItems.length > 0) result.push({ ...binsWithItems.reduce((a, b) => a.items.length > b.items.length ? a : b) })
    }
    if (result.length > 0) {
      items = items.filter(item => {
        return result[result.length - 1].items.filter(resultItem => resultItem.name === item.name).length === 0
      })
    }
    if (items.length === 0) {
      if (result.reduce((a, b) => a + b.items.length, 0) !== marcos.length) throw Error("Number of items don't match with packaging: " + result.toString())
      return result
    }
    if (items.length === intialItems) {
      items.forEach(item => {
        var specialBox = new Bin('Caja Especial', item.height, item.width, item.depth, item.weight)
        specialBox.putItem(item, [0, 0, 0])
        result.push(specialBox)
      })
      if (result.reduce((a, b) => a + b.items.length, 0) !== marcos.length) throw Error("Number of items don't match with packaging: " + result.toString())
      return result
    }
  }
}

async function generatePDF (order) {
  var fileName = order.name + '.pdf'
  var orderId = order.name
  var numItems = order.line_items.reduce(function (prev, curr) {
    if (curr.title.startsWith('Marco')) return prev + curr.quantity
    if (curr.title.startsWith('Photo Wall')) return prev + curr.quantity * Number(curr.title.replace(/[^0-9]/g, ''))
    return prev
  }
  , 0)
  var name = order.customer.first_name + ' ' + order.customer.last_name
  var address = ''
  var city = ''
  var phone = ''
  if (order.hasOwnProperty('shipping_address')) {
    name = order.shipping_address.first_name + ' ' + order.shipping_address.last_name
    address = order.shipping_address.address1 + order.shipping_address.address2
    city = order.shipping_address.city
    phone = order.shipping_address.phone
  }
  if (order.line_items[0].hasOwnProperty('destination_location')) {
    address = order.line_items[0].destination_location.address1 + order.line_items[0].destination_location.address2
    city = order.line_items[0].destination_location.city
  }
  var createdAtDate = new Date(Date.parse(order.created_at))
  var purchaseDate = createdAtDate.toLocaleString('es-CO', { timeZone: 'America/Bogota' })
  var deliveryDeadline = sumWorkingDays(createdAtDate, 10).toLocaleString('es-CO', { timeZone: 'America/Bogota' }).split(',')[0]
  var note = order.note || ''
  var notes = order.note_attributes.length > 0 ? order.note_attributes[0].value : ''
  var products = order.line_items

  console.log('Creating pdf with name: ' + fileName)
  const doc = new PDFDocument({ size: [306.00, 792.00], margin: 18 })
  var pageNumber = 0
  if (!fs.existsSync('./temp/')) {
    fs.mkdirSync('./temp/')
  }
  var writeStream = fs.createWriteStream('./temp/' + fileName)
  doc.pipe(writeStream)
  doc.registerFont('Header', 'fonts/Montserrat-Bold.ttf')
  doc.registerFont('Regular', 'fonts/Montserrat-Regular.ttf')

  // Add header
  doc.on('pageAdded', () => {
    pageNumber++
    // let posx = doc.posx
    // let posy = doc.posy
    doc.font('Regular').text(`${orderId} Hoja: ${pageNumber}`, {
      align: 'right'
    })
    // doc.moveTo(posx, posy)
  })

  doc.font('Header').fontSize(20).text('Pedido: ' + orderId)
  doc.font('Regular').fontSize(11).text('Cantidad de cuadros en el pedido: ', { continued: true })
  doc.font('Header').text(`${numItems}`).moveDown(1)

  doc.font('Header').text('Datos del Envío:')
  if (order.hasOwnProperty('shipping_address') || order.line_items[0].hasOwnProperty('destination_location')) {
    doc.font('Regular').text('Nombre: ' + name)
    doc.text('Dirección: ' + address)
    doc.text('Ciudad: ' + city)
    doc.text('Teléfono: ' + phone).moveDown(2)
  } else {
    doc.font('Regular').text('Recogida en Tienda').moveDown(1)
  }

  doc.text('Fecha de compra: ' + purchaseDate)
  doc.text('Fecha limite de entrega: ', { continued: true })
  doc.font('Header').text(deliveryDeadline).moveDown(1)

  doc.font('Header').fillColor('red').text('Notas del Cliente/Producción: ')
  doc.font('Regular').text(note)
  doc.font('Regular').text(notes).moveDown(1)

  var marcos = []

  for (var productIndex = 0; productIndex < products.length; productIndex++) {
    doc.font('Header').fontSize(14).fillColor('black').text(`Producto ${productIndex + 1}:`)
    // Order through POS doesn't have productID metafields or any info
    if (!products[productIndex].product_id) {
      doc.font('Regular').text(products[productIndex].title)
      continue
    }
    // Jump if not marco
    if (!(products[productIndex].title.startsWith('Marco') || products[productIndex].title.startsWith('Photo Wall'))) {
      doc.font('Regular').text(products[productIndex].title)
      doc.font('Regular').text('Cantidad: ' + String(products[productIndex].quantity))
      continue
    }
    var metafields = await getMetafields(products[productIndex].product_id)
    Array.isArray(metafields) ? console.log(true) : new Error('Received wrong metafields')
    if (metafields.length < 1) throw Error('Error getting metafields - came empty')
    for (var i = 0; i < metafields.length; i++) {
      marcos.push(JSON.parse(metafields[i].value))
    }
    for (i = 0; i < marcos.length; i++) {
      var photoHeight = marcos[i].photo.alto
      var photoWidth = marcos[i].photo.ancho
      var height = marcos[i].photo.alto + 2 * marcos[i].paspartu.grosor
      var width = marcos[i].photo.ancho + 2 * marcos[i].paspartu.grosor
      if (marcos[i].paspartu.grosor > 0) {
        if (marcos[i].paspartu.color === 'transparent' || marcos[i].paspartu.color === 'Acrilico') {
          height += 1
          width += 1
        }
      }
      var marco = `${marcos[i].marco.material} ${marcos[i].marco.grosor}cm ${marcos[i].marco.code}`
      var paspartu = marcos[i].paspartu.grosor > 0 ? `${marcos[i].paspartu.color} ${marcos[i].paspartu.grosor}cm` : 'N/A'
      var fondo = materialFondo(marcos[i].paspartu.color, width * height)
      doc.font('Header').text('Medidas para producción:')
      doc.font('Regular').text('Marco: ', { continued: true })
      doc.font('Header').text(marco, { continued: false })
      doc.font('Header').text(`Alto: ${height}cm`)
      doc.font('Header').text(`Ancho: ${width}cm`)
      doc.font('Header').fontSize(11).text(`Cantidad: ${products[productIndex].quantity}`).moveDown(1)

      doc.font('Regular').text('Paspartú Visible: ', { continued: true }).font('Header').text(paspartu, { continued: false })
      doc.font('Regular').text('Frente: ', { continued: true }).font('Header').text(marcos[i].frente, { continued: false }).moveDown()
      doc.font('Regular').text('Fondo: ', { continued: true }).font('Header').text(fondo).moveDown(1)

      doc.font('Regular').fillColor('blue').text(`Alto del arte: ${photoHeight}cm`)
      doc.fillColor('blue').text(`Ancho del arte: ${photoWidth}cm`).moveDown(1)
      var images = products[productIndex].product_id ? await getProductImages(products[productIndex].product_id) : []
      if (marcos[i].photo.url) {
        await uploadFileFromURL(`/${order.name}-${i}.jpg`, marcos[i].photo.url, 3, 2000).catch(e => Sentry.captureException(e))
      }
      for (var ii = 0; ii < images.length; ii++) {
        doc.fillColor('black')
        doc.font('Regular').text('Impresion: ', { continued: true }).font('Header').text(marcos[i].photo.color, { continued: false }).moveDown(1)
        var image64 = await getImageBase64(images[ii].src)
        const docX = doc.x
        const docY = doc.y
        doc.image(image64, docX, docY, { height: 90 })
        doc.fillColor('gray').text('***** Completado ◻ *****')
        doc.fillColor('black')
        doc.moveTo(docX, docY + 100)
      }
    }
  }
  // Box part
  if (marcos.length > 0) {
    var dimensiones = []
    for (i = 0; i < marcos.length; i++) {
      const x = marcos[i].photo.ancho + 2 * marcos[i].paspartu.grosor + 0.5 * 2 + marcos[i].marco.grosor * 2
      const y = marcos[i].photo.alto + 2 * marcos[i].paspartu.grosor + 0.5 * 2 + marcos[i].marco.grosor * 2
      const z = 3
      dimensiones.push([x, y, z])
    }
    var boxes = calculateBox(dimensiones)
    for (i = 0; i < boxes.length; i++) {
      doc.font('Header').text('Tipo de Caja: ' + boxes[i].name + ': ', { continued: true })
      for (ii = 0; ii < boxes[i].items.length; ii++) {
        doc.font('Regular').text(boxes[i].items[ii].name.split('-')[0] + ' ', { continued: true })
      }
      doc.moveDown(0.5)
    }
  }
  doc.end()
  await finished(writeStream)
  return fileName
}

function printLatestOrders (minutes = 60) {
  console.log('Print latest Orders')
  var fromTime = new Date()
  var uploads = []
  fromTime.setMinutes(fromTime.getMinutes() - minutes)
  getOrders(fromTime)
    .then(async function (orders) {
      if (orders.length === 0) return 'No orders found'
      const filesMetadata = await getDropboxFiles()
      var existingOrders = []
      filesMetadata.map(fileMetadata => existingOrders.push(fileMetadata.name.split('.')[0]))
      for (var i = 0; i < orders.length; i++) {
        if (!existingOrders.includes(orders[i].name) && (orders[i].financial_status === 'paid' || orders[i].financial_status === 'pending')) {
          var pdf = await generatePDF(orders[i])
          if (pdf) {
            const upload = await uploadFile(pdf)
            uploads.push(upload)
          }
        }
      }
      return uploads
    }).catch((e) => Sentry.captureException(e))
}
/**
 *
 * @param {string} fileName filename inside ./temp/ folder
 */
function uploadFile (fileName) {
  return new Promise((resolve, reject) => {
    fs.readFile('./temp/' + fileName, function (err, file) {
      if (err) {
        reject(err)
      }
      dropboxUploadFile(file, fileName, { path: '/' + fileName, contents: file, mode: 'overwrite' }, 2, 2000, null)
        .then(resolve).catch((e) => reject(e))
    })
  })
}

function dropboxUploadFile (file, fileName, options, retry, delay, failedError) {
  console.log(`--------Uploading ${fileName} ------------`)
  return new Promise((resolve, reject) => {
    try {
      if (retry < 0 && failedError !== null) {
        reject(failedError)
      }
      dbx.filesUpload(options)
        .then(function (res) {
          console.log('--------Upload Succesful ------------')
          resolve(res)
        })
    } catch (e) {
      console.log('Failed to upload', e)
      if (e.status === 429) {
        console.log('Retrying Upload')
        setTimeout(function () {
          dropboxUploadFile(file, fileName, options, retry - 1, delay, e)
        }, delay)
      } else { reject(e) }
    }
  })
}

function uploadFileFromURL (path, url, retry, delay, failedError) {
  return new Promise((resolve, reject) => {
    try {
      if (retry < 0 && failedError !== null) {
        reject(failedError)
      }
      dbx.filesSaveUrl({ path: path, url: url })
        .then(function (res) {
          console.log('--------Submited Upload from URL ------------')
          resolve(res)
        })
    } catch (e) {
      setTimeout(uploadFileFromURL(path, url, retry - 1, delay, e), delay)
    }
  })
}

function getDropboxFiles () {
  return new Promise(function (resolve, reject) {
    dbx.filesListFolder({ path: '' })
      .then(function (response) {
        resolve(response.entries)
      })
      .catch(function (error) {
        reject(error)
      })
  })
}

// async..await is not allowed in global scope, must use a wrapper
async function sendEmail(filename) {
  // create reusable transporter object using the default SMTP transport
  let transporter = nodemailer.createTransport({
    host: "smtp.mandrillapp.com",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: 'click', // generated ethereal user
      pass: 'YW55c3RyaW5nOmE3MDNmOWVjNmNiYjI5MTNmMjJlMjFhZjdkMmYxYWNhLXVzMTI=', // generated ethereal password
    },
  });

  // send mail with defined transport object
  let info = await transporter.sendMail({
    from: '"Fred Foo 👻" <foo@example.com>', // sender address
    to: "pablo@criadoperez.com, hola@clickmarqueteria.com, uus4826v4muu57@print.epsonconnect.com ", // list of receivers
    subject: "Nueva orden", // Subject line
    text: "Nueva orden se envío a la impresora", // plain text body
    html: "<b>Nueva orden se envío a la impresora</b>", // html body
    attachments: [
      {   // filename and content type is derived from path
        path: './temp/' + filename
    },
    ]
  });

  console.log("Message sent: %s", info.messageId);
  // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

  // Preview only available when sending through an Ethereal account
  console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
  // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
} 

// printLatestOrders(12960)

module.exports = { sumWorkingDays, calculateBox, printLatestOrders }
