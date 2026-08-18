import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    otp: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 600, // Automatically deletes document from DB after 10 minutes (600 seconds)
    },
  },
  { timestamps: true }
);

const OTP = mongoose.model('OTP', otpSchema);

export default OTP;
