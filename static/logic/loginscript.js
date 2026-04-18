const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzW2HZasraDWvt8CAfLwKJkGMqfQSOnThP1JOsAlaorhy2a5Tyb0mkbsgzm3lJJBvk/exec";
const REDIRECT_URL = "dashboard.html";
function toggle(){
  const r = document.getElementById('registerBox');
  const l = document.getElementById('loginBox');
  const t = document.getElementById('title');
  const s = document.getElementById('switchLink');
  if(r.style.display === "none"){
    r.style.display="block";
    l.style.display="none";
    t.innerText="Register";
    s.innerText="Login";
  } else {
    r.style.display="none";
    l.style.display="block";
    t.innerText="Login";
    s.innerText="Register";
  }
}
function showLoader(show){
  document.getElementById('loader').style.display = show ? "block" : "none";
}
function register(){
  const msg = document.getElementById('msg');
  msg.innerText = "";
  showLoader(true);
  fetch(SCRIPT_URL,{
    method:"POST",
    body:JSON.stringify({
      action:"register",
      username: document.getElementById('username').value.trim(),
      email: document.getElementById('email').value.trim(),
      address: document.getElementById('country').value.trim(),
       phone: document.getElementById('phone').value.trim(),
      password: document.getElementById('password').value.trim()
    })
  })
  .then(r => r.json())
  .then(d => {
    showLoader(false);
    msg.innerText = d.message;

    if(d.status === "success"){
      toggle();
    }
  })
  .catch(()=>{
    showLoader(false);
    msg.innerText = "Network error";
  });
}
function login(){
  const msg = document.getElementById('msg');
  msg.innerText = "";
  showLoader(true);
  fetch(SCRIPT_URL,{
    method:"POST",
    body:JSON.stringify({
      action:"login",
      username: document.getElementById('lusername').value.trim(),
      password: document.getElementById('lpassword').value.trim()
    })
  })
  .then(r => r.json())
  .then(d => {
    showLoader(false);
    msg.innerText = d.message;
    if(d.status === "success"){
      setTimeout(()=>{
        window.location.href = "dashboard.html";
      }, 800);
    }
  })
  .catch(()=>{
    showLoader(false);
    msg.innerText = "Network error";
  });
}
function verifyCaptcha() {
  if (grecaptcha.getResponse().length === 0) {
    alert("Captcha required");
    return false;
  }
  return true;
}
function login() {
    window.location.href = "login/login_register.html";
}