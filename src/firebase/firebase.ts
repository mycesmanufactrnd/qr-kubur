import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken } from "firebase/messaging";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA1mnqTzd0xkTcuQeKCmKfxne86agVcfRw",
  authDomain: "myces-qr-kubur.firebaseapp.com",
  projectId: "myces-qr-kubur",
  storageBucket: "myces-qr-kubur.firebasestorage.app",
  messagingSenderId: "681335807437",
  appId: "1:681335807437:web:2093110bbc258bd706f884",
  measurementId: "G-M201KH668N"
};

const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const messaging = getMessaging(app);
export { getToken };
