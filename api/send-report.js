import nodemailer from 'nodemailer';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    const { email, subject, htmlContent, pdfAttachment } = req.body;

    if (!email || !htmlContent) {
        return res.status(400).json({ message: 'Missing recipient email or HTML content' });
    }

    try {
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        const mailOptions = {
            from: `"Finova Academy" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: subject || 'Student Progress Report',
            html: htmlContent,
            attachments: pdfAttachment ? [
                {
                    filename: 'Progress_Report.pdf',
                    content: pdfAttachment.split("base64,")[1] || pdfAttachment,
                    encoding: 'base64'
                }
            ] : []
        };

        const info = await transporter.sendMail(mailOptions);

        return res.status(200).json({
            success: true,
            message: 'Email sent successfully',
            messageId: info.messageId
        });

    } catch (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to send email',
            error: error.message
        });
    }
}
