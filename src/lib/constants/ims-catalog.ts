export interface ImsFaqItem {
  question: string;
  answer: string;
}

export interface ImsServiceDefinition {
  id: string;
  slug: string;
  code:
    | "CCTV_SURVEILLANCE"
    | "SERVER_INFRASTRUCTURE"
    | "NETWORKING_CABLING"
    | "COMPUTER_LAB_SETUP"
    | "AMC_MANAGED_IT"
    | "HARDWARE_SUPPLY"
    | "BIOMETRIC_ACCESS"
    | "TURNKEY_IT_PROJECTS";
  number: string;
  title: string;
  badge: string;
  accentColor: "emerald" | "cyan" | "teal" | "amber" | "violet" | "sky" | "rose" | "indigo";
  iconName:
    | "Camera"
    | "Server"
    | "Network"
    | "Monitor"
    | "Wrench"
    | "HardDrive"
    | "Fingerprint"
    | "Building2";
  shortDescription: string;
  overview: string;
  cardBullets: string[];
  inclusions: string[];
  benefits: string[];
  idealFor: string[];
  deliverables: string[];
  faqs: ImsFaqItem[];
}

export const IMS_SERVICES_LIST: ImsServiceDefinition[] = [
  {
    id: "ims-cctv",
    slug: "cctv-installation",
    code: "CCTV_SURVEILLANCE",
    number: "01",
    title: "CCTV Installation & Surveillance",
    badge: "24/7 HD & IP Video Security",
    accentColor: "emerald",
    iconName: "Camera",
    shortDescription:
      "End-to-end IP and HD CCTV surveillance systems with NVR/DVR storage, structured cabling, mobile remote viewing, and annual maintenance.",
    overview:
      "SoftLab Global engineers reliable, high-definition indoor and outdoor video surveillance architectures for corporate offices, educational institutions, warehouses, retail chains, and residential campuses. From site survey and blind-spot analysis to structured cabling, NVR/DVR storage configuration, and encrypted mobile viewing setup, we deliver complete turnkey surveillance deployments.",
    cardBullets: [
      "IP and HD CCTV cameras",
      "DVR/NVR and recording storage",
      "Cables, connectors, conduits and accessories",
      "Installation, configuration and remote viewing",
      "CCTV maintenance and AMC",
    ],
    inclusions: [
      "On-site security coverage assessment and camera placement layout",
      "Supply and mounting of Dome, Bullet, PTZ, and Night-Vision IP/HD cameras",
      "DVR / NVR installation with enterprise surveillance-grade HDD storage (WD Purple / Seagate SkyHawk)",
      "Structured Cat6 / 3+1 coaxial cabling with PVC conduits, trunking, and weatherproof junction boxes",
      "BNC, DC, RJ45 connectors, PoE switches, and centralized power supply units",
      "Static IP / Cloud P2P configuration for mobile and desktop remote viewing",
      "System testing, camera angle calibration, and user handover training",
    ],
    benefits: [
      "Eliminate security blind spots across entry gates, corridors, server rooms, and perimeters",
      "Crystal-clear day and infrared night-vision recording with motion-detection alerts",
      "Multi-location live monitoring on smartphones, tablets, and central control rooms",
      "Neat, concealed conduit wiring that protects cables from weather and tampering",
      "Prompt local technical support and preventive AMC visits",
    ],
    idealFor: [
      "Schools, Colleges & University Campuses",
      "Corporate Offices, Banks & Commercial Buildings",
      "Retail Showrooms, Warehouses & Industrial Plants",
      "Hospitals, Hotels & Residential Societies",
    ],
    deliverables: [
      "Complete installed camera network & NVR/DVR rack unit",
      "Configured mobile/PC monitoring access for authorized personnel",
      "Channel mapping chart & storage retention configuration",
      "Warranty documentation & optional Annual Maintenance Contract (AMC)",
    ],
    faqs: [
      {
        question: "Should I choose IP CCTV cameras or HD Analog cameras?",
        answer:
          "IP cameras offer higher resolution, PoE single-cable connectivity, advanced analytics, and easier scalability over Cat6 networking. HD Analog (3+1 cable) is cost-effective for smaller setups or existing coaxial upgrades. Our team recommends the optimal mix after inspecting your site.",
      },
      {
        question: "How many days of recording backup will I get?",
        answer:
          "Recording retention depends on camera count, resolution (2MP/4MP/8MP), compression (H.265+), and hard drive capacity (1TB to 16TB+). We size your NVR/DVR storage for 15, 30, 60, or 90 days as required.",
      },
      {
        question: "Can I view live CCTV feeds on my mobile phone from anywhere?",
        answer:
          "Yes. We configure secure mobile and desktop viewing apps so authorized administrators can watch live feeds and playback recordings remotely over internet connections.",
      },
      {
        question: "How is cabling length calculated in the quotation?",
        answer:
          "Initial quotations use your provided estimate or standard per-camera averages as a provisional estimate. Final billing is based on actual measured cable and conduit runs verified during site survey or installation.",
      },
    ],
  },
  {
    id: "ims-server",
    slug: "server-installation",
    code: "SERVER_INFRASTRUCTURE",
    number: "02",
    title: "Server Installation & Infrastructure",
    badge: "On-Premises & Hybrid Server Engineering",
    accentColor: "cyan",
    iconName: "Server",
    shortDescription:
      "Deployment of tower and rack servers, server racks, OS installation, RAID storage, virtualization, automated backups, and continuous monitoring.",
    overview:
      "Build a resilient, high-availability backbone for your institutional ERP, databases, file sharing, Active Directory, and local applications. SoftLab Global supplies, racks, configures, and maintains enterprise tower and rack servers with hardware RAID redundancy, virtualization hypervisors, power protection, and disaster recovery.",
    cardBullets: [
      "Tower and rack servers",
      "Server racks and storage",
      "Operating system installation and configuration",
      "Backup, virtualization and migration",
      "Server maintenance and monitoring",
    ],
    inclusions: [
      "Server sizing consultation based on concurrent users and application workloads",
      "Tower and 1U/2U/4U Rack Server installation (Dell PowerEdge, HPE ProLiant, Lenovo ThinkSystem, or custom enterprise builds)",
      "Floor-standing and wall-mount server racks (9U, 15U, 24U, 42U) with PDUs, cooling fans, and cable managers",
      "Hardware RAID configuration (RAID 1, 5, 6, 10) and NAS/SAN storage setup",
      "Windows Server / Linux (Ubuntu, RHEL, Rocky, AlmaLinux) installation & hardening",
      "Virtualization setup (VMware ESXi, Proxmox VE, Microsoft Hyper-V) and workload migration",
      "Automated local & cloud backup policies, firewall rules, and health monitoring",
    ],
    benefits: [
      "Centralized data security, user access control, and high-speed local application hosting",
      "Hardware redundancy (RAID & dual power supplies) prevents data loss from disk failure",
      "Run multiple isolated virtual servers on a single physical machine to reduce hardware costs",
      "Structured rack dressing and thermal management extend hardware lifespan",
      "Minimized downtime with proactive health checks and SLA-backed server support",
    ],
    idealFor: [
      "Universities, Examination Centers & Computer Labs",
      "Hospitals, Diagnostic Labs & Financial Institutions",
      "Manufacturing Units, Accounting Firms & Corporate Head Offices",
      "Organizations running Tally Server, Local ERPs, LMS, or File Servers",
    ],
    deliverables: [
      "Racked, wired, and burn-in tested server infrastructure",
      "Configured OS, hypervisor, RAID array, and user access policies",
      "Automated backup schedule & recovery verification report",
      "Server administrator documentation & topology diagram",
    ],
    faqs: [
      {
        question: "Do we need a Rack Server or a Tower Server?",
        answer:
          "Tower servers are ideal for small-to-medium offices without a dedicated server room. Rack servers are recommended when you have a server rack, multiple networking switches, or plans to scale multiple servers cleanly.",
      },
      {
        question: "Can you migrate our existing data and applications to the new server?",
        answer:
          "Yes. We perform planned migrations of databases, file shares, Active Directory, and business software with minimal disruption to working hours.",
      },
      {
        question: "Do you configure automated backups?",
        answer:
          "Absolutely. Every server deployment includes local NAS/external backup scheduling and optional encrypted offsite/cloud backup routines.",
      },
    ],
  },
  {
    id: "ims-networking",
    slug: "networking",
    code: "NETWORKING_CABLING",
    number: "03",
    title: "Networking & Structured Cabling",
    badge: "Enterprise LAN/WAN, Fiber & Wi-Fi",
    accentColor: "teal",
    iconName: "Network",
    shortDescription:
      "Structured Cat6 and fiber-optic cabling, rack dressing, routers, managed switches, firewalls, enterprise Wi-Fi, and network troubleshooting.",
    overview:
      "A fast, drop-free network begins with clean structured cabling and properly segmented switching. SoftLab Global designs and deploys office and campus LAN/WAN networks, Cat5e/Cat6 and optical fiber backbones, patch panels, managed PoE switches, UTM firewalls, and seamless roaming Wi-Fi access points.",
    cardBullets: [
      "LAN/WAN and office networking",
      "Cat5e/Cat6 cabling and fiber optics",
      "Routers, switches, firewalls and Wi-Fi",
      "Patch panels, racks and accessories",
      "Network configuration and troubleshooting",
    ],
    inclusions: [
      "Site network survey, floor-plan node mapping, and bandwidth planning",
      "Structured Cat5e / Cat6 UTP & STP cabling with PVC conduits, casing-capping, and trunking",
      "Optical Fiber cabling, LIU termination, splicing, and media converters for inter-building links",
      "Information outlets (I/O boxes), faceplates, keystone jacks, and factory-tested patch cords",
      "24-port / 48-port Patch Panels, network racks, cable managers, and numbered port labeling",
      "Managed/Unmanaged Gigabit & PoE Switches, Dual-WAN Routers, and Hardware Firewalls",
      "Enterprise ceiling/wall Wi-Fi Access Points with VLAN guest/staff isolation",
      "Fluke/LAN continuity testing, IP schema configuration, and dead-zone elimination",
    ],
    benefits: [
      "Gigabit wired stability and seamless Wi-Fi roaming across all floors and cabins",
      "Clean, labeled patch panels and racks make future troubleshooting effortless",
      "VLAN segmentation separates guest Wi-Fi, CCTV traffic, and sensitive corporate systems",
      "Dual-ISP load balancing and failover keep your office online if one internet line drops",
      "Scalable architecture ready for additional workstations, VoIP phones, and IoT devices",
    ],
    idealFor: [
      "Multi-Floor Corporate Offices & Co-Working Spaces",
      "Schools, Colleges, Training Institutes & Hostels",
      "Hospitals, Hotels, Banks & Government Departments",
      "Warehouses & Commercial Complexes",
    ],
    deliverables: [
      "Fully terminated, tested, and labeled LAN/Fiber points",
      "Dressed network racks with patch panels, switches, and routers",
      "Configured Wi-Fi SSIDs, firewall rules, and IP allocation table",
      "Port-mapping sheet & network test report",
    ],
    faqs: [
      {
        question: "What is included in a single 'Network Point'?",
        answer:
          "A standard network point includes the Cat6 cable run from the network rack to the workstation, PVC conduit/trunking protection, termination at the rack patch panel, wall faceplate with RJ45 keystone jack, and a patch cord.",
      },
      {
        question: "Can you clean up and re-dress our messy existing server/network rack?",
        answer:
          "Yes. We offer rack rehabilitation, re-termination, patch panel labeling, cable management, and switch upgrades during scheduled maintenance windows.",
      },
      {
        question: "How do you handle multi-floor or multi-building connectivity?",
        answer:
          "We interconnect floors using dedicated Cat6 uplink trunks or fiber-optic backbones with gigabit SFP switches and centralized routing.",
      },
    ],
  },
  {
    id: "ims-computer-lab",
    slug: "computer-lab-setup",
    code: "COMPUTER_LAB_SETUP",
    number: "04",
    title: "Computer Lab & Institutional Setup",
    badge: "Turnkey Educational & Testing Labs",
    accentColor: "amber",
    iconName: "Monitor",
    shortDescription:
      "Complete turnkey computer lab setup for schools, colleges, universities, and training centers including desktops, networking, servers, UPS coordination, and software deployment.",
    overview:
      "SoftLab Global specializes in building modern, high-density computer laboratories and digital examination centers for schools, colleges, universities, and corporate training institutes. We coordinate the entire lifecycle—from desktop hardware supply and LAN cabling to central server deployment, OS/software imaging, UPS backup integration, and post-commissioning AMC.",
    cardBullets: [
      "School, college and university computer labs",
      "Computers, peripherals and networking",
      "Server and software deployment",
      "UPS and power-backup coordination",
      "Testing, commissioning and maintenance",
    ],
    inclusions: [
      "Lab layout planning, seating ergonomics, and node capacity design (20 to 500+ seats)",
      "Supply and installation of branded Desktops, All-in-Ones, Monitors, Keyboards, Mice, and Headsets",
      "Structured LAN networking with gigabit switches, racks, and high-speed internet distribution",
      "Centralized Lab Server setup for student logins, shared storage, and examination software",
      "Online UPS and power-distribution coordination for uninterrupted lab sessions",
      "Bulk OS installation, educational software, compilers, IDEs, antivirus, and content filtering",
      "Complete burn-in testing, asset tagging, and lab administrator handover",
    ],
    benefits: [
      "Single-window turnkey execution—no need to coordinate separate hardware, networking, and software vendors",
      "Uniform software imaging ensures every student workstation has identical tools and security policies",
      "Centralized server control prevents unauthorized software installation or USB data theft",
      "Built to AICTE, UGC, CBSE/ICSE, and online examination center technical standards",
      "Backed by SoftLab Global's institutional technical support and annual maintenance",
    ],
    idealFor: [
      "K-12 Schools (CBSE, ICSE, State Boards)",
      "Engineering, Management & Degree Colleges",
      "Universities & Digital Examination Centers",
      "Skill Development Centers & Corporate Training Labs",
    ],
    deliverables: [
      "Fully operational computer workstations with peripherals",
      "Structured lab LAN & central server rack",
      "Configured OS, learning/coding software & security policies",
      "Asset register, network diagram & commissioning certificate",
    ],
    faqs: [
      {
        question: "Can you set up a 30-seat or 60-seat computer lab from scratch?",
        answer:
          "Yes. Whether you are setting up a 20-seat school lab or a 250+ system university computing center, we handle hardware, LAN cabling, switching, server setup, and software configuration end-to-end.",
      },
      {
        question: "Can you upgrade an existing old computer lab?",
        answer:
          "Yes. We can audit your existing systems, upgrade RAM/SSDs where viable, replace obsolete desktops, re-wire faulty network points, and modernize the lab within your budget.",
      },
      {
        question: "Do you assist with Online UPS and electrical point planning?",
        answer:
          "Yes, we calculate the exact KVA load for your desktops and servers and coordinate Online UPS sizing and backup distribution.",
      },
    ],
  },
  {
    id: "ims-amc",
    slug: "amc-managed-it",
    code: "AMC_MANAGED_IT",
    number: "05",
    title: "AMC & Managed IT Support",
    badge: "Annual Maintenance & SLA Support",
    accentColor: "violet",
    iconName: "Wrench",
    shortDescription:
      "Comprehensive and non-comprehensive Annual Maintenance Contracts (AMC), preventive maintenance visits, remote & on-site IT support, and renewal management.",
    overview:
      "Keep your entire IT ecosystem—desktops, laptops, servers, LAN/Wi-Fi networks, CCTV cameras, and biometric devices—running at peak reliability without hiring a full-time in-house IT department. SoftLab Global provides structured Annual Maintenance Contracts (AMC) with scheduled preventive maintenance, rapid remote troubleshooting, and priority on-site engineer dispatch.",
    cardBullets: [
      "Annual Maintenance Contracts",
      "Preventive maintenance",
      "Remote and on-site support",
      "Hardware, network, server and CCTV maintenance",
      "Service scheduling and renewal reminders",
    ],
    inclusions: [
      "Initial IT asset audit, health check, and inventory tagging",
      "Scheduled monthly/quarterly Preventive Maintenance (PM) visits (dust cleaning, thermal check, OS patching, disk health)",
      "Unlimited remote helpdesk support during business hours for software, printer, and network issues",
      "Priority on-site engineer visits for hardware, LAN, server, or CCTV breakdowns",
      "CCTV camera cleaning,DVR/NVR recording health check, and backup verification",
      "Antivirus management, firewall monitoring, and data backup verification",
      "Dedicated service logs, ticket tracking, and automated contract renewal reminders",
    ],
    benefits: [
      "Predictable annual IT maintenance cost with zero surprise breakdown fees",
      "Drastically reduced employee downtime through regular preventive servicing",
      "Single point of accountability for computers, networking, servers, and CCTV",
      "Extended hardware lifespan and early detection of failing hard drives or power supplies",
      "Detailed service reports after every scheduled maintenance visit",
    ],
    idealFor: [
      "Corporate Offices, CA Firms, Law Practices & Consultancies",
      "Schools, Colleges & Educational Institutions",
      "Hospitals, Nursing Homes & Diagnostic Centers",
      "Retail Chains, Hotels & Manufacturing Offices",
    ],
    deliverables: [
      "Complete IT Asset Register & Baseline Health Report",
      "Signed SLA & Annual Maintenance Schedule",
      "Preventive Maintenance Visit Checklists & Ticket Logs",
      "Quarterly IT Infrastructure Health Summary",
    ],
    faqs: [
      {
        question: "What is the difference between Non-Comprehensive and Comprehensive AMC?",
        answer:
          "Non-Comprehensive AMC covers all preventive maintenance visits, remote support, and on-site engineer labour charges, while replacement hardware parts are billed at actuals upon approval. Comprehensive AMC includes both service labour and covered spare part replacements.",
      },
      {
        question: "Can we combine Computers, Networking, and CCTV under a single AMC?",
        answer:
          "Yes! Most of our institutional and corporate clients prefer a unified AMC covering their desktops, servers, LAN/Wi-Fi, and CCTV surveillance under one contract.",
      },
      {
        question: "How fast is your response time for critical issues?",
        answer:
          "Remote support typically begins within 30–120 minutes, and on-site engineer visits are scheduled within the agreed SLA window (same-day or next-business-day depending on criticality and location).",
      },
    ],
  },
  {
    id: "ims-hardware",
    slug: "hardware-supply",
    code: "HARDWARE_SUPPLY",
    number: "06",
    title: "Hardware & IT Equipment Supply",
    badge: "Authorized Enterprise IT Procurement",
    accentColor: "sky",
    iconName: "HardDrive",
    shortDescription:
      "Supply and deployment of desktops, laptops, servers, storage, switches, routers, CCTV systems, racks, cables, connectors, and IT peripherals.",
    overview:
      "Procure genuine, warranty-backed IT hardware configured for institutional and commercial workloads. SoftLab Global supplies desktops, business laptops, workstations, servers, NAS storage, managed switches, routers, CCTV equipment, server racks, structured cables, and accessories—complete with unpacking, installation, and deployment.",
    cardBullets: [
      "Desktops, laptops and peripherals",
      "Servers, storage and networking equipment",
      "CCTV and surveillance equipment",
      "Racks, cables, connectors and accessories",
      "Installation and deployment",
    ],
    inclusions: [
      "Hardware specification consulting to match performance and budget requirements",
      "Commercial Desktops, All-in-Ones, Business Laptops, Monitors, Printers, Scanners, and UPS units",
      "Tower & Rack Servers, NAS Storage, Surveillance HDDs, and Enterprise SSDs/RAM upgrades",
      "Gigabit & PoE Switches, Routers, Firewalls, Wi-Fi Access Points, and Media Converters",
      "IP/HD CCTV Cameras, NVRs, DVRs, PoE Injectors, and Power Supplies",
      "Server/Network Racks, Patch Panels, Cat6/Coaxial Roll Boxes, Keystones, Faceplates, and Patch Cords",
      "On-site delivery, physical installation, OS/driver readiness, and GST tax invoicing",
    ],
    benefits: [
      "100% genuine products sourced through verified distribution channels with manufacturer warranty",
      "Right-sized hardware recommendations—avoid overpaying or buying underpowered consumer models",
      "Pre-tested and deployed on-site by our technical engineers rather than just box-drop delivery",
      "Official GST invoicing for full business input tax credit (ITC)",
      "Seamless integration with your existing office network and servers",
    ],
    idealFor: [
      "Growing Businesses Expanding Team Workstations",
      "Schools, Colleges & Training Centers Upgrading Labs",
      "New Branch Offices & Retail Outlets",
      "IT Departments Procuring Spares, Upgrades & Peripherals",
    ],
    deliverables: [
      "Verified hardware units with serial-number inventory list",
      "On-site unpacking, assembly, and initial configuration",
      "Manufacturer warranty cards & official GST Tax Invoice",
    ],
    faqs: [
      {
        question: "Do you provide installation along with hardware supply?",
        answer:
          "Yes. Unlike online marketplaces that only drop boxes, our engineers unpack, assemble, connect, and test the equipment at your premises.",
      },
      {
        question: "How is hardware pricing handled in quotations?",
        answer:
          "Because IT hardware and cable market prices fluctuate by brand, model, and stock availability, our system generates a transparent itemized BOQ and confirms current verified distributor pricing before issuing your final commercial quote.",
      },
    ],
  },
  {
    id: "ims-biometric",
    slug: "access-control",
    code: "BIOMETRIC_ACCESS",
    number: "07",
    title: "Biometric & Access Control",
    badge: "Attendance, Door Security & Video Entry",
    accentColor: "rose",
    iconName: "Fingerprint",
    shortDescription:
      "Biometric face and fingerprint attendance systems, electromagnetic door access control, video door phones, installation, and technical support.",
    overview:
      "Automate employee/student attendance and secure restricted rooms with enterprise biometric and access control solutions. SoftLab Global installs fingerprint, facial recognition, and RFID card terminals, electromagnetic (EM) door locks, exit push buttons, and video door phones integrated with attendance software.",
    cardBullets: [
      "Biometric attendance systems",
      "Door access control",
      "Video door phones",
      "Authorized configuration and installation",
      "Maintenance and technical support",
    ],
    inclusions: [
      "Supply and wall-mounting of Face Recognition, Fingerprint, and RFID Attendance Terminals",
      "Electromagnetic (EM) Locks, Drop Bolts, U-Brackets/Z-Brackets, and Door Closers for glass/wooden/metal doors",
      "Touchless IR Exit Sensors, Emergency Break-Glass Units, and Wireless Remote Releases",
      "Video Door Phones (VDP) with indoor monitor displays and electric lock release",
      "Power supply units with battery backup for uninterrupted lock operation",
      "LAN/Wi-Fi connectivity and attendance management software / cloud sync configuration",
      "User enrollment training, shift/report setup, and ongoing maintenance support",
    ],
    benefits: [
      "Eliminate proxy attendance with accurate face and fingerprint verification",
      "Restrict unauthorized entry into server rooms, accounts departments, labs, and cabins",
      "Generate automated monthly attendance, late-coming, and overtime reports for payroll",
      "Screen visitors safely via Video Door Phone before unlocking the main entrance",
      "Battery-backed power supplies ensure security doors function safely during power cuts",
    ],
    idealFor: [
      "Corporate Offices, IT Companies & Co-Working Spaces",
      "Schools, Colleges, Coaching Institutes & Hostels",
      "Server Rooms, Banks, Jewellery Stores & Clinics",
      "Factories, Warehouses & Commercial Buildings",
    ],
    deliverables: [
      "Installed & calibrated biometric / door access hardware",
      "Configured attendance software & admin credentials",
      "Staff enrollment guide & emergency release mechanism test",
    ],
    faqs: [
      {
        question: "Can the biometric machine connect to our existing HR or payroll system?",
        answer:
          "Yes. Devices can sync over LAN/Wi-Fi to desktop/cloud attendance software and export standard Excel/CSV logs or push real-time attendance via API/ADMS.",
      },
      {
        question: "Will the electromagnetic door lock work on frameless glass doors?",
        answer:
          "Yes, we use specialized U-brackets and drop-bolt assemblies designed specifically for toughened frameless glass doors as well as wooden and metal doors.",
      },
    ],
  },
  {
    id: "ims-turnkey",
    slug: "it-infrastructure",
    code: "TURNKEY_IT_PROJECTS",
    number: "08",
    title: "Customized IT Infrastructure Projects",
    badge: "Turnkey Office & Campus IT Rollouts",
    accentColor: "indigo",
    iconName: "Building2",
    shortDescription:
      "End-to-end turnkey office IT setup, multi-floor and multi-site networking, institutional infrastructure, hardware relocation, and custom solutions.",
    overview:
      "Opening a new office, expanding to a new floor, or modernizing an entire institutional campus? SoftLab Global acts as your single turnkey IT infrastructure partner—planning and executing structured cabling, server rooms, Wi-Fi coverage, CCTV surveillance, biometric access, workstation deployment, and IT relocation under unified project management.",
    cardBullets: [
      "Complete office IT setup",
      "Multi-floor and multi-site networking",
      "Corporate and institutional infrastructure",
      "Hardware installation and relocation",
      "Customized turnkey IT solutions",
    ],
    inclusions: [
      "End-to-end site survey, architectural blueprint review, and Bill of Quantities (BOQ) engineering",
      "Complete server room design (racks, patch panels, switches, firewalls, servers, cooling & UPS coordination)",
      "Multi-floor structured Cat6 & fiber cabling, workstation LAN points, and enterprise Wi-Fi mesh",
      "Perimeter and indoor CCTV surveillance + door access control integration",
      "Workstation, desktop, conference room display, and printer deployment",
      "Safe de-installation, packing, relocation, and re-commissioning of existing office IT infrastructure",
      "Dedicated project manager, phased milestone execution, and post-handover AMC",
    ],
    benefits: [
      "One contract, one project timeline, and one accountable engineering team for your entire IT rollout",
      "Coordinated execution alongside your civil/interior contractors so conduits and cables are concealed cleanly",
      "Zero business disruption during office IT relocations with weekend/after-hours cutover execution",
      "Standardized documentation, port labeling, and future-ready scalability",
    ],
    idealFor: [
      "New Corporate Offices & Branch Expansions",
      "Schools, Colleges & University Campus Blocks",
      "Hospitals, Commercial Towers & Government Projects",
      "Companies Relocating Offices or Upgrading Legacy IT",
    ],
    deliverables: [
      "Comprehensive Site Survey & Itemized BOQ Proposal",
      "Turnkey Installed Networking, Server, CCTV, Access & Compute Infrastructure",
      "Complete As-Built Network & Conduit Documentation",
      "Project Handover Sign-off & Support SLA",
    ],
    faqs: [
      {
        question: "When should we involve SoftLab Global during a new office interior fit-out?",
        answer:
          "Ideally before false ceiling, flooring, and wall-paneling work is finalized. Early coordination allows us to lay conduits and Cat6/CCTV cables cleanly alongside your interior contractor.",
      },
      {
        question: "Do you conduct an on-site survey before issuing a final commercial quotation?",
        answer:
          "Yes. Our online system generates an immediate itemized provisional estimate, and our engineering team conducts a physical site survey to verify exact cable runs, floor layouts, and mounting requirements before locking the final commercial BOQ.",
      },
    ],
  },
];

// ============================================================================
// CONFIGURABLE ESTIMATION RULES ENGINE
// ============================================================================

export interface ImsEstimationRules {
  avgCableMetersPerCamera: number;
  avgCableMetersPerNetworkPoint: number;
  avgCableMetersPerBiometric: number;
  floorCableMultiplierPercent: number; // e.g., +10% per additional floor
  conduitMetersPerCableMeter: number; // e.g., 0.75m conduit per 1m cable
  bncConnectorsPerHdCamera: number;
  dcConnectorsPerHdCamera: number;
  rj45JacksPerIpCamera: number;
  rj45JacksPerNetworkPoint: number;
  switchPortBufferPercent: number; // e.g., 20% extra ports
  defaultGstPercent: number; // 18%
}

export const DEFAULT_IMS_ESTIMATION_RULES: ImsEstimationRules = {
  avgCableMetersPerCamera: 25,
  avgCableMetersPerNetworkPoint: 20,
  avgCableMetersPerBiometric: 15,
  floorCableMultiplierPercent: 10,
  conduitMetersPerCableMeter: 0.75,
  bncConnectorsPerHdCamera: 2,
  dcConnectorsPerHdCamera: 1,
  rj45JacksPerIpCamera: 2,
  rj45JacksPerNetworkPoint: 2,
  switchPortBufferPercent: 20,
  defaultGstPercent: 18,
};

// ============================================================================
// CONFIGURABLE PRODUCT, MATERIAL & LABOUR CATALOGUE
// ============================================================================

export type ImsCatalogueCategory =
  | "CAMERAS_SURVEILLANCE"
  | "SERVERS_COMPUTERS"
  | "NETWORKING_DEVICES"
  | "BIOMETRIC_ACCESS"
  | "CABLES_WIRES"
  | "CONNECTORS_CONDUITS_ACCESSORIES"
  | "RACKS_PATCH_STORAGE"
  | "INSTALLATION_LABOUR"
  | "CONFIG_COMMISSIONING"
  | "SURVEY_LOGISTICS"
  | "AMC_SUPPORT";

export interface ImsCatalogueItem {
  id: string;
  code: string;
  name: string;
  category: ImsCatalogueCategory;
  unit: "Nos" | "Meters" | "Roll (305m)" | "Points" | "Lot" | "Visit" | "Year";
  hsnSacCode: string;
  supplierCost: number | null; // Confidential purchase cost in INR (null if pending)
  sellingPrice: number | null; // Configurable standard unit selling price in INR (null if pending management input)
  gstPercent: number;
  priceStatus: "VERIFIED_CONFIGURED" | "PENDING_MANAGEMENT_INPUT";
  requiresSiteVerificationDefault: boolean;
  notes?: string;
}

/**
 * NOTE ON PRICING INTEGRITY:
 * Unit prices are configurable in the IMS Admin Catalogue.
 * Items whose exact specification/brand depends on client selection or current distributor stock
 * can be marked PENDING_MANAGEMENT_INPUT or verified by authorized admins before final quotation approval.
 */
export const DEFAULT_IMS_CATALOGUE_ITEMS: ImsCatalogueItem[] = [
  // 1. CAMERAS & SURVEILLANCE
  {
    id: "cat-cam-ip-2mp",
    code: "IMS-CAM-IP2MP",
    name: "2MP Full HD IP Network Camera (Dome/Bullet, PoE, IR Night Vision)",
    category: "CAMERAS_SURVEILLANCE",
    unit: "Nos",
    hsnSacCode: "8525",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
    notes: "Brand/Model (Hikvision/CP Plus/Dahua/Honeywell) & unit rate confirmed as per approved BOQ.",
  },
  {
    id: "cat-cam-hd-2mp",
    code: "IMS-CAM-HD2MP",
    name: "2MP HD Analog Camera (Dome/Bullet, IR Night Vision)",
    category: "CAMERAS_SURVEILLANCE",
    unit: "Nos",
    hsnSacCode: "8525",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
    notes: "HD camera unit rate subject to brand & model confirmation.",
  },
  {
    id: "cat-nvr-8ch",
    code: "IMS-NVR-08",
    name: "8/16/32 Channel Network Video Recorder (NVR / DVR Unit)",
    category: "RACKS_PATCH_STORAGE",
    unit: "Nos",
    hsnSacCode: "8521",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
    notes: "Channel capacity sized according to total camera count.",
  },
  {
    id: "cat-hdd-surv",
    code: "IMS-HDD-SURV",
    name: "Surveillance Grade Hard Disk Drive (2TB / 4TB / 6TB WD Purple / SkyHawk)",
    category: "RACKS_PATCH_STORAGE",
    unit: "Nos",
    hsnSacCode: "8471",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
    notes: "Capacity selected based on required recording retention days.",
  },

  // 2. SERVERS & COMPUTERS
  {
    id: "cat-srv-unit",
    code: "IMS-SRV-ENT",
    name: "Enterprise Tower / Rack Server (Xeon / EPYC, ECC RAM, RAID Storage)",
    category: "SERVERS_COMPUTERS",
    unit: "Nos",
    hsnSacCode: "8471",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
    notes: "Custom configured per processor, RAM, and RAID disk specification.",
  },
  {
    id: "cat-pc-desktop",
    code: "IMS-PC-DESK",
    name: "Commercial Desktop Computer System with Monitor, Keyboard & Mouse",
    category: "SERVERS_COMPUTERS",
    unit: "Nos",
    hsnSacCode: "8471",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
    notes: "Configuration (i3/i5/i7, RAM, NVMe SSD, Monitor size) priced per approved spec.",
  },
  {
    id: "cat-ups-backup",
    code: "IMS-UPS-SYS",
    name: "Online / Line-Interactive UPS Power Backup System",
    category: "SERVERS_COMPUTERS",
    unit: "Nos",
    hsnSacCode: "8504",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
    notes: "KVA rating & battery bank sized after load verification.",
  },

  // 3. NETWORKING DEVICES
  {
    id: "cat-sw-poe",
    code: "IMS-SW-POE",
    name: "Gigabit PoE / Managed Network Switch (8 / 16 / 24 / 48 Port)",
    category: "NETWORKING_DEVICES",
    unit: "Nos",
    hsnSacCode: "8517",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
    notes: "Port density and PoE budget matched to camera/node count.",
  },
  {
    id: "cat-router-fw",
    code: "IMS-RTR-FW",
    name: "Enterprise Router / UTM Firewall & Gateway",
    category: "NETWORKING_DEVICES",
    unit: "Nos",
    hsnSacCode: "8517",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
  },
  {
    id: "cat-wifi-ap",
    code: "IMS-WIFI-AP",
    name: "Dual-Band Ceiling / Wall Enterprise Wi-Fi Access Point",
    category: "NETWORKING_DEVICES",
    unit: "Nos",
    hsnSacCode: "8517",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
  },

  // 4. BIOMETRIC & ACCESS CONTROL
  {
    id: "cat-bio-term",
    code: "IMS-BIO-ATT",
    name: "Biometric Face & Fingerprint Attendance / Access Terminal",
    category: "BIOMETRIC_ACCESS",
    unit: "Nos",
    hsnSacCode: "8471",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
  },
  {
    id: "cat-em-lock",
    code: "IMS-ACC-EMLOCK",
    name: "Electromagnetic (EM) Door Lock Kit with Brackets, Exit Switch & Power Supply",
    category: "BIOMETRIC_ACCESS",
    unit: "Nos",
    hsnSacCode: "8301",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
    notes: "Bracket type (Glass U-bracket vs Wooden/Metal Z-bracket) verified on site.",
  },

  // 5. CABLES & WIRES
  {
    id: "cat-cbl-cat6",
    code: "IMS-CBL-CAT6",
    name: "Cat6 UTP Pure Copper Structured Network Cable",
    category: "CABLES_WIRES",
    unit: "Meters",
    hsnSacCode: "8544",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
    notes: "Estimated length; final billing on actual measured meter run.",
  },
  {
    id: "cat-cbl-coax",
    code: "IMS-CBL-3P1",
    name: "3+1 Coaxial CCTV Copper Cable",
    category: "CABLES_WIRES",
    unit: "Meters",
    hsnSacCode: "8544",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
    notes: "Estimated length; final billing on actual measured meter run.",
  },

  // 6. CONNECTORS, CONDUITS & MOUNTING ACCESSORIES
  {
    id: "cat-acc-rj45",
    code: "IMS-ACC-RJ45",
    name: "RJ45 Connectors, Keystone Jacks, I/O Faceplates & Back Boxes",
    category: "CONNECTORS_CONDUITS_ACCESSORIES",
    unit: "Nos",
    hsnSacCode: "8536",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
  },
  {
    id: "cat-acc-bnc",
    code: "IMS-ACC-BNCDC",
    name: "BNC & DC Connectors + Weatherproof Camera PVC Junction Boxes",
    category: "CONNECTORS_CONDUITS_ACCESSORIES",
    unit: "Nos",
    hsnSacCode: "8536",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
  },
  {
    id: "cat-acc-conduit",
    code: "IMS-ACC-CONDUIT",
    name: "ISI PVC Conduits, Casing-Capping, Trunking, Saddles & Mounting Accessories",
    category: "CONNECTORS_CONDUITS_ACCESSORIES",
    unit: "Meters",
    hsnSacCode: "3917",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
    notes: "Quantity depends on surface vs concealed routing confirmed during site survey.",
  },

  // 7. RACKS & PATCH PANELS
  {
    id: "cat-rack-unit",
    code: "IMS-RCK-CAB",
    name: "Wall-Mount / Floor-Standing Network & Server Rack with PDU, Fan & Cable Manager",
    category: "RACKS_PATCH_STORAGE",
    unit: "Nos",
    hsnSacCode: "8537",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
    notes: "Rack U-size (4U/6U/9U/15U/24U/42U) selected per equipment count.",
  },
  {
    id: "cat-patch-panel",
    code: "IMS-PP-24P",
    name: "24-Port Loaded Cat6 Patch Panel with Patch Cords",
    category: "RACKS_PATCH_STORAGE",
    unit: "Nos",
    hsnSacCode: "8517",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
  },

  // 8. INSTALLATION LABOUR, CONFIGURATION & LOGISTICS
  {
    id: "cat-lab-cam",
    code: "IMS-LAB-CAM",
    name: "Camera Mounting, Termination, Alignment & Testing Charges",
    category: "INSTALLATION_LABOUR",
    unit: "Points",
    hsnSacCode: "9987",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
  },
  {
    id: "cat-lab-net",
    code: "IMS-LAB-NET",
    name: "Network Point Laying, I/O Termination, Patch Panel Punching & Labeling",
    category: "INSTALLATION_LABOUR",
    unit: "Points",
    hsnSacCode: "9987",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
  },
  {
    id: "cat-lab-cbl",
    code: "IMS-LAB-CBL",
    name: "Cable Pulling, PVC Conduit / Trunking Laying & Civil Drilling Labour",
    category: "INSTALLATION_LABOUR",
    unit: "Meters",
    hsnSacCode: "9954",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
  },
  {
    id: "cat-cfg-srv",
    code: "IMS-CFG-SYS",
    name: "Server / Network / NVR / Workstation OS & System Configuration & Commissioning",
    category: "CONFIG_COMMISSIONING",
    unit: "Lot",
    hsnSacCode: "9983",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: false,
  },
  {
    id: "cat-srv-survey",
    code: "IMS-LOG-SURV",
    name: "Technical Site Survey, Material Transportation & Logistics",
    category: "SURVEY_LOGISTICS",
    unit: "Lot",
    hsnSacCode: "9983",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
  },
  {
    id: "cat-amc-contract",
    code: "IMS-AMC-YR",
    name: "Annual Maintenance Contract (AMC) & Scheduled Preventive Maintenance Support",
    category: "AMC_SUPPORT",
    unit: "Year",
    hsnSacCode: "9987",
    supplierCost: null,
    sellingPrice: null,
    gstPercent: 18,
    priceStatus: "PENDING_MANAGEMENT_INPUT",
    requiresSiteVerificationDefault: true,
  },
];

// ============================================================================
// BOQ & QUOTATION DATA STRUCTURES
// ============================================================================

export interface ImsBoqLineItem {
  id: string;
  catalogueCode: string;
  description: string;
  category: ImsCatalogueCategory;
  quantity: number;
  unit: string;
  hsnSacCode: string;
  supplierUnitCost: number | null;
  unitPrice: number | null; // null if pending management verification
  gstPercent: number;
  requiresSiteVerification: boolean;
  pricePending: boolean;
  remarks?: string;
}

export interface ImsRequirementInput {
  selectedServices: string[];
  engagementType: "NEW_INSTALLATION" | "EXPANSION" | "REPAIR" | "REPLACEMENT" | "AMC";
  fullName: string;
  companyName?: string;
  email: string;
  phone: string;
  city: string;
  siteAddress: string;
  siteType: string;
  buildingFloors: number;
  approxCableLengthMeters?: number;
  // Service-specific quantities
  ipCameraCount?: number;
  hdCameraCount?: number;
  recordingRetentionDays?: number;
  serverCount?: number;
  serverType?: string;
  computerCount?: number;
  upsRequired?: boolean;
  networkPointsCount?: number;
  wifiAccessPointsCount?: number;
  biometricCount?: number;
  doorAccessCount?: number;
  videoDoorPhoneCount?: number;
  preferredBrands?: string;
  technicalRequirements?: string;
  timeline?: string;
  budgetRange?: string;
  additionalNotes?: string;
  attachments?: { fileName: string; fileSize: number; dataUrl: string }[];
}

/**
 * Generates an itemized Bill of Quantities (BOQ) from customer requirements
 * using documented estimation rules and configurable catalogue items.
 * Never invents prices—marks unconfigured prices as pending management verification.
 */
export function generateProvisionalBoqFromRequirements(
  req: ImsRequirementInput,
  catalogue: ImsCatalogueItem[] = DEFAULT_IMS_CATALOGUE_ITEMS,
  rules: ImsEstimationRules = DEFAULT_IMS_ESTIMATION_RULES
): {
  items: ImsBoqLineItem[];
  hasPendingPrices: boolean;
  hasSiteVerificationItems: boolean;
  subtotal: number;
  gstAmount: number;
  grandTotal: number;
} {
  const items: ImsBoqLineItem[] = [];
  const findCat = (code: string) => catalogue.find((c) => c.code === code);

  const ipCams = Math.max(0, req.ipCameraCount || 0);
  const hdCams = Math.max(0, req.hdCameraCount || 0);
  const totalCams = ipCams + hdCams;
  const servers = Math.max(0, req.serverCount || 0);
  const computers = Math.max(0, req.computerCount || 0);
  const netPoints = Math.max(0, req.networkPointsCount || 0) + computers;
  const wifiAps = Math.max(0, req.wifiAccessPointsCount || 0);
  const biometrics = Math.max(0, req.biometricCount || 0);
  const doorAccess = Math.max(0, req.doorAccessCount || 0);
  const floors = Math.max(1, req.buildingFloors || 1);

  const addLine = (catCode: string, qty: number, customDesc?: string, forceSiteVerify?: boolean, remarks?: string) => {
    if (qty <= 0) return;
    const cat = findCat(catCode);
    const unitPrice = cat?.sellingPrice ?? null;
    const pricePending = unitPrice === null || cat?.priceStatus === "PENDING_MANAGEMENT_INPUT";
    items.push({
      id: `boq-${catCode}-${items.length + 1}`,
      catalogueCode: catCode,
      description: customDesc || cat?.name || catCode,
      category: cat?.category || "SERVERS_COMPUTERS",
      quantity: Math.ceil(qty),
      unit: cat?.unit || "Nos",
      hsnSacCode: cat?.hsnSacCode || "8471",
      supplierUnitCost: cat?.supplierCost ?? null,
      unitPrice,
      gstPercent: cat?.gstPercent ?? rules.defaultGstPercent,
      requiresSiteVerification: forceSiteVerify ?? cat?.requiresSiteVerificationDefault ?? false,
      pricePending,
      remarks: remarks || cat?.notes,
    });
  };

  // 1. CCTV Cameras & Recorder
  if (ipCams > 0) {
    addLine("IMS-CAM-IP2MP", ipCams, undefined, false, `IP Cameras (${ipCams} units)`);
  }
  if (hdCams > 0) {
    addLine("IMS-CAM-HD2MP", hdCams, undefined, false, `HD Cameras (${hdCams} units)`);
  }
  if (totalCams > 0) {
    const nvrQty = Math.ceil(totalCams / 16);
    const channelSize = totalCams <= 4 ? "4-Channel" : totalCams <= 8 ? "8-Channel" : totalCams <= 16 ? "16-Channel" : "32-Channel";
    addLine("IMS-NVR-08", nvrQty, `${channelSize} Network / Digital Video Recorder (NVR/DVR)`, false);
    const hddQty = Math.max(1, Math.ceil((totalCams * (req.recordingRetentionDays || 30)) / 240));
    addLine("IMS-HDD-SURV", hddQty, undefined, false, `Sized for ~${req.recordingRetentionDays || 30} days retention`);
  }

  // 2. Servers, Desktops & UPS
  if (servers > 0) {
    addLine("IMS-SRV-ENT", servers, `Enterprise Server (${req.serverType || "Tower/Rack Configuration"})`, false);
  }
  if (computers > 0) {
    addLine("IMS-PC-DESK", computers, undefined, false);
  }
  if (req.upsRequired || servers > 0 || computers >= 5) {
    addLine("IMS-UPS-SYS", 1, undefined, true, "UPS KVA capacity subject to electrical load check on site");
  }

  // 3. Networking Switches, Patch Panels, Routers, Wi-Fi APs
  const totalEthernetDevices = ipCams + netPoints + wifiAps + biometrics + servers;
  if (totalEthernetDevices > 0) {
    const requiredPorts = Math.ceil(totalEthernetDevices * (1 + rules.switchPortBufferPercent / 100));
    const switchCount = Math.max(1, Math.ceil(requiredPorts / 24));
    addLine("IMS-SW-POE", switchCount, undefined, false, `Supports ${totalEthernetDevices} active ethernet/PoE endpoints + ${rules.switchPortBufferPercent}% buffer`);

    if (netPoints >= 8 || servers > 0) {
      const patchPanelCount = Math.max(1, Math.ceil(netPoints / 24));
      addLine("IMS-PP-24P", patchPanelCount, undefined, false);
    }
  }
  if (req.selectedServices.includes("networking") || req.selectedServices.includes("it-infrastructure") || servers > 0) {
    addLine("IMS-RTR-FW", 1, undefined, false);
  }
  if (wifiAps > 0) {
    addLine("IMS-WIFI-AP", wifiAps, undefined, true, "Final AP placement verified via wireless signal survey");
  }

  // 4. Biometric & Access Control
  if (biometrics > 0) {
    addLine("IMS-BIO-ATT", biometrics, undefined, false);
  }
  if (doorAccess > 0) {
    addLine("IMS-ACC-EMLOCK", doorAccess, undefined, true, "Door frame type (glass/wood/metal) verified on site");
  }

  // 5. Cables, Connectors, Conduits & Racks
  const floorFactor = 1 + ((floors - 1) * rules.floorCableMultiplierPercent) / 100;
  const calculatedCat6Meters = Math.round(
    (ipCams * rules.avgCableMetersPerCamera +
      netPoints * rules.avgCableMetersPerNetworkPoint +
      wifiAps * rules.avgCableMetersPerNetworkPoint +
      biometrics * rules.avgCableMetersPerBiometric) *
      floorFactor
  );
  const calculatedCoaxMeters = Math.round(hdCams * rules.avgCableMetersPerCamera * floorFactor);

  const userCableMeters = req.approxCableLengthMeters && req.approxCableLengthMeters > 0 ? req.approxCableLengthMeters : 0;
  const finalCat6Meters =
    ipCams > 0 || netPoints > 0 || wifiAps > 0 || biometrics > 0
      ? Math.max(calculatedCat6Meters, hdCams === 0 ? userCableMeters : 0)
      : hdCams === 0 && userCableMeters > 0
      ? userCableMeters
      : 0;
  const finalCoaxMeters = hdCams > 0 ? Math.max(calculatedCoaxMeters, ipCams === 0 ? userCableMeters : 0) : 0;

  if (finalCat6Meters > 0) {
    addLine(
      "IMS-CBL-CAT6",
      finalCat6Meters,
      undefined,
      true,
      `Estimated across ${floors} floor(s). Final billing on actual measured cable run.`
    );
  }
  if (finalCoaxMeters > 0) {
    addLine(
      "IMS-CBL-3P1",
      finalCoaxMeters,
      undefined,
      true,
      `Estimated across ${floors} floor(s). Final billing on actual measured cable run.`
    );
  }

  const totalCableMeters = finalCat6Meters + finalCoaxMeters;
  if (totalCableMeters > 0) {
    const conduitMeters = Math.round(totalCableMeters * rules.conduitMetersPerCableMeter);
    addLine(
      "IMS-ACC-CONDUIT",
      conduitMeters,
      undefined,
      true,
      `Calculated at ${rules.conduitMetersPerCableMeter}x cable run; subject to site survey`
    );
  }

  if (ipCams > 0 || netPoints > 0 || wifiAps > 0) {
    const rj45Points = ipCams * rules.rj45JacksPerIpCamera + (netPoints + wifiAps) * rules.rj45JacksPerNetworkPoint;
    addLine("IMS-ACC-RJ45", rj45Points, undefined, true);
  }
  if (hdCams > 0) {
    const bncSets = hdCams * rules.bncConnectorsPerHdCamera;
    addLine("IMS-ACC-BNCDC", bncSets, undefined, true);
  }

  if (totalCams > 0 || totalEthernetDevices > 0 || servers > 0) {
    const rackCount = servers > 0 && totalCams > 8 ? 2 : 1;
    addLine("IMS-RCK-CAB", rackCount, undefined, false);
  }

  // 6. Installation Labour, Configuration & Site Survey
  if (totalCams > 0) {
    addLine("IMS-LAB-CAM", totalCams, undefined, false);
  }
  if (netPoints + wifiAps + biometrics + doorAccess > 0) {
    addLine("IMS-LAB-NET", netPoints + wifiAps + biometrics + doorAccess, undefined, true);
  }
  if (totalCableMeters > 0) {
    addLine("IMS-LAB-CBL", totalCableMeters, undefined, true);
  }

  if (req.engagementType === "AMC" || req.selectedServices.includes("amc-managed-it")) {
    addLine("IMS-AMC-YR", 1, undefined, true, "Annual Maintenance Contract scope verified after asset count audit");
  } else {
    addLine("IMS-CFG-SYS", 1, undefined, false);
  }

  addLine("IMS-LOG-SURV", 1, undefined, true, "Site survey & material transport to project location");

  // Ensure at least one line item if no quantities were entered
  if (items.length === 0) {
    addLine(
      "IMS-CFG-SYS",
      1,
      `Turnkey IMS Execution (${req.selectedServices.join(", ") || "General IT Infrastructure"})`,
      true,
      "Detailed BOQ quantities to be populated post technical site survey"
    );
  }

  const hasPendingPrices = items.some((i) => i.pricePending || i.unitPrice === null);
  const hasSiteVerificationItems = items.some((i) => i.requiresSiteVerification);

  let subtotal = 0;
  let gstAmount = 0;
  for (const item of items) {
    if (item.unitPrice !== null && item.unitPrice > 0) {
      const lineTotal = item.quantity * item.unitPrice;
      subtotal += lineTotal;
      gstAmount += Math.round((lineTotal * item.gstPercent) / 100);
    }
  }

  return {
    items,
    hasPendingPrices,
    hasSiteVerificationItems,
    subtotal,
    gstAmount,
    grandTotal: subtotal + gstAmount,
  };
}
