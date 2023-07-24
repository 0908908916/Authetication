// 連結到 app.js 登入帳密
// 先新增一個 mongoose 下面是架構

const mongoose = require("mongoose");

// 做一個 userSchema 登入帳密的

const userSchema = new mongoose.Schema({
  username: {
    type: String,
  },
  password: {
    type: String,
  },
});

const User = mongoose.model("User", userSchema);
module.exports = User; // 連結 User 的 exports

// 把這個模組導入 app.js 裡面 require
