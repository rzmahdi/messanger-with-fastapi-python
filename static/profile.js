function redirect_to_login(){
    window.location.href = "/login";
}

async function checkLogin(){
    const token = await getValidToken();

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
        const res = await response.json();
        const current_user = res.username;

        if(current_user===username){
            showEditBtn();
        }
    }
}
checkLogin();

const profile_pic_element = document.getElementById("profile-img");
const image_wrapper = document.getElementById("profile-image-container");
const back_btn = document.getElementById("back-btn");
const profile_display_name = document.getElementById("profile-display-name");
const profile_bio = document.getElementById("user-bio");
const username_span = document.getElementById("username-span");
const username_copy_modal = document.getElementById("username-copy-modal");
const pic_overlay = document.getElementById("pic-overlay");
const profile_edit_btn = document.getElementById("profile-edit-btn");
const profile_dot_btn = document.getElementById("profile-doted-btn");
const close_profile_container_btn = document.getElementById("close-edit-btn");

const profile_container = document.getElementById("profile-container");
const edit_profile_container = document.getElementById("edit-profile-container");

const display_name_input = document.getElementById("display-name-input");
const username_input = document.getElementById("username-input");
const bio_input = document.getElementById("bio-input");
const pic_input = document.getElementById("pic");
const edit_btn = document.getElementById("edit-btn");

const error_displayname = document.getElementById("edit-display-name-error-span");
const error_username = document.getElementById("edit-username-error-span");
const error_bio = document.getElementById("edit-bio-error-span");

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


profile_display_name.textContent = display_name;
profile_bio.textContent = bio!=="None" ? bio : "";
username_span.textContent = `@${username}`;

function hashUsername(){
    let hash = 0;
    for(let i = 0; i < display_name.length; i++){
        hash = display_name.charCodeAt(i) + ((hash << 5) - hash);
        hash = hash & hash;
    }
    return Math.abs(hash);
}

function getUsernameColor(){
    const hash = hashUsername(display_name);
    return username_colors[hash % username_colors.length];
}

function getDefaultProfilePic(){
    const user_color = getUsernameColor();
    profile_pic_element.style.backgroundColor = getUsernameColor();
    const span = document.createElement("span");
    span.id = "user-first-letter";
    span.textContent = username[0];

    image_wrapper.appendChild(span);
}

function getUserProfile(){
    if(profile_pic === "None"){
        getDefaultProfilePic();
    }else{
        profile_pic_element.src = `/${profile_pic}`;
    }
}
getUserProfile();

function showCopyUsernameModal(x, y){
    username_copy_modal.classList.add("show");
    username_copy_modal.style.left = `${x}px`;
    username_copy_modal.style.top = `${y}px`;
    setTimeout(() => {
        username_copy_modal.classList.remove("show");
    }, 1000);
}

function showEditBtn(){
    profile_edit_btn.classList.add("show");
    profile_dot_btn.classList.add("hide");
}

function showError(el, error){
    el.classList.remove("hide");
    el.textContent = error;
}
function hideError(el){
    el.classList.add("hide");
}

function nameVlidation(name){
    const pattern = /^[a-zA-Z][a-zA-Z0-9_]{2,14}$/;
    return pattern.test(name);
}


back_btn.addEventListener("click", ()=>{
    if(document.referrer && document.referrer.includes(window.location.hostname)){
        history.back();
    }else{
        window.location.href = "/";
    }
});

username_span.addEventListener("click", async (e)=>{
    try{
        await navigator.clipboard.writeText(`@${username}`);
        showCopyUsernameModal(e.clientX, e.clientY);
    }catch (error){
        console.error("failed to copy! ", error);
    }
})

profile_pic_element.addEventListener("click", ()=>{
    if(profile_pic !== "None"){
        profile_pic_element.classList.toggle("show");
        pic_overlay.classList.toggle("show");
    }
})

pic_overlay.addEventListener("click", ()=>{
    profile_pic_element.classList.remove("show");
    pic_overlay.classList.remove("show");
})

profile_edit_btn.addEventListener("click", ()=>{
    profile_container.classList.add("hide");
    edit_profile_container.classList.remove("hide");

    username_input.value = username;
    display_name_input.value = display_name;
    bio_input.value = bio;
})

close_profile_container_btn.addEventListener("click", ()=>{
    profile_container.classList.remove("hide");
    edit_profile_container.classList.add("hide");
})

edit_btn.addEventListener("click", async ()=>{
    const display_name_value = display_name_input.value;
    const username_value = username_input.value;
    const bio_value = bio_input.value;

    let is_valid = true;

    if(display_name_value.length === 0){
        showError(error_displayname, "name cant be empty!");
        is_valid = false;
    }else if(display_name_value.length > 40){
        showError(error_displayname, "cant be more than 40 char!");
        is_valid = false;
    }else if(!nameVlidation(display_name_value)){
        showError(error_displayname, "name muste be between 3 and 16 characters long and do not start with number!");
        is_valid = false;
    }
    else{
        hideError(error_displayname);
    }
    

    if(username_value.length === 0){
        showError(error_username, "username cant be empty!");
        is_valid = false;
    }else if(!nameVlidation(username_value)){
        showError(error_username, "name muste be between 3 and 16 characters long and do not start with number!");
        is_valid = false;
    }
    else{
        hideError(error_username);
    }
    

    if(bio_value.length > 70){
        showError(error_bio, "bio cant be more than 70!");
        is_valid = false;
    }else{
        hideError(error_bio);
    }

    if(!is_valid) return;

    const token = await getValidToken();
    if(!token){
        redirect_to_login();
        return;
    }

    if(pic_input.files.length > 0){
        const form_data = new FormData();
        form_data.append("file", pic_input.files[0]);

        const pic_response = await fetch("/me/profile-pic", {
            method: "POST",
            headers: {
                Authorization: `Bearer ${token}`,
            },
            body: form_data
        });

        if(!pic_response.ok){
            const pic_error = await pic_response.json();
            alert(error.detail || "failed to upload profile picture!");
            return;
        }
    }

    const response = await fetch(`/profile/${username}`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
            username: username_value,
            display_name: display_name_value,
            bio: bio_value
        })
    });

    if(response.ok){
        if(username_value != username){
            window.location.href = `/profile/${username_value}`;
            return;
        }
        window.location.reload();
    }else if(response.status === 409){
        showError(error_username, "username already exists!");
    }else{
        const error = await response.json();
        alert(error.detail || "failed to update profile!");
    }
})