import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema({
  shopName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  shopAddress: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const hashed = await bcrypt.hash(this.password, 12);
    this.password = hashed;
    next();
  } catch (err) {
    next(err);
  }
});

userSchema.methods.comparePassword = function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model('User', userSchema);
