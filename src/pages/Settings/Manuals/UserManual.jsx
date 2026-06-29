// @ts-nocheck
import { useState } from "react";
import { ChevronDown, ChevronUp, Smartphone, Search, QrCode, Heart, BookOpen, Bell, Settings, MapPin, Clock, Star, AlertTriangle, CheckCircle, User, Home } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";

const SECTIONS = [
  {
    id: "getting-started",
    icon: <Smartphone className="w-5 h-5" />,
    title: "Getting Started",
    color: "bg-emerald-50 border-emerald-200",
    headerColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    steps: [
      {
        title: "Open the App",
        content: "Launch the QubuR app on your mobile device. You will land on the main User Dashboard which shows featured content, quick actions, and Islamic resources.",
      },
      {
        title: "Sign In with Google (Optional)",
        content: "Tap the Settings icon (bottom-right of navigation bar) → Tap 'Sign In with Google' → Choose your Google account → You are now signed in. Signing in is optional for browsing, but required to save transactions, donations, and tahlil requests.",
      },
      {
        title: "Navigation Bar",
        content: "The bottom navigation bar has 5 tabs:\n• Home — Main dashboard\n• Search — Find graves, tahfiz, mosques, etc.\n• QR — Scan QR codes on gravestones\n• Donate — Make a donation\n• Settings — Account, language, and preferences",
      },
    ],
  },
  {
    id: "dashboard",
    icon: <Home className="w-5 h-5" />,
    title: "Home Dashboard",
    color: "bg-blue-50 border-blue-200",
    headerColor: "bg-blue-100",
    iconColor: "text-blue-600",
    steps: [
      {
        title: "What You See on the Dashboard",
        content: "The dashboard shows:\n• Quick-access cards for Search, QR Scan, Donate, and Tahlil\n• Featured organisations and activity posts\n• Islamic features panel (Prayer Times, Daily Dua, Tasbih, Surah)\n• Islamic Calendar and upcoming events\n• Nearby map view (if location is enabled)",
      },
      {
        title: "Prayer Times Card",
        content: "Tap the Prayer Times card to view today's solat schedule based on your location. Enable GPS in Settings for accurate times.",
      },
      {
        title: "Islamic Calendar",
        content: "View the current Hijri (Islamic) date and upcoming Islamic events. Tap any event for more details.",
      },
    ],
  },
  {
    id: "search",
    icon: <Search className="w-5 h-5" />,
    title: "Search Features",
    color: "bg-violet-50 border-violet-200",
    headerColor: "bg-violet-100",
    iconColor: "text-violet-600",
    steps: [
      {
        title: "Search for a Grave",
        content: "Tap Search (bottom nav) → Tap 'Search Grave' → Enter the deceased person's name, grave number, or IC number → Tap Search → Tap any result to view full grave and deceased details including location map.",
      },
      {
        title: "Search for a Tahfiz Centre",
        content: "Tap Search → Tap 'Search Tahfiz' → Browse or type a centre name → Tap a result to view services, tahlil packages, and donation options for that centre.",
      },
      {
        title: "Search for a Mosque",
        content: "Tap Search → Tap 'Search Mosque' → Browse or search by name or area → Tap a result to view the mosque profile, events, and death charity details.",
      },
      {
        title: "Search Heritage Sites",
        content: "Tap Search → Tap 'Search Heritage' → Browse Islamic heritage sites listed in the system → Tap any site for full historical details and gallery.",
      },
      {
        title: "Search Waqf Projects",
        content: "Tap Search → Tap 'Search Waqf' → Browse active waqf (endowment) projects → Tap a project to view its details and how to contribute.",
      },
      {
        title: "Search Tahlil Requests",
        content: "Tap Search → Tap 'Search Tahlil' → View publicly listed tahlil requests. You can check status or browse requests from tahfiz centres near you.",
      },
    ],
  },
  {
    id: "qr",
    icon: <QrCode className="w-5 h-5" />,
    title: "QR Code Scanner",
    color: "bg-gray-50 border-gray-200",
    headerColor: "bg-gray-100",
    iconColor: "text-gray-600",
    steps: [
      {
        title: "How to Scan a QR Code",
        content: "Tap the QR icon in the bottom navigation bar → Allow camera permission if prompted → Point your camera at the QR code on the gravestone or signboard → The app will automatically read it and open the grave or person details page.",
      },
      {
        title: "What QR Codes Can Show",
        content: "• Grave details (location, plot number, section)\n• Deceased person profile (name, date of birth, date of death, family info)\n• Organisation or tahfiz centre profile\n• Direct link to donation or tahlil service",
      },
      {
        title: "QR Code Not Working?",
        content: "Make sure there is enough lighting. Hold your camera steady. If the code is worn or damaged, use the Search feature instead and search by name or grave number.",
      },
    ],
  },
  {
    id: "donation",
    icon: <Heart className="w-5 h-5" />,
    title: "Making a Donation",
    color: "bg-red-50 border-red-200",
    headerColor: "bg-red-100",
    iconColor: "text-red-600",
    steps: [
      {
        title: "Start a Donation",
        content: "Tap the Donate icon (bottom nav) OR tap a 'Donate' button on any organisation or tahfiz centre page → Select the recipient organisation or tahfiz centre → Choose a donation amount or enter a custom amount.",
      },
      {
        title: "Fill In Your Details",
        content: "Enter your name, email, and phone number. If you are signed in with Google, your name and email will be auto-filled. Tap 'Proceed to Payment'.",
      },
      {
        title: "Choose Payment Method",
        content: "Select your preferred payment method (FPX online banking or credit/debit card) → Complete the payment on the payment gateway page → You will be redirected back to the app once done.",
      },
      {
        title: "Check Donation Status",
        content: "Sign in with Google → Go to Settings → Tap 'Transaction Records' → View all your donations with their status (Pending / Verified / Rejected).",
      },
      {
        title: "Death Charity Payment",
        content: "If you are a death charity member, tap Search → find your mosque → tap 'Death Charity' → pay your monthly contribution online. You will need your member ID.",
      },
    ],
  },
  {
    id: "tahlil",
    icon: <BookOpen className="w-5 h-5" />,
    title: "Tahlil Request",
    color: "bg-amber-50 border-amber-200",
    headerColor: "bg-amber-100",
    iconColor: "text-amber-600",
    steps: [
      {
        title: "What is Tahlil?",
        content: "Tahlil is a Quranic recitation performed for the deceased. Through this app, you can request a tahlil session from a registered tahfiz centre and pay online.",
      },
      {
        title: "Submit a Tahlil Request",
        content: "Tap Search → Tap 'Search Tahfiz' → Select a centre → Tap 'Request Tahlil' → Choose a tahlil package → Enter the names of the deceased → Fill in your contact details → Proceed to payment.",
      },
      {
        title: "Check Tahlil Status",
        content: "After submission, you will receive a reference number. To check status:\n• Tap Settings → Tap 'Check Service Status'\n• Enter your reference number OR sign in with Google to see all your requests\n• Statuses: Pending → Accepted → Completed",
      },
      {
        title: "Direct Tahlil Request Page",
        content: "If you have a direct link or QR code from a tahfiz centre, scanning it will open the Tahlil Request page directly for that centre. Fill in the form and pay in one step.",
      },
    ],
  },
  {
    id: "islamic",
    icon: <Star className="w-5 h-5" />,
    title: "Islamic Features",
    color: "bg-teal-50 border-teal-200",
    headerColor: "bg-teal-100",
    iconColor: "text-teal-600",
    steps: [
      {
        title: "Prayer Times (Waktu Solat)",
        content: "From the dashboard, tap 'Prayer Times' → View today's complete solat schedule based on your location. Enable GPS in Settings for automatic location detection.",
      },
      {
        title: "Daily Dua",
        content: "Tap 'Daily Dua' from the dashboard or Settings → Browse categorised supplications (morning, evening, before sleep, meals, etc.) with Arabic text, transliteration, and translation.",
      },
      {
        title: "Tasbih (Dhikr Counter)",
        content: "Tap 'Tasbih' → Tap the screen to count your dhikr (remembrance of Allah). The counter resets each session. Use it for Subhanallah, Alhamdulillah, or Allahu Akbar.",
      },
      {
        title: "Surah & Prayer Guides",
        content: "Tap 'Surah' from the dashboard → Browse Quranic chapters and prayer guides including Surah Yasin, Surah Al-Fatihah, and short surahs with Arabic text and translation.",
      },
      {
        title: "Asmaul Husna (99 Names of Allah)",
        content: "View and recite the 99 beautiful names of Allah with Arabic text, transliteration, and meaning for each name.",
      },
      {
        title: "Rukun Islam & Iman",
        content: "Access a quick reference guide to the 5 Pillars of Islam and the 6 Pillars of Faith with explanations.",
      },
    ],
  },
  {
    id: "jenazah",
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Jenazah Emergency",
    color: "bg-orange-50 border-orange-200",
    headerColor: "bg-orange-100",
    iconColor: "text-orange-600",
    steps: [
      {
        title: "Report a Death (Emergency)",
        content: "If someone has passed away and you need immediate guidance or to notify the relevant organisation, tap 'Jenazah Emergency' from the dashboard → Fill in the deceased's name, location, and your contact → Submit. The nearest registered organisation will be notified.",
      },
      {
        title: "Solat Jenazah Guide",
        content: "Tap 'Solat Jenazah' from the dashboard → Follow the step-by-step guide for performing the funeral prayer (Solat Jenazah) with Arabic text and instructions.",
      },
    ],
  },
  {
    id: "notifications",
    icon: <Bell className="w-5 h-5" />,
    title: "Notifications",
    color: "bg-yellow-50 border-yellow-200",
    headerColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
    steps: [
      {
        title: "View Notifications",
        content: "Tap the Bell icon (top right of the screen) → View all your notifications including donation confirmations, tahlil updates, and system announcements.",
      },
      {
        title: "Enable or Disable Notifications",
        content: "Go to Settings → Toggle 'Push Notifications' on or off. You can also enable/disable notifications from your device's app settings.",
      },
    ],
  },
  {
    id: "settings",
    icon: <Settings className="w-5 h-5" />,
    title: "Settings & Account",
    color: "bg-slate-50 border-slate-200",
    headerColor: "bg-slate-100",
    iconColor: "text-slate-600",
    steps: [
      {
        title: "Change Language",
        content: "Go to Settings → Tap 'Language' → Select your preferred language (Bahasa Malaysia or English). The app will update immediately.",
      },
      {
        title: "Change Theme",
        content: "Go to Settings → Tap 'Theme' → Choose Light or Dark mode.",
      },
      {
        title: "Set Your Location",
        content: "Go to Settings → Tap 'Location' → Allow GPS permission for automatic detection, or select your state and district manually. Location is used for accurate prayer times and nearby search results.",
      },
      {
        title: "Save Phone Number",
        content: "Go to Settings → Enter your phone number in the Phone Number field → Tap Save. This pre-fills your phone number on forms.",
      },
      {
        title: "View Transaction Records",
        content: "Sign in with Google → Go to Settings → Tap 'Transaction Records' → View all your donations, tahlil payments, and service payments.",
      },
      {
        title: "Submit a Suggestion",
        content: "Go to Settings → Tap 'Submit Suggestion' → Write your feedback or suggestion and tap Submit. Your input helps us improve the app.",
      },
      {
        title: "Sign Out",
        content: "Go to Settings → Tap 'Sign Out' → Confirm. You will remain a guest user and can still browse freely.",
      },
      {
        title: "Privacy Policy & Terms",
        content: "Go to Settings → Tap 'Privacy Policy' or 'Terms & Conditions' to read the full documents.",
      },
    ],
  },
];

function StepItem({ step, index }) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm mb-1">{step.title}</p>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{step.content}</p>
      </div>
    </div>
  );
}

function Section({ section }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`rounded-xl border ${section.color} overflow-hidden mb-3`}>
      <button
        className={`w-full flex items-center justify-between px-4 py-3 ${section.headerColor} text-left`}
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <span className={section.iconColor}>{section.icon}</span>
          <span className="font-semibold text-gray-800">{section.title}</span>
        </div>
        {open ? (
          <ChevronUp className="w-4 h-4 text-gray-500 flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-4 py-2">
          {section.steps.map((step, i) => (
            <StepItem key={i} step={step} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function UserManual() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BackNavigation title="User Guide" />
      <div className="max-w-lg mx-auto px-4 pb-8 pt-2">
        {/* Header */}
        <div className="text-center py-5">
          <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Smartphone className="w-7 h-7 text-emerald-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">QubuR User Guide</h1>
          <p className="text-gray-500 text-sm mt-1">Mobile guide for all users</p>
        </div>

        {/* Quick tips banner */}
        <div className="bg-emerald-600 text-white rounded-xl p-4 mb-5 flex gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Tip: Sign in with Google</p>
            <p className="text-emerald-100 text-xs mt-0.5">
              Signing in lets you save donations, tahlil requests, and transaction history. You can still browse without signing in.
            </p>
          </div>
        </div>

        {/* Sections */}
        {SECTIONS.map((section) => (
          <Section key={section.id} section={section} />
        ))}

        <p className="text-center text-xs text-gray-400 mt-6">
          QubuR — Grave Management & Islamic Services Platform
        </p>
      </div>
    </div>
  );
}
