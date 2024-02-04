// imports
const http = require("http");
const url = require("url");
const { StringDecoder } = require("string_decoder");
const fs = require("fs");
const { resolve } = require("path");
const {
  patchSchema,
  postsSchema,
  validate,
} = require("./validations/postValidation");
const {
  getPosts,
  createPost,
  deletePost,
  updatePost,
} = require("./controllers/postControllers");

const postsFilePath = "./posts.json";

// create server and implement callback function
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
          let testResult = validate(newPost, postsSchema);
          if (!testResult.isValid) {
            res.writeHead(400, {
              "Content-Type": "application/json",
            });
            res.end(
              JSON.stringify({
                message: testResult.error.message,
              })
            );
            return;
          } else {
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
          }

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
                const validationSchema =
                  method === "PUT" ? postsSchema : patchSchema;
                let testResult = validate(updatedPost, validationSchema);
                if (!testResult.isValid) {
                  res.writeHead(500, {
                    "Content-Type": "application/json",
                  });
                  res.end(
                    JSON.stringify({
                      message: "Something went wrong.",
                    })
                  );
                } else {
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
                }

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

/*const post1 = {
    "title": "First Post",
    "subtitle": "All true post",
    "author": {
        "firstname": "Yura",
        "lastname": "Khachatryan",
        "age": 22
    }
}

const post2 = {
  "title": "Second post",
  "subtitle": "test author type",
  "author": ""
};

const post3 = {
  title: "Third post",
  subtitle: "test author firstname",
  author: {
    firstname: "jsbvksvvbukyvbuyvyubvlyuabvliaebvsdkvkayefa",
    lastname: "Simonyan",
    age: 19,
  },
};

const post4 = {
  title: "Fourth post",
  subtitle: "test author lastname",
  author: {
    firstname: "Arpine",
    lastname: "asuhfiaerhgsieurhgseiuhgeirugheriugheiaruhgiaeurhgiuerhgilaer",
    age: 21,
  },
};

const post5 = {
  title: "Fifth post",
  subtitle: "test author age",
  author: {
    firstname: "Davit",
    lastname: "Sasunci",
    age: 7000,
  },
};

const post6 = {
  title: "Sixth post",
  subtitle: ["test subtitle type"],
  author: {
    firstname: "Karine",
    lastname: "Soxomonyan",
    age: 28,
  },
};

const post7 = {
  title: "Seventh post",
  author: {
    firstname: "Karine",
    lastname: "Soxomonyan",
    age: 24,
  },
};

const post8 = {
  title: 12,
  subtitle: "test title type post8",
  author: {
    firstname: "Hayk",
    lastname: "Nahapetyan",
    age: 30,
  },
};

const post9 = {
  subtitle: "test no title post 9",
  author: {
    firstname: "Davit",
    lastname: "Sasunyan",
    age: 40,
  },
};

const post10 = [];

const posts = [post1, post2, post3, post4, post5, post6, post7, post8, post9, post10];

const test = (posts = [], schema) => {
  let isValid = true;
  let count = 0;
  let message = "";
  if (posts.length === 0) {
    return "No post!!";
  } else {
    posts.forEach((prop) => {
      let result = validate(prop, schema);
      isValid = result[0];
      message = result[1];
      if (isValid) {
        count++;
        console.log(`${count} post is valid ${result[2]}\n`);
      } else {
        count++;
        console.log(
          `${count} post is invalid!!\nerror message: ${message}\n              `
        );
      }
    });
  }
}; */

// test(posts, postsSchema);
