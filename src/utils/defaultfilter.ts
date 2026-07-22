import { ActiveInactiveStatus } from "./enums";

export const defaultGraveFilter = {
  page: "1",
  name: "",
  block: "",
  lot: "",
  state: "",
  status: ActiveInactiveStatus.ACTIVE.toString(),
};

export const defaultDeadPersonFilter = {
  page: "1",
  name: "",
  ic: "",
  grave: "",
  gravelot: "",
  state: "",
  dateFrom: "",
  dateTo: "",
};
