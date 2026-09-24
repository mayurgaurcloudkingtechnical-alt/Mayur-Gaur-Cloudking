/**
 * SOFTLAB GLOBAL — Interactive Topic Deep-Study Knowledge Engine
 * Provides structured educational study notes, architecture diagrams,
 * practical lab workflows, troubleshooting guides, and interview prep
 * for any curriculum topic.
 */

export interface TopicStudyMaterial {
  title: string;
  category: string;
  readingTimeMin: number;
  overview: string;
  concepts: {
    heading: string;
    points: string[];
  }[];
  architecture: {
    diagram?: string;
    explanation: string;
    specifications?: { key: string; value: string }[];
  };
  practicalLab: {
    title: string;
    prerequisites: string;
    commandsOrCode: {
      language: string;
      code: string;
      description: string;
    }[];
    expectedOutput?: string;
  };
  troubleshooting: {
    issue: string;
    cause: string;
    solution: string;
  }[];
  interviewPrep: {
    question: string;
    answer: string;
    tip?: string;
  }[];
}

// Curated authoritative study guides for high-frequency curriculum topics
const CURATED_TOPICS: Record<string, Partial<TopicStudyMaterial>> = {
  // --- HARDWARE & COMPUTER ARCHITECTURE ---
  "processor (intel & amd)": {
    category: "Computer Hardware & Architecture",
    readingTimeMin: 10,
    overview:
      "The Central Processing Unit (CPU) is the primary computational brain of any computing system. It executes program instructions by performing fundamental arithmetic, logic, controlling, and input/output (I/O) operations specified by instructions in software programs.",
    concepts: [
      {
        heading: "Core Architecture & Execution Pipeline",
        points: [
          "The CPU operates on the classic Fetch-Decode-Execute instruction cycle.",
          "Cores vs Threads: Physical cores are independent processing units, while hyper-threading (Intel) or SMT (AMD) allows a single core to handle two execution threads simultaneously.",
          "Cache Hierarchy: L1 (fastest, per-core, ~32KB-64KB), L2 (larger, ~512KB-1MB per core), L3 (shared across cores, 16MB-96MB+).",
          "Clock Speed: Measured in Gigahertz (GHz). Base clock is guaranteed steady performance; Boost/Turbo clock increases dynamically under thermal headroom.",
        ],
      },
      {
        heading: "Intel vs AMD Architecture Comparison",
        points: [
          "Socket Architecture: Intel predominantly uses Land Grid Array (LGA - pins on motherboard), while older AMD used Pin Grid Array (PGA - pins on CPU) and modern AMD (AM5) uses LGA1718.",
          "Microarchitecture: Intel uses hybrid architecture (P-cores for heavy computation, E-cores for background efficiency). AMD uses Chiplet (Zen) architecture connected via high-speed Infinity Fabric.",
          "Thermal Design Power (TDP): Indicates maximum power consumption and cooling capacity required in watts.",
        ],
      },
    ],
    architecture: {
      diagram: `+-------------------------------------------------------------+
|                     CENTRAL PROCESSING UNIT                  |
|  +--------------------+  +--------------------+             |
|  |     CORE 1         |  |     CORE 2         |             |
|  | [L1 Cache: 64KB]   |  | [L1 Cache: 64KB]   |             |
|  | [L2 Cache: 1MB]    |  | [L2 Cache: 1MB]    |             |
|  +--------------------+  +--------------------+             |
|  +-------------------------------------------------------+  |
|  |            SHARED LEVEL 3 CACHE (32MB - 96MB)         |  |
|  +-------------------------------------------------------+  |
|  +-------------------------------------------------------+  |
|  |        INTEGRATED MEMORY CONTROLLER (IMC) / PCIe      |  |
|  +-------------------------------------------------------+  |
+-------------------------------------------------------------+
                 |                           |
        DDR4/DDR5 RAM Bus           PCIe Gen 4/5 Bus`,
      explanation:
        "Instructions and data are retrieved from system RAM into the shared L3 cache, dispatched into core-private L2 and L1 caches, and decoded by execution units (ALU/FPU) at clock frequencies up to 5.8+ GHz.",
      specifications: [
        { key: "Instruction Sets", value: "x86-64, AVX-512, SSE4.2, ARM64" },
        { key: "Lithography", value: "3nm, 5nm, Intel 7 (10nm Enhanced SuperFin)" },
        { key: "Sockets", value: "Intel LGA1700/LGA1851 | AMD Socket AM5/AM4" },
      ],
    },
    practicalLab: {
      title: "CPU Inspection, Diagnostics & Thermal Monitoring",
      prerequisites: "Windows 10/11 or Linux Ubuntu Workstation with Administrative / root access",
      commandsOrCode: [
        {
          language: "cmd",
          code: "wmic cpu get name, caption, maxclockspeed, numberofcores, numberoflogicalprocessors /format:list",
          description: "Inspect CPU Model, Clock Speed, Physical Cores and Logical Threads in Windows Command Prompt.",
        },
        {
          language: "bash",
          code: "lscpu\ncat /proc/cpuinfo | grep 'model name' | head -1",
          description: "Retrieve complete CPU architecture, cache topology, and flags in Linux terminal.",
        },
      ],
      expectedOutput: "Name=Intel(R) Core(TM) i7-13700K CPU @ 3.40GHz | NumberOfCores=16 | NumberOfLogicalProcessors=24",
    },
    troubleshooting: [
      {
        issue: "System thermal throttling and random system shutdowns",
        cause: "Dried or improperly applied thermal paste, failing AIO pump/fan, or loose cooler mounting bracket.",
        solution: "Clean old thermal paste with 99% Isopropyl Alcohol. Apply pea-sized dot of Arctic MX-4 or Noctua NT-H1 paste and re-torque heatsink screws evenly in cross pattern.",
      },
      {
        issue: "WHEA_UNCORRECTABLE_ERROR Blue Screen (BSOD)",
        cause: "Hardware voltage instability, unstable CPU overclocking, or degraded CPU core/silicon.",
        solution: "Reset BIOS to Optimized Factory Defaults (Clear CMOS). Disable XMP/EXPO temporarily to verify baseline stability.",
      },
    ],
    interviewPrep: [
      {
        question: "What is the key difference between LGA and PGA socket designs?",
        answer: "In LGA (Land Grid Array), the delicate contact pins are located on the motherboard socket, and the CPU has flat gold contact pads. In PGA (Pin Grid Array), the pins are on the underside of the processor itself.",
        tip: "Mention that LGA reduces risk of CPU damage during shipping, but requires delicate care when handling the motherboard socket.",
      },
      {
        question: "Explain the difference between Physical Cores and Logical Processors (Hyper-threading).",
        answer: "A physical core is an actual physical processing unit on the silicon die with its own ALU and registers. Logical processors are created by Simultaneous Multi-Threading (SMT/Hyper-Threading), which duplicates the architectural state so one physical core can execute two threads alternately when one thread is stalled waiting for memory.",
      },
    ],
  },

  "motherboard components": {
    category: "Computer Hardware & Architecture",
    readingTimeMin: 12,
    overview:
      "The motherboard (mainboard) is the central printed circuit board (PCB) that acts as the communication backbone for all hardware components in a PC, connecting the CPU, RAM, storage, GPU, and peripheral interfaces.",
    concepts: [
      {
        heading: "Key Motherboard Subsystems",
        points: [
          "CPU Socket: Secures the processor and links it directly to memory and high-speed PCIe lanes.",
          "VRM (Voltage Regulator Module): Converts the 12V power from the SMPS down to 1.1V - 1.4V clean DC power required by modern CPUs.",
          "Chipset (PCH): Controls communication between the CPU and slower peripheral buses (SATA, USB, audio, secondary PCIe slots).",
          "DIMM Slots: Dual In-Line Memory Module slots for installing high-speed RAM in Dual-Channel or Quad-Channel mode.",
          "Expansion Slots: PCIe x16 (for graphics cards), PCIe x4/x1 (for capture cards, Wi-Fi cards).",
          "Storage Interfaces: M.2 NVMe slots (connected via PCIe Gen 4/5) and SATA III 6Gbps ports.",
        ],
      },
      {
        heading: "Form Factors & Layout Standards",
        points: [
          "ATX (Standard Desktop): 305mm x 244mm, offers 4 DIMM slots, 3+ PCIe slots, multiple M.2 slots.",
          "Micro-ATX (Compact Desktop): 244mm x 244mm, balanced size and budget, up to 4 DIMM slots.",
          "Mini-ITX (Ultra Compact): 170mm x 170mm, 1 PCIe slot, 2 DIMM slots, for portable SFF builds.",
        ],
      },
    ],
    architecture: {
      diagram: `+-------------------------------------------------------------+
| [Rear I/O Panel]   [VRM Heatsink]     [8-pin CPU Power]     |
|         |                 |                                 |
|         +-----------> [CPU SOCKET] <-----+                  |
|                            |             |                  |
|                   PCIe x16 |             | Memory Bus       |
|                            v             v                  |
|                   [PCIe x16 GPU SLOT]  [DIMM SLOTS (RAM)]   |
|                            |             |                  |
|                     [M.2 NVMe Slot 1]    |                  |
|                            |             |                  |
|                   [CHIPSET (PCH)] <------+                  |
|                    /     |     \\                            |
|          [M.2 Slot 2]  [SATA]  [Front Panel / USB Headers]  |
|                   [24-pin ATX Main Power Connector]         |
+-------------------------------------------------------------+`,
      explanation:
        "High-bandwidth components (primary GPU and primary M.2 slot) connect directly to CPU lanes. Lower-speed peripherals and additional drives communicate through the motherboard Chipset (PCH).",
    },
    practicalLab: {
      title: "Motherboard Hardware Diagnostics & CMOS Reset",
      prerequisites: "Phillips screwdriver, Anti-static wristband, Motherboard manual",
      commandsOrCode: [
        {
          language: "cmd",
          code: "wmic baseboard get product, manufacturer, version, serialnumber",
          description: "Query motherboard manufacturer and model name directly from Windows Command Prompt.",
        },
        {
          language: "bash",
          code: "sudo dmidecode -t baseboard",
          description: "Inspect complete motherboard hardware specifications and BIOS revision in Linux.",
        },
      ],
      expectedOutput: "Manufacturer: ASUS | Product: ROG STRIX B650-A GAMING WIFI | Version: Rev 1.xx",
    },
    troubleshooting: [
      {
        issue: "PC will not turn on when power button is pressed, fans do not spin",
        cause: "Front panel PWR_SW pin disconnected, 24-pin ATX connector loose, or short circuit against chassis standoffs.",
        solution: "Verify 24-pin and 8-pin EPS connectors are seated fully. Test front panel by gently jumping the PWR_SW pins with a flathead screwdriver.",
      },
      {
        issue: "Motherboard Diagnostic Debug LED stays stuck on DRAM or CPU (Yellow/Red)",
        cause: "RAM stick not seated completely into the notch, or bent CPU socket pins.",
        solution: "Reseat RAM firmly until both latches click. Test one stick in slot A2. Inspect CPU socket under bright light for bent pins.",
      },
    ],
    interviewPrep: [
      {
        question: "What is the function of the VRM on a motherboard?",
        answer: "The VRM (Voltage Regulator Module) steps down the 12V power supplied by the PSU to the precise, stable low-voltage DC (typically 1.1V - 1.4V) required by the CPU. High-quality VRMs with robust heatsinks ensure stable operation and prevent thermal throttling under heavy CPU loads.",
      },
      {
        question: "How do you perform a hardware CMOS reset on a motherboard?",
        answer: "1. Turn off PSU and unplug power cable. 2. Remove the CR2032 coin cell battery for 5 minutes, or short the CLRTC / JBAT1 jumper pins with a metal jumper/screwdriver for 10 seconds. 3. Reinstall battery and power on. This clears corrupted BIOS settings.",
      },
    ],
  },

  "ram": {
    category: "Computer Hardware & Memory",
    readingTimeMin: 8,
    overview:
      "Random Access Memory (RAM) is high-speed volatile primary memory that temporarily holds operating system files, active applications, and data being actively manipulated by the CPU. Unlike storage drives, RAM loses all data when powered down.",
    concepts: [
      {
        heading: "RAM Types & Generations",
        points: [
          "DDR4: Clock speeds between 2133 MHz and 3600+ MHz, standard operating voltage 1.2V.",
          "DDR5: Next-generation standard starting at 4800 MHz up to 7200+ MHz, operating voltage 1.1V, featuring on-die ECC and dual 32-bit subchannels per stick.",
          "Dual-Channel Configuration: Installing RAM in alternating slots (typically slots 2 & 4, labeled A2 & B2) doubles memory bandwidth between CPU and RAM.",
          "XMP (Intel) / EXPO (AMD): Pre-configured overclocking profiles tested by manufacturers to enable advertised speeds in BIOS.",
        ],
      },
      {
        heading: "RAM Timings & Latency",
        points: [
          "CAS Latency (CL): The number of clock cycles between sending a column address to memory and the data being available.",
          "Lower CL combined with higher frequency yields the fastest real-world memory response times.",
        ],
      },
    ],
    architecture: {
      diagram: `[CPU Core Execution Units]
           ▲
           │ Ultra-fast (0.5 - 1 ns)
     [L1/L2/L3 Cache]
           ▲
           │ High-speed Bus (10 - 15 ns)
    [DDR4 / DDR5 RAM]  <==== Volatile Fast Memory (16GB - 128GB)
           ▲
           │ Page Fault / Swapping (10,000+ ns)
   [NVMe SSD / Hard Disk]  <==== Non-volatile Storage (1TB - 4TB)`,
      explanation:
        "The CPU accesses data from RAM thousands of times faster than from an SSD. If RAM runs out, the OS swaps memory pages to virtual memory (pagefile.sys) on disk, causing heavy system stutter.",
    },
    practicalLab: {
      title: "RAM Speed Verification & Memory Diagnostic Test",
      prerequisites: "Windows 10/11 Workstation",
      commandsOrCode: [
        {
          language: "cmd",
          code: "wmic memorychip get capacity, speed, devicelocator, partnumber, manufacturer",
          description: "Query installed RAM capacity, operating frequency (MHz), and slot locations.",
        },
        {
          language: "cmd",
          code: "mdsched.exe",
          description: "Launch Windows Memory Diagnostic utility to scan for corrupt memory addresses.",
        },
      ],
      expectedOutput: "Capacity=17179869184 (16GB) | Speed=3200 | DeviceLocator=DIMM_A2",
    },
    troubleshooting: [
      {
        issue: "System boots but only half of installed RAM is usable in Windows",
        cause: "One stick not seated fully, incorrect dual-channel slot placement, or integrated GPU reserving RAM.",
        solution: "Ensure RAM is placed in designated slots A2 and B2. Reseat modules and check Windows Task Manager > Performance > Memory > Hardware Reserved.",
      },
      {
        issue: "Frequent MEMORY_MANAGEMENT Blue Screen (BSOD) crashes",
        cause: "Faulty RAM cell, aggressive XMP overclocking profile, or unstable voltage.",
        solution: "Run Windows Memory Diagnostic (`mdsched.exe`) or MemTest86. If errors are found, disable XMP or replace the defective RAM stick.",
      },
    ],
    interviewPrep: [
      {
        question: "Why should RAM sticks be installed in slots 2 and 4 (A2 and B2) rather than 1 and 2?",
        answer: "Most modern motherboards use 'Daisy-Chain' trace topology. Installing in slots A2 and B2 ensures optimal signal integrity, terminating traces properly without signal reflections that degrade memory stability at high frequencies.",
      },
      {
        question: "What is Virtual Memory (Paging)?",
        answer: "Virtual memory is a memory management technique where the OS extends physical RAM by allocating a portion of secondary storage (e.g., pagefile.sys in Windows or swap in Linux) to hold inactive memory pages.",
      },
    ],
  },

  "bios & uefi": {
    category: "System Firmware & Low-Level Architecture",
    readingTimeMin: 9,
    overview:
      "BIOS (Basic Input/Output System) and modern UEFI (Unified Extensible Firmware Interface) are low-level firmware stored on a non-volatile flash memory chip on the motherboard. It performs hardware initialization during POST and hands over control to the OS bootloader.",
    concepts: [
      {
        heading: "Legacy BIOS vs Modern UEFI",
        points: [
          "Legacy BIOS: 16-bit real mode, 1MB memory limit, supports only MBR partition tables (max 2TB disks, max 4 primary partitions), blue text-only screen.",
          "UEFI: 32-bit or 64-bit mode, graphical mouse-driven GUI, supports GPT partition tables (up to 9.4 ZB disks, 128 partitions), much faster boot times.",
          "Secure Boot: Cryptographically validates the digital signature of the OS bootloader and drivers to prevent rootkits and bootkits from running before the OS loads.",
          "CSM (Compatibility Support Module): A backwards-compatibility mode in UEFI to boot legacy MBR operating systems.",
        ],
      },
      {
        heading: "The POST (Power-On Self-Test) Workflow",
        points: [
          "1. PSU sends 'Power Good' signal (+5V) to motherboard.",
          "2. CPU initializes and starts executing firmware at reset vector.",
          "3. POST checks CPU, initializes memory controllers, tests RAM, tests GPU display output.",
          "4. Hardware beeps or diagnostic LEDs signal hardware health (1 short beep = normal).",
          "5. Firmware searches configured Boot Priority order (USB, NVMe, SSD, Network PXE) and launches EFI bootloader (e.g. bootmgfw.efi).",
        ],
      },
    ],
    architecture: {
      diagram: `[POWER ON] ──► [POWER GOOD SIGNAL] ──► [CPU RESET VECTOR]
                                                   │
                                                   ▼
                                         [POST INITIALIZATION]
                                         - Verify CPU & Registers
                                         - Test RAM Integrity
                                         - Init Video / Display
                                                   │
                                                   ▼
                                          [HARDWARE CHECK OK?]
                                           /              \\
                                         YES              NO (Beep Codes / LED Error)
                                         /
                                        ▼
                             [CHECK BOOT PRIORITY]
                                        │
                                        ▼
                             [LOAD EFI BOOTLOADER]
                             (e.g., Windows bootmgfw.efi)
                                        │
                                        ▼
                              [OPERATING SYSTEM KERNEL]`,
      explanation:
        "UEFI abstracts hardware communication during early boot, enforces Secure Boot certificates, and loads the kernel into memory.",
    },
    practicalLab: {
      title: "Checking UEFI Firmware Status & Boot Mode in Windows",
      prerequisites: "Administrative Windows PowerShell prompt",
      commandsOrCode: [
        {
          language: "powershell",
          code: "msinfo32",
          description: "Check 'BIOS Mode' (UEFI or Legacy) and 'Secure Boot State' in System Information.",
        },
        {
          language: "cmd",
          code: "bcdedit /enum {current}",
          description: "Examine active Windows Boot Configuration Data store and boot path.",
        },
      ],
      expectedOutput: "BIOS Mode: UEFI | Secure Boot State: On | path: \\EFI\\Microsoft\\Boot\\bootmgfw.efi",
    },
    troubleshooting: [
      {
        issue: "PC boots directly into BIOS and refuses to boot into Windows",
        cause: "Boot drive not detected in BIOS, incorrect boot order, or CSM disabled on an MBR drive.",
        solution: "Verify M.2 SSD appears in storage list. If Windows was installed on MBR, enable CSM, or convert the disk to GPT using `mbr2gpt.exe`.",
      },
      {
        issue: "Corrupted BIOS update bricked the motherboard",
        cause: "Power loss during BIOS flashing or flashing incorrect revision.",
        solution: "Use the motherboard's rear USB BIOS Flashback button: load renamed BIOS file (e.g. `creative.CAP`) onto a FAT32 USB drive and press the button for 3 seconds.",
      },
    ],
    interviewPrep: [
      {
        question: "What is Secure Boot and how does it protect the system?",
        answer: "Secure Boot is a UEFI security standard that ensures the computer boots using only software that is trusted by the Original Equipment Manufacturer (OEM). It checks the cryptographic signature of the bootloader, kernel, and driver modules against trusted keys stored in UEFI NVRAM, preventing rootkits from loading.",
      },
      {
        question: "Explain what happens during POST.",
        answer: "POST (Power-On Self-Test) is the initial diagnostic testing sequence run by firmware immediately after powering on. It validates hardware functionality including CPU registers, RAM integrity, GPU initialization, keyboard/mouse presence, and storage connectivity before passing control to the bootloader.",
      },
    ],
  },

  // --- NETWORKING ---
  "osi 7 layers": {
    category: "Computer Networking",
    readingTimeMin: 12,
    overview:
      "The Open Systems Interconnection (OSI) model is a conceptual framework standardized by ISO that characterizes and standardizes the communication functions of a telecommunication or computing system into seven distinct logical layers.",
    concepts: [
      {
        heading: "The 7 Layers Breakdown",
        points: [
          "Layer 7 - Application: User interface & network applications (HTTP, HTTPS, FTP, DNS, SMTP, SSH).",
          "Layer 6 - Presentation: Data formatting, encryption, decryption, and compression (SSL/TLS, JPEG, ASCII).",
          "Layer 5 - Session: Establishes, manages, and terminates communication sessions between applications (RPC, NetBIOS).",
          "Layer 4 - Transport: End-to-end data delivery, error checking, flow control, port addressing (TCP, UDP). PDU = Segment.",
          "Layer 3 - Network: Logical addressing and path determination across networks (IP, ICMP, ARP, OSPF, BGP). PDU = Packet. Device = Router.",
          "Layer 2 - Data Link: Physical addressing, framing, and media access control (Ethernet, MAC, VLAN). PDU = Frame. Device = Switch.",
          "Layer 1 - Physical: Transmission of raw binary bitstream over physical medium (cables, fiber, radio frequencies). PDU = Bits. Device = Hub, Cables.",
        ],
      },
      {
        heading: "Data Encapsulation & Decapsulation",
        points: [
          "Encapsulation (Sender): Data -> Segment (+TCP header) -> Packet (+IP header) -> Frame (+MAC header & FCS) -> Bits.",
          "Decapsulation (Receiver): Reverse process where each layer strips its corresponding header before passing data upwards.",
        ],
      },
    ],
    architecture: {
      diagram: `SENDER                                                RECEIVER
[Layer 7: Application]   ── Data ──────────────────► [Layer 7: Application]
[Layer 6: Presentation]  ── Data ──────────────────► [Layer 6: Presentation]
[Layer 5: Session]       ── Data ──────────────────► [Layer 5: Session]
[Layer 4: Transport]     ── Segment (+TCP Header) ─► [Layer 4: Transport]
[Layer 3: Network]       ── Packet (+IP Header) ───► [Layer 3: Network]
[Layer 2: Data Link]     ── Frame (+MAC Header) ───► [Layer 2: Data Link]
[Layer 1: Physical]      ── 0101100101 (Bits) ─────► [Layer 1: Physical]
                                  │
                          [Physical Cable / Wi-Fi]`,
      explanation:
        "Every network transaction traverses all 7 layers from sender down to physical medium, and climbs back up the 7 layers at the destination.",
    },
    practicalLab: {
      title: "Inspecting OSI Layers with Packet Capture Analysis",
      prerequisites: "Wireshark or tcpdump installed",
      commandsOrCode: [
        {
          language: "bash",
          code: "ping -c 4 8.8.8.8\ntraceroute google.com",
          description: "Generate Layer 3 ICMP echo request packets to observe packet traversal.",
        },
        {
          language: "cmd",
          code: "netstat -ano | findstr ESTABLISHED",
          description: "Inspect active Layer 4 TCP transport connections and port bindings in Windows.",
        },
      ],
      expectedOutput: "TCP    192.168.1.50:52344    142.250.190.46:443    ESTABLISHED    7824",
    },
    troubleshooting: [
      {
        issue: "Cannot connect to web server; ping to server IP fails with 'Request timed out'",
        cause: "Physical layer cable disconnected, Network layer IP routing failure, or ICMP blocked by firewall.",
        solution: "1. Check physical link light (Layer 1). 2. Check local IP with `ipconfig` (Layer 3). 3. Test gateway ping. 4. Verify web port 443 with `Test-NetConnection -Port 443`.",
      },
    ],
    interviewPrep: [
      {
        question: "What is the primary difference between Layer 2 and Layer 3 devices?",
        answer: "Layer 2 switches forward traffic using hardware MAC addresses inside an Ethernet Frame within the same broadcast domain. Layer 3 routers forward traffic using logical IP addresses inside an IP Packet to route between different networks and subnets.",
      },
      {
        question: "Explain the difference between TCP and UDP at Layer 4.",
        answer: "TCP (Transmission Control Protocol) is connection-oriented, reliable, guarantees ordered delivery using sequence numbers, and performs 3-way handshakes (SYN, SYN-ACK, ACK). UDP (User Datagram Protocol) is connectionless, lightweight, has no handshake or retransmission, making it ideal for real-time video streaming, DNS, and VoIP.",
      },
    ],
  },

  "ip addressing & subnetting": {
    category: "Computer Networking",
    readingTimeMin: 14,
    overview:
      "An IP (Internet Protocol) address is a unique numerical identifier assigned to every device participating in a computer network. Subnetting is the practice of dividing a single large physical network into multiple logical subnetworks for security and performance.",
    concepts: [
      {
        heading: "IPv4 Architecture & Address Classes",
        points: [
          "IPv4 is a 32-bit address represented in dotted-decimal format (e.g. 192.168.1.1), totaling ~4.3 billion possible addresses.",
          "Class A (1.0.0.0 - 126.255.255.255): Default mask /8 (255.0.0.0). For huge enterprises.",
          "Class B (128.0.0.0 - 191.255.255.255): Default mask /16 (255.255.0.0).",
          "Class C (192.0.0.0 - 223.255.255.255): Default mask /24 (255.255.255.0). For small networks.",
          "Private IP Ranges (RFC 1918): 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16 (not routable on public Internet; requires NAT).",
          "Loopback: 127.0.0.1 (localhost). APIPA: 169.254.0.0/16 (assigned automatically when DHCP fails).",
        ],
      },
      {
        heading: "CIDR Notation & Subnet Calculation Formula",
        points: [
          "CIDR (Classless Inter-Domain Routing): e.g. /24 indicates 24 bits for Network ID and 8 bits for Host ID.",
          "Number of Usable Hosts: 2^H - 2 (subtract 2 for Network ID and Broadcast ID).",
          "Example: /26 means 6 host bits remain -> 2^6 - 2 = 62 usable IP addresses per subnet.",
          "Subnet block sizes: /24 = 256, /25 = 128, /26 = 64, /27 = 32, /28 = 16, /29 = 8, /30 = 4 (2 hosts, point-to-point links).",
        ],
      },
    ],
    architecture: {
      diagram: `IP Address:    192 . 168 .   1   . 100   (/24)
Binary:        11000000.10101000.00000001.01100100
Subnet Mask:   255 . 255 . 255 .   0
Mask Binary:   11111111.11111111.11111111.00000000
               |--------- NETWORK ID --------|-- HOST ID --|

Bitwise AND:   192 . 168 .   1   .   0  <-- Network Address
Last Address:  192 . 168 .   1   . 255  <-- Broadcast Address
Usable Range:  192.168.1.1  TO  192.168.1.254 (254 Usable Hosts)`,
      explanation:
        "Devices on the same subnet communicate directly via Layer 2 switch using ARP. Traffic destined for an IP outside the subnet is sent to the Default Gateway (Router).",
    },
    practicalLab: {
      title: "Network IP Verification & Subnet Diagnostics",
      prerequisites: "Windows / Linux workstation connected to LAN",
      commandsOrCode: [
        {
          language: "cmd",
          code: "ipconfig /all",
          description: "Display active IPv4, Subnet Mask, Default Gateway, and DHCP Server details.",
        },
        {
          language: "bash",
          code: "ip addr show\nip route show",
          description: "Display interfaces, CIDR notation masks, and default routing table in Linux.",
        },
      ],
      expectedOutput: "IPv4 Address. . . . : 192.168.1.45\nSubnet Mask . . . . : 255.255.255.0 (/24)\nDefault Gateway . . : 192.168.1.1",
    },
    troubleshooting: [
      {
        issue: "Computer receives an IP address starting with 169.254.x.x and cannot access Internet",
        cause: "APIPA (Automatic Private IP Addressing) assigned because DHCP server failed to respond.",
        solution: "1. Verify network cable or Wi-Fi link. 2. Run `ipconfig /release` and `ipconfig /renew`. 3. Verify DHCP server service is active on router.",
      },
      {
        issue: "IP Address Conflict detected notification in Windows",
        cause: "Two devices on the same subnet have been assigned the same static IP address.",
        solution: "Identify conflicting MAC address with `arp -a`. Change one device to DHCP or allocate an unassigned static IP.",
      },
    ],
    interviewPrep: [
      {
        question: "Why do we subtract 2 when calculating usable hosts in a subnet (2^H - 2)?",
        answer: "The first address in any subnet (all host bits 0) represents the Network ID itself, and the last address (all host bits 1) is reserved as the Directed Broadcast Address. Neither can be assigned to a host device.",
      },
      {
        question: "What is the difference between Public and Private IP addresses?",
        answer: "Private IP addresses (RFC 1918) are reserved for internal LAN networks, cannot be routed over the public Internet, and are free to use. Public IP addresses are globally unique and routable on the Internet, managed by IANA/RIRs.",
      },
    ],
  },
};

/**
 * Universal Topic Generator:
 * Intelligently generates comprehensive, professional technical study notes
 * for any curriculum topic using deep domain knowledge heuristics.
 */
export function getTopicStudyNotes(
  topicTitle: string,
  courseTitle?: string,
  moduleTitle?: string
): TopicStudyMaterial {
  const normalizedKey = topicTitle.toLowerCase().trim();

  // 1. Direct curated match
  if (CURATED_TOPICS[normalizedKey]) {
    const cur = CURATED_TOPICS[normalizedKey];
    return {
      title: topicTitle,
      category: cur.category || "Professional Tech Courseware",
      readingTimeMin: cur.readingTimeMin || 10,
      overview: cur.overview || `Detailed technical study guide for ${topicTitle}.`,
      concepts: cur.concepts || [],
      architecture: cur.architecture || {
        explanation: `System workflow and structural architecture for ${topicTitle}.`,
      },
      practicalLab: cur.practicalLab || {
        title: `Practical Hands-on Lab: ${topicTitle}`,
        prerequisites: "Standard development or administrative environment.",
        commandsOrCode: [],
      },
      troubleshooting: cur.troubleshooting || [],
      interviewPrep: cur.interviewPrep || [],
    };
  }

  // 2. Partial match in curated library
  for (const [key, val] of Object.entries(CURATED_TOPICS)) {
    if (normalizedKey.includes(key) || key.includes(normalizedKey)) {
      return {
        title: topicTitle,
        category: val.category || "Professional Tech Courseware",
        readingTimeMin: val.readingTimeMin || 10,
        overview: val.overview || `Deep-dive study guide for ${topicTitle}.`,
        concepts: val.concepts || [],
        architecture: val.architecture || {
          explanation: `System workflow and structural architecture for ${topicTitle}.`,
        },
        practicalLab: val.practicalLab || {
          title: `Hands-on Lab: ${topicTitle}`,
          prerequisites: "Development workstation setup.",
          commandsOrCode: [],
        },
        troubleshooting: val.troubleshooting || [],
        interviewPrep: val.interviewPrep || [],
      };
    }
  }

  // 3. Domain Heuristics Generator based on topic keyword classification
  const isCode = /\b(c\+\+|c language|python|java|javascript|react|mern|function|variable|pointer|class|oop|loop|array|string|algorithm)\b/i.test(
    `${topicTitle} ${moduleTitle} ${courseTitle}`
  );
  const isNet = /\b(network|ip|vlan|switch|router|tcp|dhcp|dns|firewall|osi|routing|subnet|vpn|wireshark|protocol)\b/i.test(
    `${topicTitle} ${moduleTitle} ${courseTitle}`
  );
  const isDb = /\b(sql|mysql|oracle|database|query|table|index|trigger|schema|dba|stored procedure|join|normalization)\b/i.test(
    `${topicTitle} ${moduleTitle} ${courseTitle}`
  );
  const isSecurity = /\b(cyber|security|hack|penetration|vulnerability|exploit|threat|malware|soc|siem|kali|crypto|metasploit)\b/i.test(
    `${topicTitle} ${moduleTitle} ${courseTitle}`
  );
  const isCloud = /\b(cloud|aws|azure|devops|docker|kubernetes|container|ci\/cd|linux|server|admin|terraform|jenkins)\b/i.test(
    `${topicTitle} ${moduleTitle} ${courseTitle}`
  );

  let category = "Core Engineering & Implementation";
  let sampleCommand = `echo "Executing verified workflow for ${topicTitle}..."`;
  let commandLang = "bash";
  let interviewQ = `How is ${topicTitle} implemented and optimized in an enterprise production environment?`;
  let interviewA = `${topicTitle} is implemented following industry standard conventions, ensuring modular separation of concerns, scalability, and strict error handling. Senior engineers validate edge cases and benchmark performance under high concurrency.`;

  if (isCode) {
    category = "Programming & Software Engineering";
    commandLang = "cpp";
    sampleCommand = `// Sample industrial implementation for ${topicTitle}\n#include <iostream>\n\nint main() {\n    // Core execution logic for ${topicTitle}\n    std::cout << "Mastering ${topicTitle} - SOFTLAB Global" << std::endl;\n    return 0;\n}`;
    interviewQ = `What are the memory and time complexity implications when working with ${topicTitle}?`;
    interviewA = `When implementing ${topicTitle}, engineers must avoid memory leaks, minimize redundant allocations, and adhere to clean RAII (Resource Acquisition Is Initialization) or garbage collection patterns.`;
  } else if (isNet) {
    category = "Network Engineering & Infrastructure";
    commandLang = "cmd";
    sampleCommand = `ping 127.0.0.1 -n 4\nnetstat -rn\ntracert 8.8.8.8`;
    interviewQ = `What layer of the OSI model does ${topicTitle} operate in, and how does it prevent packet collisions/routing loops?`;
    interviewA = `${topicTitle} operates with defined protocols and metrics, managing traffic flows, verifying packet integrity with checksums, and interfacing between network nodes.`;
  } else if (isDb) {
    category = "Database Engineering & SQL";
    commandLang = "sql";
    sampleCommand = `-- Production query & execution plan for ${topicTitle}\nEXPLAIN ANALYZE\nSELECT * FROM system_records\nWHERE status = 'ACTIVE';`;
    interviewQ = `How do you index and optimize queries involving ${topicTitle} under heavy read/write database workloads?`;
    interviewA = `Engineers create targeted B-Tree or composite indexes, avoid full table scans, verify query execution plans (EXPLAIN), and ensure proper transaction isolation levels (ACID compliance).`;
  } else if (isSecurity) {
    category = "Cyber Security & Threat Defense";
    commandLang = "bash";
    sampleCommand = `# Security reconnaissance & analysis workflow\nnmap -sV -sC -Pn target_host\n# Log audit & SIEM inspection\ngrep -i "fail" /var/log/auth.log`;
    interviewQ = `What attack vectors target ${topicTitle}, and what defensive mitigation controls must be implemented?`;
    interviewA = `Mitigation involves defense-in-depth: enforcing least privilege (RBAC), cryptographically signing communication channels (TLS 1.3), sanitizing inputs, and monitoring security logs via SIEM.`;
  } else if (isCloud) {
    category = "Cloud Architecture & DevOps";
    commandLang = "bash";
    sampleCommand = `# Docker & Infrastructure provisioning\ndocker ps -a\nkubectl get pods --all-namespaces\nsudo systemctl status service_name`;
    interviewQ = `How do you ensure high availability (HA) and disaster recovery (DR) for ${topicTitle}?`;
    interviewA = `Deploy across multi-availability zones (Multi-AZ), implement automated health checks with auto-scaling groups, and maintain automated Infrastructure as Code (IaC) configuration backups.`;
  }

  return {
    title: topicTitle,
    category,
    readingTimeMin: 8,
    overview: `${topicTitle} is a foundational technical subject within ${moduleTitle || "the curriculum"}. This guide outlines its operational principles, architectural implementation, best practices, and real-world enterprise applications.`,
    concepts: [
      {
        heading: `1. Core Principles of ${topicTitle}`,
        points: [
          `Definition & Role: ${topicTitle} serves as a critical building block within ${courseTitle || "modern tech stacks"}.`,
          `Key Mechanics: Operates by establishing clear structural boundaries and predictable runtime execution.`,
          `Industrial Relevance: Leading tech enterprises standardize on this methodology to ensure maintainability, security, and high performance.`,
        ],
      },
      {
        heading: `2. Enterprise Architecture & Workflows`,
        points: [
          `Decoupled Architecture: Ensures components remain loosely coupled and easily testable.`,
          `Data Flow & State: Manages data transitions cleanly between input, processing, and output stages.`,
          `Error Handling: Implements strict input validation, exception catch blocks, and audit telemetry.`,
        ],
      },
    ],
    architecture: {
      diagram: `+--------------------------------------------------------+
|                     SYSTEM WORKFLOW                    |
|   [INPUT / REQUEST]  ──►  [${topicTitle.toUpperCase().slice(0, 20)}]  ──►  [VERIFIED OUTPUT]   |
|            │                          │               |
|            ▼                          ▼               |
|   [VALIDATION ENGINE]       [AUDIT & PERFORMANCE]     |
+--------------------------------------------------------+`,
      explanation: `System workflow diagram showing how ${topicTitle} orchestrates data flow, applies business rules, and outputs verified responses.`,
      specifications: [
        { key: "Domain", value: category },
        { key: "Target Course", value: courseTitle || "SoftLab Global Professional Engineering" },
        { key: "Curriculum Module", value: moduleTitle || "Technical Foundations" },
      ],
    },
    practicalLab: {
      title: `Hands-on Lab Exercise: ${topicTitle}`,
      prerequisites: `Active development or testing sandbox with administrative permissions.`,
      commandsOrCode: [
        {
          language: commandLang,
          code: sampleCommand,
          description: `Execute core verification commands or code snippet for ${topicTitle}.`,
        },
      ],
      expectedOutput: `Success: [${topicTitle}] initialization confirmed with 0 errors.`,
    },
    troubleshooting: [
      {
        issue: `Runtime failure or syntax exception during ${topicTitle} execution`,
        cause: `Misconfigured environment variables, outdated dependencies, or missing prerequisite permissions.`,
        solution: `Inspect log outputs, verify service permissions, and confirm environment configuration before re-running.`,
      },
      {
        issue: `Performance degradation or memory bottleneck under load`,
        cause: `Unoptimized execution loops, missing indexing, or resource leaks.`,
        solution: `Profile CPU and memory usage with diagnostic tools and refactor critical bottlenecks.`,
      },
    ],
    interviewPrep: [
      {
        question: interviewQ,
        answer: interviewA,
        tip: `Relate your answer to a real-world scenario you experienced or built during your SoftLab course practical labs.`,
      },
      {
        question: `What common antipatterns or mistakes should engineers avoid when dealing with ${topicTitle}?`,
        answer: `Engineers should avoid hardcoding configuration, skipping error validation, ignoring security boundary checks, and deploying unverified changes directly to production without automated testing.`,
      },
    ],
  };
}
