# FCM Flow

---

## 1. App Startup — Register Device Token

```
Browser opens app
  └── src/main.jsx
        └── renders <App />
              └── src/App.jsx
                    └── useFCM()  ← called on every mount
                          └── src/firebase/useFCM.ts
                                ├── getStoredGoogleUser()  ← checks localStorage["googleAuth"]
                                │     └── src/utils/auth.ts → getStoredGoogleUser()
                                │
                                ├── if no Google user → stop (admin/non-Google users ignored)
                                │
                                └── initFCM()
                                      └── src/firebase/firebase.ts → initFCM()
                                            ├── reads VITE_FIREBASE_VAPID_KEY from .env
                                            ├── Notification.requestPermission()
                                            ├── navigator.serviceWorker.register("/firebase-messaging-sw.js")
                                            │     └── public/firebase-messaging-sw.js  ← loaded by browser
                                            ├── navigator.serviceWorker.ready  ← waits until SW active
                                            └── getToken(messaging, { vapidKey, serviceWorkerRegistration })
                                                  └── returns FCM token string
                                                        ├── localStorage.setItem("fcmToken", token)
                                                        └── trpcClient.google.saveDeviceToken()
                                                              └── backend/src/routers/googleRouter.ts
                                                                    → saveDeviceToken mutation
                                                                          └── backend/src/db/entities/GoogleUser/GoogleUserDevice.entity.ts
                                                                                → upsert row: { fcmToken, googleuser }
```

---

## 2. Google User Login — Token Also Saved

```
User logs in with Google
  └── src/utils/auth.ts → useLoginGoogle()
        └── trpc.auth.loginGoogle.useMutation onSuccess
              ├── setStoredGoogleAuth(data.user)  ← saves to localStorage["googleAuth"]
              └── navigate to UserDashboard
                    └── App re-renders → useFCM() runs again → token saved (same as flow above)
```

---

## 3. Background Notifications (App Closed / Not Focused)

```
Firebase push arrives while app is in background
  └── public/firebase-messaging-sw.js
        └── messaging.onBackgroundMessage(payload)
              └── self.registration.showNotification(title, { body, icon })
                    → OS shows notification to user
```

---

## 4. Admin Accepts Tahlil Request → Push Sent to User

```
Admin opens ManageTahlilRequests, clicks Approve
  └── src/pages/Management/ManageTahlilRequests.jsx
        └── handleStatusChange(TahlilStatus.ACCEPTED)
              └── useUpdateTahlilRequest().mutateAsync({ id, data: { status: "accepted", suggesteddate } })
                    └── src/hooks/useTahlilRequestMutations.ts
                          └── trpc.tahlilRequest.update.useMutation()
                                └── backend/src/routers/tahlilRequestRouter.ts
                                      → update mutation
                                            ├── saves updated TahlilRequest to DB
                                            │
                                            └── if status === "accepted"
                                                  └── sendNotificationFCMFromGoogle({ entityname: "tahlilrequest", entityid, extraParam })
                                                        └── backend/src/services/firebase.service.ts
                                                              ├── GoogleUserRecord repo
                                                              │     → find record where entityname="tahlilrequest" AND entityid=request.id
                                                              │           └── (was created when user submitted the request)
                                                              │                 └── backend/src/routers/tahlilRequestRouter.ts → create mutation
                                                              │
                                                              ├── GoogleUserDevice repo
                                                              │     → find all devices WHERE googleuser.id = record.googleuser.id
                                                              │           └── backend/src/db/entities/GoogleUser/GoogleUserDevice.entity.ts
                                                              │
                                                              └── sendPushNotifications(tokens, { title, body }, { requestId })
                                                                    └── admin.messaging().sendEachForMulticast(...)
                                                                          └── Firebase FCM servers
                                                                                └── push delivered to user's device(s)
                                                                                      └── public/firebase-messaging-sw.js
                                                                                            → showNotification() if app in background
```

---

## Files Reference

| File | Role |
|------|------|
| `src/App.jsx` | Calls `useFCM()` on every mount |
| `src/firebase/useFCM.ts` | Hook: checks Google user, calls `initFCM`, saves token to backend |
| `src/firebase/firebase.ts` | `initFCM()`: SW registration + permission + `getToken` |
| `public/firebase-messaging-sw.js` | SW: background message handler, shows OS notification |
| `src/utils/auth.ts` | `getStoredGoogleUser()` used by `useFCM` |
| `backend/src/routers/googleRouter.ts` | `saveDeviceToken` mutation (upserts device) |
| `backend/src/db/entities/GoogleUser/GoogleUserDevice.entity.ts` | `googleuserdevice` table |
| `backend/src/routers/tahlilRequestRouter.ts` | Triggers notification on status = accepted |
| `backend/src/services/firebase.service.ts` | Looks up devices, sends via Firebase Admin |
| `.env` | `VITE_FIREBASE_VAPID_KEY` (frontend), `FIREBASE_SERVICE_ACCOUNT` (backend) |
