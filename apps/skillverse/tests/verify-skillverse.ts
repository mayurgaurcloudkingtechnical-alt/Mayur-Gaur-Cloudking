/**
 * SLG SKILLVERSE — Automated Verification & Isolation Test Suite
 * Verifies:
 * 1. Brand identity, sub-brand governance, and subdomain routing constants
 * 2. Monthly Package Pricing (₹1,499 .. ₹3,999 with 12-month undiscounted comparison)
 * 3. Competitive Add-Ons & Initial Fee Rules (₹500 Admission + ₹500 Kit + Free Assessment & Demo)
 * 4. Complete Course Catalogue (24 published courses across Classes 8–12, Competitive, Coding, AI, Robotics, Communication)
 * 5. Transparent Fee Calculation Engine (never silently bundles optional add-ons)
 * 6. Multi-type Quiz & Assessment Engine (MCQ, MSQ, and Descriptive evaluation)
 * 7. Parent Portal SHA-256 PIN Hashing & Family Isolation
 * 8. Rate Limiting & Abuse Protection
 * 9. Free Academic & Skill Diagnostic Assessment Bank
 */

import assert from "node:assert/strict";
import {
  SKILLVERSE_BRAND,
  INITIAL_ACADEMIC_PACKAGES,
  INITIAL_COMPETITIVE_ADDONS,
  INITIAL_SKILLVERSE_FEE_RULES,
  INITIAL_SKILLVERSE_COURSES,
  INITIAL_DIAGNOSTIC_QUESTIONS,
} from "../../../src/lib/constants/skillverse-data";
import {
  SkillverseService,
  hashPin,
  checkSkillverseRateLimit,
} from "../../../src/server/services/skillverse.service";

async function runSkillverseVerificationSuite() {
  console.log("==========================================================");
  console.log("SLG SKILLVERSE — AUTOMATED VERIFICATION SUITE");
  console.log("==========================================================\n");

  // 1. Brand Governance & Subdomain Identity
  assert.equal(SKILLVERSE_BRAND.name, "SLG SKILLVERSE");
  assert.equal(SKILLVERSE_BRAND.parentBrand, "SoftLab Global");
  assert.equal(SKILLVERSE_BRAND.subdomainUrl, "https://skillverse.softlabglobal.com");
  assert.equal(SKILLVERSE_BRAND.mainWebsiteUrl, "https://www.softlabglobal.com");
  assert.equal(SKILLVERSE_BRAND.lmsUrl, "https://lms.softlabglobal.com");
  assert.equal(SKILLVERSE_BRAND.colors.navy, "#071630");
  assert.equal(SKILLVERSE_BRAND.colors.royalBlue, "#0052CC");
  console.log("[PASS] 1. Brand identity & color palette verified.");

  // 2. Monthly Packages (Classes 8–12)
  assert.equal(INITIAL_ACADEMIC_PACKAGES.length, 5);
  const expectedFees: Record<string, number> = {
    "PKG-1-STARTER": 1499,
    "PKG-2-EXCELLENCE": 2499,
    "PKG-3-FUTUREREADY": 3499,
    "PKG-4-SENIOR-ACADEMIC": 2999,
    "PKG-5-SENIOR-FUTUREREADY": 3999,
  };
  for (const pkg of INITIAL_ACADEMIC_PACKAGES) {
    assert.equal(pkg.monthlyPriceInr, expectedFees[pkg.id], `Mismatch on ${pkg.id}`);
    assert.equal(
      pkg.twelveMonthUndiscountedTotalInr,
      pkg.monthlyPriceInr * 12,
      `12-month undiscounted total mismatch for ${pkg.id}`
    );
  }
  console.log(
    "[PASS] 2. Monthly Academic Packages (₹1,499, ₹2,499, ₹3,499, ₹2,999, ₹3,999) & 12-month totals verified."
  );

  // 3. Competitive Add-Ons & Initial Fee Rules
  assert.equal(INITIAL_COMPETITIVE_ADDONS.length, 9);
  assert.equal(INITIAL_SKILLVERSE_FEE_RULES.admissionAndRegistrationFeeInr, 500);
  assert.equal(INITIAL_SKILLVERSE_FEE_RULES.studentIdAndLearningKitFeeInr, 500);
  assert.equal(INITIAL_SKILLVERSE_FEE_RULES.initialAcademicAssessmentFeeInr, 0);
  assert.equal(INITIAL_SKILLVERSE_FEE_RULES.demoClassFeeInr, 0);
  console.log(
    "[PASS] 3. Competitive Add-Ons (9 tracks) & Initial Fee Rules (₹500 + ₹500 + Free Demo/Assessment) verified."
  );

  // 4. Course Catalogue Coverage
  assert.ok(
    INITIAL_SKILLVERSE_COURSES.length >= 24,
    `Expected >=24 courses, got ${INITIAL_SKILLVERSE_COURSES.length}`
  );
  for (const course of INITIAL_SKILLVERSE_COURSES) {
    assert.ok(course.slug.length > 3, `Invalid course slug: ${course.slug}`);
    assert.ok(course.modules.length >= 1, `Course ${course.slug} must have structured modules`);
    assert.ok(
      course.learningOutcomes.length >= 1,
      `Course ${course.slug} must have learning outcomes`
    );
  }
  console.log(
    `[PASS] 4. Complete Course Catalogue (${INITIAL_SKILLVERSE_COURSES.length} courses across all tracks) verified.`
  );

  // 5. Transparent Fee Calculation Engine (No Silent Bundling)
  const starterBaseOnly = SkillverseService.calculateTransparentFeeBreakdown({
    packageId: "PKG-1-STARTER",
    addonId: undefined,
    standaloneCourseSlug: undefined,
    includeOneTimeAdmissionFees: true,
    packages: INITIAL_ACADEMIC_PACKAGES,
    addons: INITIAL_COMPETITIVE_ADDONS,
    courses: INITIAL_SKILLVERSE_COURSES,
    feeRules: INITIAL_SKILLVERSE_FEE_RULES,
  });
  assert.equal(starterBaseOnly.packageMonthlyInr, 1499);
  assert.equal(starterBaseOnly.addonMonthlyInr, 0, "Add-ons must never be bundled silently");
  assert.equal(starterBaseOnly.admissionFeeInr, 500);
  assert.equal(starterBaseOnly.learningKitFeeInr, 500);
  assert.equal(starterBaseOnly.totalInitialPayableInr, 2499);
  assert.equal(starterBaseOnly.packageAnnualUndiscountedInr, 1499 * 12);

  const seniorWithJee = SkillverseService.calculateTransparentFeeBreakdown({
    packageId: "PKG-4-SENIOR-ACADEMIC",
    addonId: "ADDON-JEE-MAIN-11-12",
    standaloneCourseSlug: undefined,
    includeOneTimeAdmissionFees: true,
    packages: INITIAL_ACADEMIC_PACKAGES,
    addons: INITIAL_COMPETITIVE_ADDONS,
    courses: INITIAL_SKILLVERSE_COURSES,
    feeRules: INITIAL_SKILLVERSE_FEE_RULES,
  });
  assert.equal(seniorWithJee.packageMonthlyInr, 2999);
  assert.equal(seniorWithJee.addonMonthlyInr, 3000);
  assert.equal(seniorWithJee.totalInitialPayableInr, 2999 + 3000 + 500 + 500);
  console.log(
    "[PASS] 5. Transparent Fee Calculator verified (base vs optional add-on separation)."
  );

  // 6. Multi-Type Quiz Evaluation (MCQ + MSQ + Descriptive)
  const quizEval = SkillverseService.evaluateQuizSubmissionPure({
    questions: [
      {
        id: "q1",
        type: "MCQ",
        prompt: "Solve 3x - 7 = 11 for 2x + 5",
        correctOptionIndex: 1,
        marks: 5,
      },
      {
        id: "q2",
        type: "MSQ",
        prompt: "Select all true Python list properties",
        correctOptionIndices: [0, 2],
        marks: 5,
      },
      {
        id: "q3",
        type: "DESCRIPTIVE",
        prompt: "Explain Ohm's Law",
        marks: 5,
      },
    ],
    responses: [
      { questionId: "q1", selectedOptionIndex: 1 },
      { questionId: "q2", selectedOptionIndices: [2, 0] }, // Order-insensitive exact match for MSQ
      { questionId: "q3", descriptiveAnswer: "V = I * R, voltage is directly proportional to current." },
    ],
  });
  assert.equal(quizEval.autoAwardedMarks, 10);
  assert.equal(quizEval.hasDescriptivePending, true);
  assert.equal(quizEval.totalMaxMarks, 15);
  assert.equal(quizEval.overallStatus, "PENDING_TEACHER_REVIEW");
  console.log("[PASS] 6. Multi-type Quiz Evaluation (MCQ + MSQ + Descriptive) verified.");

  // 7. Parent PIN Hashing & Security Isolation
  const pinHashA = hashPin("482910");
  const pinHashB = hashPin("482910");
  const pinHashWrong = hashPin("999999");
  assert.equal(pinHashA, pinHashB);
  assert.notEqual(pinHashA, pinHashWrong);
  assert.equal(pinHashA.length, 64);
  console.log("[PASS] 7. Parent Portal SHA-256 PIN cryptographic hashing verified.");

  // 8. Rate Limiting Protection
  const testKey = `test-rate-limit-${Date.now()}`;
  const firstAttempt = checkSkillverseRateLimit(testKey, 2);
  const secondAttempt = checkSkillverseRateLimit(testKey, 2);
  const thirdAttemptBlocked = checkSkillverseRateLimit(testKey, 2);
  assert.equal(firstAttempt, true);
  assert.equal(secondAttempt, true);
  assert.equal(thirdAttemptBlocked, false);
  console.log("[PASS] 8. Endpoint Rate Limiter protection verified.");

  // 9. Diagnostic Questions Bank
  assert.equal(INITIAL_DIAGNOSTIC_QUESTIONS.length, 5);
  console.log("[PASS] 9. Free Academic & Skill Diagnostic Assessment bank verified.");

  console.log("\n==========================================================");
  console.log("ALL 9 SLG SKILLVERSE TEST SUITES PASSED (100% PASS)");
  console.log("==========================================================");
}

runSkillverseVerificationSuite().catch((err) => {
  console.error("Test suite failed:", err);
  process.exit(1);
});
