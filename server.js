const express = require("express");
const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http);
const path = require("path");
const axios = require("axios");

app.use(express.static(path.join(__dirname, "public")));
const PORT = process.env.PORT || 3000;

const chats = {};

const TELEGRAM_TOKEN = "8213066352:AAGnSqatT0k0_rMYCPlAH8HSxzLznOV_SRM";
const CHAT_ID = "5608387807";

function notificarTelegram(nickname) {
  const msg = `👤 Novo visitante: ${nickname}`;
  axios.post(`https://api.telegram.org/bot${TELEGRAM_TOKEN}/sendMessage`, {
    chat_id: CHAT_ID,
    text: msg,
  }).catch(console.error);
}

io.on("connection", (socket) => {
  console.log("Conectado:", socket.id);

  socket.on("join", (nickname) => {
    if (!nickname) return;
    socket.nickname = nickname;

    if (!chats[nickname]) {
      chats[nickname] = { messages: [], sockets: [] };
      notificarTelegram(nickname);
    }

    chats[nickname].sockets = chats[nickname].sockets.filter(
      id => io.sockets.sockets.get(id)
    );
    if (!chats[nickname].sockets.includes(socket.id)) {
      chats[nickname].sockets.push(socket.id);
    }

    chats[nickname].messages.forEach((msg) => {
      io.to(socket.id).emit("message", msg);
    });

    io.to(socket.id).emit("message", {
      nickname: "Gabriel",
      text: `Olá, ${nickname}! Pode mandar sua mensagem.`,
      time: horaAgora(),
    });
  });

  socket.on("sendMessage", (text) => {
    const nickname = socket.nickname;
    if (!nickname || !chats[nickname]) return;

    const message = {
      nickname,
      text,
      time: horaAgora(),
    };

    chats[nickname].messages.push(message);
    io.to(socket.id).emit("message", message);

    io.to("admin").emit("adminMessage", {
      from: nickname,
      toNickname: nickname, // <-- agora vai funcionar
      socketId: socket.id,
      text,
      time: message.time,
    });
  });

  socket.on("adminJoin", () => {
    socket.join("admin");

    for (const nickname in chats) {
      io.to(socket.id).emit("adminHistory", {
        nickname,
        socketIds: chats[nickname].sockets,
        messages: chats[nickname].messages,
      });
    }
  });
  socket.on("adminReply", ({ toNickname, text }) => {
    const message = {
      nickname: "Gabriel",
      text,
      time: horaAgora(),
    };

    if (chats[toNickname]) {
      chats[toNickname].messages.push(message);

      // Remover sockets inativos
      chats[toNickname].sockets = chats[toNickname].sockets.filter(id =>
        io.sockets.sockets.get(id)
      );

      chats[toNickname].sockets.forEach((id) => {
        io.to(id).emit("message", message);  // <- visitante recebe aqui
      });
    }
  });


  socket.on("disconnect", () => {
    const nickname = socket.nickname;
    if (nickname && chats[nickname]) {
      chats[nickname].sockets = chats[nickname].sockets.filter(id => id !== socket.id);
      if (chats[nickname].sockets.length === 0) {
        console.log(`Usuário "${nickname}" saiu.`);
        // delete chats[nickname];
      }
    }
    console.log("Desconectado:", socket.id);
  });
});

function horaAgora() {
  const now = new Date();
  return now.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

http.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
