importScripts(
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-app-compat.js"
);

importScripts(
    "https://www.gstatic.com/firebasejs/12.18.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
    apiKey: "AIzaSyDwPw2DS2KMJeFyQme4dWMSXPlaD1wMgvU",
    authDomain: "cognitive-gaming.firebaseapp.com",
    projectId: "cognitive-gaming",
    storageBucket: "cognitive-gaming.firebasestorage.app",
    messagingSenderId: "403629835058",
    appId: "1:403629835058:web:d02620e9f67073aef0cd2b"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {

    console.log(
        "🔔 Background message received:",
        payload
    );

    const notificationTitle =
        payload.notification?.title ||
        "Cognitive Gaming Reminder";

    const notificationOptions = {

        body:
            payload.notification?.body ||
            "You have a reminder.",

        icon: "/favicon.ico",

        tag: "cognitive-gaming-reminder",

        requireInteraction: true
    };

    self.registration.showNotification(
        notificationTitle,
        notificationOptions
    );
});