const mongoose = require("mongoose"); 


const Property = mongoose.model(
  "Property",
  new mongoose.Schema(
    {
      society: {
        type: String,
        required: true,
      },
      name: {
        type: String,
        required: true,
      },

      category: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      price: {
        type: Number,
        required: true,
      },
      image: {
        type: String,
        required: true,
      },
      isFeatured: {
        type: Boolean,
        default: false,
      },
    },
    { timestamps: true }
  )
);
module.exports = Property