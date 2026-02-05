import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the form (public/index.html)
app.use(express.static(path.join(process.cwd(), 'public')));

// Health check (to confirm Render is running)
app.get('/health', (req, res) => res.status(200).send('OK'));

// Use /tmp for uploads (Render-friendly)
const uploadDir = path.join('/tmp', 'uploads');
try {
  fs.mkdirSync(uploadDir, { recursive: true });
} catch (e) {
  console.error('Failed to create uploadDir:', uploadDir, e);
}

const upload = multer({
  dest: uploadDir,
  limits: { fileSize: 15 * 1024 * 1024 } // per-file max
});

function required(value) {
  return value !== undefined && value !== null && String(value).trim().length > 0;
}

app.post('/api/submit', upload.array('attachments', 10), async (req, res) => {
  const b = req.body || {};
  const requiredFields = [
    'name','department','position','organization','mobile','email',
    'submissionDate','projectTitle','description','objective','dimensions'
  ];

  for (const f of requiredFields) {
    if (!required(b[f])) {
      for (const f2 of (req.files || [])) fs.unlink(f2.path, () => {});
      return res.status(400).json({ message: `Missing required field: ${f}` });
    }
  }

  if (!b.approvalConfirm) {
    for (const f2 of (req.files || [])) fs.unlink(f2.path, () => {});
    return res.status(400).json({ message: 'Please confirm content approval.' });
  }

  const files = req.files || [];
  const totalSize = files.reduce((sum, f) => sum + (f.size || 0), 0);
  if (totalSize > 15 * 1024 * 1024) {
    for (const f of files) fs.unlink(f.path, () => {});
    return res.status(400).json({ message: 'Attachments exceed 15 MB total.' });
  }

  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      for (const f of files) fs.unlink(f.path, () => {});
      return res.status(500).json({ message: 'Missing GMAIL_USER or GMAIL_APP_PASSWORD in Render Environment Variables.' });
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
      }
    });

    // Receiver email (fixed)
    const toEmail = 'brand.biratnursinghome@gmail.com';

    const subject = `New Design Request: ${b.projectTitle} — ${b.name}`;

    const text = [
      `Requester Information`,
      `- Name: ${b.name}`,
      `- Department: ${b.department}`,
      `- Position: ${b.position}`,
      `- Organization: ${b.organization}`,
      `- Mobile: ${b.mobile}`,
      `- Email: ${b.email}`,
      `- Date of Submission: ${b.submissionDate}`,
      ``,
      `Project Details`,
      `- Project Title: ${b.projectTitle}`,
      `- Description: ${b.description}`,
      `- Objective: ${b.objective}`,
      ``,
      `Design Specifications`,
      `- Dimensions / Quantity: ${b.dimensions}`,
      `- Preferred Color Scheme: ${b.colorScheme || '(not provided)'}`,
      `- Location / Use: ${b.locationUse || '(not provided)'}`,
      ``,
      `Additional Requirements`,
      `- Do’s & Don’ts: ${b.additional || '(not provided)'}`,
      ``,
      `Approval & Feedback`,
      `- Approval Process: ${b.approvalProcess || '(not provided)'}`,
      `- Feedback Management: ${b.feedback || '(not provided)'}`,
      ``,
      `Content Approval Confirmation: YES`
    ].join('\n');

    const attachments = files.map((f) => ({
      filename: f.originalname,
      path: f.path
    }));

    await transporter.sendMail({
      from: `"Design Request Form" <${process.env.GMAIL_USER}>`,
      to: toEmail,
      replyTo: b.email,
      subject,
      text,
      attachments
    });

    for (const f of files) fs.unlink(f.path, () => {});
    return res.json({ ok: true });
  } catch (err) {
    console.error(err);
    for (const f of files) fs.unlink(f.path, () => {});
    return res.status(500).json({ message: 'Server error sending email. Check Render logs and email credentials.' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
