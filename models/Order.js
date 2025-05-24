const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema(
  {
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
