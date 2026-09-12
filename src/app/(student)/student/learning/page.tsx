import { redirect } from "next/navigation";

export default function StudentLearningRedirectPage() {
  redirect("/student/courses");
}
