const setAction = (action) =>{
    const form = document.forms["authentication"]
    if (form["username"].value!="" & form["password"].value!=""){
        document.querySelector("#authentication").setAttribute("action",action)
        form.submit()
    }
    else{
        document.querySelector("#error-notification").style.display = "block"
        document.querySelector("#error-notification").textContent= "Both Username and password fields must be completed!"
        document.querySelector("#error-notification").setAttribute("style","display: block") 
    }
}
document.querySelector("#login").addEventListener('click',(ev)=>setAction("/login"))
document.querySelector("#signup").addEventListener('click',(ev)=>setAction("/signup"))