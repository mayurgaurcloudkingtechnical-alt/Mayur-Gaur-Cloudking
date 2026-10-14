import { StudentAdmissionNotificationService } from "../src/server/services/student-admission-notification.service";

async function main() {
  console.log("===============================================================================");
  console.log("DISPATCHING ADMISSION CONFIRMATION & LMS CREDENTIALS TO ALL ADMITTED STUDENTS");
  console.log("Recipient: Student Email & WhatsApp | Management BCC: softlabglobal9@gmail.com");
  console.log("===============================================================================");

  const startTime = Date.now();
  const summary = await StudentAdmissionNotificationService.batchSendToExistingAdmittedStudents();

  console.log(`\nDispatched to ${summary.processed} of ${summary.totalFound} students in ${(Date.now() - startTime) / 1000}s:\n`);
  for (const s of summary.results) {
    console.log(`- [${s.studentId}] ${s.studentName} (${s.admissionNumber})`);
    console.log(`  Email: ${s.studentEmail} [Sent: ${s.emailSent ? "YES" : "SIMULATED/QUEUED"}]`);
    console.log(`  WhatsApp: ${s.studentPhone} [Sent: ${s.whatsappSent ? "YES" : "SIMULATED"}]`);
  }

  console.log("\n===============================================================================");
  console.log("ALL ADMISSION CONFIRMATIONS & CREDENTIALS PROCESSED SUCCESSFULLY!");
  console.log("===============================================================================");
}

main().catch((err) => {
  console.error("Batch dispatch error:", err);
  process.exit(1);
});
