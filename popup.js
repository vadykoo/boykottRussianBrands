const brandForm = document.getElementById("brandForm");

// Function to create checkbox element for each brand category
function createCheckbox(name, enabled) {
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.name = name;
  checkbox.checked = enabled;

  const label = document.createElement("label");
  label.textContent = name;
  label.appendChild(checkbox);

  brandForm.appendChild(label);

  // Add event listener to toggle brand category and send message to background script
  checkbox.addEventListener("change", () => {
    const toggleData = {
      name,
      enabled: checkbox.checked,
    };
    chrome.runtime.sendMessage(toggleData, (response) => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      } else {
        console.log(`Brand category '${name}' toggled: ${checkbox.checked}`);
      }
    });
  });
}

// Fetch brandData from local storage and create checkboxes
chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
  if (!brandData) {
    brandData = defaultBrandData; // Use default brand data if not found in local storage
  }

  brandData.forEach(({ name, enabled }) => {
    createCheckbox(name, enabled);
  });
});
