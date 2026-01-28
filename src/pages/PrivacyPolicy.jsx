import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowLeft } from 'lucide-react';
import { translate } from '@/utils/translations';


export default function PrivacyPolicy() {
  const navigate = useNavigate();
  const privacyUrl = "https://example.com/privacy-policy";

  return (
    <div className="max-w-4xl mx-auto space-y-4 h-screen flex flex-col pb-2">
      <div className="flex items-center gap-3 pt-2">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="h-8 w-8">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-gray-900">{translate('Privacy Policy')}</h1>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow-md overflow-hidden">
        <iframe
          src={privacyUrl}
          className="w-full h-full border-0"
          title="Privacy Policy"
        />
      </div>
    </div>
  );
}