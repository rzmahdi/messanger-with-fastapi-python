send_message_btn = document.getElementById("send-btn");
message_input = document.getElementById("message-input");
const go_to_bottom_btn = document.getElementById("go-to-bottom-container");
let oldest_message_id = null;
const token = localStorage.getItem("access_token");


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
        sendMessage();
    }
});
message_input.addEventListener("input", autoResizeTextarea);
