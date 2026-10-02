import { LmsCourseMasterService } from "../src/server/services/lms-course-master.service";
import fs from "fs";
import path from "path";

async function generateMetaCommerceCatalog() {
  const courses = await LmsCourseMasterService.getAllActiveCourses();
  const rows: string[] = [
    "id,title,description,availability,condition,price,link,image_link,brand,category",
  ];

  for (const c of courses) {
    const id = `SLG_${c.courseCode.toUpperCase()}`;
    const title = `"${c.courseName.replace(/"/g, '""')}"`;
    const desc = `"${(c.shortDescription || c.courseName).replace(/"/g, '""')}"`;
    const price = `${c.fee} INR`;
    const link = `https://www.softlabglobal.com/courses/${c.id}`;
    const img = c.courseImage.startsWith("http") ? c.courseImage : `https://www.softlabglobal.com${c.courseImage}`;
    const brand = `"SoftLab Global"`;
    const cat = `"Educational Courses"`;

    rows.push([id, title, desc, "in stock", "new", price, link, img, brand, cat].join(","));
  }

  const outPath = path.resolve(process.cwd(), "public", "whatsapp-catalog.csv");
  fs.writeFileSync(outPath, rows.join("\n"), "utf-8");
  console.log(`✅ Successfully generated Meta Commerce Catalog at ${outPath} with ${courses.length} courses!`);
}

generateMetaCommerceCatalog()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
