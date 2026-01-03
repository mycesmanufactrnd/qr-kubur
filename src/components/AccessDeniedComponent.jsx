import { Card, CardContent } from "./ui/card";
import { translate } from "@/utils/translations";

export default function AccessDeniedComponent() {
    return (
        <Card className="max-w-lg mx-auto mt-8">
            <CardContent className="p-8 text-center">
                <h2 className="text-xl font-bold text-gray-900 mb-2">{translate('accessDenied')}</h2>
                <p className="text-gray-600">{translate('noPermission')}</p>
            </CardContent>
        </Card>
    );
}