const { connectMongo } = require("../db/mongo");
const Product = require("../models/Product");

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end("Method Not Allowed");
  }

  try {
    await connectMongo();
    const products = await Product.find({});
    res.status(200).json({
      message: "Products fetched successfully",
      data: products.map((product) => ({
        id: product._id.toString(),
        ...product.toObject(),
      })),
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getProductsHandler: handler,
};
