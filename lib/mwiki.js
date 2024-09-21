/*
Title: mwiki.js
Author: Maruf Hasan
Description: Libray for internal operations for mediawiki
Date: 03 September, 2024
*/

/*
Title: mwiki.js
Author: Maruf Hasan
Description: Libray for internal operations for mediawiki
Date: 03 September, 2024
*/

const request = require("request"); // Import the request module
//prototype
String.prototype.splitRegex = function (regex) {
  let token = `<split token=${Math.floor(Math.random() * 99)}/>`;
  return this.replace(regex, token).split(token);
};
//main functions to export
const getWikitext = function (title, project, callback) {
  const apiUrl = "https://" + project + ".org/w/api.php";
  let params = {
    action: "parse",
    format: "json",
    page: title,
    prop: "text",
    formatversion: "2",
  };

  request.get({ url: apiUrl, qs: params }, function (error, res, body) {
    if (error) {
      return callback(error, null); // Ensure early return on error
    }
    let parsedBody;
    try {
      parsedBody = JSON.parse(body); // Parse the JSON response safely
    } catch (parseError) {
      return callback(parseError, null); // Handle JSON parse error
    }

    if (parsedBody.error) {
      return callback(parsedBody.error, null); // Handle API error
    }

    // If everything is fine, send the data once
    const data = parsedBody.parse.text;
    callback(null, data);
  });
};
const editPage = function (oauth, project, data, callback) {
  const apiUrl = "https://" + project + ".org/w/api.php";
  getCsrfToken(oauth, (token) => {
    edit(
      title,
      oauth,
      data.text,
      token,
      apiUrl,
      () => {
        callback({
          error: false,
        });
      },
      data.place || "replace"
    );
  });
};
const getinfo = function (title, project, callback, options = {}) {
  const apiUrl = "https://" + project + ".org/w/api.php";
  if (!Object.keys(options).length) {
    callback({
      check: true,
    });
  } else {
    let pageC = options.wordcount || options.precondition ? title : null;
    let creatorC = options.permission || options.creationdate ? title : null;
    let userC =
      (options.editcount || options.lastcontrib) && options.username
        ? options.username
        : null;
    let errors = [];
    pageinfo(pageC, apiUrl, (perror, pdata) => {
      if (perror) {
        errors.push(perror);
      }
      creatorLookOut(creatorC, apiUrl, (cerror, cdata) => {
        if (cerror) {
          errors.push(cerror);
        }
        userinfo(userC, apiUrl, (uerror, udata) => {
          if (uerror) {
            errors.push(errors);
          }
          callback(errors, { pdata, cdata, udata });
        });
      });
    });
  }
};
function pageinfo(title, url, callback) {
  if (!title) {
    callback(null, null);
  } else {
    let params = {
      action: "parse",
      format: "json",
      page: title,
      prop: "wikitext",
      formatversion: "2",
    };
    request.get(
      {
        uri: url,
        qs: params,
        json: true,
      },
      (error, res, data) => {
        if (error) {
          callback(error);
        } else {
          if (data?.parse?.wikitext) {
            callback(null, {
              result: "success",
              wordcount: countWord(data.parse.wikitext),
            });
          } else {
            callback(data);
          }
        }
      }
    );
  }
}
function creatorLookOut(title, url, callback) {
  if (!title) {
    callback(null, null);
  } else {
    let params = {
      action: "query",
      format: "json",
      prop: "revisions",
      titles: title,
      formatversion: "2",
      rvprop: "timestamp|user|comment|tags",
      rvlimit: "1",
      rvdir: "newer",
    };
    request.get(
      { url: url, qs: params, json: true },
      function (error, res, data) {
        if (error) {
          callback(error, null);
        } else {
          let revision = data.query.pages[0].revisions[0],
            result = {
              creator: revision.user,
              creation: revision.timestamp,
              summary: revision.comment,
              tags: revision.tags,
            };
          callback(null, result);
        }
      }
    );
  }
}
function userinfo(username, apiUrl, callback) {
  if (!username) {
    callback(null, null);
  } else {
    let params = {
      action: "query",
      format: "json",
      list: "users|usercontribs",
      formatversion: "2",
      usprop: "editcount|blockinfo",
      ususers: username,
      uclimit: "1",
      ucuser: username,
      ucdir: "older",
      ucprop: "title|timestamp|size|flags",
    };
    request.get(
      {
        uri: apiUrl,
        qs: params,
        json: true,
      },
      (error, res, body) => {
        if (error) {
          callback(error);
        } else {
          let data = body.query.users[0];
          if (data.invalid) {
            callback({
              message: "please log in again",
              code: "Invalid username",
              error: true,
            });
          } else if (data.blockid) {
            if (data.blockexpiry == "infinite") {
              callback({
                message:
                  "You are blocked perform any edit in " +
                  project +
                  ".org for forever. You can't submit your contribution in this editathon",
                code: "blocked",
                error: true,
              });
            } else {
              let dateobj = countDay(data.blockexpiry);
              callback({
                message:
                  "You are blocked perform any edit in " +
                  project +
                  ".org until " +
                  dateobj.date +
                  ". You can't submit your contribution in this editathon for more " +
                  dateobj.days +
                  " days",
                code: "blocked",
                error: true,
              });
            }
          } else {
            callback(null, data);
          }
        }
      }
    );
  }
}
//get and fillter tags from template
function fillterTags(pagename, callback) {
  var params = {
    action: "parse",
    page: pagename,
    format: "json",
  };
  api
    .get(params)
    .then(function (data) {
      var data = data.parse.templates;
      var templates = data.map(function (elem) {
        var tempName = elem["*"].replace("টেমপ্লেট:", "");
        return tempName;
      });
      var tags = templates.filter((value) => problems.includes(value));
      if (tags.length !== 0) {
        callback(tags);
      } else {
        callback(false);
      }
    })
    .fail(function (error) {
      console.error(error);
    });
}
//dependencies
function getCsrfToken(oauthdata, callback) {
  let params = {
    action: "query",
    meta: "tokens",
    type: "csrf",
    format: "json",
  };
  request(
    {
      url: url,
      method: "GET",
      oauth: oauthdata,
      json: true,
      from: params,
    },
    (error, response, body) => {
      if (error) {
        console.error("Error getting CSRF token:", error);
      } else {
        const csrfToken = body.query.tokens.csrftoken;
        callback(csrfToken);
      }
    }
  );
}
function edit(page, oauthdata, data, token, url, callback, where) {
  let params = {
    action: "query",
    titles: page,
    prop: "revisions",
    rvprop: "content",
    format: "json",
  };
  request.get({ url: url, qs: params }, function (error, res, body) {
    if (error) {
      callback(error);
    } else {
      let result = JSON.parse(body);
      let pageData =
        result.query.pages[Object.keys(result.query.pages)[0]].revisions[0][
          "*"
        ];
      let updatedData;

      switch (where) {
        case "append":
          updatedData = pageData + "\n" + data;
          break;
        case "prepend":
          updatedData = data + "\n" + pageData;
          break;
        case "replace":
          updatedData = data;
          break;
        default:
          updatedData = data + "\n" + pageData;
      }

      let editParams = {
        action: "edit",
        title: page,
        text: updatedData,
        summary: "edits usinging checkmate",
        token: token,
        format: "json",
        tag: "checkmate 1.0",
      };
      request(
        {
          url: url,
          method: "POST",
          form: editParams,
          oauth: oauthdata,
          json: true,
        },
        function (error, res, body) {
          if (error) {
            callback(error);
          } else {
            let result = JSON.parse(body);
            if (result.error) {
              callback(result);
            } else {
              callback(null, result.edit);
            }
          }
        }
      );
    }
  });
}
function countWord(wikitext) {
  return wikitext.splitRegex(/(\s|\|\-|')/g).filter((e) => e).length;
}
function countDay(date) {
  let today = new Date();
  let diffdate = new Date(date);
  let diff = Math.abs(today.getTime() - diffdate.getTime());

  let monthArray = [
    "জানুয়ারি",
    "ফেব্রুয়ারি",
    "মার্চ",
    "এপ্রিল",
    "মে",
    "জুন",
    "জুলাই",
    "আগস্ট",
    "সেপ্টেম্বর",
    "অক্টোবর",
    "নভেম্বর",
    "ডিসেম্বর",
  ];
  let diffObj = {
    date:
      diffdate.getDate() +
      " " +
      monthArray[diffdate.getMonth()] +
      ", " +
      diffdate.getFullYear(),
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
  };
  return {
    days: diffObj.days,
    date: diffObj.date,
  };
}

module.exports = {
  editPage,
  getWikitext,
  getinfo,
};
