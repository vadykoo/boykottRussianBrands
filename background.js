const defaultBrandData = [
  {
    name: "Ukrainian Brands",
    enabled: true,
    names: ["Чумак", "Prestigio", "Brand3"], // Add more Ukrainian brands here
    emoji: "🇺🇦",
  },
  {
    name: "Russian Brands",
    enabled: true,
    names: ["Demix", "Барʼєр", "Барьер"], // Add more Russian brands here
    emoji: "☠️",
  },
  // Add more brand categories and their corresponding emojis here
];

function saveDefaultBrandDataToStorage() {
  chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
    if (!brandData) {
      // If brandData is not in local storage, use the defaultBrandData
      brandData = defaultBrandData;
      // Save the defaultBrandData to local storage
      chrome.storage.local.set({ brandData });
    }
  });
}

// Call the function to save defaultBrandData to local storage
saveDefaultBrandDataToStorage();

// Listen for messages from the content script or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Check if the message is from the popup
  if (sender.tab === undefined) {
    // Save the updated brandData to local storage
    chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
      if (!brandData) {
        brandData = defaultBrandData; // Use default brand data if not found in local storage
      }

      const { name, enabled } = message;
      const brandCategory = brandData.find((category) => category.name === name);

      if (brandCategory) {
        brandCategory.enabled = enabled;
        // Save the updated brandData to local storage
        chrome.storage.local.set({ brandData }, () => {
          sendResponse({ success: true });
        });
      } else {
        sendResponse({ success: false });
      }
    });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});
