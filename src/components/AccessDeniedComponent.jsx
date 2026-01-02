import { useState } from "react";
import { getAdminTranslation } from "./Translations";
import { Card, CardContent } from "./ui/card";

export default function AccessDeniedComponent() {
    const [lang, setLang] = useState('ms');
    const t = (key) => getAdminTranslation(key, lang);    

    return (
        <Card className="max-w-lg mx-auto mt-8">
            <CardContent className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{t('accessDenied')}</h2>
                <p className="text-gray-600">{t('noPermission')}</p>
            </CardContent>
        </Card>
    );
}