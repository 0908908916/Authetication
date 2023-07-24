require("dotenv").config(); // 使用  dotenv 連結 在左邊檔案創建一個 .env 在檔案裏面加入  SECRET=THISISMYTOPSECRET 再把檔案關閉
const express = require("express");
const app = express();
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const session = require("express-session"); // 導入 session
const flash = require("connect-flash"); // 導入 Flash
const bodyParser = require("body-parser"); // 導入 導入 body-parser 連結 運用登入帳密
const User = require("./models/user"); // 把這個 user.js 導入進來 這樣就能夠用他的 js
const bcrypt = require("bcrypt"); // 導入密碼加密 讓駭客不好破解
const saltRounds = 10; // 數字越大所花時間越久 幫密碼加密所需要花的時間 2 的 10 次方 1024 個 Rounds 執行幾次的意思
// 加密執行的動作在以下的 /signup

//////////////////////////////

app.set("view engine", "ejs");

// 跟 cookie 連結 第二個動作
app.use(cookieParser(process.env.SECRET)); //  使用 process 的方法

// 他的 session  middle were 設定很特別
app.use(
  session({
    secret: process.env.SECRET, // 這這樣就可以使用我們設定的 SECRET 在.env 的東西 dotenv 連結
    resave: false, // 記得要設定 包在一個物件裡面 裡面三個設定完可做使用
    saveUninitialized: false,
  })
);

// 他的 Flash middle were 執行這個 flash 之後就可以使用了
app.use(flash());
app.use(bodyParser.urlencoded({ extended: true })); // 解析程式碼

// 把上面這個 true 複製到下面的 route 要等於的部分
// 在做一個 middware 看使用者是否有登入 要進入那個 route 一定要使用者先做登入這個動作
const requireLogin = (req, res, next) => {
  if (!req.session.isVerified == true) {
    res.redirect("login"); // 不等於就導向他
  } else {
    next(); // 這是一個 middware 所以一定要有個 next()
  }
};

mongoose
  .connect("mongodb://127.0.0.1:27017/test", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("connected to mongoDB.");
  })
  .catch((e) => {
    console.log(e);
  });

app.get("/", (req, res) => {
  res.send("home page");
});

// 做 secret 這個 route 再把上面這個 requireLogin 放過來這邊做使用 跑  cmd 當我網頁到這 就會直接把我導向 login 的這個網頁
app.get("/secret", requireLogin, (req, res) => {
  res.render("secret");
});

///////////////////////////

// 以下是整個登入的邏輯
// Login route 用來做登入的 連結到 login.ejs
app.get("/login", (req, res) => {
  res.render("login");
});

// 在來使用這個 login 來找到他的 user 登入出現 My secret is - I love panda. 這個 ejs 的設定就為成功登入
// 正常來說不會這樣寫那麼明顯  登入錯誤 通常程式碼就只會有一個對或不對 2擇1這樣 避免駭客破解 較安全
// 為了避免法律問題 要把 password 加密 以免駭客入侵 之後 cmd 就不會顯示真正的密碼
app.post("/login", async (req, res, next) => {
  let { username, password } = req.body;
  try {
    // 登入成功會跳訊息 失敗一樣會有訊息
    let foundUser = await User.findOne({ username });
    // 處理帳號打錯的訊息
    if (foundUser) {
      // 檢查這個 比較password 要找到 要找到  foundUser 如果有登入成功訊息沒有的話就是登入失敗
      bcrypt.compare(password, foundUser.password, (err, result, next) => {
        if (err) {
          next(err);
        }

        if (result === true) {
          req.session.isVerified = true; // 運用上面的 middware 把這邊弄成 true
          res.redirect("secret"); // 這邊要改成把她重新導向到這個secret 在上面做一個 middware 看使用者是否有登入
        } else {
          res.send("Username or password not correct.");
        }
      });
    } else {
      res.send("Username or password not correct."); // 沒有找到就跳這個錯誤訊息 就是帳號或密碼設定不正確 最好不要告訴別人是哪一個部份不正確
    }
  } catch (e) {
    next(e);
  }
});

//////////////////////////////////

// 使用者帳密登入認證 連結 signup 的 form
app.get("/signup", (req, res) => {
  res.render("signup"); // 記得要 npm i ejs 把它弄到安裝  packge.json 裡面 不然會有問題
});

// 在設定一個 route 測試登入帳密 可以獲取輸入的帳密 console.log(req.body); CMD 顯示 { username: 'wilson@fake.com', password: '123456' }
app.post("/signup", async (req, res, next) => {
  let { username, password } = req.body; // 獲取輸入帳密的資料 要把它存進 database 裡面 所以要做一個 models 資料夾  裡面新增 user.js 檔

  try {
    // 處理帳號密碼重複用在資料庫的問題 不能註冊兩次 如果找到重複的 就不能做下面的動作 記得用 findOne 只會回傳一個
    let foundUser = await User.findOne({ username });
    if (foundUser) {
      res.send("Username has been taken.");
    } else {
      // 裡面放所有的 bcrypt
      // 幫牠的密碼加密 較安全的系統
      bcrypt.genSalt(saltRounds, (err, salt, next) => {
        if (err) {
          next(err); // 如果有錯誤就會顯示錯誤
        }
        console.log(salt); // 密碼一開始是 123456 加密顯示 $2b$10$BJltujJVWyLWMAy/E.HI/O
        // 第一格是使用者輸入的密碼(password)
        bcrypt.hash(password, salt, (err, hash, next) => {
          if (err) {
            next(err);
          }
          console.log(hash); // 密碼一開始是 123456  加密顯示  $2b$10$BJltujJVWyLWMAy/E.HI/OeY0XLetIsmior3mnFukRCuvCymwfcr2
          // 來存我的東西 password 要來存我的 hash
          let newUser = new User({ username, password: hash }); // 用一個變數 然後導入 js 的檔案 user.js 做使用
          // 接下來要把它放進去我的 database 裡面 用 save 存進去
          try {
            newUser
              .save()
              .then(() => {
                res.send("Data has been saved.");
              })
              .catch((e) => {
                res.send("Error!!");
              });
          } catch (err) {
            next(err);
          }
        });
      });
    }
  } catch (err) {
    next(err);
  }
});

// 以上好就可以測試看看 要確認是否有確實存在 database 就到 cmd 的 mongo 裡面看
// 查找指令為  db.users.find() user 後面要加一個 s 可看到裡面 { "_id" : ObjectId("64b7d3f6b8fa70dcdf8f60e4"), "username" : "wilson@fake.com", "password" : "123456", "__v" : 0 } 有這個資料
// 然後再做兩個 ejs 放進 views 裡面 套用 app.js

app.get("/*", (req, res) => {
  res.status(404).send("404 Page not found.");
});

// 處理 error handler 一般的錯誤
app.use((err, req, res, next) => {
  console.log(err); // 如果有錯誤就把它顯示在 console.log 裡面 跟以上做關聯
  res.status(500).send("Something is broken. We will fix it soon."); // 代表系統錯誤
});

app.listen(3000, () => {
  console.log("Server running on port 3000.");
});

// 網址為 http://localhost:3000/
