import userRepository from '../repositories/userRepository.js';
import OTP from '../models/Otp.js';
import sendEmail from '../utils/sendEmail.js';
import generateToken from '../utils/generateToken.js';
import AppError from '../utils/appError.js';

// @desc    Step 1: Request OTP for email verification
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide an email address', 400));
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email is already registered in the system', 409));
    }

    // Generate 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any previous unused OTPs for this email
    await OTP.deleteMany({ email });

    // Save new OTP
    await OTP.create({
      email,
      otp: generatedOTP,
    });

    // Send email with OTP
    await sendEmail({
      email,
      subject: 'Your Account Verification OTP Code',
      message: `Your verification code is ${generatedOTP}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Verification Code</h2>
          <p>Thank you for signing up. Use the OTP code below to verify your email address:</p>
          <h1 style="color: #4CAF50; letter-spacing: 4px;">${generatedOTP}</h1>
          <p style="color: #777;">This code is valid for 10 minutes.</p>
        </div>
      `,
    });

    res.status(200).json({
      status: 'success',
      message: `Verification OTP sent to ${email}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Resend OTP for email verification
// @route   POST /api/auth/resend-otp
// @access  Public
export const resendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide an email address', 400));
    }

    // Check if user already exists
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email is already registered in the system', 409));
    }

    // Optional: Cooldown check (prevent spamming resend within 30 seconds)
    const recentOTP = await OTP.findOne({ email });
    if (recentOTP) {
      const timeElapsed = (Date.now() - new Date(recentOTP.createdAt).getTime()) / 1000;
      if (timeElapsed < 30) {
        const remaining = Math.ceil(30 - timeElapsed);
        return next(
          new AppError(`Please wait ${remaining} seconds before requesting a new OTP`, 429)
        );
      }
    }

    // Generate fresh 6-digit OTP
    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    // Remove old OTP records for this email
    await OTP.deleteMany({ email });

    // Save newly generated OTP
    await OTP.create({
      email,
      otp: generatedOTP,
    });

    // Send email with new OTP
    await sendEmail({
      email,
      subject: 'Resent OTP Verification Code',
      message: `Your new verification code is ${generatedOTP}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">New Verification Code</h2>
          <p>You requested a new verification code. Use the OTP code below to verify your email address:</p>
          <h1 style="color: #4CAF50; letter-spacing: 4px;">${generatedOTP}</h1>
          <p style="color: #777;">This code is valid for 10 minutes.</p>
        </div>
      `,
    });

    res.status(200).json({
      status: 'success',
      message: `A new verification OTP has been sent to ${email}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Step 2: Verify OTP and Register User
// @route   POST /api/auth/register
// @access  Public
export const registerWithOTP = async (req, res, next) => {
  try {
    const { username, email, password, otp } = req.body;

    if (!username || !email || !password || !otp) {
      return next(new AppError('Please provide username, email, password, and OTP code', 400));
    }

    // Check if email is already taken
    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email is already registered in the system', 409));
    }

    // Verify OTP from Database
    const validOTP = await OTP.findOne({ email, otp });
    if (!validOTP) {
      return next(new AppError('Invalid or expired OTP code', 400));
    }

    // Create new user (password is automatically hashed by Mongoose pre-save hook)
    const user = await userRepository.create({
      username,
      email,
      password,
    });

    // Delete used OTP
    await OTP.deleteOne({ _id: validOTP._id });

    res.status(201).json({
      status: 'success',
      message: 'Account verified and created successfully',
      data: {
        _id: user._id,
        username: user.username,
        email: user.email,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    next(error);
  }
};
