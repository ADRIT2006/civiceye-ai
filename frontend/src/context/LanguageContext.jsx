import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Brand & Workspace
    appName: 'CivicEye',
    appSubtitle: 'Civic Accountability',
    citizenWorkspace: 'Citizen Grievance Workspace',
    workerWorkspace: 'Maintenance Crew Workspace',
    adminWorkspace: 'Command Center Workspace',
    residentBadge: 'Resident',
    fieldOpsBadge: 'Field Ops',
    authorityBadge: 'Authority',

    // Navigation
    navDashboard: 'Dashboard',
    navReportIssue: 'Report an Issue',
    navCivicMap: 'Civic Map',
    navMyReports: 'My Reports',
    navMyCredits: 'Civic Credit Points',
    navAiCopilot: 'AI Copilot',
    navEmergencyHelp: 'Emergency Help',
    navNotifications: 'Notifications',
    navProfile: 'Profile',
    navWorkerDashboard: 'Worker Dashboard',
    navAssignedIssues: 'Assigned Issues',
    navPriorityJobs: 'Priority Jobs',
    navWorkerMap: 'Navigation / Map',
    navSubmitRepair: 'Submit Repair',
    navRepairHistory: 'Repair History',
    navEmergencyAssignments: 'Emergency Assignments',
    navCommandCenter: 'Command Center',
    navAllComplaints: 'All Issues',
    navWardMap: 'Ward Map',
    navWorkers: 'Workers',
    navAssignments: 'Assignments',
    navEscalations: 'Escalations',
    navAiReview: 'AI Review',
    navCompletedWorks: 'Completed Works',
    navAiReportGenerator: 'AI Report Generator',
    navAnalytics: 'Analytics',
    navMunicipalContacts: 'Municipal Contacts',
    navAuditLogs: 'Audit Logs',
    navSettings: 'Settings',

    // Header & Actions
    searchPlaceholder: 'Search tickets (e.g. CIV-2026-0007, pothole)...',
    emergency112: 'EMERGENCY 112',
    allWardsCitywide: 'All Wards (Citywide)',
    viewingAsCitizen: 'Viewing as Citizen',
    viewingAsWorker: 'Viewing as Municipal Worker',
    viewingAsAdmin: 'Viewing as Admin',

    // Buttons
    btnReportIssue: 'Report an Issue',
    btnEmergencyHelp: '🚨 EMERGENCY HELP',
    btnSubmit: 'Submit',
    btnCancel: 'Cancel',
    btnBack: 'Back',
    btnConfirm: 'Confirm',
    btnStartWork: 'Start Work Order',
    btnUploadEvidence: 'Upload Evidence',
    btnGenerateReport: 'GENERATE REPORT',
    btnPreviewReport: 'Preview Report',
    btnDownloadPdf: 'Download PDF',
    btnPrint: 'Print',
    btnStoreReport: 'Store Report',
    btnApprove: 'Approve & Resolve',
    btnReject: 'Reject & Re-work',
    btnReopen: 'Reopen Ticket',
    btnEscalate: 'Escalate Now',
    btnAssignWorker: 'Assign Worker',
    btnSupportExisting: 'YES, SUPPORT EXISTING ISSUE',
    btnReportSeparately: 'NO, REPORT SEPARATELY',
    btnUseDraft: 'Use this Draft in Report',
    btnDetectGps: 'Detect Current GPS',

    // Statuses
    statusReported: 'Reported',
    statusAcknowledged: 'Acknowledged',
    statusInProgress: 'In Progress',
    statusRepairSubmitted: 'Repair Submitted',
    statusCommunityVerification: 'Community Verification',
    statusResolved: 'Resolved',
    statusEscalated: 'Escalated',
    statusDisputed: 'Disputed',

    // Priorities
    priorityCritical: 'Critical',
    priorityHigh: 'High',
    priorityMedium: 'Medium',
    priorityLow: 'Low',

    // Categories
    catPothole: 'Pothole',
    catBrokenStreetlight: 'Broken Streetlight',
    catOpenDrain: 'Open Drain',
    catGarbage: 'Garbage',
    catWaterLeakage: 'Water Leakage',
    catRoadDamage: 'Road Damage',
    catCriticalHazard: 'Critical Public Hazard',
    catOther: 'Other Infrastructure',

    // Citizen Dashboard
    citizenWelcome: 'Welcome back',
    citizenSubtitle: 'Level 3 Civic Verifier • Active neighborhood participant',
    cardMyActiveReports: 'My Active Reports',
    cardMyResolved: 'My Resolved',
    cardConfirmedCredits: 'Confirmed Credits',
    cardPendingCredits: 'Pending Credits',
    quickReportTitle: 'Report a Civic Problem in 60 Seconds',
    quickReportDesc: 'Drop a pin on your map. CivicEye AI detects your municipal ward, checks for nearby duplicates privately, and starts the 48-hour statutory SLA.',
    myRecentReports: 'My Recent Reports',
    noReportsYet: 'You have not submitted any complaints yet.',

    // Worker Dashboard
    workerAssignedTitle: 'Work Orders Assigned to You',
    workerSubtitle: 'Authorized field tasks and on-site remediation log',
    cardAssignedToday: 'Assigned Today',
    cardCriticalJobs: 'Critical Jobs',
    cardInProgress: 'In Progress',
    cardAwaitingVerif: 'Awaiting Verification',
    cardCompletedTotal: 'Completed Total',
    unauthorizedBanner: 'Only work orders specifically assigned to your crew appear here. Other municipal grievances are strictly isolated for departmental integrity.',

    // Admin Dashboard
    adminCommandTitle: 'Municipal Grievance Command Center',
    adminSubtitle: 'Autonomous Bureaucratic Escalation & OpenCV Fake-Fix Verification Grid',
    cardOpenComplaints: 'Total Open',
    cardUnderReview: 'AI Flagged Suspicious',
    cardEscalatedBreaches: '48h SLA Escalated',
    cardResolvedToday: 'Verified Resolved',

    // Credits
    totalCivicCredits: 'TOTAL CIVIC CREDITS',
    issuesReported: 'Issues Reported',
    issuesResolved: 'Issues Resolved',
    communityContributions: 'Community Contributions',
    creditHistory: 'Credit History',
    badgeFirstReport: 'FIRST REPORT',
    badgeCommunityHelper: 'COMMUNITY HELPER',
    badgeCivicChampion: 'CIVIC CHAMPION',
    badgeWardGuardian: 'WARD GUARDIAN',
    suspiciousReviewFlag: 'Suspicious Activity — Review Required',

    // Duplicate Detection
    duplicateTitle: 'Smart Duplicate Detection',
    existingIssueFound: 'An existing issue may already have been reported at this location.',
    approximateArea: 'Approximate Area',
    citizenReportsCount: 'Citizen Reports',
    isThisTheSameIssue: 'IS THIS THE SAME ISSUE?'
  },

  bn: {
    // Brand & Workspace
    appName: 'সিভিকআই',
    appSubtitle: 'নাগরিক দায়বদ্ধতা',
    citizenWorkspace: 'নাগরিক অভিযোগ কর্মক্ষেত্র',
    workerWorkspace: 'রক্ষণাবেক্ষণ কর্মী কর্মক্ষেত্র',
    adminWorkspace: 'কমান্ড সেন্টার কর্মক্ষেত্র',
    residentBadge: 'নাগরিক',
    fieldOpsBadge: 'মাঠ কর্মী',
    authorityBadge: 'কর্তৃপক্ষ',

    // Navigation
    navDashboard: 'ড্যাশবোর্ড',
    navReportIssue: 'সমস্যা জানান',
    navCivicMap: 'নাগরিক ম্যাপ',
    navMyReports: 'আমার অভিযোগ',
    navMyCredits: 'সিভিক ক্রেডিট পয়েন্ট',
    navAiCopilot: 'এআই কোপাইলট',
    navEmergencyHelp: 'জরুরী সহায়তা',
    navNotifications: 'বিজ্ঞপ্তি',
    navProfile: 'প্রোফাইল',
    navWorkerDashboard: 'কর্মী ড্যাশবোর্ড',
    navAssignedIssues: 'অর্পিত কাজসমূহ',
    navPriorityJobs: 'জরুরি কাজসমূহ',
    navWorkerMap: 'নেভিগেশন / ম্যাপ',
    navSubmitRepair: 'মেরামত জমা দিন',
    navRepairHistory: 'মেরামতের ইতিহাস',
    navEmergencyAssignments: 'জরুরী দায়িত্বসমূহ',
    navCommandCenter: 'কমান্ড সেন্টার',
    navAllComplaints: 'সকল অভিযোগ',
    navWardMap: 'ওয়ার্ড ম্যাপ',
    navWorkers: 'কর্মীগণ',
    navAssignments: 'দায়িত্ব বণ্টন',
    navEscalations: 'এসকেলেশন',
    navAiReview: 'এআই পর্যালোচনা',
    navCompletedWorks: 'সম্পন্ন কাজসমূহ',
    navAiReportGenerator: 'এআই রিপোর্ট জেনারেটর',
    navAnalytics: 'বিশ্লেষণ',
    navMunicipalContacts: 'পৌর যোগাযোগ',
    navAuditLogs: 'অডিট লগ',
    navSettings: 'সেটিংস',

    // Header & Actions
    searchPlaceholder: 'অভিযোগ খুঁজুন (যেমন: CIV-2026-0007, গর্ত)...',
    emergency112: 'জরুরী ১১২',
    allWardsCitywide: 'সকল ওয়ার্ড (শহরব্যাপী)',
    viewingAsCitizen: 'নাগরিক হিসেবে দেখছেন',
    viewingAsWorker: 'পৌর কর্মী হিসেবে দেখছেন',
    viewingAsAdmin: 'প্রশাসক হিসেবে দেখছেন',

    // Buttons
    btnReportIssue: 'সমস্যা জানান',
    btnEmergencyHelp: '🚨 জরুরী সহায়তা',
    btnSubmit: 'জমা দিন',
    btnCancel: 'বাতিল',
    btnBack: 'পেছনে যান',
    btnConfirm: 'নিশ্চিত করুন',
    btnStartWork: 'কাজ শুরু করুন',
    btnUploadEvidence: 'প্রমাণ আপলোড করুন',
    btnGenerateReport: 'রিপোর্ট তৈরি করুন',
    btnPreviewReport: 'রিপোর্ট প্রাকদর্শন',
    btnDownloadPdf: 'পিডিএফ ডাউনলোড',
    btnPrint: 'প্রিন্ট করুন',
    btnStoreReport: 'সংরক্ষণ করুন',
    btnApprove: 'অনুমোদন ও সমাধান',
    btnReject: 'প্রত্যাখ্যান করুন',
    btnReopen: 'পুনরায় খুলুন',
    btnEscalate: 'তাত্ক্ষণিক এসকেলেট',
    btnAssignWorker: 'কর্মী নিয়োগ করুন',
    btnSupportExisting: 'হ্যাঁ, পূর্বের সমস্যায় সমর্থন দিন',
    btnReportSeparately: 'না, আলাদাভাবে রিপোর্ট করুন',
    btnUseDraft: 'এই খসড়া ব্যবহার করুন',
    btnDetectGps: 'বর্তমান জিপিএস শনাক্ত করুন',

    // Statuses
    statusReported: 'রিপোর্ট করা হয়েছে',
    statusAcknowledged: 'গৃহীত হয়েছে',
    statusInProgress: 'চলমান',
    statusRepairSubmitted: 'মেরামত জমা হয়েছে',
    statusCommunityVerification: 'নাগরিক যাচাইকরণ',
    statusResolved: 'সমাধান হয়েছে',
    statusEscalated: 'এসকেলেট করা হয়েছে',
    statusDisputed: 'সন্দেহজনক / বিতর্কিত',

    // Priorities
    priorityCritical: 'সংকটপূর্ণ',
    priorityHigh: 'উচ্চ',
    priorityMedium: 'মাঝারি',
    priorityLow: 'নিম্ন',

    // Categories
    catPothole: 'রাস্তার গর্ত',
    catBrokenStreetlight: 'নষ্ট বাতি',
    catOpenDrain: 'খোলা ড্রেন',
    catGarbage: 'আবর্জনা',
    catWaterLeakage: 'জল চুইয়ে পড়া',
    catRoadDamage: 'ক্ষতিগ্রস্ত সড়ক',
    catCriticalHazard: 'মারাত্মক গণঝুঁকি',
    catOther: 'অন্যান্য অবকাঠামো',

    // Citizen Dashboard
    citizenWelcome: 'স্বাগতম',
    citizenSubtitle: 'লেভেল ৩ নাগরিক যাচাইকারী • সক্রিয় প্রতিবেশী প্রতিনিধি',
    cardMyActiveReports: 'আমার চলমান অভিযোগ',
    cardMyResolved: 'আমার সমাধানকৃত',
    cardConfirmedCredits: 'নিশ্চিত ক্রেডিট',
    cardPendingCredits: 'অপেক্ষমাণ ক্রেডিট',
    quickReportTitle: '৬০ সেকেন্ডে নাগরিক সমস্যা জানান',
    quickReportDesc: 'ম্যাপে পিন ফেলে অবস্থান নির্বাচন করুন। সিভিকআই স্বয়ংক্রিয়ভাবে ওয়ার্ড শনাক্ত করবে এবং ৪৮ ঘণ্টার সংবিধিবদ্ধ এসএলএ চালু করবে।',
    myRecentReports: 'আমার সাম্প্রতিক রিপোর্ট',
    noReportsYet: 'আপনি এখনও কোনো অভিযোগ জমা দেননি।',

    // Worker Dashboard
    workerAssignedTitle: 'আপনাকে অর্পিত কার্যাবলী',
    workerSubtitle: 'অনুমোদিত মাঠ কাজ এবং মেরামত লগ',
    cardAssignedToday: 'আজকে অর্পিত',
    cardCriticalJobs: 'জরুরি কাজ',
    cardInProgress: 'চলমান',
    cardAwaitingVerif: 'যাচাইয়ের অপেক্ষায়',
    cardCompletedTotal: 'মোট সম্পন্ন',
    unauthorizedBanner: 'শুধুমাত্র আপনার একাউন্টে অর্পিত টিকিটগুলো এখানে দৃশ্যমান। গোপনীয়তা রক্ষার্থে অন্য কোনো অভিযোগ প্রদর্শিত হয় না।',

    // Admin Dashboard
    adminCommandTitle: 'পৌর অভিযোগ কমান্ড সেন্টার',
    adminSubtitle: 'স্বয়ংক্রিয় প্রশাসনিক পর্যবেক্ষণ ও ওপেনসিভি ভুয়ো-মেরামত প্রতিরোধ ব্যবস্থা',
    cardOpenComplaints: 'মোট উন্মুক্ত',
    cardUnderReview: 'সন্দেহজনক মেরামত',
    cardEscalatedBreaches: '৪৮ ঘণ্টা অতিক্রান্ত',
    cardResolvedToday: 'যাচাইকৃত সমাধান',

    // Credits
    totalCivicCredits: 'মোট সিভিক ক্রেডিট',
    issuesReported: 'রিপোর্টকৃত সমস্যা',
    issuesResolved: 'সমাধানকৃত সমস্যা',
    communityContributions: 'নাগরিক অবদান',
    creditHistory: 'ক্রেডিট ইতিহাস',
    badgeFirstReport: 'প্রথম রিপোর্ট',
    badgeCommunityHelper: 'কমিউনিটি সহায়ক',
    badgeCivicChampion: 'সিভিক চ্যাম্পিয়ন',
    badgeWardGuardian: 'ওয়ার্ড অভিভাবক',
    suspiciousReviewFlag: 'সন্দেহজনক কার্যকলাপ — পর্যালোচনা প্রয়োজন',

    // Duplicate Detection
    duplicateTitle: 'স্মার্ট ডুপ্লিকেট সনাক্তকরণ',
    existingIssueFound: 'এই স্থানে ইতোমধ্যে একটি সমস্যা রিপোর্ট করা হয়ে থাকতে পারে।',
    approximateArea: 'আনুমানিক এলাকা',
    citizenReportsCount: 'নাগরিকদের রিপোর্ট সংখ্যা',
    isThisTheSameIssue: 'এটি কি একই সমস্যা?'
  },

  hi: {
    // Brand & Workspace
    appName: 'सिविकआई',
    appSubtitle: 'नागरिक जवाबदेही',
    citizenWorkspace: 'नागरिक शिकायत कार्यक्षेत्र',
    workerWorkspace: 'रखरखाव कर्मी कार्यक्षेत्र',
    adminWorkspace: 'कमांड सेंटर कार्यक्षेत्र',
    residentBadge: 'नागरिक',
    fieldOpsBadge: 'फ़ील्ड कर्मी',
    authorityBadge: 'अधिकारी',

    // Navigation
    navDashboard: 'डैशबोर्ड',
    navReportIssue: 'समस्या दर्ज करें',
    navCivicMap: 'नागरिक मानचित्र',
    navMyReports: 'मेरी शिकायतें',
    navMyCredits: 'सिविक क्रेडिट पॉइंट्स',
    navAiCopilot: 'एआई कोपायलट',
    navEmergencyHelp: 'आपातकालीन सहायता',
    navNotifications: 'सूचनाएं',
    navProfile: 'प्रोफ़ाइल',
    navWorkerDashboard: 'कर्मी डैशबोर्ड',
    navAssignedIssues: 'सौंपे गए कार्य',
    navPriorityJobs: 'प्राथमिकता कार्य',
    navWorkerMap: 'नेविगेशन / मानचित्र',
    navSubmitRepair: 'मरम्मत जमा करें',
    navRepairHistory: 'मरम्मत इतिहास',
    navEmergencyAssignments: 'आपातकालीन कार्य',
    navCommandCenter: 'कमांड सेंटर',
    navAllComplaints: 'सभी शिकायतें',
    navWardMap: 'वार्ड मानचित्र',
    navWorkers: 'कर्मी दल',
    navAssignments: 'कार्य आवंटन',
    navEscalations: 'एस्केलेशन',
    navAiReview: 'एआई समीक्षा',
    navCompletedWorks: 'पूर्ण किए गए कार्य',
    navAiReportGenerator: 'एआई रिपोर्ट जनरेटर',
    navAnalytics: 'विश्लेषण',
    navMunicipalContacts: 'नगर निगम संपर्क',
    navAuditLogs: 'ऑडिट लॉग',
    navSettings: 'सेटिंग्स',

    // Header & Actions
    searchPlaceholder: 'शिकायत खोजें (उदा: CIV-2026-0007, गड्ढा)...',
    emergency112: 'आपातकाल 112',
    allWardsCitywide: 'सभी वार्ड (पूरा शहर)',
    viewingAsCitizen: 'नागरिक के रूप में देख रहे हैं',
    viewingAsWorker: 'नगर निगम कर्मी के रूप में देख रहे हैं',
    viewingAsAdmin: 'प्रशासक के रूप में देख रहे हैं',

    // Buttons
    btnReportIssue: 'समस्या दर्ज करें',
    btnEmergencyHelp: '🚨 आपातकालीन सहायता',
    btnSubmit: 'जमा करें',
    btnCancel: 'रद्द करें',
    btnBack: 'वापस जाएं',
    btnConfirm: 'पुष्टि करें',
    btnStartWork: 'कार्य शुरू करें',
    btnUploadEvidence: 'साक्ष्य अपलोड करें',
    btnGenerateReport: 'रिपोर्ट बनाएं',
    btnPreviewReport: 'रिपोर्ट पूर्वावलोकन',
    btnDownloadPdf: 'पीडीएफ डाउनलोड',
    btnPrint: 'प्रिंट करें',
    btnStoreReport: 'सुरक्षित करें',
    btnApprove: 'स्वीकृत एवं हल करें',
    btnReject: 'अस्वीकार करें',
    btnReopen: 'पुनः खोलें',
    btnEscalate: 'तुरंत एस्केलेट करें',
    btnAssignWorker: 'कर्मी आवंटित करें',
    btnSupportExisting: 'हाँ, मौजूदा समस्या का समर्थन करें',
    btnReportSeparately: 'नहीं, अलग से शिकायत दर्ज करें',
    btnUseDraft: 'यह मसौदा उपयोग करें',
    btnDetectGps: 'वर्तमान जीपीएस का पता लगाएं',

    // Statuses
    statusReported: 'दर्ज किया गया',
    statusAcknowledged: 'स्वीकृत',
    statusInProgress: 'प्रगति पर',
    statusRepairSubmitted: 'मरम्मत जमा की गई',
    statusCommunityVerification: 'नागरिक सत्यापन',
    statusResolved: 'हल किया गया',
    statusEscalated: 'एस्केलेट किया गया',
    statusDisputed: 'संदेहास्पद / विवादित',

    // Priorities
    priorityCritical: 'अत्यंत गंभीर',
    priorityHigh: 'उच्च',
    priorityMedium: 'मध्यम',
    priorityLow: 'निम्न',

    // Categories
    catPothole: 'सड़क का गड्ढा',
    catBrokenStreetlight: 'टूटी स्ट्रीटलाइट',
    catOpenDrain: 'खुला नाला',
    catGarbage: 'कचरा ढेर',
    catWaterLeakage: 'जल रिसाव',
    catRoadDamage: 'सड़क क्षति',
    catCriticalHazard: 'गंभीर नागरिक ख़तरा',
    catOther: 'अन्य बुनियादी ढांचा',

    // Citizen Dashboard
    citizenWelcome: 'वापसी पर स्वागत है',
    citizenSubtitle: 'स्तर 3 नागरिक सत्यापनकर्ता • सक्रिय मोहल्ला प्रतिनिधि',
    cardMyActiveReports: 'मेरी सक्रिय शिकायतें',
    cardMyResolved: 'मेरी हल की गई',
    cardConfirmedCredits: 'पुष्ट क्रेडिट्स',
    cardPendingCredits: 'लंबित क्रेडिट्स',
    quickReportTitle: '60 सेकंड में नागरिक समस्या दर्ज करें',
    quickReportDesc: 'नक्शे पर पिन लगाएं। सिविकआई एआई स्वचालित रूप से वार्ड का पता लगाता है और 48 घंटे की सांविधिक समय-सीमा शुरू करता है।',
    myRecentReports: 'मेरी हालिया शिकायतें',
    noReportsYet: 'आपने अभी तक कोई शिकायत दर्ज नहीं की है।',

    // Worker Dashboard
    workerAssignedTitle: 'आपको सौंपे गए कार्य',
    workerSubtitle: 'अधिकृत फ़ील्ड कार्य एवं मरम्मत दस्तावेज़',
    cardAssignedToday: 'आज सौंपे गए',
    cardCriticalJobs: 'गंभीर कार्य',
    cardInProgress: 'प्रगति पर',
    cardAwaitingVerif: 'सत्यापन की प्रतीक्षा में',
    cardCompletedTotal: 'कुल पूर्ण',
    unauthorizedBanner: 'यहाँ केवल आपके दल को सौंपे गए कार्य आदेश दिखाई देते हैं। सुरक्षा और गोपनीयता के लिए अन्य शिकायतें नहीं दिखाई जातीं।',

    // Admin Dashboard
    adminCommandTitle: 'नगर निगम शिकायत नियंत्रण केंद्र',
    adminSubtitle: 'स्वचालित प्रशासनिक निगरानी और ओपनसीवी फर्जी-मरम्मत रोकथाम ग्रिड',
    cardOpenComplaints: 'कुल लंबित',
    cardUnderReview: 'संदेहास्पद मरम्मत',
    cardEscalatedBreaches: '48 घंटे की समय सीमा पार',
    cardResolvedToday: 'सत्यापित समाधान',

    // Credits
    totalCivicCredits: 'कुल सिविक क्रेडिट्स',
    issuesReported: 'दर्ज की गई समस्याएं',
    issuesResolved: 'हल की गई समस्याएं',
    communityContributions: 'नागरिक योगदान',
    creditHistory: 'क्रेडिट इतिहास',
    badgeFirstReport: 'प्रथम रिपोर्ट',
    badgeCommunityHelper: 'सामुदायिक सहायक',
    badgeCivicChampion: 'सिविक चैंपियन',
    badgeWardGuardian: 'वार्ड संरक्षक',
    suspiciousReviewFlag: 'संदेहास्पद गतिविधि — समीक्षा आवश्यक',

    // Duplicate Detection
    duplicateTitle: 'स्मार्ट डुप्लिकेट पहचान',
    existingIssueFound: 'इस स्थान पर पहले से ही एक समस्या दर्ज की गई हो सकती है।',
    approximateArea: 'अनुमानित क्षेत्र',
    citizenReportsCount: 'नागरिकों की रिपोर्ट संख्या',
    isThisTheSameIssue: 'क्या यह वही समस्या है?'
  }
};

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem('civiceye_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('civiceye_lang', language);
  }, [language]);

  const changeLanguage = (newLang) => {
    if (['en', 'bn', 'hi'].includes(newLang)) {
      setLanguage(newLang);
    }
  };

  const t = (key) => {
    return translations[language]?.[key] || translations['en']?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, currentLanguage: language, changeLanguage, setLanguage: changeLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useTranslation = () => useContext(LanguageContext);
export const useLanguage = () => useContext(LanguageContext);
