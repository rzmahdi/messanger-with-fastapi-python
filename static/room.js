const send_message_btn = document.getElementById("send-btn");
const edit_message_btn = document.getElementById("edit-btn");
const message_input = document.getElementById("message-input");
const go_to_bottom_btn = document.getElementById("go-to-bottom-container");
const message_context_box = document.getElementById("message-context-box");
const message_context_edit_btn = document.getElementById("edit-message-btn");
const message_context_delete_btn = document.getElementById("delete-message-btn");
const chat_title_element = document.getElementById("chat-title");
const chat_online_users_element = document.getElementById("chat-online-number");

const chat_title_container = document.getElementById("chat-title-container");

const room_context_box = document.getElementById("room-context-box");
const room_context_edit_btn = document.getElementById("edit-room-btn");
const room_context_delete_btn = document.getElementById("delete-room-btn");

const edit_modal_overlay = document.getElementById("modal-overlay");
const close_modal_btn = document.getElementById("modal-edit-room-name-close-btn");
const rename_room_btn = document.getElementById("modal-edit-room-name-btn");
const rename_input = document.getElementById("edit-room-name-input");
const room_name_error_span = document.getElementById("room-name-error");

const edit_box = document.getElementById("edit-box");
const close_edit_box_btn = document.getElementById("edit-box-close-btn");

const reply_box = document.getElementById("reply-box");
const close_reply_box_btn = document.getElementById("reply-box-close-btn");
const reply_username_placeholder = document.getElementById("reply-username-placeholder");
const replied_message_content_placeholder = document.getElementById("replied-message");


const user_status_container = document.getElementById("user-status-container");
const online_container = document.getElementById("online-container");
const offline_container = document.getElementById("offline-container");

const token = localStorage.getItem("access_token");
const current_user = parseJwt(token);

const username_colors = [
    "#ffae00",
    "#ff6b6b",
    "#4ecdc4",
    "#a78bfa",
    "#60a5fa",
    "#34d399",
    "#f472b6",
    "#fbbf24",
];


let oldest_message_id = null;
let selected_message_id = null;
let is_editing = null;
let is_replied = null;

chat_title_element.textContent = room_name;


function redirect_to_login(){
    window.location.href = "/login";
}


async function checkLogin(){
    const token = await getValidToken();
    if(!token){
        redirect_to_login();
        return false;
    }

    const response = await fetch("/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    });

    if(response.status === 401){
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        redirect_to_login();
        return false;
    }

    return true;
}


function isSocketReady(){
    return window.socket && socket.readyState === WebSocket.OPEN;
}


async function initRoom(){
    await checkLogin();

    const fresh_token = localStorage.getItem("access_token");

    window.socket = new WebSocket(
        `ws://${window.location.host}/ws/${room_id}/messages?token=${fresh_token}`
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
            if(data.scope === "rename_room"){
                if(data.status === "409"){
                    hideErrorSpan();
                    showErrorSpan(data.content);
                }

                if(data.status === "403"){
                    hideErrorSpan();
                    showErrorSpan(data.content);
                }
            }else if(data.scope === "delete_room"){
                if(data.status === "403"){
                    alert(data.content);
                    hideContextBox();
                }
            }
        }
    };

    socket.onclose = ()=>{
        hideUserStatus();
        hideOnlineStatus();
        setTimeout(() => {
            showOfflineStatus();
            showUserStatus();
        }, 10);
    };

    socket.onopen = ()=>{
        hideUserStatus();
        hideOfflineStatus();
        setTimeout(() => {
            showOnlineStatus();
            showUserStatus();
        }, 10);
    };
}


function getUserColor(username){
    return username_colors[username.charCodeAt()%username_colors.length];
}



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

    const message_container = document.createElement("div");
    message_container.className = "message-container";
    message_container.dataset.message_id = message.id;

    const div = document.createElement("div");
    div.className = "message";
    div.dataset.message_id = message.id;


    div.innerHTML = `
        <div>
            <p dir='auto'>${message.content}</p>
        </div>
        <span>${formatDate(message.created_at)}</span>
    `;

    if(message.reply_id){
        const reply_div = document.createElement("div");
        const reply_div_username = document.createElement("p");
        const reply_div_text = document.createElement("p");

        reply_div.className = "message-reply-container";
        reply_div_username.className = "message-reply-username";
        reply_div_text.className = "message-reply-text";

        if(message.reply){
            const color = getUserColor(message.reply.user.username);

            reply_div_username.textContent = message.reply.user.username;
            reply_div_username.style.color = color;

            reply_div.style.background = color + "25";
            reply_div.style.borderColor = color;

            reply_div_text.textContent = message.reply.content;
            reply_div_text.dir = "auto";
        }else{
            reply_div.classList.add("deleted");
            reply_div_username.remove();

            reply_div_text.textContent = "Message Deleted";
            reply_div_text.dir = "auto";
        }

        reply_div.appendChild(reply_div_username);
        reply_div.appendChild(reply_div_text);

        reply_div.addEventListener("click", (e)=>{
            e.stopPropagation();
            hideContextBox();

            if(!message.reply){
                return;
            }

            const target_el = document.querySelector(`[data-message_id='${message.reply_id}']`);
            
            if(!target_el){
                console.warn("Original message not found in DOM (may need to load older messages)");
                return;
            }

            target_el.scrollIntoView({ behavior: "smooth", block: "center" });
            target_el.classList.add("highlight");

            setTimeout(() => {
                target_el.classList.remove("highlight");
            }, 1000);
        });

        div.firstElementChild.prepend(reply_div);
    }


    const username = message.user.username;
    if(username === current_user.sub){
        div.classList.add("me");
        message_container.classList.add("me");
    }else{
        const b = document.createElement("b");
        b.textContent = username;
        b.style.color = getUserColor(username);
        div.firstElementChild.prepend(b);
    }


    if(message.is_edited){
        const span = document.createElement("span");
        span.textContent = "edited";
        div.appendChild(span);
    }


    message_container.addEventListener("dblclick", (e)=>{
        e.preventDefault();
        showReplyBox();
        hideEditBox();
        hideContextBox();

        is_replied = true;
        selected_message_id = message.id;
        message_input.focus();
        reply_username_placeholder.textContent = `Reply To ${username}`;
        replied_message_content_placeholder.textContent = message.content;
    });


    let click_timer = null;
    div.addEventListener("click", (e)=>{
        if(div.classList.contains("me")){
            e.stopPropagation();
            const message_element = e.target.closest(".message");
            if(!message_element) return;

            if(click_timer){
                clearTimeout(click_timer);
                click_timer = null;
                return;
            }

            click_timer = setTimeout(() => {
                selected_message_id = message_element.dataset.message_id;
                hideRoomContextBox();
                showContextBox(e.clientX, e.clientY);
                click_timer = null;
            }, 250);
        }
    });

    message_container.appendChild(div);


    if(prepend){
        container.prepend(message_container);
    }else {
        container.appendChild(message_container);
    }

    return message_container;
}

function sendMessage(){
    const message = message_input.value.trim();

    if(!message) return;

    if(!isSocketReady()){
        console.warn("Socket not ready yet, message not sent.");
        return;
    }

    if(is_replied){
        socket.send(JSON.stringify({
            type: "reply",
            content: message,
            reply_id: selected_message_id
        }));
        message_input.value = "";
        hideReplyBox();
        return;
    }

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
    );
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

    const context_box_rect = message_context_box.getBoundingClientRect();
    const container_rect = container.getBoundingClientRect();

    let final_x = x;
    let final_y = y;

    if(context_box_rect.right > container_rect.right){
        final_x = context_box_rect.left - context_box_rect.width;
    }

    if(context_box_rect.bottom > container_rect.height){
        final_y = context_box_rect.top - context_box_rect.height;
    }

    message_context_box.style.left = `${final_x}px`;
    message_context_box.style.top = `${final_y}px`;
}

function editMessage(){
    if(!isSocketReady()){
        console.warn("Socket not ready yet, edit not sent.");
        return;
    }

    socket.send(JSON.stringify({
        type: "edit",
        message_id: selected_message_id,
        content: message_input.value
    }));

    message_input.value = "";
    autoResizeTextarea();
}


function showRoomContextBox(x, y){
    room_context_box.className = "show";
    room_context_box.style.left = `${x}px`;
    room_context_box.style.top = `${y}px`;

    const room_context_box_rect = room_context_box.getBoundingClientRect();
    const device_width = window.innerWidth;
    const device_height = window.innerHeight;

    let final_x = x;
    let final_y = y;

    if(room_context_box_rect.right >= device_width){
        final_x = room_context_box_rect.left - room_context_box_rect.width;
    }

    if(room_context_box_rect.bottom > device_height){
        final_y = room_context_box_rect.top - room_context_box_rect.height;
    }

    room_context_box.style.left = `${final_x}px`;
    room_context_box.style.top = `${final_y}px`;
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

function showEditBox(){
    edit_box.classList.remove("disable");
    setTimeout(() => {
        edit_box.classList.add("show");
    }, 10);
}
function hideEditBox(){
    edit_box.classList.remove("show");
    setTimeout(() => {
        edit_box.classList.add("disable");
    }, 400);
}

function showReplyBox(){
    reply_box.classList.remove("disable");
    setTimeout(() => {
        reply_box.classList.add("show");
    }, 10);
}
function hideReplyBox(){
    reply_box.classList.remove("show");
    setTimeout(() => {
        reply_box.classList.add("disable");
    }, 400);
}

function showUserStatus(){
    user_status_container.classList.add("show");
}
function hideUserStatus(){
    user_status_container.classList.remove("show");
}

function showOnlineStatus(){
    online_container.classList.add("show");
}
function hideOnlineStatus(){
    online_container.classList.remove("show");
}

function showOfflineStatus(){
    offline_container.classList.add("show");
}
function hideOfflineStatus(){
    offline_container.classList.remove("show");
}

function deleteMessage(){
    if(!isSocketReady()){
        console.warn("Socket not ready yet, delete not sent.");
        return;
    }

    socket.send(JSON.stringify({
        type: "delete",
        message_id: selected_message_id
    }));
}

function renameRoom(room_name){
    if(!isSocketReady()){
        console.warn("Socket not ready yet, rename not sent.");
        return;
    }

    socket.send(JSON.stringify({
        type: "room_edit_name",
        name: room_name
    }));
}

function deleteRoom(){
    if(!isSocketReady()){
        console.warn("Socket not ready yet, delete room not sent.");
        return;
    }

    socket.send(JSON.stringify({
        type: "delete_room"
    }));
}

function updateMessageInDOM(content, message_id){
    document.querySelector(`.message[data-message_id='${message_id}'] p`).textContent = content;
    message_input.value = "";
    hideEditBtn();
    showSendBtn();
    is_editing = false;

    const div = document.querySelector(`.message[data-message_id='${message_id}']`);

    if(div.lastChild.textContent !== "edited"){
        const span = document.createElement("span");
        span.textContent = "edited";
        div.appendChild(span);
    }
}

function deleteMessageInDOM(message_id){
    const el = document.querySelector(`[data-message_id='${message_id}']`);
    if(!el) return;

    el.classList.add("remove");
    setTimeout(() => {
        el.remove();
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
    hideReplyBox();
    showEditdBtn();
    showEditBox();

    message_input.focus();

    message_input.value = document.querySelector(`[data-message_id='${selected_message_id}']`).getElementsByTagName("p")[0].textContent;
    autoResizeTextarea();
});

message_context_delete_btn.addEventListener("click", async ()=>{
    hideContextBox();
    await checkLogin();

    deleteMessage();
});


edit_message_btn.addEventListener("click", async ()=>{
    await checkLogin();
    hideEditBox();

    editMessage();
});

chat_title_container.addEventListener("click", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    hideContextBox();
    showRoomContextBox(e.clientX, e.clientY);
});

go_to_bottom_btn.addEventListener("click", scrollToBottom);

send_message_btn.addEventListener("click", sendMessage);

message_input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault();
        if(is_editing){
            hideEditBox();
            editMessage();
        }else if(is_replied){
            hideReplyBox();
            sendMessage();
            is_replied = false;
            message_input.value = "";
        }else{
            sendMessage();
        }
    }
});


message_input.addEventListener("input", (e)=>{
    autoResizeTextarea();
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
});

room_context_delete_btn.addEventListener("click", ()=>{
    hideRoomContextBox();
    deleteRoom();
});

rename_room_btn.addEventListener("click", async ()=>{
    await checkLogin();

    const new_room_name = rename_input.value;

    if(new_room_name.length !== 0){
        renameRoom(new_room_name);
    }else{
        hideErrorSpan();
        showErrorSpan("this filed can not be empty!");
    }
});

rename_input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter"){
        e.preventDefault();

        const new_room_name = rename_input.value;
        if(new_room_name.length !== 0){
            renameRoom(new_room_name);
        }
    }
});

close_edit_box_btn.addEventListener("click", ()=>{
    message_input.value = "";
    autoResizeTextarea();
    hideEditBox();
    hideEditBtn();
    showSendBtn();
    is_editing = false;
});
close_reply_box_btn.addEventListener("click", ()=>{
    message_input.value = "";
    is_replied = false;
    hideReplyBox();
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
    if(window.socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)){
        socket.close();
    }
});


async function init(){
    await initRoom();
    await loadMessages();
}
init();