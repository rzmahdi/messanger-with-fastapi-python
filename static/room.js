const send_message_btn = document.getElementById("send-btn");
const edit_message_btn = document.getElementById("edit-btn");
const message_input = document.getElementById("message-input");
const go_to_bottom_btn = document.getElementById("go-to-bottom-container");
const message_context_box = document.getElementById("message-context-box");
const message_context_edit_btn = document.getElementById("edit-message-btn");
const message_context_delete_btn = document.getElementById("delete-message-btn");
const chat_title_element = document.getElementById("chat-title");
const chat_online_users_element = document.getElementById("chat-online-number");
const token = localStorage.getItem("access_token");

const chat_title_container = document.getElementById("chat-title-container");

const room_context_box = document.getElementById("room-context-box");
const room_context_edit_btn = document.getElementById("edit-room-btn");
const room_context_delete_btn = document.getElementById("delete-room-btn");

const edit_modal_overlay = document.getElementById("modal-overlay");
const close_modal_btn = document.getElementById("modal-edit-room-name-close-btn");
const rename_room_btn = document.getElementById("modal-edit-room-name-btn");
const rename_input = document.getElementById("edit-room-name-input");
const room_name_error_span = document.getElementById("room-name-error");

let oldest_message_id = null;
let selected_message_id = null;
let is_editing = null;

chat_title_element.textContent = room_name;

async function checkLogin(){    
    if(!token){
        window.location.href = "/login";
        return
    }

    const response = await fetch("/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if(response.status === 401){
        localStorage.removeItem("access_token");
        window.location.href = "/login";
        return
    }
}
checkLogin()


function parseJwt(token){
    try {
        const base64Payload = token.split(".")[1];
        const payload = JSON.parse(atob(base64Payload.replace(/-/g, "+").replace(/_/g, "/")));
        return payload;
    } catch(err){
        console.error("Invalid token:", err);
        return null;
    }
}
const current_user = parseJwt(token);

function formatDate(dateString) {
    return new Date(dateString).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    });
}

async function loadMessages(){
    const res = await fetch(`/room/${room_id}/messages?limit=20`);
    const messages = await res.json();

    messages.forEach(m => addMessage(m));

    if(messages.length > 0){
        oldest_message_id = messages[0].id;
    }

    scrollToBottom();
}

function addMessage(message, prepend = false){
    const container = document.getElementById("messages");

    const div = document.createElement("div");
    div.className = "message";
    div.dataset.message_id = message.id;

    div.innerHTML = `
        <div>
            <p dir='auto'>${message.content}</p>
        </div>
        <span>${formatDate(message.created_at)}</span>
    `;

    if(message.user.username === current_user.sub){
        div.classList.add("me");
    }else{
        const b = document.createElement("b");
        b.textContent = message.user.username;
        div.firstElementChild.prepend(b);
    }


    if(message.is_edited){
        const span = document.createElement("span");
        span.textContent = "edited";
        div.appendChild(span);
    }


    div.addEventListener("contextmenu", (e)=>{
        if(div.classList.contains("me")){
            const message = e.target.closest(".message");
            if(!message) return;

            selected_message_id = message.dataset.message_id;
            hideContextBox();
            showContextBox(e.clientX, e.clientY);
        }
        e.preventDefault();
    });


    if(prepend){
        container.prepend(div);
    }else {
        container.appendChild(div);
    }

    return div;
}

function sendMessage(){
    const message = message_input.value.trim();

    if(!message) return;

    socket.send(JSON.stringify({
        content: message
    }));

    message_input.value = "";
    autoResizeTextarea();
}


function isNearBottom(){
    const messages = document.getElementById("messages");

    return (
        messages.scrollHeight -
        messages.scrollTop -
        messages.clientHeight < 100
    )
}

function scrollToBottom(){
    const messages = document.getElementById("messages");
    messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}


const container = document.getElementById("messages");
let is_loading_older = false;

container.addEventListener("scroll", async () => {
    go_to_bottom_btn.classList.toggle("show", !isNearBottom());

    if (container.scrollTop === 0 && !is_loading_older && oldest_message_id !== null) {
        is_loading_older = true;

        const res = await fetch(
            `/room/${room_id}/messages?limit=20&before_id=${oldest_message_id}`
        );
        const older_messages = await res.json();

        if (older_messages.length === 0) {
            oldest_message_id = null;
            is_loading_older = false;
            return;
        }

        oldest_message_id = older_messages[0].id;

        const previous_scroll_height = container.scrollHeight;

        for (let i = older_messages.length - 1; i >= 0; i--) {
            addMessage(older_messages[i], true);
        }

        const new_scroll_height = container.scrollHeight;
        container.scrollTop += (new_scroll_height - previous_scroll_height);

        is_loading_older = false;
    }
});


function autoResizeTextarea(){
    const style = getComputedStyle(message_input);
    const line_height = parseFloat(style.lineHeight);
    const padding = parseFloat(style.paddingTop) + parseFloat(style.paddingBottom);
    const border = parseFloat(style.borderTopWidth) + parseFloat(style.borderBottomWidth);

    const max_lines = 4;
    const min_height = line_height * 1 + padding + border;
    const max_height = line_height * max_lines + padding + border;

    message_input.style.height = "auto";

    const content_height = message_input.scrollHeight + border;

    const new_height = Math.min(Math.max(content_height, min_height), max_height);
    message_input.style.height = new_height + "px";

    message_input.style.overflowY = content_height > max_height ? "auto" : "hidden";
}


function showContextBox(x, y){
    message_context_box.className = "show";
    message_context_box.style.left = `${x}px`;
    message_context_box.style.top = `${y}px`;
}

function editMessage(){
    socket.send(JSON.stringify({
        type: "edit",
        message_id: selected_message_id,
        content: message_input.value
    }));

    autoResizeTextarea();
}


function showRoomContextBox(x, y){
    room_context_box.className = "show";
    room_context_box.style.left = `${x}px`;
    room_context_box.style.top = `${y}px`;
}

function hideRoomContextBox(){
    room_context_box.classList.remove("show");
}

function showEditModal(){
    edit_modal_overlay.className = "show";
}

function hideEditModal(){
    edit_modal_overlay.classList.remove("show");
}

function showErrorSpan(error_message=null){
    room_name_error_span.classList.add("error");
    room_name_error_span.textContent = error_message;
}

function hideErrorSpan(){
    room_name_error_span.classList.remove("error");
}

function deleteMessage(){
    socket.send(JSON.stringify({
        type: "delete",
        message_id: selected_message_id
    }));
}

function renameRoom(room_name){
    socket.send(JSON.stringify({
        type: "room_edit_name",
        name: room_name
    }));
}

function updateMessageInDOM(content, message_id){
    document.querySelector(`[data-message_id='${message_id}'] p`).textContent = content;
    message_input.value = "";
    hideEditBtn();
    showSendBtn();
    is_editing = false;

    div = document.querySelector(`[data-message_id='${message_id}']`);

    if(div.lastChild.textContent !== "edited"){
        const span = document.createElement("span");
        span.textContent = "edited";
        div.appendChild(span);
    }
}

function deleteMessageInDOM(message_id){
    document.querySelector(`[data-message_id='${message_id}']`).classList.add("remove");
    setTimeout(() => {
        document.querySelector(`[data-message_id='${message_id}']`).remove();
    }, 210);
}

function renameRoomInDOM(name){
    chat_title_element.textContent = name;
    hideEditModal();
}

function hideContextBox(){
    message_context_box.classList.remove("show");
}

function showSendBtn(){
    send_message_btn.classList.add("show");
}

function hideSendBtn(){
    send_message_btn.classList.remove("show");
}

function showEditdBtn(){
    edit_message_btn.classList.add("show");
}

function hideEditBtn(){
    edit_message_btn.classList.remove("show");
}


message_context_edit_btn.addEventListener("click", ()=>{
    is_editing = true;
    hideContextBox();
    hideSendBtn();
    showEditdBtn();

    message_input.focus();

    message_input.value = document.querySelector(`[data-message_id='${selected_message_id}']`).getElementsByTagName("p")[0].textContent;
    autoResizeTextarea();
})

message_context_delete_btn.addEventListener("click", async()=>{
    hideContextBox();
    checkLogin();

    deleteMessage();
})


edit_message_btn.addEventListener("click", async ()=>{
    checkLogin();
    editMessage();
})

chat_title_container.addEventListener("contextmenu", (e)=>{
    e.preventDefault();
    showRoomContextBox(e.clientX, e.clientY);
})

go_to_bottom_btn.addEventListener("click", scrollToBottom)

// WebSocket
const socket = new WebSocket(
    `ws://${window.location.host}/ws/${room_id}/messages?token=${token}`
);

socket.onmessage = (e)=>{
    const data = JSON.parse(e.data);

    if(data.type === "message"){
        const should_scroll = isNearBottom();
        addMessage(data);
        if(should_scroll) scrollToBottom();
    }

    if(data.type == "edit"){
        updateMessageInDOM(data.content, data.id);
    }

    if(data.type == "delete"){
        deleteMessageInDOM(data.message_id);
    }

    if(data.type === "join"){
        chat_online_users_element.textContent = `${data.online_user_count} online`;
    }

    if(data.type === "leave"){
        chat_online_users_element.textContent = `${data.online_user_count} online`;
    }

    if(data.type === "room_deleted"){
        alert("This room has been deleted by the owner.");
        window.location.href = "/";
    }

    if(data.type === "room_edit_name"){
        renameRoomInDOM(data.new_name);
    }


    if(data.type === "error"){
        if(data.status === "409"){
            hideErrorSpan();
            showErrorSpan(data.content);
        }

        if(data.status === "403"){
            hideErrorSpan();
            showErrorSpan(data.content);
        }
    }
}


loadMessages();
send_message_btn.addEventListener("click", sendMessage);

message_input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault();
        if(is_editing){
            editMessage();
        }else{
            sendMessage();
        }
    }
});


message_input.addEventListener("input", (e)=>{
    autoResizeTextarea();
    if(message_input.value.length === 0){
        is_editing = false;
        hideEditBtn();
        showSendBtn();
    }
});

edit_modal_overlay.addEventListener("click", (e)=>{
    if(e.target === edit_modal_overlay){
        hideEditModal();
    }
});

close_modal_btn.addEventListener("click", ()=>{
    hideEditModal();
});


room_context_edit_btn.addEventListener("click", ()=>{
    rename_input.value = chat_title_element.textContent;
    hideRoomContextBox();
    hideErrorSpan();
    showEditModal();
})

rename_room_btn.addEventListener("click", async ()=>{
    checkLogin();

    new_room_name = rename_input.value;

    if(new_room_name.length !== 0){
        renameRoom(new_room_name);
    }else{
        hideErrorSpan();
        showErrorSpan("this filed can not be empty!");
    }
})

rename_input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
        e.preventDefault();

        new_room_name = rename_input.value;
        if(new_room_name.length !== 0){
            renameRoom(new_room_name);
        }
    }
})

document.addEventListener("click", (e) => {
    if (!message_context_box.contains(e.target)) {
        hideContextBox();
    }
    if (!room_context_box.contains(e.target)) {
        hideRoomContextBox();
    }
});


window.addEventListener("pagehide", () => {
    if(socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING){
        socket.close();
    }
});