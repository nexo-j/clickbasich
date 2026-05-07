// Calculador de precios.
var db = require('./db')

// Setting variables

module.exports = function (params) {
  console.log(params)
  var MARGEN_PRODUCCION = db.SimulatorVariables[0].margen_produccion
  var C_IVA = db.SimulatorVariables[0].IVA
  var C_FONDO = db.SimulatorVariables[0].fondo
  var C_FONDO_GRANDE = db.SimulatorVariables[0].fondo_grande
  var C_PHOTOWALL_DISCOUNT = db.SimulatorVariables[0].photoWallDiscount
  var C_DEBUG = db.SimulatorVariables[0].debug
  var C_FIJO_DE_VENTA = db.SimulatorVariables[0].C_FIJO_DE_VENTA
  var C_FIJO_DE_VENTA_MARCO_GRANDE = db.SimulatorVariables[0].C_FIJO_DE_VENTA_MARCO_GRANDE
  var AREA_MARCO_GRANDE = db.SimulatorVariables[0].area_marco_grande
  var IMPRESION_CM2 = db.SimulatorVariables[0].impresion_cm2

  // True si se incluye la impresión de foto
  const photo = (params.photo === 'true')
  // Precio del afiche base | null
  const precioBase = Number(params.precioBase)

  const anchoFoto = Number(params.ancho) // en CM
  const altoFoto = Number(params.alto) // en CM
  const anchoPaspartuElegido = Number(params.paspartuSel) // en CM
  const paspartuTipo = params.paspartuTipo // #fff , #222, "transparent"
  const marcoSel = Number(params.marcoSel) // en CM
  const frente = params.frente
  var C_PASPARTU = 0
  for (let i = 0; i < db.Paspartus.length; i++) {
    if (db.Paspartus[i].name === paspartuTipo) {
      C_PASPARTU = db.Paspartus[i].price
      break
    }
  }
  const areaFoto = anchoFoto * altoFoto
  const anchoMarco = anchoFoto + (anchoPaspartuElegido * 2) + 0.7
  const altoMarco = altoFoto + (anchoPaspartuElegido * 2) + 0.7
  const areaMarco = anchoMarco * altoMarco
  const numeroMarcos = Number(params.numeroMarcos)
  const acabado = params.acabado
  var C_MOLDURA = 0
  for (var i = 0; i < db.Frames.length; i++) {
    if (db.Frames[i].name === acabado) {
      for (var ii = 0; ii < db.Frames[i].variants.length; ii++) {
        if (db.Frames[i].variants[ii].width === marcoSel) {
          C_MOLDURA = db.Frames[i].variants[ii].price
          break
        }
      }
      break
    }
  }

  var IMP = 0
  if (photo) IMP = IMPRESION_CM2 * areaFoto
  if (precioBase != null && !isNaN(precioBase)) IMP = precioBase

  var ACR = 0
  for (var i = 0; i < db.Acrilics.length; i++) {
    if (db.Acrilics[i].name === frente) {
      ACR = db.Acrilics[i].price * areaMarco
      break
    }
  }

  // Calcular Fondo
  var FON = 0
  var PAS = 0
  if ((paspartuTipo === 'Transparente' || paspartuTipo === 'Acrilico') && anchoPaspartuElegido > 0) {
    FON = C_PASPARTU * areaMarco
    PAS = 0
  } else {
    areaMarco < AREA_MARCO_GRANDE ? FON = C_FONDO * areaMarco : FON = C_FONDO_GRANDE * areaMarco
    if (anchoPaspartuElegido > 0) PAS = C_PASPARTU * areaMarco
  }

  var MOL = 0
  MOL = C_MOLDURA * (anchoMarco * 2) + C_MOLDURA * (altoMarco * 2)

  const PRO = (IMP + ((ACR + FON + PAS + MOL) * (1 + MARGEN_PRODUCCION)))
  var PVP = (PRO) * (1 + C_IVA)

  if (areaMarco > AREA_MARCO_GRANDE) PVP = PVP + C_FIJO_DE_VENTA_MARCO_GRANDE
  else PVP = PVP + C_FIJO_DE_VENTA

  PVP = PVP * numeroMarcos

  if (numeroMarcos > 1) PVP = PVP * (1 - C_PHOTOWALL_DISCOUNT)

  if (Number.isNaN(PVP)) {
    throw new Error('Price is not a number')
  }
  var precioTexto = (PVP).toFixed(0).toString() // convert to string
  var precioTrunc = precioTexto.substring(0, precioTexto.length - 2) + '00'

  var returnObj = {
    precio: precioTrunc
  }

  if (C_DEBUG) {
    returnObj.breakdown = {
      variables: {
        precioBase: precioBase,
        ARf: areaFoto,
        Lp: anchoMarco,
        Ap: altoMarco,
        ARp: areaMarco,
        Marcos: numeroMarcos,
        IMP: IMP,
        ACR: ACR,
        FON: FON,
        PAS: PAS,
        MOL: MOL,
        PRO: PRO,
        PVP: PVP
      },
      constants: {
        MARGEN_PRODUCCION: MARGEN_PRODUCCION,
        C_FIJO_DE_VENTA: C_FIJO_DE_VENTA,
        C_FIJO_DE_VENTA_MARCO_GRANDE: C_FIJO_DE_VENTA_MARCO_GRANDE,
        area_marco_grande: AREA_MARCO_GRANDE,
        IMPRESION_CM2: IMPRESION_CM2,
        C_FONDO: C_FONDO,
        C_PASPARTU: C_PASPARTU,
        C_MOLDURA: C_MOLDURA,
        C_IVA: C_IVA,
        C_PHOTOWALL_DISCOUNT: C_PHOTOWALL_DISCOUNT
      }
    }
  }
  return returnObj
}
