// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here. Other Firebase libraries
// are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.2/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyDMyaDjfcBRv-7B4EdO3MvrZcygg-MBg0Q",
  authDomain: "flexi-hr.firebaseapp.com",
  projectId: "flexi-hr",
  storageBucket: "flexi-hr.appspot.com",
  messagingSenderId: "1038123456789",
  appId: "1:1038123456789:web:abcdef1234567890"
});

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// Optional: Add a listener for background messages (when app is in background)
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.svg', // optional
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});