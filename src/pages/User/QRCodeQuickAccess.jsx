// @ts-nocheck
import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Copy, Check, ExternalLink, Siren, UserPlus } from 'lucide-react';
import Breadcrumb from '@/components/Breadcrumb';
import { showSuccess } from '@/components/ToastrNotification';

const LINKS = {
  jenazah: 'https://qubur.mycesgroup.com/jenazahemergencyrequest?type=qr',
  qariah: 'https://qubur.mycesgroup.com/userqariahregistration?type=qr',
};

const qrUrl = (data, size = 240) =>
  `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&margin=8&data=${encodeURIComponent(data)}`;

function QRAccessCard({ icon: Icon, iconBg, iconColor, title, description, link, copied, onCopy }) {
  return (
    <Card className="border-0 shadow-md rounded-2xl overflow-hidden h-full">
      <CardContent className="p-6 flex flex-col items-center text-center">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${iconBg}`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>

        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        <p className="text-xs text-gray-500 mt-1 mb-5">{description}</p>

        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <img
            src={qrUrl(link)}
            alt={`QR code for ${title}`}
            width={200}
            height={200}
            className="w-[200px] h-[200px]"
            loading="lazy"
          />
        </div>

        <div className="flex items-center gap-2 mt-5 bg-gray-50 rounded-lg px-3 py-2 w-full max-w-sm">
          <span className="text-xs text-gray-600 truncate flex-1 text-left">{link}</span>
          <button
            onClick={() => onCopy(link)}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Copy link"
          >
            {copied ? (
              <Check className="w-4 h-4 text-green-600" />
            ) : (
              <Copy className="w-4 h-4 text-gray-500" />
            )}
          </button>
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
            aria-label="Open link"
          >
            <ExternalLink className="w-4 h-4 text-gray-500" />
          </a>
        </div>
      </CardContent>
    </Card>
  );
}

export default function QRQuickAccess() {
  const [copiedLink, setCopiedLink] = useState(null);

  const handleCopy = (link) => {
    navigator.clipboard.writeText(link);
    setCopiedLink(link);
    showSuccess('Link copied');
    setTimeout(() => setCopiedLink(null), 2000);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb items={[
        { label: 'Super Admin Dashboard', page: 'SuperadminDashboard' },
        { label: 'QR Quick Access', page: 'QRQuickAccess' }
      ]} />

      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <QrCode className="w-6 h-6 text-purple-600" />
          QR Quick Access
        </h1>
        <p className="text-gray-500 mt-1">
          Scannable codes for public-facing request and registration forms
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <QRAccessCard
          icon={Siren}
          iconBg="bg-red-50"
          iconColor="text-red-600"
          title="Jenazah Emergency Request"
          description="Submit an urgent jenazah request"
          link={LINKS.jenazah}
          copied={copiedLink === LINKS.jenazah}
          onCopy={handleCopy}
        />

        <QRAccessCard
          icon={UserPlus}
          iconBg="bg-purple-50"
          iconColor="text-purple-600"
          title="Qariah Registration"
          description="Register as a qariah member"
          link={LINKS.qariah}
          copied={copiedLink === LINKS.qariah}
          onCopy={handleCopy}
        />
      </div>
    </div>
  );
}