// @ts-nocheck
import { useState } from "react";
import {
  Building2,
  ChevronDown,
  ChevronUp,
  Plus,
  Edit,
  Trash2,
  Search,
  CreditCard,
  MapPin,
  Tag,
  Users,
  CheckCircle,
  AlertTriangle,
  Settings,
  FileText,
  ShieldCheck,
  ClipboardList,
} from "lucide-react";
import BackNavigation from "@/components/BackNavigation";

const SECTIONS = [
  {
    id: "overview",
    icon: <Building2 className="w-5 h-5" />,
    title: "Overview",
    color: "bg-violet-50 border-violet-200",
    headerColor: "bg-violet-100",
    iconColor: "text-violet-600",
    steps: [
      {
        title: "What is Manage Organisations?",
        content:
          "Manage Organisations is the central admin panel for creating, editing, and overseeing all registered organisations in the QubuR system. An organisation can be a graveyard management body, a mosque, a welfare association, an NGO, or any registered entity. Admins use this panel to control organisation profiles, services, payment gateways, and staff accounts.",
      },
      {
        title: "Who Can Access This Page?",
        content:
          "Access is role-based:\n• Super Admin — Full access to all organisations system-wide. Can set organisation types, enable grave/mosque/donation flags, and assign parent organisations.\n• Admin — Can manage their own organisation and any child organisations under them.\n• Employee — Read-only or limited access depending on permissions set by the admin.\n\nIf you see an 'Access Denied' screen, ask your Super Admin to assign the correct permissions under Manage Permissions.",
      },
      {
        title: "How to Navigate Here",
        content:
          "From the Admin Dashboard → click 'Manage Organisations' in the management menu. On desktop, the full table view is shown. On mobile, a card-based layout is used instead. Both versions offer the same functionality.",
      },
    ],
  },
  {
    id: "searching",
    icon: <Search className="w-5 h-5" />,
    title: "Searching & Filtering Organisations",
    color: "bg-blue-50 border-blue-200",
    headerColor: "bg-blue-100",
    iconColor: "text-blue-600",
    steps: [
      {
        title: "Search by Name",
        content:
          "In the search bar at the top, type all or part of the organisation name → Click 'Search' or press Enter. The table will update to show matching results.",
      },
      {
        title: "Filter by Organisation Type",
        content:
          "Use the 'Organisation Type' dropdown (next to the search bar) to filter the list by a specific type such as Jabatan Agama, Swasta, or NGO. Select 'All Types' to clear the filter.",
      },
      {
        title: "Filter by State",
        content:
          "Use the 'State' dropdown to narrow results by Malaysian state. Super Admins can see all states. Admins see only the states their account is assigned to.",
      },
      {
        title: "Resetting Filters",
        content:
          "Click the 'Reset' button to clear all search and filter values and return to the full list.",
      },
      {
        title: "Pagination",
        content:
          "The table shows 10 organisations per page by default. Use the pagination controls at the bottom to navigate between pages. You can also change the items-per-page count using the dropdown on the right side of the pagination bar.",
      },
    ],
  },
  {
    id: "adding",
    icon: <Plus className="w-5 h-5" />,
    title: "Adding a New Organisation",
    color: "bg-emerald-50 border-emerald-200",
    headerColor: "bg-emerald-100",
    iconColor: "text-emerald-600",
    steps: [
      {
        title: "Open the Add Dialog",
        content:
          "Click the 'Add New' button (top-right, violet). A large dialog will open with three columns: Organisation Details, Payment Config, and (for Admins) Add User.",
      },
      {
        title: "Fill in Organisation Details",
        content:
          "Complete the following fields in the first column:\n• Name (required) — Full official name of the organisation\n• Organisation Type (required) — Select the category (e.g. Jabatan Agama Islam, NGO, Masjid)\n• Parent Organisation — Select an existing organisation as the parent (Super Admin only)\n• State (required) — The Malaysian state the organisation operates in\n• Address — Full postal address (optional)\n• Photo — Upload an organisation logo or photo (optional)\n• Phone No. — Contact phone number (optional)\n• Email — Contact email address (optional)\n• Latitude & Longitude (required) — GPS coordinates for map display",
      },
      {
        title: "Get Current Location (Auto-fill Coordinates)",
        content:
          "Instead of entering coordinates manually, click 'Get Current Location'. The browser will request your GPS location and automatically fill in the Latitude and Longitude fields. Make sure your browser has location permission enabled.",
      },
      {
        title: "Super Admin Capability Flags",
        content:
          "If you are a Super Admin, three additional checkboxes appear under the coordinates:\n• Can Manage Grave — Allows this organisation to manage grave records\n• Can Manage Mosque — Allows this organisation to manage mosque data\n• Can Be Donated — Enables donation functionality for this organisation\n\nThese flags control what the organisation can do in the system and what users see on the public profile.",
      },
      {
        title: "Uploading a Photo",
        content:
          "Click the photo upload field → Select an image file → The photo uploads automatically and shows a preview. Wait for the 'Photo uploaded' toast notification before saving. Supported formats: JPG, PNG, and other common image types.",
      },
      {
        title: "Click Save",
        content:
          "Once all required fields are filled, click 'Save' (bottom of the dialog). The new organisation will appear in the table immediately. If any required field is missing, the form will highlight the error.",
      },
    ],
  },
  {
    id: "editing",
    icon: <Edit className="w-5 h-5" />,
    title: "Editing an Organisation",
    color: "bg-amber-50 border-amber-200",
    headerColor: "bg-amber-100",
    iconColor: "text-amber-600",
    steps: [
      {
        title: "Open the Edit Dialog",
        content:
          "In the organisations table, find the organisation you want to edit. Click the pencil (Edit) icon in the Actions column. The same dialog opens, pre-filled with the organisation's current data.",
      },
      {
        title: "Update Fields",
        content:
          "Modify any of the following fields:\n• Name, Organisation Type, Parent Organisation, State\n• Address, Phone, Email\n• Photo (upload a new image to replace the current one)\n• Latitude, Longitude\n• Can Manage Grave / Can Manage Mosque / Can Be Donated (Super Admin only)",
      },
      {
        title: "Change Organisation Status",
        content:
          "When editing, you can also change the Status field between Active and Inactive. Inactive organisations are hidden from public-facing search results but remain in the admin panel.",
      },
      {
        title: "Save Changes",
        content:
          "Click 'Save' after making your changes. A success notification will confirm the update.",
      },
    ],
  },
  {
    id: "deleting",
    icon: <Trash2 className="w-5 h-5" />,
    title: "Deleting an Organisation",
    color: "bg-red-50 border-red-200",
    headerColor: "bg-red-100",
    iconColor: "text-red-600",
    steps: [
      {
        title: "Initiate Delete",
        content:
          "In the Actions column, click the red Trash icon next to the organisation you want to remove. A confirmation dialog will appear.",
      },
      {
        title: "Confirm Deletion",
        content:
          "Read the confirmation message carefully, then click 'Confirm' to permanently delete the organisation. Click 'Cancel' to abort. Deletion is irreversible — all records linked to this organisation (users, graves, services) may be affected.",
      },
      {
        title: "Who Can Delete?",
        content:
          "Only users with the 'Delete' permission for organisations can see and use the delete button. If the trash icon is not visible, your account does not have delete permission. Contact your Super Admin to update permissions via Manage Permissions.",
      },
    ],
  },
  {
    id: "payment",
    icon: <CreditCard className="w-5 h-5" />,
    title: "Payment Configuration",
    color: "bg-green-50 border-green-200",
    headerColor: "bg-green-100",
    iconColor: "text-green-600",
    steps: [
      {
        title: "What is Payment Config?",
        content:
          "Each organisation can be connected to one or more payment gateways (e.g. ToyyibPay, Billplz). This lets the organisation collect donations, service payments, and death charity contributions through the app.",
      },
      {
        title: "Configure Payment During Create/Edit",
        content:
          "When adding or editing an organisation, the middle column 'Payment Config' shows all active payment platforms. Tick the checkbox next to each platform you want to enable for this organisation. A configuration form for that platform will expand below.",
      },
      {
        title: "Fill in Platform Credentials",
        content:
          "Each payment platform has its own set of required fields (e.g. API key, Secret key, Category code). Fill in the values provided by your payment gateway account. Fields marked with a red asterisk (*) are required. Some fields accept image uploads (e.g. logo or QR codes).",
      },
      {
        title: "Open Payment Config from Table (Quick Access)",
        content:
          "In the organisations table, click the green credit card icon (CreditCard) in the Actions column next to any organisation. This opens the Payment Config dialog directly for that organisation without opening the full edit form.",
      },
      {
        title: "Saving Payment Config",
        content:
          "Payment config is saved together with the organisation when you click 'Save' in the Add/Edit dialog. It is also saved immediately when using the standalone Payment Config dialog. Wait for all file uploads to finish before saving — the Save button is disabled while uploads are in progress.",
      },
    ],
  },
  {
    id: "graveservice",
    icon: <MapPin className="w-5 h-5" />,
    title: "Grave Services",
    color: "bg-teal-50 border-teal-200",
    headerColor: "bg-teal-100",
    iconColor: "text-teal-600",
    steps: [
      {
        title: "What are Grave Services?",
        content:
          "Organisations that manage graveyards can offer paid services to the public, such as Mandian Jenazah (washing), Pengkebumian (burial), or Pemasangan Batu Nisan (gravestone installation). These services appear on the organisation's public profile and can be booked and paid through the app.",
      },
      {
        title: "Enable Grave Services",
        content:
          "In the Add/Edit organisation dialog, scroll to the 'Grave Service' section in the Payment Config column → Tick the 'Grave Services' checkbox. The service entry form will expand. Note: if services have already been added, the checkbox is disabled to prevent accidental removal.",
      },
      {
        title: "Read Terms & Conditions",
        content:
          "Before enabling grave services, click the 'T&C' link next to the Grave Service heading to read the Terms & Conditions for offering services through the platform.",
      },
      {
        title: "Add a Service",
        content:
          "With Grave Services enabled, click 'Add Service'. A row appears with:\n• Service Name — Enter the name of the service (e.g. 'Mandian Jenazah')\n• Price — Enter the price in RM (e.g. 150.00)\n• Active/Inactive toggle — Click to set whether this service is currently available",
      },
      {
        title: "Edit or Remove a Service",
        content:
          "To change a service name or price, directly edit the text in the row. To toggle availability, click the Active/Inactive button. To remove a service entirely, click the red trash icon at the end of that row.",
      },
      {
        title: "Duplicate Service Names",
        content:
          "The system automatically de-duplicates service names. If you add two rows with the same service name, only the first will be saved. Make sure each service has a unique name.",
      },
    ],
  },
  {
    id: "users",
    icon: <Users className="w-5 h-5" />,
    title: "Adding Staff Users to an Organisation",
    color: "bg-indigo-50 border-indigo-200",
    headerColor: "bg-indigo-100",
    iconColor: "text-indigo-600",
    steps: [
      {
        title: "Who Can Add Users?",
        content:
          "Super Admins and Admins can add staff accounts directly to an organisation during the Create or Edit flow. A third column 'Add User' appears in the dialog for these roles.",
      },
      {
        title: "Fill in User Details",
        content:
          "In the 'Add User' column, fill in:\n• Full Name (required) — Staff member's full name\n• Username (required) — This is used as the login email\n• Phone No. — Optional contact number\n• Role — Select 'Admin' or 'Employee'\n  - Admin: full management access within the organisation\n  - Employee: limited access based on permissions",
      },
      {
        title: "Add User to the List",
        content:
          "Click 'Add User'. The entry will appear in the table below. You can add multiple users before saving. The State for each user is inherited from the organisation's state automatically.",
      },
      {
        title: "Edit a User Entry Before Saving",
        content:
          "To change a user entry before the organisation is saved, click the pencil icon on that row in the user table. The details will re-populate the fields above. Make your changes and click 'Update User'. Click 'Cancel Edit' to discard changes.",
      },
      {
        title: "Remove a User Entry",
        content:
          "Click the red trash icon on a user row to remove that entry from the pending list. This only removes them from the save batch — it does not delete an already-saved user account.",
      },
      {
        title: "Default Password",
        content:
          "All newly created users are assigned the default password: password\n\nThe staff member must change this password on first login. Inform them to update their password immediately through the Settings page.",
      },
      {
        title: "Finish Editing User Before Saving",
        content:
          "If you clicked the pencil on a user row and are still in edit mode, you must click 'Update User' or 'Cancel Edit' before clicking the main Save button. Attempting to save while a user entry is open will show an error.",
      },
    ],
  },
  {
    id: "orgtypes",
    icon: <Tag className="w-5 h-5" />,
    title: "Managing Organisation Types (Super Admin Only)",
    color: "bg-purple-50 border-purple-200",
    headerColor: "bg-purple-100",
    iconColor: "text-purple-600",
    steps: [
      {
        title: "What Are Organisation Types?",
        content:
          "Organisation Types are the categories used to classify organisations (e.g. Jabatan Agama Islam Negeri, Swasta, NGO, Pertubuhan Kebajikan). Every organisation must be assigned a type. Only Super Admins can create, edit, or delete types.",
      },
      {
        title: "Navigate to Organisation Types",
        content:
          "From the Super Admin Dashboard → click 'Manage Organisation Types'. This is a separate management page from Manage Organisations.",
      },
      {
        title: "Add a New Type",
        content:
          "Click 'Add Type' (top-right, purple) → Fill in:\n• Name (required) — The type label (e.g. 'Masjid', 'NGO')\n• Description — Optional explanation of this type\n• Status — Active or Inactive\n→ Click Save.",
      },
      {
        title: "Edit an Existing Type",
        content:
          "Find the type in the table → Click the pencil (Edit) icon → Update the Name, Description, or Status → Click Save.",
      },
      {
        title: "Delete a Type",
        content:
          "Click the trash icon next to the type → Confirm deletion. Important: Do not delete a type that is currently assigned to organisations. Doing so may cause data inconsistencies.",
      },
      {
        title: "Restricted Types",
        content:
          "The following organisation types are 'restricted' — Admins belonging to these types can only assign their own type when creating new organisations:\n• Syarikat Swasta\n• Persatuan Sukarelawan\n• Pertubuhan Kebajikan (NGO)",
      },
    ],
  },
  {
    id: "tempregistrations",
    icon: <ClipboardList className="w-5 h-5" />,
    title: "Pending Organisation Registrations",
    color: "bg-orange-50 border-orange-200",
    headerColor: "bg-orange-100",
    iconColor: "text-orange-600",
    steps: [
      {
        title: "What Are Temp Registrations?",
        content:
          "Organisations can self-register through the public 'Quick Register' form. These submissions appear as 'Pending' in the Manage Pending Organisations page and must be reviewed and approved by an admin before they become active.",
      },
      {
        title: "Navigate to Pending Registrations",
        content:
          "From the Admin or Super Admin Dashboard → click 'Manage Pending Organisations'. The list shows all submitted registrations with their status: Pending, Approved, or Rejected.",
      },
      {
        title: "Review a Registration",
        content:
          "Click on a registration entry to view the full submitted details: organisation name, type, state, address, contact details, and any payment configuration they submitted.",
      },
      {
        title: "Approve a Registration",
        content:
          "After reviewing, click 'Approve'. This creates a live organisation record from the submission. The organisation becomes visible in Manage Organisations and on the public app.",
      },
      {
        title: "Reject a Registration",
        content:
          "To reject, click 'Reject' and optionally enter a reason. The submission is marked as Rejected. The applicant can resubmit through the Quick Register form if needed.",
      },
      {
        title: "Delete a Pending Registration",
        content:
          "To permanently remove a pending submission, click the delete icon. This cannot be undone. Use this to remove spam or duplicate applications.",
      },
    ],
  },
  {
    id: "permissions",
    icon: <ShieldCheck className="w-5 h-5" />,
    title: "Permissions & Access Control",
    color: "bg-slate-50 border-slate-200",
    headerColor: "bg-slate-100",
    iconColor: "text-slate-600",
    steps: [
      {
        title: "How Permissions Work",
        content:
          "Each user account has four permission levels for each management module: View, Create, Edit, and Delete. These are set by the Super Admin via Manage Permissions.\n\n• View — Can see the organisations list\n• Create — Can use 'Add New' to create organisations\n• Edit — Can edit existing organisations and configure payment\n• Delete — Can delete organisations",
      },
      {
        title: "Buttons Hidden by Permission",
        content:
          "If a user does not have Create permission, the 'Add New' button is hidden. If they lack Edit permission, the pencil and credit card icons are hidden. If they lack Delete permission, the trash icon is hidden.",
      },
      {
        title: "Updating Permissions",
        content:
          "To grant or revoke permissions for a user:\n1. Go to Admin/Super Admin Dashboard\n2. Click 'Manage Permissions'\n3. Find the user and the 'Organisations' row\n4. Check or uncheck View, Create, Edit, Delete\n5. Save changes",
      },
      {
        title: "Super Admin vs Admin Scope",
        content:
          "Super Admins can manage ALL organisations across all states. Admins can only manage their own organisation and its child organisations. State dropdown filters are automatically restricted for Admins to their assigned states.",
      },
    ],
  },
  {
    id: "tips",
    icon: <CheckCircle className="w-5 h-5" />,
    title: "Tips & Best Practices",
    color: "bg-lime-50 border-lime-200",
    headerColor: "bg-lime-100",
    iconColor: "text-lime-600",
    steps: [
      {
        title: "Always Set Correct Coordinates",
        content:
          "Latitude and Longitude are required fields and directly affect the map view in the public app. Use 'Get Current Location' if you are physically at the organisation's location, or use Google Maps to find the exact coordinates.",
      },
      {
        title: "Uploading Photos",
        content:
          "Upload a clear, high-quality photo or logo for the organisation. This image appears on the public profile and in search results. Wait for the upload to complete (toast notification appears) before clicking Save.",
      },
      {
        title: "One State Per Organisation",
        content:
          "Each organisation is assigned to one state. If an organisation operates across multiple states, consider creating a parent organisation with child branches, one per state.",
      },
      {
        title: "Payment Config Before Going Live",
        content:
          "Configure the payment gateway before announcing the organisation to users. Without a valid payment config, users cannot complete donations or service bookings for that organisation.",
      },
      {
        title: "Inform New Staff of Default Password",
        content:
          "Any staff account created through the organisation form has the default password: password. Always tell new staff members to change this immediately after their first login.",
      },
      {
        title: "Review Before Delete",
        content:
          "Before deleting an organisation, check if it has active graves, users, donations, or pending services linked to it. Deleting the organisation does not automatically remove those records and may cause orphaned data.",
      },
    ],
  },
  {
    id: "troubleshooting",
    icon: <AlertTriangle className="w-5 h-5" />,
    title: "Troubleshooting",
    color: "bg-yellow-50 border-yellow-200",
    headerColor: "bg-yellow-100",
    iconColor: "text-yellow-600",
    steps: [
      {
        title: "Save Button is Disabled",
        content:
          "The Save button becomes disabled when:\n• A photo or payment file is still uploading — wait for the upload to finish\n• A user entry is in edit mode — click 'Update User' or 'Cancel Edit'\n• Required fields are empty — check Name, Organisation Type, State, Latitude, Longitude",
      },
      {
        title: "Cannot See Certain States in Filter",
        content:
          "Non-Super Admin accounts are restricted to their assigned states. If the state you need is not showing, contact your Super Admin to update your account's state assignment.",
      },
      {
        title: "Organisation Type Dropdown Shows Only One Option",
        content:
          "Admin accounts belonging to a 'restricted' organisation type (Syarikat Swasta, Persatuan Sukarelawan, Pertubuhan Kebajikan) can only assign their own type. Contact the Super Admin if you need to assign a different type.",
      },
      {
        title: "Payment Platform Not Showing",
        content:
          "Payment platforms must be activated in 'Manage Payment Platforms' by the Super Admin before they appear in the organisation's payment config. Contact your Super Admin to activate the platform.",
      },
      {
        title: "Grave Services Checkbox is Greyed Out",
        content:
          "The Grave Services checkbox is disabled when there are already service entries in the list. This prevents accidental removal. To uncheck it, first delete all service rows using the trash icon, then the checkbox becomes clickable.",
      },
      {
        title: "Access Denied on the Page",
        content:
          "If you see the Access Denied screen, your account either lacks admin access or does not have 'View' permission for organisations. Contact your Super Admin to assign the correct role and permissions via Manage Permissions.",
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
        <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">
          {step.content}
        </p>
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

export default function AdminOrganisationManual() {
  return (
    <div className="min-h-screen bg-gray-50">
      <BackNavigation title="Organisation Admin Guide" />
      <div className="max-w-2xl mx-auto px-4 pb-8 pt-2">
        {/* Header */}
        <div className="text-center py-5">
          <div className="w-14 h-14 bg-violet-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-7 h-7 text-violet-600" />
          </div>
          <h1 className="text-xl font-bold text-gray-900">
            Organisation Admin Manual
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Complete guide for managing organisations
          </p>
        </div>

        {/* Info banner */}
        <div className="bg-violet-600 text-white rounded-xl p-4 mb-5 flex gap-3">
          <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Admin & Super Admin Guide</p>
            <p className="text-violet-100 text-xs mt-0.5">
              This manual covers all organisation management features available
              to Admins and Super Admins. Super Admin-only features are clearly
              marked in each section.
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
