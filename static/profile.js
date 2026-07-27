const profile_pic_element = document.getElementById("profile-img");
const image_wrapper = document.getElementById("profile-image-container");
const back_btn = document.getElementById("back-btn");

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


back_btn.addEventListener("click", ()=>{
    window.location.href = "/";
});