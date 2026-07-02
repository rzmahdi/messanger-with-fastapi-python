function formatDate(dateString) {
    return new Date(dateString).toLocaleString();
}

async function load_messages(){
    const res = await fetch(`/room/${room_id}/messages?limit=20&offset=0`);
    const messages = await res.json();

    const container = document.getElementById("messages");

    messages.forEach(message => {
        add_message(message);
    });
}

function add_message(message){
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

load_messages();