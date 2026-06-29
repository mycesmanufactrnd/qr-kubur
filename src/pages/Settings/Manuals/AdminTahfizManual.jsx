// @ts-nocheck
import { useState } from "react";
import { ChevronDown, ChevronUp, LayoutDashboard, BookOpen, Users, CreditCard, Settings, BarChart2, FileText, Shield, Building2, Bell, Monitor, Smartphone } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";

const SECTIONS = [
  {
    id: "access",
    icon: <Shield className="w-5 h-5" />,
    title: "Getting Access & Logging In",
    color: "bg-indigo-50 border-indigo-200",
    headerColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
    items: [
      {
        title: "Your Role as Tahfiz Admin",
        content: "The Tahfiz Admin role is granted to administrators of a registered tahfiz (Quran) centre. You have access to:\n• Manage your tahfiz centre profile\n• Accept and complete tahlil requests\n• View donations made to your centre\n• View financial reports\n• Manage activity posts for your centre\n\nYour access is limited to your own centre. Contact a Super Admin if your centre is not yet registered.",
      },
      {
        title: "Login (Mobile & Web)",
        content: "Mobile: Tap Settings (bottom nav) → Tap 'Sign In with Google' → Select your admin Google account.\n\nWeb: Open the app URL in a browser → Go to Settings → Click 'Sign In with Google' → Select your admin account.\n\nOnce signed in, the app detects your role and redirects you to the Tahfiz Dashboard.",
      },
      {
        title: "Tahfiz Dashboard Overview",
        content: "After login you are taken to the Tahfiz Dashboard which shows:\n• Summary cards: Pending tahlil requests, completed sessions, total donations received\n• Quick-access links to Manage Tahfiz Centre and Manage Tahlil Requests\n• Recent activity feed\n• Access to financial reports",
      },
      {
        title: "Navigating on Mobile",
        content: "On mobile, tap the hamburger menu (≡) in the top-left to open the side drawer. Menu items available to you:\n• Tahfiz Dashboard\n• Manage Tahfiz Centres\n• Manage Tahlil Requests\n• Payment Config\n• Settings",
      },
      {
        title: "Navigating on Web (Desktop)",
        content: "On desktop, the top header shows a dropdown menu. Click your name or the menu icon to expand it. All management pages are listed there. You can also navigate directly via the dashboard quick-action cards.",
      },
    ],
  },
  {
    id: "tahfiz-centre",
    icon: <Building2 className="w-5 h-5" />,
    title: "Manage Tahfiz Centre",
    color: "bg-emerald-50 border-emerald-200",
    headerColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    items: [
      {
        title: "View Your Centre Profile",
        content: "Go to Menu → 'Manage Tahfiz Centres' → Your centre card appears. Tap/click it to open the full profile view including name, address, contact, and registered services.",
      },
      {
        title: "Edit Centre Information",
        content: "Open your centre profile → Tap/click 'Edit' → Update fields:\n• Centre name\n• Address and GPS location\n• Contact number and email\n• Centre description\n• Profile photo / logo\n\nTap/click 'Save' when done. Changes reflect immediately on the public-facing centre page.",
      },
      {
        title: "Manage Tahlil Packages",
        content: "Inside your centre profile → Go to 'Tahlil Packages' tab → Tap/click 'Add Package' to create a new offering:\n• Package name (e.g., 'Yasin Recitation', '7-Day Tahlil')\n• Description\n• Price (RM)\n• Duration or number of sessions\n\nExisting packages can be edited or deactivated. Deactivated packages are hidden from users.",
      },
      {
        title: "Upload or Update Centre Photo",
        content: "Inside centre profile edit form → Tap/click the photo area → Choose an image from your device → Crop if needed → Save. Recommended size: at least 800×600px, JPEG or PNG.",
      },
      {
        title: "Enable/Disable Donations",
        content: "If your centre is configured to accept donations, you can view and manage this through Manage Tahfiz Centres. Contact your Super Admin to enable or disable donation acceptance for your centre.",
      },
    ],
  },
  {
    id: "tahlil",
    icon: <BookOpen className="w-5 h-5" />,
    title: "Manage Tahlil Requests",
    color: "bg-amber-50 border-amber-200",
    headerColor: "bg-amber-100",
    iconColor: "text-amber-600",
    items: [
      {
        title: "View Incoming Requests",
        content: "Go to Menu → 'Manage Tahlil Requests' → You will see a list of all requests made to your centre, sorted by date. Each row shows the requester name, package, date submitted, and current status.",
      },
      {
        title: "Request Statuses",
        content: "• Pending — New request, not yet reviewed\n• Accepted — You have confirmed the session\n• Completed — Tahlil has been performed\n• Rejected — Request was declined (reason given to user)",
      },
      {
        title: "Accept a Request",
        content: "Click/tap a Pending request → Review the details (package selected, names of deceased, contact info) → Tap/click 'Accept' → Optionally add a note or scheduled date → Confirm. The requester is notified automatically.",
      },
      {
        title: "Mark a Request as Completed",
        content: "After performing the tahlil session, open the accepted request → Tap/click 'Mark as Completed' → Optionally upload a completion document or photo as proof → Confirm. The request status updates to Completed and the requester is notified.",
      },
      {
        title: "Reject a Request",
        content: "Open a Pending request → Tap/click 'Reject' → Enter a reason (e.g., fully booked, out of service area) → Confirm. The requester is notified with your reason.",
      },
      {
        title: "Search & Filter Requests",
        content: "On the Manage Tahlil Requests page, use the search bar to find requests by requester name or reference number. Use the status filter dropdown to view only Pending, Accepted, or Completed requests.",
      },
      {
        title: "View Request Details",
        content: "Each request shows:\n• Requester name, email, phone\n• Package selected and price\n• Names of deceased\n• Date and time of request\n• Payment status\n• Notes from requester",
      },
    ],
  },
  {
    id: "donations",
    icon: <CreditCard className="w-5 h-5" />,
    title: "Donations & Payments",
    color: "bg-rose-50 border-rose-200",
    headerColor: "bg-rose-100",
    iconColor: "text-rose-600",
    items: [
      {
        title: "View Donations to Your Centre",
        content: "Go to Menu → 'Manage Donations' → Filter by your organisation to see donations made to your tahfiz centre. Each entry shows donor name, amount, date, and payment status.",
      },
      {
        title: "Verify a Donation",
        content: "If a donation shows as Pending and payment verification is required, tap/click the record → Review the payment details → Tap 'Verify' to confirm receipt. This marks the donation as Verified and the donor is notified.",
      },
      {
        title: "Payment Distribution",
        content: "Go to Menu → 'Manage Payment Distribution' → View how incoming payments are split between your centre and the platform. Contact your Super Admin to change distribution rules.",
      },
      {
        title: "Financial Reports",
        content: "Go to Menu → 'Financial Reports' → View:\n• Total donations by period\n• Tahlil payment summary\n• Revenue charts\n\nUse the date range filter to export or view specific periods. Reports are view-only for Tahfiz Admins.",
      },
      {
        title: "Payment Configuration",
        content: "Go to Menu → 'Payment Config' → View the payment gateway connected to your centre (ToyyibPay or Billplz). To change or update payment credentials, contact your Super Admin.",
      },
    ],
  },
  {
    id: "users",
    icon: <Users className="w-5 h-5" />,
    title: "Manage Users",
    color: "bg-sky-50 border-sky-200",
    headerColor: "bg-sky-100",
    iconColor: "text-sky-600",
    items: [
      {
        title: "View Users",
        content: "Go to Menu → 'Manage Users' (if permission granted) → See all users registered under your organisation or who have interacted with your centre.",
      },
      {
        title: "Create a New User",
        content: "On Manage Users page → Tap/click 'Add User' → Fill in:\n• Name\n• Email address\n• Role (Employee or Admin)\n• Organisation (your tahfiz centre)\n\nTap 'Save'. The new user can log in with the email you registered via Google Sign-In.",
      },
      {
        title: "Edit a User",
        content: "Find the user in the list → Tap/click 'Edit' → Update their name, role, or organisation → Save.",
      },
      {
        title: "Deactivate / Remove a User",
        content: "Find the user → Tap/click 'Delete' or deactivate their account. Deactivated users cannot log in but their records are retained.",
      },
    ],
  },
  {
    id: "activity",
    icon: <FileText className="w-5 h-5" />,
    title: "Activity Posts",
    color: "bg-purple-50 border-purple-200",
    headerColor: "bg-purple-100",
    iconColor: "text-purple-600",
    items: [
      {
        title: "What are Activity Posts?",
        content: "Activity posts are announcements, news, or updates that appear on the public-facing page of your tahfiz centre. Use them to share upcoming events, Quran completion ceremonies, or service updates.",
      },
      {
        title: "Create a New Post",
        content: "Go to Menu → 'Manage Activity Posts' → Tap/click 'Add Post' → Fill in:\n• Title\n• Content (supports rich text)\n• Image (optional)\n• Date\n• Visibility (Public or Internal)\n\nTap/click 'Publish' to make it live.",
      },
      {
        title: "Edit or Delete a Post",
        content: "Find the post in the list → Tap/click 'Edit' to update content or 'Delete' to remove it. Deleted posts are permanently removed.",
      },
    ],
  },
  {
    id: "suggestions",
    icon: <Bell className="w-5 h-5" />,
    title: "Suggestions & Feedback",
    color: "bg-lime-50 border-lime-200",
    headerColor: "bg-lime-100",
    iconColor: "text-lime-600",
    items: [
      {
        title: "View Suggestions from Users",
        content: "Go to Menu → 'Manage Suggestions' → See feedback submitted by users related to your centre or the platform. You can mark suggestions as Reviewed.",
      },
      {
        title: "Approve or Reject a Suggestion",
        content: "Open a suggestion → Review the content → Tap/click 'Approve' to acknowledge and act on it, or 'Reject' with a short reason. This updates the status visible in the record.",
      },
    ],
  },
  {
    id: "permissions",
    icon: <Shield className="w-5 h-5" />,
    title: "Permissions & Access Control",
    color: "bg-red-50 border-red-200",
    headerColor: "bg-red-100",
    iconColor: "text-red-600",
    items: [
      {
        title: "Understanding Permissions",
        content: "Your access is controlled by the permission settings configured by your Super Admin. Key permissions for Tahfiz Admins:\n• Tahfiz Centres — view, create, edit, delete\n• Tahlil Requests — view, accept, complete\n• Donations — view, verify\n• Activity Posts — view, create, edit, delete\n• Suggestions — view, approve, reject\n• Users — view, create, edit, delete\n• Financial Reports — view",
      },
      {
        title: "View Your Current Permissions",
        content: "Go to Menu → 'Manage Permissions' (if accessible) → See the permission matrix for your role. Green checkmarks indicate permissions granted. Greyed-out items require Super Admin to enable.",
      },
      {
        title: "Request Additional Permissions",
        content: "If you need access to a feature that is currently restricted, contact your Super Admin and request the specific permission (e.g., 'donations_verify', 'tahfizcenters_edit'). Permissions are managed per-user.",
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
    items: [
      {
        title: "Change Language & Theme",
        content: "Go to Settings → Select Language (Bahasa Malaysia / English) → Select Theme (Light / Dark). Changes apply immediately.",
      },
      {
        title: "Update Phone Number",
        content: "Go to Settings → Enter your phone number → Tap Save. This is used for contact purposes in admin records.",
      },
      {
        title: "View System Logs",
        content: "Go to Menu → 'View Logs' → See a log of all actions performed in the system. Useful for auditing changes or tracking activity. Logs are read-only.",
      },
      {
        title: "Sign Out",
        content: "Go to Settings → Tap/click 'Sign Out' → Confirm. You will be logged out and redirected to the login page.",
      },
    ],
  },
  {
    id: "tips",
    icon: <Monitor className="w-5 h-5" />,
    title: "Mobile vs Web Tips",
    color: "bg-cyan-50 border-cyan-200",
    headerColor: "bg-cyan-100",
    iconColor: "text-cyan-600",
    items: [
      {
        title: "Best for Mobile",
        content: "• Accepting or completing tahlil requests on the go\n• Checking pending requests and notifications\n• Viewing donations and quick stats\n• Posting quick activity updates",
      },
      {
        title: "Best for Web (Desktop)",
        content: "• Managing tahfiz centre profile with detailed editing\n• Creating and formatting activity posts\n• Reviewing financial reports and exporting data\n• Bulk actions on tahlil requests\n• Managing users and permissions",
      },
      {
        title: "Responsive Layout",
        content: "The app automatically adjusts its layout based on your screen size. All features are available on both mobile and web. Some data-heavy pages (financial reports, logs) are easier to use on a larger screen.",
      },
    ],
  },
];

function ItemCard({ item, index }) {
  return (
    <div className="flex gap-3 py-3 border-b border-gray-100 last:border-0">
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 mt-0.5">
        {index + 1}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-800 text-sm mb-1">{item.title}</p>
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{item.content}</p>
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
          {section.items.map((item, i) => (
            <ItemCard key={i} item={item} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AdminTahfizManual() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BackNavigation title="Tahfiz Admin Guide" />
      <div className="max-w-2xl mx-auto px-4 pb-8 pt-2">
        {/* Header */}
        <div className="text-center py-5">
          <div className="w-14 h-14 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <BookOpen className="w-7 h-7 text-indigo-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">Tahfiz Admin Guide</h1>
          <p className="text-gray-500 text-sm mt-1">For Tahfiz Centre Administrators — Mobile & Web</p>
        </div>

        {/* Role badge */}
        <div className="flex gap-2 justify-center mb-5">
          <span className="inline-flex items-center gap-1.5 bg-indigo-100 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Smartphone className="w-3.5 h-3.5" /> Mobile
          </span>
          <span className="inline-flex items-center gap-1.5 bg-purple-100 text-purple-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Monitor className="w-3.5 h-3.5" /> Web
          </span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 text-xs font-semibold px-3 py-1.5 rounded-full">
            <Shield className="w-3.5 h-3.5" /> Admin Role
          </span>
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
