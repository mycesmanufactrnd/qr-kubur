import { Card, CardContent } from "./ui/card";

export default function ListCardSkeletonComponent() {
    return (
        <div className="space-y-2">
        {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-sm animate-pulse dark:bg-gray-800">
                <CardContent className="p-3">
                    <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded" />
                </CardContent>
            </Card>
        ))}
        </div>
    )
}