import { initializeApp } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/9.0.0/firebase-firestore.js";

if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/src/service-worker.js').then(function(registration) {
            console.log('Service Worker registered with scope: ', registration.scope);
        }, function(error) {
            console.log('Service Worker registration failed:', error);
        });
    });
}

document.querySelectorAll('.progress-bar').forEach(bar => {
    bar.addEventListener('input', function() {
        const percentage = document.getElementById(`percentage-${this.id.split('-')[2]}`);
        percentage.textContent = `${this.value}%`;
    });
});

async function getConfig() {
    const response = await fetch('/.netlify/functions/config');
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    const config = await response.json();
    return config.firebaseConfig;
}

getConfig().then(firebaseConfig => {
    // Initialize Firebase with the fetched config
    if (firebaseConfig) {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const provider = new GoogleAuthProvider();
        const db = getFirestore(app);

        document.getElementById('login-btn').addEventListener('click', () => {
            signInWithPopup(auth, provider).then(result => {
                const credential = GoogleAuthProvider.credentialFromResult(result);
                const token = credential.accessToken;

                const user = result.user;
                console.log('User signed in: ', user);
            }).catch(error => {
                const errorCode = error.code;
                const errorMessage = error.message;
                const email = error.customData.email;
                const credential = GoogleAuthProvider.credentialFromError(error);
                console.error('Error during sign in: ', error)
            });
        });

        onAuthStateChanged(auth, user => {
            if (user) {
                // user is signed in
                console.log('User is signed in: ', user);
                loadProgress(user.uid).then(progressData => {
                    console.log(progressData);
                });
            } else {
                // no user is signed in
                console.log('No user is signed in.');
            }
        });

        document.getElementById('logout-btn').addEventListener('click', () => {
            signOut(auth).then(() => {
                // user signed out
                console.log('User signed out.');
            }).catch(error => {
                // handle errors
                console.error('Error during sign out: ', error);
            });
        });

        async function saveProgress(uid, progressData) {
            try {
                await setDoc(doc(db, 'users', uid), { progressData });
            } catch (e) {
                console.error('Error adding document: ', e);
            }
        }

        async function loadProgress(uid) {
            const docRef = doc(db, 'users', uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                return docSnap.data().progressData;
            } else {
                console.log('No such document!');
                return null;
            }
        }
    }
}).catch(error => {
    console.error('Error fetching Firebase config: ', error);
});