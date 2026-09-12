# SOFTLAB GLOBAL — Payment & Financial Ledger Architecture

> **Document Version:** 1.0.0  
> **Status:** Production Standard  
> **Target Gateway:** Razorpay (India) via Provider-Agnostic Interface  
> **Currency Format:** INR (Integer Paise: 100 Paise = ₹1.00)

---

## 1. Core Principles of Financial Processing

1. **Client Untrustworthiness**: The frontend client is strictly treated as an unauthenticated display terminal. The payment amount, fee structure, and discount amounts are calculated and retrieved exclusively from the PostgreSQL database on the server.
2. **Provider Decoupling (Adapter Pattern)**: Business workflows (admissions, student enrollment, fee receipts) depend on an abstract `PaymentGateway` interface. The underlying processor (Razorpay, Cashfree, PayU, or Stripe) can be swapped via configuration without touching business logic.
3. **Double Verification**: A payment is never finalized based merely on client checkout callback. The authoritative source of truth is the cryptographically signed webhook verified by HMAC-SHA256, corroborated by a server-to-server inquiry against the gateway's REST API.
4. **Idempotency & Replay Resistance**: Every incoming webhook event is checked for previous processing using a persistent ledger key. Duplicate webhooks immediately return `HTTP 200 OK` without triggering duplicate enrollments or ledger entries.
5. **Atomic Ledger Transitions**: Payment status updates, receipt generation, and LMS course enrollments execute within an ACID-compliant PostgreSQL transaction.

---

## 2. Payment Lifecycle & State Machine

```
[ Prospective Student / Admission Record ]
                     │
                     ▼
       ┌───────────────────────────┐
       │ 1. Initiate Checkout      │ ◄── Student clicks "Pay Fees"
       └─────────────┬─────────────┘
                     │
                     ▼
       ┌───────────────────────────┐
       │ 2. Create Server Order    │ ◄── Server checks Admission: status=APPROVED
       │    (tRPC: payments.order) │     Fetches finalPayableFee from DB (NOT client)
       └─────────────┬─────────────┘     Calls Gateway.createOrder()
                     │
                     ▼
       ┌───────────────────────────┐
       │ 3. Client Opens Checkout  │ ◄── Razorpay modal opens with Gateway Order ID
       └─────────────┬─────────────┘
                     │
        ┌────────────┴────────────┐
        ▼                         ▼
 [ Payment Fails ]        [ Student Authorizes Payment ]
        │                         │
        ▼                         ▼
   Status: FAILED          Gateway dispatches Webhook: `payment.captured`
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ 4. Ingest Raw Webhook     │
                    │    /api/webhooks/razorpay │
                    └─────────────┬─────────────┘
                                  │
                                  ▼
                    ┌───────────────────────────┐
                    │ 5. HMAC-SHA256 Signature  │
                    │    Verification           │
                    └─────────────┬─────────────┘
                                  │
                       ┌──────────┴──────────┐
                       ▼                     ▼
                  [ INVALID ]           [ VALID ]
                       │                     │
                       ▼                     ▼
                 Return 400 Bad      Check Idempotency:
                 Reject Request      Is payment already marked SUCCESS?
                                             ├── YES ──► Return 200 OK (Skip)
                                             └── NO
                                                  │
                                                  ▼
                                     Server-to-Server Inquiry
                                     Verify captured amount === Payment.amount
                                                  │
                                                  ▼
                                     PRISMA TRANSACTION:
                                     1. Update Payment status: SUCCESS
                                     2. Generate unique Receipt No: REC-XXXXX
                                     3. Create Enrollment record (Active LMS access)
                                     4. Update Admission status: ENROLLED
                                     5. Queue Email & SMS Receipt Dispatch
                                                  │
                                                  ▼
                                           Return 200 OK
```

---

## 3. Provider-Agnostic Interface Specification

```typescript
// server/lib/payment/payment-gateway.interface.ts

export interface GatewayOrderParams {
  amountPaise: number;
  currency: 'INR';
  receiptIdentifier: string; // Internal Admission/Payment ID
  notes?: Record<string, string>;
}

export interface GatewayOrderResult {
  gatewayOrderId: string;
  amountPaise: number;
  currency: string;
}

export interface WebhookVerificationParams {
  rawPayload: Buffer | string;
  signature: string;
  secret: string;
}

export interface GatewayPaymentDetails {
  paymentId: string;
  orderId: string;
  amountPaise: number;
  status: 'captured' | 'failed' | 'refunded';
  method: string; // "upi", "card", "netbanking"
}

export interface PaymentGateway {
  readonly providerName: string;
  createOrder(params: GatewayOrderParams): Promise<GatewayOrderResult>;
  verifyWebhookSignature(params: WebhookVerificationParams): boolean;
  fetchPaymentDetails(gatewayPaymentId: string): Promise<GatewayPaymentDetails>;
}
```

---

## 4. Razorpay Implementation Architecture

```typescript
// server/lib/payment/razorpay.gateway.ts
import Razorpay from 'razorpay';
import crypto from 'crypto';
import type { 
  PaymentGateway, 
  GatewayOrderParams, 
  GatewayOrderResult, 
  WebhookVerificationParams,
  GatewayPaymentDetails 
} from './payment-gateway.interface';

export class RazorpayGateway implements PaymentGateway {
  public readonly providerName = 'RAZORPAY';
  private client: Razorpay;

  constructor() {
    if (!process.env.RAZORPAY_KEY_SECRET || !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID) {
      throw new Error('Missing Razorpay credentials in environment variables.');
    }
    this.client = new Razorpay({
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }

  async createOrder(params: GatewayOrderParams): Promise<GatewayOrderResult> {
    const order = await this.client.orders.create({
      amount: params.amountPaise,
      currency: params.currency,
      receipt: params.receiptIdentifier,
      notes: params.notes,
    });

    return {
      gatewayOrderId: order.id,
      amountPaise: Number(order.amount),
      currency: order.currency,
    };
  }

  verifyWebhookSignature({ rawPayload, signature, secret }: WebhookVerificationParams): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(rawPayload)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'utf8'),
      Buffer.from(expectedSignature, 'utf8')
    );
  }

  async fetchPaymentDetails(gatewayPaymentId: string): Promise<GatewayPaymentDetails> {
    const payment = await this.client.payments.fetch(gatewayPaymentId);
    return {
      paymentId: payment.id,
      orderId: payment.order_id as string,
      amountPaise: Number(payment.amount),
      status: payment.status as 'captured' | 'failed' | 'refunded',
      method: payment.method,
    };
  }
}
```

---

## 5. Webhook Ingestion & Idempotency Implementation

The webhook endpoint must read the **raw body buffer** before JSON parsing to guarantee valid HMAC verification:

```typescript
// app/api/webhooks/razorpay/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getPaymentGateway } from '@/server/lib/payment/gateway.factory';
import { paymentService } from '@/server/services/payment.service';

export async function POST(req: NextRequest) {
  try {
    // 1. Extract raw binary buffer for signature calculation
    const rawBodyBuffer = Buffer.from(await req.arrayBuffer());
    const signature = req.headers.get('x-razorpay-signature');

    if (!signature) {
      return NextResponse.json({ error: 'Missing webhook signature' }, { status: 400 });
    }

    const gateway = getPaymentGateway();
    const isValid = gateway.verifyWebhookSignature({
      rawPayload: rawBodyBuffer,
      signature,
      secret: process.env.RAZORPAY_WEBHOOK_SECRET!,
    });

    if (!isValid) {
      console.error('[SECURITY_ALERT] Invalid webhook signature detected.');
      return NextResponse.json({ error: 'Invalid HMAC signature' }, { status: 400 });
    }

    // 2. Parse payload safely
    const payload = JSON.parse(rawBodyBuffer.toString('utf8'));

    // 3. Process captured payment
    if (payload.event === 'payment.captured') {
      const paymentEntity = payload.payload.payment.entity;
      await paymentService.processCapturedPayment({
        gatewayOrderId: paymentEntity.order_id,
        gatewayPaymentId: paymentEntity.id,
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK_ERROR]', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
```

---

## 6. Atomic Post-Payment LMS Enrollment

When `paymentService.processCapturedPayment` runs, it wraps the entire workflow in a single database transaction:

```typescript
// server/services/payment.service.ts
export class PaymentService {
  async processCapturedPayment({ gatewayOrderId, gatewayPaymentId }: { gatewayOrderId: string; gatewayPaymentId: string }) {
    return prisma.$transaction(async (tx) => {
      // 1. Fetch payment record
      const payment = await tx.payment.findUniqueOrThrow({
        where: { gatewayOrderId },
        include: { admission: { include: { lead: true, course: true } } },
      });

      // 2. Idempotency guard: Return early if already processed
      if (payment.status === 'SUCCESS' && payment.webhookVerified) {
        return payment;
      }

      // 3. Server-to-server verification check
      const gateway = getPaymentGateway();
      const verifiedDetails = await gateway.fetchPaymentDetails(gatewayPaymentId);

      if (verifiedDetails.amountPaise !== payment.amount) {
        throw new Error(`CRITICAL: Payment amount mismatch. Expected: ${payment.amount}, Received: ${verifiedDetails.amountPaise}`);
      }

      // 4. Generate official receipt number: e.g. REC-2024-00123
      const receiptNo = `REC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // 5. Update payment state
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'SUCCESS',
          gatewayPaymentId,
          webhookVerified: true,
          webhookReceivedAt: new Date(),
          receiptNumber: receiptNo,
        },
      });

      // 6. Update admission state
      await tx.admission.update({
        where: { id: payment.admissionId },
        data: { status: 'ENROLLED' },
      });

      // 7. Ensure student account and profile exists
      let studentUser = await tx.user.findUnique({
        where: { email: payment.admission.lead.email || '' },
        include: { studentProfile: true },
      });

      if (!studentUser) {
        // Create user with default temporary password (student sets on first login)
        const tempPasswordHash = await bcrypt.hash(payment.admission.lead.phone, 12);
        studentUser = await tx.user.create({
          data: {
            email: payment.admission.lead.email || `${payment.admission.lead.phone}@softlabglobal.com`,
            phone: payment.admission.lead.phone,
            passwordHash: tempPasswordHash,
            firstName: payment.admission.lead.name.split(' ')[0] || 'Student',
            lastName: payment.admission.lead.name.split(' ').slice(1).join(' ') || 'Learner',
            roleCode: 'STUDENT',
            studentProfile: {
              create: {
                studentId: `SLG-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
              },
            },
          },
          include: { studentProfile: true },
        });
      }

      // 8. Create Enrollment record granting instant LMS access
      await tx.enrollment.upsert({
        where: {
          studentId_courseId: {
            studentId: studentUser.studentProfile!.id,
            courseId: payment.admission.courseId,
          },
        },
        create: {
          studentId: studentUser.studentProfile!.id,
          courseId: payment.admission.courseId,
          batchId: payment.admission.batchId,
          admissionId: payment.admission.id,
          status: 'ACTIVE',
        },
        update: {
          status: 'ACTIVE',
        },
      });

      // 9. Dispatch background job for Receipt PDF and Welcome SMS/Email
      await queueNotificationJob({
        type: 'ADMISSION_CONFIRMATION',
        recipientEmail: studentUser.email,
        receiptNo,
        courseTitle: payment.admission.course.title,
      });
    });
  }
}
```

---

## 7. Offline Payment Workflow (Cash / Manual UPI)

For students paying at the institutional admissions counter:
1. **Initiation**: The Counselor records an admission with discount approvals if required.
2. **Accountant Verification**: Only an authorized user with `payments:record_offline` (Accountant, Admin, Director) can access the cash collection interface.
3. **Transaction Details**: Accountant inputs payment mode (`OFFLINE_CASH`, `OFFLINE_BANK_TRANSFER`, `OFFLINE_UPI`), physical receipt serial number, and transaction UTR.
4. **Audit Logging**: An immutable record is created in `AuditLog` storing the accountant's user ID, IP address, timestamp, and amount collected.
5. **Auto-Enrollment**: The same `processCapturedPayment` atomic enrollment transaction executes, granting the student immediate access.
