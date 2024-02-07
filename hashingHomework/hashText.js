const fs = require("fs");
const crypto = require("crypto");

const messagePath = "./hashingHomeWork/message.json";
const saveFilePath = "./hashingHomeWork/message_hash.txt";

const hash = crypto.createHash("sha256");

let file = JSON.parse(fs.readFileSync(messagePath, "utf-8"));
console.log("data for saving\n", file);

fs.open(saveFilePath, "w+", (err, fd) => {
  file.forEach((el) => {
    if (!el.password) {
      console.error(`${el.username} doesn't have password!`); //i don't know if this needed
      return;
    }
    hash.update(el.password);
    el.password = hash.copy().digest("hex");
  });
  const hashedFile = JSON.stringify(file);
  console.log("hashed file:\n", hashedFile);
  fs.write(fd, hashedFile, (err) => {
    if (err) {
      console.error(err);
    }
  });
});
