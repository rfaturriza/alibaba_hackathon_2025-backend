// create entry init for node.js app
const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const { connectMongo } = require("./db/mongo");
const dotenv = require("dotenv");
const path = require("path");
const { getProductsHandler } = require("./handlers/getProducts");
const { createProductHandler } = require("./handlers/createProduct");
const { orderProductHandler } = require("./handlers/orderProduct");
const { getHistoriesOrderHandler } = require("./handlers/getHistoriesOrder");
const { getProductsPromptHandler } = require("./handlers/getProductsPrompt");

dotenv.config();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectMongo()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1);
  });

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
// Serve static files from the /static directory (for image uploads)
app.use("/static", express.static(path.join(__dirname, "static")));
// API routes
app.get("/api", (_, res) => {
  res.json({ message: "I am a live" });
});
app.get("/api/products", getProductsHandler);
app.post("/api/products", createProductHandler);
app.post("/api/order", orderProductHandler);
app.get("/api/histories", getHistoriesOrderHandler);
app.get("/api/products-prompt", getProductsPromptHandler);

// Render create product form
app.get("/create-product", (req, res) => {
  res.render("create-product", {
    error: null,
    success: null,
    title: "",
    description: "",
    price: "",
    merchant_id: "",
    preview: [],
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

// Export the app for testing
module.exports = app;
