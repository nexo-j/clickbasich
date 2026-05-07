var fs = require('fs')
var http = require('http')
const sharp = require('sharp')

function saveImageToDisk (url, localPath) {
  var file = fs.createWriteStream(localPath)
  var req = http.get(url, function (res) {
    res.pipe(file)
  }).on('error', (e) => console.log(e))
  return req
}

module.exports = {
  downloadFromURLS: function (urls, callback) {
    if (urls != null) {
      urls.forEach(url => {
        saveImageToDisk(url, './public/images/backgrounds/' + url.split('/').pop(), function (e) {
          console.log('done')
          console.log(e)
        })
      })
    }
    return callback
  },
  generateFromDirectory: function (directory) {
    var widths = [118, 200, 400, 800, 1200, 1600, 2000, 2600, 3000]
    fs.readdirSync(directory).forEach(file => {
      if (!fs.existsSync(`${directory}/${file.split('.')[0]}`)) {
        fs.mkdirSync(`${directory}/${file.split('.')[0]}`)
      }
      widths.forEach(width => {
        sharp(`${directory}/${file}`)
          .resize(width) // width, height
          .toFile(`${directory}/${file.split('.')[0]}/${width}.jpg`)
          .catch(e => console.log(e))
      })
    })
  }

}
