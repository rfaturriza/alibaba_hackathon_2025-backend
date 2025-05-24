const { connectMongo } = require("../db/mongo");
const Order = require("../models/Order");

async function getHistoriesOrderHandler(req, res) {
  if (req.method !== "GET") return res.status(405).send("Method Not Allowed");

  const { user_id } = req.query;

  if (!user_id) {
    return res.status(400).json({ error: "user_id is required" });
  }

  try {
    await connectMongo();
    const histories = await Order.find({ user_id }).sort({ created_at: -1 });

    res.status(200).json({
      message: "Order histories fetched successfully",
      data: histories,
    });
  } catch (error) {
    console.error("Failed to get order histories:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { getHistoriesOrderHandler };
