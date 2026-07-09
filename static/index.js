const display_username = document.getElementById("display-username");
const rooms_container = document.getElementById("rooms-container");
const logout_btn = document.getElementById("logout");
const create_room_btn = document.getElementById("create-room-btn");
const search_room_input = document.getElementById("search-room-input");


function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

async function check_login(){
    const token = localStorage.getItem("access_token");
    
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

    if(response.ok){
        const user = await response.json();
        display_username.textContent = user.username;
    }
}


function clearRooms(){
    rooms_container.innerHTML = "";
}

async function display_rooms(room_name = null){
    if(room_name){
        rooms_response = await fetch(`/rooms?room_name=${room_name}`);
    }else{
        rooms_response = await fetch("/rooms");
    }

    rooms = await rooms_response.json();

    rooms.forEach(room => {
    const div = document.createElement("div");

    div.className = "room";
    div.dataset.room_id = room.id;

    div.innerHTML = `
            <div class="room-info">
                <h3>${room.name}</h3>
                <span>Created by ${room.creator.username}</span>
            </div>

            <span class="room-date">${formatDate(room.created_at)}</span>
    `;

    div.addEventListener("click", ()=>{
        location.href = `/rooms/${room.id}`
    });

    rooms_container.appendChild(div);
});
}

function logOut(){
    localStorage.removeItem("access_token");
    window.location.href = "/login";
}
logout_btn.addEventListener("click", logOut);


search_room_input.addEventListener("input", async (e)=>{
    room_name = search_room_input.value;
    clearRooms();
    display_rooms(room_name);
});

check_login();
display_rooms();