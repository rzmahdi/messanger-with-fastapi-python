const login_form = document.getElementById("login-form");
const login_empty_username_span = document.getElementById("login-empty-username");
const login_notif_modal = document.getElementById("login-modal-overlay-notif");
const login_notif_text = document.getElementById("login-notif-modal-text");
const login_close_notif_btn = document.getElementById("login-modal-notif-close-btn");
let login_status = false;

login_close_notif_btn.addEventListener("click", (e)=>{
    close_notif();

    if(login_status)
        redirect_to_home();
});


function show_notif(text){
    login_notif_modal.classList.add("show");
    login_notif_text.innerHTML = text;
}

function close_notif(){
    login_notif_modal.classList.remove("show");
}

function redirect_to_home(){
    window.location.href = "/"
}

function showPasswordToggle(eye_id, input_id){
    const eye_btn = document.getElementById(eye_id);
    const input = document.getElementById(input_id);

    eye_btn.addEventListener("click", ()=>{
        const is_password = input.type === "password";
        input.type = is_password ? "text" : "password";

        eye_btn.querySelector(".bi-eye").classList.toggle("show", !is_password);
        eye_btn.querySelector(".bi-eye-slash").classList.toggle("show", is_password);
    })
}
showPasswordToggle("password-eye", "login-password");

login_form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const username = document.getElementById("login-username").value;
    const password = document.getElementById("login-password").value;
    const form_data = new FormData();
    form_data.append("username", username);
    form_data.append("password", password);


    if(!username){
        login_empty_username_span.classList.add("error");
        return
    }else{
        login_empty_username_span.classList.remove("error");
    }

    const response = await fetch("/login", {
        method: "POST",
        body: form_data
    });

    if(response.ok){
        const data = await response.json();
        localStorage.setItem("access_token", data.access_token);
        localStorage.setItem("refresh_token", data.refresh_token);

        const user_response = await fetch("/me", {
            headers: {
                Authorization: `Bearer ${data.access_token}`
            }
        })
        const user = await user_response.json();
        show_notif("Your Log in was successfull✅");
        login_status = true;
    }else if(response.status === 401){
        show_notif("Username or password are wrong!❌");
    }
})


login_notif_modal.addEventListener("click", (e)=>{
    if(e.target === login_notif_modal){
        close_notif();

        if(login_status){
           redirect_to_home();
    }
    }
})
