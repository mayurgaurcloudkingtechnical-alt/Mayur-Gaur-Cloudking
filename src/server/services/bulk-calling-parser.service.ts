import { db } from "@/server/db/client";
import { normalizePhone, normalizeEmail } from "./crm-lead.service";

export interface RawImportRow {
  name?: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  city?: string;
  state?: string;
  course?: string;
  source?: string;
  campaign?: string;
  language?: string;
  remarks?: string;
  consent?: string | boolean | number;
  customFields?: Record<string, any> | string;
}

export interface ValidatedImportRow {
  index: number;
  name: string;
  phone: string;
  alternatePhone?: string;
  email?: string;
  city?: string;
  state?: string;
  course?: string;
  matchedCourseId?: string;
  matchedCourseTitle?: string;
  source: string;
  campaign?: string;
  language: string;
  remarks?: string;
  consentGiven: boolean;
  customFields?: Record<string, any>;
  
  isValid: boolean;
  isCallable: boolean;
  isDuplicateInBatch: boolean;
  isDuplicateInLms: boolean;
  existingLeadId?: string;
  isDnc: boolean;
  validationErrors: string[];
  skipReason?: string;
}

export interface PreUploadValidationResult {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  duplicateLmsRows: number;
  dncRows: number;
  skippedRows: number;
  callableRows: number;
  rows: ValidatedImportRow[];
}

export class BulkCallingParserService {
  /**
   * Generates standard sample template rows for CSV/Excel download
   */
  public static getTemplateHeaders(): string[] {
    return [
      "Name",
      "Phone",
      "Alternate Phone",
      "Email",
      "City",
      "State",
      "Course",
      "Source",
      "Campaign",
      "Language",
      "Remarks",
      "Consent",
      "Custom Fields",
    ];
  }

  public static getSampleRows(): Record<string, string>[] {
    return [
      {
        Name: "Rahul Sharma",
        Phone: "9876543210",
        "Alternate Phone": "",
        Email: "rahul.sharma@example.com",
        City: "Prayagraj",
        State: "Uttar Pradesh",
        Course: "Artificial Intelligence & Machine Learning",
        Source: "Website Bulk",
        Campaign: "Sept-Admissions-2026",
        Language: "Hindi",
        Remarks: "Interested in weekend batch, working professional",
        Consent: "YES",
        "Custom Fields": "Experience: 2 yrs, Budget: 50k",
      },
      {
        Name: "Priya Patel",
        Phone: "9123456789",
        "Alternate Phone": "9123456780",
        Email: "priya.patel@example.com",
        City: "Delhi",
        State: "Delhi",
        Course: "Data Science & Business Analytics",
        Source: "Google Ads",
        Campaign: "Career-Upgrade",
        Language: "English",
        Remarks: "Looking for placement assistance and demo class",
        Consent: "YES",
        "Custom Fields": "Qualification: B.Tech",
      },
      {
        Name: "Amit Kumar",
        Phone: "9988776655",
        "Alternate Phone": "",
        Email: "amit.k@example.com",
        City: "Lucknow",
        State: "Uttar Pradesh",
        Course: "Full Stack Web Development",
        Source: "Meta Ads",
        Campaign: "Tech-Launch-2026",
        Language: "Hindi",
        Remarks: "Final year student seeking career transition",
        Consent: "YES",
        "Custom Fields": "College: Lucknow University",
      },
    ];
  }

  /**
   * Pre-upload validation:
   * Analyzes raw uploaded rows against database courses, DNC list, and existing leads
   */
  public static async validateRows(rawRows: RawImportRow[]): Promise<PreUploadValidationResult> {
    // 1. Fetch active courses for fuzzy course matching
    const courses = await db.course.findMany({
      select: { id: true, title: true, slug: true },
      where: { deletedAt: null },
    });

    // 2. Fetch all DNC numbers
    const dncList = await db.doNotCallNumber.findMany({
      select: { phone: true },
    });
    const dncSet = new Set(dncList.map((d) => normalizePhone(d.phone)));

    // 3. Extract and normalize all phone numbers in the batch
    const phoneToIndices = new Map<string, number[]>();
    const normalizedPhones: string[] = [];

    rawRows.forEach((r, idx) => {
      const clean = normalizePhone(r.phone || "");
      if (clean) {
        normalizedPhones.push(clean);
        const existing = phoneToIndices.get(clean) || [];
        existing.push(idx);
        phoneToIndices.set(clean, existing);
      }
    });

    // 4. Query existing LMS leads matching any normalized phone
    const existingLeads = await db.lead.findMany({
      where: {
        phone: { in: normalizedPhones },
      },
      select: {
        id: true,
        phone: true,
        fullName: true,
        status: true,
      },
    });
    const existingLeadMap = new Map<string, { id: string; name: string; status: string }>();
    existingLeads.forEach((l) => {
      existingLeadMap.set(normalizePhone(l.phone), { id: l.id, name: l.fullName, status: l.status });
    });

    let totalRows = 0;
    let validRows = 0;
    let invalidRows = 0;
    let duplicateRows = 0;
    let duplicateLmsRows = 0;
    let dncRows = 0;
    let skippedRows = 0;
    let callableRows = 0;

    const validatedRows: ValidatedImportRow[] = [];
    const seenPhonesInBatch = new Set<string>();

    for (let i = 0; i < rawRows.length; i++) {
      const raw = rawRows[i];
      if (!raw) continue;

      totalRows++;
      const errors: string[] = [];
      const cleanPhone = normalizePhone(raw.phone || "");
      const cleanEmail = raw.email ? normalizeEmail(raw.email) : undefined;
      const cleanName = (raw.name || "").trim() || "Prospective Learner";
      const cleanSource = (raw.source || "BULK_UPLOAD").trim();
      const cleanLang = (raw.language || "Hindi").trim();

      // Validate Phone
      if (!cleanPhone) {
        errors.push("Phone number is required");
      } else if (cleanPhone.length < 10) {
        errors.push("Phone number must have at least 10 digits");
      }

      // Check Consent
      let consentGiven = true;
      if (raw.consent !== undefined && raw.consent !== null) {
        const valStr = String(raw.consent).trim().toUpperCase();
        if (valStr === "NO" || valStr === "FALSE" || valStr === "0") {
          consentGiven = false;
        }
      }

      // Check In-Batch Duplicate
      let isDuplicateInBatch = false;
      if (cleanPhone) {
        if (seenPhonesInBatch.has(cleanPhone)) {
          isDuplicateInBatch = true;
        } else {
          seenPhonesInBatch.add(cleanPhone);
        }
      }

      // Check DNC List
      const isDnc = cleanPhone ? dncSet.has(cleanPhone) : false;

      // Check Existing LMS Lead
      const existingLead = cleanPhone ? existingLeadMap.get(cleanPhone) : undefined;
      const isDuplicateInLms = Boolean(existingLead);

      // Course Matching
      let matchedCourseId: string | undefined;
      let matchedCourseTitle: string | undefined;
      if (raw.course) {
        const cLower = raw.course.toLowerCase().trim();
        const matched = courses.find(
          (c) =>
            c.id === raw.course ||
            c.slug.toLowerCase() === cLower ||
            c.title.toLowerCase().includes(cLower) ||
            cLower.includes(c.title.toLowerCase())
        );
        if (matched) {
          matchedCourseId = matched.id;
          matchedCourseTitle = matched.title;
        }
      }

      // Parse Custom Fields
      let customFields: Record<string, any> | undefined;
      if (typeof raw.customFields === "object" && raw.customFields !== null) {
        customFields = raw.customFields;
      } else if (typeof raw.customFields === "string" && raw.customFields.trim()) {
        try {
          customFields = JSON.parse(raw.customFields);
        } catch {
          // If key-value text like "Experience: 2 yrs, Qualification: B.Tech"
          const parsed: Record<string, string> = {};
          raw.customFields.split(",").forEach((item) => {
            const [k, v] = item.split(":");
            if (k && v) {
              parsed[k.trim()] = v.trim();
            }
          });
          customFields = Object.keys(parsed).length > 0 ? parsed : { rawText: raw.customFields };
        }
      }

      const isValid = errors.length === 0;
      let isCallable = false;
      let skipReason: string | undefined;

      if (!isValid) {
        invalidRows++;
        skipReason = errors.join("; ");
      } else if (isDuplicateInBatch) {
        duplicateRows++;
        skippedRows++;
        skipReason = "Duplicate record within uploaded file";
      } else if (!consentGiven) {
        skippedRows++;
        skipReason = "Missing consent / Explicit calling permission declined";
      } else if (isDnc) {
        dncRows++;
        skippedRows++;
        skipReason = "Registered in Do-Not-Call registry";
      } else {
        validRows++;
        isCallable = true;
      }

      if (isDuplicateInLms) {
        duplicateLmsRows++;
      }

      if (isCallable) {
        callableRows++;
      }

      validatedRows.push({
        index: i + 1,
        name: cleanName,
        phone: cleanPhone,
        alternatePhone: raw.alternatePhone?.trim(),
        email: cleanEmail,
        city: raw.city?.trim(),
        state: raw.state?.trim(),
        course: raw.course?.trim(),
        matchedCourseId,
        matchedCourseTitle,
        source: cleanSource,
        campaign: raw.campaign?.trim(),
        language: cleanLang,
        remarks: raw.remarks?.trim(),
        consentGiven,
        customFields,
        isValid,
        isCallable,
        isDuplicateInBatch,
        isDuplicateInLms,
        existingLeadId: existingLead?.id,
        isDnc,
        validationErrors: errors,
        skipReason,
      });
    }

    return {
      totalRows,
      validRows,
      invalidRows,
      duplicateRows,
      duplicateLmsRows,
      dncRows,
      skippedRows,
      callableRows,
      rows: validatedRows,
    };
  }

  /**
   * Helper to parse CSV string into RawImportRow[]
   */
  public static parseCsv(csvContent: string): RawImportRow[] {
    const lines = csvContent.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = BulkCallingParserService.parseCsvLine(lines[0] || "").map((h) =>
      h.trim().toLowerCase().replace(/[^a-z0-9]/g, "")
    );

    const rows: RawImportRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line) continue;
      const values = BulkCallingParserService.parseCsvLine(line);
      const rowObj: Record<string, string> = {};

      headers.forEach((h, hIdx) => {
        rowObj[h] = (values[hIdx] || "").trim();
      });

      // Map common header variations
      const name = rowObj["name"] || rowObj["fullname"] || rowObj["studentname"] || rowObj["candidate"];
      const phone = rowObj["phone"] || rowObj["phonenumber"] || rowObj["mobile"] || rowObj["mobilenumber"] || rowObj["contact"];
      const alternatePhone = rowObj["alternatephone"] || rowObj["altphone"] || rowObj["altmobile"];
      const email = rowObj["email"] || rowObj["emailaddress"] || rowObj["mail"];
      const city = rowObj["city"] || rowObj["location"];
      const state = rowObj["state"];
      const course = rowObj["course"] || rowObj["coursetitle"] || rowObj["program"] || rowObj["interestedcourse"];
      const source = rowObj["source"] || rowObj["leadsource"];
      const campaign = rowObj["campaign"] || rowObj["campaignname"];
      const language = rowObj["language"] || rowObj["preferredlanguage"] || rowObj["lang"];
      const remarks = rowObj["remarks"] || rowObj["notes"] || rowObj["comment"];
      const consent = rowObj["consent"] || rowObj["permission"] || rowObj["callingpermission"] || rowObj["optin"];
      const customFields = rowObj["customfields"] || rowObj["custom"] || rowObj["other"];

      if (phone) {
        rows.push({
          name,
          phone,
          alternatePhone,
          email,
          city,
          state,
          course,
          source,
          campaign,
          language,
          remarks,
          consent,
          customFields,
        });
      }
    }

    return rows;
  }

  private static parseCsvLine(text: string): string[] {
    const result: string[] = [];
    let cur = "";
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c === '"') {
        if (inQuotes && text[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (c === "," && !inQuotes) {
        result.push(cur);
        cur = "";
      } else {
        cur += c;
      }
    }
    result.push(cur);
    return result;
  }
}
