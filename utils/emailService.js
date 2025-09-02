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

//Email Confirmation
const sendOrderConfirmationEmail = async (userEmail, userName, orderId, orderItems, totalAmount, shippingAddress = {}, phone) => {
  try {
    const itemRows = orderItems
      .map(
        (item) => `
          <tr>
            <td style="padding:8px; border:1px solid #ddd;">${item.name || item.productId}</td>
            <td style="padding:8px; border:1px solid #ddd;">${item.quantity}</td>
            <td style="padding:8px; border:1px solid #ddd;">$${item.price}</td>
          </tr>
        `
      )
      .join("");

    const { addressLine = "", city = "", postalCode = "", country = "" } = shippingAddress;

    const mailOptions = {
      from: `"E-Commerce Site" <${EMAIL_USER}>`,
      to: userEmail,
      subject: `🛒 Order Confirmation - #${orderId}`,
      html: `
        <div style="font-family: Arial, sans-serif; color:#333; line-height:1.6;">
          <h2>Hi ${userName},</h2>
          <p>Thank you for your order! Here are your order details:</p>

          <h3>Order ID: ${orderId}</h3>

          <table style="border-collapse: collapse; width:100%; margin-bottom:20px;">
            <thead>
              <tr style="background:#f5f5f5;">
                <th style="padding:8px; border:1px solid #ddd;">Product</th>
                <th style="padding:8px; border:1px solid #ddd;">Quantity</th>
                <th style="padding:8px; border:1px solid #ddd;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <h3>Total: $${totalAmount}</h3>

          <div style="margin-top:30px; padding:15px; border:1px solid #ddd; border-radius:6px;">
            <h3 style="margin-bottom:10px;">📍 Delivery Details</h3>
            <p><strong>Name:</strong> ${userName}</p>
            <p><strong>Address:</strong> ${addressLine}, ${city}, ${postalCode}, ${country}</p>
            <p><strong>Phone:</strong> ${phone || "N/A"}</p>
            <p><strong>Email:</strong> <a href="mailto:${userEmail}" style="color:#e67e22;">${userEmail}</a></p>
          </div>

          <p style="margin-top:20px;">We will notify you once your order is shipped.</p>
          <p>— Your E-Commerce Team</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log("✅ Order confirmation email sent to:", userEmail);
    return true;
  } catch (err) {
    console.error("❌ Order email sending error:", err);
    return false;
  }
};





module.exports = {
  sendWelcomeEmail,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendOrderConfirmationEmail
}; 