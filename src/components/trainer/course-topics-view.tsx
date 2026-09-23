"use client";

import * as React from "react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { api } from "@/lib/trpc/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Clock,
  Layers,
  Award,
  ExternalLink,
  Code2,
  Shield,
  Cloud,
  Terminal,
  Cpu,
  Sparkles,
  FileText,
  CheckCircle2,
} from "lucide-react";

interface CourseTopicSpec {
  id: string;
  title: string;
  category: "Cloud & DevOps" | "Cyber Security" | "Full Stack & Dev" | "Networking & Systems" | "AI & Data Science" | "Career Programs";
  durationHours: number;
  modulesCount: number;
  badgeText: string;
  topics: string[];
  labs: string[];
}

const AUTHORITATIVE_TOPICS: CourseTopicSpec[] = [
  {
    id: "ck-master-cloud-cyber-ai",
    title: "CK Master of Cloud Computing & Cyber Security with AI",
    category: "Cloud & DevOps",
    durationHours: 360,
    modulesCount: 16,
    badgeText: "Master Program",
    topics: ["Cloud Architecture Foundations", "AWS & Azure Multi-Cloud Setup", "Containerization & Kubernetes", "AI-Powered Threat Detection", "SIEM & SOC Operations", "Zero Trust Architecture"],
    labs: ["Multi-Cloud VPC Peering", "K8s Microservices Deployment", "AI Anomaly Detection Lab"]
  },
  {
    id: "mlops",
    title: "mLOps",
    category: "AI & Data Science",
    durationHours: 120,
    modulesCount: 8,
    badgeText: "Specialized Track",
    topics: ["Model Versioning & DVC", "CI/CD for Machine Learning", "MLflow & Kubeflow Pipelines", "Model Monitoring & Drift Detection", "Automated Retraining Architecture"],
    labs: ["End-to-End Production ML Pipeline", "Drift Detection on AWS SageMaker"]
  },
  {
    id: "ck-devops-azure",
    title: "CK DevOps with Azure",
    category: "Cloud & DevOps",
    durationHours: 160,
    modulesCount: 10,
    badgeText: "Certification",
    topics: ["Azure DevOps Boards & Repos", "YAML Pipelines & Artifacts", "Terraform Infrastructure as Code", "Azure Kubernetes Service (AKS)", "ARM Templates & Bicep"],
    labs: ["Zero-Downtime AKS Blue-Green Deployment", "Enterprise Terraform Modular Setup"]
  },
  {
    id: "bootcamp",
    title: "BootCamp",
    category: "Career Programs",
    durationHours: 80,
    modulesCount: 6,
    badgeText: "Accelerated",
    topics: ["Linux Fundamentals & Bash", "Git & GitHub Collaboration", "Docker Containers Crash Course", "Cloud Computing Essentials", "Live Capstone Project"],
    labs: ["Full Stack App Containerization", "Automated GitHub Actions Deployment"]
  },
  {
    id: "ck-certified-digital-marketing",
    title: "CK Certified Digital Marketing",
    category: "Career Programs",
    durationHours: 120,
    modulesCount: 8,
    badgeText: "Certification",
    topics: ["Search Engine Optimization (SEO)", "Google Ads Search & Display", "Meta Ads Manager & Performance Marketing", "Analytics & Conversion Tracking", "Content Strategy & AI Copywriting"],
    labs: ["Live Google Ads Campaign Budget Optimization", "Meta Lead Gen Funnel Setup"]
  },
  {
    id: "ck-certified-cyber-security",
    title: "CK Certified Cyber Security",
    category: "Cyber Security",
    durationHours: 200,
    modulesCount: 12,
    badgeText: "Core Professional",
    topics: ["Ethical Hacking Methodologies", "Network Penetration Testing", "Web Application Vulnerabilities (OWASP Top 10)", "Cryptography & PKI", "Metasploit & Burp Suite Mastery"],
    labs: ["Vulnerable Web App Exploitation Lab", "Corporate Network Firewall Hardening"]
  },
  {
    id: "ck-certified-hardware-networking",
    title: "CK Certified in Hardware & Networking Engineer",
    category: "Networking & Systems",
    durationHours: 140,
    modulesCount: 8,
    badgeText: "Foundational",
    topics: ["PC Architecture & Hardware Troubleshooting", "OS Installation & Dual Booting", "TCP/IP Suite & Subnetting", "Switching & Routing Basics", "LAN Cabling & Diagnostics"],
    labs: ["Crimping & Patch Panel Setup", "Cisco Router Initial Configuration"]
  },
  {
    id: "ck-java-full-stack",
    title: "CK Java Full Stak",
    category: "Full Stack & Dev",
    durationHours: 280,
    modulesCount: 14,
    badgeText: "Enterprise Stack",
    topics: ["Core Java & OOP Concepts", "Java Collections & Multithreading", "Spring Boot Microservices", "Hibernate & JPA", "React.js Frontend Integration", "RESTful API Security"],
    labs: ["E-Commerce Microservices Platform", "JWT Authentication Backend"]
  },
  {
    id: "c-sharp",
    title: "C#",
    category: "Full Stack & Dev",
    durationHours: 100,
    modulesCount: 6,
    badgeText: "Modular",
    topics: [".NET Architecture & C# Syntax", "LINQ & Entity Framework Core", "ASP.NET Web API", "Asynchronous Programming", "Unit Testing with xUnit"],
    labs: ["Enterprise CRM REST API with EF Core", "Background Worker Service"]
  },
  {
    id: "ck-certified-cloud-cyber-ai",
    title: "CK Certified in Cloud Computing & Cyber Security with AI",
    category: "Cloud & DevOps",
    durationHours: 240,
    modulesCount: 12,
    badgeText: "Industry Certified",
    topics: ["AWS Core Services (EC2, S3, RDS, IAM)", "Cloud Security Best Practices", "AI Guardrails & Compliance", "Incident Response in Cloud", "Vulnerability Management"],
    labs: ["AWS Security Hub & GuardDuty Configuration", "Automated Cloud Incident Remediation"]
  },
  {
    id: "ck-certified-cloud-devops-ai",
    title: "CK Certified in Cloud Computing & DevOps with AI",
    category: "Cloud & DevOps",
    durationHours: 240,
    modulesCount: 12,
    badgeText: "Career Track",
    topics: ["Cloud Native DevOps Architecture", "Docker, Podman & K8s", "GitOps with ArgoCD", "AI-Driven Log Analysis (Elasticsearch)", "Prometheus & Grafana Monitoring"],
    labs: ["ArgoCD GitOps Cluster Synchronization", "Prometheus Full Stack Metrics Dashboard"]
  },
  {
    id: "ck-master-cloud-l2",
    title: "CK Master in Cloud Computing L2 Professional",
    category: "Cloud & DevOps",
    durationHours: 180,
    modulesCount: 10,
    badgeText: "Advanced L2",
    topics: ["Enterprise Multi-Account Architecture", "AWS Organizations & Control Tower", "Cost Optimization & FinOps", "Disaster Recovery Across Regions", "Serverless Architecture (Lambda, EventBridge)"],
    labs: ["Multi-Region Active-Active Failover", "Serverless Microservice Event Bus"]
  },
  {
    id: "ck-career-technical-diploma",
    title: "CK Career Integrated Technical Diploma Program",
    category: "Career Programs",
    durationHours: 480,
    modulesCount: 20,
    badgeText: "Full Diploma",
    topics: ["IT Fundamentals & OS Mastery", "Enterprise Networking (CCNA)", "System Administration (Linux & Windows Server)", "Cloud Engineering", "Cyber Defense Essentials", "Interview & Aptitude Grooming"],
    labs: ["Hybrid Enterprise Infrastructure Project", "Campus Placement Mock Drives"]
  },
  {
    id: "ck-technical-support-professional",
    title: "CK Certified Technical Support Professional",
    category: "Networking & Systems",
    durationHours: 120,
    modulesCount: 7,
    badgeText: "Job Ready",
    topics: ["ITIL Foundations & Service Desk Operations", "Remote Desktop & Ticket Management", "Windows 10/11 Enterprise Troubleshooting", "Active Directory User Management", "Outlook & Office 365 Support"],
    labs: ["ServiceNow Ticket Lifecycle Lab", "Domain Controller Group Policy Configuration"]
  },
  {
    id: "ck-hardware-os-professional",
    title: "CK Certified Hardware & Operating System Professional",
    category: "Networking & Systems",
    durationHours: 100,
    modulesCount: 6,
    badgeText: "Systems Foundation",
    topics: ["Motherboard Component Diagnostics", "BIOS/UEFI Configuration & Flashing", "Disk Partitioning (MBR vs GPT)", "Windows & Linux OS Deployment", "Virtualization with VMware Workstation"],
    labs: ["RAID Array Configuration (RAID 0, 1, 5)", "Custom Windows Image Sysprep Deployment"]
  },
  {
    id: "ck-master-cloud-l1",
    title: "CK Master of Cloud Computing L1 Professional",
    category: "Cloud & DevOps",
    durationHours: 140,
    modulesCount: 8,
    badgeText: "Core L1",
    topics: ["Cloud Computing Paradigms (IaaS, PaaS, SaaS)", "AWS Management Console & CLI", "Virtual Private Clouds (VPC) & Subnetting", "Elastic Load Balancing & Auto Scaling", "CloudWatch & SNS Alerts"],
    labs: ["Fault-Tolerant Web Tier with Auto Scaling", "S3 Lifecycle Rules & Cross-Region Replication"]
  },
  {
    id: "ck-master-devops-professional",
    title: "CK Certified Master of DevOps Professional",
    category: "Cloud & DevOps",
    durationHours: 200,
    modulesCount: 11,
    badgeText: "Master Track",
    topics: ["Infrastructure as Code with Terraform", "Configuration Management with Ansible", "Jenkins Enterprise CI/CD Pipelines", "Helm Charts & Kubernetes Operators", "Site Reliability Engineering (SRE) Principles"],
    labs: ["Complete Multi-Tier App Automated Deployment", "Ansible Multi-Node Linux Configuration"]
  },
  {
    id: "ck-certified-artificial-intelligence",
    title: "CK Certified Artificial Intelligence",
    category: "AI & Data Science",
    durationHours: 220,
    modulesCount: 12,
    badgeText: "Specialized Track",
    topics: ["Python for AI & Scientific Computing", "Supervised & Unsupervised Machine Learning", "Deep Learning with PyTorch & TensorFlow", "Computer Vision with OpenCV", "Large Language Models & LangChain"],
    labs: ["Real-Time Object Detection System", "RAG-Based AI Customer Support Bot"]
  },
  {
    id: "ck-ccna-200-301",
    title: "CK CCNA 200-301",
    category: "Networking & Systems",
    durationHours: 160,
    modulesCount: 10,
    badgeText: "Global Standard",
    topics: ["Network Fundamentals & IPv4/IPv6 Addressing", "VLANs, Trunking (802.1Q) & Inter-VLAN Routing", "Spanning Tree Protocol (STP & RSTP)", "OSPFv2 Dynamic Routing", "Access Control Lists (ACLs) & NAT", "Network Automation with Python"],
    labs: ["Packet Tracer Multi-Campus Routing Simulation", "Enterprise EtherChannel & OSPF Topology"]
  },
  {
    id: "ck-certified-aws-cloud",
    title: "CK Certified AWS Cloud Professional",
    category: "Cloud & DevOps",
    durationHours: 150,
    modulesCount: 9,
    badgeText: "AWS Focused",
    topics: ["AWS Solutions Architect Associate Curriculum", "High Availability Architecture", "DynamoDB & Aurora Serverless", "AWS CloudFormation", "Cost Optimization Strategies"],
    labs: ["3-Tier Scalable Web Application in AWS", "Secure Bastion Host Setup"]
  },
  {
    id: "ck-mcsa-server",
    title: "CK MCSA Server",
    category: "Networking & Systems",
    durationHours: 140,
    modulesCount: 8,
    badgeText: "Enterprise Server",
    topics: ["Windows Server Installation & Storage Spaces", "Active Directory Domain Services (AD DS)", "Group Policy Objects (GPOs)", "DNS, DHCP & IPAM", "Hyper-V Virtualization & Clustering"],
    labs: ["Failover Clustering Configuration", "Enterprise Forest & Tree Domain Trust"]
  },
  {
    id: "ck-mastertech-it-career",
    title: "CK MasterTech IT Career Professional Program",
    category: "Career Programs",
    durationHours: 360,
    modulesCount: 16,
    badgeText: "Comprehensive Career",
    topics: ["Full Stack IT Foundation", "Linux Server Administration", "AWS & Cloud Infrastructure", "Cyber Security & Compliance", "Corporate Soft Skills & Tech Interviews"],
    labs: ["Production Server Setup on Cloud", "Live Interview Simulations"]
  },
  {
    id: "ck-certified-azure-cloud",
    title: "CK Certified Azure Cloud Professional",
    category: "Cloud & DevOps",
    durationHours: 150,
    modulesCount: 9,
    badgeText: "Microsoft Track",
    topics: ["Azure Administrator (AZ-104) Syllabus", "Azure Virtual Networks & Peering", "Azure Virtual Machines & VMSS", "Azure Active Directory (Entra ID)", "Azure Monitor & Backup"],
    labs: ["Hub-and-Spoke Virtual Network Topology", "Azure AD Self-Service Password Reset Lab"]
  },
  {
    id: "ck-certified-linux",
    title: "CK Certified Linux",
    category: "Networking & Systems",
    durationHours: 130,
    modulesCount: 8,
    badgeText: "Sysadmin Core",
    topics: ["Linux Shell Navigation & File System Hierarchy", "User, Group & File Permissions Management", "Process Monitoring & Systemd Services", "Shell Scripting & Cron Automation", "LVM & Disk Partitioning", "SSH & Firewall Configuration (UFW/Firewalld)"],
    labs: ["Automated Backup Script with Cron", "LVM Volume Expansion on Running Server"]
  },
  {
    id: "ck-certified-office-professional",
    title: "CK Certified Office Professional",
    category: "Career Programs",
    durationHours: 80,
    modulesCount: 5,
    badgeText: "Productivity",
    topics: ["Advanced Microsoft Excel (VLOOKUP, XLOOKUP, Pivot Tables)", "Microsoft Word Document Automation", "PowerPoint Presentation Mastery", "Google Workspace Collaboration", "Data Entry Speed & Accuracy"],
    labs: ["Automated Financial Report in Excel", "Executive Presentation Deck"]
  },
  {
    id: "ck-python-full-stack",
    title: "CK Python Full Stak",
    category: "Full Stack & Dev",
    durationHours: 260,
    modulesCount: 13,
    badgeText: "Full Stack Python",
    topics: ["Python Fundamentals & OOP", "Django Web Framework & ORM", "Django REST Framework (DRF)", "PostgreSQL Database Integration", "React.js Frontend", "Docker & Nginx Production Deployment"],
    labs: ["Full Stack SaaS Application Deployment", "Automated Web Scraping with Scrapy"]
  },
  {
    id: "ck-data-science-ai",
    title: "CK Data Science with AI",
    category: "AI & Data Science",
    durationHours: 240,
    modulesCount: 12,
    badgeText: "Data Science",
    topics: ["Python for Data Analysis (NumPy, Pandas)", "Data Visualization (Matplotlib, Seaborn)", "Exploratory Data Analysis (EDA)", "Statistical Inference & Hypothesis Testing", "Scikit-Learn Machine Learning Models", "Streamlit Dashboard Deployment"],
    labs: ["Predictive Analytics Model on Real Housing Data", "Interactive Financial Analytics Web App"]
  },
  {
    id: "ck-data-analytics",
    title: "CK Data Analytics",
    category: "AI & Data Science",
    durationHours: 150,
    modulesCount: 8,
    badgeText: "BI Specialist",
    topics: ["Advanced SQL Queries & Joins", "Power BI Data Modeling & DAX", "Tableau Interactive Dashboards", "Excel Data Analysis Toolpak", "Business Intelligence Reporting"],
    labs: ["Retail Sales Performance Power BI Report", "Executive KPI Scorecard in Tableau"]
  },
  {
    id: "ck-diploma-cloud-l1",
    title: "CK Diploma in Cloud Computing L1 Professional",
    category: "Cloud & DevOps",
    durationHours: 200,
    modulesCount: 10,
    badgeText: "Diploma L1",
    topics: ["Cloud Fundamentals", "Networking Essentials for Cloud", "AWS Certified Cloud Practitioner Syllabus", "Cloud Storage & Database Management", "Identity & Access Management"],
    labs: ["Secure Static Website on AWS S3 & CloudFront", "Multi-AZ RDS Database Deployment"]
  },
  {
    id: "ck-certified-fortigate-security",
    title: "CK Certified FortiGate Security Professional",
    category: "Cyber Security",
    durationHours: 120,
    modulesCount: 7,
    badgeText: "Firewall Specialist",
    topics: ["FortiGate Firewall Architecture & Deployment", "Security Policies & NAT Rules", "IPSec & SSL VPN Configuration", "Antivirus, Web Filtering & IPS Inspection", "High Availability (HA) Clustering"],
    labs: ["Site-to-Site IPSec VPN Tunnel", "FortiGate HA Active-Passive Failover"]
  },
  {
    id: "ck-spoken-english-professional",
    title: "CK Spoken English Professional",
    category: "Career Programs",
    durationHours: 60,
    modulesCount: 4,
    badgeText: "Soft Skills",
    topics: ["Corporate Communication & Etiquette", "Accent Neutralization & Pronunciation", "Technical Presentation Skills", "Group Discussions & Mock Interviews", "Professional Email & Resume Writing"],
    labs: ["Live Mock Technical Interview Simulation", "Video Pitch & Speech Analysis"]
  },
  {
    id: "python-basic",
    title: "Python Basic",
    category: "Full Stack & Dev",
    durationHours: 60,
    modulesCount: 4,
    badgeText: "Beginner Track",
    topics: ["Variables, Data Types & Operators", "Conditional Logic & Loops", "Functions & Modules", "File Handling & Error Handling", "Mini Console Project"],
    labs: ["Command-Line Student Management System", "Automated File Renaming Script"]
  },
  {
    id: "ccna-python-basic",
    title: "CCNA & Python Basic",
    category: "Networking & Systems",
    durationHours: 180,
    modulesCount: 11,
    badgeText: "NetDevOps",
    topics: ["CCNA Routing & Switching Essentials", "Python Programming Fundamentals", "Netmiko & Paramiko for Router Automation", "REST APIs & JSON Parsing in Networking", "Automated Device Backup Scripts"],
    labs: ["Automated Multi-Router Configuration Push via Python", "Network Topology Auto-Discovery Script"]
  },
  {
    id: "ck-tech-support-cyber-security",
    title: "CK Technical Support & Cyber Security Professional",
    category: "Cyber Security",
    durationHours: 180,
    modulesCount: 9,
    badgeText: "Dual Skill",
    topics: ["Helpdesk Ticket Management", "Endpoint Security & Antivirus Deployment", "Patch Management & Windows Updates", "Malware Analysis Basics", "User Account Lockdown & Phishing Awareness"],
    labs: ["Malicious Email Phishing Simulation", "Automated Endpoint Hardening via PowerShell"]
  },
  {
    id: "ck-cloud-cyber-ai-specializations",
    title: "CK Certified in Cloud Computing & Cyber Security with AI Specializations",
    category: "Cloud & DevOps",
    durationHours: 260,
    modulesCount: 13,
    badgeText: "Specialized Master",
    topics: ["Advanced Multi-Cloud Defense Strategies", "AI Agents for Security Telemetry", "Container Security (Trivy, Falco)", "Automated Compliance Auditing", "Cloud Penetration Testing"],
    labs: ["Kubernetes Runtime Threat Detection with Falco", "AI Log Correlation Engine"]
  },
  {
    id: "ck-cyber-security-expert",
    title: "CK Certified Cyber Security Expert Professional",
    category: "Cyber Security",
    durationHours: 240,
    modulesCount: 12,
    badgeText: "Expert Level",
    topics: ["Advanced Threat Hunting & Forensics", "Active Directory Exploitation & Defense (BloodHound, Mimikatz)", "Reverse Engineering & Malware Disassembly", "Red Team vs Blue Team Simulations", "SOC Architecture & Incident Playbooks"],
    labs: ["Domain Controller Kerberoasting & Remediation", "Memory Forensics Analysis with Volatility"]
  },
  {
    id: "ck-cloud-cyber-devops-ai",
    title: "CK Certified Cloud Computing & Cyber Security with DevOps AI",
    category: "Cloud & DevOps",
    durationHours: 320,
    modulesCount: 15,
    badgeText: "Flagship Program",
    topics: ["Complete Cloud Infrastructure Architecture", "DevSecOps Pipeline Integration (SonarQube, Snyk)", "AI Model Training & Deployment on Cloud", "Automated Security Remediation", "Production Kubernetes Cluster Security"],
    labs: ["Zero-Trust DevSecOps Automated Pipeline", "Autonomous Self-Healing Cloud Infrastructure"]
  }
];

export function CourseTopicsView() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const categories = [
    "All",
    "Cloud & DevOps",
    "Cyber Security",
    "Full Stack & Dev",
    "Networking & Systems",
    "AI & Data Science",
    "Career Programs",
  ];

  const filteredTopics = useMemo(() => {
    return AUTHORITATIVE_TOPICS.filter((course) => {
      const matchesSearch =
        course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        course.topics.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory =
        selectedCategory === "All" || course.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="space-y-5 pb-16">
      {/* Top Header matching SoftLab Global LMS | Course Topics */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold mb-1 border border-blue-200">
            <Sparkles className="h-3 w-3 text-blue-600" />
            <span>SoftLab Global LMS • Course Topics & Curriculum</span>
          </div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Course Topics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Authoritative certification programs, structured module topics, lab assignments, and curriculum teaching guidelines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link href="/trainer/batches">
            <Button size="sm" variant="outline" className="text-xs h-8 text-slate-700">
              View Assigned Batches
            </Button>
          </Link>
          <Link href="/trainer/classes">
            <Button size="sm" className="bg-[#0088cc] hover:bg-[#0077b3] text-white text-xs h-8 gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              <span>Open Attendance Register</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search courses, modules, or technology keywords (e.g. AWS, Python, Cyber, DevOps)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs border-slate-200 focus:border-[#0088cc]"
          />
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${
                selectedCategory === cat
                  ? "bg-slate-900 text-white shadow-xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Topics List matching PDF Pages 5, 6, 7 */}
      <div className="space-y-2.5">
        {filteredTopics.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-xl border border-dashed border-slate-300">
            <BookOpen className="h-8 w-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No course topics match your search</p>
            <p className="text-xs text-slate-500 mt-1">Try searching for a different keyword or reset the category filter.</p>
          </div>
        ) : (
          filteredTopics.map((item, idx) => {
            const isExpanded = expandedId === item.id;
            return (
              <div
                key={item.id}
                className="bg-white rounded-lg border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden border-l-4 border-l-[#0088cc]"
              >
                {/* Course Row matching PDF Pages 5, 6, 7 */}
                <div
                  onClick={() => toggleExpand(item.id)}
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-slate-50/70 transition-colors select-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-slate-400 w-6">
                      {String(idx + 1).padStart(2, "0")}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm tracking-tight hover:text-[#0088cc] transition-colors">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <Badge variant="outline" className="text-[10px] hidden sm:inline-flex text-slate-600 bg-slate-50 border-slate-200">
                      {item.category}
                    </Badge>
                    <Badge className="text-[10px] bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-semibold">
                      {item.badgeText}
                    </Badge>
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expandable Curriculum & Module Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 bg-[#f8fafc] border-t border-slate-100 text-xs space-y-4">
                    <div className="flex flex-wrap items-center gap-4 text-slate-600 pt-1">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Clock className="h-3.5 w-3.5 text-[#0088cc]" />
                        <span>{item.durationHours} Total Hours</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Layers className="h-3.5 w-3.5 text-emerald-600" />
                        <span>{item.modulesCount} Core Modules</span>
                      </div>
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                        <Award className="h-3.5 w-3.5 text-amber-600" />
                        <span>Verified Digital Certificate & Placement Assured</span>
                      </div>
                    </div>

                    {/* Syllabus Breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <BookOpen className="h-3.5 w-3.5 text-blue-600" />
                          <span>Curriculum Modules Covered</span>
                        </h4>
                        <ul className="space-y-1.5 pl-1 text-[11px] text-slate-600">
                          {item.topics.map((t, tIdx) => (
                            <li key={tIdx} className="flex items-start gap-2">
                              <span className="h-1.5 w-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                              <span>{t}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="bg-white p-3.5 rounded-lg border border-slate-200 space-y-2">
                        <h4 className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                          <Code2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>Hands-On Industry Lab Projects</span>
                        </h4>
                        <ul className="space-y-1.5 pl-1 text-[11px] text-slate-600">
                          {item.labs.map((l, lIdx) => (
                            <li key={lIdx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                              <span>{l}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Quick Faculty Action Bar */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                      <span className="text-[11px] text-slate-500">
                        Faculty Delivery: Interactive Lab Sessions • Weekly Milestone Assessments
                      </span>
                      <div className="flex items-center gap-2">
                        <Link href={`/trainer/batches?course=${encodeURIComponent(item.title)}`}>
                          <Button size="sm" variant="outline" className="h-7 text-xs border-slate-300">
                            View Batches for this Course
                          </Button>
                        </Link>
                        <Link href="/trainer/classes">
                          <Button size="sm" className="h-7 text-xs bg-slate-900 hover:bg-black text-white">
                            Mark Session Attendance
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
