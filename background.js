const defaultBrandData = [
  // {
  //   name: "Ukrainian Brands",
  //   enabled: true,
  //   names: ["Чумак", "Prestigio"], // Add more Ukrainian brands here
  //   emoji: "🇺🇦",
  // },
  {
    name: "Russian Brands",
    enabled: true,
    names: [], // Add more Russian brands here
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
fetchBrandDataFromGithub();
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

function fetchBrandDataFromGithub() {
  fetch('https://raw.githubusercontent.com/vadykoo/russianBrandsInUkraine/master/russianInternationalBrands.json')
    .then(response => response.json())
    .then(data => {
      // Now you have your data
      const fetchedBrandData = data;

      // Get the existing brandData from local storage
      chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
        if (!brandData) {
          brandData = defaultBrandData; // Use default brand data if not found in local storage
        }

        // Update the names in the brandData with the fetched data
        for (let brandCategory of brandData) {
          if (fetchedBrandData[brandCategory.name]) {
            // Assuming brandCategory.names is the array you want to filter
            const uniqueNames = new Set(brandCategory.names);
            brandCategory.names = [...uniqueNames];
            brandCategory.names = fetchedBrandData[brandCategory.name].map(brand => ({
              names: brand.name, // brand.name is now an array of brand names
              description: brand.description,
              linkSource: brand.linkSource
            }));
          }
        }

        // Save the updated brandData to local storage
        chrome.storage.local.set({ brandData });
      });
    })
    .catch(error => console.error('Error:', error));
}

