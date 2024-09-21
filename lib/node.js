// Import the 'crypto' module, which provides cryptographic functionality.
const crypto = require("crypto");

// Import the 'fs' module, which provides an API for interacting with the file system.
const fs = require("node:fs");

// Define the algorithm to be used for encryption and decryption.
const algorithm = "aes-256-ecb"; // AES encryption with a 256-bit key in ECB mode

// Define a template key, which is a 32-byte key used for encryption and decryption.
const templatekey = Buffer.from(
  "20eb74a29ce398e6dd4ea7b00bf1469b93c736657eed0ba16c79a8c796e97c51",
  "hex"
); // crypto.randomBytes(32); // Generate a random 32-byte key

/**
 * Creates or overwrites a file with the provided data.
 * If the file does not exist, it will be created with the primary data.
 * If the file exists, the data will be appended to the existing data.
 *
 * @param {string} filePath - The path to the file.
 * @param {string} user - The user who is creating or updating the file.
 * @param {string} data - The data to be written to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function writeFileOwn(filePath, user, callback) {
  let date = new Date().toISOString();
  // File does not exist, create it with primary data
  const primaryData = {
    createdAt: date, // Timestamp for when the file was created
    user: user, // User who created the file
    data: [], // Array to store data
    lastModified: date, // Timestamp for when the file was last modified
  };
  fs.writeFile(filePath, JSON.stringify(primaryData), (err) => {
    if (err) {
      console.error(err); // Log any errors
    } else {
      callback(); // Call the callback function if successful
    }
  });
}
/**
 * Updates an existing file with the provided data.
 *
 * @param {string} filePath - The path to the file.
 * @param {string} data - The data to be appended to the existing data.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function updateFileOwn(username, data, callback) {
  let filePath =
    __dirname +
    "/../../private/user/usr-" +
    encodeURIComponent(username) +
    ".json";
  let date = new Date().toISOString();
  fs.stat(filePath, (err, stats) => {
    if (err) {
      callback(err);
    } else {
      keepLog(
        username,
        "hosting",
        (err) => {
          if (err) {
            console.error(err);
          } else {
            fs.readFile(filePath, "utf8", (err, existingData) => {
              if (err) {
                callback(err); // Log any errors
              } else {
                const parsedData = JSON.parse(existingData); // Parse the existing data
                parsedData.lastModified = date;
                parsedData.data.push(JSON.parse(data)); // Add the provided data to the existing data
                fs.writeFile(filePath, JSON.stringify(parsedData), (err) => {
                  if (err) {
                    callback(err); // Log any errors
                  } else {
                    callback(); // Call the callback function if successful
                  }
                });
              }
            });
          }
        },
        stats
      );
    }
  });
}
/**
 * Updates an existing file with the provided data.
 *
 * @param {string} path - The path to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function updateFile(path, callback) {
  fs.readFile(path, "utf8", (err, data) => {
    if (err) {
      callback(err);
    } else {
      const oldData = typeof data == "string" ? JSON.parse(data) : data;
      callback(null, oldData, (newData, recall) => {
        fs.writeFile(path, JSON.stringify(newData), (err) => {
          if (err) {
            recall(err);
          } else {
            recall(null);
          }
        });
      });
    }
  });
}
/**
 * Reads the contents of a file.
 *
 * @param {string} path - The path to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function readFile(path, callback) {
  fs.readFile(path, "utf8", (err, data) => {
    if (err) {
      callback(err);
    } else {
      callback(null, JSON.parse(data));
    }
  });
}
/**
 * Writes data to a file.
 *
 * @param {string} path - The path to the file.
 * @param {string} data - The data to be written to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function writeFile(path, data, callback) {
  fs.writeFile(
    path,
    data,
    {
      flag: "w+",
    },
    (err) => {
      if (err) {
        callback(err);
      } else {
        callback(null);
      }
    }
  );
}
/**
 * Deletes a file.
 *
 * @param {string} path - The path to the file.
 * @param {function} callback - The callback function to be called after the operation is complete.
 */
function deleteFile(path, callback, key, username) {
  fs.stat(path, (err, stats) => {
    if (err) {
      console.error(err);
    } else {
      keepLog(
        username,
        "delete",
        (err) => {
          if (err) {
            console.error(err);
          } else {
            fs.unlink(path, function (err) {
              if (err) {
                callback(err);
              } else {
                callback(null, { result: "Success" });
              }
            });
          }
        },
        { ...stats, key: key || null }
      );
    }
  });
}
/**
 * Encrypts an object using a provided key.
 *
 * @param {object} object - The object to be encrypted.
 * @returns {string} The encrypted data in Hex.
 */
function uriEncript(object) {
  const cipher = crypto.createCipheriv(algorithm, templatekey, null); // ECB mode does not use IV
  let encrypted = cipher.update(JSON.stringify(object), "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted; // Encrypted data in Hex
}
/**
 * Decrypts an encrypted string using a provided key.
 *
 * @param {string} encryptedString - The encrypted string to be decrypted.
 * @returns {object} The decrypted object.
 */
function uriDecript(encryptedString) {
  const decipher = crypto.createDecipheriv(algorithm, templatekey, null); // ECB mode does not use IV
  let decrypted = decipher.update(encryptedString, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return isValidJSON(decrypted);
}
/**
 * Checks if a string is valid JSON.
 *
 * @param {string} jsonString - The string to be checked.
 * @returns {object|false} The parsed JSON object if the string is valid, false otherwise.
 */
function isValidJSON(jsonString) {
  try {
    const parsed = JSON.parse(jsonString); // Try to parse the string as JSON
    // Check if the parsed value is an object or an array
    if (typeof parsed === "object" && parsed !== null) {
      return parsed;
    }
  } catch (e) {
    return false; // Return false if the string is not valid JSON
  }
}
/**
 * Converts a JSON object to an HTML table.
 *
 * This function recursively iterates through the JSON object, creating table rows and cells for each key-value pair.
 * If the value is an object, it is recursively converted to a table. If the value is an array, it is converted to an unordered list.
 *
 * @param {object} json - The JSON object to be converted to an HTML table.
 * @returns {string} The HTML table representation of the JSON object.
 */
function jsonToTable(json) {
  let html = "";
  if (Array.isArray(json)) {
    json.forEach((item) => {
      html += `<tr><td>${jsonToTable(item)}</td></tr>`;
    });
  } else {
    for (const key in json) {
      if (key !== "data") html += `<tr><td><strong>${key}</strong></td><td>`;
      //html += "<td>";
      if (typeof json[key] === "object" && !Array.isArray(json[key])) {
        html += jsonToTable(json[key]);
      } else if (Array.isArray(json[key])) {
        html += "<ul>";
        let list = json[key].join("</li><li>");
        html += `<li>${list}</li>`;
      } else {
        html += json[key];
      }
      if (key !== "data") html += "</td></tr>";
    }
  }
  return html;
}
function generateTables(json) {
  let html = "";

  if (Array.isArray(json)) {
    for (let index = json.length - 1; index >= 0; index--) {
      let item = json[index];
      html += `<div class="table-container"><div><h3>Serial:${
        index + 1
      }</h3><table border="1" cellpadding="5">${jsonToTable(
        item
      )}</table></div></div>`;
    }
  } else {
    html += `<div class="table-container"><table border="1" cellpadding="5">${jsonToTable(
      json
    )}</table></div>`;
  }

  return html;
}
function editathonTable(page_list, mkey, startindex = 0) {
  let table = "";

  // Get all keys (page names) from page_list
  const pageKeys = Object.keys(page_list);

  if (pageKeys.length) {
    // Loop through each page
    pageKeys.forEach((pageKey, i) => {
      const pageData = page_list[pageKey];
      table += "<tr>";

      // Add page name as the first column
      table += `<td data-label='Serial'>${Number(startindex) + i + 1}</td>`;
      table += `<td data-label='Page name'><a href='/judge?key=${mkey}&page=${encodeURIComponent(
        pageKey
      )}'>${pageKey}</a></td>`;

      // Loop through each field in the page data
      Object.keys(pageData).forEach((field) => {
        let td = "";
        if (field === "sd") {
          td = `<td data-label='Submission'>${formatDate(
            new Date(pageData[field])
          )}</td>`;
        } else if (field === "cd") {
          td = `<td data-label='Creation'>${formatDate(
            new Date(pageData[field])
          )}</td>`;
        } else if (field == "sub") {
          td = `<td data-label='User'>${pageData[field]}</td>`;
        } else if (field == "rev") {
          td = `<td data-label='Reviewer'>${pageData[field]}</td>`;
        } else if (field == "stat") {
          td = `<td data-label='Status'>${pageData[field]}</td>`;
        } else if (field == "ec") {
          td = `<td data-label='Edit Count'>${pageData[field]}</td>`;
        } else if (field == "wc") {
          td = `<td data-label='Word Count'>${pageData[field]}</td>`;
        } else {
          td = `<td data-label=''>${pageData[field]}</td>`;
        }
        table += td;
      });

      table += "</tr>";
    });
  }

  return table;
}
function keepLog(username, action, callback, rdata) {
  let sdata = {};
  if (rdata) {
    rdata.atime ? (sdata["last access"] = rdata.atime) : null;
    if (rdata.atime && rdata.mtime && rdata.atime !== rdata.mtime)
      rdata.mtime ? (sdata["last modification"] = rdata.mtime) : null;
    rdata.ctime ? (sdata["creation time"] = rdata.ctime) : null;
    rdata.size ? (sdata.size = rdata.size) : null;
    rdata.ip ? (sdata.ip = rdata.ip) : null;
    rdata.key ? (sdata.key = rdata.key) : null;
  }
  if (username) {
    const date = new Date();
    const filePath = `${__dirname}/../../private/log/log-${date.getFullYear()}-${
      date.getMonth() + 1
    }.json`;
    fs.stat(filePath, (err, stats) => {
      if (err) {
        // File does not exist, create it with primary data
        writeFile(
          filePath,
          JSON.stringify([
            {
              user: username,
              action: action,
              data: sdata,
              date: date.toString(),
            },
          ]),
          (err) => {
            if (err) {
              callback(err); // Log any errors
            } else {
              callback(null);
            }
          }
        );
      } else {
        // File exists, update the existing data
        updateFile(filePath, (err, data, ucallback) => {
          if (err) {
            callback(err);
          } else {
            data.push({
              user: username,
              date: date.toString(),
              data: sdata,
              action: action,
            });
            ucallback(data, (err) => {
              if (err) {
                callback(err);
              } else {
                callback(null);
              }
            });
          }
        });
      }
    });
  } else {
    callback(null);
  }
}
function formatDate(date) {
  const day = String(date.getDate()).padStart(2, "0");
  const months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");

  return `${day} ${month} ${year} | ${hours}:${minutes}`;
}
module.exports = {
  writeFileOwn,
  updateFileOwn,
  updateFile,
  uriEncript,
  uriDecript,
  readFile,
  writeFile,
  deleteFile,
  keepLog,
  logTable: generateTables,
  editathonTable,
  stat: fs.stat,
};
