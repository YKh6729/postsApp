// imports
const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const fs = require("fs");
const { resolve } = require("path");

const postsFilePath = "./posts.json";

const postsSchema = {
  title: {
    type: "string",
    maxLength: 15,
    minLength: 8,
    recuired: true,
  },
  subtitle: {
    type: "string",
    maxLength: 50,
    minLength: 10,
    required: false,
  },
  author: {
    type: "object",
    schema: {
      firstname: {
        type: "string",
        maxLength: 15,
        required: true,
      },
      lastname: {
        type: "string",
        maxLength: 15,
        required: true,
      },
      age: {
        type: "number",
        min: 18,
        max: 100,
        required: true,
      },
    },
    required: true,
  },
};

const validate = (obj, schema) => {
  let isValid = true;
  if (typeof obj !== "object") {
    return !isValid;
  }
  const props = Object.keys(schema);
  props.forEach((prop) => {
    if (!obj.hasOwnProperty(prop) && schema[prop].required) {
      isValid = false;
    } else if (typeof obj[prop] !== schema[prop].type) {
      isValid = false;
    } else if (typeof obj[prop] === "string") {
      //check string length and compare with schema validations
    } else if (typeof obj[prop] === "number") {
      //check number validations
    } else if (typeof obj[prop] === "object") {
      validate(obj[prop], obj[prop].schema);
    }
  });
  return isValid;
};

const getPosts = () => {
  let posts = [];
  return new Promise((resolve, reject) => {
    fs.readFile(postsFilePath, (err, data) => {
      if (err) {
        console.error(err.message);
        reject(err);
      }

      posts = data.toString("utf8");
      resolve(JSON.parse(posts));
    });
  });
};

const createPost = (post) => {
  return new Promise((resolve, reject) => {
    getPosts().then((data) => {
      const length = data.length;
      let id;
      if (!length) {
        id = 1;
      } else {
        id = data[length - 1].id + 1;
      }
      post.id = id;
      data.push(post);
      fs.writeFile(postsFilePath, JSON.stringify(data), (err) => {
        if (err) {
          console.error(err.message);
          reject(err);
        }
        resolve(post);
      });
    });
  });
};

const updatePost = (currentPosts, index, newData, isPatch) => {
  if (!isPatch) {
    currentPosts[index] = { ...newData, id: currentPosts[index].id };
  } else {
    currentPosts[index] = { ...currentPosts[index], ...newData };
  }

  return new Promise((resolve, reject) => {
    fs.writeFile(postsFilePath, JSON.stringify(currentPosts), (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      }
      resolve(currentPosts[index]);
    });
  });
};

const deletePost = (receivedPosts, postIndex) => {
  receivedPosts.splice(postIndex, 1);
  return new Promise((resolve, reject) => {
    fs.writeFile(postsFilePath, JSON.stringify(receivedPosts), (err) => {
      if (err) {
        console.error(err.message);
        reject(err);
      }
      resolve();
    });
  });
};

// create server and implement callb ack function
const server = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url, true);
  const path = parsedUrl.pathname;
  const trimPath = path.replace(/^\/+|\/+$/g, "");

  const method = req.method.toUpperCase();

  console.log("method", method);
  console.log("trimPath", trimPath);

  const mainPath = trimPath.split("/")[0];
  let id = trimPath.split("/")[1] || null;

  if (id) {
    id = parseInt(id) || "invalid";
  }

  let result = "";

  const decoder = new StringDecoder("utf-8");

  req.on("data", (data) => {
    console.log("data", data);
    result += decoder.write(data);
  });

  req.on("end", () => {
    result += decoder.end();

    if (mainPath === "posts" && !id) {
      switch (method) {
        case "POST":
          console.log("enter POST");
          const newPost = JSON.parse(result);
          console.log(newPost);
          createPost(newPost)
            .then((createdPost) => {
              console.log("createdPost", createdPost);
              res.writeHead(201, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify(createdPost));
            })
            .catch((err) => {
              console.error("error", err);
              res.writeHead(500, {
                "Content-Type": "application/json",
              });
              res.end(
                JSON.stringify({
                  message: "Something went wrong.",
                })
              );
            });

          break;
        case "GET":
          console.log("enter Get");
          getPosts()
            .then((posts) => {
              console.log("received posts", posts);
              res.writeHead(200, {
                "Content-Type": "application/json",
              });
              res.end(JSON.stringify(posts));
            })
            .catch((err) => {
              console.error("error", err);
              res.writeHead(500, {
                "Content-Type": "application/json",
              });
              res.end(
                JSON.stringify({
                  message: "Something went wrong.",
                })
              );
            });
      }
    } else if (mainPath === "posts" && id) {
      console.log("entered posts/:id");
      getPosts()
        .then((receivedPosts) => {
          const postIndex = receivedPosts.findIndex((el) => el.id === id);
          if (postIndex === -1) {
            res.writeHead(404, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({
                message: "Post not found!!!",
              })
            );
          } else {
            switch (method) {
              case "GET":
                res.writeHead(200, {
                  "Content-Type": "application/json",
                });
                res.end(JSON.stringify(receivedPosts[postIndex]));
                break;
              case "PUT":
              case "PATCH":
                const updatedPost = JSON.parse(result);
                updatePost(
                  receivedPosts,
                  postIndex,
                  updatedPost,
                  method === "PATCH"
                )
                  .then((post) => {
                    console.log("post updated", post);
                    res.writeHead(200, {
                      "Content-Type": "application/json",
                    });
                    res.end(JSON.stringify(post));
                  })
                  .catch((err) => {
                    console.error("error", err);
                    res.writeHead(500, {
                      "Content-Type": "application/json",
                    });
                    res.end(
                      JSON.stringify({
                        message: "Something went wrong.",
                      })
                    );
                  });
                break;
              case "DELETE":
                deletePost(receivedPosts, postIndex)
                  .then(() => {
                    res.writeHead(200, {
                      "Content-Type": "application/json",
                    });
                    res.end(
                      JSON.stringify({
                        message: `Post with id - ${id} successfully deleted`,
                      })
                    );
                  })
                  .catch((err) => {
                    console.error("error", err);
                    res.writeHead(500, {
                      "Content-Type": "application/json",
                    });
                    res.end(
                      JSON.stringify({
                        message: "Something went wrong.",
                      })
                    );
                  });
            }
          }
        })
        .catch((err) => {
          console.error("error", err);
          res.writeHead(500, {
            "Content-Type": "application/json",
          });
          res.end(
            JSON.stringify({
              message: "Something went wrong.",
            })
          );
        });
    }
  });
});

server.listen(6729, () => {
  console.log("server is running on localhost:6729");
});
