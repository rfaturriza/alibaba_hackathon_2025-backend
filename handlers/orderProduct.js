const { connectMongo } = require("../db/mongo");
const Product = require("../models/Product");
const Order = require("../models/Order");

const NUTRIENT_LIMITS = {
  kalori: 2000,
  lemak: 70,
  "lemak jenuh": 20,
  gula: 50,
  garam: 2000,
  kolesterol: 300,
  karbohidrat: 300,
  protein: 60,
};

async function getTodayNutritionTotal(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    user_id: userId,
    created_at: { $gte: start, $lte: end },
  });

  const total = {
    kalori: 0,
    lemak: 0,
    "lemak jenuh": 0,
    gula: 0,
    garam: 0,
    kolesterol: 0,
    karbohidrat: 0,
    protein: 0,
  };

  for (const order of orders) {
    for (const key in total) {
      if (order.gizi?.[key]) total[key] += Number(order.gizi[key]);
    }
  }

  return total;
}

function checkLimitExceeded(nutritionTotal, newNutrition) {
  const exceeded = [];
  for (const key in NUTRIENT_LIMITS) {
    const totalToday = (nutritionTotal[key] || 0) + (newNutrition[key] || 0);
    if (totalToday > NUTRIENT_LIMITS[key]) {
      exceeded.push({
        param: key,
        total: totalToday,
        limit: NUTRIENT_LIMITS[key],
      });
    }
  }
  return exceeded;
}

function generateAlertText(exceeded) {
  return exceeded
    .map(
      (e) =>
        `⚠️ ${e.param.toUpperCase()} sudah melebihi batas harian. Total: ${
          e.total
        }, Batas: ${e.limit}`
    )
    .join("\n");
}

async function orderProductHandler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  const { product_id, user_id } = req.body;
  try {
    await connectMongo();
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const nutritionToday = await getTodayNutritionTotal(user_id);
    const exceeded = checkLimitExceeded(nutritionToday, product.gizi);
    if (exceeded.length > 0) {
      const message = generateAlertText(exceeded);
      return res.status(200).json({ alert: true, message, exceeded });
    }
    // Save order
    const order = new Order({
      title: product.title,
      description: product.description,
      price: product.price,
      gizi: product.gizi,
      user_id,
      created_at: new Date(),
    });
    await order.save();
    res.status(201).json({
      success: true,
      data: order,
      message: "Order placed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { orderProductHandler };
