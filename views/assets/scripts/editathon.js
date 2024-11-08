// Call the function to add headers when the page loads
let headers = ["Serial", "Page name"];
window.addEventListener("DOMContentLoaded", () => {
  if (userdata.upload_date) headers.push("Submission date");
  if (userdata.user_names) headers.push("participent");
  if (userdata.reviewers_name) headers.push("Reviewers");
  headers.push("State");
  if (userdata.creation_date) headers.push("Creation Date");
  if (userdata.user_edit_count) headers.push("Perticipent's Edit Count");
  if (userdata.word_count) headers.push("Pages word count");
  const headerRow = document.getElementById("headerRow");
  headers.forEach((header, i) => {
    const th = document.createElement("th");
    th.setAttribute("onclick", `sortTable(${i},"d")`);
    th.innerHTML = `<div class="sort-icon"><span>${translate(
      header
    )}</span><img src="/assets/imgs/sort down.svg" alt="">
</div>`;
    headerRow.appendChild(th);
  });
  setTimeout(() => {
    if (headers.includes(userdata.default_sort)) {
      sortTable(headers.indexOf(userdata.default_sort));
    }
  }, 200);
});

const table = document.getElementById("table");
const loadMoreBtn = document.getElementById("loadMoreBtn");

let startindex = 0; // Initial start index

loadTable(startindex, (data) => {
  if (!data.batchcompleate) {
    loadMoreBtn.style.display = "block";
    table.innerHTML += data.html;
    // Avoid adding multiple event listeners
    loadMoreBtn.removeEventListener("click", loadMoreHandler); // Optional, if multiple calls suspected
    loadMoreBtn.addEventListener("click", loadMoreHandler);

    function loadMoreHandler() {
      setTimeout(() => {
        if (headers.includes(userdata.default_sort)) {
          //console.log(headers.indexOf(userdata.default_sort));
          sortTable(headers.indexOf(userdata.default_sort));
        }
      }, 200);
      startindex += data.startindex; // Increment startindex based on the number of rows loaded
      loadTable(startindex, (data) => {
        table.innerHTML += data.html;
        if (data.batchcompleate) {
          loadMoreBtn.style.display = "none";
        }
      });
    }
  } else {
    table.innerHTML += data.html;
    loadMoreBtn.style.display = "none";
  }
});
