const send_message_btn = document.getElementById("send-btn");
const edit_message_btn = document.getElementById("edit-btn");
const message_input = document.getElementById("message-input");
const go_to_bottom_btn = document.getElementById("go-to-bottom-container");
const message_context_box = document.getElementById("message-context-box");
const message_context_edit_btn = document.getElementById("edit-message-btn");
const token = localStorage.getItem("access_token");

let oldest_message_id = null;
let selected_message_id = null;
let is_editing = null;


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


function autoResizeTextarea(){
    message_input.style.height = "auto";
    message_input.style.height = Math.min(message_input.scrollHeight, 
        parseFloat(getComputedStyle(message_input).maxHeight)) + "px";
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

    if(message.user.username === current_user.sub){
        div.classList.add("me");
    }

    div.innerHTML = `
        <div>
            <b>${message.user.username}</b>
            <p>${message.content}</p>
        </div>
        <span>${formatDate(message.created_at)}</span>
    `;


    div.addEventListener("contextmenu", (e)=>{
        e.preventDefault();

        const message = e.target.closest(".message");
        if(!message) return;

        selected_message_id = message.dataset.message_id;
        hideContextBox();
        showContextBox(e.clientX, e.clientY);
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
    message_input.style.height = "auto";
    message_input.style.height = Math.min(message_input.scrollHeight, 
        parseFloat(getComputedStyle(message_input).maxHeight)) + "px";
}


function showContextBox(x, y){
    message_context_box.className = "show";
    message_context_box.style.left = `${x}px`;
    message_context_box.style.top = `${y}px`;
}

function editMessage(){
    document.querySelector(`[data-message_id='${selected_message_id}']`).getElementsByTagName("p")[0].textContent = message_input.value;
    message_input.value = "";
    hideEditBtn();
    showSendBtn();
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

    message_input.value = document.querySelector(`[data-message_id='${selected_message_id}']`).getElementsByTagName("p")[0].textContent;
    autoResizeTextarea();
})


edit_message_btn.addEventListener("click", async ()=>{
    checkLogin();

    const edit_message_response = await fetch(`/room/${room_id}/messages/${selected_message_id}`, {
        method: "PATCH",
        headers: {
            Authorization: `Bearer ${token}`,
            "content-type": "Application/json" 
        },
        body: JSON.stringify({
            content: message_input.value
        })
    })

    if(edit_message_response.ok){
        editMessage();
        is_editing = false;
    }
})

go_to_bottom_btn.addEventListener("click", scrollToBottom)

// WebSocket
const socket = new WebSocket(
    `ws://${window.location.host}/ws/${room_id}/messages?token=${token}`
);

socket.onmessage = (e)=>{
    const data = JSON.parse(e.data);
    
    const should_scroll = isNearBottom();

    if(data.type === "message"){
        addMessage(data);
    }

    if(should_scroll){
        scrollToBottom();
    }
}


loadMessages();
send_message_btn.addEventListener("click", sendMessage);

message_input.addEventListener("keydown", (e)=>{
    if(e.key === "Enter" && !e.shiftKey){
        e.preventDefault();
        if(is_editing){
            editMessage();
            is_editing = false;
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


document.addEventListener("click", (e) => {
    if (!message_context_box.contains(e.target)) {
        hideContextBox();
    }
});