const validateStr = function (string) {
  var textArea = document.createElement("textarea");
  textArea.innerHTML = string;
  return textArea.value.replace(/(\r\n|\n|\r|\s\s+)/gm, "");
};
window.onload = () => {
  (function () {
    let key = "IOt0opzjmObdTqewC/FGm5PHNmV+7QuhbHmox5bpfFE=";
    let data = JSON.parse(localStorage.getItem(key));
    window.USERNAME = data.username;
    let menu = document.querySelector("ul.menu");
    if (menu) {
      let logout = document.createElement("li");
      if (data) {
        logout.innerHTML = `<a onclick="localStorage.removeItem('${key}')" href="/logout?username=${data.username}">Logout</a>`;
      } else {
        logout.innerHTML = '<li><a href="/login">Login</a></li>';
      }
      menu.appendChild(logout);
    }
  })();
};
