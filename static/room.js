const send_message_btn = document.getElementById("send-btn");
const edit_message_btn = document.getElementById("edit-btn");
const message_input = document.getElementById("message-input");
const go_to_bottom_btn = document.getElementById("go-to-bottom-container");
const message_context_box = document.getElementById("message-context-box");
const message_context_edit_btn = document.getElementById("edit-message-btn");
const message_context_delete_btn = document.getElementById("delete-message-btn");
const chat_title_element = document.getElementById("chat-title");
const chat_title_container = document.getElementById("chat-title-container");
const chat_online_users_element = document.getElementById("chat-online-number");

const room_action_button = document.getElementById("room-actions-dots");
const back_btn = document.getElementById("back-btn");
const search_btn = document.getElementById("search-btn");
const search_input = document.getElementById("search-input");
const go_to_next_btn = document.getElementById("go-to-next");
const go_to_prev_btn = document.getElementById("go-to-prev");
const search_counter_span = document.getElementById("search-counter-span");

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

const user_device_width = window.innerWidth;

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
let is_initializing_room = false;
let is_searching = false;
let search_message_id = 0;
let current_search_result = [];

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
    if(is_initializing_room) return;
    is_initializing_room = true;

    try{
        await checkLogin();

        if(window.socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)){
            socket.close();
        }
        
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
    } finally{
        is_initializing_room = false;
    }
}

function hashUsername(username){
    let hash = 0;
    for(let i = 0; i < username.length; i++){
        hash = username.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function getUserColor(username){
    const hash = hashUsername(username);
    return username_colors[hash % username_colors.length];
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

function setUsernameVisibility(message_container_el, visible){
    const b = message_container_el.querySelector(".message-username");
    if(!b) return;
    b.style.display = visible ? "" : "none";
}

function setProfilePicVisibility(message_container_el, visible){
    const pic = message_container_el.querySelector(".pic");
    const message = message_container_el.querySelector(".message");

    if(!pic) return;
    if(!message) return;

    pic.style.display = visible ? "" : "none";
    if(!visible)
        message.classList.add("margin-60");
}

function applyUsernameGrouping(message_container_el){
    if(!message_container_el) return;
    const username = message_container_el.dataset.username;

    const prev = message_container_el.previousElementSibling;
    if(prev && prev.dataset.username === username){
        setUsernameVisibility(message_container_el, false);
        setProfilePicVisibility(message_container_el, false);
    }else{
        setUsernameVisibility(message_container_el, true);
        setProfilePicVisibility(message_container_el, true);
    }

    const next = message_container_el.nextElementSibling;
    if(next && next.dataset.username === username){
        setUsernameVisibility(next, false);
        setProfilePicVisibility(next, false);
    }
}

function userProfile(username){
    window.location.href = `/profile/${username}`;
}

function getDefaultProfilePic(display_name){
    const user_color = getUserColor(display_name);
    const image_wrapper = document.createElement("div");

    image_wrapper.style.backgroundColor = user_color;
    image_wrapper.classList.add("pic");
    const span = document.createElement("span");
    span.id = "user-first-letter";
    span.textContent = display_name[0];

    image_wrapper.appendChild(span);
    return image_wrapper
}

function getUserProfile(user){
    if(!user.profile_pic || user.profile_pic === "None"){
        return getDefaultProfilePic(user.display_name);
    }else{
        const img = document.createElement("img");
        img.src = `/${user.profile_pic}`;
        img.classList.add("pic");
        return img
    }
}


function addMessage(message, prepend = false){
    const container = document.getElementById("messages");

    const username = message.user.username;
    const message_container = document.createElement("div");
    message_container.className = "message-container";
    message_container.dataset.message_id = message.id;
    message_container.dataset.username = username;

    const div = document.createElement("div");
    div.className = "message";
    div.dataset.message_id = message.id;

    profile_pic = getUserProfile(message.user);


    div.innerHTML = `
        <div>
            <p class="pdefualt" dir='auto'>${message.content}</p>
        </div>
        <span class='date'>${formatDate(message.created_at)}</span>
    `;

    if(message.reply_id){
        const reply_div = document.createElement("div");
        const reply_div_username = document.createElement("p");
        const reply_div_text = document.createElement("p");

        reply_div.className = "message-reply-container";
        reply_div_username.className = "message-reply-username";
        reply_div_text.className = "message-reply-text";

        if(message.reply){
            const color = getUserColor(message.reply.user.display_name);

            if(username !== current_user.sub){
                reply_div_username.style.color = color;
                reply_div.style.borderColor = color;
                reply_div.style.background = color + "25";
            }

            reply_div_username.textContent = message.reply.user.display_name;


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

        reply_div.addEventListener("click", async (e)=>{
            e.stopPropagation();
            hideContextBox();

            if(!message.reply){
                return;
            }

            const msg_diff = oldest_message_id - message.reply_id;
            const less_to_10 = msg_diff % 10;
            const limit = msg_diff + (10 - less_to_10);

            let target_el = document.querySelector(`[data-message_id='${message.reply_id}']`);
            
            if(!target_el){
                await loadOldMessage(limit);
                target_el = document.querySelector(`[data-message_id='${message.reply_id}']`);
            }

            target_el.scrollIntoView({ behavior: "smooth", block: "center" });
            target_el.classList.add("highlight");

            setTimeout(() => {
                target_el.classList.remove("highlight");
            }, 4000);
        });

        div.firstElementChild.prepend(reply_div);
    }


    const display_name = message.user.display_name;

    if(username === current_user.sub){
        div.classList.add("me");
        message_container.classList.add("me");
    }else{
        const b = document.createElement("b");
        b.className = "message-username";
        b.textContent = display_name;
        b.style.color = getUserColor(display_name);
        b.style.cursor = "pointer";
        b.addEventListener("click", ()=>{
            userProfile(username);
        });

        profile_pic.addEventListener("click", ()=>{
            userProfile(username);
        });

        div.firstElementChild.prepend(b);
        message_container.appendChild(profile_pic);
    }


    if(message.is_edited){
        const span = document.createElement("span");
        span.textContent = "edited";
        span.className = "edited";
        const p = div.querySelector("p");
        p.classList.add("pedited");
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
        reply_username_placeholder.textContent = `Reply To ${display_name}`;
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

    applyUsernameGrouping(message_container);

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

async function loadOldMessage(limit=100){
    is_loading_older = true;

    const res = await fetch(
        `/room/${room_id}/messages?limit=${limit}&before_id=${oldest_message_id}`
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

function scrollToBottom(){
    const messages = document.getElementById("messages");
    messages.scrollTo({ top: messages.scrollHeight, behavior: "smooth" });
}


const container = document.getElementById("messages");
let is_loading_older = false;

container.addEventListener("scroll", async () => {
    go_to_bottom_btn.classList.toggle("show", (!isNearBottom() && !is_searching));

    if (container.scrollTop === 0 && !is_loading_older && oldest_message_id !== null) {
        await loadOldMessage();
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


function showRoomContextBox(){
    const action_button_rect = room_action_button.getBoundingClientRect();
    const room_context_rect = room_context_box.getBoundingClientRect();

    let x = action_button_rect.right;
    let y = action_button_rect.bottom+5;

    const device_width = window.innerWidth;
    const device_height = window.innerHeight;

    if(device_width > 768){
        x = x - room_context_rect.width;
    }

    if(x+action_button_rect.width >= device_width){
        x = device_width - 110;
    }

    room_context_box.classList.toggle("show");
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

function deactiveNextBtn(){
    go_to_next_btn.classList.remove("show");
    go_to_next_btn.classList.add("deactive");
}
function activeNextBtn(){
    go_to_next_btn.classList.remove("deactive");
    go_to_next_btn.classList.add("show");
}

function deactivePrevBtn(){
    go_to_prev_btn.classList.remove("show");
    go_to_prev_btn.classList.add("deactive");
}
function activePrevBtn(){
    go_to_prev_btn.classList.remove("deactive");
    go_to_prev_btn.classList.add("show");
}

function updateSearchSpanCounter(is_empty = false){
    if(is_empty === true){
        search_counter_span.textContent = '0 of 0';
        return;
    }
    search_counter_span.textContent = `${search_message_id+1} of ${current_search_result.length}`;
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
        const p = div.querySelector("#messages .message div p:not(.message-reply-text)");
        span.textContent = "edited";
        span.className = "edited";
        p.classList.add("pedited");
        div.appendChild(span);
    }
}

function deleteMessageInDOM(message_id){
    const el = document.querySelector(`[data-message_id='${message_id}']`);
    if(!el) return;

    const next = el.nextElementSibling;

    el.classList.add("remove");
    setTimeout(() => {
        el.remove();
        applyUsernameGrouping(next);
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


async function getSearchedMessageList(message){
    const response = await fetch(`/room/${room_id}/messages?message=${message}`);
    const messages = await response.json();
    if(messages.length === 0) return [];
    messages.reverse();

    const message_ids = [];
    messages.forEach(m => message_ids.push(m.id));
    return message_ids;
}


function showSearchedMessages(message){
    activeNextBtn();
    activePrevBtn();
}

function hideSearchMessages(){
    search_input.value = "";
}

function showMessageInput(){
    message_input.classList.remove("deactive");
    search_counter_span.classList.add("deactive");
    go_to_next_btn.classList.remove("deactive");
    go_to_prev_btn.classList.remove("deactive");
    showSendBtn();
}

function hideMessageInput(){
    message_input.classList.add("deactive");
    search_counter_span.classList.remove("deactive");
    hideSendBtn();
    hideEditBtn();
    hideEditBox();
    message_input.value = "";
}

function goToMessage(id){
    const target_el = document.querySelector(`[data-message_id='${id}']`);
    
    if(!target_el){
        loadOldMessage();
        search_message_id -= 1;
    }

    target_el.scrollIntoView({ behavior: "smooth", block: "center" });
    target_el.classList.add("highlight");

    setTimeout(() => {
        target_el.classList.remove("highlight");
    }, 4000);
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

room_action_button.addEventListener("click", (e)=>{
    e.preventDefault();
    e.stopPropagation();
    hideContextBox();
    showRoomContextBox();
});

back_btn.addEventListener("click", ()=>{
    if(is_searching){
        showMessageInput();
        go_to_prev_btn.classList.remove("show");
        go_to_next_btn.classList.remove("show");
        search_input.classList.add("hide");
        setTimeout(() => {
            search_input.classList.add("deactive");
            chat_title_container.classList.remove("deactive");
            search_btn.classList.remove("deactive");
            room_action_button.classList.remove("deactive");
        }, 200);

        setTimeout(() => {
            chat_title_container.classList.remove("hide");
            search_btn.classList.remove("hide");
            room_action_button.classList.remove("hide");
        }, 220);

        is_searching = false;
        hideSearchMessages();
        search_counter_span.textContent = "";
        selected_message_id = 0;
        current_search_result = [];
        return
    }
    window.location.href = "/";
});

search_btn.addEventListener("click", ()=>{
    showSearchedMessages();
    hideMessageInput();
    deactiveNextBtn();
    deactivePrevBtn();
    search_btn.classList.add("hide");
    room_action_button.classList.add("hide");
    chat_title_container.classList.add("hide");
    setTimeout(() => {
        chat_title_container.classList.add("deactive");
        search_btn.classList.add("deactive");
        room_action_button.classList.add("deactive");
        search_input.classList.remove("deactive");
    }, 200);

    setTimeout(() => {
        search_input.classList.remove("hide");
        search_input.focus();
    }, 210);

    is_searching = true;
})


go_to_bottom_btn.addEventListener("click", scrollToBottom);

send_message_btn.addEventListener("click", sendMessage);

message_input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" && !e.shiftKey && user_device_width > 768){
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

search_input.addEventListener("input", async ()=>{
    search_message_id = 0;

    if(search_input.value.length === 0){
        current_search_result = [];
        deactiveNextBtn();
        deactivePrevBtn();
        updateSearchSpanCounter(is_empty=true);
        return;
    }

    current_search_result = await getSearchedMessageList(search_input.value);

    if(current_search_result.length === 0){
        deactiveNextBtn();
        deactivePrevBtn();
        updateSearchSpanCounter(is_empty=true);
        return;
    }
    goToMessage(current_search_result[search_message_id]);
    updateNavButtons();
})

function updateNavButtons(){
    updateSearchSpanCounter();
    if(search_message_id+1 >= current_search_result.length){
        deactiveNextBtn();
    }else{
        activeNextBtn();
    }

    if(search_message_id-1 < 0){
        deactivePrevBtn();
    }else{
        activePrevBtn();
    }
}

go_to_next_btn.addEventListener("click", ()=>{
    if(search_message_id+1 >= current_search_result.length) return;

    search_message_id ++;
    goToMessage(current_search_result[search_message_id]);
    updateNavButtons();
})

go_to_prev_btn.addEventListener("click", ()=>{
    if(search_message_id-1 < 0) return;

    search_message_id --;
    goToMessage(current_search_result[search_message_id]);
    updateNavButtons();
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

window.addEventListener("pageshow", async (event)=>{
    if(event.persisted){
        if(!window.socket || socket.readyState === WebSocket.CLOSED){
            const messages_container = document.getElementById("messages");
            messages_container.innerHTML = "";
            oldest_message_id = null;
            
            await initRoom();
            await loadMessages();
        }
    }
});


async function init(){
    await initRoom();
    await loadMessages();
}
init();