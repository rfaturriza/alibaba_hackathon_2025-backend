const mongoose = require("mongoose");

const ProductSchema = new mongoose.Schema(
  {
    images_url: {
      type: [String],
      required: true,
      validate: {
        validator: function (v) {
          return v.length > 0;
        },
        message: "At least one image URL is required",
      },
    },
    title: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    nutrition: {
      calory: String,
      protein: String,
      carbohydrate: String,
      fat: String,
      sugar: String,
      fiber: String,
      allergen_potential: String,
    },
    merchant_id: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Product || mongoose.model("Products", ProductSchema);
