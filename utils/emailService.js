const nodemailer = require('nodemailer');

// Hardcoded email configuration
const EMAIL_USER = 'minahil@purelogics.net';
const EMAIL_PASS = 'vsja manm qtgi pxuw';

// Create Gmail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  }
});

// Verify transporter connection
transporter.verify(function (error, success) {
  if (error) {
    console.log('❌ Email service error:', error);
  } else {
    console.log('✅ Email service is ready');
  }
});

// Send welcome email
const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    const mailOptions = {
      from: `"E-Commerce Site" <${EMAIL_USER}>`,
      to: userEmail,
      subject: "🎉 Welcome to Our Website!",
      text: `Hi ${userName},\n\nThank you for signing up with us! We're excited to have you on board.\n\n— Your E-Commerce Team`
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Welcome email sent to:", userEmail);
    return true;
  } catch (err) {
    console.error("❌ Email sending error:", err);
    return false;
  }
};

// Send email verification
const sendVerificationEmail = async (userEmail, userName, verificationToken) => {
  try {
    const verificationUrl = `http://localhost:5173/verify-email?token=${verificationToken}`;
    
    const mailOptions = {
      from: `"E-Commerce Site" <${EMAIL_USER}>`,
      to: userEmail,
      subject: 'Verify Your Email - E-Commerce Site',
      text: `Hi ${userName},\n\nTo complete your registration, please verify your email address by clicking the link below:\n\n${verificationUrl}\n\nThis verification link will expire in 24 hours.\n\n— Your E-Commerce Team`
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Verification email sent to:", userEmail);
    return true;
  } catch (err) {
    console.error("❌ Email sending error:", err);
    return false;
  }
};

// Send password reset email
const sendPasswordResetEmail = async (userEmail, userName, resetToken) => {
  try {
    const resetUrl = `http://localhost:5173/reset-password?token=${resetToken}`;
    
    const mailOptions = {
      from: `"E-Commerce Site" <${EMAIL_USER}>`,
      to: userEmail,
      subject: 'Reset Your Password - E-Commerce Site',
      text: `Hi ${userName},\n\nWe received a request to reset your password. Click the link below to create a new password:\n\n${resetUrl}\n\nThis reset link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\n— Your E-Commerce Team`
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Password reset email sent to:", userEmail);
    return true;
  } catch (err) {
    console.error("❌ Email sending error:", err);
    return false;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
}; 