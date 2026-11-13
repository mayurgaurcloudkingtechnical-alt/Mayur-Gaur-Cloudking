import { db } from "@/server/db/client";
import { AuthenticatedUser } from "@/server/auth/rbac";
import { TRPCError } from "@trpc/server";
import { NoteType, NotePartyType, NoteStatus, UserRoleCode } from "@prisma/client";

export interface CreateNoteInput {
  noteType: NoteType;
  partyType: NotePartyType;
  gstInvoiceId?: string;
  vendorBillId?: string;
  noteDate?: Date;
  reason: string;
  taxableAmountPaise: number;
  cgstAmountPaise?: number;
  sgstAmountPaise?: number;
  igstAmountPaise?: number;
}

export class CreditDebitNoteService {
  /**
   * Generates sequential note number: CN-YYYY-XXXX or DN-YYYY-XXXX
   */
  public static async generateNextNoteNumber(type: NoteType): Promise<string> {
    const prefix = type === NoteType.CREDIT_NOTE ? "CN" : "DN";
    const count = await db.creditDebitNote.count({ where: { noteType: type } });
    const seq = String(count + 1).padStart(4, "0");
    return `${prefix}-2026-${seq}`;
  }

  /**
   * Issue a statutory Credit Note or Debit Note
   */
  public static async createNote(actor: AuthenticatedUser, input: CreateNoteInput, ipAddress?: string) {
    if (!["SUPER_ADMIN", "DIRECTOR", "ADMIN", "ACCOUNTANT"].includes(actor.roleCode)) {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "You lack authority to issue Credit Notes or Debit Notes.",
      });
    }

    if (input.taxableAmountPaise <= 0) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Taxable adjustment amount must be greater than zero.",
      });
    }

    let gstInvoice = null;
    let vendorBill = null;

    if (input.gstInvoiceId) {
      gstInvoice = await db.gstInvoice.findUnique({ where: { id: input.gstInvoiceId } });
      if (!gstInvoice) throw new TRPCError({ code: "NOT_FOUND", message: "Linked GST Invoice not found." });
    }

    if (input.vendorBillId) {
      vendorBill = await db.vendorBill.findUnique({ where: { id: input.vendorBillId } });
      if (!vendorBill) throw new TRPCError({ code: "NOT_FOUND", message: "Linked Vendor Bill not found." });
    }

    const cgst = input.cgstAmountPaise || 0;
    const sgst = input.sgstAmountPaise || 0;
    const igst = input.igstAmountPaise || 0;
    const totalAmount = input.taxableAmountPaise + cgst + sgst + igst;

    const noteNumber = await this.generateNextNoteNumber(input.noteType);

    const note = await db.creditDebitNote.create({
      data: {
        noteNumber,
        noteType: input.noteType,
        partyType: input.partyType,
        gstInvoiceId: input.gstInvoiceId || null,
        vendorBillId: input.vendorBillId || null,
        noteDate: input.noteDate || new Date(),
        reason: input.reason.trim(),
        taxableAmountPaise: input.taxableAmountPaise,
        cgstAmountPaise: cgst,
        sgstAmountPaise: sgst,
        igstAmountPaise: igst,
        totalAmountPaise: totalAmount,
        status: NoteStatus.ISSUED,
        createdById: actor.id,
        approvedById: actor.id,
      },
    });

    // If Credit Note on Customer Invoice: reduce receivable balance
    if (input.noteType === NoteType.CREDIT_NOTE && gstInvoice) {
      const newBal = Math.max(0, gstInvoice.balanceAmountPaise - totalAmount);
      await db.gstInvoice.update({
        where: { id: gstInvoice.id },
        data: { balanceAmountPaise: newBal },
      });

      // Ledger reversal: Debit Output Tax & Revenue, Credit Accounts Receivable
      const date = note.noteDate;
      await db.generalLedgerEntry.create({
        data: {
          entryNumber: `GLE-${note.noteNumber}-AR-REV`,
          entryDate: date,
          accountCode: "AR-CUSTOMERS",
          accountName: "Accounts Receivable — Reversal via Credit Note",
          debitPaise: 0,
          creditPaise: totalAmount,
          sourceDocumentType: "CREDIT_NOTE",
          sourceDocumentId: note.id,
          description: `Credit Note #${note.noteNumber} applied on ${gstInvoice.invoiceNumber}`,
          financialYear: "2025-26",
          createdById: actor.id,
        },
      });
    }

    await db.financialAuditLog.create({
      data: {
        action: `${input.noteType}_ISSUED`,
        entityType: "CreditDebitNote",
        entityId: note.id,
        actorId: actor.id,
        actorName: `${actor.firstName} ${actor.lastName}`.trim(),
        actorRole: actor.roleCode,
        newState: {
          noteNumber: note.noteNumber,
          noteType: note.noteType,
          totalAmountPaise: note.totalAmountPaise,
          reason: note.reason,
        },
        ipAddress: ipAddress || null,
      },
    });

    return note;
  }

  /**
   * Lists Credit and Debit Notes with filters
   */
  public static async listNotes(
    actor: AuthenticatedUser,
    params: {
      noteType?: NoteType;
      partyType?: NotePartyType;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (params.noteType) where.noteType = params.noteType;
    if (params.partyType) where.partyType = params.partyType;

    if (params.search?.trim()) {
      const q = params.search.trim();
      where.OR = [
        { noteNumber: { contains: q, mode: "insensitive" } },
        { reason: { contains: q, mode: "insensitive" } },
      ];
    }

    const [notes, totalCount] = await Promise.all([
      db.creditDebitNote.findMany({
        where,
        include: {
          gstInvoice: { select: { id: true, invoiceNumber: true, customerName: true } },
          vendorBill: { select: { id: true, billNumber: true, vendor: { select: { name: true } } } },
        },
        orderBy: { noteDate: "desc" },
        skip,
        take: limit,
      }),
      db.creditDebitNote.count({ where }),
    ]);

    return { notes, totalCount, page, limit, totalPages: Math.ceil(totalCount / limit) };
  }
}
