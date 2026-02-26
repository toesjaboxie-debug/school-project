import nodemailer from 'nodemailer';

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

// Email templates
interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

const getEmailTemplate = (type: string, data: Record<string, string>): EmailTemplate => {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  switch (type) {
    case 'verify-email':
      return {
        subject: 'Bevestig je e-mailadres - EduLearn AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #60a5fa; margin: 0;">📚 EduLearn AI</h1>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; text-align: center;">
              <h2 style="color: #fff; margin-bottom: 20px;">Bevestig je e-mailadres</h2>
              <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px;">
                Hallo ${data.username || 'gebruiker'},<br><br>
                Bedankt voor het registreren bij EduLearn AI! Klik op de onderstaande knop om je e-mailadres te bevestigen.
              </p>
              <a href="${baseUrl}/verify-email?token=${data.token}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                E-mail bevestigen
              </a>
              <p style="color: rgba(255,255,255,0.5); margin-top: 30px; font-size: 12px;">
                Deze link verloopt over 24 uur. Als je geen account hebt aangemaakt, kun je deze e-mail negeren.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: rgba(255,255,255,0.4); font-size: 12px;">
              © 2024 EduLearn AI. Alle rechten voorbehouden.
            </div>
          </div>
        `,
        text: `Beste ${data.username || 'gebruiker'},\n\nBedankt voor het registreren bij EduLearn AI!\n\nBevestig je e-mailadres via deze link:\n${baseUrl}/verify-email?token=${data.token}\n\nDeze link verloopt over 24 uur.`,
      };

    case 'reset-password':
      return {
        subject: 'Wachtwoord resetten - EduLearn AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #60a5fa; margin: 0;">📚 EduLearn AI</h1>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; text-align: center;">
              <h2 style="color: #fff; margin-bottom: 20px;">Wachtwoord resetten</h2>
              <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px;">
                Hallo ${data.username || 'gebruiker'},<br><br>
                Je hebt een verzoek gedaan om je wachtwoord te resetten. Klik op de onderstaande knop om een nieuw wachtwoord in te stellen.
              </p>
              <a href="${baseUrl}/reset-password?token=${data.token}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Wachtwoord resetten
              </a>
              <p style="color: rgba(255,255,255,0.5); margin-top: 30px; font-size: 12px;">
                Deze link verloopt over 1 uur. Als je geen wachtwoord reset hebt aangevraagd, kun je deze e-mail negeren.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: rgba(255,255,255,0.4); font-size: 12px;">
              © 2024 EduLearn AI. Alle rechten voorbehouden.
            </div>
          </div>
        `,
        text: `Beste ${data.username || 'gebruiker'},\n\nJe hebt een verzoek gedaan om je wachtwoord te resetten.\n\nReset je wachtwoord via deze link:\n${baseUrl}/reset-password?token=${data.token}\n\nDeze link verloopt over 1 uur.`,
      };

    case 'welcome':
      return {
        subject: 'Welkom bij EduLearn AI! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #60a5fa; margin: 0;">📚 EduLearn AI</h1>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; text-align: center;">
              <h2 style="color: #34d399; margin-bottom: 20px;">🎉 Welkom!</h2>
              <p style="color: rgba(255,255,255,0.7); margin-bottom: 20px;">
                Hallo ${data.username || 'gebruiker'},<br><br>
                Welkom bij EduLearn AI! Je account is succesvol aangemaakt en je e-mailadres is bevestigd.
              </p>
              <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px;">
                Je kunt nu inloggen en beginnen met leren!
              </p>
              <a href="${baseUrl}/login" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #8b5cf6); color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Inloggen
              </a>
            </div>
            <div style="text-align: center; margin-top: 20px; color: rgba(255,255,255,0.4); font-size: 12px;">
              © 2024 EduLearn AI. Alle rechten voorbehouden.
            </div>
          </div>
        `,
        text: `Welkom bij EduLearn AI, ${data.username || 'gebruiker'}!\n\nJe account is succesvol aangemaakt en je e-mailadres is bevestigd.\n\nLog in via: ${baseUrl}/login`,
      };

    case 'two-factor-code':
      return {
        subject: 'Je verificatiecode - EduLearn AI',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #0f172a; border-radius: 12px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #60a5fa; margin: 0;">📚 EduLearn AI</h1>
            </div>
            <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; text-align: center;">
              <h2 style="color: #fff; margin-bottom: 20px;">🔐 Verificatiecode</h2>
              <p style="color: rgba(255,255,255,0.7); margin-bottom: 30px;">
                Gebruik de volgende code om je identiteit te verifiëren:
              </p>
              <div style="background: rgba(59, 130, 246, 0.2); padding: 20px; border-radius: 8px; display: inline-block;">
                <span style="font-size: 32px; font-weight: bold; color: #60a5fa; letter-spacing: 8px;">${data.code}</span>
              </div>
              <p style="color: rgba(255,255,255,0.5); margin-top: 30px; font-size: 12px;">
                Deze code verloopt over 10 minuten. Deel deze code nooit met anderen.
              </p>
            </div>
            <div style="text-align: center; margin-top: 20px; color: rgba(255,255,255,0.4); font-size: 12px;">
              © 2024 EduLearn AI. Alle rechten voorbehouden.
            </div>
          </div>
        `,
        text: `Je verificatiecode is: ${data.code}\n\nDeze code verloopt over 10 minuten. Deel deze code nooit met anderen.`,
      };

    default:
      return {
        subject: 'EduLearn AI',
        html: `<p>${data.message || ''}</p>`,
        text: data.message || '',
      };
  }
};

// Send email function
export async function sendEmail(
  to: string,
  type: string,
  data: Record<string, string> = {}
): Promise<{ success: boolean; error?: string }> {
  try {
    const transporter = createTransporter();
    const template = getEmailTemplate(type, data);

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      to,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });

    console.log('Email sent:', info.messageId);
    return { success: true };
  } catch (error: any) {
    console.error('Email send error:', error);
    return { success: false, error: error.message };
  }
}

// Verify email configuration
export async function verifyEmailConfig(): Promise<boolean> {
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('Email configuration verified');
    return true;
  } catch (error) {
    console.error('Email configuration error:', error);
    return false;
  }
}
