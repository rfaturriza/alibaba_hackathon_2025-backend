const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    price: Number,
    nutrition: {
      calory: String,
      protein: String,
      carbohydrate: String,
      fat: String,
      sugar: String,
      fiber: String,
      allergen_potential: String,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
    },
    user_id: String,
  },
  { timestamps: true },
  { collection: "orders" }
);

module.exports = mongoose.models.Order || mongoose.model("Orders", OrderSchema);
