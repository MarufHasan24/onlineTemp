document.addEventListener("DOMContentLoaded", function () {
  const inputs = document.querySelectorAll(
    ".settings input, .settings textarea"
  );
  const buttons = document.querySelector(".savecancle");
  const initialValues = new Map();

  // Store initial values on focus
  inputs.forEach((input) => {
    input.addEventListener("focus", function () {
      if (!initialValues.has(input)) {
        initialValues.set(input, input.value);
      }
    });

    // Check for changes on input
    input.addEventListener("input", function () {
      const initialValue = initialValues.get(input);
      if (input.value !== initialValue) {
        buttons.style.display = "flex";
      } else {
        hideButtonsIfNoChanges();
      }
    });
  });

  document.querySelector(".save").addEventListener("click", function () {
    inputs.forEach((e) => {
      const key = e.dataset.properties.toLowerCase().replace(/\s+/g, "_");
      userdata.data[key] = e.value;
    });
    initialValues.clear(); // Clear stored values after saving
    hideButtons();
    fetch("/dashboard", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ data: userdata.data, key: userdata.key }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) {
          console.error(data.error);
        } else {
          window.location.reload();
        }
      })
      .catch((error) => console.error(error));
  });

  document.querySelector(".cancel").addEventListener("click", function () {
    inputs.forEach((input) => {
      if (initialValues.has(input)) {
        input.value = initialValues.get(input); // Revert to initial value
      }
    });
    hideButtons();
  });

  function hideButtons() {
    buttons.style.display = "none";
  }

  function hideButtonsIfNoChanges() {
    const hasChanges = Array.from(inputs).some((input) => {
      const initialValue = initialValues.get(input);
      return input.value !== initialValue;
    });
    if (!hasChanges) {
      hideButtons();
    }
  }
  // Initially hide buttons
  hideButtons();
});
function deleteKey(key) {
  fetch("/delete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: key,
      type: "key",
    }),
  })
    .then((response) => response.json())
    .then((resdata) => {
      if (resdata.success) {
        // Redirect to create new key page
        window.location.href = "/";
      } else {
        console.error("Error deleting key file:", data.error);
      }
    });
}
