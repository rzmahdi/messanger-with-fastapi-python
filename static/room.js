async function load_messages(){
    const res = await fetch(`/rooms/${room_id}/messages?limit=20&offset=0`);
    const messages = await res.json();

    const container = document.getElementById("messgaes");

    messages.reverse().forEach(message => {
        add_message(message);
    });
}

function add_message(message){
    const container = document.getElementById("messgaes");

    const div = document.createElement("div");
    div.className = "mesage";

    div.innerHTML = `
    <b>${message.username || message.user_id}</b>: ${message.content}
    `;

    container.appendChild(div);
}