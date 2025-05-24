const { connectMongo } = require("../db/mongo");
const Product = require("../models/Product");
const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || undefined,
});

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).end("Method Not Allowed");
  }

  const queryPrompt = req.query.prompt || "";
  console.log("Query Prompt:", queryPrompt);
  if (!queryPrompt) {
    return res.status(400).json({ error: "Prompt is required" });
  }

  try {
    await connectMongo();
    const products = await Product.find({});
    const instructions = `
      User Need: ${queryPrompt}

      Instruction:

      1. Do not answer if the prompt outside the content of database
      2. You have to arrange the product that good to have by user based on price and daily recommended calory/nutrition.
      3. The users will give their budget info and how many product they want, you have to follow these information so that the product will not exceed the budget. product quantity and nutrition limit.
      4. If the budget is too low or there is no possible product that meet user requirement, simply return an empty array or minimum product that meet the requirement.
      5. Return your answer in strict JSON format only: [{product}, {product}, ...].
      6. Do not include any extra text or markdown formatting.
      7. Only output valid JSON.
    `;
    const completion = await openai.chat.completions
      .create({
        model: "qwen-plus-latest",
        messages: [
          {
            role: "user",
            content:
              "You are given food and drink database that you have to learn and understand. Here is the database: ",
          },
          {
            role: "user",
            content: JSON.stringify(products),
          },
          {
            role: "user",
            content: instructions,
          },
        ],
      })
      .catch((error) => {
        console.error("OpenAI API error:", error);
        return res.status(500).json({ error: "OpenAI API error" });
      });

    let result;
    if (completion.choices && completion.choices.length > 0) {
      const response = completion.choices[0].message.content;
      try {
        result = JSON.parse(response);
      } catch (parseError) {
        console.error("JSON parse error:", parseError);
        return res
          .status(400)
          .json({ error: "Invalid JSON response from OpenAI" });
      }
    }
    res.status(200).json({
      message: "Products fetched successfully",
      data: result || [],
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

module.exports = {
  getProductsPromptHandler: handler,
};
