import { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AdvancedFilters from '@/components/mobile/AdvancedFilters.jsx';
import { translate } from '@/utils/translations';
import BackNavigation from '@/components/BackNavigation';
import ListCardSkeletonComponent from '@/components/ListCardSkeletonComponent';
import NoDataCardComponent from '@/components/NoDataCardComponent';
import { useGetWaqfProject } from '@/hooks/useWaqfProjectMutations';
import WaqfCard from '@/components/waqf/WaqfCard';
import { WaqfCategory } from '@/utils/enums';
import ShowNearLocation from '@/components/ShowNearLocation';

export default function SearchWaqf() {
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);
    const [filters, setFilters] = useState({});
    
    const { data, isLoading, refetch } = useGetWaqfProject(page, pageSize, filters);

    const waqfList = data?.items ?? [];

    return (
        <div className="space-y-3 pb-2">
        <BackNavigation title="Search Waqf Project" />
        <ShowNearLocation />

        <div className="flex items-center gap-2 rounded-xl">
            <AdvancedFilters
                parameter={[
                    { label: "Waqf Name", type: "text", searchColumn: "waqfname" },
                    { label: "Location", type: "text", searchColumn: "location" },
                    {
                        label: translate("Category"),
                        type: "select",
                        searchColumn: "category",
                        options: Object.values(WaqfCategory).map((category) => ({
                            id: category,
                            name: category,
                        }))
                    },
                ]}
                onApplyFilter={setFilters}
            />
        </div>

        {isLoading ? (
            <ListCardSkeletonComponent/>
        ) : waqfList.length === 0 ? (
            <NoDataCardComponent isPage/>
        ) : (
            <div className="space-y-3">
            {waqfList.map((waqf, index) => (
                <WaqfCard key={waqf.id} project={waqf} isView={true}/>
            ))}

            {pageSize < waqfList.length && (
                <div className="text-center py-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(prev => prev + 1)}
                        >
                        {translate('Load more')}
                    </Button>

                </div>
            )}
            </div>
        )}
        </div>
    );
}