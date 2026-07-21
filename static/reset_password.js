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
