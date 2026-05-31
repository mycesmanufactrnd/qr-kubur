// Key = current page name  (matches createPageUrl convention)
// Value = route to navigate back to when the back button is pressed

export const backNavigationMap = {
  // Quick Actions (UserDashboard grid)
  SearchGrave: "/",
  SearchTahlil: "/",
  ScanQR: "/",
  SearchTahfiz: "/",
  DonationPage: "/",
  SubmitSuggestion: "/",
  MapView: "/",
  StatusCheck: "/",

  // Feature & row cards (UserDashboard body)
  SurahPage: "/",
  SolatJenazah: "/",
  SearchMosque: "/",
  SearchHeritage: "/",

  // Bottom navigation bar (Layout) & Floating Action Button
  SettingsPage: "/",
  JenazahEmergency: "/",

  // Detail pages — back to their parent search/list page
  GraveDetails: "/searchgrave",
};
