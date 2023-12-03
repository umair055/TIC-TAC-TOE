const express = require("express");
const app = express();
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const server = http.createServer(app);
const io = new Server(server);
app.use(express.static(path.resolve("")));
app.get("/", (req, res) => {
  res.sendFile("index.html");
});
server.listen(3000, () => {
  console.log("Server listening on port 3000");
});
var players = [];
var twoPlayers = [];
var flag = true;
io.on("connection", (socket) => {
  socket.on("uniqueKey", (res) => {
    players.forEach((item, index) => {
      if (item.key === res.key) {
        players[index] = res;
        flag = false;
      }
    });
    if (flag) {
      players.push(res);
    }
    flag = true;
    var skey;
    players.forEach((item, id) => {
      if (item.searchKey) {
        twoPlayers.push(item);
        skey = item.searchKey;
        players.splice(id, 1);
      }
      if (skey) {
        let skeyFound = true;
        players.forEach((player, index) => {
          if (player.key == skey) {
            twoPlayers.push(player);
            players.splice(index, 1);
            skey = "";
            skeyFound = false;
          }
        });
        if (skeyFound) {
          socket.emit("error", {});
          twoPlayers = [];
          skey = "";
          skeyFound = true;
        }
      }
      if (twoPlayers.length == 2) {
        if (twoPlayers[0].searchKey || twoPlayers[1].searchKey) {
          if (
            twoPlayers[0].searchKey == twoPlayers[1].key ||
            twoPlayers[1].searchKey == twoPlayers[0].key
          ) {
            twoPlayers.forEach((singlePlayer) => {
              socket.to(singlePlayer.id).emit("found", {
                p1: twoPlayers[0].name,
                p1Sign: "O",
                p1Key: twoPlayers[0].key,
                p2: twoPlayers[1].name,
                p2Sign: "X",
                p2Key: twoPlayers[1].key,
                opponentId: twoPlayers[0].id,
              });
            });
            socket.emit("found", {
              p1: twoPlayers[0].name,
              p1Sign: "O",
              p1Key: twoPlayers[0].key,
              p2: twoPlayers[1].name,
              p2Sign: "X",
              p2Key: twoPlayers[1].key,
              opponentId: twoPlayers[1].id,
            });
          }
        }
      }
      twoPlayers = [];
    });
  });
  socket.on("btnclick", (res) => {
    if (res.sign == "O") {
      socket.emit("changeturn", {
        turn: "X",
        sign: "O",
        btn: res.btn,
        name: res.name,
      });
      socket.to(res.opponentId).emit("changeturn", {
        name: res.name,
        turn: "X",
        sign: "O",
        btn: res.btn,
      });
    } else {
      socket.emit("changeturn", {
        turn: "O",
        sign: "X",
        btn: res.btn,
        name: res.name,
      });
      socket.to(res.opponentId).emit("changeturn", {
        turn: "O",
        sign: "X",
        btn: res.btn,
        name: res.name,
      });
    }
  });
});
