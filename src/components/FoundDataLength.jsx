import { translate } from "@/utils/translations";

export default function FoundDataLength({
  dataList = [],
  data = "Data(s)",
}) {
  return (
    <div className="my-4 px-1">
      <p className="text-sm text-stone-500 mb-2">
        {dataList.length} {dataList.length === 1 ? translate(data).replace('(s)','') : translate(data)} {translate("Found")}
      </p>
    </div>
  );
}
