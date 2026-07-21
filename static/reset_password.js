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
