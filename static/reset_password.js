const reset_form = document.getElementById("reset-form");

const reset_empty_username_span = document.getElementById("reset-empty-username");
const reset_empty_answer_span = document.getElementById("reset-empty-answer");
const reset_empty_password_span = document.getElementById("reset-empty-password");
const reset_invalid_password_span = document.getElementById("reset-invalid-password");

const reset_notif_modal = document.getElementById("reset-modal-overlay-notif");
const reset_notif_text = document.getElementById("reset-notif-modal-text");
const reset_close_notif_btn = document.getElementById("reset-modal-notif-close-btn");

const security_question_span = document.getElementById("security-question");

const username_input = document.getElementById("reset-username");
const answer_input = document.getElementById("reset-answer");
const password_input = document.getElementById("new-password");

let password_reset_status = null;
localStorage.removeItem("reset_token");


function show_notif(text){
    reset_notif_modal.classList.add("show");
    reset_notif_text.innerHTML = text;
}

function close_notif(){
    reset_notif_modal.classList.remove("show");
}

function show_username_empty(){
    reset_empty_username_span.classList.add("error");
}
function hide_username_empty(){
    reset_empty_username_span.classList.remove("error");
}

function show_answer_empty(){
    reset_empty_answer_span.classList.add("error");
}
function hide_answer_empty(){
    reset_empty_answer_span.classList.remove("error");
}

function show_password_empty(){
    reset_empty_password_span.classList.add("error");
}
function hide_password_empty(){
    reset_empty_password_span.classList.remove("error");
}

function show_password_invalid(){
    reset_invalid_password_span.classList.add("error");
}
function hide_password_invalid(){
    reset_invalid_password_span.classList.remove("error");
}

function show_security_question(question){
    security_question_span.classList.add("show");
    security_question_span.textContent = question;
}
function hide_sequrity_question(){
    security_question_span.classList.remove("show");
}


function password_validation(password){
    const passwordRegex = /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;
    return passwordRegex.test(password);
}

reset_form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const username = username_input.value;
    const security_answer = answer_input.value;
    const new_password = password_input.value;


    if(username.length === 0){
        show_username_empty();
        return;
    }else{
        hide_username_empty();
        const security_question_res = await fetch(`/forgot-password/${username}`);

        if(security_question_res.ok){
            security_question = await security_question_res.json();
            show_security_question(security_question.question);

        }else if(security_question_res.status === 404){
            hide_sequrity_question();
            show_notif("user not found!❌");
            let password_reset_status = false;
            return;
        }
    }

    if(security_answer.length === 0){
        show_answer_empty();
        return;
    }else{
        hide_answer_empty();
    }

    if(new_password.length === 0){
        show_password_empty();
        return;
    }else{
        hide_password_empty();
    }

    if(!password_validation(new_password)){
        show_password_invalid();
        return;
    }else{
        hide_password_invalid();
    }

    const verify_password_res = await fetch("/forgot-password/verify", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            username,
            security_answer
        })
    })

    if(verify_password_res.ok){
        const res = await verify_password_res.json();
        localStorage.setItem("reset_token", res.reset_token);
    }else{
        const error = await verify_password_res.json();
        show_notif(error.detail+"❌");
        let password_reset_status = false;
        return;
    }
    
    reset_token = localStorage.getItem("reset_token");
    if(!reset_token){
        show_notif("something went wrong! try again❌");
        let password_reset_status = false;
        return;
    }


    const reset_password_res = await fetch("/forgot-password/reset", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            new_password,
            reset_token

        })
    });
    if(reset_password_res.ok){
        show_notif("password Changed Successfully✅");
        password_reset_status = true;
    }else{
        const error = await reset_password_res.json();
        show_notif(error.detail+"❌");
        password_reset_status = false;
        return;
    }

})


reset_notif_modal.addEventListener("click", (e)=>{
    if(e.target === reset_notif_modal){
        close_notif();
        if(password_reset_status)
            window.location.href = "/login";
    }
})
reset_close_notif_btn.addEventListener("click", ()=>{
    close_notif();
    if(password_reset_status)
        window.location.href = "/login";
});