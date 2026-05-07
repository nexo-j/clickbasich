const { limitFilestackImageToShopifyResolution } = require('./api')
const { getImagesForShopify } = require('./api')

test('Large Filestack Image return resize', async () => {
  var imageURL = 'https://cdn.filestackcontent.com/nPm4LjLQJCneUzb245CT'
  const result = await limitFilestackImageToShopifyResolution(imageURL)
  expect(result).toBe('https://cdn.filestackcontent.com/resize=height:4472/nPm4LjLQJCneUzb245CT')
})

test('Small image to return same url', async () => {
  var imageURL = 'https://cdn.filestackcontent.com/GIWrvJBZR4eY0IdilkIs'
  const result = await limitFilestackImageToShopifyResolution(imageURL)
  expect(result).toStrictEqual(imageURL)
})

/* test('Generate Spotify Images from incoming parameters', async () => {
  var testParams = {
    title: 'Marco con Imagen',
    variants: [
      {
        sku: Date.now(),
        option3: '[{"marco":{"material":"Negro","grosor":2},"paspartu":{"color":"#fff","grosor":7},"photo":{"url":"https://cdn.filestackcontent.com/oL88wyaSlOsvdzLpVs8L","alto":105,"ancho":70,"fiche":null}}]'
      }
    ]
  }
  var resultParams = [{ position: 0, src: 'https://cdn.filestackcontent.com/resize=height:4472/oL88wyaSlOsvdzLpVs8L' }]
  const images = await getImagesForShopify(testParams)
  expect(images).toStrictEqual(resultParams)
})

test('Generate Spotify Images from incoming parameters with no image url', async () => {
  var testParams = {
    title: 'Marco con Imagen',
    variants: [
      {
        sku: Date.now(),
        //option3: '[{"marco":{"material":"Negro","grosor":2},"paspartu":{"color":"#fff","grosor":7},"photo":{"url":null,"alto":105,"ancho":70,"fiche":null}}]'
      }
    ]
  }
  var resultParams = [{ position: 0, src: 'https://cdn.shopify.com/s/files/1/2250/9309/files/marco.png?5238' }]
  const images = await getImagesForShopify(testParams)
  expect(images).toStrictEqual(resultParams)
})
test('Generate Spotify Images from incoming parameters with large Image', async () => {
  var testParams = {
    title: 'Marco con Imagen',
    variants: [
      {
        sku: Date.now(),
        option3: '[{"marco":{"material":"Negro","grosor":2},"paspartu":{"color":"#fff","grosor":7},"photo":{"url":"https://cdn.filestackcontent.com/nPm4LjLQJCneUzb245CT","alto":105,"ancho":70,"fiche":null}}]'
      }
    ]
  }
  var resultParams = [{ position: 0, src: 'https://cdn.filestackcontent.com/resize=height:4472/nPm4LjLQJCneUzb245CT' }]
  const images = await getImagesForShopify(testParams)
  expect(images).toStrictEqual(resultParams)
}) */
