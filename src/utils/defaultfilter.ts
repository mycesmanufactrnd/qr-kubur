import { ActiveInactiveStatus } from "./enums";

export const defaultGraveFilter = {
    page: 1,
    search: '',
    block: '',
    lot: '',
    state: '',
    status: ActiveInactiveStatus.ACTIVE.toString(),
};