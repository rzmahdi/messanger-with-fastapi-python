const display_username = document.getElementById("display-username");
const rooms_container = document.getElementById("rooms-container");
const logout_btn = document.getElementById("logout");
const create_room_btn = document.getElementById("create-room-btn");
const search_room_input = document.getElementById("search-room-input");

const room_context_box = document.getElementById("room-context-box");
const room_context_edit_btn = document.getElementById("edit-room-btn");
const room_context_delete_btn = document.getElementById("delete-room-btn");

const notif_modal = document.getElementById("modal-overlay-notif");
const notif_text = document.getElementById("notif-modal-text");
const close_notif_btn = document.getElementById("modal-notif-close-btn");

const edit_modal_overlay = document.getElementById("modal-overlay");
const close_modal_btn = document.getElementById("modal-edit-room-name-close-btn");
const rename_room_btn = document.getElementById("modal-edit-room-name-btn");
const rename_input = document.getElementById("edit-room-name-input");
const room_name_error_span = document.getElementById("room-name-error");

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


function showContextBox(x, y){
    room_context_box.className = "show";
    room_context_box.style.left = `${x}px`;
    room_context_box.style.top = `${y}px`;
}

function hideContextBox(){
    room_context_box.classList.remove("show");
}

function showEditModal(){
    edit_modal_overlay.className = "show";
}

function hideEditModal(){
    edit_modal_overlay.classList.remove("show");
}

function showErrorSpan(){
    room_name_error_span.classList.add("error");
}

function hideErrorSpan(){
    room_name_error_span.classList.remove("error");
}


function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
}

async function checkLogin(){
    const token = localStorage.getItem("access_token");
    
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

    const token = localStorage.getItem("access_token");

    if(rooms.length === 0){
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
            clearRooms();
            display_rooms(room_name);
        }
    }
})

rename_room_btn.addEventListener("click", async ()=>{
    checkLogin();

    new_room_name = rename_input.value;

    if(new_room_name.length !== 0){
        const rename_room_response = await fetch(`/rooms/${selected_room_id}`,{
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                name: new_room_name
            })
        })


        if(rename_room_response.ok){
            document.querySelector(
                `[data-room_id='${selected_room_id}'] div.room-info h3`
            ).textContent = new_room_name;
            hideEditModal();

        }else if(rename_room_response.status === 404){
            hideErrorSpan();
            showErrorSpan();
            room_name_error_span.textContent = "Room does not Exists!";
        }else if(rename_room_response.status === 409){
            hideErrorSpan();
            showErrorSpan();
            room_name_error_span.textContent = "a Room with this name already exists!";
        }else if(rename_room_response.status === 403){
            hideErrorSpan();
            showErrorSpan();
            room_name_error_span.textContent = "You do not have the premission to rename this room!";
        }
    }else{
        hideErrorSpan();
        showErrorSpan();
        room_name_error_span.textContent = "this filed can not be empty!";
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

room_context_edit_btn.addEventListener("click", ()=>{
    hideContextBox();
    hideErrorSpan();
    showEditModal();
})

edit_modal_overlay.addEventListener("click", (e)=>{
    if(e.target === edit_modal_overlay){
        hideEditModal();
    }
})

close_modal_btn.addEventListener("click", ()=>{
    hideEditModal();
})

document.addEventListener("click", (e) => {
    if (!room_context_box.contains(e.target)) {
        hideContextBox();
    }
});

checkLogin();
display_rooms();