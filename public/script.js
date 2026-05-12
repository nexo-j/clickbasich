Sentry.init({ dsn: 'https://a6c61cae7871489aa79da1b05f0e1d9f@o404682.ingest.sentry.io/5269157' })
const TRANSFORMATIONUI = false
const client = filestack.init('AFr2KJdocT16BQBQZYFWcz')
client.on('upload.error', (filestackError) => {
  Sentry.captureException(filestackError)
  console.log(filestackError)
})

// Store weight stickers
var stickerPairs = 0
// Detects touch support
var supportsTouch = 'ontouchstart' in window || navigator.msMaxTouchPoints

const MAX_DIMENSIONS = [150, 100] // Sorted from big to small

// Set Image size
var imageWidthInvw = 15 // in vw
window.vwpercm = imageWidthInvw / 20 // vw per cm

var anchoPaspartu = 7
var frames = []
var paspartuWidths = []

// Preload images for better performance
var Image1 = new Image()
Image1.src = '../images/Resina_Blanco_LR.jpg'
var Image2 = new Image()
Image2.src = '../images/Resina_Negro_LR.jpg'
var Image3 = new Image()
Image3.src = '../images/Madera_Clara_LR.jpg'
var Image4 = new Image()
Image4.src = '../images/Resina_Nogal_LR.jpg'

// FILEPICKER OPTIONS
//= ==================================

var onUploadProgress = function (evt) {
  console.log(evt.totalPercent)
}

var filePickerOptions = function (withTransformatioUI, cropOptions, $img, _this) {
  return {
    accept: ['image/*', '.pdf'],
    maxSize: 10 * 1024 * 1024,
    transformations: {
      crop: cropOptions,
      rotate: true
    },
    fromSources: ['local_file_system', 'facebook', 'instagram', 'googledrive', 'dropbox', 'box'],
    lang: 'es',
    onUploadStarted: function () {
      $img.prev().hide()
      $img.attr('src', '../images/loader.gif')
    },
    onFileUploadFailed: function () {
      $img.prev().Show()
      $img.attr('src', '../images/upload555.png')
      Sentry.captureException(new Error('Filestack picker Upload failed'))
      console.log('Upload Failed')
    },
    onUploadDone: function (result) {
      $('.filepicker').css('display', 'inline')
      $('#haz-click').css('display', 'block')
      var imageURL = result.filesUploaded[0].url
      if (result.filesUploaded[0].mimetype === 'application/pdf') {
        var handle = result.filesUploaded[0].handle
        imageURL = 'https://cdn.filestackcontent.com/AFr2KJdocT16BQBQZYFWcz/output=format:jpg/' + handle
        window.alert('Estás subiendo un archivo PDF. Se imprimirá sólo la primera página.')
      }
      _this.data('doc-url', imageURL)
      _this.data('filename', result.filesUploaded[0].filename)
      if (withTransformatioUI) {
        $img.attr('src', imageURL)
        var tr = new FilestackTransform('AFr2KJdocT16BQBQZYFWcz')
        tr.setConfig(transformUIOptions)
        tr.open(imageURL).then(res => {
          client.upload(res, { onProgress: onUploadProgress })
            .then((uploadRes) => { // upload result of the transformation
              var imageURL = uploadRes.url
              previewImage(imageURL, $img, function () {
                if (window.location.pathname !== '/mosaico/') setupSizeOptions($(this)[0].naturalWidth, $(this)[0].naturalHeight)
                if (window.location.pathname === '/mosaico/' && !resolutionBigEnough(result.filesUploaded[0].cropped.cropArea.size[0], result.filesUploaded[0].cropped.cropArea.size[1], Number($('#ancho').text()), Number($('#alto').text()))) {
                  alert('Recomendamos subir una foto mas grande para este tamaño de marco o se puede ver afectada la calidad de la impresión.')
                }
              })
            })
            .catch(e => {
              console.error(e)
              Sentry.captureException(e)
              $img.prev().Show()
              $img.attr('src', '../images/upload555.png')
            })
        })
          .catch(e => {
            console.error(e)
            Sentry.captureException(e)
            $img.prev().Show()
            $img.attr('src', '../images/upload555.png')
          })
      } else {
        previewImage(imageURL, $img, function () {
          if (window.location.pathname !== '/mosaico/') setupSizeOptions($(this)[0].naturalWidth, $(this)[0].naturalHeight)
          if (window.location.pathname === '/mosaico/' && !resolutionBigEnough(result.filesUploaded[0].cropped.cropArea.size[0], result.filesUploaded[0].cropped.cropArea.size[1], Number($('#ancho').text()), Number($('#alto').text()))) {
            alert('Recomendamos subir una foto mas grande para este tamaño de marco o se puede ver afectada la calidad de la impresión.')
          }
        })
      }
    },
    uploadInBackground: false
  }
}

const transformUIOptions = {
  lang: 'en',
  editor: {
    transforms: {
      enabled: true, // enable or disable transform module
      lockRotation: false,
      lockFlip: false,
      ratios: [{
        icon: 'crop_free',
        default: true,
        name: 'Rectangulo',
        shape: 'rect'
      }]
    },
    text: false,
    filters: {
      // enabled: true - enable all adjustments or false to disable this module
      enabled: [
        'brownie',
        'kodachrome',
        'polaroid',
        'sepia',
        'vintage',
        'iceCold',
        'autumn'
      ]
    },
    border: false,
    adjustments: {
      enabled: ['brightness', 'saturation', 'contrast', 'blur']

    }
  },
  output: {
    blob: true
  }
}

// FUNCTIONS
// ==============================

function previewImage (url, $imgSelector, callback) {
  $imgSelector.attr('src', url).on('load', callback)
}

function getProductName () {
  switch (window.location.pathname) {
    case '/marco/':
      return 'Marco a medida'
    case '/imagen/':
      return 'Marco con Imagen'
    case '/mosaico/':
      return 'Photo Wall de ' + $('.cell').filter(':visible').length.toString() + ' marcos con imagen'
  }
}

function sendToServer (isGalleryImage) {
  var product = {
    product: {
      title: getProductName(),
      handle: Date.now(),
      body_html: $('.full-desc').text() + (!isGalleryImage ? ' - Archivo:' + $('.filepicker').data('filename') : ''),
      variants: [{
        sku: Date.now()
      }],
      metafields: getProductMetafields(getProductParamsV2())
    }
  }
  $.ajax({
    url: '/product',
    method: 'POST',
    data: {
      productParams: product,
      priceParams: getProductParams(),
      weightParams: getProductParams(),
      idAfiche: $.urlParam('id')
    },
    dataType: 'json'
  })
    .done(function (data) {
      let cartLink = 'http://clickmarqueteria.com/cart/add?id[]=' + data.product.variants[0].id
      if ($('#hang-stickers-input').is(':checked')) {
        var numeroMarcos = window.location.pathname === '/mosaico/' ? $('.cell').filter(':visible').length : 1
        // stickerPairs = stickerPairs * numeroMarcos
        stickerPairs = 1
        cartLink += '&id[]=16896960167987&quantity=' + stickerPairs
      }
      if ($('#gift-wrap-input').is(':checked')) {
        cartLink += '&id[]=40324925554842&quantity=1'
      }
      window.location.href = cartLink
    })
    .fail(function (e) {
      Sentry.captureException(e)
      console.log(e)
    })
}

function resolutionBigEnough (imageWidthpx, imageHeightpx, imageWidthcm, imageHeightcm) {
  var safeWidth = (imageWidthpx * 5) / 150
  var safeHeight = (imageHeightpx * 5) / 150
  return (imageWidthcm < safeWidth && imageHeightcm < safeHeight)
}

function maximumRecommendedResolution (cm) {
  return cm * 150 / 5
}

function setupSizeOptions (imageWidth, imageHeight) {
  var $good = $('#options')
  var $bad = $('#badoptions')

  // Clear size options
  $good.html('')
  $bad.html('')

  var factor = (imageWidth * 5) / 150
  var proportion = imageHeight / imageWidth

  if (factor < 15) {
    $('#too-small').css('display', 'block')
    $('#not-recommended').css('display', 'none')
  }

  for (var width = 10; $bad.children().length < 3; width += 5) {
    var height = Number(width * proportion).toFixed(1)
    // break if reached max dimensions
    if (Math.max(height, width) > MAX_DIMENSIONS[0]) break
    if (Math.min(height, width) > MAX_DIMENSIONS[1]) break
    // add dimensions to options
    var selected = width < factor ? $good : $bad
    if (Math.max(width, height) <= MAX_DIMENSIONS[0] && Math.min(width, height) <= MAX_DIMENSIONS[1]) selected.append('<span data-width="' + width + '" data-height="' + width * proportion + '">' + width + 'cm x ' + height + 'cm</span>')
  }
  // Hide Bads if no bads
  if ($bad.children().length === 0) {
    $('#not-recommended').css('display', 'none')
  }

  $('.veil#sizepicker').css('display', 'block')
  $('body').css('overflow', 'hidden')
}

function setFullHeightInDescription () {
  var height = Number($('#alto').text())
  var width = Number($('#ancho').text())

  var borde = Number($('#borde').text())
  var marco = Number($('#marco').text())

  var anchoTotal = width + (borde * 2) + (marco * 2)
  var altoTotal = height + (borde * 2) + (marco * 2)

  $('#altot').text(Number(altoTotal).toFixed(2))
  $('#anchot').text(Number(anchoTotal).toFixed(2))
}

$('#paspartuSlider').on('input', () => {
  $('#paspartuWidths').children().each((i, child) => {
    if (i === Number($('#paspartuSlider').val())) {
      $(child).addClass('selected')
      anchoPaspartu = Number($(child).attr('value'))
    } else {
      $(child).removeClass('selected')
    }
  })
  actualizarDimensiones()
  updatePrice()
})

$('#hang-stickers-input').on('change', function () {
  if ($(this).is(':checked')) {
    stickerPairs = 1
  } else {
    stickerPairs = 0
  }
})

$('#menu-picker-background').on('click', 'li input', function () {
  const src = $(this).next().find('img').attr('src')
  $('.frame-background').fadeOut(400, function () {
    $('.frame-background').attr('src', src)
      .bind('onreadystatechange load', function () {
        if (this.complete) $(this).fadeIn(800)
      })
  })
})

$('#menu-picker-paspartu').on('click', 'li input', function (event) {
  actualizarColorPaspartu()
  if ($(this).attr('stock') === 'true') {
    $('.out-of-stock-form-paspartu').slideUp(400)
    $('.submit').show(400)
    updatePrice()
  } else {
    $('.out-of-stock-form-paspartu').show(400)
    $('.submit').slideUp(400)
  }
})

function frameItemHtml (frame, index) {
  return `<li><input data-images="${frame.gallery_images}" stock="true" type="radio" name="color-selection" id="${frame.name}" border_image=${frame.border_image} index=${index} example_image=${frame.example_image}><label for="${frame.name}"><img src="${frame.thumbnail}"><div class="checkthing"></div></label></li>`
}

function renderFrames (sortedFrames, frameCategories) {
  const activeCategories = Array.isArray(frameCategories)
    ? frameCategories.filter(c => c.activo !== false)
    : []

  // No active categories → flat list (comportamiento original)
  if (activeCategories.length === 0) {
    for (var i = 0; i < sortedFrames.length; i++) {
      $('#menu-picker-wood').append(frameItemHtml(sortedFrames[i], i))
    }
    $('#menu-picker-wood').children().first().find('input').trigger('click')
    return
  }

  // Agrupar frames por categorySlug
  const categoryMap = {}
  const uncategorizedIndices = []

  sortedFrames.forEach(function (frame, i) {
    if (frame.categorySlug) {
      if (!categoryMap[frame.categorySlug]) categoryMap[frame.categorySlug] = []
      categoryMap[frame.categorySlug].push(i)
    } else {
      uncategorizedIndices.push(i)
    }
  })

  var hasVisibleFrames = false

  // Renderizar categorías activas que tengan al menos un frame
  activeCategories.forEach(function (category) {
    var slug = category.identificador
    var indices = categoryMap[slug] || []
    if (indices.length === 0) return
    hasVisibleFrames = true
    $('#menu-picker-wood').append('<li class="category-header">' + category.nombre + '</li>')
    indices.forEach(function (i) {
      $('#menu-picker-wood').append(frameItemHtml(sortedFrames[i], i))
    })
  })

  // Frames sin categorySlug → categoría fallback visible
  if (uncategorizedIndices.length > 0) {
    hasVisibleFrames = true
    $('#menu-picker-wood').append('<li class="category-header">Más opciones</li>')
    uncategorizedIndices.forEach(function (i) {
      $('#menu-picker-wood').append(frameItemHtml(sortedFrames[i], i))
    })
  }

  // Si ningún frame fue renderizado → lista plana como fallback final
  if (!hasVisibleFrames) {
    $('#menu-picker-wood').html('')
    for (var j = 0; j < sortedFrames.length; j++) {
      $('#menu-picker-wood').append(frameItemHtml(sortedFrames[j], j))
    }
    $('#menu-picker-wood').children().first().find('input').trigger('click')
    return
  }

  $('#menu-picker-wood li:not(.category-header)').first().find('input').trigger('click')
}

function checkInvetory () {
  $.ajax('/inventory').done(function (inventory) {
    // Populate Frames
    $('#menu-picker-wood').html('')
    frames = inventory.frames
    frames.sort((a, b) => a.position - b.position)
    renderFrames(frames, inventory.frameCategories)
    // Populate paspartu
    const paspartus = inventory.paspartus
    paspartus.sort((a, b) => a.position - b.position)
    $('#menu-picker-paspartu').html('')
    paspartus.forEach(paspartu => {
      if (!(paspartu.name === 'Transparente' && (window.location.pathname === '/marco/' || window.location.pathname === '/mosaico/'))) $('#menu-picker-paspartu').append(`<li><input type="radio" value="${paspartu.color}" stock="${paspartu.stock}" name="paspartuc" nombre="${paspartu.name}" id="Paspartu ${paspartu.name}"><label for="Paspartu ${paspartu.name}"><img src="${paspartu.image}"><div class="checkthing"></div></label></li>`).show(400)
    })
    $("#menu-picker-paspartu li input[nombre='Blanco']").trigger('click')
    // Populate paspartu widths
    paspartuWidths = inventory.paspartuWidths
      ? inventory.paspartuWidths.split(',').map(Number)
      : []
    populatePaspartuWidths()
    // Populate Acrilics
    const acrilics = inventory.acrilics
    console.log(acrilics)
    const acrilicsInStock = []
    const acrilicsOutOfStock = []
    acrilics.forEach(acrilic => {
      acrilic.stock ? acrilicsInStock.push(acrilic) : acrilicsOutOfStock.push(acrilic)
    })
    acrilicsInStock.sort((a, b) => a.position - b.position)
    acrilicsOutOfStock.sort((a, b) => a.position - b.position)
    for (let i = 0; i < acrilicsInStock.length; i++) {
      $('#acrilics').append(`<input type="radio" class="bordert" id="${acrilicsInStock[i].name}" name="acrilics"><label for="${acrilicsInStock[i].name}">${acrilicsInStock[i].name}</label>`)
    }
    acrilicsOutOfStock.forEach(acrilic => {
      $('#acrilics').append(`<input type="radio" disabled class="bordert" id="${acrilic.name}" name="acrilics"><label for="${acrilic.name}">${acrilic.name}</label>`)
    })
    $('#acrilics input:first').click()
    // Populate Backgrounds
    const backgrounds = inventory.backgrounds
    backgrounds.sort((a, b) => a.position - b.position)
    $('#menu-picker-background').html('')
    for (let i = 0; i < backgrounds.length; i++) {
      $('#menu-picker-background').append(`<li><input type="radio" name="background-selection" id="${backgrounds[i].name}" ><label for="${backgrounds[i].name}"><img src="${backgrounds[i].image}"><div class="checkthing"></div></label></li>`)
    }
    $('#menu-picker-background li:first input').click()
  }).fail(function (e) {
    console.error('ERROR')
    Sentry.captureException(e)
    console.error(e)
  })
}

function populatePaspartuWidths () {
  $('#paspartuWidths').html('')
  const maxDimension = Math.max(Number($('#ancho').text()), Number($('#alto').text()))
  const minDimension = Math.min(Number($('#ancho').text()), Number($('#alto').text()))
  let showAlertMessage = false
  const filteredPaspartuWidths = paspartuWidths.filter((val) => ((val * 2 + minDimension < MAX_DIMENSIONS[1] && val * 2 + maxDimension < MAX_DIMENSIONS[0])))
  $('#paspartuSlider').attr('max', filteredPaspartuWidths.length - 1)
  for (var i = 0; i < filteredPaspartuWidths.length; i++) {
    $('#paspartuWidths').append(`<li value="${filteredPaspartuWidths[i]}">${filteredPaspartuWidths[i]} cm</li>`)
  }
  if (filteredPaspartuWidths.length === 0) {
    $('#paspartuWidths').append('<li value="0">0 cm</li>')
  }
  // set default to 3cm if present
  if (filteredPaspartuWidths.includes(3)) {
    $('#paspartuWidths').val(3) // TODO check this triggers input event
  } else {
    $('#paspartuWidths').val(filteredPaspartuWidths[filteredPaspartuWidths.length - 1])
  }
  if (filteredPaspartuWidths.length <= 1) showAlertMessage = true
  if (showAlertMessage) $('#paspartuWidths').after('<p style="color:red">Has llegado a la medida límite del paspartú. Escoge una imagen más pequeña para tener más opciones.</p>')
  $('#paspartuSlider').trigger('input')
}

function actualizarAnchoMarco () {
  var input = $("input[name='marco']:checked").val() || 2
  $('.img-rounded').css('border-width', (input * window.vwpercm) + 'vw')
  $('#marco').text(input)
  setFullHeightInDescription()
}

function actualizarDimensiones () {
  actualizarTransformacion()
  actualizarAnchoMarco()
  actualizarAnchoPaspartu()
}

function actualizarAnchoPaspartu () {
  var val = anchoPaspartu
  if (window.location.pathname === '/mosaico/dimensiones.html') val = 7
  if (val === 0) {
    $('#paspartuc').text('n/a')
    $('img.shadow').css('border-width', '0px')
    $('.img-rounded').css('background-color', '#aaaaaa00')
  } else {
    $('#paspartuc').text($("input[name='paspartuc']:checked").attr('nombre'))
    $('.img-rounded').css('background-color', $("input[name='paspartuc']:checked").val())
  }
  $('.img-rounded').css('padding', (val * window.vwpercm) + 'vw')
  $('#borde').text(val)
  setFullHeightInDescription()
}

function actualizarColorPaspartu () {
  var input = $("input[name='paspartuc']:checked").val() || '#fff'
  $('.img-rounded').css('background-color', input)

  anchoPaspartu === 0 ? $('#paspartuc').text('n/a') : $('#paspartuc').text($("input[name='paspartuc']:checked").attr('nombre'))

  // Add 1 pixel border shadow between photo and paspartu
  if (window.location.pathname !== '/marco/') {
    if ($("input[name='paspartuc']:checked").attr('nombre') === 'Blanco') {
      $('.shadow').css('border-color', '#D9D9D9')
      $('.shadow').css('border-width', '1px')
    }
    else {
      $('.shadow').css('border-color', '#d9d9d9')
      $('.shadow').css('border-width', '1px')
    }
  }

  if ($("input[name='paspartuc']:checked").val() === 'transparent') {
    $('div.holder').addClass('hide-pseudo')
  } else {
    $('div.holder').removeClass('hide-pseudo')
  }
}

function pxTovw (px) {
  return 100 * px / window.innerWidth
}

function actualizarTransformacion () {
  var photoWidthcm = Number($('#ancho').val()) || Number($('#ancho').text())
  var photoHeightcm = Number($('#alto').val()) || Number($('#alto').text())
  var widthPaspartucm = anchoPaspartu
  var widthFrameBordercm = Number($("input[name='marco']:checked").val()) || 2
  var parentWidth = pxTovw($('.thumbnail').width() - 100)
  var parentHeight = window.innerWidth < 768 ? pxTovw(window.innerHeight - 250) : pxTovw(window.innerHeight - 300)
  if (window.location.pathname === '/mosaico/dimensiones.html') parentHeight = pxTovw($('.thumbnail').height())
  var cellPaddingcm = 5
  var framesPerRow = $("input[name='mosaicoAncho']").length ? $("input[name='mosaicoAncho']").val() : 1
  var numRows = $("input[name='mosaicoAlto']").length ? $("input[name='mosaicoAlto']").val() : 1
  var widthPerFramecm = ((widthPaspartucm + widthFrameBordercm) * 2 + photoWidthcm + cellPaddingcm * 2)
  var heightPerFramecm = ((widthPaspartucm + widthFrameBordercm) * 2 + photoHeightcm + cellPaddingcm * 2)
  window.vwpercm = Math.min(parentWidth / (widthPerFramecm * framesPerRow), parentHeight / (heightPerFramecm * numRows))
  imageWidthInvw = photoWidthcm * window.vwpercm
  $('.shadow').css('width', String(imageWidthInvw) + 'vw')
  $('.shadow').css('height', String(photoHeightcm * window.vwpercm) + 'vw')
  $('.cell').css('padding', String(cellPaddingcm * window.vwpercm) + 'vw')
}

function getProductParamsV2 () {
  var numeroMarcos = window.location.pathname === '/mosaico/' ? $('.cell').filter(':visible').length : 1
  var marcos = []
  for (var i = 0; i < numeroMarcos; i++) {
    marcos.push({
      marco: {
        material: $('#acabado').text(),
        grosor: Number($('#marco').val()),
        code: $("input[name='marco']:checked").data('code')
      },
      paspartu: {
        color: $("input[name='paspartuc']:checked").attr('Nombre'),
        grosor: anchoPaspartu
      },
      frente: $('#frente').text(),
      photo: {
        url: getPhotoURL(i),
        alto: Number($('#alto').text()),
        ancho: Number($('#ancho').text()),
        color: window.location.pathname === '/imagen/' ? $('#impresion').text() : 'Color',
        fiche: $.urlParam('id')
      }
    })
  }
  return marcos
}

function getProductMetafields (marcos) {
  var metafields = []
  marcos.forEach((marco, i) => metafields.push({
    key: '00' + (i + 1).toString(),
    value: JSON.stringify(marco),
    type: 'json',
    namespace: 'marco'
  }))
  return metafields
}

function getPhotoURL (frameIndex = 0) {
  var src = null
  if (window.location.pathname === '/mosaico/') src = $('.cell').filter(':visible').eq(frameIndex).find('img').filter(':visible').attr('src')
  if (window.location.pathname === '/imagen/') src = $('#photo').attr('src')
  var internetURL = new RegExp('^(?:[a-z]+:)?//', 'i')
  if (internetURL.test(src)) {
    if ($('#impresion').text() === 'Blanco y Negro') src = src.slice(0, src.lastIndexOf('/')) + '/monochrome' + src.slice(src.lastIndexOf('/'))
    return src
  } else return null
}

function getProductParams () {
  var numeroMarcos = window.location.pathname === '/mosaico/' ? $("input[name='mosaicoAlto']").val() * $("input[name='mosaicoAncho']").val() : 1
  var ancho = Number($('#ancho').text())
  var alto = Number($('#alto').text())
  var paspartuSel = anchoPaspartu
  var paspartuTipo = $("input[name='paspartuc']:checked").attr('nombre')
  var marcoSel = Number($('#marco').text())
  var marco = $('#acabado').text()
  var photo = window.location.pathname !== '/marco/'
  var frente = $('#frente').text()

  return {
    ancho: ancho,
    alto: alto,
    paspartuSel: paspartuSel,
    paspartuTipo: paspartuTipo,
    marcoSel: marcoSel,
    photo: photo,
    numeroMarcos: numeroMarcos,
    acabado: marco,
    frente: frente
  }
}

var backendImage = {}

// update prices
function updatePrice () {
  if (window.location.pathname === '/imagen/' && $('#photo').attr('src') === '../images/upload555.png') return
  $.ajax({
    url: '/calculateprice',
    method: 'POST',
    data: {
      priceParams: getProductParams(),
      idAfiche: $.urlParam('id')
    },
    dataType: 'json'
  })
    .done(function (data) {
      console.log(data)
      $('#precio').text('$ ' + Number(data.precio).toLocaleString('es-CO'))
      $('#precio').css('color', '#333')
      $('#precio').css('text-shadow', 'none')
    })
    .fail(function (e) {
      console.error('ERROR')
      Sentry.captureException(e)
      console.error(e)
    })
}

// DOCUMENT READY
// ==============================

$(document).ready(function () {
  // FILEPICKER SETUP
  // ================================================================
  $('.transformui').on('click', function () {
    const imageURL = document.getElementById('photo').src
    var tr = new FilestackTransform('AFr2KJdocT16BQBQZYFWcz')
    tr.setConfig(transformUIOptions)
    var $img = $('#photo')
    tr.open(imageURL).then(res => { // replace FILE_URL with the link to the image
      $img.attr('src', '../images/loader.gif')
      client.upload(res, { onProgress: onUploadProgress })
        .then((uploadRes) => { // upload result of the transformation
          var imageURL = uploadRes.url
          previewImage(imageURL, $img, function () {
            if (window.location.pathname !== '/mosaico/') setupSizeOptions($(this)[0].naturalWidth, $(this)[0].naturalHeight)
          })
        })
        .catch(e => {
          Sentry.captureException(e)
          alert('Algo fue mal, intentelo de nuevo.')
          $img.attr('src', '../images/upload555.png')
        })
    }).catch(e => {
      console.error(e)
      Sentry.captureException(e)
      alert('Algo fue mal, intentelo de nuevo.')
      $img.attr('src', '../images/upload555.png')
    })
  })

  $(document).on('click', '.filepicker', function () {
    var cropOptions = true
    if (window.location.pathname === '/mosaico/') {
      cropOptions = {
        aspectRatio: Number($('#ancho').text()) / Number($('#alto').text()),
        force: true
      }
    }
    const $img = window.location.pathname === '/mosaico/' ? $(this).prev() : $('#photo')
    var filepicker = client.picker(filePickerOptions(TRANSFORMATIONUI, cropOptions, $img, $(this)))
    filepicker.open()
  })

  // SET UP SIZE PICKER
  // ================================================================

  $('.sizepicker').on('click', function () {
    $('.veil#sizepicker').css('display', 'block')
    $('body').css('overflow', 'hidden')
  })

  // READ FROM URL
  // ================================================================

  var id = $.urlParam('id')
  // Saves the info from the backend.

  if (id != null) {
    $.when(
      $.ajax('/dimensions/' + id),
      $.ajax('/imageurl/' + id),
      $.ajax('/name/' + id)
    )
      .done((dimensionData, imageData, nameData) => {
        backendImage = {
          link: imageData[0].url,
          width: dimensionData[0].width,
          height: dimensionData[0].height,
          name: nameData[0].name
        }

        previewImage(backendImage.link, $('#photo'), function () {
          if (backendImage.width != null && backendImage.height != null) {
            window.vwpercm = imageWidthInvw / backendImage.width
            $('#ancho').text(backendImage.width)
            $('#alto').text(backendImage.height)
            setFullHeightInDescription()
            actualizarDimensiones()

            updatePrice()
          } else {
            setupSizeOptions($(this)[0].naturalWidth, $(this)[0].naturalHeight)
          }
          $('#haz-click').css('display', 'block')
        })
        $('#desc-gallery').text('(' + backendImage.name + ')')
      })
      .fail((error) => {
        Sentry.captureException(error)
        console.error(error)
      })
  } else {
    if (window.location.pathname === '/imagen/') {
      $('.filepicker').click()
    }
  }

  // On submit
  $('.submit').on('click', function (e) {
    e.preventDefault()

    var imageurl = backendImage.link
    if (imageurl == null) {
      imageurl = $('.filepicker').data('doc-url')
    }
    if (window.location.pathname !== '/imagen/' || $('#photo').attr('src') !== '../images/upload555.png') {
      sendToServer(imageurl == null)
    } else {
      alert('Debes subir una imagen. Haz Click sobre el marco')
    }
  })

  $('#haz-click button').on('click', function (e) {
    e.preventDefault()
    var photoWidth = Number($('#ancho').text())

    if (photoWidth >= 15 && photoWidth <= 30) {
      $('#b1').prop('checked', true)
      $('#a').prop('checked', true)
    } else if (photoWidth > 30 && photoWidth <= 90) {
      $('#c1').prop('checked', true)
      $('#a').prop('checked', true)
    }

    actualizarDimensiones()
  })

  $(document).on('click', '.veil#sizepicker .veil-modal span', function () {
    var width = $(this).attr('data-width')
    var height = $(this).attr('data-height')

    $('#alto').text(Number(height).toFixed(2))
    $('#ancho').text(Number(width).toFixed(2))

    actualizarDimensiones()
    populatePaspartuWidths()

    updatePrice()

    // Esconder velox
    $('.veil#sizepicker').css('display', 'none')
    $('body').css('overflow', 'initial')
    $('.acontrols').css('display', 'inline')
  })

  checkInvetory()

  $('.veil#picture-examples-veil').on('click', function () {
    $('.veil#picture-examples-veil').css('display', 'none')
    $('body').css('overflow', 'initial')
  })

  $('#menu-picker-wood').on('click', 'li input', function (event) {
    $('#acabado').text($(this).attr('id'))
    $('#frame-example-img').attr('src', $(this).attr('example_image'))
    $('.img-rounded').css('border-image-source', "url('" + $(this).attr('border_image') + "')")
    // Add variants
    const variants = frames[$(this).attr('index')].variants
    variants.sort((a, b) => a.width - b.width)
    $('#widthOptions').html('')
    variants.forEach((variant, i) => {
      $('#widthOptions').append(`<input type="radio" stock="${variant.stock}" class="bordert" data-code="${variant.code}" name="marco" value="${variant.width}" id="${variant.name}"><label for="${variant.name}">${variant.name}</label>`)
    })
    $('#widthOptions input:first').trigger('click')
    $('#widthOptions input:first').attr('checked', true)
    // Update Gallery
    $('.picture-examples').html('')
    const galleryImages = $(this).attr('data-images').split(',')
    galleryImages.forEach(image => $('.picture-examples').append(`<li>
      <img src="${image}"/>
  </li>`).children(':last').hide().fadeIn(500))
  })
  $('.slider-labels').on('click', 'li', (e) => {
    $('#paspartuSlider').val($(e.target).index())
    $('#paspartuSlider').trigger('input')
  })

  $('ol.menu-picker').on('mouseenter', 'li', function () {
    if (window.matchMedia('(min-width: 768px)').matches && !supportsTouch) {
      var source = $(this).find('img').attr('src')
      $('#texture-floating img').attr('src', source)
      $('#texture-floating .desc-texture').text($(this).children().first().attr('nombre'))
      $('#texture-floating').css('display', 'block')
    }
  })
  $('ol.menu-picker').on('mouseleave', 'li', function () {
    $('#texture-floating').css('display', 'none')
  })

  $('ol.menu-picker').on('mousemove', function () {
    if (window.matchMedia('(min-width: 768px)').matches && !supportsTouch) {
      var height = $('#texture-floating').height()
      $('#texture-floating').css('left', Number(event.pageX + 5) + 'px')
      $('#texture-floating').css('top', Number(event.pageY - height - 5) + 'px')
    }
  })

  $('ol.picture-examples').on('click', 'li', function () {
    var imageLocation = $(this).find('img').attr('src')
    $('#picture-example-img').attr('src', imageLocation)
    $('.veil#picture-examples-veil').show()
    $('body').css('overflow', 'hidden')
  })

  $('#subscribe').on('click', function (e) {
    e.preventDefault()
    const email = $('#mce-EMAIL').val()
    var mailformat = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
    if (!email.match(mailformat)) {
      $('.mce_response').html('Introduzca un email valido.')
      $('.mce_response').css('color', 'red')
      return
    }
    $.ajax({
      url: '/backInStockSignUp',
      method: 'POST',
      data: {
        email_address: $('#mce-EMAIL').val(),
        // stock: "Covid19"
        stock: $('#acabado').text() + ' ' + Number($("input[name='marco']:checked").val()) + ' cm'
      },
      dataType: 'json'
    })
      .done(function (data) {
        // Write success message
        $('.mce_response').html('Gracias, le avisaremos cuando este diponible el material.')
        $('.mce_response').css('color', 'black')
      })
      .fail(function (e) {
        Sentry.captureException(e)
        $('.mce_response').html('Hubo un error, intentelo de nuevo')
        $('.mce_response').css('color', 'red')
        console.log(e)
      })
  })

  $(document).on('click', '#bw-filter', function (e) {
    if ($(this).find('input').is(':checked')) {
      $('#photo').css('filter', 'grayscale(1)')
      $('.shadow').css('filter', 'grayscale(1)')
      $('#impresion').text('Blanco y Negro')
    } else {
      $('#photo').css('filter', 'grayscale(0)')
      $('.shadow').css('filter', 'grayscale(0)')
      $('#impresion').text('Color')
    }
  })

  $('#widthOptions').on('click', 'input', function () {
    if ($(this).attr('stock') === 'true') {
      $('.out-of-stock-form-frame').slideUp(400)
      $('.submit').show(400)
    } else {
      $('.out-of-stock-form-frame').show(400)
      $('.submit').slideUp(400)
    }
    actualizarDimensiones()
    updatePrice()
  })
  $("input[name='paspartuc']").on('click', function () {
    actualizarColorPaspartu()
    updatePrice()
  })
  $('#acrilics').on('click', 'input', function () {
    $('#frente').text($(this).attr('id'))
    if ($(this).attr('id').includes('Antirreflejo')) {
      $('.show-off').hide()
    } else {
      $('.show-off').show()
    }
    updatePrice()
  })

  var alto = Number($.urlParam('alto'))
  var ancho = Number($.urlParam('ancho'))
  if (alto !== 0) $('#alto').text(alto)
  if (ancho !== 0) $('#ancho').text(ancho)

  if (window.location.pathname === '/marco/') {
    var pad = (alto / ancho) * 100.0
    window.soloMarco = true
    $('.container-sm').css('padding-bottom', (pad) + '%')
    updatePrice()
  }
  actualizarDimensiones()

  $(window).resize(function () {
    actualizarDimensiones()
  })
  setTimeout(() => updatePrice(), 1000)
})

$('.toggle').click(function () {
  var id = $(this).data('toggle')
  $('#' + id).toggle(200, 'swing')
  return false
})
