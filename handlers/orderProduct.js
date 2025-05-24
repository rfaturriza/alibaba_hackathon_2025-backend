const { connectMongo } = require("../db/mongo");
const Product = require("../models/Product");
const Order = require("../models/Order");
const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || undefined,
});

async function generateOrderedToday(userId) {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const orders = await Order.find({
    user_id: userId,
    createdAt: { $gte: start, $lte: end },
  });
  let result = "";

  for (const order of orders) {
    const nutrition = order.product.nutrition;
    const title = order.product.title;
    result += `Food Name: ${title}\nFood Nutrition Information: ${JSON.stringify(
      nutrition
    )}\n\n`;
  }
  return result;
}

async function orderProductHandler(req, res) {
  if (req.method !== "POST") return res.status(405).send("Method Not Allowed");
  const { product_id, user_id, force_order } = req.body;
  try {
    await connectMongo();
    const product = await Product.findById(product_id);
    if (!product) return res.status(404).json({ error: "Product not found" });
    const nutritionToday = await generateOrderedToday(user_id);
    const prompting = `
        You are a master nutritionist tasked with evaluating a user's food intake based on the following food nutrition information for today:

        ${nutritionToday}

        Instructions:  
        0. Do not explain your process.  
        1. Analyze and sum up all the nutrition values from the listed foods.  
        2. Compare the totals with the following daily recommended nutrition limits (based on WHO & CDC):
        - Calory: 2000 kcal  
        - Protein: 50 g  
        - Fat: 70 g  
        - Carbohydrate: 275 g  
        - Fiber: 28 g  
        - Sugar: 50 g  
        - Sodium: 2300 mg  
        - Cholesterol: 300 mg  
        3. Based on your analysis, determine if the user **exceeds** any of these limits.  
        4. Return your answer in **strict JSON format only**:  
        {"message": "your explanation and suggestion to alert user", "alert": boolean}  
        - The "message" must clearly explain which limits are exceeded and any potential health concerns.  
        - The "alert" field must be "true" if any daily limit is exceeded, otherwise "false".  
        5. Do not include any extra text or markdown formatting.  
        6. Only output valid JSON.
    `;

    const completion = await openai.chat.completions
      .create({
        model: "qwen-vl-max",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompting,
              },
            ],
          },
        ],
      })
      .catch((error) => {
        console.error("OpenAI API error:", error);
        return res.status(500).json({ error: "OpenAI API error" });
      });
    const response = completion.choices[0].message.content;
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(response);
    } catch (error) {
      console.error("Failed to parse OpenAI response:", error);
      return res.status(500).json({ error: "Failed to parse OpenAI response" });
    }

    if (parsedResponse.alert && !force_order) {
      console.warn("Daily nutrition limits exceeded:", parsedResponse.message);
      return res.status(400).json({
        error: "Daily nutrition limits exceeded",
        message: parsedResponse.message,
      });
    }
    // Save order
    const order = new Order({
      product,
      user_id,
    });

    await order.save();
    res.status(201).json({
      success: true,
      data: {
        order_id: order._id,
        ...order.toObject(),
      },
      message: "Order placed successfully",
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = { orderProductHandler };
