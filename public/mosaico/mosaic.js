
// Mosaico
var mosaicoAlto = Number($.urlParam('mosaicoAlto')) || 2
var mosaicoAncho = Number($.urlParam('mosaicoAncho')) || 2

function updateMosaic () {
  var ancho = Number($("input[name='mosaicoAncho']").val())
  var alto = Number($("input[name='mosaicoAlto']").val())
  for (var y = 0; y < 6; y++) {
    var rowId = 'row' + String(y)
    y >= alto ? $('#' + rowId).hide(500) : $('#' + rowId).show(500)
    for (var x = 0; x < 6; x++) {
      x < ancho ? $('#' + rowId + ' .cell').eq(x).show(500) : $('#' + rowId + ' .cell').eq(x).hide(500)
    }
  }
  $('#numeroDeMarcos').text(String(alto * ancho))
  actualizarDimensiones()
  adjustUploadImageSize()
  updatePrice()
}

function adjustUploadImageSize () {
  var $photos = $('.thumbnail').find('img')
  for (var i = 0; i < $photos.length; i++) {
    if ($photos.eq(i).attr('src') === '../images/upload555.png' && $photos.eq(i).width() < 110) {
      $photos.eq(i).attr('src', '../images/upload250.png')
    }
    if ($photos.eq(i).attr('src') === '../images/upload250.png' && $photos.eq(i).width() >= 110) {
      $photos.eq(i).attr('src', '../images/upload555.png')
    }
  }
}

$(document).ready(function () {
  // Setup
  $("input[name='mosaicoAncho']").val(mosaicoAncho)
  $("input[name='mosaicoAlto']").val(mosaicoAlto)

  updateMosaic()

  // Add Event Listeners
  $('.enmarca').on('click', function () {
    var ancho = $('#ancho').val()
    var alto = $('#alto').val()
    var mosaicoAlto = $("input[name='mosaicoAlto']").val()
    var mosaicoAncho = $("input[name='mosaicoAncho']").val()
    window.location.href = '/mosaico?alto=' + alto + '&ancho=' + ancho + '&mosaicoAncho=' + mosaicoAncho + '&mosaicoAlto=' + mosaicoAlto
  })

  $("input[name='mosaicoAncho']").on('change', function () {
    var max = parseInt($(this).attr('max'))
    var min = parseInt($(this).attr('min'))
    if ($(this).val() > max) {
      $(this).val(max)
    } else if ($(this).val() < min) {
      $(this).val(min)
    }
    if ($("input[name='mosaicoAlto']").val() === '1' && Number($(this).val()) < 3) $(this).val(3)
    if ($("input[name='mosaicoAlto']").val() === '2' && Number($(this).val()) < 2) $("input[name='mosaicoAlto']").val() === '3'
    mosaicoAncho = Number($(this).val())
    updateMosaic()
  })

  $("input[name='mosaicoAlto']").on('change', function () {
    var max = parseInt($(this).attr('max'))
    var min = parseInt($(this).attr('min'))
    if ($(this).val() > max) {
      $(this).val(max)
    } else if ($(this).val() < min) {
      $(this).val(min)
    }
    console.log($(this).val())
    if ($("input[name='mosaicoAncho']").val() === '1' && Number($(this).val()) < 3) $(this).val(3)
    if ($("input[name='mosaicoAncho']").val() === '2' && Number($(this).val()) < 2) $("input[name='mosaicoAncho']").val() === '3'
    mosaicoAlto = Number($(this).val())
    updateMosaic()
  })
})
