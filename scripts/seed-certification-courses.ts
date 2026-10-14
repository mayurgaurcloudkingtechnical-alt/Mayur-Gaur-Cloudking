import { PrismaClient, ContentStatus, BatchStatus, DeliveryMode } from "@prisma/client";

const prisma = new PrismaClient();

interface CertificationCourseDef {
  courseCode: string;
  title: string;
  slug: string;
  summary: string;
  description: string;
  durationWeeks: number;
  durationYears: string;
  baseFee: number; // in Paise
  discountedFee?: number;
  level: string;
  eligibility: string;
  specialization: string;
  specializations: string[];
  modules: Array<{
    title: string;
    description: string;
    lessons: string[];
  }>;
}

const CERTIFICATION_COURSES: CertificationCourseDef[] = [
  {
    courseCode: "CERT-AWS-CSA",
    title: "AWS Certified Solutions Architect & Cloud Administrator",
    slug: "aws-certified-solutions-architect-cloud-administrator",
    summary:
      "Master AWS cloud infrastructure, high-availability architecture, VPC networking, EC2 compute, S3 storage, and serverless deployments with practical hands-on labs.",
    description:
      "The AWS Certified Solutions Architect & Cloud Administrator certification program equips students with rigorous hands-on enterprise cloud capabilities. Covers AWS IAM identity management, VPC peering, subnets, EC2 scaling, RDS databases, Lambda serverless microservices, CloudFront CDN, Route53 DNS, CloudWatch monitoring, and Well-Architected Framework design patterns. Prepares for AWS Certified Solutions Architect Associate (SAA-C03) and SysOps Administrator certifications.",
    durationWeeks: 12,
    durationYears: "3 Months (12 Weeks)",
    baseFee: 2200000, // ₹22,000
    level: "Beginner to Advanced",
    eligibility: "Any Graduate, B.Tech, BCA, MCA, Diploma, or IT Professional",
    specialization: "Cloud Architecture & AWS Administration",
    specializations: ["AWS Architecture", "Cloud Infrastructure", "Serverless Computing", "Cloud Security"],
    modules: [
      {
        title: "AWS Core Fundamentals & Global Infrastructure",
        description: "Cloud concepts, AWS regions, availability zones, and IAM identity and access governance.",
        lessons: [
          "Cloud Computing Models & AWS Global Footprint",
          "IAM Users, Groups, Roles, Policies & Multi-Factor Auth (MFA)",
          "AWS Organizations & Cost Management Best Practices",
        ],
      },
      {
        title: "Compute & Auto-Scaling Architectures",
        description: "Elastic Compute Cloud (EC2), AMI creation, load balancers, and automated elasticity.",
        lessons: [
          "Amazon EC2 Instance Types, EBS Volumes & Snapshots",
          "Application & Network Load Balancers (ALB / NLB)",
          "Auto Scaling Groups & Health Check Lifecycle Hooks",
        ],
      },
      {
        title: "VPC Virtual Networking & Hybrid Connectivity",
        description: "Designing isolated enterprise software networks in AWS.",
        lessons: [
          "Custom VPC Design, Public & Private Subnets, Route Tables",
          "Internet Gateways, NAT Gateways & Security Groups vs NACLs",
          "VPC Peering, Transit Gateway & Site-to-Site VPN",
        ],
      },
      {
        title: "Storage, Databases & Serverless Solutions",
        description: "Managed data persistence, relational databases, and event-driven computing.",
        lessons: [
          "Amazon S3 Storage Classes, Bucket Policies & Lifecycle Rules",
          "Amazon RDS Multi-AZ, Read Replicas & DynamoDB NoSQL",
          "AWS Lambda, API Gateway & EventBridge Serverless Architecture",
        ],
      },
      {
        title: "Cloud Security, Monitoring & Production Capstone",
        description: "Operational excellence, telemetry, and enterprise AWS production deployment.",
        lessons: [
          "Amazon CloudWatch Metrics, Alarms, Logs & CloudTrail Auditing",
          "AWS KMS Encryption, Secrets Manager & Shield DDoS Protection",
          "Capstone Project: Multi-Tier High-Availability Web Application on AWS",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-AZURE-104",
    title: "Microsoft Certified: Azure Cloud Administrator (AZ-104)",
    slug: "microsoft-certified-azure-cloud-administrator-az104",
    summary:
      "Industry-recognized Azure administrator certification program covering Microsoft Entra ID, Azure VMs, virtual networks, storage governance, and hybrid cloud.",
    description:
      "Prepare for the globally demanded Microsoft Certified: Azure Administrator Associate (AZ-104) credential. Learn to manage Azure identities and governance, implement storage accounts, deploy and manage virtual machines and containers, configure virtual networking, and monitor cloud resources with Azure Monitor and Log Analytics.",
    durationWeeks: 12,
    durationYears: "3 Months (12 Weeks)",
    baseFee: 2200000, // ₹22,000
    level: "Beginner to Advanced",
    eligibility: "Graduates, System Administrators, Network Engineers, BCA/B.Tech",
    specialization: "Microsoft Azure Cloud Administration",
    specializations: ["Azure Infrastructure", "Entra ID Governance", "Virtual Networking", "Azure Storage"],
    modules: [
      {
        title: "Manage Azure Identities & Governance",
        description: "Microsoft Entra ID (Azure AD), role-based access control, and Azure subscriptions.",
        lessons: [
          "Microsoft Entra ID Users, Groups & Self-Service Password Reset",
          "Role-Based Access Control (RBAC) & Custom Role Definitions",
          "Azure Policy, Resource Locks & Management Groups",
        ],
      },
      {
        title: "Implement & Manage Azure Storage",
        description: "Configuring secure storage accounts, file shares, and data migration.",
        lessons: [
          "Azure Storage Accounts, Blob Tiers & Lifecycle Management",
          "Azure Files, File Sync & Storage Access Keys / SAS Tokens",
          "Azure Storage Security, Firewalls & Customer-Managed Keys",
        ],
      },
      {
        title: "Deploy & Manage Azure Compute Resources",
        description: "Virtual machine provisioning, scale sets, and container services.",
        lessons: [
          "Azure Virtual Machines (Windows & Linux) Provisioning & Disks",
          "Virtual Machine Scale Sets (VMSS) & Dedicated Hosts",
          "Azure App Services, Docker Containers & Azure Container Instances",
        ],
      },
      {
        title: "Configure & Manage Virtual Networking",
        description: "Enterprise networking, subnets, NSGs, peering, and load balancing in Azure.",
        lessons: [
          "Azure Virtual Networks (VNet), Subnets & IP Addressing",
          "Network Security Groups (NSG) & Application Security Groups (ASG)",
          "VNet Peering, Azure VPN Gateway, Load Balancer & Application Gateway",
        ],
      },
      {
        title: "Monitor, Backup & Disaster Recovery in Azure",
        description: "Telemetry, alerts, and business continuity for production Azure workloads.",
        lessons: [
          "Azure Monitor, Log Analytics Workspaces & Action Groups",
          "Azure Backup, Recovery Services Vaults & Site Recovery (ASR)",
          "Capstone: High-Availability Hybrid Enterprise Deployment on Microsoft Azure",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-CISCO-CCNA",
    title: "Cisco Certified Network Associate (CCNA 200-301)",
    slug: "cisco-certified-network-associate-ccna-200-301",
    summary:
      "Complete Cisco networking certification curriculum covering OSI model, TCP/IP, IP subnetting, Cisco IOS CLI, VLANs, OSPF routing, ACLs, and network automation.",
    description:
      "The gold standard in computer networking. Covers modern networking fundamentals, IP connectivity, IP services, security fundamentals, and network automation and programmability. Students practice with real Cisco Packet Tracer and GNS3 labs configuring switches, routers, VLANs, inter-VLAN routing, OSPFv2, NAT, DHCP, and enterprise network troubleshooting.",
    durationWeeks: 12,
    durationYears: "3 Months (12 Weeks)",
    baseFee: 2500000, // ₹25,000
    level: "Beginner to Advanced",
    eligibility: "Open to 12th, Diploma, BCA, B.Tech, and Network Aspirants",
    specialization: "Enterprise Networking & Cisco Routing/Switching",
    specializations: ["Cisco IOS", "Routing & Switching", "IP Subnetting", "Network Security"],
    modules: [
      {
        title: "Network Fundamentals & IP Addressing",
        description: "OSI 7-layer architecture, TCP/IP suite, IPv4 classless addressing, and CIDR subnetting.",
        lessons: [
          "Network Topologies, Devices (Routers, Switches, Firewalls) & Cables",
          "IPv4 Addressing, Binary Math & VLSM Subnetting Mastery",
          "IPv6 Address Structure, Global Unicast & SLAAC Auto-Configuration",
        ],
      },
      {
        title: "Network Access & Switching Technologies",
        description: "Switch configuration, Layer 2 forwarding, VLANs, and Spanning Tree Protocol.",
        lessons: [
          "Cisco IOS Command Line Interface (CLI) & Initial Switch Setup",
          "VLANs, 802.1Q Trunking & Inter-VLAN Routing (Router-on-a-Stick)",
          "Spanning Tree Protocol (STP / RSTP) & EtherChannel Port Bundling",
        ],
      },
      {
        title: "IP Connectivity & Dynamic Routing",
        description: "Routing tables, static routes, and Open Shortest Path First (OSPF).",
        lessons: [
          "Routing Table Components & Default vs Floating Static Routes",
          "Single-Area OSPFv2 Configuration, Router ID & Metric Calculation",
          "First Hop Redundancy Protocols (HSRP) Configuration",
        ],
      },
      {
        title: "IP Services & Network Security",
        description: "Core network services and access defense mechanisms on Cisco hardware.",
        lessons: [
          "DHCP Server Configuration, DNS Lookup & NTP Synchronization",
          "Network Address Translation (Static, Dynamic NAT & PAT/Overload)",
          "Standard & Extended Access Control Lists (ACLs) Implementation",
        ],
      },
      {
        title: "Wireless, Automation & Enterprise Capstone",
        description: "Enterprise wireless architectures, REST APIs, Python network scripts, and final labs.",
        lessons: [
          "WLAN Architectures, Wireless LAN Controllers (WLC) & WPA3 Security",
          "Cisco DNA Center, RESTCONF, NETCONF & Python Network Automation",
          "Capstone Lab: Multi-Site Enterprise Office Network Design in Cisco Packet Tracer",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-FORTI-NSE4",
    title: "FortiGate Firewall & Network Security Specialist (NSE 4)",
    slug: "fortigate-firewall-network-security-specialist-nse4",
    summary:
      "Specialized Next-Generation Firewall (NGFW) certification training on Fortinet FortiGate, security policies, IPsec VPN, SSL inspection, and intrusion prevention.",
    description:
      "A hands-on, job-oriented firewall engineering certification course aligned with Fortinet NSE 4 / Fortinet Certified Professional (FCP) standards. Covers FortiOS installation and initial setup, Next-Gen firewall security policies, NAT, IPsec site-to-site VPN tunnels, SSL-VPN remote access, antivirus inspection, web filtering, application control, intrusion prevention (IPS), and high availability (HA) clustering.",
    durationWeeks: 8,
    durationYears: "2 Months (8 Weeks)",
    baseFee: 2400000, // ₹24,000
    level: "Intermediate to Advanced",
    eligibility: "Network Engineers, System Admins, or CCNA Students",
    specialization: "Next-Gen Firewall Security & UTM",
    specializations: ["Fortinet NGFW", "IPsec & SSL VPN", "UTM Security Profiles", "High Availability"],
    modules: [
      {
        title: "FortiGate Architecture & Initial Configuration",
        description: "FortiOS interface, routing, administrative accounts, and network interfaces.",
        lessons: [
          "FortiGate Security Fabric Overview & Deployment Modes (NAT vs Transparent)",
          "Configuring Network Interfaces, VLANs & Static Routes",
          "Administrator Accounts, Roles & Two-Factor Authentication with FortiToken",
        ],
      },
      {
        title: "Security Policies & Network Address Translation (NAT)",
        description: "Policy creation, source/destination NAT, and virtual IPs.",
        lessons: [
          "Firewall Policy Workflow, Service Objects & Schedules",
          "Source NAT (Central SNAT & IP Pools) vs Destination NAT (VIPs)",
          "Policy Routing & SD-WAN Basics on FortiGate",
        ],
      },
      {
        title: "Unified Threat Management (UTM) Security Profiles",
        description: "Deep packet inspection, application control, and antivirus.",
        lessons: [
          "SSL/TLS Deep Inspection Certificates & Decryption",
          "Antivirus, Web Filtering & DNS Filtering Configuration",
          "Application Control, Intrusion Prevention System (IPS) & DoS Protection",
        ],
      },
      {
        title: "VPN Technologies & High Availability (HA)",
        description: "Connecting branch offices securely and ensuring 99.999% uptime.",
        lessons: [
          "IPsec Site-to-Site VPN Tunnel Setup with IKEv2",
          "SSL-VPN Web & Tunnel Mode for Remote Teleworkers",
          "Active-Passive & Active-Active High Availability (HA) Clustering & Failover",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-RHCSA-LNX",
    title: "Red Hat Certified System Administrator (RHCSA Linux Professional)",
    slug: "red-hat-certified-system-administrator-rhcsa-linux",
    summary:
      "Enterprise Linux certification training covering RHEL/Rocky Linux system administration, storage management with LVM, Bash scripting, systemd, and SELinux.",
    description:
      "Red Hat Certified System Administrator (RHCSA EX200) syllabus. Students learn essential tools for handling files, command line environments, and documentation; operate running systems, including booting into different run levels; identify processes, start/stop virtual machines, and control services; configure local storage using partitions and logical volumes (LVM); create and configure file systems; manage users, groups, and security permissions; and deploy containerized services using Podman.",
    durationWeeks: 12,
    durationYears: "3 Months (12 Weeks)",
    baseFee: 2200000, // ₹22,000
    level: "Beginner to Advanced",
    eligibility: "Any Student or Professional with basic computer literacy",
    specialization: "Enterprise Red Hat Linux Administration",
    specializations: ["RHEL 9", "Bash Automation", "LVM Storage", "SELinux & Security"],
    modules: [
      {
        title: "Linux Command Line Mastery & File Systems",
        description: "Core shell utilities, vim editor, text processing with grep/awk/sed, and directory hierarchy.",
        lessons: [
          "Linux Architecture, Shell Basics & GNU Coreutils",
          "Vim Editor, Text Streams, Pipes & Advanced Regex with grep/sed/awk",
          "File Permissions (chmod, chown), Umask, ACLs & SUID/SGID/Sticky Bits",
        ],
      },
      {
        title: "System Administration & Process Management",
        description: "User management, password governance, systemd services, and task scheduling.",
        lessons: [
          "User & Group Administration, Sudoers Configuration & PAM Basics",
          "Systemd Service Units, Targets (Rescue, Multi-user) & System Boot Process",
          "Process Monitoring (top, ps, kill) & Automated Scheduling with Cron and Anacron",
        ],
      },
      {
        title: "Storage Management, LVM & File Systems",
        description: "Disk partitioning, Logical Volume Manager, Stratis, and persistent mounts.",
        lessons: [
          "Partitioning Disks with fdisk & gdisk, Creating XFS & Ext4 File Systems",
          "Logical Volume Manager (LVM): Physical Volumes, Volume Groups & Logical Volumes",
          "Resizing LVM Volumes Online & Configuring /etc/fstab with UUIDs",
        ],
      },
      {
        title: "Networking, Package Management & Firewalls",
        description: "Network configuration with nmcli, repository management with DNF/YUM, and FirewallD.",
        lessons: [
          "Configuring IPv4/IPv6 Static Addresses & Hostnames via nmcli",
          "RPM Package Management & DNF/YUM Local/Remote Repositories",
          "FirewallD Zones, Services, Rich Rules & SELinux Contexts/Booleans",
        ],
      },
      {
        title: "Containers with Podman & RHCSA Exam Simulation",
        description: "Deploying rootless containers and performing real-world troubleshooting drills.",
        lessons: [
          "Running Containers with Podman, Managing Images & Port Forwarding",
          "Configuring Container Storage & Running Containers as Systemd Services",
          "Full RHCSA Real-Time Practical Exam Simulation (3-Hour Break-Fix Lab)",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-CYBER-CEH",
    title: "Certified Ethical Hacker & Cyber Defense Professional (CEH & Security+)",
    slug: "certified-ethical-hacker-cyber-defense-professional",
    summary:
      "Comprehensive ethical hacking and defense certification covering penetration testing, network reconnaissance, web app security (OWASP Top 10), and SOC operations.",
    description:
      "Hands-on offensive and defensive cybersecurity training. Learn how cyber attackers breach defenses, and how security engineers prevent, detect, and remediate vulnerabilities. Covers foot-printing, port scanning with Nmap, exploitation with Metasploit, traffic analysis with Wireshark, password cracking with John the Ripper and Hashcat, web vulnerability exploitation with Burp Suite, SQL injection, XSS, digital forensics, and SIEM security operations.",
    durationWeeks: 16,
    durationYears: "4 Months (16 Weeks)",
    baseFee: 3200000, // ₹32,000
    level: "Beginner to Master",
    eligibility: "IT Enthusiasts, Engineers, BCA/B.Tech, Network Admins",
    specialization: "Offensive Security, Ethical Hacking & SOC Defense",
    specializations: ["Penetration Testing", "OWASP Top 10", "Network Forensics", "SIEM & SOC"],
    modules: [
      {
        title: "Cyber Security Fundamentals & Reconnaissance",
        description: "CIA triad, threat modeling, foot-printing, OSINT, and active scanning.",
        lessons: [
          "Cybersecurity Landscape, Laws, Ethics & Hacking Methodology",
          "Open Source Intelligence (OSINT) & Passive Reconnaissance",
          "Active Scanning with Nmap, Netcat & Vulnerability Scanning with Nessus",
        ],
      },
      {
        title: "System & Network Exploitation",
        description: "Vulnerability analysis, exploitation frameworks, and privilege escalation.",
        lessons: [
          "Sniffing & MITM Attacks with Wireshark & Ettercap",
          "Metasploit Framework: Payloads, Exploits, Meterpreter & Post-Exploitation",
          "Password Cracking with John the Ripper, Hashcat & Hydra",
        ],
      },
      {
        title: "Web Application Security & OWASP Top 10",
        description: "Testing and securing web APIs and web applications.",
        lessons: [
          "Web App Architecture, HTTP Requests/Responses & Burp Suite Proxy",
          "SQL Injection (SQLi), Cross-Site Scripting (XSS) & CSRF Exploitation",
          "Server-Side Request Forgery (SSRF), IDOR & Broken Authentication Labs",
        ],
      },
      {
        title: "Wireless, Cloud Security & Malware Analysis",
        description: "Attacking and defending wireless networks and inspecting malware signatures.",
        lessons: [
          "WPA2/WPA3 Wi-Fi Cracking with Aircrack-ng & Rogue APs",
          "Malware Analysis Basics: Ransomware, Trojans, Rootkits & Sandboxing",
          "AWS/Azure Cloud Security Fundamentals & IAM Attack Vectors",
        ],
      },
      {
        title: "SOC Operations, Incident Response & Live CTF",
        description: "Security Operations Center monitoring and capture-the-flag exercises.",
        lessons: [
          "SIEM Architecture, Splunk Log Analysis & Threat Hunting",
          "Incident Response Lifecycle (Identification, Containment, Eradication)",
          "Live Capture the Flag (CTF) Attack-Defense Enterprise Range",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-DEVOPS-AI",
    title: "Certified Cloud Computing & DevOps Engineer with AI",
    slug: "certified-cloud-computing-devops-engineer-with-ai",
    summary:
      "Modern DevOps and Cloud Engineering certification curriculum with Docker, Kubernetes, Jenkins CI/CD, Terraform, Ansible, AWS, and AI workflow automation.",
    description:
      "A 6-month elite DevOps program designed to transform learners into high-earning DevOps & Site Reliability Engineers (SRE). Covers Git workflows, continuous integration & continuous delivery pipelines with Jenkins and GitHub Actions, containerization with Docker, container orchestration with Kubernetes, Infrastructure as Code (IaC) with Terraform, configuration management with Ansible, monitoring with Prometheus and Grafana, and AI-assisted deployment automation.",
    durationWeeks: 24,
    durationYears: "6 Months (24 Weeks)",
    baseFee: 4500000, // ₹45,000
    level: "Beginner to Expert",
    eligibility: "Graduates, Software Engineers, System Admins, BCA, MCA, B.Tech",
    specialization: "Cloud Infrastructure, Containers, CI/CD & DevOps Automation",
    specializations: ["Docker & Kubernetes", "Jenkins CI/CD", "Terraform IaC", "AWS Cloud & MLOps"],
    modules: [
      {
        title: "Linux, Shell Scripting & Git Collaboration",
        description: "Solid system administration and version control foundation.",
        lessons: [
          "Enterprise Linux Administration, Networking & Troubleshooting",
          "Advanced Bash Shell Scripting for DevOps Automation",
          "Git Version Control, GitFlow Branching Strategies & Pull Requests",
        ],
      },
      {
        title: "Containers with Docker & Docker Compose",
        description: "Containerizing microservices and managing multi-container stacks.",
        lessons: [
          "Docker Architecture, Container Lifecycle & Dockerfile Best Practices",
          "Multi-Stage Docker Builds, Volume Mounting & Network Drivers",
          "Multi-Container Orchestration with Docker Compose",
        ],
      },
      {
        title: "Continuous Integration & Delivery (CI/CD)",
        description: "Automating builds, testing, security scans, and artifact publishing.",
        lessons: [
          "Jenkins Installation, Master-Agent Architecture & Declarative Pipelines",
          "Automated Testing, SonarQube Code Quality & Trivy Container Scanning",
          "GitHub Actions CI/CD Workflows for Cloud Deployments",
        ],
      },
      {
        title: "Container Orchestration with Kubernetes (K8s)",
        description: "Deploying and scaling production workloads across distributed clusters.",
        lessons: [
          "Kubernetes Architecture (Control Plane, Worker Nodes, etcd)",
          "Pods, Deployments, ReplicaSets, Services (ClusterIP, NodePort, LoadBalancer)",
          "ConfigMaps, Secrets, Ingress Controllers & Helm Package Management",
        ],
      },
      {
        title: "Infrastructure as Code (Terraform) & Configuration (Ansible)",
        description: "Declarative infrastructure provisioning and automated configuration.",
        lessons: [
          "Terraform Architecture, Providers, State Files & Remote Backends",
          "Provisioning Multi-Tier AWS Infrastructure with Reusable Terraform Modules",
          "Ansible Playbooks, Inventory, Roles & Automated Server Configuration",
        ],
      },
      {
        title: "Observability, AI Automation & Capstone Project",
        description: "Full observability stack and end-to-end production pipeline.",
        lessons: [
          "Prometheus Metrics Scraping & Grafana Production Dashboards",
          "ELK Stack (Elasticsearch, Logstash, Kibana) Centralized Logging",
          "Capstone: End-to-End GitOps Microservices Pipeline on AWS EKS with AI Telemetry",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-DATA-BI",
    title: "Certified Data Analytics & BI Professional (Power BI, SQL & Tableau)",
    slug: "certified-data-analytics-bi-professional-powerbi-sql",
    summary:
      "Industry-focused data analytics certification covering advanced SQL database querying, Power BI DAX modeling, interactive Tableau dashboards, and business intelligence.",
    description:
      "Become a job-ready Data Analyst and Business Intelligence professional. Learn to extract, transform, and model raw corporate data into interactive executive reports. Master advanced SQL (window functions, CTEs, complex joins), Power BI (Power Query, star schema modeling, DAX formulas, interactive dashboards), Tableau (visual analytics, calculated fields, stories), Excel advanced analytics, and Python for Exploratory Data Analysis.",
    durationWeeks: 12,
    durationYears: "3 Months (12 Weeks)",
    baseFee: 2400000, // ₹24,000
    level: "Beginner to Advanced",
    eligibility: "Any Graduate, B.Com, B.Sc, BCA, B.Tech, MBA or Working Professional",
    specialization: "Business Intelligence, SQL Analytics & Dashboard Engineering",
    specializations: ["Power BI & DAX", "Advanced SQL", "Tableau Analytics", "Business Intelligence"],
    modules: [
      {
        title: "Advanced SQL for Data Analysts",
        description: "Mastering database queries, aggregations, window functions, and business reporting.",
        lessons: [
          "Relational Database Design, Normalization & SQL Basics",
          "Complex Joins (Inner, Left, Cross, Self) & Grouped Aggregations",
          "Common Table Expressions (CTEs), Subqueries & Window Functions (ROW_NUMBER, RANK, DENSE_RANK)",
        ],
      },
      {
        title: "Data Modeling & Transformation in Power BI",
        description: "ETL pipelines with Power Query and dimensional schema modeling.",
        lessons: [
          "Connecting to Data Sources & Data Cleansing with Power Query Editor",
          "Star Schema vs Snowflake Data Modeling & Relationship Cardinality",
          "Calculated Columns vs Measures in Power BI",
        ],
      },
      {
        title: "DAX (Data Analysis Expressions) Mastery",
        description: "Creating complex business logic and time intelligence calculations.",
        lessons: [
          "Core DAX Functions: CALCULATE, FILTER, ALL, RELATED",
          "Time Intelligence DAX: YTD, MTD, SAMEPERIODLASTYEAR, Rolling Averages",
          "Dynamic KPI Metrics & Conditional Formatting",
        ],
      },
      {
        title: "Tableau Visual Analytics & Executive Dashboards",
        description: "Building compelling visual narratives and real-time dashboards in Tableau.",
        lessons: [
          "Tableau Interface, Dimensions vs Measures & Marks Card",
          "Calculated Fields, Table Calculations & Level of Detail (LOD) Expressions",
          "Building Interactive Executive Dashboards with Filters & Action Parameters",
        ],
      },
      {
        title: "Business Analytics Capstone & Case Studies",
        description: "Real-world portfolio projects in e-commerce, banking, and retail sales analytics.",
        lessons: [
          "Sales Revenue & Profitability Analysis Dashboard Project",
          "Customer Churn & Retention Analytics Modeling",
          "End-to-End Executive Boardroom Data Presentation Portfolio",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-AI-GENAI",
    title: "Certified Artificial Intelligence & Generative AI Specialist",
    slug: "certified-artificial-intelligence-generative-ai-specialist",
    summary:
      "Cutting-edge Generative AI certification covering prompt engineering, LLM API integrations (OpenAI, Gemini, Claude), LangChain, RAG architectures, and autonomous AI agents.",
    description:
      "Step into the future of computing with this hands-on Generative AI engineering course. Master modern Python for AI, advanced Prompt Engineering (Zero-shot, Few-shot, Chain-of-Thought), API development with OpenAI GPT-4, Google Gemini and Anthropic Claude, Retrieval-Augmented Generation (RAG) using ChromaDB and Pinecone vector databases, LangChain frameworks, and autonomous multi-agent systems.",
    durationWeeks: 16,
    durationYears: "4 Months (16 Weeks)",
    baseFee: 3500000, // ₹35,000
    level: "Beginner to Expert",
    eligibility: "Engineers, Developers, Graduates, Tech Enthusiasts with basic coding knowledge",
    specialization: "Generative AI, Large Language Models & AI Agent Engineering",
    specializations: ["Generative AI", "LLM APIs & Prompting", "RAG & Vector DBs", "AI Agents & LangChain"],
    modules: [
      {
        title: "Python for AI & Prompt Engineering Fundamentals",
        description: "Core Python libraries and professional prompting techniques.",
        lessons: [
          "Python Crash Course: NumPy, Pandas & Asynchronous Programming",
          "Principles of Prompt Engineering: Role Prompting, Delimiters & Formatting",
          "Advanced Prompting: Few-Shot, Chain-of-Thought (CoT), Directional Stimulus",
        ],
      },
      {
        title: "Large Language Model (LLM) APIs & Embeddings",
        description: "Integrating frontier AI models into production applications.",
        lessons: [
          "OpenAI API, Google Gemini API & Anthropic Claude Integration in Python",
          "Tokenization, Context Windows, Temperature & Top-P Parameters",
          "Text Embeddings, Semantic Search & Cosine Similarity Concepts",
        ],
      },
      {
        title: "Retrieval-Augmented Generation (RAG) Systems",
        description: "Connecting private documents and knowledge bases to LLMs.",
        lessons: [
          "Vector Databases: ChromaDB, Pinecone & FAISS Implementation",
          "Document Ingestion, Chunking Strategies & Metadata Filtering",
          "Building a Production RAG Chatbot over Enterprise PDFs and Docs",
        ],
      },
      {
        title: "LangChain & LlamaIndex Frameworks",
        description: "Orchestrating complex chains, memory, and structured outputs.",
        lessons: [
          "LangChain Chains, Prompts & Output Parsers",
          "Conversation Memory (Buffer, Summary) for Contextual Chatbots",
          "LlamaIndex Document Indexing & Query Engines",
        ],
      },
      {
        title: "Autonomous AI Agents & Production Capstone",
        description: "Tool calling, ReAct loops, multi-agent frameworks, and cloud deployment.",
        lessons: [
          "Function Calling & Tool Execution with LLMs",
          "Building Autonomous Agents with CrewAI / LangGraph",
          "Capstone: Full-Stack Generative AI Enterprise Assistant with Web UI Deployment",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-TECH-SUPP",
    title: "Certified Hardware, Networking & Technical Support Specialist",
    slug: "certified-hardware-networking-technical-support-specialist",
    summary:
      "Hands-on PC hardware assembly, laptop diagnostics, Windows 11/Server OS installation, LAN networking, printer setup, helpdesk ticketing, and remote IT support.",
    description:
      "A 100% practical desktop support and IT technician certification course. Prepares students for immediate employment as Desktop Support Engineers, Hardware Technicians, and IT Helpdesk Executives. Learn motherboard architecture, processor installation, RAM/SSD upgrades, BIOS/UEFI configuration, Windows 10/11 & Server installation, data recovery, LAN cable crimping, router/switch basics, printer/scanner sharing, and ITIL helpdesk ticketing.",
    durationWeeks: 12,
    durationYears: "3 Months (12 Weeks)",
    baseFee: 1800000, // ₹18,000
    level: "Beginner to Advanced",
    eligibility: "Open to all students, 10th/12th, ITI, Diploma, Graduates",
    specialization: "Desktop Support Engineering & IT Hardware/Networking",
    specializations: ["PC Hardware Assembly", "OS Troubleshooting", "LAN Networking", "IT Helpdesk & Ticketing"],
    modules: [
      {
        title: "Computer Hardware Architecture & Assembly",
        description: "Hands-on desktop and laptop hardware diagnostics and maintenance.",
        lessons: [
          "Computer Architecture: Motherboards, CPU Sockets, RAM Standards & SMPS",
          "Storage Technologies: SATA, M.2 NVMe SSDs & Partitioning",
          "Hands-on Desktop Assembly, Thermal Paste Application & Disassembly",
        ],
      },
      {
        title: "Operating Systems Installation & Maintenance",
        description: "Windows installation, drivers, disk management, and system recovery.",
        lessons: [
          "Bootable USB Creation with Rufus, BIOS/UEFI Setup (GPT vs MBR)",
          "Windows 10/11 Clean Installation & Driver Configuration",
          "Disk Management, Registry Editor, Services & Event Viewer Diagnostics",
        ],
      },
      {
        title: "Local Area Networking & Device Sharing",
        description: "Cabling, IP configuration, routers, and peripheral sharing.",
        lessons: [
          "LAN Cable Crimping (Straight vs Cross RJ-45) & Cable Testing",
          "Static IP Assignment, DHCP, DNS & Network Troubleshooting Commands (ping, tracert)",
          "Network Printer, Scanner & Shared Folder Permissions Setup",
        ],
      },
      {
        title: "Hardware Troubleshooting & System Recovery",
        description: "Fixing common PC faults, blue screens, and hardware failures.",
        lessons: [
          "Troubleshooting POST Failure, Beep Codes & Display Issues",
          "Blue Screen of Death (BSOD) Debugging & Driver Rollbacks",
          "Data Recovery Techniques & System Image Backups",
        ],
      },
      {
        title: "IT Helpdesk Process, Ticketing & Remote Support",
        description: "Customer service, SLA management, ticketing tools, and remote administration.",
        lessons: [
          "Remote Desktop Support Tools (RDP, AnyDesk, TeamViewer)",
          "ITIL Service Desk Concepts, Ticketing Systems & SLA Escalation",
          "Live Support Scenario Drills & Technical Interview Preparation",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-M365-ADMIN",
    title: "Certified Microsoft Office 365 & Modern Workplace Administrator",
    slug: "certified-microsoft-office-365-modern-workplace-administrator",
    summary:
      "Enterprise Microsoft 365 administration certification covering user management, Exchange Online email, SharePoint, OneDrive, Teams, and PowerShell automation.",
    description:
      "Master the world's most widely used corporate collaboration suite. This certification program prepares students for high-demand roles as Microsoft 365 Administrators, Cloud Support Specialists, and Modern Workplace Engineers. Learn tenant management, license assignment, Exchange Online mailboxes and mail flow rules, SharePoint site permissions, OneDrive corporate sync, Microsoft Teams administration, security policies, and PowerShell management.",
    durationWeeks: 8,
    durationYears: "2 Months (8 Weeks)",
    baseFee: 2000000, // ₹20,000
    level: "Beginner to Advanced",
    eligibility: "Any Graduate, IT Helpdesk Engineers, System Administrators",
    specialization: "Microsoft 365 Cloud Tenant Administration",
    specializations: ["M365 Admin Center", "Exchange Online", "SharePoint & Teams", "PowerShell Automation"],
    modules: [
      {
        title: "Microsoft 365 Fundamentals & Tenant Setup",
        description: "Cloud collaboration architecture, subscription plans, and tenant setup.",
        lessons: [
          "Microsoft 365 Cloud Ecosystem, Business vs Enterprise Licensing",
          "Microsoft 365 Admin Center Overview & Custom Domain Setup",
          "User Account Creation, Bulk CSV Import & License Assignment",
        ],
      },
      {
        title: "Exchange Online & Mailbox Administration",
        description: "Managing corporate email flow, distribution lists, and security.",
        lessons: [
          "User Mailboxes, Shared Mailboxes & Resource (Room/Equipment) Mailboxes",
          "Distribution Groups, Mail-Enabled Security Groups & Aliases",
          "Mail Flow Rules (Transport Rules), Anti-Spam & Anti-Phishing Policies",
        ],
      },
      {
        title: "SharePoint Online & OneDrive for Business",
        description: "Enterprise document storage, permissions, and team collaboration sites.",
        lessons: [
          "SharePoint Architecture, Team Sites vs Communication Sites",
          "Document Libraries, Version History & External Sharing Permissions",
          "OneDrive for Business Storage Quotas & Desktop Sync Troubleshooting",
        ],
      },
      {
        title: "Microsoft Teams Administration & PowerShell Automation",
        description: "Teams governance, meeting policies, and automation scripts.",
        lessons: [
          "Microsoft Teams Admin Center: Team Creation, Channels & Guest Access",
          "Meeting Policies, Messaging Policies & App Permission Policies",
          "Connecting to Microsoft 365 via PowerShell for Automated Administration",
        ],
      },
    ],
  },
  {
    courseCode: "CERT-MERN-WEB",
    title: "Certified Full Stack Web Development (MERN & Next.js Professional)",
    slug: "certified-full-stack-web-development-mern-nextjs",
    summary:
      "Complete full-stack certification in modern web development with React.js, Next.js, Node.js, Express, MongoDB, Tailwind CSS, REST APIs, and cloud hosting.",
    description:
      "Accelerated industry certification in full-stack web engineering. Master responsive web design with HTML5/CSS3 and Tailwind CSS, modern JavaScript (ES6+), frontend development with React.js and Next.js, backend REST API development with Node.js and Express, database architecture with MongoDB and Mongoose, user authentication with JWT and bcrypt, and live deployment on Vercel and Render.",
    durationWeeks: 16,
    durationYears: "4 Months (16 Weeks)",
    baseFee: 3500000, // ₹35,000
    level: "Beginner to Advanced",
    eligibility: "Any Graduate, College Student, BCA, B.Tech, or Career Switcher",
    specialization: "Full Stack Web Engineering & Cloud Deployment",
    specializations: ["React & Next.js", "Node.js & Express", "MongoDB & Databases", "REST APIs & Cloud"],
    modules: [
      {
        title: "Modern Frontend Foundations (HTML5, Tailwind & ES6+)",
        description: "Building responsive, mobile-first web user interfaces.",
        lessons: [
          "Semantic HTML5, CSS Grid, Flexbox & Responsive Layouts",
          "Tailwind CSS Utility-First Styling & Modern UI Components",
          "Modern JavaScript: Async/Await, Promises, Closures, DOM Manipulation",
        ],
      },
      {
        title: "React.js & Next.js Frontend Engineering",
        description: "Component architecture, state management, hooks, and routing.",
        lessons: [
          "React JSX, Props, State, Component Lifecycle & Custom Hooks",
          "Context API & Redux Toolkit for Global State Management",
          "Next.js App Router, Server Components & Client-Side Navigation",
        ],
      },
      {
        title: "Backend Development with Node.js & Express",
        description: "Server architecture, middleware, routing, and RESTful APIs.",
        lessons: [
          "Node.js Event Loop, File System & NPM Package Ecosystem",
          "Express.js Server Setup, Middleware, Routing & Request Handling",
          "REST API Architecture, JSON Payloads & Error Handling Middleware",
        ],
      },
      {
        title: "Database Modeling with MongoDB & Authentication",
        description: "Data schemas, indexing, password hashing, and token security.",
        lessons: [
          "MongoDB Document Database, Collections & Compass GUI",
          "Mongoose Schema Design, Validations, Relationships & Population",
          "Secure Authentication with JWT Tokens, Cookies & Bcrypt Hashing",
        ],
      },
      {
        title: "Full-Stack Integration, Live Deployment & Capstone",
        description: "Connecting frontend to backend, cloud hosting, and portfolio building.",
        lessons: [
          "Full-Stack E-Commerce Web Application Development",
          "Deploying Backend to Render/Railway & Frontend to Vercel with Custom Domains",
          "Building a Professional GitHub Developer Portfolio & Resume",
        ],
      },
    ],
  },
];

async function seedCertificationCourses() {
  console.log("==================================================");
  console.log("SEEDING 12 INDUSTRY CERTIFICATION COURSES");
  console.log("==================================================");

  let createdCount = 0;
  let updatedCount = 0;

  for (let i = 0; i < CERTIFICATION_COURSES.length; i++) {
    const cert = CERTIFICATION_COURSES[i];
    const sortOrder = 100 + i;

    // Check if course already exists by slug or courseCode
    const existing = await prisma.course.findFirst({
      where: {
        OR: [{ slug: cert.slug }, { courseCode: cert.courseCode }],
      },
    });

    let courseRecord;

    if (existing) {
      courseRecord = await prisma.course.update({
        where: { id: existing.id },
        data: {
          title: cert.title,
          slug: cert.slug,
          courseCode: cert.courseCode,
          summary: cert.summary,
          description: cert.description,
          durationWeeks: cert.durationWeeks,
          durationYears: cert.durationYears,
          baseFee: cert.baseFee,
          level: cert.level,
          eligibility: cert.eligibility,
          specialization: cert.specialization,
          specializations: cert.specializations,
          programCategory: "CERTIFICATION",
          providerType: "SOFTLAB",
          providerName: "SoftLab Global",
          status: ContentStatus.PUBLISHED,
          sortOrder,
          placementInfo: "100% Practical Labs, Industry Certification Prep & Placement Support",
          mode: "HYBRID",
          branch: "Civil Lines, Prayagraj",
        },
      });
      updatedCount++;
      console.log(`[UPDATED] ${cert.title} (Fee: ₹${cert.baseFee / 100})`);
    } else {
      courseRecord = await prisma.course.create({
        data: {
          title: cert.title,
          slug: cert.slug,
          courseCode: cert.courseCode,
          summary: cert.summary,
          description: cert.description,
          durationWeeks: cert.durationWeeks,
          durationYears: cert.durationYears,
          baseFee: cert.baseFee,
          level: cert.level,
          eligibility: cert.eligibility,
          specialization: cert.specialization,
          specializations: cert.specializations,
          programCategory: "CERTIFICATION",
          providerType: "SOFTLAB",
          providerName: "SoftLab Global",
          status: ContentStatus.PUBLISHED,
          sortOrder,
          placementInfo: "100% Practical Labs, Industry Certification Prep & Placement Support",
          mode: "HYBRID",
          branch: "Civil Lines, Prayagraj",
        },
      });
      createdCount++;
      console.log(`[CREATED] ${cert.title} (Fee: ₹${cert.baseFee / 100})`);
    }

    // Seed modules and lessons
    for (let mIdx = 0; mIdx < cert.modules.length; mIdx++) {
      const modDef = cert.modules[mIdx];
      const mod = await prisma.module.upsert({
        where: {
          id: `${courseRecord.id}-mod-${mIdx + 1}`,
        },
        create: {
          id: `${courseRecord.id}-mod-${mIdx + 1}`,
          courseId: courseRecord.id,
          title: modDef.title,
          description: modDef.description,
          sortOrder: mIdx + 1,
          status: ContentStatus.PUBLISHED,
        },
        update: {
          title: modDef.title,
          description: modDef.description,
          sortOrder: mIdx + 1,
          status: ContentStatus.PUBLISHED,
        },
      });

      for (let lIdx = 0; lIdx < modDef.lessons.length; lIdx++) {
        const lessonTitle = modDef.lessons[lIdx];
        await prisma.lesson.upsert({
          where: {
            id: `${mod.id}-les-${lIdx + 1}`,
          },
          create: {
            id: `${mod.id}-les-${lIdx + 1}`,
            moduleId: mod.id,
            title: lessonTitle,
            sortOrder: lIdx + 1,
            status: ContentStatus.PUBLISHED,
          },
          update: {
            title: lessonTitle,
            sortOrder: lIdx + 1,
            status: ContentStatus.PUBLISHED,
          },
        });
      }
    }

    // Ensure active enrollment batch exists
    const batchCode = `BATCH-${cert.courseCode.replace("CERT-", "")}-2026-01`;
    const batchName = `${cert.title} - Cohort 1`;
    await prisma.batch.upsert({
      where: { code: batchCode },
      create: {
        code: batchCode,
        name: batchName,
        courseId: courseRecord.id,
        status: BatchStatus.ONGOING,
        startDate: new Date("2026-04-01T00:00:00Z"),
        maxCapacity: 30,
        deliveryMode: DeliveryMode.HYBRID,
        location: "Lab-1 & Cloud Studio, Civil Lines Prayagraj Campus",
      },
      update: {
        name: batchName,
        status: BatchStatus.ONGOING,
        maxCapacity: 30,
      },
    });
  }

  console.log("--------------------------------------------------");
  console.log(`Successfully Processed: ${createdCount} created, ${updatedCount} updated.`);
  console.log("All 12 Certification Courses seeded with modules, lessons, and active batches!");
  console.log("==================================================");
}

seedCertificationCourses()
  .catch((e) => {
    console.error("Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
