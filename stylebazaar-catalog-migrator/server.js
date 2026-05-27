const express = require('express');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const path = require("path");
const sqlite3 = require('sqlite3').verbose();
const serveStatic = require("serve-static");
const { readFileSync } = require('fs');
const { setupFdk } = require("@gofynd/fdk-extension-javascript/express");
const { SQLiteStorage } = require("@gofynd/fdk-extension-javascript/express/storage");
const sqliteInstance = new sqlite3.Database('session_storage.db');
const productRouter = express.Router();
const registerHsnCodes = require("./test/utils/registerHsn");

const fdkExtension = setupFdk({
    api_key: process.env.EXTENSION_API_KEY,
    api_secret: process.env.EXTENSION_API_SECRET,
    base_url: process.env.EXTENSION_BASE_URL,
    cluster: process.env.FP_API_DOMAIN,
    callbacks: {
        auth: async (req) => {
            
            if (req.query.application_id)
                return `${req.extension.base_url}/company/${req.query['company_id']}/application/${req.query.application_id}`;
            else
                return `${req.extension.base_url}/company/${req.query['company_id']}`;
        },
        
        uninstall: async (req) => {
           
        }
    },
    storage: new SQLiteStorage(sqliteInstance,"exapmple-fynd-platform-extension"), // add your prefix
    access_mode: "online",
    webhook_config: {
        api_path: "/api/webhook-events",
        notification_email: "useremail@example.com",
        event_map: {
            "company/product/delete": {
                "handler": (eventName) => {  console.log(eventName)},
                "version": '1'
            }
        }
    },
});

const STATIC_PATH = process.env.NODE_ENV === 'production'
    ? path.join(process.cwd(), 'frontend', 'dist')
    : path.join(process.cwd(), 'frontend');
    
const app = express();
const platformApiRoutes = fdkExtension.platformApiRoutes;

app.use(cookieParser("ext.session"));

app.use(bodyParser.json({
    limit: '2mb'
}));

app.use(serveStatic(STATIC_PATH, { index: false }));
app.use("/api", platformApiRoutes);

app.use("/", fdkExtension.fdkHandler);
app.post('/api/webhook-events', async function(req, res) {
    try {
      console.log(`Webhook Event: ${req.body.event} received`)
      await fdkExtension.webhookRegistry.processWebhook(req);
      return res.status(200).json({"success": true});
    } catch(err) {
      console.log(`Error Processing ${req.body.event} Webhook`);
      return res.status(500).json({"success": false});
    }
})

productRouter.get('/', async function view(req, res, next) {
    try {
        const {
            platformClient
        } = req;
        const data = await platformClient.catalog.getProducts()
        return res.json(data);
    } catch (err) {
        next(err);
    }
});

productRouter.get('/application/:application_id', async function view(req, res, next) {
    try {
        const {
            platformClient
        } = req;
        const { application_id } = req.params;
        const data = await platformClient.application(application_id).catalog.getAppProducts()
        return res.json(data);
    } catch (err) {
        next(err);
    }
});

platformApiRoutes.use('/products', productRouter);

const fs = require("fs");

const transformProducts = require("./transformer/transformer");
platformApiRoutes.post('/run-migration', async (req, res) => {
    try {
        const { platformClient } = req;
        const filePath = path.join(
            __dirname,
            "./sample-data/legacy-products.json"
        );

        const rawData = fs.readFileSync(filePath);

        const jsonData = JSON.parse(rawData);

        await registerHsnCodes(
            platformClient,
            jsonData.products
        );
        const transformedProducts = transformProducts(jsonData);
        const createdProducts = [];

for (const product of transformedProducts) {

    try {

        const payload = product;
        

        const createdProduct =
           await platformClient.catalog.createProduct({
        body: payload
        });

        createdProducts.push(createdProduct);

    } catch (err) {

        console.error(
            `Failed to create ${product.item_code}`,
            err.response?.data || err.message
        );
    }
}

        return res.status(200).json({
        success: true,
        transformed_products: transformedProducts.length,
        created_products: createdProducts.length
});

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Migration failed",
            error: error.message,
        });
    }
});

if (process.env.NODE_ENV === "production") {

    app.get('*', (req, res) => {
        return res
        .status(200)
        .set("Content-Type", "text/html")
        .send(readFileSync(path.join(STATIC_PATH, "index.html")));
    });

}

module.exports = app;
