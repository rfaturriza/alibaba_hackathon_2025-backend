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

        Food Name: ${title}
        Description: ${description}

        On the mentioned image and food description: 
        0. Do not explain anything
        1. You have to specify each nutrition that existed on the food
        2. Please only answer the total nutritions calculation with it's value and also add for additional info that might be great
        3. Allergic or something else are allowed.
        4. Please use this format: '
        {
        "calory": "nutrition_value",
        "protein": "nutrition_value",
        "carbohydrate": "nutrition_value",
        "fat": "nutrition_value",
        "sugar": "nutrition_value",
        "fiber": "nutrition_value",
        "allergen_potential": "nutrition_value"
        }
        '
        5. For the nutrition_value, please use the appropriate unit such as "g", "mg", "kcal", etc.
        6. Please do not add any other text or explanation
        7. Do not use any markdown or code block format
        8. example output:
        {
        "calory": "500 kcal",
        "protein": "20 g",
        "carbohydrate": "70 g",
        "fat": "15 g",
        "sugar": "5 g",
        "fiber": "3 g",
        "allergen_potential": "gluten, egg, nuts"
        }
        9. must be in JSON format can be parsed by JSON.parse()

        Thanks for your help!
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
                {
                  type: "image_url",
                  image_url: {
                    // url: "https://i.gojekapi.com/darkroom/gofood-indonesia/v2/images/uploads/63137a09-ec63-473b-a123-0cb44071acfc_menu-item-image_1630457203193.jpg",
                    url: imageUrls[0], // Use the first image URL for nutrition analysis
                  },
                },
              ],
            },
          ],
        })
        .catch((error) => {
          console.error("OpenAI API error:", error);
          return res.status(500).json({ error: "OpenAI API error" });
        });
      let nutrition = {};
      try {
        console.log("OpenAI response:", completion.choices[0].message.content);
        nutrition = JSON.parse(completion.choices[0].message.content);
      } catch (e) {
        console.error(
          "Failed to parse nutrition info:",
          completion.choices[0].message.content
        );
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
