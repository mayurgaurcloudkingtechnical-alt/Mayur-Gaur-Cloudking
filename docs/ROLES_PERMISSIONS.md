# SOFTLAB GLOBAL — Roles & Permissions (RBAC) Architecture

> **Document Version:** 1.0.0  
> **Status:** Production Standard  
> **Core Principle:** Server-Side Authorization Invariance (Never trust client hiding)

---

## 1. Architectural Foundations of RBAC

In SOFTLAB GLOBAL, access control is enforced at the **API and Service Layer**, not in the UI:
1. **Frontend Visibility**: Hiding navigation links, action buttons, or forms is purely an ergonomic convenience.
2. **Procedure-Level Guards**: Every tRPC procedure and API Route Handler evaluates session identity, user role, and required permission claims before invoking domain services.
3. **Data-Level Tenancy & Scoping**: Even when a role has read permissions, data queries are scoped (e.g., a `TRAINER` can view students, but *only* students enrolled in batches assigned to that specific trainer; a `COUNSELOR` views leads assigned to them unless granted managerial override).
4. **Hierarchical Authority Boundaries**: High-impact business actions—specifically course pricing discounts, exam result publication, and certificate revocations—require explicit hierarchical authorization.

---

## 2. The 11 Institutional Roles

| Role Code | Role Title | Portal Entry | System Description |
|---|---|---|---|
| `SUPER_ADMIN` | Super Administrator | `/admin` | Root authority. System settings, RBAC definitions, database tools, audit log review. |
| `DIRECTOR` | Executive Director | `/admin` | Executive management. Global reports, financial analytics, 100% discount authority. |
| `ADMIN` | Operations Admin | `/admin` | Day-to-day ERP manager. Course lifecycle, batch scheduling, certificates, staff. |
| `MANAGER` | Academic / Sales Manager | `/admin` & `/counselor` | Team oversight. Lead redistribution, mid-tier discount approval (up to 30%). |
| `COUNSELOR` | Senior Academic Counselor | `/counselor` | Lead intake, prospective student counseling, standard admissions (up to 10% discount). |
| `TELECALLER` | Telecaller / Outbound Rep | `/counselor` | Cold pipeline outreach, call logging, appointment/demo scheduling. |
| `TRAINER` | Faculty / Instructor | `/trainer` | Assigned curriculum delivery, attendance marking, grading. **Zero financial visibility.** |
| `HR` | Human Resources Officer | `/admin/hr` | Staff records, employee onboarding, attendance, leave approval workflows. |
| `ACCOUNTANT` | Accounts Officer | `/admin/finance` | Fee verification, offline cash/UPI receipts, payment reconciliation, tax reports. |
| `PLACEMENT_OFFICER` | Placement Executive | `/admin/placement` | Recruiter relations, job postings, student placement profiles, drive coordination. |
| `STUDENT` | Enrolled Learner | `/student` | Curriculum consumption, assignments, quizzes, certificates, resume profile. |

---

## 3. Granular Permission Namespace

Permissions follow the standard syntax: `domain:resource:action`

### 3.1 Course & Curriculum Domain
- `courses:read` — View course catalog
- `courses:create` — Create new course shells
- `courses:update` — Edit title, summary, fees, syllabus
- `courses:delete` — Soft-delete course records
- `courses:publish` — Toggle `PUBLISHED` status to make course live on website/marketplace
- `content:manage` — Add, reorder, update modules and lessons

### 3.2 Lead & Counselor CRM Domain
- `leads:create` — Log new leads into the CRM
- `leads:read_own` — View leads assigned to self
- `leads:read_all` — View all leads across the organization
- `leads:update` — Log follow-up notes, change lead status
- `leads:assign` — Reassign lead ownership to another counselor/telecaller
- `leads:delete` — Archive/delete invalid lead records

### 3.3 Admissions & Discount Authority Domain
- `admissions:create` — Initiate student admission from qualified lead
- `admissions:read` — View student admission records
- `discounts:apply_tier1` — Apply discount up to 10% (Counselor limit)
- `discounts:apply_tier2` — Apply discount up to 30% (Manager limit)
- `discounts:apply_tier3` — Apply discount up to 50% (Admin limit)
- `discounts:apply_full` — Apply arbitrary discount up to 100% (Director / Super Admin)
- `admissions:approve_discount` — Approve pending discount requests exceeding lower thresholds

### 3.4 Batches, Attendance & Live Classes
- `batches:manage` — Create batches, allocate trainers, configure dates
- `attendance:mark` — Mark attendance for an assigned batch
- `attendance:view_batch` — View attendance analytics for assigned batch
- `attendance:view_all` — View global institutional attendance records
- `classes:schedule` — Create live class meetings and Zoom/Meet links

### 3.5 Assessments, Exams & Marksheets
- `exams:create` — Author question bank items and build exam papers
- `exams:publish` — Make exams active for batch attempt
- `exams:take` — Start, answer, and submit exams (Student only)
- `exams:grade` — Evaluate subjective answers and record marks
- `results:publish` — Release digital marksheets to students

### 3.6 Certificates & Digital Verification
- `certificates:issue` — Generate official certificate with unique identifier
- `certificates:revoke` — Invalidate a previously issued certificate
- `certificates:verify` — Public unauthenticated endpoint to verify authenticity

### 3.7 Payments & Financial Accounting
- `payments:create_order` — Generate Razorpay online checkout session
- `payments:record_offline` — Manually record cash, bank transfer, or offline UPI fee
- `payments:view_ledger` — View institutional collection, pending dues, fee reports
- `payments:refund` — Process tuition refunds (Super Admin / Director only)

### 3.8 Placement & Career Services
- `placement:manage_companies` — Onboard hiring partners and corporate contacts
- `placement:manage_jobs` — Post job opportunities and criteria
- `placement:view_students` — View student resumes, portfolios, and skills
- `placement:update_status` — Record interview shortlists, selections, and offers

### 3.9 Human Resources
- `hr:employees:manage` — Staff directory, designation mapping, employee contracts
- `hr:leaves:review` — Approve or reject employee leave applications
- `hr:sensitive:view` — View confidential payroll and salary allocations

---

## 4. Comprehensive Role-Permission Matrix

| Permission Code | SUPER_ADMIN | DIRECTOR | ADMIN | MANAGER | COUNSELOR | TELECALLER | TRAINER | HR | ACCOUNTANT | PLACEMENT | STUDENT |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| `courses:read` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (Own) | ❌ | ❌ | ❌ | ✅ (Enrolled) |
| `courses:create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `courses:update` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `courses:publish` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `content:manage` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (Assigned) | ❌ | ❌ | ❌ | ❌ |
| `leads:create` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `leads:read_own` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `leads:read_all` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `leads:assign` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `admissions:create` | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `discounts:apply_tier1` | ✅ | ✅ | ✅ | ✅ | ✅ (≤10%) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `discounts:apply_tier2` | ✅ | ✅ | ✅ | ✅ (≤30%) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `discounts:apply_tier3` | ✅ | ✅ | ✅ (≤50%) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `discounts:apply_full` | ✅ | ✅ (100%) | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `batches:manage` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `attendance:mark` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (Assigned) | ❌ | ❌ | ❌ | ❌ |
| `attendance:view_all` | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `exams:create` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (Assigned) | ❌ | ❌ | ❌ | ❌ |
| `exams:grade` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ (Assigned) | ❌ | ❌ | ❌ | ❌ |
| `exams:take` | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| `certificates:issue` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `certificates:revoke` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| `payments:record_offline`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `payments:view_ledger` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| `placement:manage_jobs` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `placement:view_students`| ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| `hr:employees:manage` | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |
| `hr:sensitive:view` | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ |

---

## 5. Discount Approval Hierarchy Engine

Discounts directly impact institutional revenue and must adhere to a strict server-side validation state machine:

```
[ Counselor Initiates Admission ]
             │
             ▼
[ Select Course: Base Fee = ₹50,000 ]
             │
             ▼
[ Inputs Requested Discount: e.g., 25% (₹12,500) ]
             │
             ▼
   Is Discount <= Counselor Cap (10%)?
        ├── YES ──► Status: APPROVED ──► Proceed to Payment Order
        │
        └── NO  ──► Status: PENDING_DISCOUNT_APPROVAL
                        │
                        ▼
                [ Notification Dispatched to Manager / Director ]
                        │
                        ▼
                Manager (Cap 30%) or Director (Cap 100%)
                        │
                  ┌─────┴─────┐
                  ▼           ▼
             [ APPROVE ]  [ REJECT ]
                  │           │
                  ▼           ▼
            Status: APPROVED  Status: CANCELLED / RE-NEGOTIATE
                  │
                  ▼
         [ Proceed to Payment ]
```

### Server-Side Validation Code Snippet (tRPC Procedure)
```typescript
// server/trpc/routers/admissions.ts
export const createAdmissionProcedure = protectedProcedure
  .use(requirePermission('admissions:create'))
  .input(createAdmissionSchema)
  .mutation(async ({ ctx, input }) => {
    const course = await ctx.db.course.findUniqueOrThrow({ where: { id: input.courseId } });
    const counselorRole = await ctx.db.role.findUniqueOrThrow({ where: { code: ctx.session.user.roleCode } });

    // Calculate server-side fee components
    let discountAmountPaise = 0;
    if (input.discountType === 'PERCENTAGE') {
      discountAmountPaise = Math.round((course.baseFee * input.discountValue) / 100);
    } else if (input.discountType === 'FIXED_AMOUNT') {
      discountAmountPaise = input.discountValue * 100; // converted to Paise
    }

    // Safety checks
    if (discountAmountPaise > course.baseFee) {
      throw new TRPCError({ code: 'BAD_REQUEST', message: 'Discount cannot exceed course fee.' });
    }

    const calculatedDiscountPercent = Math.round((discountAmountPaise / course.baseFee) * 100);
    const requiresApproval = calculatedDiscountPercent > counselorRole.maxDiscountPercent;

    return ctx.db.admission.create({
      data: {
        leadId: input.leadId,
        courseId: input.courseId,
        batchId: input.batchId,
        counselorId: ctx.session.user.id,
        originalCourseFee: course.baseFee,
        discountType: input.discountType,
        discountValue: input.discountValue,
        discountAmount: discountAmountPaise,
        finalPayableFee: course.baseFee - discountAmountPaise,
        status: requiresApproval ? 'PENDING_DISCOUNT_APPROVAL' : 'APPROVED',
        requiresApproval,
      },
    });
  });
```

---

## 6. Audit Logging of Sensitive Actions

Any modification to:
- User roles (e.g. promoting an employee to `ADMIN`)
- Discount overrides
- Offline payment approvals
- Certificate revocations

must write an atomic record to the `AuditLog` table within the same PostgreSQL transaction.
