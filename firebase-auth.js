import { initializeApp } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-app.js';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.2.1/firebase-auth.js';

const firebaseConfig = {
  apiKey: 'AIzaSyDXr4ryOOT-OHX1np8KIPER6_Nk60okylw',
  authDomain: 'freemarket-68274.firebaseapp.com',
  projectId: 'freemarket-68274',
  storageBucket: 'freemarket-68274.firebasestorage.app',
  messagingSenderId: '130108525153',
  appId: '1:130108525153:web:69fcce32c2f6eefbb93820',
  measurementId: 'G-F6N8GLFK45'
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function message(text, ok=false){
  const el=document.getElementById('authMessage');
  if(!el)return;
  el.textContent=text;
  el.style.color=ok?'#9af0c8':'#ff9aa6';
}

window.openAuth=()=>{document.getElementById('authModal')?.classList.add('show');message('')};
window.closeAuth=()=>document.getElementById('authModal')?.classList.remove('show');
window.registerAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value||'';
  if(!email||password.length<6){message('Enter a valid email and a password with at least 6 characters.');return;}
  try{await createUserWithEmailAndPassword(auth,email,password);message('Account created.',true);setTimeout(window.closeAuth,500)}catch(e){message(e.message.replace('Firebase: ','').replace(/\(auth\/.+\)\.?/,'').trim())}
};
window.loginAccount=async()=>{
  const email=document.getElementById('authEmail')?.value.trim();
  const password=document.getElementById('authPassword')?.value||'';
  try{await signInWithEmailAndPassword(auth,email,password);message('Logged in.',true);setTimeout(window.closeAuth,500)}catch(e){message('Email or password is incorrect.')}
};
window.logoutAccount=()=>signOut(auth);

onAuthStateChanged(auth,user=>{
  const login=document.getElementById('loginBtn');
  const userBox=document.getElementById('userBox');
  const userEmail=document.getElementById('userEmail');
  if(user){
    if(login)login.style.display='none';
    if(userBox)userBox.style.display='flex';
    if(userEmail)userEmail.textContent=user.email||'Account';
  }else{
    if(login)login.style.display='inline-flex';
    if(userBox)userBox.style.display='none';
    if(userEmail)userEmail.textContent='';
  }
});
