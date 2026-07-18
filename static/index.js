const display_username = document.getElementById("display-username");
const rooms_container = document.getElementById("rooms-container");
const logout_btn = document.getElementById("logout");
const create_room_btn = document.getElementById("create-room-btn");
const search_room_input = document.getElementById("search-room-input");

const notif_modal = document.getElementById("modal-overlay-notif");
const notif_text = document.getElementById("notif-modal-text");
const close_notif_btn = document.getElementById("modal-notif-close-btn");

const token = localStorage.getItem("access_token");

let selected_room_id = null;


function redirect_to_login(){
    window.location.href = "/login";
}

function show_notif(text){
    notif_modal.classList.add("show");
    notif_text.innerHTML = text;
}

function close_notif(){
    notif_modal.classList.remove("show");
}


function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

async function checkLogin(){
    const token = getValidToken();

    if(!token){
        redirect_to_login();
        return
    }

    const response = await fetch("/me", {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })

    if(response.status === 401){
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        redirect_to_login();
        return
    }

    if(response.ok){
        const user = await response.json();
        display_username.textContent = user.username;
        return true
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

    div.addEventListener("contextmenu", (e)=>{
        e.preventDefault();
        selected_room_id = div.dataset.room_id;
        showContextBox(e.clientX, e.clientY);
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


create_room_btn.addEventListener("click", async (e)=>{
    if(!checkLogin()){
        window.location.href("/login");
    }

    room_name = search_room_input.value;
    if(!room_name){
        show_notif("chanell name can not be empty❌");
        return
    }

    rooms_response = await fetch(`/rooms?room_name=${room_name}`);
    rooms = await rooms_response.json();

    const create_room_response = await fetch("/rooms",{
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
            name: room_name
        })
    })

    if(create_room_response.ok){
        show_notif("Room Created✅");
        room_name = search_room_input.value;
        clearRooms();
        display_rooms(room_name);
    }else if(create_room_response.status === 409){
        show_notif("Room already exists!❌");
    }

})


close_notif_btn.addEventListener("click", (e)=>{
    close_notif();
});

notif_modal.addEventListener("click", (e)=>{
    if(e.target === notif_modal){
        close_notif();
    }
})

checkLogin();
display_rooms();