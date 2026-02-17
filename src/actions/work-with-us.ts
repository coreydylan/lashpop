"use server";

// Types matching the form data
export type CareerPath = "employee" | "booth" | "training";

export interface WorkWithUsFormData {
  name: string;
  email: string;
  phone: string;
  experience: string;
  specialty: string[];
  message: string;
  instagram?: string;
  currentBusiness?: string;
  desiredStartDate?: string;
  // Booth-specific
  boothDays?: number;
}

interface SubmitResult {
  success: boolean;
  error?: string;
}

const MOX_API_URL = process.env.MOX_API_URL || "https://mox-api.experialstudio.com";
const MOX_API_KEY = process.env.MOX_API_KEY!;

const RECIPIENT_EMAIL = "lashpopstudios@gmail.com";
const BCC_EMAIL = "me@coreydylan.net";
const SENDER_EMAIL = "noreply@lashpopstudios.com";

function formatPathTitle(path: CareerPath): string {
  switch (path) {
    case "employee":
      return "Employee Application";
    case "booth":
      return "Booth Rental Inquiry";
    case "training":
      return "Training Waitlist";
  }
}

function buildEmailBody(data: WorkWithUsFormData, path: CareerPath): string {
  const lines: string[] = [
    `New ${formatPathTitle(path)} Submission`,
    "=".repeat(40),
    "",
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    `Phone: ${data.phone}`,
  ];

  if (data.experience) {
    lines.push(`Experience: ${data.experience}`);
  }

  if (data.specialty && data.specialty.length > 0) {
    lines.push(`Specialties: ${data.specialty.join(", ")}`);
  }

  if (path === "booth" && data.boothDays) {
    lines.push(`Days per Week: ${data.boothDays === 5 ? "5+" : data.boothDays}`);
  }

  if (data.currentBusiness) {
    lines.push(`Current Business: ${data.currentBusiness}`);
  }

  if (data.desiredStartDate) {
    lines.push(`Desired Start Date: ${data.desiredStartDate}`);
  }

  if (data.instagram) {
    lines.push(`Instagram: ${data.instagram}`);
  }

  if (data.message) {
    lines.push("");
    lines.push("Message:");
    lines.push("-".repeat(20));
    lines.push(data.message);
  }

  lines.push("");
  lines.push("-".repeat(40));
  lines.push(`Submitted: ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}`);

  return lines.join("\n");
}

function buildHtmlEmailBody(data: WorkWithUsFormData, path: CareerPath): string {
  const specialtiesHtml = data.specialty && data.specialty.length > 0
    ? `<tr><td style="padding: 8px 0; color: #666;">Specialties</td><td style="padding: 8px 0;">${data.specialty.join(", ")}</td></tr>`
    : "";

  const boothDaysHtml = path === "booth" && data.boothDays
    ? `<tr><td style="padding: 8px 0; color: #666;">Days per Week</td><td style="padding: 8px 0; font-weight: 600; color: #cc947f;">${data.boothDays === 5 ? "5+" : data.boothDays}</td></tr>`
    : "";

  const currentBusinessHtml = data.currentBusiness
    ? `<tr><td style="padding: 8px 0; color: #666;">Current Business</td><td style="padding: 8px 0;">${data.currentBusiness}</td></tr>`
    : "";

  const startDateHtml = data.desiredStartDate
    ? `<tr><td style="padding: 8px 0; color: #666;">Desired Start Date</td><td style="padding: 8px 0;">${data.desiredStartDate}</td></tr>`
    : "";

  const instagramHtml = data.instagram
    ? `<tr><td style="padding: 8px 0; color: #666;">Instagram</td><td style="padding: 8px 0;">@${data.instagram.replace(/^@/, "")}</td></tr>`
    : "";

  const messageHtml = data.message
    ? `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
        <h3 style="margin: 0 0 10px 0; color: #3d3632; font-size: 14px;">Message</h3>
        <p style="margin: 0; color: #444; line-height: 1.6; white-space: pre-wrap;">${data.message}</p>
      </div>
    `
    : "";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f5f5f5;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #cc947f 0%, #dbb2a4 100%); padding: 30px; border-radius: 12px 12px 0 0;">
          <h1 style="margin: 0; color: white; font-size: 24px; font-weight: 500;">New ${formatPathTitle(path)}</h1>
          <p style="margin: 8px 0 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">LashPop Studios</p>
        </div>

        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #666;">Name</td><td style="padding: 8px 0; font-weight: 500;">${data.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${data.email}" style="color: #cc947f;">${data.email}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;"><a href="tel:${data.phone}" style="color: #cc947f;">${data.phone}</a></td></tr>
            ${data.experience ? `<tr><td style="padding: 8px 0; color: #666;">Experience</td><td style="padding: 8px 0;">${data.experience}</td></tr>` : ""}
            ${specialtiesHtml}
            ${boothDaysHtml}
            ${currentBusinessHtml}
            ${startDateHtml}
            ${instagramHtml}
          </table>

          ${messageHtml}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e5e5; text-align: center; color: #999; font-size: 12px;">
            Submitted on ${new Date().toLocaleString("en-US", { timeZone: "America/Los_Angeles" })}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function submitWorkWithUsForm(
  data: WorkWithUsFormData,
  path: CareerPath
): Promise<SubmitResult> {
  try {
    const subject = `[LashPop] New ${formatPathTitle(path)} - ${data.name}`;
    const textBody = buildEmailBody(data, path);
    const htmlBody = buildHtmlEmailBody(data, path);

    // Send to primary recipient
    const res = await fetch(`${MOX_API_URL}/api/v1/emails/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MOX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [RECIPIENT_EMAIL, BCC_EMAIL],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Mox API error (${res.status}): ${body}`);
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending work-with-us email:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    };
  }
}
