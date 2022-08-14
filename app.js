// import modules
const fs = require("fs");
const express = require("express");
const app = express();
const path = require("path");
const WebSocket = require("ws");

// global variable
let url = ".";
const server = new WebSocket.Server({ port: 7000 });
app.use(express.static("."));

// extract data from payload
function unpack(message) {
  const pack_format = /<(.*)>(.*)<E>/;
  let data = message.toString().match(pack_format);
  return data;
}

// separate old and new name
function unPair(data) {
  const pair_format = /(.*)\|(.*)/;
  return data.toString().match(pair_format);
}

// get directory list
function readDir(Folder) {
  try {
    return fs.readdirSync(Folder);
  } catch (err) {
    return null;
  }
}

// initialiste websocket
server.on("connection", function connection(ws, req) {
  console.log("client is connected");
  ws.send("<Connected>");

  ws.on("message", function incoming(message) {
    let payload = unpack(message);
    let flag = payload[1];
    let data = payload[2];

    if (flag === "Path") {
      //receive path
      let file_array = readDir(data);
      if (file_array) {
        server.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            client.send("<B>");
            file_array.forEach((f) => client.send(f.toString()));
            client.send("<E>");
            url = data;
          }
        });
      } else {
        server.clients.forEach(function each(client) {
          if (client.readyState === WebSocket.OPEN) {
            console.log("read error");
            client.send("<B>");
            client.send("<E>");
          }
        });
      }
    } else if (flag === "Fname") {
      // receive new names
      let load = unPair(data);
      let old_ = load[1];
      let new_ = load[2];
      // renaming
      fs.rename(path.join(url, old_), path.join(url, new_), (err) => {
        err ? ws.send("<Error>" + old_) : ws.send("<Succes>" + old_);
      });
    }
  });
});

// app
app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "index.html"));
  // res.send("UDF", 404);
});

app.listen(3000, () => {
  console.log("Start listening");
});
