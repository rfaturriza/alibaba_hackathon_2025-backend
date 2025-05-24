// file: api/addProduct.js
const { connectMongo } = require("../db/mongo");
const Product = require("../models/Product");
const upload = require("../utils/upload");
const { OpenAI } = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_API_BASE_URL || undefined,
});

async function createProductHandler(req, res) {
  if (req.method !== "POST") return res.status(405).end("Method Not Allowed");

  try {
    await connectMongo();
    // Use multer to handle multiple file uploads
    upload.array("images", 10)(req, res, async function (err) {
      if (err) return res.status(400).json({ error: "Image upload failed" });
      const { title, description, price, merchant_id } = req.body;
      const imageFiles = req.files;
      if (
        !imageFiles ||
        imageFiles.length === 0 ||
        !title ||
        !description ||
        !price
      ) {
        return res.status(400).json({ error: "Missing required fields" });
      }
      const imageUrls = imageFiles.map(
        (f) => `${process.env.BASE_URL}/static/${f.filename}`
      );
      console.log("Image URLs:", imageUrls);
      // Check if the product already exists
      const existingProduct = await Product.findOne({ title });
      if (existingProduct) {
        return res.status(400).json({ error: "Product already exists" });
      }
      // Prompt generation to get nutrition info
      const prompting = `
        You are a master nutritionist that will be asked to determine food nutrition based on Image and food description. Here is the info:

        Food Name: Fried Rice
        Description: Nasi goreng lengkap dengan ayam goreng tepung 1 potong, telur mata sapi 1 butir, dan sayur timun selada, serta sambal cabai merah

        On the mentioned image and food description: 
        0. Do not explain anything
        1. You have to specify each nutrition that existed on the food
        2. Please only answer the total nutritions calculation with it's value and also add for additional info that might be great
        3. Allergic or something else are allowed.
        4. Please use this format: '{"calory": "nutrition value", "protein": "nutrition value", "fat": "nutrition value", "carbohydrate": "nutrition value", "fiber": "nutrition value", "sugar": "nutrition value", "sodium": "nutrition value", "cholesterol": "nutrition value", "allergic_potential": "nutrition value", "additional_info": "nutrition value"}'
        5. For the nutrition value, please use the appropriate unit such as "g", "mg", "kcal", etc.
        6. Please do not add any other text or explanation
        7. Do not use any markdown or code block format

        Thanks for your help!
      `;
      const completion = await openai.chat.completions.create({
        model: "qwen-vl-max",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: prompting,
              },
              {
                type: "image_url",
                image_url: {
                  //   url: "https://i.gojekapi.com/darkroom/gofood-indonesia/v2/images/uploads/63137a09-ec63-473b-a123-0cb44071acfc_menu-item-image_1630457203193.jpg",
                  url: imageUrls[0], // Use the first image URL for nutrition analysis
                },
              },
            ],
          },
        ],
      });
      if (
        !completion ||
        !completion.choices ||
        completion.choices.length === 0
      ) {
        return res.status(500).json({ error: "Failed to get nutrition info" });
      }
      let nutrition = {};
      try {
        nutrition = JSON.parse(completion.choices[0].message.content);
      } catch (e) {
        return res
          .status(500)
          .json({ error: "Failed to parse nutrition info" });
      }
      // Save product to DB
      const newProduct = new Product({
        images_url: imageUrls,
        title,
        description,
        price,
        nutrition,
        merchant_id: merchant_id || null,
      });
      await newProduct.save();
      return res
        .status(201)
        .json({ message: "Product added", data: newProduct });
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Server error" });
  }
}

module.exports = { createProductHandler };
