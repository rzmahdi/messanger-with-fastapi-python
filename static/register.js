const register_form = document.getElementById("register-form");
const passwords_not_match_span = document.getElementById("passwords-not-match");
const register_empty_username_span = document.getElementById("register-empty-username");
const register_notif_modal = document.getElementById("register-modal-overlay-notif");
const register_notif_text = document.getElementById("register-notif-modal-text");
const register_password_invalid_span = document.getElementById("register-password-invalid");
const register_close_notif_btn = document.getElementById("register-modal-notif-close-btn");

const select = document.getElementById("register-security-question");
const register_security_answer = document.getElementById("register-security-answer");
const answer_emprt_span = document.getElementById("answer-empty-span");
const question_invalid_span = document.getElementById("question-invalid-span");

let register_status = false;


register_close_notif_btn.addEventListener("click", (e)=>{
    close_notif();
    if(register_status)
        redirect_to_home();
});


function redirect_to_home(){
    window.location.href = "/";
}

function password_validation(password){
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;
    return passwordRegex.test(password);
}

function check_password(password, confirm_password){
    return password === confirm_password
}

function question_validation(){
    if(select.selectedIndex === 0) return false;
    return true;
}

function answer_validation(){
    if(register_security_answer.value.length === 0) return false;
    return true;
}

function show_notif(text){
    register_notif_modal.classList.add("show");
    register_notif_text.innerHTML = text;
}

function close_notif(){
    register_notif_modal.classList.remove("show");
}


async function loadSecurityQuestions(){
    const res = await fetch("/security_questions");
    const security_questins = await res.json();

    security_questins.questions.forEach(question => {
        const option = document.createElement("option");
        option.value = question;
        option.textContent = question;
        select.appendChild(option);
    });
}
loadSecurityQuestions();

register_form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    const confirm_password = document.getElementById("register-confirm-password").value;

    if(!username){
        register_empty_username_span.classList.add("error");
        return
    }else{
        register_empty_username_span.classList.remove("error");
    }

    if(!check_password(password, confirm_password)){
        passwords_not_match_span.classList.add("error");
        return
    }else{
        passwords_not_match_span.classList.remove("error");
    }

    if(!password_validation(password)){
        register_password_invalid_span.classList.add("error");
        return
    }else{
        register_password_invalid_span.classList.remove("error");
    }

    if(!question_validation()){
        question_invalid_span.classList.add("error");
        return
    }else{
        question_invalid_span.classList.remove("error");
    }

    if(!answer_validation()){
        answer_emprt_span.classList.add("error");
        return
    }else{
        answer_emprt_span.classList.remove("error");
    }


    const response = await fetch("/register", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            password,
        })
    })

    if(response.ok){
        show_notif("User successfuly created✅");
        register_status = true;
        localStorage.removeItem("access_token");
    }else if(response.status === 409){
        show_notif("User allready exists!❌");
    }
})


register_notif_modal.addEventListener("click", (e)=>{
    if(e.target === register_notif_modal){
        close_notif();
        if(register_status)
            redirect_to_home();
    }
})
