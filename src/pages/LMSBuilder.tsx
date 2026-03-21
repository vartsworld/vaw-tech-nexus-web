import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Check, 
  ChevronDown, 
  MessageSquare, 
  PhoneCall, 
  ArrowRight,
  GraduationCap,
  Users,
  Building,
  School,
  X,
  Smartphone,
  Layout,
  Database,
  ShieldCheck,
  Bell,
  Globe,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { toast } from "sonner";
import SEO from "@/components/SEO";

// --- DATA ---
const BASE_PRICE = 52000;

interface Module {
  id: string;
  name: string;
  tagline: string;
  price: number;
  icon: string;
  tags: string[];
  description: string;
  features: Array<{ icon: string; name: string; desc: string }>;
  useCases?: Array<{ icon: string; text: string }>;
  perfectFor?: string;
  isFreeSetup?: boolean;
}

const MODULE_CATEGORIES = [
  {
    name: "Academic",
    icon: "📚",
    modules: [
      {
        id: "mod-acm",
        name: "Advanced Course Management",
        tagline: "Organize all learning content into structured chapters, units, and topics.",
        price: 7999,
        icon: "📚",
        tags: ["Structured modules", "Progress tracking", "Content organization"],
        description: "The base system lets teachers upload files and syllabi. This module turns your LMS into a proper structured learning system — like an organized textbook with chapters, units, and lessons that students follow in order.",
        features: [
          { icon: "🗂️", name: "Chapter & Unit Builder", desc: "Divide each subject into chapters, then units, then individual lessons." },
          { icon: "📈", name: "Student Progress Tracking", desc: "See which lessons each student has completed and what percentage covered." },
          { icon: "🎬", name: "Multi-type Content", desc: "Each lesson can include PDFs, videos, links, and text notes." },
          { icon: "🔒", name: "Sequential Unlocking", desc: "Lock upcoming chapters until previous ones are completed." },
        ],
        perfectFor: "Colleges and coaching centers that want a professional e-learning experience."
      },
      {
        id: "mod-ass",
        name: "Assignment Submission System",
        tagline: "Students submit assignments online — no paper, no WhatsApp, no lost files.",
        price: 4999,
        icon: "📝",
        tags: ["Online submission", "File uploads", "Deadline tracking"],
        description: "Students upload their work directly in the system, teachers receive and grade it there, and everything is tracked automatically. No more collecting notebooks or chasing submissions.",
        features: [
          { icon: "📤", name: "Online File Submission", desc: "Upload PDFs, Word docs, images, or zip files directly." },
          { icon: "⏰", name: "Deadline Countdown", desc: "Assignments show a live countdown to submission deadlines." },
          { icon: "✅", name: "Submission Status", desc: "Students can see Submitted, Late, or Not Submitted status clearly." },
          { icon: "💬", name: "Feedback & Comments", desc: "Teachers leave comments that students see on their dashboard." },
        ],
      },
      {
        id: "mod-exam",
        name: "Online Examination Module",
        tagline: "Conduct internal exams, quizzes, and tests fully online — auto-graded.",
        price: 9999,
        icon: "📋",
        tags: ["MCQ-based exams", "Auto evaluation", "Instant results"],
        description: "Teachers create questions inside the system, students take exams on their devices within time windows, and results are calculated automatically.",
        features: [
          { icon: "❓", name: "Question Paper Builder", desc: "Build MCQ, True/False, and short-answer papers with marks." },
          { icon: "⏱️", name: "Timed Exam Windows", desc: "Set start/end times and durations for every test." },
          { icon: "🔀", name: "Question Shuffling", desc: "Randomize questions and answers for each student." },
          { icon: "⚡", name: "Auto Evaluation", desc: "MCQ answers are evaluated instantly as exams finish." },
        ],
      },
      {
        id: "mod-res",
        name: "Results & Analytics",
        tagline: "Deep performance reports, GPA calculation, visual grade charts.",
        price: 1999,
        icon: "📊",
        tags: ["GPA calculation", "Performance insights", "Visual reports"],
        description: "The core platform stores marks but only shows raw numbers. This module turns those numbers into meaningful insights and trend graphs.",
        features: [
          { icon: "🎓", name: "GPA / CGPA Calculation", desc: "Auto-calculates GPA based on your grading formula." },
          { icon: "📈", name: "Trend Charts", desc: "Visual performance graphs showing student progress over time." },
          { icon: "🚨", name: "At-Risk Alerts", desc: "Flags students scoring below set thresholds for intervention." },
          { icon: "📄", name: "Digital Report Cards", desc: "Generate formatted, printable report cards automatically." },
        ],
      },
      {
        id: "mod-cert",
        name: "Inbuilt Certificate Generation",
        tagline: "Generate and issue certificates to students automatically upon completion.",
        price: 4999,
        icon: "🎓",
        tags: ["Auto-issue", "Custom templates", "Digital verify"],
        description: "Designing and printing certificates is time-consuming. This module automates it. Once a student completes a course or exam, the system generates a branded certificate with their name and details instantly.",
        features: [
          { icon: "🎨", name: "Template Library", desc: "Choose from professional certificate designs or upload your own." },
          { icon: "⚡", name: "Instant Issuance", desc: "Trigger certificates automatically when passing criteria are met." },
          { icon: "🔗", name: "Digital Verification", desc: "Each certificate includes a unique ID or QR for employer verification." },
        ],
      },
      {
        id: "mod-meet",
        name: "Online Class Module (Google Meet)",
        tagline: "Integrated live classes using Google Meet setup.",
        price: 0,
        icon: "🎥",
        tags: ["Live classes", "Free setup", "Google Meet"],
        description: "Launch virtual classrooms right inside your LMS. Setup Google Meet links for every batch and teacher automatically. No extra cost for our clients.",
        features: [
          { icon: "🌐", name: "Meet Integration", desc: "One-click Google Meet link generation for scheduled classes." },
          { icon: "📅", name: "Schedule Sync", desc: "Live class links appear on student timetables automatically." },
          { icon: "📢", name: "Class Alerts", desc: "Students get notified when a live class is about to start." },
        ],
        isFreeSetup: true
      }
    ]
  },
  {
    name: "Day-to-Day Operations",
    icon: "⚙️",
    modules: [
      {
        id: "mod-tt",
        name: "Smart Timetable System",
        tagline: "Build and manage class schedules visually with clash detection.",
        price: 6999,
        icon: "🗓️",
        tags: ["Drag-and-drop", "Conflict detection", "Auto-publish"],
        description: "A smart scheduling tool where admin can drag subjects into a visual grid. The system automatically warns of teacher or room double-bookings.",
        features: [
          { icon: "🖱️", name: "Drag-and-Drop Editor", desc: "Build week schedules visually instead of using spreadsheets." },
          { icon: "⚠️", name: "Conflict Detection", desc: "Warns if a teacher or room is assigned to two slots simultaneously." },
          { icon: "🔄", name: "Easy Substitution", desc: "Reassign classes to substitutes when teachers are absent." },
        ],
      },
      {
        id: "mod-att",
        name: "Advanced Attendance System",
        tagline: "QR-code based attendance that takes 10 seconds per class.",
        price: 8999,
        icon: "✅",
        tags: ["QR-based", "Auto reports", "Shortage alerts"],
        description: "Teachers display a QR code, students scan from their phones, and the class is marked in seconds. Includes shortage warnings and parent alerts.",
        features: [
          { icon: "📱", name: "QR Code Attendance", desc: "Students scan with their phones for instant class-wide marking." },
          { icon: "🚨", name: "Shortage Warnings", desc: "Automatic warnings if attendance drops below thresholds (e.g. 75%)." },
          { icon: "👨‍👩‍👧", name: "Parent Alerts", desc: "Notify parents automatically when their child misses a class." },
        ],
      },
      {
        id: "mod-trans",
        name: "Transport Management",
        tagline: "Track buses, manage routes, and collect transport fees.",
        price: 5000,
        icon: "🚌",
        tags: ["Live tracking", "Route mgmt", "Transport fees"],
        description: "Manage your institution's fleet effectively. Track routes, assign students to stops, and automate transport fee collection.",
        features: [
          { icon: "📍", name: "Route Planning", desc: "Define routes and stops for every vehicle in your fleet." },
          { icon: "🎫", name: "Bus Pass Generation", desc: "Issue digital bus passes for students and staff." },
        ],
      },
      {
        id: "mod-lib",
        name: "Library Management",
        tagline: "Full cataloging, book issuance, and fine management.",
        price: 3999,
        icon: "📖",
        tags: ["Book tracking", "Barcode ready", "Fine alerts"],
        description: "A complete digital library system. Track every book, manage issuance/returns, and automate fine calculations.",
        features: [
          { icon: "📚", name: "Cataloging", desc: "Digital database of all books with ISBN and category tracking." },
          { icon: "⏳", name: "Due Alerts", desc: "Notify students automatically when book return dates approach." },
        ],
      },
      {
        id: "mod-hostel",
        name: "Hostel Management",
        tagline: "Manage rooms, allotments, and mess fees digitally.",
        price: 7999,
        icon: "🏠",
        tags: ["Room allotment", "Mess mgmt", "Hostel fees"],
        description: "Perfect for residential campuses. Manage room availability, student allotments, and monthly mess/hostel charges.",
        features: [
          { icon: "🛏️", name: "Room Inventory", desc: "Track occupancy and availability of rooms across different blocks." },
          { icon: "🍽️", name: "Mess Billing", desc: "Automate billing for meals and monthly maintenance fees." },
        ],
      }
    ]
  },
  {
    name: "Fees & Finance",
    icon: "💰",
    modules: [
      {
        id: "mod-fee",
        name: "Fee Management System",
        tagline: "Set up fee structures, track payments, and generate official receipts.",
        price: 9999,
        icon: "💳",
        tags: ["Fee structures", "Payment tracking", "Receipt generation"],
        description: "Define fee heads (tuition, lab, hostel), assign to batches, track dues, send reminders, and generate professional receipts.",
        features: [
          { icon: "🏗️", name: "Structure Setup", desc: "Define diverse fee heads and assign per course or batch." },
          { icon: "🧾", name: "Receipt Generation", desc: "Generate numbered, branded PDF receipts for all payments." },
          { icon: "📅", name: "Installment Plans", desc: "Configure term-wise or monthly plans for installment tracking." },
        ],
      },
      {
        id: "mod-pay",
        name: "Online Payment Gateway",
        tagline: "Parents and students pay fees online through UPI, cards, or net banking.",
        price: 6999,
        icon: "🔗",
        tags: ["UPI & cards", "Razorpay / Stripe", "Auto receipts"],
        description: "Integrate with payment gateways so students pay via mobiles. Updates fee status automatically and issues instant receipts.",
        features: [
          { icon: "📱", name: "UPI & Cards", desc: "Supports GPay, PhonePe, and cards via Razorpay or Stripe." },
          { icon: "🔄", name: "Auto Updates", desc: "Fee records update real-time on successful payment." },
          { icon: "🔒", name: "Secure Escrow", desc: "Bank-grade security for institutional funds and transactions." },
        ],
      }
    ]
  },
  {
    name: "Communication",
    icon: "📢",
    modules: [
      {
        id: "mod-msg",
        name: "Internal Messaging System",
        tagline: "A private, secure chat built into your LMS — no personal numbers shared.",
        price: 6999,
        icon: "💬",
        tags: ["1-to-1 chat", "Group messaging", "File sharing"],
        description: "Adds a full messaging system inside your LMS. Communicate without sharing WhatsApp numbers. Admin has full oversight and logging.",
        features: [
          { icon: "👤", name: "Direct Messaging", desc: "Message any student, teacher, or staff safely and privately." },
          { icon: "👥", name: "Group Chats", desc: "Class or department threads for collaborative discussion." },
          { icon: "📎", name: "File Sharing", desc: "Share notes and PDFs directly in conversations." },
        ],
      },
      {
        id: "mod-email",
        name: "Email Notifications",
        tagline: "Automated emails to students, parents, and staff — 2,000/mo free.",
        price: 0,
        icon: "📧",
        tags: ["Free setup", "Auto triggers", "2k free/mo"],
        description: "Pushes dashboard alerts to inboxes. Auto-emails for attendance warnings, exam schedules, and performance reports.",
        features: [
          { icon: "⚙️", name: "Trigger-Based Rules", desc: "Email parents automatically if attendance drops below 75%." },
          { icon: "🎨", name: "Branded Templates", desc: "Emails look professional with your institution identity." },
        ],
        isFreeSetup: true
      },
      {
        id: "mod-sms",
        name: "SMS Notifications",
        tagline: "Instant SMS alerts to parents — reaches any phone, no internet needed.",
        price: 0,
        icon: "📱",
        tags: ["Free setup", "No data needed", "Parent alerts"],
        description: "Most reliable communication in areas with poor data. Setup is free; pay ₹0.59 per SMS sent.",
        features: [
          { icon: "✅", name: "Attendance SMS", desc: "Notify parents instantly if a student is marked absent." },
          { icon: "💰", name: "Fee Due Reminders", desc: "Reduce defaulters with automated periodic SMS alerts." },
        ],
        isFreeSetup: true
      }
    ]
  },
  {
    name: "Management & HR",
    icon: "📂",
    modules: [
      {
        id: "mod-doc",
        name: "Document Management System",
        tagline: "Store and organize all institutional documents digitally.",
        price: 7999,
        icon: "📂",
        tags: ["Secure storage", "Role access", "Quick search"],
        description: "A centralized digital filing system. Upload once, search anywhere. Perfect for accreditation audits and student records.",
        features: [
          { icon: "📁", name: "Organized Folders", desc: "Categorize by student records, staff contracts, and policies." },
          { icon: "🔐", name: "Access Control", desc: "Control viewing rights per role (Admin, Principal, Clerk)." },
        ],
      },
      {
        id: "mod-par",
        name: "Parent Portal",
        tagline: "Separate login for parents to track their child\\'s performance daily.",
        price: 3999,
        icon: "👨‍👩‍👧",
        tags: ["Live attendance", "Marks visibility", "Fee status"],
        description: "Transparency for families. Parents check attendance, marks, and pending fees from their own mobile dashboard.",
        features: [
          { icon: "✅", name: "Attendance View", desc: "Daily visibility into whether the child attended classes." },
          { icon: "📩", name: "Teacher Messaging", desc: "Direct gateway for parents to communicate with teachers." },
        ],
      },
      {
        id: "mod-hr",
        name: "HR & Payroll System",
        tagline: "Manage staff salaries, leaves, and records digitally.",
        price: 9999,
        icon: "💼",
        tags: ["Salary mgmt", "Leave tracking", "Payslips"],
        description: "Process monthly payroll with allowances and deductions. Maintain employment history and digital HR folders.",
        features: [
          { icon: "💰", name: "Salary Structure", desc: "Automatic calculation based on HRA, DA, and attendance." },
          { icon: "🧾", name: "Digital Payslips", desc: "Generate and email formatted monthly salary slips." },
        ],
      }
    ]
  },
  {
    name: "Advanced Ecosystem",
    icon: "🚀",
    modules: [
      {
        id: "mod-ai",
        name: "AI-Based Insights",
        tagline: "Predict failures and identify at-risk students automatically.",
        price: 9999,
        icon: "🤖",
        tags: ["Failure prediction", "Smart alerts", "Pattern analysis"],
        description: "Uses machine learning to analyze attendance and mark trends to warn of potential student dropouts or failures.",
        features: [
          { icon: "🔮", name: "Risk Prediction", desc: "Flags at-risk students weeks before examinations occur." },
          { icon: "🎯", name: "Actionable Tips", desc: "Specific coaching recommendations for each flagged student." },
        ],
      },
      {
        id: "mod-passion",
        name: "AI Student Passion Finder",
        tagline: "Discover student's true potential based on their performance.",
        price: 5999,
        icon: "✨",
        tags: ["AI Discovery", "Career guidance", "Performance-based"],
        description: "An AI engine that analyzes a student's marks and engagement across different subjects to identify their natural areas of strength and passion.",
        features: [
          { icon: "💡", name: "Strength Mapping", desc: "Identify subjects where the student naturally excels beyond just grades." },
          { icon: "🚀", name: "Career Recommendations", desc: "Provide personalized career path suggestions based on student profile." },
        ],
      },
      {
        id: "mod-predict",
        name: "Predictive Performance Tracking",
        tagline: "Track and predict student performance using historical data.",
        price: 5999,
        icon: "📈",
        tags: ["Performance prediction", "Data analytics", "Early warning"],
        description: "Analyze student marks and attendance patterns to predict future performance. Identify struggling students early to provide timely support.",
        features: [
          { icon: "📉", name: "Trend Analysis", desc: "Visualize student progress over semesters and identify patterns." },
          { icon: "🎯", name: "Target Setting", desc: "Set performance goals for students and track achievement." },
        ],
      },
      {
        id: "mod-game",
        name: "LMS Gamification",
        tagline: "Boost engagement with badges, points, and leaderboards.",
        price: 9999,
        icon: "🎮",
        tags: ["Engagement", "Badges", "Leaderboards"],
        description: "Turn learning into a fun experience. Reward students with badges and points for completing lessons, and display top performers on leaderboards.",
        features: [
          { icon: "🏆", name: "Dynamic Leaderboards", desc: "Real-time rankings based on course progress and quiz scores." },
          { icon: "🏅", name: "Digital Badges", desc: "Award badges for milestones like 'Weekly Top Learner' or 'Quiz Master'." },
        ],
      },
      {
        id: "mod-lang",
        name: "Multi-language Support",
        tagline: "Available in Hindi, English, and regional languages.",
        price: 999,
        icon: "🌐",
        tags: ["Localization", "Accessibility", "Regional reach"],
        description: "Make your LMS accessible to everyone. Allow students and staff to switch the interface language to their preferred choice.",
        features: [
          { icon: "🗣️", name: "Language Switcher", desc: "Instant toggle between supported languages on all portals." },
          { icon: "📝", name: "Local Content Support", desc: "Support for uploading and viewing regional language study materials." },
        ],
      },
      {
        id: "mod-app",
        name: "Mobile App (Android + iOS)",
        tagline: "Branded Play Store & App Store apps for your institution.",
        price: 74999,
        icon: "📱",
        tags: ["Android & iOS", "Branded app", "Push alerts"],
        description: "Your institution on every mobile screen. Native apps for both Android and iOS with push notifications and offline mode.",
        features: [
          { icon: "🍎", name: "iOS App Store", desc: "Full publishing on the Apple App Store with your name." },
          { icon: "🤖", name: "Android Play Store", desc: "Full publishing on Google Play Store with your branding." },
          { icon: "⚡", name: "Custom Build", desc: "Final pricing depends on specific custom requirements and build scale." },
        ],
      },
      {
        id: "mod-ai-avatar",
        name: "Custom AI Avatar Chatbot",
        tagline: "Intelligent AI assistant with avatar for 24/7 student support.",
        price: 30000,
        icon: "🤖",
        tags: ["AI Assistant", "Avatar Chat", "Admissions support"],
        description: "A custom-trained AI chatbot for your institution. Handles admissions queries, general FAQs, and guides students 24/7 with a personalized institutional avatar.",
        features: [
          { icon: "✨", name: "Custom Avatar", desc: "A unique 3D/2D avatar representing your institution digitally." },
          { icon: "🎓", name: "Knowledge Training", desc: "Trained on your specific courses, fees, and rules." },
          { icon: "💬", name: "Lead Capturing", desc: "Collects student details from potential leads automatically." },
        ],
      },
      {
        id: "mod-site",
        name: "College Website",
        tagline: "Professional, mobile-responsive website for your institution.",
        price: 20000,
        icon: "🌐",
        tags: ["SEO ready", "Custom design", "Mobile friendly"],
        description: "A complete institutional website with About Us, Courses, Admissions, and Gallery pages. Fully integrated with your LMS for seamless student login.",
        features: [
          { icon: "🎨", name: "Custom Design", desc: "Branded to match your institution identity and colors." },
          { icon: "🔍", name: "SEO Optimized", desc: "Built to appear in search results for local admissions." },
          { icon: "🎁", name: "Special Offer", desc: "Get this absolutely FREE if your total order exceeds ₹1,00,000." },
        ],
      }
    ]
  }
];

const ERP_OPTIONS = [
  { 
    id: "basic", 
    name: "Billing & ERP (Basic)", 
    price: 5000, 
    desc: "Standard billing & receipts without tax compliance.", 
    features: ["Invoice generation", "Fee receipts", "Income ledgers"] 
  },
  { 
    id: "gst", 
    name: "Billing & ERP (GST Ready)", 
    price: 10000, 
    desc: "Professional GST invoicing and monthly tax summary reports.", 
    features: ["Everything in Basic", "CGST/SGST/IGST support", "CA-ready reports"] 
  }
];

const PORTALS_CONTENT = {
  student: [
    { icon: "📊", name: "Personal Dashboard", desc: "Overview of attendance, assignments, and school notices." },
    { icon: "📚", name: "Course Access", desc: "Access study materials, PDFs, and notes uploaded by teachers." },
    { icon: "🗓️", name: "Attendance Check", desc: "Track subject-wise attendance percentage in real-time." },
    { icon: "📝", name: "Assignment View", desc: "See pending tasks, deadlines, and teacher feedback." }
  ],
  teacher: [
    { icon: "📤", name: "Content Upload", desc: "Post study materials, syllabi, and video links seamlessly." },
    { icon: "📝", name: "Assignment Creation", desc: "Assign tasks with due dates and track student progress." },
    { icon: "✅", name: "Attendance Marking", desc: "Quick mobile-friendly attendance for every class session." },
    { icon: "📊", name: "Marks Entry", desc: "Enter student grades and assessments directly into reports." }
  ],
  admin: [
    { icon: "👨‍🎓", name: "Student Management", desc: "Add, edit, or remove student records across departments." },
    { icon: "👩‍🏫", name: "Staff Control", desc: "Manage teacher subjects and portal access levels." },
    { icon: "🔐", name: "Role Assignment", desc: "Set who can access what features based on their job role." },
    { icon: "🏛️", name: "Institution Overview", desc: "High-level dashboard for enrollment and system health." }
  ],
  staff: [
    { icon: "📁", name: "Record Maintenance", desc: "Update student addresses, guardian info, and documents." },
    { icon: "💳", name: "Fee Logging", desc: "Manually log offline cash payments into the ledger." },
    { icon: "📄", name: "Document Store", desc: "Central vault for ID proofs and enrollment forms." },
    { icon: "🗄️", name: "Data Entry", desc: "General administrative tools for school operations." }
  ]
};

// --- COMPONENT ---

const LMSBuilder = () => {
  const [selectedModules, setSelectedModules] = useState<Set<string>>(new Set());
  const [erpMode, setErpMode] = useState<"none" | "basic" | "gst">("none");
  const [openDetails, setOpenDetails] = useState<Set<string>>(new Set());
  const [activePortal, setActivePortal] = useState<keyof typeof PORTALS_CONTENT>("student");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: "",
    phone: "",
    institution: "",
    type: "",
    students: ""
  });

  // Calculate Total
  const calculateTotal = () => {
    let subtotal = BASE_PRICE;
    let websiteCost = 0;
    let hasWebsite = selectedModules.has("mod-site");

    MODULE_CATEGORIES.forEach(cat => {
      cat.modules.forEach(m => {
        if (selectedModules.has(m.id)) {
          if (m.id === "mod-site") {
            websiteCost = m.price;
          } else {
            subtotal += m.price;
          }
        }
      });
    });
    
    if (erpMode === "basic") subtotal += 5000;
    if (erpMode === "gst") subtotal += 10000;

    // Rule: Website is free if subtotal (everything else) >= 100,000
    if (hasWebsite) {
      if (subtotal >= 100000) {
        websiteCost = 0;
      }
      return subtotal + websiteCost;
    }
    
    return subtotal;
  };

  const total = calculateTotal();
  const formatINR = (n: number) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);

  const toggleModule = (id: string) => {
    setSelectedModules(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleDetail = (id: string) => {
    setOpenDetails(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleClearAll = () => {
    setSelectedModules(new Set());
    setErpMode("none");
  };

  const currentSelectionNames = () => {
    const names: string[] = [];
    MODULE_CATEGORIES.forEach(cat => {
      cat.modules.forEach(m => {
        if (selectedModules.has(m.id)) names.push(m.name);
      });
    });
    if (erpMode === "basic") names.push("Billing & ERP (Basic)");
    if (erpMode === "gst") names.push("Billing & ERP (GST)");
    return names;
  };

  const handleRequestQuote = (mode: "wa" | "call") => {
    if (!form.name || !form.phone) {
      toast.error("Please enter your name and phone number.");
      return;
    }

    setSubmitting(true);
    const selection = currentSelectionNames();
    const modulesText = selection.length ? selection.join("\\n  · ") : "  Core platform only";
    
    const recurringFee = selectedModules.size >= 5 ? 24999 : 14999;
    
    if (mode === "wa") {
      const msg = encodeURIComponent(
        `🎓 *VAW Technologies – LMS Build Request*\n\n` +
        `👤 Name: ${form.name}\n` +
        `📞 Phone: ${form.phone}\n` +
        `🏫 Institution: ${form.institution || "N/A"}\n` +
        `🏷 Type: ${form.type || "N/A"}\n` +
        `👨‍🎓 Students: ${form.students || "N/A"}\n\n` +
        `📦 *Core Platform:* ₹52,000\n` +
        `➕ *Add-ons selected:*\\n  · ${modulesText}\n\n` +
        `💰 *One-Time Setup: ${formatINR(total)}*\n` +
        `🛡️ *Yearly Maintenance: ${formatINR(recurringFee)}/yr*\n\n` +
        `Please help me get started. Thank you!`
      );
      window.open(`https://wa.me/919999999999?text=${msg}`, "_blank");
    } else {
      window.open("tel:+919999999999");
    }

    setTimeout(() => {
      setSubmitting(false);
      setIsModalOpen(false);
      toast.success("We\\'ll be in touch very soon!");
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-20 md:pb-0">
      <SEO title="LMS Builder – Build Your School System" description="Interactive configurator to design your institutional LMS." />
      
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200 h-16 px-4 md:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3">
          <img src="/lovable-uploads/0d3e4545-c80e-401b-82f1-3319db5155b4.png" alt="VAW Technologies" className="h-8" />
          <div className="hidden sm:block w-px h-6 bg-slate-200"></div>
          <span className="hidden sm:block text-xs font-bold text-slate-400 tracking-wider uppercase">LMS Builder</span>
        </Link>
        <div className="bg-blue-50 text-blue-600 text-[10px] md:text-xs font-extrabold px-3 py-1.5 rounded-full border border-blue-100 flex items-center gap-2">
           <GraduationCap className="w-3 h-3 md:w-4 md:h-4" /> SCHOOL SYSTEM CONFIGURATOR
        </div>
      </header>

      {/* HERO */}
      <section className="bg-white border-b border-slate-200 py-12 px-6 text-center space-y-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-radial-at-t from-blue-50/50 to-transparent pointer-events-none"></div>
        <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-600 text-[11px] font-bold px-4 py-1.5 rounded-full border border-emerald-100">
           ✨ BUILD IT YOUR WAY
        </div>
        <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-[1.1]">
          Design Your Own <span className="text-blue-600">School System</span><br className="hidden md:block" /> in Minutes
        </h1>
        <p className="text-slate-500 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
          Pick the tools your institution actually needs. Read what each feature does. See your price live — then we\\'ll build it for you.
        </p>
        <div className="flex flex-wrap justify-center gap-2 pt-2">
          {[
            { n: 1, t: "Explore core" },
            { n: 2, t: "Pick add-ons" },
            { n: 3, t: "Check price" },
            { n: 4, t: "Launch system" },
          ].map(s => (
            <div key={s.n} className="bg-slate-50 border border-slate-200 rounded-full px-4 py-2 flex items-center gap-2 text-xs font-bold text-slate-600">
              <span className="w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px]">{s.n}</span>
              {s.t}
            </div>
          ))}
        </div>
      </section>

      <div className="max-w-6xl mx-auto p-4 md:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
          
          {/* LEFT COLUMN */}
          <div className="space-y-8">
            
            {/* STEP 1: CORE */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center text-xl">🧱</div>
                <div>
                  <h3 className="text-base font-bold">Step 1 — What\\'s always included (Core Platform)</h3>
                   <p className="text-xs text-slate-400">Foundation of your system. Every institution gets this.</p>
                </div>
              </div>
              <div className="p-6">
                <div className="bg-slate-900 rounded-2xl p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full"></div>
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 relative z-10">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        VAW Core LMS Platform
                      </h3>
                      <p className="text-sm text-slate-400 max-w-md leading-relaxed">
                        A fully working digital school — four portals for students, teachers, admins, and staff. Everything communicates in one place.
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-mono font-bold text-amber-200">{formatINR(BASE_PRICE)}</div>
                      <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">ONE-TIME SETUP · NO RECURRING FEE</div>
                    </div>
                  </div>

                  {/* PORTAL TABS */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {(Object.keys(PORTALS_CONTENT) as Array<keyof typeof PORTALS_CONTENT>).map(p => (
                      <button
                        key={p}
                        onClick={() => setActivePortal(p)}
                        className={`px-4 py-2 rounded-full text-xs font-bold transition-all border ${
                          activePortal === p 
                            ? "bg-white/10 border-white/30 text-white" 
                            : "bg-white/5 border-white/10 text-slate-400 hover:text-white hover:bg-white/10"
                        }`}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)} Portal
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                    {PORTALS_CONTENT[activePortal].map((f, i) => (
                      <div key={i} className="bg-white/5 border border-white/5 p-4 rounded-xl space-y-2">
                        <div className="text-xl">{f.icon}</div>
                        <h4 className="text-xs font-bold text-slate-200">{f.name}</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">{f.desc}</p>
                      </div>
                    ))}
                  </div>

                  <div className="mt-8 pt-6 border-t border-white/10">
                    <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4">PLATFORM INFRASTRUCTURE INCLUDED</div>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { ico: <ShieldCheck className="w-3 h-3"/>, t: "Secure Auth" },
                        { ico: <Layout className="w-3 h-3"/>, t: "Mobile Ready" },
                        { ico: <Database className="w-3 h-3"/>, t: "Central Database" },
                        { ico: <Users className="w-3 h-3"/>, t: "Role Access" },
                        { ico: <Bell className="w-3 h-3"/>, t: "Notifications" },
                        { ico: <Globe className="w-3 h-3"/>, t: "Web-Based" },
                      ].map((tag, i) => (
                        <span key={i} className="bg-white/5 text-slate-300 text-[10px] font-bold px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5">
                          {tag.ico} {tag.t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* STEP 2: ADD-ONS */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl overflow-hidden">
               <div className="p-5 border-b border-slate-100 flex items-center gap-4 bg-slate-50/50">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center text-xl">➕</div>
                <div>
                  <h3 className="text-base font-bold">Step 2 — Add modules your institution needs</h3>
                   <p className="text-xs text-slate-400">Tap modules to include them. Price updates live.</p>
                </div>
              </div>
              <div className="p-6 space-y-12">
                {MODULE_CATEGORIES.map((cat, i) => (
                  <div key={i} className="space-y-4">
                    <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-[2px] mb-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-100">
                      {cat.icon} {cat.name}
                    </div>
                    <div className="grid grid-cols-1 gap-3">
                      {cat.modules.map(mod => (
                        <div 
                          key={mod.id} 
                          className={`group border-2 rounded-2xl overflow-hidden transition-all duration-200 ${
                            selectedModules.has(mod.id) 
                              ? "border-blue-600 bg-white shadow-md" 
                              : "border-slate-100 bg-white hover:border-slate-200"
                          }`}
                        >
                          <div 
                            className="p-5 flex items-start gap-4 cursor-pointer select-none"
                            onClick={() => toggleModule(mod.id)}
                          >
                            <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-110 transition-transform">
                              {mod.icon}
                            </div>
                            <div className="flex-1 space-y-1">
                              <h4 className="text-sm font-bold leading-tight">{mod.name}</h4>
                              <p className="text-xs text-slate-500 leading-relaxed max-w-lg">{mod.tagline}</p>
                              <div className="flex flex-wrap gap-1.5 pt-1">
                                {mod.tags.map(t => (
                                  <span key={t} className="text-[9px] font-bold text-slate-400 bg-slate-50 px-2.5 py-1 rounded-full">{t}</span>
                                ))}
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                              <div className="font-mono text-sm font-bold">
                                {mod.price > 0 ? formatINR(mod.price) : <span className="text-emerald-500">Free Setup</span>}
                              </div>
                              <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                                selectedModules.has(mod.id) 
                                  ? "bg-blue-600 border-blue-600 text-white" 
                                  : "bg-white border-slate-200 text-transparent"
                              }`}>
                                <Check className="w-4 h-4" />
                              </div>
                              <div className={`text-[10px] font-bold px-3 py-1 rounded-full transition-all ${
                                selectedModules.has(mod.id) 
                                  ? "bg-emerald-50 text-emerald-600" 
                                  : "bg-blue-50 text-blue-600"
                              }`}>
                                {selectedModules.has(mod.id) ? "✓ Added" : "Add"}
                              </div>
                            </div>
                          </div>
                          
                          <button 
                            onClick={() => toggleDetail(mod.id)}
                            className={`w-full py-3 px-6 border-t border-slate-50 text-left text-[11px] font-bold flex items-center gap-2 transition-all ${
                              openDetails.has(mod.id) ? "bg-slate-50 text-blue-600" : "text-slate-400 hover:text-blue-600"
                            }`}
                          >
                            <ChevronDown className={`w-3 h-3 transition-transform ${openDetails.has(mod.id) ? "rotate-180" : ""}`} />
                            {openDetails.has(mod.id) ? "Hide Details" : "What does this do?"}
                          </button>

                          {openDetails.has(mod.id) && (
                            <div className="p-6 border-t border-slate-50 bg-slate-50/30 space-y-6 animate-in slide-in-from-top-2 duration-300">
                              <p className="text-xs text-slate-600 leading-relaxed">{mod.description}</p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {mod.features.map((feat, idx) => (
                                  <div key={idx} className="bg-white border border-slate-100 p-4 rounded-xl space-y-1.5 shadow-sm">
                                    <div className="text-base">{feat.icon}</div>
                                    <h5 className="text-[11px] font-bold">{feat.name}</h5>
                                    <p className="text-[10px] text-slate-400 leading-relaxed">{feat.desc}</p>
                                  </div>
                                ))}
                              </div>
                              {mod.perfectFor && (
                                <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl">
                                  <div className="text-[9px] font-bold text-blue-600 uppercase tracking-widest mb-1">PERFECT FOR</div>
                                  <p className="text-xs text-slate-600">{mod.perfectFor}</p>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* ERP MODULE */}
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-[10px] font-extrabold text-slate-400 uppercase tracking-[2px] mb-2 after:content-[''] after:flex-1 after:h-px after:bg-slate-100">
                    🧾 Billing & ERP
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                    <div className={`border-2 rounded-2xl overflow-hidden transition-all duration-200 ${erpMode !== "none" ? "border-amber-400" : "border-slate-100"}`}>
                      <div className="p-5 flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-50 flex items-center justify-center text-2xl">🧾</div>
                        <div className="flex-1 space-y-1 mt-1">
                           <h4 className="text-sm font-bold">Billing, Receipts & ERP Module</h4>
                           <p className="text-xs text-slate-500 leading-relaxed max-w-lg">Complete financial oversight for your institution. Generate invoices and track net income.</p>
                        </div>
                        {erpMode !== "none" && (
                           <button onClick={() => setErpMode("none")} className="text-[10px] font-bold text-slate-400 underline p-1">✕ Remove</button>
                        )}
                      </div>
                      
                      <div className="px-6 pb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                        {ERP_OPTIONS.map(opt => (
                          <div 
                            key={opt.id}
                            onClick={() => setErpMode(opt.id as any)}
                            className={`relative cursor-pointer border-2 rounded-xl p-4 transition-all ${
                              erpMode === opt.id 
                                ? "border-amber-400 bg-amber-50" 
                                : "border-slate-100 bg-slate-50/50 hover:border-slate-200"
                            }`}
                          >
                            <div className={`absolute top-4 right-4 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                              erpMode === opt.id ? "bg-amber-500 border-amber-500 text-white" : "border-slate-300"
                            }`}>
                              {erpMode === opt.id && <div className="w-2 h-2 bg-white rounded-full"></div>}
                            </div>
                            <div className="space-y-2">
                              <h5 className="text-xs font-bold leading-tight pr-8">{opt.name}</h5>
                              <p className="text-[10px] text-slate-500 leading-relaxed mb-3">{opt.desc}</p>
                              <div className="space-y-1">
                                {opt.features.map(f => (
                                  <div key={f} className="flex items-center gap-1.5 text-[9px] font-bold text-emerald-600">
                                    <Check className="w-2.5 h-2.5" /> {f}
                                  </div>
                                ))}
                              </div>
                              <div className="pt-2 font-mono text-sm font-bold text-slate-900">{formatINR(opt.price)}</div>
                            </div>
                          </div>
                        ))}
                      </div>

                      <button 
                        onClick={() => toggleDetail("erp-det")}
                        className={`w-full py-3 px-6 border-t border-slate-50 text-left text-[11px] font-bold flex items-center gap-2 transition-all ${
                          openDetails.has("erp-det") ? "bg-slate-50 text-blue-600" : "text-slate-400 hover:text-blue-600"
                        }`}
                      >
                        <ChevronDown className={`w-3 h-3 transition-transform ${openDetails.has("erp-det") ? "rotate-180" : ""}`} />
                        {openDetails.has("erp-det") ? "Hide Details" : "What does this do?"}
                      </button>
                      {openDetails.has("erp-det") && (
                         <div className="p-6 border-t border-slate-50 bg-slate-50/30 text-xs text-slate-600 leading-relaxed animate-in slide-in-from-top-2">
                            This module adds a professional Billing and ERP layer. Instead of just tracking fees, you get a full institution-wide financial ledger. The GST version adds full tax compliance for intra-state (CGST/SGST) and inter-state (IGST) billing, suitable for registered institutions.
                         </div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* RIGHT COLUMN — SIDEBAR */}
          <div className="hidden lg:block relative">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white border-2 border-slate-200 rounded-3xl shadow-xl shadow-blue-900/5 overflow-hidden">
                <div className="p-5 bg-slate-900 text-white">
                  <h3 className="text-sm font-bold">Your System Summary</h3>
                  <p className="text-[10px] text-slate-400">Updates live as you configure</p>
                </div>
                <div className="p-6 space-y-5">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-500 flex items-center gap-2">🧱 Core Platform</span>
                    <span>{formatINR(BASE_PRICE)}</span>
                  </div>

                  <div className="space-y-3">
                    <div className="text-[9px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">Add-ons selected</div>
                    <div className="space-y-3 min-h-[40px]">
                      {selectedModules.size === 0 && erpMode === "none" ? (
                        <p className="text-[11px] text-slate-400 italic text-center py-4">Tap modules to add them ↑</p>
                      ) : (
                        <>
                          {MODULE_CATEGORIES.map(cat => cat.modules.filter(m => selectedModules.has(m.id)).map(m => {
                            let displayPrice = m.price;
                            if (m.id === "mod-site") {
                              // Re-calculate subtotal for display logic
                              let currentSub = BASE_PRICE;
                              MODULE_CATEGORIES.forEach(c => c.modules.forEach(mod => {
                                if (selectedModules.has(mod.id) && mod.id !== "mod-site") currentSub += mod.price;
                              }));
                              if (erpMode === "basic") currentSub += 5000;
                              if (erpMode === "gst") currentSub += 10000;
                              if (currentSub >= 100000) displayPrice = 0;
                            }
                            return (
                              <div key={m.id} className="flex justify-between items-start gap-4 text-[11px] animate-in slide-in-from-top-1">
                                <span className="font-bold flex-1 leading-snug">{m.name}</span>
                                <span className="font-mono font-bold text-emerald-600">
                                  {displayPrice > 0 ? `+${formatINR(displayPrice)}` : "FREE"}
                                </span>
                              </div>
                            );
                          }))}
                          {erpMode !== "none" && (
                             <div className="flex justify-between items-start gap-4 text-[11px] animate-in slide-in-from-top-1">
                              <span className="font-bold flex-1 leading-snug">Billing & ERP ({erpMode === 'gst' ? 'GST' : 'Basic'})</span>
                              <span className="font-mono font-bold text-emerald-600">+{formatINR(erpMode === 'gst' ? 10000 : 5000)}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <div className="pt-5 border-t-2 border-dashed border-slate-100 space-y-1">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-extrabold">Your Total</span>
                      <span className="text-2xl font-mono font-extrabold text-slate-900">{formatINR(total)}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold">
                      {selectedModules.size + (erpMode !== "none" ? 1 : 0) === 0 ? "Building only Core Foundation" : `Core + ${selectedModules.size + (erpMode !== "none" ? 1 : 0)} Module Selection`}
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      🛡️ Yearly Recurring Fee
                    </div>
                    <div className="space-y-2">
                       <div className="flex justify-between items-center text-[11px]">
                          <span className="text-slate-600">Base Maintenance</span>
                          <span className="font-bold">₹14,999/yr</span>
                       </div>
                       <div className={`flex justify-between items-center text-[11px] transition-all ${selectedModules.size >= 5 ? "text-blue-600 font-bold border-t border-slate-100 pt-2" : "text-slate-400"}`}>
                          <span>With 5+ Add-ons</span>
                          <span>₹24,999/yr</span>
                       </div>
                    </div>
                    <p className="text-[9px] text-slate-400 border-t border-slate-100 pt-2 italic leading-tight">
                       *Includes hosting, tech support, and basic updates.
                    </p>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Button 
                      className="w-full h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2 shadow-lg shadow-emerald-500/20"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <MessageSquare className="w-4 h-4" /> Chat on WhatsApp
                    </Button>
                    <Button 
                      variant="outline" 
                      className="w-full h-11 rounded-xl border-slate-200 font-bold gap-2"
                      onClick={() => setIsModalOpen(true)}
                    >
                      <PhoneCall className="w-3.5 h-3.5" /> Request a Callback
                    </Button>
                    <button 
                      onClick={handleClearAll}
                      className="w-full text-center text-[10px] font-bold text-slate-400 hover:text-red-500 transition-colors py-2"
                    >
                      ✕ Clear my selections
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-2xl z-40 lg:hidden">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <div className="space-y-0.5">
            <div className="text-lg font-mono font-extrabold tracking-tight">{formatINR(total)}</div>
            <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase">CORE + {selectedModules.size + (erpMode !== "none" ? 1 : 0)} ADD-ONS</div>
          </div>
          <Button 
            className="rounded-xl px-6 h-11 bg-emerald-500 font-bold gap-2"
            onClick={() => setIsModalOpen(true)}
          >
             📲 Get Quote
          </Button>
        </div>
      </div>

      {/* MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setIsModalOpen(false)}></div>
          
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-[540px] max-h-[90vh] overflow-hidden flex flex-col relative z-70 animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center flex-shrink-0">
               <div className="space-y-0.5">
                 <h3 className="text-lg font-bold">Let\\'s Build Your System</h3>
                 <p className="text-xs text-slate-400">Confirm your selection and our experts will reach out.</p>
               </div>
               <button 
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20"
               >
                 <X className="w-4 h-4" />
               </button>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 md:p-8 overflow-y-auto space-y-6 flex-1 text-slate-900">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="m-name" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Your Name</Label>
                  <Input 
                    id="m-name" 
                    placeholder="e.g. Dr. K.S. Rao" 
                    className="bg-slate-50 border-slate-100 rounded-xl"
                    value={form.name}
                    onChange={(e) => setForm({...form, name: e.target.value})}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="m-phone" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">WhatsApp / Phone</Label>
                  <Input 
                    id="m-phone" 
                    placeholder="+91 99999 00000" 
                    className="bg-slate-50 border-slate-100 rounded-xl"
                    value={form.phone}
                    onChange={(e) => setForm({...form, phone: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="m-inst" className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">School / Institution Name</Label>
                <Input 
                  id="m-inst" 
                  placeholder="e.g. Heritage International School" 
                  className="bg-slate-50 border-slate-100 rounded-xl"
                  value={form.institution}
                  onChange={(e) => setForm({...form, institution: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 text-slate-900">
                   <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Institution Type</Label>
                   <Select onValueChange={(val) => setForm({...form, type: val})}>
                     <SelectTrigger className="bg-slate-50 border-slate-100 rounded-xl text-slate-900">
                       <SelectValue placeholder="Select type..." />
                     </SelectTrigger>
                     <SelectContent className="text-slate-900 bg-white">
                        <SelectItem value="school">School (K-12)</SelectItem>
                        <SelectItem value="college">College / University</SelectItem>
                        <SelectItem value="coaching">Coaching Center</SelectItem>
                        <SelectItem value="other">Other Institute</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
                <div className="space-y-1.5 text-slate-900">
                   <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Students Count</Label>
                   <Select onValueChange={(val) => setForm({...form, students: val})}>
                     <SelectTrigger className="bg-slate-50 border-slate-100 rounded-xl text-slate-900">
                       <SelectValue placeholder="Approx count..." />
                     </SelectTrigger>
                     <SelectContent className="text-slate-900 bg-white">
                        <SelectItem value="200">Below 200</SelectItem>
                        <SelectItem value="500">200 – 500</SelectItem>
                        <SelectItem value="1000">500 – 1,000</SelectItem>
                        <SelectItem value="3000">1,000 – 3,000</SelectItem>
                        <SelectItem value="above">3,000+</SelectItem>
                     </SelectContent>
                   </Select>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-4">
                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Selected Configuration</div>
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-[11px] font-bold">
                    <span>🧱 Core LMS Platform</span>
                    <span>{formatINR(52000)}</span>
                  </div>
                  {currentSelectionNames().map((name, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px] text-slate-500 font-bold">
                       <span className="flex items-center gap-2 italic">➕ {name}</span>
                       <span className="text-emerald-600">Included</span>
                    </div>
                  ))}
                  <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                     <span className="text-xs font-extrabold">Estimated Total</span>
                     <span className="text-xl font-mono font-extrabold">{formatINR(total)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <Button 
                  className="h-12 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold gap-2"
                  onClick={() => handleRequestQuote("wa")}
                  disabled={submitting}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                   WhatsApp 
                </Button>
                <Button 
                  variant="outline" 
                  className="h-12 rounded-xl border-slate-200 font-bold gap-2"
                  onClick={() => handleRequestQuote("call")}
                  disabled={submitting}
                >
                   Call Me Back
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="py-8 text-center text-[11px] text-slate-400 font-medium">
         © 2025 <strong>VAW Technologies</strong> · We build your system, you run your institution.
      </footer>
    </div>
  );
};

export default LMSBuilder;
