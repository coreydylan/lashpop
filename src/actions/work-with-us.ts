"use server";

import { desc } from "drizzle-orm";
import { getDb } from "@/db";
import { workWithUsSubmissions } from "@/db/schema/work_with_us_submissions";
import { requireAdmin } from "@/lib/admin/auth";
import { headers } from "next/headers";
import { consumeRateLimit, requestIp } from "@/lib/request-rate-limit";

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

const RECIPIENT_EMAIL = process.env.WORK_WITH_US_RECIPIENT_EMAIL || "lashpopstudios@gmail.com";
const SENDER_EMAIL = "noreply@lashpopstudios.com";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character] || character);
}

function cleanText(value: unknown, maxLength: number): string {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function normalizeSubmission(
  input: WorkWithUsFormData,
  path: CareerPath
): WorkWithUsFormData | null {
  if (!input || typeof input !== "object") return null;

  const name = cleanText(input?.name, 120);
  const email = cleanText(input?.email, 320).toLowerCase();
  const phone = cleanText(input?.phone, 32);

  if (name.length < 2 || !EMAIL_RE.test(email) || phone.length < 7) return null;

  const specialty = Array.isArray(input.specialty)
    ? input.specialty
      .filter((value): value is string => typeof value === "string")
      .slice(0, 20)
      .map((value) => cleanText(value, 80))
      .filter(Boolean)
    : [];

  const rawBoothDays = input.boothDays;
  const boothDays = path === "booth" && Number.isInteger(rawBoothDays) && rawBoothDays! >= 1 && rawBoothDays! <= 7
    ? rawBoothDays
    : undefined;

  return {
    name,
    email,
    phone,
    experience: cleanText(input.experience, 500),
    specialty,
    message: cleanText(input.message, 5000),
    instagram: cleanText(input.instagram, 200) || undefined,
    currentBusiness: cleanText(input.currentBusiness, 200) || undefined,
    desiredStartDate: cleanText(input.desiredStartDate, 64) || undefined,
    boothDays,
  };
}

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
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = escapeHtml(data.phone);
  const safeExperience = escapeHtml(data.experience);
  const safeSpecialties = data.specialty.map(escapeHtml).join(", ");
  const safeCurrentBusiness = data.currentBusiness ? escapeHtml(data.currentBusiness) : "";
  const safeDesiredStartDate = data.desiredStartDate ? escapeHtml(data.desiredStartDate) : "";
  const safeInstagram = data.instagram ? escapeHtml(data.instagram.replace(/^@/, "")) : "";
  const safeMessage = escapeHtml(data.message);

  const specialtiesHtml = data.specialty && data.specialty.length > 0
    ? `<tr><td style="padding: 8px 0; color: #666;">Specialties</td><td style="padding: 8px 0;">${safeSpecialties}</td></tr>`
    : "";

  const boothDaysHtml = path === "booth" && data.boothDays
    ? `<tr><td style="padding: 8px 0; color: #666;">Days per Week</td><td style="padding: 8px 0; font-weight: 600; color: #cc947f;">${data.boothDays === 5 ? "5+" : data.boothDays}</td></tr>`
    : "";

  const currentBusinessHtml = data.currentBusiness
    ? `<tr><td style="padding: 8px 0; color: #666;">Current Business</td><td style="padding: 8px 0;">${safeCurrentBusiness}</td></tr>`
    : "";

  const startDateHtml = data.desiredStartDate
    ? `<tr><td style="padding: 8px 0; color: #666;">Desired Start Date</td><td style="padding: 8px 0;">${safeDesiredStartDate}</td></tr>`
    : "";

  const instagramHtml = data.instagram
    ? `<tr><td style="padding: 8px 0; color: #666;">Instagram</td><td style="padding: 8px 0;">@${safeInstagram}</td></tr>`
    : "";

  const messageHtml = data.message
    ? `
      <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e5e5e5;">
        <h3 style="margin: 0 0 10px 0; color: #3d3632; font-size: 14px;">Message</h3>
        <p style="margin: 0; color: #444; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
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
            <tr><td style="padding: 8px 0; color: #666;">Name</td><td style="padding: 8px 0; font-weight: 500;">${safeName}</td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Email</td><td style="padding: 8px 0;"><a href="mailto:${safeEmail}" style="color: #cc947f;">${safeEmail}</a></td></tr>
            <tr><td style="padding: 8px 0; color: #666;">Phone</td><td style="padding: 8px 0;"><a href="tel:${safePhone}" style="color: #cc947f;">${safePhone}</a></td></tr>
            ${data.experience ? `<tr><td style="padding: 8px 0; color: #666;">Experience</td><td style="padding: 8px 0;">${safeExperience}</td></tr>` : ""}
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
  if (path !== "employee" && path !== "booth" && path !== "training") {
    return { success: false, error: "Please select a valid application type." };
  }

  const normalized = normalizeSubmission(data, path);
  if (!normalized) {
    return { success: false, error: "Please check your name, email, and phone number." };
  }

  try {
    const requestHeaders = await headers();
    const [ipLimit, emailLimit] = await Promise.all([
      consumeRateLimit({
        scope: "careers-ip",
        identity: requestIp(requestHeaders),
        limit: 20,
        windowMs: 60 * 60 * 1_000,
      }),
      consumeRateLimit({
        scope: "careers-email",
        identity: normalized.email,
        limit: 5,
        windowMs: 24 * 60 * 60 * 1_000,
      }),
    ]);
    if (!ipLimit.allowed || !emailLimit.allowed) {
      return { success: false, error: "Too many submissions. Please try again later." };
    }
  } catch (rateLimitError) {
    console.error("Could not verify submission rate limit", rateLimitError instanceof Error ? rateLimitError.name : "UnknownError");
    return { success: false, error: "We couldn’t submit your application. Please try again." };
  }

  // The admin inbox is the durable source of truth. Never claim success unless
  // the submission is safely stored, even if email delivery is unavailable.
  try {
    const db = getDb();
    await db.insert(workWithUsSubmissions).values({
      path,
      name: normalized.name,
      email: normalized.email,
      phone: normalized.phone,
      experience: normalized.experience || null,
      specialty: normalized.specialty.length > 0 ? normalized.specialty : null,
      message: normalized.message || null,
      instagram: normalized.instagram || null,
      currentBusiness: normalized.currentBusiness || null,
      desiredStartDate: normalized.desiredStartDate || null,
      boothDays: normalized.boothDays ?? null,
    });
  } catch (dbError) {
    console.error("Failed to persist work-with-us submission", dbError instanceof Error ? dbError.name : "UnknownError");
    return { success: false, error: "We couldn’t save your application. Please try again." };
  }

  try {
    const subjectName = normalized.name.replace(/[\r\n]+/g, " ");
    const subject = `[LashPop] New ${formatPathTitle(path)} - ${subjectName}`;
    const textBody = buildEmailBody(normalized, path);
    const htmlBody = buildHtmlEmailBody(normalized, path);

    // Send to primary recipient
    const res = await fetch(`${MOX_API_URL}/api/v1/emails/send`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${MOX_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: SENDER_EMAIL,
        to: [RECIPIENT_EMAIL],
        subject,
        text: textBody,
        html: htmlBody,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Mox API error (${res.status}): ${body}`);
    }

  } catch (error) {
    // The application is already safe in the admin inbox. Avoid encouraging a
    // retry that would create a duplicate merely because notification failed.
    console.error("Error sending work-with-us email", error instanceof Error ? error.name : "UnknownError");
  }

  return { success: true };
}

/**
 * Read all careers-form submissions, newest first. Admin-only (called from the
 * /admin/inbox/work-with-us page, which is gated by requireAdmin).
 */
export async function listWorkWithUsSubmissions() {
  await requireAdmin();
  const db = getDb();
  return db
    .select()
    .from(workWithUsSubmissions)
    .orderBy(desc(workWithUsSubmissions.createdAt));
}
