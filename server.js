const express = require("express");
const session = require("express-session");
const passport = require("passport");
const MediaWikiStrategy = require("passport-mediawiki-oauth").OAuthStrategy;
const config = require("./config.json");
const app = express();
const router = express.Router();
const PORT = parseInt(process.env.PORT, 10) || 8000; // IMPORTANT!! You HAVE to use this environment variable as port!
const crypto = require("crypto");
// Define the algorithm and generate a fixed 32-byte key
const {
  uriEncript,
  uriDecript,
  updateFile,
  updateFileOwn,
  writeFileOwn,
  writeFile,
  readFile,
  deleteFile,
  stat,
  keepLog,
} = require("./public/lib/node.js");
const { join } = require("path");

app.set("views", __dirname + "/public/views");
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public/views"));

app.use(passport.initialize());
app.use(passport.session());
router.use(express.json());
router.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: crypto
      .createHash(config.algorithm)
      .update(config.key)
      .digest("base64"),
    saveUninitialized: true,
    resave: true,
  })
);
app.use("/", router);
passport.use(
  new MediaWikiStrategy(
    {
      consumerKey: config.consumer_key,
      consumerSecret: config.consumer_secret,
    },
    function (token, tokenSecret, profile, done) {
      profile.oauth = {
        consumer_key: config.consumer_key,
        consumer_secret: config.consumer_secret,
        token: token,
        token_secret: tokenSecret,
      };
      return done(null, profile);
    }
  )
);
passport.serializeUser(function (user, done) {
  done(null, user);
});
passport.deserializeUser(function (obj, done) {
  done(null, obj);
});
app.use(function (req, res) {
  res.render("error.ejs", {
    status: 404,
    error: "Looks like you've made a wrong move and checkmate!",
    redirect: null,
  });
});
router.get("/", function (req, res) {
  const user = req && req.session && req.session.user;
  res.render("index.ejs", {
    url: req.baseUrl,
    list: require(__dirname + "/private/templist.json"),
    user: JSON.stringify(user),
  });
});
router.get("/login", function (req, res) {
  res.redirect(req.baseUrl + "/oauth-callback");
});
router.get("/oauth-callback", function (req, res, next) {
  /*   passport.authenticate("mediawiki", function (err, usr) {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.redirect(req.baseUrl + "/login");
    }
    req.logIn(user, function (err) {
      if (err) {
        return next(err);
      }
  delete usr._raw;
  let temp = usr._json;
  delete usr._json;
  let user = { ...temp, ...usr };
      req.session.user = user;
      res.redirect(req.baseUrl + "/");
    });
  })(req, res, next); */
  /* Start */
  let usr = require("./private/data.json");
  delete usr._raw;
  let temp = usr._json;
  delete usr._json;
  let user = { ...temp, ...usr };
  /* End */
  const filePath = join(
    __dirname,
    "private",
    "user",
    `usr-${encodeURIComponent(user.username)}.json`
  );
  stat(filePath, (err, stats) => {
    keepLog(user.username, stats, "login", (lerr) => {
      if (lerr) {
        console.error(lerr);
      }
      if (err) {
        writeFileOwn(filePath, JSON.stringify(user), (err) => {
          if (err) {
            console.error(err);
          }
          req.session.user = user;
          res.redirect(req.baseUrl + "/");
        });
      } else {
        updateFile(filePath, (err, data, callback) => {
          if (err) {
            console.error(err);
          } else {
            data.user = user;
            callback(data, (err) => {
              if (err) {
                console.error(err);
              } else {
                req.session.user = user;
                res.redirect(req.baseUrl + "/");
              }
            });
          }
        });
      }
    });
  });
});
router.get("/template", function (req, res) {
  if (req.query && req.query.data) {
    let obj = uriDecript(req.query.data);
    if (obj) {
      if (obj.expire > Date.now()) {
        readFile(
          join(__dirname, "private", "db", "templates", obj.template.file),
          (err, data) => {
            if (err) {
              console.error(err);
            } else {
              res.render("template.ejs", {
                data: data,
                url: req.baseUrl + "/template",
                obj: obj,
                jsonobj: JSON.stringify(obj),
              });
            }
          }
        );
      } else {
        //do nothing
        res.render("error.ejs", {
          status: 400,
          error:
            "key is expired already. If you want to change something, please proceed to dashboard.",
          redirect: {
            url: "/dashboard?key=" + obj.key,
            name: "Go to dashboard",
          },
        });
      }
    } else {
      res.render("error.ejs", {
        status: 400,
        error: "Invalid query",
        redirect: null,
      });
    }
  } else {
    res.render("error.ejs", {
      status: 400,
      error: "Missing params",
      redirect: null,
    });
  }
});
router.get("/query", (req, res) => {
  const host = decodeURIComponent(req.query.host || "");
  const name = decodeURIComponent(req.query.name || "");
  const { project, key } = req.query;

  if (!name && !key && !host && !project) {
    return res.render("error.ejs", {
      status: 400,
      error: "Missing params",
      redirect: null,
    });
  }

  readFile(join(__dirname, "private", "querylist.json"), (err, parsedData) => {
    if (err) {
      console.error(err);
      return res.render("error.ejs", {
        status: 500,
        error: "Error reading data",
        redirect: null,
      });
    }

    let Data = { name: [], key: [], host: [], date: [], project: [] };

    // If key is provided and exists in parsedData
    if (key && parsedData.key[key]) {
      const keyobj = parsedData.key[key];
      Data = {
        name: [keyobj.name],
        key: [key],
        host: [keyobj.host],
        date: [keyobj.date.split("T")[0]],
        project: [keyobj.project],
      };
    } else {
      // Otherwise, filter based on other parameters
      const keys = Object.entries(parsedData.key);

      keys.forEach(([key, keyobj]) => {
        const matchesHost = host ? keyobj.host === host : true;
        const matchesName = name
          ? keyobj.name.toLowerCase() === name.toLowerCase()
          : true;
        const matchesProject = project ? keyobj.project === project : true;

        if (matchesHost && matchesName && matchesProject) {
          Data.key.push(key);
          Data.name.push(keyobj.name);
          Data.host.push(keyobj.host);
          Data.project.push(keyobj.project);
          Data.date.push(keyobj.date.split("T")[0]);
        }
      });
    }

    const html = Data.key
      .map(
        (_, i) => `<tr>
      <td data-label='Name'>${Data.name[i]}</td>
      <td data-label='Key'><a href='/dashboard?key=${Data.key[i]}'>${
          Data.key[i]
        }</a></td>
      <td data-label='Date'>${Data.date[i]}</td>
      <td data-label='Project'><a href='https://${Data.project[i]}.org/'>${
          Data.project[i]
        }</a></td>
      <td data-label='Host'><a href='/query?host=${encodeURIComponent(
        Data.host[i]
      )}'>${Data.host[i]}</a></td>
    </tr>`
      )
      .join("");

    res.render("list.ejs", { html, data: { key, project, host, name } });
  });
});
router.get("/dashboard", function (req, res) {
  let key = (req && req.query && req.query.key) || null;
  let pass = (req && req.query && req.query.pass) || null;
  if (!key) {
    res.render("dashboard.ejs", {
      key: key,
      data: null,
      pass: pass,
      jsondata: JSON.stringify(null),
    });
  } else {
    readFile(
      join(__dirname, "private", "db", "files", key + ".json"),
      (err, data) => {
        if (err) {
          console.error(err);
          res.render("error.ejs", {
            status: 400,
            error: "File not found!",
            redirect: null,
          });
        } else {
          res.render("dashboard.ejs", {
            key: key,
            pass: pass,
            checkpass: data.pass,
            data: data,
            jsondata: JSON.stringify(data),
          });
        }
      }
    );
  }
});
router.get("/logout", function (req, res) {
  keepLog(req.query.username, null, "logout", (lerr) => {
    if (lerr) {
      console.error(lerr);
    }
    delete req.session.user;
    res.status(200).redirect("/");
  });
});
router.get("/editathon", function (req, res) {
  let key = req.query.key;
  if (!key) {
    res.redirect("/dashboard");
  } else {
    readFile(
      join(__dirname, "private", "db", "files", key + ".json"),
      (err, rdata) => {
        if (err) {
          console.error(err);
        } else {
          res.render("editathon.ejs", {
            key,
            data: rdata,
          });
        }
      }
    );
  }
});

// Route to handle POST requests to "/template"
router.post("/template", (req, res) => {
  // Read the template data from a JSON file
  readFile(join(__dirname, "private", "tempdata.json"), (err, rawdata) => {
    if (err) {
      console.error(err);
    } else {
      let date = new Date().toISOString();
      // Destructure necessary fields from the request body
      const { key, password, template, userdata, compname, project } = req.body;

      // Check for missing parameters and send a 400 status if any are missing
      if (
        !key ||
        !password ||
        !template ||
        !compname ||
        !userdata ||
        !project
      ) {
        return res.render("error.ejs", {
          status: 400,
          error: "Missing params",
          redirect: null,
        });
      }

      // Parse the template data from the file
      let tempdata = rawdata[template];
      // Create the final data object to be saved
      let finaldata = JSON.stringify({
        key: key,
        date: date,
      });

      updateFileOwn(userdata.username, finaldata, (err) => {
        if (err) {
          console.error(err);
        } else {
          // Write user data to a specific file
          writeFile(
            join(__dirname, "private", "db", "files", key + ".json"),
            JSON.stringify({
              key: key,
              pass: password,
              template: tempdata.file,
              host: userdata.username,
              date: date,
              name: compname,
              project: project,
              data: {},
            }),
            (err) => {
              if (err) {
                console.error(err);
              } else {
                // Read the company list data from a JSON file
                readFile(
                  join(__dirname, "private", "querylist.json"),
                  (err, existingData) => {
                    if (err) {
                      console.error(err);
                    } else {
                      // Parse the existing data
                      // Parse the existing data from a JSON string into a JavaScript object
                      const parsedData = existingData;

                      // Add the new company name to the end of the 'name' array
                      parsedData.name.push(compname);
                      parsedData.name = Array.from(new Set(parsedData.name));

                      // Add the new company name to the end of the 'host' array
                      parsedData.host.push(userdata.username);
                      parsedData.host = Array.from(new Set(parsedData.host));
                      // Add the new company name to the end of the 'project' array
                      parsedData.project.push(project);
                      parsedData.project = Array.from(
                        new Set(parsedData.project)
                      );

                      // Set the value of the 'key' property (with the given key) to the new company name
                      parsedData.key[key] = {
                        name: compname,
                        host: userdata.username,
                        date: date,
                        project: project,
                      };

                      // Write the updated data back to the JSON file
                      writeFile(
                        join(__dirname, "private", "querylist.json"),
                        JSON.stringify(parsedData),
                        (err) => {
                          if (err) {
                            console.error(err);
                          } else {
                            // Send a success response
                            res.send({
                              result: "Success",
                              data: uriEncript({
                                key,
                                password,
                                template: tempdata,
                                expire: Date.now() + 20 * 60 * 1000,
                                name: compname,
                                project: project,
                              }),
                            });
                          }
                        }
                      );
                    }
                  }
                );
              }
            }
          );
        }
      });
    }
  });
});
router.post("/dashboard", function (req, res) {
  const { data, key } = req.body;
  req.session.tempdata = { data, key };
  updateFile(
    join(__dirname, "private", "db", "files", `${key}.json`),
    (err, rdata, callback) => {
      if (err) {
        console.error(err);
        return;
      } else {
        // Update or initialize the jurries_list
        const newJurries = data.jurries.split(",").map((j) => j.trim());

        if (data.jurries.trim() !== rdata.data.jurries.trim()) {
          console.log(data.jurries.trim(), rdata.data.jurries.trim());
          newJurries.forEach((jury) => {
            if (!rdata.data.jurries_list[jury]) {
              rdata.data.jurries_list[jury] = [];
            }
          });
        }

        // Update the data object with new values while keeping existing ones
        rdata.data = {
          ...data,
          pagecount: rdata.data.pagecount || 0,
          usercount: rdata.data.usercount || 0,
          reviewed: rdata.data.reviewed || 0,
          jurries_list: rdata.data.jurries_list || {},
        };

        // Initialize page_list if not present
        rdata.data.page_list = rdata.data.page_list || [];
        callback(rdata, (err) => {
          if (err) {
            console.error(err);
          } else {
            res.status(200).send({
              error: null,
            });
          }
        });
      }
    }
  );
});
router.post("/delete", (req, res) => {
  if (req.body) {
    if (req.body.type == "key") {
      let key = req.body.name;
      let userdata = {};
      updateFile(
        join(__dirname, "private", "querylist.json"),
        (err, olddata, callback) => {
          if (err) {
            console.error(err);
          } else {
            userdata = olddata.key[key];
            delete olddata.key[key];
            callback(olddata, (err) => {
              if (err) {
                console.error(err);
              } else {
                updateFile(
                  join(
                    __dirname,
                    "private",
                    "user",
                    `usr-${encodeURIComponent(userdata.host)}.json`
                  ),
                  (err, uolddata, callback) => {
                    if (err) {
                      console.error(err);
                    } else {
                      uolddata.data.filter((e) => e.key !== key);
                      callback(uolddata, (err) => {
                        if (err) {
                          console.error(err);
                        } else {
                          deleteFile(
                            join(
                              __dirname,
                              "private",
                              "db",
                              "files",
                              key + ".json"
                            ),
                            (err) => {
                              if (err) {
                                res.render("error.ejs", {
                                  status: 500,
                                  error:
                                    "Something went error. File not deleted",
                                  redirect: null,
                                });
                              } else {
                                res.status(200).send({
                                  success: true,
                                });
                              }
                            },
                            key,
                            userdata.host
                          );
                        }
                      });
                    }
                  }
                );
              }
            });
          }
        }
      );
    }
  } else {
    res.render("error.ejs", {
      status: 500,
      error:
        "Server side error. Didn't recieved any response from your browser",
      redirect: {
        url: "https://meta.wikimedia.org/wiki/User_talk:মোহাম্মদ_মারুফ",
        name: "Contact Support",
      },
    });
  }
});
app.listen(PORT, () => console.log(`Server listening on port: ${PORT}`));
