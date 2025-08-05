const socket = io();

let modo = "visitante";
let nickname = null;

function horaAgora() {
  const now = new Date();
  return now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function entrar() {
  nickname = document.getElementById("nickname").value.trim() || "Anônimo";
  socket.emit("join", nickname);
  document.getElementById("login").style.display = "none";
  document.getElementById("chatArea").style.display = "flex";
}

function entrarComoAdmin() {
  modo = "admin";
  socket.emit("adminJoin");
  document.getElementById("login").style.display = "none";
  document.getElementById("admin").style.display = "block";
}

function enviar() {
  const msg = document.getElementById("msg").value.trim();
  if (!msg) return;
  socket.emit("sendMessage", msg);
  document.getElementById("msg").value = "";
}

function adicionarMensagem(m) {
  const box = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = "msg " + (m.nickname === "Gabriel" ? "user" : "other");
  div.innerHTML = `<span class="meta">${m.nickname} - ${m.time}:</span> ${m.text}`;
  box.appendChild(div);
  box.scrollTop = box.scrollHeight;
}

socket.on("connect", () => {
  // Apenas aguarda o usuário clicar em "Entrar"
});

socket.on("message", (m) => {
  adicionarMensagem(m);
});

// ADMIN
socket.on("adminHistory", ({ socketIds, nickname, messages }) => {
  const chatDiv = document.createElement("div");
  chatDiv.style.border = "1px solid #ccc";
  chatDiv.style.marginBottom = "10px";
  chatDiv.style.padding = "5px";

  const title = document.createElement("h4");
  title.innerText = `Chat com ${nickname}`;
  chatDiv.appendChild(title);

  const msgs = document.createElement("div");
  msgs.id = "chat_" + nickname;

  messages.forEach((m) => {
    const div = document.createElement("div");
    div.className = "msg " + (m.nickname === "Gabriel" ? "user" : "other");
    div.innerHTML = `<span class="meta">${m.nickname} - ${m.time}:</span> ${m.text}`;
    msgs.appendChild(div);
  });

  const input = document.createElement("input");
  const btn = document.createElement("button");
  btn.innerText = "Responder";
  btn.onclick = () => {
    const texto = input.value.trim();
    if (!texto) return;
    socket.emit("adminReply", { toNickname: nickname, text: texto });

    const div = document.createElement("div");
    div.className = "msg user";
    div.innerHTML = `<span class="meta">Gabriel - ${horaAgora()}:</span> ${texto}`;
    msgs.appendChild(div);
    input.value = "";
  };

  chatDiv.appendChild(msgs);
  chatDiv.appendChild(input);
  chatDiv.appendChild(btn);

  document.getElementById("chats").appendChild(chatDiv);
});

socket.on("adminMessage", ({ from, text, time, toNickname }) => {
  const box = document.getElementById("chat_" + toNickname);
  if (box) {
    const div = document.createElement("div");
    div.className = "msg other";
    div.innerHTML = `<span class="meta">${from} - ${time}:</span> ${text}`;
    box.appendChild(div);
  }
});
