const profile_pic_element = document.getElementById("profile-img");
const image_wrapper = document.getElementById("profile-image-container");
const back_btn = document.getElementById("back-btn");
const profile_display_name = document.getElementById("profile-display-name");
const profile_bio = document.getElementById("user-bio");
const username_span = document.getElementById("username-span");
const username_copy_modal = document.getElementById("username-copy-modal");

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

function getUserColor(){
    return username_colors[username.charCodeAt()%username_colors.length];
}

function getDefaultProfilePic(){
    user_color = getUserColor(username);
    profile_pic_element.style.backgroundColor = getUserColor(username);
    const span = document.createElement("span");
    span.id = "user-first-letter";
    span.textContent = username[0];
    span.style.position = "absolute";
    span.style.top = "25px";
    span.style.left = "35px";
    span.style.color = "black";

    image_wrapper.appendChild(span);
}

function getUserProfile(){
    if(profile_pic === "None"){
        getDefaultProfilePic();
    }else{
        profile_pic_element.src = profile_pic;
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


back_btn.addEventListener("click", ()=>{
    window.location.href = "/";
});

username_span.addEventListener("click", async (e)=>{
    try{
        await navigator.clipboard.writeText(`@${username}`);
        showCopyUsernameModal(e.clientX, e.clientY);
    }catch (error){
        console.error("failed to copy! ", error);
    }
})