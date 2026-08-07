// إعدادات المشروع
const firebaseConfig = {
    apiKey: "AIzaSyBxwAJZBwaVUojcz65DiLjv9VFzrHqKc70",
    authDomain: "arabic-platform-ad631.firebaseapp.com",
    projectId: "arabic-platform-ad631",
    storageBucket: "arabic-platform-ad631.firebasestorage.app",
    messagingSenderId: "69982424288",
    appId: "1:69982424288:web:a6d91e1ec9e6544b07d485",
    measurementId: "G-H25F28KMVQ"
  };

  // تهيئة فايربيس بالطريقة الكلاسيكية السريعة
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();