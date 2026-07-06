send_message_btn = document.getElementById("send-btn");
message_input = document.getElementById("message-input");


function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

async function loadMessages(){
    const res = await fetch(`/room/${room_id}/messages?limit=20&offset=0`);
    const messages = await res.json();

    const container = document.getElementById("messages");

    messages.forEach(message => {
        addMessage(message);
    });
}

function addMessage(message){
    const container = document.getElementById("messages");

    const div = document.createElement("div");
    div.className = "message";

    div.innerHTML = `
        <div>
            <b>${message.user.username}</b>
            <p>${message.content}</p>
        </div>
        <span>${formatDate(message.created_at)}</span>
    `;

    container.appendChild(div);
}

function sendMessage(){
    const message = message_input.value.trim();

    if(!message) return;

    socket.send(JSON.stringify({
        content: message
    }));

    message_input.value = "";
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
    messages.scrollTop = messages.scrollHeight;
}


// WebSocket
const token = localStorage.getItem("access_token");
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
    if(e.key === "Enter"){
        e.preventDefault();
        sendMessage();
    }
});