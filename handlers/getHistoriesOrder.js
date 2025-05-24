const { connectMongo } = require("../db/mongo");
const Order = require("../models/Order");
// Ensure Product model is registered before using populate
require("../models/Product");

async function getHistoriesOrderHandler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    await connectMongo();
    const histories = await Order.find({ user_id })
      .sort({ createdAt: -1 })
      .populate("product");
    console.log("Order histories fetched:", histories);

    res.status(200).json({
      message: "Order histories fetched successfully",
      data: histories.map((order) => {
        const { product, ...orderData } = order.toObject();
        return {
          order_id: order._id.toString(),
          ...orderData,
          product: {
            id: product._id.toString(),
            ...product,
          },
        };
      }),
    });
  } catch (error) {
    console.error("Failed to get order histories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { getHistoriesOrderHandler };
