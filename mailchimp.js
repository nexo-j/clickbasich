const Sentry = require('./sentry')
const crypto = require('crypto')
var fetch = require('node-fetch')

const mailchimp = {
  baseURL: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/',
  headers: {
    Authorization: 'Basic YW55c3RyaW5nOmE3MDNmOWVjNmNiYjI5MTNmMjJlMjFhZjdkMmYxYWNhLXVzMTI=',
    'Content-Type': 'application/json'
  }
}

var segments = getSegments()

async function getSegments () {
  try {
    var rawResponse = await fetch(mailchimp.baseURL + 'segments', {
      method: 'GET',
      headers: mailchimp.headers
    })
    var segments = []
    rawResponse.json().segments.forEach((segment) => {
      segments.push({ id: segment.id, name: segment.name })
    })
    return segments
  } catch (e) {
    Sentry.captureException(e)
  }
}

async function addEmail (params) {
  console.log('Adding email', params)
  try {
    var response = await fetch(mailchimp.baseURL + 'members/', {
      method: 'POST',
      headers: mailchimp.headers,
      body: JSON.stringify({
        email_address: params.email_address,
        status: 'subscribed',
        merge_fields: { STOCK: params.stock },
        tags: [params.stock]
      })
    })
    if (response.status === 400) {
      console.log('Error 400, trying to update contact')
      // const updateResponse = await updateEmail(params)
      const tagUpdateResponse = await addTag(params)

      return tagUpdateResponse.json()
      // return updateResponse.json()
    }
    if (response.status === 200) {
      console.log('Added succesfully')
      return response.json()
    }
    console.log('Failed to add email')
    return response
  } catch (e) {
    Sentry.captureException(e)
    return e
  }
}

async function updateEmail (params) {
  const emailHash = crypto.createHash('md5').update(params.email_address).digest('hex')
  return await fetch(mailchimp.baseURL + 'members/' + emailHash, {
    method: 'PATCH',
    headers: mailchimp.headers,
    body: JSON.stringify({
      status: 'subscribed',
      merge_fields: { STOCK: params.stock }
    })
  })
}

async function addTag (params) {
  console.log('Trying to add tag to email: ', params)
  const emailHash = crypto.createHash('md5').update(params.email_address).digest('hex')
  return await fetch(mailchimp.baseURL + 'members/' + emailHash + '/tags/', {
    method: 'POST',
    headers: mailchimp.headers,
    body: JSON.stringify({
      tags: [
        {
          name: params.stock,
          status: 'active'
        }
      ],
      is_syncing: false
    })
  })
}

/* addEmail({
  email_address: 'asdfasdf22@criadoperez.com',
  stock: 'Madera Clara 7cm'
}).then(result=>console.log(result)) */

module.exports = { addEmail }
