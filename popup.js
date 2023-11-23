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

// Send a message to the background script when the popup is opened
document.addEventListener("DOMContentLoaded", () => {
  chrome.runtime.sendMessage({ action: "fetchBrandData" });
});

const fetchBrandDataButton = document.getElementById("fetchBrandDataButton");
const brandCount = document.getElementById("brandCount");

fetchBrandDataButton.addEventListener("click", () => {
  chrome.storage.local.remove("brandData", function () {
    console.log(
      "brandData has been removed from local storage and updated from GitHub",
    );
  });

  chrome.runtime.sendMessage({ action: "fetchBrandData" }, (response) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError.message);
    } else {
      // Force fetch the brand data again and update the brand count
      chrome.storage.local.set({ fetchTime: null }, () => {
        brandCount.textContent = `Number of brands on server: ${response.brandCount}`;
      });
    }
  });
});

chrome.storage.local.get(
  { brandData: null, fetchTime: null },
  ({ brandData, fetchTime }) => {
    if (brandData) {
      const totalBrandsElement = document.getElementById("totalBrands");
      const lastUpdatedElement = document.getElementById("lastUpdated");

      // Calculate the total number of brands
      let totalBrands = 0;
      brandData.forEach((category) => {
        totalBrands += category.names.length;
      });

      document.getElementById("totalBrands").textContent = totalBrands;

      if (fetchTime) {
        const lastUpdatedDate = new Date(fetchTime);
        lastUpdatedElement.textContent = `Last updated: ${lastUpdatedDate.toLocaleString()}`;
      }
    }
  },
);

const toggleExtensionButton = document.getElementById("toggleExtension");

function updateToggleButton() {
  chrome.storage.local.get(
    { extensionEnabled: true },
    ({ extensionEnabled }) => {
      toggleExtensionButton.textContent = extensionEnabled ? "ON" : "OFF";
    },
  );
}

toggleExtensionButton.addEventListener("click", () => {
  chrome.storage.local.get(
    { extensionEnabled: true },
    ({ extensionEnabled }) => {
      // Toggle the extensionEnabled value
      chrome.storage.local.set({ extensionEnabled: !extensionEnabled }, () => {
        console.log(`Extension toggled: ${!extensionEnabled}`);
        updateToggleButton();
      });
    },
  );
});

// Update the button text when the popup is opened
updateToggleButton();
const addCustomBrandButton = document.getElementById("addCustomBrandButton");
import { defaultBrandData } from './background.js';
const customBrandInput = document.getElementById("customBrandInput");

addCustomBrandButton.addEventListener("click", () => {
  const customBrand = customBrandInput.value.trim();
  if (customBrand) {
    chrome.runtime.sendMessage(
      { action: "addCustomBrand", brand: customBrand },
      (response) => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        } else {
          console.log(`Custom brand '${customBrand}' added`);
          customBrandInput.value = "";
          displayCustomBrands(); // Call the new function after a new custom brand is added
        }
      },
    );
  }
});
// Function to display the list of custom brands
function displayCustomBrands() {
  let customBrandsArea = document.getElementById("customBrandsArea");
  if (!customBrandsArea) {
    customBrandsArea = document.createElement("div");
    customBrandsArea.id = "customBrandsArea";
    document.body.appendChild(customBrandsArea);
  }
  customBrandsArea.innerHTML = ""; // Clear the area

  // Retrieve the brand data from local storage
  chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
    if (brandData) {
      // Filter out the custom brands
      const customBrands = brandData.find(
        (category) => category.name === "Custom Brands",
      );

      if (customBrands) {
        // Append each custom brand to the designated area
        customBrands.names.forEach((brand) => {
          const brandElement = document.createElement("p");
          brandElement.textContent = brand.name;
          customBrandsArea.appendChild(brandElement);
        });
      }
    }
  });
}
displayCustomBrands(); // Call the function when the popup is opened
