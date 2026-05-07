var { addEmail } = require('./mailchimp')

const resultFromPablo1 = {
  id: 'dcfcd2a7a84be457610378ae3e30954c',
  email_address: 'pablo1@criadoperez.com',
  unique_email_id: 'dde0ec832e',
  web_id: 366629465,
  email_type: 'html',
  status: 'subscribed',
  merge_fields: {
    FNAME: '',
    LNAME: '',
    ADDRESS: '',
    PHONE: '',
    BIRTHDAY: '',
    COMPANY: '',
    STOCK: 'Test Material'
  },
  interests: {
    '09c11586f4': false,
    '094eb759d9': false,
    b3dbdfd996: false,
    ff648aa95c: false
  },
  stats: {
    avg_open_rate: 0,
    avg_click_rate: 0,
    ecommerce_data: {
      total_revenue: 0,
      number_of_orders: 0,
      currency_code: 'USD'
    }
  },
  ip_signup: '',
  timestamp_signup: '',
  ip_opt: '79.145.124.253',
  timestamp_opt: '2020-07-17T01:09:32+00:00',
  member_rating: 2,
  last_changed: '2020-07-18T15:17:30+00:00',
  language: '',
  vip: false,
  email_client: '',
  location: {
    latitude: 0,
    longitude: 0,
    gmtoff: 0,
    dstoff: 0,
    country_code: '',
    timezone: ''
  },
  source: 'API - Generic',
  tags_count: 1,
  tags: [
    {
      id: 4058317,
      name: 'outOfStock1'
    }
  ],
  list_id: '6ea2544937',
  _links: [
    {
      rel: 'self',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c',
      method: 'GET',
      targetSchema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json'
    },
    {
      rel: 'parent',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members',
      method: 'GET',
      targetSchema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/CollectionResponse.json',
      schema: 'https://us12.api.mailchimp.com/schema/3.0/CollectionLinks/Lists/Members.json'
    },
    {
      rel: 'update',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c',
      method: 'PATCH',
      targetSchema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json',
      schema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/PATCH.json'
    },
    {
      rel: 'upsert',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c',
      method: 'PUT',
      targetSchema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Response.json',
      schema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/PUT.json'
    },
    {
      rel: 'delete',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c',
      method: 'DELETE'
    },
    {
      rel: 'activity',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c/activity',
      method: 'GET',
      targetSchema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Activity/Response.json'
    },
    {
      rel: 'goals',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c/goals',
      method: 'GET',
      targetSchema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Goals/Response.json'
    },
    {
      rel: 'notes',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c/notes',
      method: 'GET',
      targetSchema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Notes/CollectionResponse.json'
    },
    {
      rel: 'events',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c/events',
      method: 'POST',
      targetSchema: 'https://us12.api.mailchimp.com/schema/3.0/Definitions/Lists/Members/Events/POST.json'
    },
    {
      rel: 'delete_permanent',
      href: 'https://us12.api.mailchimp.com/3.0/lists/6ea2544937/members/dcfcd2a7a84be457610378ae3e30954c/actions/delete-permanent',
      method: 'POST'
    }
  ]
}

describe('Out Of stock Sign up', () => {
  test('Try new email', async () => {
    const params = {
      email_address: Math.random() * 1000 + '@criadoperez.com',
      stock: 'Test Material'
    }
    const result = await addEmail(params)
    expect(result).toEqual(resultFromPablo1)
  }),
  test('Try existing email', async () => {
    const params = {
      email_address: 'pablo@criadoperez.com',
      stock: 'Test Material'
    }
    const result = await addEmail(params)
    expect(result).toEqual(resultFromPablo1)
  })
})
