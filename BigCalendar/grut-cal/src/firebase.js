import firebase from 'firebase'

var config = {
    apiKey: "AIzaSyB6yKyD-Wm7GyXNikdiIgDU4Nf-ct0864s",
    authDomain: "helloworld-4201d.firebaseapp.com",
    databaseURL: "https://helloworld-4201d.firebaseio.com",
    projectId: "helloworld-4201d",
    storageBucket: "helloworld-4201d.appspot.com",
    messagingSenderId: "721450643918"
  };
  firebase.initializeApp(config);

var domain_provider = new firebase.auth.GoogleAuthProvider();
domain_provider.addScope('email');
domain_provider.setCustomParameters({
    'hd': 'g.hmc.edu'
});
export const provider = domain_provider
export const auth = firebase.auth();
export default firebase;
