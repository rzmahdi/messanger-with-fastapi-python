const register_form = document.getElementById("register-form");


function check_password(password, confirm_password){
    return password === confirm_password
}


register_form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    const username = document.getElementById("register-username").value;
    const password = document.getElementById("register-password").value;
    const confirm_password = document.getElementById("register-confirm-password").value;

    if(check_password(password, confirm_password)){
        const response = await fetch("/register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                username,
                password,
            })
        })
    }
})