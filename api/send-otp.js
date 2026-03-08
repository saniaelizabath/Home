import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, otp } = req.body;

    if (!email || !otp) {
        return res.status(400).json({ error: 'Missing email or OTP' });
    }

    // Configure transporter unconditionally (standard execution context)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    try {
        const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333 border: 1px solid #eee; padding: 20px; border-radius: 8px;">
        <h2 style="color: #20C997;">Password Reset Verification</h2>
        <p>You requested to reset your password for Finova Academy.</p>
        <p>Here is your 6-digit confirmation code:</p>
        <div style="background: #f5f5f5; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
          <h1 style="margin: 0; color: #1a1a2e; letter-spacing: 4px; font-weight: 800;">${otp}</h1>
        </div>
        <p style="font-size: 14px; color: #666;">This code will expire in 10 minutes.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="font-size: 12px; color: #999;">If you didn't request a password reset, you can safely ignore this email.</p>
      </div>
    `;

        const mailOptions = {
            from: `"Finova Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `Your Finova Academy Password Reset Code: ${otp}`,
            html: htmlContent,
        };

        await transporter.sendMail(mailOptions);
        return res.status(200).json({ success: true, message: 'OTP sent successfully' });

    } catch (error) {
        console.error('Nodemailer Error:', error);
        return res.status(500).json({ error: 'Failed to send OTP email', details: error.message });
    }
}
