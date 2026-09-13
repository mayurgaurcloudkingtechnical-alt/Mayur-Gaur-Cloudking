import { db } from "../src/server/db/client";
import { ContentStatus, DeliveryMode } from "@prisma/client";

const COURSES = [
  {
    slug: "ai-ml-complete-course-master-level",
    title: "AI & ML Complete Course (Master Level)",
    summary: "Master AI, Machine Learning, Deep Learning, Generative AI, MLOps, and real-world deployment.",
    description: "This AI & ML Complete Course (Master Level) by SoftLab Global (Civil Lines Campus, Prayagraj) covers Artificial Intelligence, Machine Learning, Deep Learning, Generative AI, MLOps, and real-world applications. Gain hands-on experience with industry-leading tools and build projects that solve real-world problems.",
    durationWeeks: 24,
    baseFee: 4500000, // ₹45,000 in integer Paise
    level: "Beginner to Advanced (Master Level)",
    language: "English / Hindi",
    eligibility: "Students, IT Professionals, Developers, Data Analysts, Engineers & Anyone wanting to build an AI/ML career.",
    thumbnailUrl: "/courses/ai-ml-brochure.jpg",
    modules: [
      { title: "Week 1: Introduction to AI & ML Ecosystem", lessons: ["AI vs ML vs DL vs DS", "Real-world Applications & Industry Landscape", "AI Tools & Dev Environment Setup"] },
      { title: "Week 2-3: Python & Mathematics for Machine Learning", lessons: ["NumPy, Pandas, Matplotlib, Seaborn", "Linear Algebra & Probability Distributions", "Hypothesis Testing & Gradient Descent"] },
      { title: "Week 4-5: Data Preprocessing & Exploratory Data Analysis", lessons: ["Feature Engineering & Missing Data Imputation", "Outlier Detection & Normalization", "Univariate & Multivariate Analysis"] },
      { title: "Week 6-8: Classical Machine Learning Algorithms", lessons: ["Linear & Logistic Regression", "Decision Trees, Random Forest & XGBoost", "K-Means & Unsupervised Clustering"] },
      { title: "Week 9-13: Deep Learning, CNNs & Computer Vision", lessons: ["Neural Networks & Backpropagation in PyTorch/TensorFlow", "Convolutional Neural Networks (CNN)", "Object Detection with YOLO"] },
      { title: "Week 14-17: NLP, Generative AI & Large Language Models", lessons: ["Tokenization, Word2Vec & Transformers", "Prompt Engineering & OpenAI API Integration", "LangChain, RAG Pipelines & Fine-tuning"] },
      { title: "Week 18-24: MLOps, Cloud Deployment & Capstone Project", lessons: ["Model Serving with FastAPI & Docker", "Cloud Hosting on AWS SageMaker & Vertex AI", "End-to-End Enterprise Capstone Defense"] },
    ],
  },
  {
    slug: "data-science-complete-course-master-level",
    title: "Data Science Complete Course (Master Level)",
    summary: "End-to-end Data Science, Statistical Modeling, Machine Learning, Big Data, Power BI, and Cloud Analytics.",
    description: "Comprehensive program covering statistics, programming, data analysis, machine learning, deep learning, big data, visualization, and AI integration. Work on real-world datasets and master industry-standard data science workflows.",
    durationWeeks: 24,
    baseFee: 4500000, // ₹45,000 in integer Paise
    level: "Beginner to Advanced (Master Level)",
    language: "English / Hindi",
    eligibility: "Students, IT & Non-IT Professionals, Engineers, Analysts & Business Professionals.",
    thumbnailUrl: "/courses/data-science-brochure.jpg",
    modules: [
      { title: "Week 1-3: Data Science Foundations & Python Mastery", lessons: ["Data Science Lifecycle & Anaconda Setup", "Python Core Data Structures & OOP", "Advanced NumPy & Pandas Wrangling"] },
      { title: "Week 4-6: Statistics, Probability & Advanced EDA", lessons: ["Descriptive & Inferential Statistics", "Data Storytelling with Seaborn & Matplotlib", "Interactive Dashboards with Plotly"] },
      { title: "Week 7-9: SQL & Enterprise Data Warehousing", lessons: ["Complex Joins, Subqueries & CTEs", "Window Functions & Analytical Queries", "Database Modeling for Analytics"] },
      { title: "Week 10-14: Machine Learning & Predictive Analytics", lessons: ["Supervised Regression & Classification", "Model Evaluation & Hyperparameter Tuning", "Ensemble Methods & Clustering"] },
      { title: "Week 15-18: Big Data, Power BI & Cloud Analytics", lessons: ["PySpark Fundamentals & ETL Pipelines", "Advanced DAX & Power BI Reports", "Cloud Analytics with AWS Redshift & S3"] },
      { title: "Week 19-24: AI Integration & Industry Capstone", lessons: ["LLM-Powered Data Apps & APIs", "Production Model Deployment with Flask/FastAPI", "Full Lifecycle Business Analytics Capstone"] },
    ],
  },
  {
    slug: "cyber-security-complete-course-master-level",
    title: "Cyber Security Complete Course (Master Level)",
    summary: "Ethical Hacking, Penetration Testing, SOC Analysis, Network Security, Cloud Security & DevSecOps.",
    description: "Career-oriented program covering fundamentals to advanced cybersecurity domains including Ethical Hacking, Defensive Security, Network Security, Cloud Security, AI Security, and GRC with 80+ tools.",
    durationWeeks: 24,
    baseFee: 5000000, // ₹50,000 in integer Paise
    level: "Beginner to Advanced (Master Level)",
    language: "English / Hindi",
    eligibility: "Students, IT Professionals, Network Engineers, System Admins & aspiring Cybersecurity specialists.",
    thumbnailUrl: "/courses/cyber-security-brochure.jpg",
    modules: [
      { title: "Week 1-3: Fundamentals, Networking & Linux Security", lessons: ["CIA Triad, Cyber Kill Chain & Risk Analysis", "OSI Model & Wireshark Packet Inspection", "Linux Shell Scripting & Hardening"] },
      { title: "Week 4-7: Ethical Hacking & Web App Penetration Testing", lessons: ["Reconnaissance, Nmap Scanning & Enumeration", "OWASP Top 10 Vulnerabilities & Exploits", "Burp Suite, SQL Injection & Cross-Site Scripting"] },
      { title: "Week 8-12: Network Security & Digital Forensics", lessons: ["Firewalls, IDS/IPS & Snort Detection", "Malware Analysis & Endpoint Protection", "Volatily Memory Forensics & Incident Response"] },
      { title: "Week 13-16: SOC Operations & SIEM Telemetry", lessons: ["SOC Tier-1 Workflow & Alert Triage", "Splunk & Elastic SIEM Architecture", "Threat Hunting & Log Correlation"] },
      { title: "Week 17-20: Cloud Security (AWS/Azure) & DevSecOps", lessons: ["IAM, VPC Security & S3 Hardening", "CI/CD Pipeline Security & SAST/DAST", "Container Security with Docker & Kubernetes"] },
      { title: "Week 21-24: Advanced Exploitation & Capstone CTF", lessons: ["Active Directory Attacks & Privilege Escalation", "Red Teaming Concepts & C2 Frameworks", "Full Enterprise Security Audit & Defense"] },
    ],
  },
  {
    slug: "c-language-complete-course",
    title: "C Language Complete Course (Beginner to Advanced)",
    summary: "Master core programming logic, memory management, pointers, data structures, and foundational algorithms.",
    description: "Build an unshakeable coding foundation. Learn C programming from scratch with practical examples, real-world mini-projects, memory allocation techniques, and problem-solving mastery.",
    durationWeeks: 12,
    baseFee: 1200000, // ₹12,000 in integer Paise
    level: "Beginner to Advanced",
    language: "English / Hindi",
    eligibility: "Students, Beginners, Engineering & BCA/MCA students seeking rock-solid programming foundations.",
    thumbnailUrl: "/courses/c-programming-brochure.jpg",
    modules: [
      { title: "Month 1: C Programming Fundamentals", lessons: ["History, Compilation Process & GCC", "Data Types, Variables & Constants", "Operators, Expressions & I/O Functions", "Control Flow: if-else, switch & Loops"] },
      { title: "Month 2: Functions, Arrays & Pointers", lessons: ["Functions, Call by Value vs Reference", "1D & 2D Arrays & Matrix Operations", "Pointers, Pointer Arithmetic & Arrays", "Strings & Standard String Library"] },
      { title: "Month 3: Advanced C, Memory & Projects", lessons: ["Structures, Unions & Enums", "Dynamic Memory Allocation (malloc, calloc, free)", "File I/O & Binary Data Streams", "Mini-Projects: Student & Banking Management Systems"] },
    ],
  },
  {
    slug: "cpp-language-complete-course",
    title: "C++ Language Complete Course (Basics to Advanced)",
    summary: "Object-Oriented Programming (OOP), Standard Template Library (STL), templates, and modern C++ software design.",
    description: "From core fundamentals of C++ to advanced OOP, Standard Template Library (STL), exception handling, and data structures. Perfect for software engineering and technical interview preparation.",
    durationWeeks: 12,
    baseFee: 1500000, // ₹15,000 in integer Paise
    level: "Beginner to Advanced",
    language: "English / Hindi",
    eligibility: "Students, BCA/MCA, B.Tech & engineers preparing for software development and competitive programming.",
    thumbnailUrl: "/courses/cpp-programming-brochure.jpg",
    modules: [
      { title: "Month 1: Basics of C++ & Evolution from C", lessons: ["C++ Architecture, cin/cout & Namespaces", "Functions, Inline Functions & Default Args", "Pointers, References & Dynamic Memory (new/delete)", "Control Structures & Recursion"] },
      { title: "Month 2: Object-Oriented Programming (OOP)", lessons: ["Classes, Objects & Access Specifiers", "Constructors, Destructors & Copy Constructors", "Inheritance: Single, Multiple & Hierarchical", "Polymorphism: Virtual Functions & Abstract Classes"] },
      { title: "Month 3: Advanced C++, STL & Major Projects", lessons: ["Function & Class Templates", "STL Containers: Vector, Map, Set, Queue, Stack", "Exception Handling & File Streams", "Capstone Projects: Library System & Inventory Manager"] },
    ],
  },
];

async function seedBrochureCourses() {
  console.log("================================================================================");
  console.log("   SEEDING OFFICIAL SOFTLAB GLOBAL BROCHURE COURSES & SYLLABUS                 ");
  console.log("================================================================================");

  for (let i = 0; i < COURSES.length; i++) {
    const c = COURSES[i];
    console.log(`\n[${i + 1}/${COURSES.length}] Upserting Course: ${c.title}...`);

    const course = await db.course.upsert({
      where: { slug: c.slug },
      update: {
        title: c.title,
        summary: c.summary,
        description: c.description,
        durationWeeks: c.durationWeeks,
        baseFee: c.baseFee,
        level: c.level,
        language: c.language,
        eligibility: c.eligibility,
        thumbnailUrl: c.thumbnailUrl,
        status: ContentStatus.PUBLISHED,
        sortOrder: i + 1,
      },
      create: {
        slug: c.slug,
        title: c.title,
        summary: c.summary,
        description: c.description,
        durationWeeks: c.durationWeeks,
        baseFee: c.baseFee,
        level: c.level,
        language: c.language,
        eligibility: c.eligibility,
        thumbnailUrl: c.thumbnailUrl,
        status: ContentStatus.PUBLISHED,
        sortOrder: i + 1,
      },
    });

    console.log(`  ✓ Course ID: ${course.id} (${course.slug})`);

    // Upsert Modules
    for (let mIdx = 0; mIdx < c.modules.length; mIdx++) {
      const mod = c.modules[mIdx];
      let moduleRecord = await db.module.findFirst({
        where: { courseId: course.id, sortOrder: mIdx + 1 },
      });

      if (!moduleRecord) {
        moduleRecord = await db.module.create({
          data: {
            courseId: course.id,
            title: mod.title,
            sortOrder: mIdx + 1,
            status: ContentStatus.PUBLISHED,
          },
        });
      } else {
        moduleRecord = await db.module.update({
          where: { id: moduleRecord.id },
          data: { title: mod.title, status: ContentStatus.PUBLISHED },
        });
      }

      // Upsert Lessons
      for (let lIdx = 0; lIdx < mod.lessons.length; lIdx++) {
        const lessonTitle = mod.lessons[lIdx];
        const existingLesson = await db.lesson.findFirst({
          where: { moduleId: moduleRecord.id, sortOrder: lIdx + 1 },
        });

        if (!existingLesson) {
          await db.lesson.create({
            data: {
              moduleId: moduleRecord.id,
              title: lessonTitle,
              slug: `${course.slug}-m${mIdx + 1}-l${lIdx + 1}`,
              sortOrder: lIdx + 1,
              status: ContentStatus.PUBLISHED,
              durationMin: 45,
            },
          });
        }
      }
    }
    console.log(`  ✓ Seeded ${c.modules.length} syllabus modules with lessons.`);
  }

  console.log("\n================================================================================");
  console.log("   ALL 5 OFFICIAL BROCHURE COURSES SEEDED & PUBLISHED SUCCESSFULLY!            ");
  console.log("================================================================================");
}

seedBrochureCourses()
  .catch((err) => {
    console.error("Failed to seed brochure courses:", err);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
