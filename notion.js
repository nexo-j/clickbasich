/* ================================================================================
	database-update-send-email.
  
  Glitch example: https://glitch.com/edit/#!/notion-database-email-update
  Find the official Notion API client @ https://github.com/makenotion/notion-sdk-js/
================================================================================ */

const { Client } = require("@notionhq/client");
const dotenv = require("dotenv");
const sendgridMail = require("@sendgrid/mail");

dotenv.config();
sendgridMail.setApiKey(process.env.SENDGRID_KEY);
const notion = new Client({ auth: process.env.NOTION_KEY });

const databaseId = process.env.NOTION_DATABASE_ID;

var shopifyAPI = require("shopify-node-api");
const Shopify = new shopifyAPI({
  shop: "viumarqueteria", // MYSHOP.myshopify.com
  shopify_api_key: "396551abcfff904e353a6d706a706869", // Your API key
  access_token: "0e7d5ae8b3b6a7b69e709ca4c037f955", // Your API password
});

/**
 * Local map to store task pageId to its last status.
 * { [pageId: string]: string }
 */
const taskPageIdToStatusMap = {};

/**
 * Initialize local data store.
 * Then poll for changes every 5 seconds (5000 milliseconds).
 */


module.exports = () => {
  setInitialTaskPageIdToStatusMap().then(() => {
  setInterval(findAndSendEmailsForUpdatedTasks, 5000);
})
};

/**
 * Get and set the initial data store with tasks currently in the database.
 */
async function setInitialTaskPageIdToStatusMap() {
  const currentTasks = await getTasksFromNotionDatabase();
  for (const { pageId, status } of currentTasks) {
    taskPageIdToStatusMap[pageId] = status;
  }
}

async function findAndSendEmailsForUpdatedTasks() {
  // Get the tasks currently in the database.
  console.log("\nFetching tasks from Notion DB...");
  const currentTasks = await getTasksFromNotionDatabase();

  // Return any tasks that have had their status updated.
  const updatedTasks = findUpdatedTasks(currentTasks);
  console.log(`Found ${updatedTasks.length} updated tasks.`);

  // For each updated task, update taskPageIdToStatusMap and send an email notification.
  for (const task of updatedTasks) {
    taskPageIdToStatusMap[task.pageId] = task.status;
    let order = await sendUpdateToShopify(
      task,
      `El estado del pedido se ha actualizado a ${task.status}`
    );
    var response = await sendUpdateEmailWithSendgrid(task, order);
    if (response) {
      await sendUpdateToShopify(
        task,
        "Se ha enviado un email del nuevo estado al cliente"
      );
    }
  }
}

/**
 * Gets tasks from the database.
 *
 * @returns {Promise<Array<{ pageId: string, status: string, title: string }>>}
 */
async function getTasksFromNotionDatabase() {
  const pages = [];
  let cursor = undefined;

  while (true) {
    const { results, next_cursor } = await notion.databases.query({
      database_id: databaseId,
      start_cursor: cursor,
    });
    pages.push(...results);
    if (!next_cursor) {
      break;
    }
    cursor = next_cursor;
  }
  console.log(`${pages.length} pages successfully fetched.`);
  return pages.map((page) => {
    const statusProperty = page.properties["Estado Marcos"];
    const status =
      statusProperty && statusProperty.select
        ? statusProperty.select.name
        : "Sin Estado";
    const title = page.properties["Pedido"].title
      .map(({ plain_text }) => plain_text)
      .join("");
    const orderId = page.properties["order id"].number;
    return {
      pageId: page.id,
      status,
      title,
      orderId,
    };
  });
}

/**
 * Compares task to most recent version of task stored in taskPageIdToStatusMap.
 * Returns any tasks that have a different status than their last version.
 *
 * @param {Array<{ pageId: string, status: string, title: string }>} currentTasks
 * @returns {Array<{ pageId: string, status: string, title: string }>}
 */
function findUpdatedTasks(currentTasks) {
  return currentTasks.filter((currentTask) => {
    const previousStatus = getPreviousTaskStatus(currentTask);
    return currentTask.status !== previousStatus;
  });
}

/**
 * Sends task update notification using Sendgrid.
 *
 * @param {{ status: string, title: string }} task
 */
async function sendUpdateEmailWithSendgrid({ title, status }, order) {
  const message = `Status of Notion task ("${title}") has been updated to "${status}".`;
  console.log("sending email to: ", order.order.email);

  try {
    // Send an email about this change.
    await sendgridMail.send({
      to: order.order.email, // check this
      from: "hola@clickmarqueteria.com",
      subject: "Su pedido se ha actualizado",
      templateId: "d-cebee3f7d7314a8b8e5db03c623f265",
      dynamicTemplateData: {
        order: order.order,
        status: status,
      },
    });
    console.log("Email Sent");
  } catch (error) {
    console.error(error.response.body.errors);
  }
}

/**
 * Sends task update as fulfilment to Shopify.
 *
 * @param {{ status: string, title: string, orderId: number }} task
 */
async function sendUpdateToShopify({ title, status, orderId }, note) {
  var body = {
    order: {
      id: orderId,
      //tags: status,
      note: note,
      //"note_attributes": [{"name":"colour","value":"green"}]
    },
  };
  // get customer email
  console.log("updating order: " + body);
  return new Promise((resolve, reject) => {
    Shopify.put(
      `/admin/api/stable/orders/${orderId}.json`,
      body,
      function (err, data, headers) {
        if (err) {
          console.error("error sendUpdateToShopify(): " + err);
          reject(err);
          return err;
        }
        console.log("order updated succesfully:");
        resolve(data);
        return data;
      }
    );
  });
}

/**
 * Finds or creates task in local data store and returns its status.
 * @param {{ pageId: string; status: string }} task
 * @returns {string}
 */
function getPreviousTaskStatus({ pageId, status }) {
  // If this task hasn't been seen before, add to local pageId to status map.
  if (!taskPageIdToStatusMap[pageId]) {
    taskPageIdToStatusMap[pageId] = status;
  }
  return taskPageIdToStatusMap[pageId];
}
