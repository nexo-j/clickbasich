var shopifyAPI = require("shopify-node-api");
var priceCalc = require("./pricecalc");
var weightCalc = require("./weightcalc");
var fetch = require("node-fetch");
var { printLatestOrders } = require("./productionOrder");
var { addEmail } = require("./mailchimp");
const Sentry = require("./sentry");

const Shopify = new shopifyAPI({
  shop: "viumarqueteria", // MYSHOP.myshopify.com
  shopify_api_key: "396551abcfff904e353a6d706a706869", // Your API key
  access_token: "0e7d5ae8b3b6a7b69e709ca4c037f955", // Your API password
});

module.exports = {
  createCollection: async function (suscripcion) {
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
    let marcos = suscripcion.marcos;
    let products = [];
    for (let i = 0; i < marcos.length; i++) {
      let marco = marcos[i];
      let params = {
        product: {
          title: marco.name,
          body_html: `<p>${marco.description}</p>`,
          images: [
            {
              position: 1,
              src: await module.exports.getDisplayImage(marco.img),
            },
          ],
          tags: `editable, ${suscripcion.name}`,
          variants: [
            {
              option1: marco.name,
              sku: new Date().getTime().toString(),
              price: marco.price.toString(),
            },
          ],
        },
      };
      await new Promise((resolve, reject) => {
        Shopify.post(
          "/admin/api/stable/products.json",
          params,
          function (err, data, headers) {
            if (err) {
              console.error(err);
              Sentry.captureException(err);
              reject(err);
            }
            products.push(data.product);
            console.log("created product: ", data);
            console.log("variants", data.product.variants);
            resolve(data);
            // {
            //   product: {
            //     id: 7347421380762,
            //     title: 'a',
            //     body_html: '<p>a</p>',
            //     vendor: 'CLICK',
            //     product_type: '',
            //     created_at: '2022-05-26T10:53:48-05:00',
            //     handle: 'a',
            //     updated_at: '2022-05-26T10:53:49-05:00',
            //     published_at: '2022-05-26T10:53:48-05:00',
            //     template_suffix: null,
            //     status: 'active',
            //     published_scope: 'global',
            //     tags: '',
            //     admin_graphql_api_id: 'gid://shopify/Product/7347421380762',
            //     variants: [ [Object] ],
            //     options: [ [Object] ],
            //     images: [],
            //     image: null
            //   }
            // }
          }
        );
      });
    }

    let params = {
      custom_collection: {
        title: suscripcion.name,
        body_html: `<p>${suscripcion.description}</p>`,
        image: {
          src: await module.exports.getDisplayImage(suscripcion.img),
        },
        tags: "editable",
        collects: products.map((product) => ({ product_id: product.id })),
      },
    };

    return new Promise((resolve, reject) => {
      Shopify.post(
        "/admin/api/stable/custom_collections.json",
        params,
        function (err, data, headers) {
          if (err) {
            console.error("failed to create collection: ", err);
            Sentry.captureException(err);
            reject(err);
          }
          products.push(data);
          console.log("created coleection: ", data);
          resolve(data);
        }
      );
    });
  },
  getDisplayImage: async function (photoURL) {
    var defaultImage =
      "https://cdn.shopify.com/s/files/1/2250/9309/files/marco.png?5238";
    if (photoURL) {
      try {
        photoURL = await this.limitFilestackImageToShopifyResolution(photoURL);
      } catch (e) {
        Sentry.captureException(e);
        photoURL = defaultImage;
      }
      return photoURL;
    } else return defaultImage;
  },
  limitFilestackImageToShopifyResolution: async function (url) {
    const shopifyMaxResolution = 4472;
    const imageSizeURL =
      url.slice(0, url.lastIndexOf("/")) +
      "/imagesize" +
      url.slice(url.lastIndexOf("/"));
    try {
      const imageSizeResponse = await fetch(imageSizeURL);
      var imageSize = await imageSizeResponse.json();
    } catch (e) {
      Sentry.captureException(e);
      return e;
    }
    if (
      imageSize.width > imageSize.height &&
      imageSize.width > shopifyMaxResolution
    ) {
      const resizeURL =
        url.slice(0, url.lastIndexOf("/")) +
        "/resize=width:" +
        shopifyMaxResolution.toString() +
        url.slice(url.lastIndexOf("/"));
      return resizeURL;
    }
    if (
      imageSize.height > imageSize.width &&
      imageSize.height > shopifyMaxResolution
    ) {
      const resizeURL =
        url.slice(0, url.lastIndexOf("/")) +
        "/resize=height:" +
        shopifyMaxResolution.toString() +
        url.slice(url.lastIndexOf("/"));
      return resizeURL;
    }
    return url;
  },
  getImagesForShopify: async function (metafields) {
    var images = [];
    if (metafields.length === 1) {
      var photoUrl = JSON.parse(metafields[0].value).photo.url;
      var src = await module.exports.getDisplayImage(photoUrl);
      images.push({
        position: 1,
        src: src,
      });
    } else {
      images.push({
        position: 1,
        src: "https://marcos.clickmarqueteria.com/images/grid-gallery.png",
      });
    }
    return images;
  },
  /**
   * Replies with:
   * {"height":"50","width":"33"}  For a valid product with size metalieds.
   * {"errors":"Not Found"}        If the product does not exist
   * {}                            If the product does not have size metafields
   */
  getDimensions: function (id, callback) {
    Shopify.get(
      "/admin/products/" + id + "/metafields.json",
      function (err, data, headers) {
        if (err) {
          return callback(err);
        }

        if (data && data.metafields) {
          data = data.metafields.reduce((map, elem) => {
            if (elem.namespace === "size") {
              map[elem.key] = elem.value;
            }
            return map;
          }, {});
        }
        callback(data);
      }
    );
  },

  /**
   * Replies with
   * { "url": XXXXX }
   */
  getImageUrl: function (id, callback) {
    Shopify.get(
      "/admin/products/" + id + "/images.json",
      (err, data, headers) => {
        if (err) {
          return callback(err);
        }
        callback(null, { url: data.images[0].src });
      }
    );
  },

  /**
   * Replies with
   * { "name": XXXXX }
   */
  getName: function (id, callback) {
    Shopify.get("/admin/products/" + id + ".json", (err, data, headers) => {
      if (err) {
        return callback(err);
      }
      callback(null, { name: data.product.title });
    });
  },

  /**
   * Expects params:
   * {
   *   "priceParams": {},
   *   "idAfiche": XXXXX,
   * }
   *
   * Replies with:
   * {"precio": XXXXX }
   */
  calculatePrice: function (params, callback) {
    if (params.idAfiche != null && params.idAfiche !== "") {
      Shopify.get(
        "/admin/products/" + params.idAfiche + ".json",
        (err, data, headers) => {
          if (err) {
            return callback(err);
          }

          var price = data.product.variants[0].price;
          var priceParams = params.priceParams;
          priceParams.precioBase = price;

          this.getDimensions(params.idAfiche, (dimensions) => {
            if (dimensions.width != null && dimensions.height != null) {
              priceParams.ancho = dimensions.width;
              priceParams.alto = dimensions.height;
            }
            var price = priceCalc(params.priceParams);
            console.log(price);
            price === 0
              ? callback(new Error("Price is zero"))
              : callback(null, price);
          });
        }
      );
    } else {
      var price = priceCalc(params.priceParams);
      console.log(price);
      price === 0
        ? callback(new Error("Price is zero"))
        : callback(null, price);
    }
  },

  /**
   * Posts a new product!
   * Expects params:
   * {
      "product": {
        "title": name,
        "body_html": "XXXX"
        "variants": [{ "price": XXXX, "sku": XXXX, "option3":marcos, "cm3":XXXX }]
   * }
   */
  postProduct: async function (params, callback) {
    params.product.images = await this.getImagesForShopify(
      params.product.metafields
    );
    params.product.product_type = "simulador";
    params.product.vendor= "CLICK";
    params.product.status = "active";
    Shopify.post("/admin/products.json", params, function (err, data, headers) {
      if (err) {
        return callback(err);
      }
      callback(null, data);
    });
  },
  /**
   * Calculates Weight
   */
  calculateWeight: function (params, callback) {
    console.log(weightCalc(params.weightParams));
    callback(weightCalc(params.weightParams));
  },
  /**
   * Called by webhook when order is paid
   * @param {*} params
   * @param {function} callback
   */
  orderPaid: async function (params, callback) {
    console.log(params);
    try {
      const uploads = await printLatestOrders();
      callback(null, uploads);
    } catch (e) {
      Sentry.captureException(e);
      callback(e);
    }
  },
  /**
   * Called with email and stock to generate alert when back in stock
   * Expect object of type {email_address, stockRequest}
   */
  alertSignUp: async function (params, callback) {
    console.log(params);
    try {
      const res = await addEmail(params);
      callback(null, res);
    } catch (e) {
      Sentry.captureException(e);
      callback(e);
    }
  },
};
