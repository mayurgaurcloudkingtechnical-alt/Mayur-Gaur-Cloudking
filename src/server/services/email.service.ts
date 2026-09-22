import * as net from "net";
import * as tls from "tls";
import { db } from "@/server/db/client";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  templateCode?: string;
  metadata?: Record<string, any>;
}

export class EmailService {
  /**
   * Check if SMTP environment variables are configured.
   */
  static isConfigured(): boolean {
    const host = process.env.SMTP_HOST?.trim();
    const user = process.env.SMTP_USER?.trim();
    const pass = process.env.SMTP_PASSWORD?.trim();
    return Boolean(host && user && pass);
  }

  static getConfig() {
    return {
      host: process.env.SMTP_HOST?.trim() || "smtp.gmail.com",
      port: parseInt(process.env.SMTP_PORT?.trim() || "587", 10),
      user: process.env.SMTP_USER?.trim() || "",
      pass: process.env.SMTP_PASSWORD?.trim() || "",
      secure: process.env.SMTP_SECURE === "true" || process.env.SMTP_PORT === "465",
      fromEmail: process.env.FROM_EMAIL?.trim() || process.env.SMTP_USER?.trim() || "info@softlabglobal.com",
      fromName: process.env.FROM_NAME?.trim() || "SOFTLAB GLOBAL",
    };
  }

  /**
   * Low-level pure Node.js RFC 5321 compliant SMTP client.
   * Works over STARTTLS or SSL/TLS with zero third-party dependencies.
   */
  private static async sendViaSmtp(
    to: string,
    subject: string,
    html: string,
    text?: string
  ): Promise<{ success: boolean; message?: string }> {
    const config = this.getConfig();
    if (!config.user || !config.pass) {
      return { success: false, message: "SMTP credentials not configured" };
    }

    return new Promise((resolve) => {
      const boundary = `----=_Part_${Date.now()}_${Math.random().toString(36).substring(2)}`;
      const cleanFrom = `"${config.fromName}" <${config.fromEmail}>`;
      const cleanTo = `<${to}>`;

      const headers = [
        `From: ${cleanFrom}`,
        `To: ${cleanTo}`,
        `Subject: ${subject}`,
        `Date: ${new Date().toUTCString()}`,
        `MIME-Version: 1.0`,
        `Content-Type: multipart/alternative; boundary="${boundary}"`,
        "",
      ].join("\r\n");

      const bodyTextPart = text
        ? [
            `--${boundary}`,
            `Content-Type: text/plain; charset=utf-8`,
            `Content-Transfer-Encoding: 7bit`,
            "",
            text,
            "",
          ].join("\r\n")
        : "";

      const bodyHtmlPart = [
        `--${boundary}`,
        `Content-Type: text/html; charset=utf-8`,
        `Content-Transfer-Encoding: 7bit`,
        "",
        html,
        "",
        `--${boundary}--`,
      ].join("\r\n");

      const rawEmail = `${headers}\r\n${bodyTextPart}${bodyHtmlPart}\r\n.\r\n`;

      let socket: net.Socket;
      let buffer = "";
      let step = 0;

      const finish = (success: boolean, message: string) => {
        try {
          socket.end();
          socket.destroy();
        } catch (_) {}
        resolve({ success, message });
      };

      const handleResponse = (data: Buffer) => {
        buffer += data.toString();
        const lines = buffer.split("\r\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line) continue;
          const code = parseInt(line.substring(0, 3), 10);
          if (line.charAt(3) === "-") continue; // Multiline response continuation

          if (code >= 400) {
            return finish(false, `SMTP Error (${code}): ${line}`);
          }

          if (step === 0 && code === 220) {
            // Connected, send EHLO
            step = 1;
            socket.write(`EHLO localhost\r\n`);
          } else if (step === 1 && code === 250) {
            if (!config.secure && config.port === 587) {
              // Initiate STARTTLS
              step = 2;
              socket.write(`STARTTLS\r\n`);
            } else {
              // Direct AUTH
              step = 4;
              socket.write(`AUTH LOGIN\r\n`);
            }
          } else if (step === 2 && code === 220) {
            // Upgrade to TLS
            step = 3;
            const tlsSocket = tls.connect(
              {
                socket,
                host: config.host,
                servername: config.host,
              },
              () => {
                socket = tlsSocket;
                socket.on("data", handleResponse);
                socket.write(`EHLO localhost\r\n`);
              }
            );
            tlsSocket.on("error", (err) => finish(false, `TLS Error: ${err.message}`));
          } else if (step === 3 && code === 250) {
            step = 4;
            socket.write(`AUTH LOGIN\r\n`);
          } else if (step === 4 && code === 334) {
            step = 5;
            socket.write(`${Buffer.from(config.user).toString("base64")}\r\n`);
          } else if (step === 5 && code === 334) {
            step = 6;
            socket.write(`${Buffer.from(config.pass).toString("base64")}\r\n`);
          } else if (step === 6 && code === 235) {
            step = 7;
            socket.write(`MAIL FROM:<${config.fromEmail}>\r\n`);
          } else if (step === 7 && code === 250) {
            step = 8;
            socket.write(`RCPT TO:<${to}>\r\n`);
          } else if (step === 8 && code === 250) {
            step = 9;
            socket.write(`DATA\r\n`);
          } else if (step === 9 && code === 354) {
            step = 10;
            socket.write(rawEmail);
          } else if (step === 10 && code === 250) {
            step = 11;
            socket.write(`QUIT\r\n`);
            return finish(true, "Message sent successfully");
          }
        }
      };

      try {
        if (config.secure) {
          socket = tls.connect(
            {
              host: config.host,
              port: config.port,
              servername: config.host,
            },
            () => {
              socket.on("data", handleResponse);
            }
          );
        } else {
          socket = net.connect(
            {
              host: config.host,
              port: config.port,
            },
            () => {
              socket.on("data", handleResponse);
            }
          );
        }

        socket.on("error", (err) => finish(false, `Socket Error: ${err.message}`));
        socket.setTimeout(15000, () => finish(false, "Connection timed out after 15s"));
      } catch (err: any) {
        finish(false, `Failed to establish connection: ${err.message}`);
      }
    });
  }

  /**
   * Dispatches email with template interpolation, error handling, and database audit logging.
   */
  static async sendEmail(opts: SendEmailOptions): Promise<{ sent: boolean; reason?: string }> {
    const { to, subject, html, text, templateCode, metadata } = opts;

    if (!to || !to.includes("@")) {
      return { sent: false, reason: "Invalid recipient email address" };
    }

    let status = "QUEUED";
    let error: string | undefined = undefined;

    if (this.isConfigured()) {
      try {
        const result = await this.sendViaSmtp(to, subject, html, text);
        if (result.success) {
          status = "SENT";
        } else {
          status = "FAILED";
          error = result.message;
          console.warn(`[EmailService] Failed to dispatch email to ${to}: ${result.message}`);
        }
      } catch (e: any) {
        status = "FAILED";
        error = e.message;
        console.error(`[EmailService] Error sending to ${to}:`, e);
      }
    } else {
      status = "CONFIG_MISSING";
      console.log(`[EmailService] (Simulated/Unconfigured) Email to ${to} | Subject: "${subject}"`);
    }

    // Persist to email logs in PostgreSQL
    try {
      let templateId: string | undefined = undefined;
      if (templateCode) {
        const tpl = await db.emailTemplate.findUnique({ where: { code: templateCode } });
        if (tpl) templateId = tpl.id;
      }

      await db.emailLog.create({
        data: {
          templateId,
          recipient: to,
          subject,
          status,
          error,
          metadata: metadata ? (metadata as any) : undefined,
        },
      });
    } catch (logErr) {
      // Non-blocking log catch
      console.error("[EmailService] Failed to create email log entry:", logErr);
    }

    return { sent: status === "SENT", reason: error };
  }

  /**
   * Helper to replace template tokens like {{studentName}}
   */
  private static interpolate(template: string, vars: Record<string, string>): string {
    let result = template;
    for (const [key, value] of Object.entries(vars)) {
      const regex = new RegExp(`{{\\s*${key}\\s*}}`, "g");
      result = result.replace(regex, value ?? "");
    }
    return result;
  }

  // ============================================================================
  // PRE-CONFIGURED BUSINESS EMAIL TEMPLATE METHODS
  // ============================================================================

  /**
   * 1. Send Admission Confirmation to Student
   */
  static async sendAdmissionConfirmation(params: {
    to: string;
    studentName: string;
    studentId: string;
    admissionNumber: string;
    courseName: string;
    batchName?: string;
    center?: string;
  }) {
    const vars: Record<string, string> = {
      studentName: params.studentName,
      studentId: params.studentId,
      admissionNumber: params.admissionNumber,
      course: params.courseName,
      batch: params.batchName || "Upcoming Batch",
      center: params.center || "SOFTLAB GLOBAL Campus, Prayagraj",
      portalUrl: "https://softlabglobal.com/login",
    };

    const subject = `Admission Confirmed — Welcome to SOFTLAB GLOBAL (${params.studentId})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px; letter-spacing: -0.5px;">SOFTLAB GLOBAL</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Center of Excellence for Cloud, AI & Software Engineering</p>
        </div>
        <p style="font-size: 16px; line-height: 1.6;">Dear <strong>${vars.studentName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">Congratulations! Your institutional admission has been successfully processed and verified.</p>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px; margin: 20px 0;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #64748b;">Student ID:</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${vars.studentId}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Admission No:</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${vars.admissionNumber}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Enrolled Course:</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${vars.course}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Campus / Center:</td><td style="padding: 6px 0; font-weight: bold; color: #0f172a;">${vars.center}</td></tr>
          </table>
        </div>

        <p style="font-size: 14px; line-height: 1.6;">You can access your digital ID card, curriculum, and class schedule at our Student Portal:</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="${vars.portalUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Access Student Portal</a>
        </p>
        
        <p style="font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; margin-top: 24px;">
          SOFTLAB GLOBAL Admissions Directorate • Patrika Chauraha, Civil Lines, Prayagraj, UP – 211001
        </p>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject,
      html,
      templateCode: "ADMISSION_CONFIRMATION",
      metadata: params,
    });
  }

  /**
   * 2. Send Student LMS Login Credentials
   */
  static async sendStudentCredentials(params: {
    to: string;
    studentName: string;
    studentId: string;
    loginEmail: string;
    temporaryPassword: string;
  }) {
    const subject = `Your SOFTLAB GLOBAL LMS Login Credentials (${params.studentId})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #2563eb; margin: 0; font-size: 24px;">SOFTLAB GLOBAL</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Student Learning Management System</p>
        </div>
        <p style="font-size: 15px;">Hello <strong>${params.studentName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">Your student account has been created. Use the credentials below to sign in to the portal:</p>
        
        <div style="background: #f1f5f9; border-left: 4px solid #2563eb; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Portal URL:</strong> <a href="https://softlabglobal.com/login" style="color: #2563eb;">https://softlabglobal.com/login</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Login Email:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">${params.loginEmail}</code></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #b91c1c;">${params.temporaryPassword}</code></p>
        </div>

        <p style="font-size: 13px; color: #64748b;"><em>Please change your password immediately after your first sign in.</em></p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="https://softlabglobal.com/login" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Log In Now</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject,
      html,
      templateCode: "STUDENT_CREDENTIALS",
      metadata: { studentId: params.studentId, loginEmail: params.loginEmail },
    });
  }

  /**
   * 3. Send Staff LMS Login Credentials
   */
  static async sendStaffCredentials(params: {
    to: string;
    staffName: string;
    employeeId: string;
    loginEmail: string;
    temporaryPassword: string;
    roleName: string;
    designation: string;
  }) {
    const subject = `Welcome to Staff Portal — SOFTLAB GLOBAL (${params.employeeId})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #0f766e; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #0f766e; margin: 0; font-size: 24px;">SOFTLAB GLOBAL</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Institutional Staff & ERP Portal</p>
        </div>
        <p style="font-size: 15px;">Dear <strong>${params.staffName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">You have been onboarded as <strong>${params.designation}</strong> (${params.roleName}) at SOFTLAB GLOBAL. Below are your administrative ERP credentials:</p>
        
        <div style="background: #f0fdfa; border-left: 4px solid #0f766e; padding: 16px; margin: 20px 0; border-radius: 4px;">
          <p style="margin: 4px 0; font-size: 14px;"><strong>Employee ID:</strong> ${params.employeeId}</p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Portal URL:</strong> <a href="https://softlabglobal.com/login" style="color: #0f766e;">https://softlabglobal.com/login</a></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Email:</strong> <code style="background: #ccfbf1; padding: 2px 6px; border-radius: 4px;">${params.loginEmail}</code></p>
          <p style="margin: 4px 0; font-size: 14px;"><strong>Temporary Password:</strong> <code style="background: #ccfbf1; padding: 2px 6px; border-radius: 4px; font-weight: bold; color: #047857;">${params.temporaryPassword}</code></p>
        </div>

        <p style="font-size: 13px; color: #64748b;">Security Notice: Do not share these credentials with unauthorized persons.</p>
        <p style="text-align: center; margin: 24px 0;">
          <a href="https://softlabglobal.com/login" style="background: #0f766e; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold; font-size: 14px; display: inline-block;">Access Staff Portal</a>
        </p>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject,
      html,
      templateCode: "STAFF_CREDENTIALS",
      metadata: { employeeId: params.employeeId, loginEmail: params.loginEmail },
    });
  }

  /**
   * 4. Send Instant Fee Receipt Email
   */
  static async sendFeeReceipt(params: {
    to: string;
    studentName: string;
    studentId: string;
    receiptNumber: string;
    amountPaidPaise: number;
    pendingAmountPaise: number;
    paymentMethod: string;
    courseName: string;
  }) {
    const formattedPaid = (params.amountPaidPaise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });
    const formattedPending = (params.pendingAmountPaise / 100).toLocaleString("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    });

    const subject = `Fee Payment Receipt — ${params.receiptNumber} (${params.studentName})`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <div style="text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 16px; margin-bottom: 20px;">
          <h1 style="color: #16a34a; margin: 0; font-size: 24px;">SOFTLAB GLOBAL</h1>
          <p style="margin: 4px 0 0 0; color: #64748b; font-size: 13px;">Official Institutional Fee Receipt</p>
        </div>
        <p style="font-size: 15px;">Dear <strong>${params.studentName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6;">Thank you. Your fee payment has been successfully recorded.</p>
        
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; padding: 16px; margin: 20px 0; border-radius: 6px;">
          <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #64748b;">Receipt No:</td><td style="padding: 6px 0; font-weight: bold;">${params.receiptNumber}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Student ID:</td><td style="padding: 6px 0; font-weight: bold;">${params.studentId}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Course:</td><td style="padding: 6px 0; font-weight: bold;">${params.courseName}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Amount Paid:</td><td style="padding: 6px 0; font-weight: bold; color: #15803d; font-size: 16px;">${formattedPaid}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Payment Mode:</td><td style="padding: 6px 0; font-weight: bold;">${params.paymentMethod}</td></tr>
            <tr><td style="padding: 6px 0; color: #64748b;">Remaining Due:</td><td style="padding: 6px 0; font-weight: bold; color: #dc2626;">${formattedPending}</td></tr>
          </table>
        </div>

        <p style="font-size: 13px; color: #64748b;">A formal A4 copy (Student & Centre copy) is available for print in your portal.</p>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject,
      html,
      templateCode: "FEE_RECEIPT",
      metadata: params,
    });
  }

  /**
   * 5. Send Password Reset Link
   */
  static async sendPasswordReset(params: { to: string; name: string; resetUrl: string }) {
    const subject = `Password Reset Request — SOFTLAB GLOBAL`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #2563eb;">Reset Your Password</h2>
        <p>Hello ${params.name},</p>
        <p>We received a request to reset your password. Click below to choose a new password:</p>
        <p style="margin: 24px 0; text-align: center;">
          <a href="${params.resetUrl}" style="background: #2563eb; color: #ffffff; padding: 12px 28px; text-decoration: none; border-radius: 6px; font-weight: bold;">Reset Password</a>
        </p>
        <p style="font-size: 12px; color: #94a3b8;">If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    return this.sendEmail({
      to: params.to,
      subject,
      html,
      templateCode: "PASSWORD_RESET",
      metadata: { email: params.to },
    });
  }
}
