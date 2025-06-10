import mongoose from "mongoose";

const customerSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  address: { type: String },
  medicineName: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  totalPrice: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
