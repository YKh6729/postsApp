const fs = require("fs");
const postsFilePath = "./posts.json";

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

module.exports = {
  getPosts,
  createPost,
  deletePost,
  updatePost,
};
