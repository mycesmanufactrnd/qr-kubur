import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import BackNavigation from "@/components/BackNavigation";
import { translate } from "@/utils/translations";

const FAQ_DATA = [
  {
    category: "General",
    icon: "🌐",
    items: [
      {
        q: "What is this application?",
        a: "This is a digital graveyard management and funeral services system. It allows users to search for grave information, register services, donate, request tahlil, and access various Islamic features in one platform.",
      },
      {
        q: "Is this application free?",
        a: "Yes, basic usage is free. Some services such as tahlil requests, service quotations, and donations may involve charges depending on the package selected.",
      },
      {
        q: "How do I log in?",
        a: "You can log in using your Google account via the 'Sign in with Google' button on the Settings page. Logging in allows you to save transaction records and access additional features.",
      },
      {
        q: "What data does this application store?",
        a: "The app only stores information you provide when making requests or transactions, such as name, email, phone number, and payment details. This data is used solely to process your requests.",
      },
    ],
  },
  {
    category: "Grave Search & QR",
    icon: "⬛",
    items: [
      {
        q: "How do I search for grave information?",
        a: "Go to 'Search Grave' from the main menu. You can search by the deceased's name, grave number, or location. Results will show detailed information about the deceased and grave location.",
      },
      {
        q: "How do I use the QR scanner?",
        a: "Select 'Scan QR' from the main menu and point your camera at the QR code on the gravestone or information board. The app will immediately display complete information about the deceased.",
      },
      {
        q: "Grave information was not found. What should I do?",
        a: "The information may not yet be registered in the system. Please contact the graveyard management or the relevant organisation to register the grave information.",
      },
      {
        q: "Can I view the grave location on a map?",
        a: "Yes, if the grave's GPS location has been recorded, you can view it on a map. Make sure location permission is enabled on your device for this feature.",
      },
    ],
  },
  {
    category: "Donation",
    icon: "💚",
    items: [
      {
        q: "How do I make a donation?",
        a: "Go to 'Donation' from the main menu. Select the recipient (organisation or tahfiz centre), enter the donation amount, fill in your details, and choose a payment method. Google sign-in is required to record the transaction.",
      },
      {
        q: "What payment methods are accepted?",
        a: "We accept payments via credit/debit card, FPX (online banking), and other online payment platforms supported by our system.",
      },
      {
        q: "How do I check my donation status?",
        a: "Sign in with Google and go to Settings > Transaction Records to view all donations made. The status will be shown as Pending, Verified, or Rejected.",
      },
      {
        q: "Can I donate to a tahfiz centre?",
        a: "Yes. When making a donation, select 'Tahfiz Centre' as the recipient type, then choose your desired centre from the list.",
      },
    ],
  },
  {
    category: "Tahlil Request",
    icon: "📖",
    items: [
      {
        q: "What is the Tahlil service?",
        a: "The Tahlil service allows you to request a tahlil recitation for the deceased at a nearby tahfiz centre. You can select services, list the deceased's names, and make payment online.",
      },
      {
        q: "How do I submit a tahlil request?",
        a: "Select 'Tahlil' from the main menu. Choose a tahfiz centre, enter the deceased names, select services, and complete payment. You will receive a reference number once the request is successful.",
      },
      {
        q: "How do I check my tahlil request status?",
        a: "Go to 'Check Tahlil Status' and enter your reference number received at the time of the request. The status will show whether it is Pending, Accepted, Completed, or Rejected.",
      },
      {
        q: "Can I watch the tahlil live?",
        a: "Yes, if the tahfiz centre activates a live session, a video link will be shown in your request status. Press 'Join Live' to watch.",
      },
      {
        q: "I lost my reference number. How do I retrieve it?",
        a: "Sign in with Google and go to Settings > Transaction Records. All tahlil requests you have made will be listed along with their reference numbers.",
      },
    ],
  },
  {
    category: "Service Quotation",
    icon: "🪦",
    items: [
      {
        q: "What is a Service Quotation?",
        a: "A Quotation allows you to request a price quote for burial or grave maintenance services from a registered organisation. You can select required services and make payment online.",
      },
      {
        q: "How do I submit a quotation request?",
        a: "Go to the relevant organisation or graveyard page and select 'Request Service'. Fill in your details, select the required services, and complete payment.",
      },
      {
        q: "How do I check my service status?",
        a: "Go to 'Check Service Status' and enter your reference number. The status will show whether the service is Pending, Completed, or Rejected.",
      },
      {
        q: "What does the 5% platform fee mean?",
        a: "The 5% platform fee is a service charge applied to the total payment amount. 95% of the payment will be received by the service-providing organisation.",
      },
      {
        q: "Can I view the completion photo of the service?",
        a: "Yes. Once the organisation uploads a completion confirmation photo, it will be displayed in your quotation request status.",
      },
    ],
  },
  {
    category: "Death Charity",
    icon: "🤝",
    items: [
      {
        q: "What is the Death Charity scheme?",
        a: "The Death Charity scheme is a mutual savings scheme where members pay monthly or yearly contributions. When a member or their dependent passes away, the family receives a benefit payout from the scheme's fund pool.",
      },
      {
        q: "How do I register as a member?",
        a: "Please contact the organisation managing the nearest Death Charity scheme for registration. Organisation information can be found through the search feature in the app.",
      },
      {
        q: "How do I make a contribution payment?",
        a: "Members can make payments through the dedicated Death Charity page for their scheme. Enter the member's IC number, select the payment type (registration/monthly/yearly), and complete the payment.",
      },
      {
        q: "How do I submit a claim?",
        a: "Contact the scheme manager or organisation administrator to start the claim process. Required documents typically include a death certificate and identity documents.",
      },
      {
        q: "How do I check my payment records?",
        a: "Sign in with Google and go to Settings > Transaction Records. All Death Charity payments will be listed. You can also view the fund transfer status via the 'Transfer Status' button.",
      },
    ],
  },
  {
    category: "Islamic Features",
    icon: "☪️",
    items: [
      {
        q: "How do I check prayer times?",
        a: "Go to 'Prayer Times' from the main menu. The app will use your current location to display accurate prayer times. Make sure location permission is enabled.",
      },
      {
        q: "Can I read Quran surahs in this app?",
        a: "Yes. Go to 'Surah' from the main menu to access a collection of Quran surahs with Arabic text, transliteration, and translation.",
      },
      {
        q: "What is the Digital Tasbih feature?",
        a: "The Digital Tasbih allows you to count dhikr digitally. Tap the button to count and it will keep track of your count.",
      },
      {
        q: "What is Asmaul Husna?",
        a: "Asmaul Husna is the list of 99 names of Allah, accessible from the main menu, complete with the meaning of each name.",
      },
      {
        q: "How do I use the Islamic Calendar?",
        a: "Go to 'Islamic Calendar' to view Hijri dates and important Islamic events throughout the year.",
      },
      {
        q: "What is Daily Dua?",
        a: "Daily Dua contains a collection of supplications for various daily situations such as eating, sleeping, leaving the house, and more.",
      },
      {
        q: "What is Rukun Islam?",
        a: "Rukun Islam provides an educational guide to the Five Pillars of Islam with explanations for each pillar.",
      },
    ],
  },
  {
    category: "Funeral & Emergency",
    icon: "🆘",
    items: [
      {
        q: "What is the Funeral Prayer (Solat Jenazah) feature?",
        a: "This feature provides a step-by-step guide on performing the funeral prayer, including the intention (niat), recitations, and correct procedure.",
      },
      {
        q: "What is Jenazah Emergency?",
        a: "Jenazah Emergency allows you to contact or find nearby funeral management services in an emergency situation.",
      },
    ],
  },
  {
    category: "Records & Account",
    icon: "📋",
    items: [
      {
        q: "How do I view all my transactions?",
        a: "Sign in with Google and go to Settings > Transaction Records. All transactions including donations, tahlil, quotations, and Death Charity payments will be listed. Tap any record to view full details.",
      },
      {
        q: "Why are my transaction records not showing?",
        a: "Make sure you are signed in with the same Google account used when making the transaction. If the issue persists, the transaction may have been made without Google sign-in.",
      },
      {
        q: "How do I change the app language?",
        a: "Go to Settings and find the Language section. You can switch between Malay and English.",
      },
      {
        q: "How do I enable GPS / location?",
        a: "Go to Settings in the app and tap 'Enable GPS'. You can also enable location permission through your device's settings.",
      },
    ],
  },
];

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-slate-100 last:border-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-start justify-between gap-3 px-4 py-3.5 text-left hover:bg-slate-50 transition-colors"
      >
        <span className="text-sm font-semibold text-slate-700 leading-snug">
          {translate(q)}
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        ) : (
          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
        )}
      </button>
      {open && (
        <div className="px-4 pb-4">
          <p className="text-sm text-slate-500 leading-relaxed">{translate(a)}</p>
        </div>
      )}
    </div>
  );
}

export default function FAQ() {
  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      <BackNavigation title={translate("FAQ")} />

      <div className="max-w-2xl mx-auto px-3 pt-4 space-y-4">
        <div className="flex flex-col items-center text-center gap-1.5 pb-2">
          <h2 className="text-base font-bold text-slate-800">
            {translate("Frequently Asked Questions")}
          </h2>
          <p className="text-xs text-slate-400 max-w-[260px]">
            {translate("Answers to common questions about this application")}
          </p>
        </div>

        {FAQ_DATA.map((section) => (
          <div
            key={section.category}
            className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-2">
              <span className="text-base">{section.icon}</span>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-500">
                {translate(section.category)}
              </p>
            </div>
            <div>
              {section.items.map((item, i) => (
                <FAQItem key={i} q={item.q} a={item.a} />
              ))}
            </div>
          </div>
        ))}

        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-4 text-center space-y-1">
          <p className="text-sm font-semibold text-blue-700">
            {translate("Still have questions?")}
          </p>
          <p className="text-xs text-blue-500">
            {translate("Contact your organisation management or use the Suggestion feature in this app.")}
          </p>
        </div>
      </div>
    </div>
  );
}
