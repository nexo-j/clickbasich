
module.exports = function (params) {
  console.log(params)
  const anchoFoto = Number(params.ancho) // en CM
  const altoFoto = Number(params.alto) // en CM
  const anchoPaspartuElegido = Number(params.paspartuSel) // en CM

  const anchoMarco = anchoFoto + (anchoPaspartuElegido * 2) + 0.7
  const altoMarco = altoFoto + (anchoPaspartuElegido * 2) + 0.7

  var totalWeight = (altoMarco + 12) * (anchoMarco + 12) * 6 / 5 // Peso Volumen

  var returnObj = {
    weight: Math.ceil(totalWeight)
  }
  return returnObj
}
