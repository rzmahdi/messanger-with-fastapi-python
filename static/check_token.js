function isTokenExpiringSoon(token, buffer_seconds=60){
    const payload = parseJwt(token);
    if(!payload || !payload.exp) return true;

    const now = Math.floor(Date.now() / 1000);
    return payload.exp - now < buffer_seconds;
}

async function refreshAccessToken(){
    const refresh_token = localStorage.getItem("refresh_token");
    if(!refresh_token) return null;

    try{
        const res = await fetch("/refresh", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                "refresh_token": refresh_token
            })
        })
        if(!res.ok) throw new Error("Refresh failed");

        const data = await res.json();
        localStorage.setItem("access_token", data.access_token);
        return data.access_token;
    }
    catch(e){
        console.error("Token refresh Failed!", e);
        localStorage.removeItem("access_token");
        localStorage.removeItem("refresh_token");
        window.location.href = "/login";
        return null;
    }
}


async function getValidToken(){
    let token = localStorage.getItem("access_token");

    if(!token || isTokenExpiringSoon(token)){
        token = await refreshAccessToken();
    }

    return token;
}