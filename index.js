//global variable
const input_files = [];
const file_nodes = [];
let recving = false;
let socket;

//initiate websocket
if (!window.WebSocket) {
  window.WebSocket = window.MozWebSocket;
}
if (window.WebSocket) {
  socket = new WebSocket("ws://localhost:7000/ws");
  socket.onmessage = function (event) {
    if (event.data === "<Connected>") {
      // hand shake
      return;
    } else if (event.data === "<B>") {
      // receive the file list header
      while (file_nodes.pop()) {}
      recving = true;
      return;
    } else if (event.data === "<E>") {
      // receive the file list end
      recving = false;
      if (file_nodes.length === 0) {
        // reveive nothing
        alert("cannot get dir");
        clearDisplay();
        console.log("0");
      } else {
        // display
        displayFiles();
      }
    } else if (recving) {
      // and file name to array
      addToFileList(event.data);
    } else {
      // receive the rename response
      let payload = unpack(event.data);
      let flag = payload[1];
      let data = payload[2];

      if (flag === "Error") {
        document.getElementById("org_" + data).style.backgroundColor = "red";
      } else if (flag === "Succes") {
        document.getElementById("org_" + data).style.backgroundColor = "green";
      } else {
        alert("recv error");
      }
    }
  };
} else {
  alert("unsproot WebSocket！");
}

// separate the data
function unpack(message) {
  const pack_format = /<(.*)>(.*)/;
  let data = message.toString().match(pack_format);
  return data;
}

// send path
function sendPath() {
  while (file_nodes.pop()) {}
  while (input_files.pop()) {}
  let path_txt = document.getElementById("dir_path_2").value;
  if (!window.WebSocket) {
    console.log("socked failur");
    return;
  }
  if (socket.readyState == WebSocket.OPEN) {
    socket.send("<Path>" + path_txt + "<E>");
    // socket.send("<Path>" + path_txt + "<E>");
  } else {
    alert("no service.");
  }
}

// package and send old and new names
function applyChanges() {
  file_nodes.forEach((itm) => {
    let org_name = itm.org_name;
    let new_name = itm.new_name;
    let tail = itm.file_type;

    let pyload =
      "<Fname>" + org_name + "." + tail + "|" + new_name + "." + tail + "<E>";
    socket.send(pyload);
  });
}

//clear display field
function clearDisplay() {
  let mian_displayDiv = document.getElementById("main_container");
  while (mian_displayDiv.hasChildNodes()) {
    mian_displayDiv.removeChild(mian_displayDiv.firstChild);
  }
  // while (file_nodes.pop()) {}
}

//sort
function sortName(a, b) {
  if (a > b) {
    return 1;
  } else if (a < b) {
    return -1;
  } else return 0;
}

// process the names
function processOP(op_tag) {
  let cmd = op_tag.firstChild.textContent;
  if (cmd === "Add") {
    let data = document.getElementById(op_tag.id + "_contant").value;
    let option = document.querySelector(
      "input[name='" + op_tag.id + "_click_box']:checked"
    ).value;

    if (legalName(data)) {
      alert("Contains unlegal character");
      return;
    }

    for (let fnode of file_nodes) {
      if (option === "F") {
        fnode.new_name = data + fnode.new_name;
      } else {
        fnode.new_name = fnode.new_name + data;
      }
    }
  } else if (cmd === "Slice") {
    let x = document.getElementById(op_tag.id + "_x").value;
    let y = document.getElementById(op_tag.id + "_y").value;
    let option = document.querySelector(
      "input[name='" + op_tag.id + "_click_box']:checked"
    ).value;
    for (let fnode of file_nodes) {
      if (option === "IN") {
        y === ""
          ? (fnode.new_name = fnode.new_name.slice(x))
          : (fnode.new_name = fnode.new_name.slice(x, y));
      } else {
        y === ""
          ? (fnode.new_name = fnode.new_name.replace(
              fnode.new_name.slice(x),
              ""
            ))
          : (fnode.new_name = fnode.new_name.replace(
              fnode.new_name.slice(x, y),
              ""
            ));
      }
    }
  } else if (cmd === "ReplaceBy") {
    let _old = document.getElementById(op_tag.id + "_old").value;
    let _new = document.getElementById(op_tag.id + "_new").value;
    let option = document.querySelector(
      "input[name='" + op_tag.id + "_click_box']:checked"
    ).value;

    if (legalName(_new)) {
      alert("Contains unlegal character");
      return;
    }

    for (let fnode of file_nodes) {
      if (option === "F") {
        fnode.new_name = fnode.new_name.replace(_old, _new);
      } else {
        const lastIndex = fnode.new_name.lastIndexOf(_old);
        if (lastIndex !== -1) {
          fnode.new_name =
            fnode.new_name.substring(0, lastIndex) +
            _new +
            fnode.new_name.substring(lastIndex + _old.length);
        }
      }
    }
  } else if (cmd === "Sort") {
    let option = document.querySelector(
      "input[name='" + op_tag.id + "_sort']:checked"
    ).value;

    let num = document.getElementById(op_tag.id + "_num").checked;

    if (option === "up") {
      file_nodes.sort((a, b) => sortName(a.org_name, b.org_name));
    } else {
      file_nodes.sort((a, b) => -sortName(a.org_name, b.org_name));
    }

    if (num) {
      let index = 1;
      for (let fnode of file_nodes) {
        fnode.new_name = index + fnode.new_name;
        index++;
      }
    }
  } else {
    console.log("error:" + cmd);
  }
  displayFiles();
}

// chech is the content can be used for nameing file
function legalName(name) {
  const unlegalchar = /[\/\\\:\*\?\"\<\>\|]/;
  return unlegalchar.test(name);
}

// check the result on the file names
function checkValue() {
  let operations_div = document.getElementsByClassName("operationList_");
  for (const iterator of operations_div) {
    processOP(iterator);
  }
}

// display section
function displayFiles() {
  clearDisplay();
  let mian_displayDiv = document.getElementById("main_container");

  for (let i = 0; i < file_nodes.length; i++) {
    const cur_file_node = file_nodes[i];
    if (cur_file_node.org_name === "") continue;

    let partenDiv = document.createElement("div");
    let leftChildDiv = document.createElement("div");
    let rightChildDiv = document.createElement("div");

    leftChildDiv.id =
      "org_" + cur_file_node.org_name + "." + cur_file_node.file_type;
    rightChildDiv.id =
      "new_" + cur_file_node.org_name + "." + cur_file_node.file_name;

    leftChildDiv.className = "leftChildDiv";
    rightChildDiv.className = "rightChildDiv";

    let newContent1 = document.createTextNode(cur_file_node.org_name);
    let newContent2 = document.createTextNode(cur_file_node.new_name);
    leftChildDiv.appendChild(newContent1);
    rightChildDiv.appendChild(newContent2);

    partenDiv.appendChild(leftChildDiv);
    partenDiv.appendChild(rightChildDiv);
    mian_displayDiv.appendChild(partenDiv);
  }
}

// and file name to file_node arrray
function addToFileList(file_name) {
  let include_dir = document.getElementById("is_dir_include").checked;
  let tail = file_name.slice(file_name.lastIndexOf(".") + 1);
  let name = file_name.slice(0, file_name.lastIndexOf("."));
  if (tail === file_name && !include_dir) {
    // some file in format ".file"
    return;
  }
  let tmp_node = new PaireFileNmae(null, name, name, tail);
  file_nodes.push(tmp_node);
}

// get time for id
function generateIdByTime() {
  const d = new Date();
  return d.getTime();
}

function addAdd() {
  let ancestor = document.getElementById("operation_window");
  let operation_frame = document.createElement("fieldset");
  let operation_frame_id = generateIdByTime();

  removeSelf = (id) => {
    let mySelf = document.getElementById(id);
    let myParent = mySelf.parentElement;
    myParent.removeChild(mySelf);
  };

  operation_frame.className = "operationList_ " + "addAndRep";
  operation_frame.id = operation_frame_id;
  operation_frame.innerHTML =
    `<p class="operationLabel">Add</p>
    <p style="display: inline-block">:</p>
    <input id="` +
    operation_frame_id +
    `_contant` +
    `" type="text" >
    <p style="display: inline-block">Front</p>
    <input type="radio" name="` +
    operation_frame_id +
    `_click_box` +
    `" value="F" style="display: inline-block" checked >
    <p style="display: inline-block">End</p>
    <input type="radio" name="` +
    operation_frame_id +
    `_click_box` +
    `" value="E"  style="display: inline-block">
    <button onclick="removeSelf(` +
    operation_frame_id +
    `)">Delete</button>`;

  ancestor.appendChild(operation_frame);
}

function addSlice() {
  let ancestor = document.getElementById("operation_window");
  let operation_frame = document.createElement("fieldset");
  let operation_frame_id = generateIdByTime();

  removeSelf = (id) => {
    let mySelf = document.getElementById(id);
    let myParent = mySelf.parentElement;
    myParent.removeChild(mySelf);
  };

  operation_frame.className = "operationList_";
  operation_frame.id = operation_frame_id;

  operation_frame.innerHTML =
    `<p class="operationLabel">Slice</p>
    <p style="display: inline-block">:</p>
    <input type="number" id="` +
    operation_frame_id +
    `_x" class = "slice_input">
    <p style="display: inline-block">:</p>
    <input type="number" id="` +
    operation_frame_id +
    `_y" class = "slice_input">
    <p style="display: inline-block">Inner</p>
      <input type="radio" name="` +
    operation_frame_id +
    `_click_box` +
    `" value="IN" style="display: inline-block" checked >
    <p style="display: inline-block">Outter</p>
    <input type="radio" name="` +
    operation_frame_id +
    `_click_box` +
    `" value="OUT"  style="display: inline-block">
    <button onclick="removeSelf(` +
    operation_frame_id +
    `)">Delete</button>`;

  ancestor.appendChild(operation_frame);
}

function addReplaceBy() {
  let ancestor = document.getElementById("operation_window");
  let operation_frame = document.createElement("fieldset");
  let operation_frame_id = generateIdByTime();

  removeSelf = (id) => {
    let mySelf = document.getElementById(id);
    let myParent = mySelf.parentElement;
    myParent.removeChild(mySelf);
  };

  operation_frame.className = "operationList_";
  operation_frame.id = operation_frame_id;

  operation_frame.innerHTML =
    `<p class="operationLabel">ReplaceBy</p>
      <p style="display: inline-block">:</p>
      <input class="slice_input" id="` +
    operation_frame_id +
    `_old">
      <p style="display: inline-block">:</p>
      <input class="slice_input" id="` +
    operation_frame_id +
    `_new">
      <p style="display: inline-block">Front</p>
      <input type="radio" name="` +
    operation_frame_id +
    `_click_box` +
    `" value="F" style="display: inline-block" checked >
    <p style="display: inline-block">End</p>
    <input type="radio" name="` +
    operation_frame_id +
    `_click_box` +
    `" value="E"  style="display: inline-block">
      <button onclick="removeSelf(` +
    operation_frame_id +
    `)">Delete</button>`;

  //   ancestor.innerHTML = "<h1>hhh</h1>";

  ancestor.appendChild(operation_frame);
}

function addSort() {
  let ancestor = document.getElementById("operation_window");
  let operation_frame = document.createElement("fieldset");
  let operation_frame_id = generateIdByTime();

  removeSelf = (id) => {
    let mySelf = document.getElementById(id);
    let myParent = mySelf.parentElement;
    myParent.removeChild(mySelf);
  };

  operation_frame.className = "operationList_";
  operation_frame.id = operation_frame_id;

  operation_frame.innerHTML =
    `<p class="operationLabel">Sort</p>
    <p style="display: inline-block">:</p>
    <p style="display: inline-block">&#8593&#8593</p>
    <input type="radio" id="` +
    operation_frame_id +
    `_order" name="` +
    operation_frame_id +
    "_sort" +
    `" value="up" style="display: inline-block" checked>
    <p style="display: inline-block">&#8595&#8595</p>
    <input type="radio" id="` +
    operation_frame_id +
    `_order" name="` +
    operation_frame_id +
    "_sort" +
    `" value="down" style="display: inline-block">
    <p style="display: inline-block">#</p>
    <input type="checkbox" id="` +
    operation_frame_id +
    `_num" name="` +
    operation_frame_id +
    "_num" +
    `" value="num" style="display: inline-block">
      <button onclick="removeSelf(` +
    operation_frame_id +
    `)">Delete</button>`;

  //   ancestor.innerHTML = "<h1>hhh</h1>";

  ancestor.appendChild(operation_frame);
}
class PaireFileNmae {
  constructor(id, org_name, new_name, file_type) {
    this.org_name = org_name;
    this.new_name = new_name;
    this.file_type = file_type;
    this.id = id;
  }
}
