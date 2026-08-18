import bcrypt from 'bcryptjs';
import userRepository from '../repositories/userRepository.js';
import OTP from '../models/Otp.js';
import sendEmail from '../utils/sendEmail.js';
import generateToken from '../utils/generateToken.js';
import AppError from '../utils/AppError.js';
import logger from '../config/logger.js';

// @desc    Step 1: Request OTP for email verification
// @route   POST /api/auth/send-otp
// @access  Public
export const sendOTP = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide an email address', 400));
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email is already registered in the system', 409));
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp: generatedOTP,
    });

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

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email is already registered in the system', 409));
    }

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

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp: generatedOTP,
    });

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
    logger.debug(`Incoming OTP Payload: ${JSON.stringify(req.body)}`); const { username, email, password, otp } = req.body;

    if (!username || !email || !password || !otp) {
      return next(new AppError('Please provide username, email, password, and OTP code', 400));
    }

    const existingUser = await userRepository.findByEmail(email);
    if (existingUser) {
      return next(new AppError('Email is already registered in the system', 409));
    }

    const validOTP = await OTP.findOne({ email, otp });
    if (!validOTP) {
      return next(new AppError('Invalid or expired OTP code', 400));
    }

    const user = await userRepository.create({
      username,
      email,
      password,
    });

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

// @desc    Authenticate user & get JWT token
// @route   POST /api/auth/login
// @access  Public
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return next(new AppError('Please provide email and password', 400));
    }

    const user = await userRepository.findByEmail(email);

    if (!user || !(await user.matchPassword(password))) {
      return next(new AppError('Invalid email or password', 401));
    }

    res.status(200).json({
      status: 'success',
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

// @desc    Request Password Reset OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    if (!email) {
      return next(new AppError('Please provide an email address', 400));
    }

    // Fixed: Using userRepository instead of undefined User model
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return next(new AppError('There is no account associated with this email address', 404));
    }

    const generatedOTP = Math.floor(100000 + Math.random() * 900000).toString();

    await OTP.deleteMany({ email });
    await OTP.create({
      email,
      otp: generatedOTP,
    });

    await sendEmail({
      email,
      subject: 'Password Reset OTP Code',
      message: `Your password reset code is ${generatedOTP}. It will expire in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Use the OTP code below to reset your account password:</p>
          <h1 style="color: #E53935; letter-spacing: 4px;">${generatedOTP}</h1>
          <p style="color: #777;">This code is valid for 10 minutes. If you did not request this, please ignore this email.</p>
        </div>
      `,
    });

    res.status(200).json({
      status: 'success',
      message: `Password reset OTP sent to ${email}`,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Verify Reset OTP & Set New Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return next(new AppError('Please provide email, OTP code, and new password', 400));
    }

    // Fixed: Using userRepository instead of undefined User model
    const user = await userRepository.findByEmail(email);
    if (!user) {
      return next(new AppError('User not found', 404));
    }

    const validOTP = await OTP.findOne({ email, otp });
    if (!validOTP) {
      return next(new AppError('Invalid or expired OTP code', 400));
    }

    // Assign new password directly so Mongoose pre('save') hook handles hashing
    user.password = newPassword;
    await user.save();

    await OTP.deleteOne({ _id: validOTP._id });

    res.status(200).json({
      status: 'success',
      message: 'Password reset successful. You can now log in with your new password.',
    });
  } catch (error) {
    next(error);
  }
};