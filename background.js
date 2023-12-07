var defaultBrandData = [
  // {
  //   name: "Ukrainian Brands",
  //   enabled: true,
  //   names: ["Чумак", "Pobedov"], // Add more Ukrainian brands here
  //   emoji: "🇺🇦",
  // }, 
  // {
  //   name: "Russian Brands",
  //   enabled: true,
  //   names: [], // Add more Russian brands here
  //   emoji: "❌ ",
  // },
  // {
  //   name: "Бренди що досі активно працюють в росії",
  //   enabled: false,
  //   names: [], // Add more Russian brands here
  //   emoji: "🟨",
  // },
  // Add more brand categories and their corresponding emojis here
  // this info will be updated from github
];

var userSettings;

const defaultCustomBrands = {
  name: "Custom Brands",
  enabled: true,
  names: [], // Custom brands will be added here
  emoji: "🚩",
};

function saveDefaultBrandDataToStorage() {
  chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
    if (!brandData) {
      // If brandData is not in local storage, fetch the defaultBrandData
      fetchDefaultBrandDataFromGithub().then((defaultBrandData) => {
        // Save the defaultBrandData to local storage
        console.log(defaultBrandData);
        chrome.storage.local.set({ brandData: defaultBrandData });
      });
    }
  });
}

// Call the function to save defaultBrandData to local storage
fetchBrandDataFromGithub();
saveDefaultBrandDataToStorage();

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "fetchBrandData") {
    fetchBrandDataFromGithub().then((brandData) => {
      console.log(brandData);
      sendResponse({ brandCount: brandData[0].names.length });
    });
    return true; // Indicate that the response will be sent asynchronously
  }


  if (message.action === "addCustomBrand") {
    const customBrand = {
      name: message.brand,
      enabled: true,
      emoji: "🚩",
    };

    chrome.storage.local.get({ customBrands: [] }, ({ customBrands }) => {
      customBrands.push(customBrand);

      chrome.storage.local.set({ customBrands }, () => {
        sendResponse({ success: true });
      });
    });
  }

  // Check if the message is from the popup
  if (sender.tab === undefined) {
    // Save the updated brandData to local storage
    chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
      if (!brandData) {
        brandData = defaultBrandData; // Use default brand data if not found in local storage
      }

      if (message.action === "addCustomBrand") {
        const customBrandCategory = brandData.find(
          (category) => category.name === "Custom Brands",
        );
        if (!customBrandCategory) {
          brandData.push({
            name: "Custom Brands",
            enabled: true,
            names: [{ name: message.brand, enabled: true, emoji: "🚩" }],
            emoji: "🚩",
          });
        } else {
          customBrandCategory.names.push({
            name: message.brand,
            enabled: true,
            emoji: "🚩",
          });
        }
        // Save the updated brandData to local storage
        chrome.storage.local.set({ brandData }, () => {
          sendResponse({ success: true });
        });
      } else {
        const { name, enabled } = message;
        const brandCategory = brandData.find(
          (category) => category.name === name,
        );

        if (brandCategory) {
          brandCategory.enabled = enabled;
          // Save the updated brandData to local storage
          chrome.storage.local.set({ brandData }, () => {
            sendResponse({ success: true });
          });
        } else {
          sendResponse({ success: false });
        }
      }
    });

    // Return true to indicate that the response will be sent asynchronously
    return true;
  }
});

function fetchBrandDataFromGithub() {
  return fetch("https://raw.githubusercontent.com/vadykoo/russianBrandsInUkraine/master/russianInternationalBrands.json")
  .then((response) => response.json())
  .then((fetchedBrandData) => {
    return new Promise((resolve, reject) => {
      fetchDefaultBrandDataFromGithub().then((defaultBrandData) => {
        chrome.storage.local.get(
          { brandData: null, fetchTime: null, customBrands: [] },
          ({ brandData, fetchTime, customBrands }) => {
            const currentTime = Date.now();
            if (
              !brandData ||
              !fetchTime ||
              currentTime - fetchTime > 24 * 60 * 60 * 1000
            ) {
              // If brandData is not in local storage or it's older than one day, fetch it again
              if (!brandData) {
                brandData = defaultBrandData; // Use default brand data if not found in local storage
              }

              // Update the names in the brandData with the fetched data
              for (let brandCategory of brandData) {
                if (fetchedBrandData[brandCategory.name]) {
                  // Assuming brandCategory.names is the array you want to filter
                  const uniqueNames = new Set(brandCategory.names);
                  brandCategory.names = [...uniqueNames];
                  brandCategory.names = fetchedBrandData[
                    brandCategory.name
                  ].map((brand) => ({
                    names: brand.name.map(name => name.toLowerCase()), // Convert all brand names to lowercase
                    description: brand.description,
                    linkSource: brand.linkSource,
                  }));
                }
              }

              // Check for duplicates before appending custom brands
              const customBrandCategory = brandData.find(
                (category) => category.name === "Custom Brands"
              );

              const existingCustomBrandNames = customBrandCategory
                ? customBrandCategory.names.map((brand) => brand.name)
                : [];

              // Append only those custom brands that don't already exist
              const newCustomBrands = customBrands.filter(
                (customBrand) =>
                  !existingCustomBrandNames.includes(customBrand.name)
              );

              if (newCustomBrands.length > 0) {
                // Append new custom brands to the "Custom Brands" category
                if (!customBrandCategory) {
                  brandData.push(defaultCustomBrands);
                }

                brandData
                  .find((category) => category.name === "Custom Brands")
                  .names.push(...newCustomBrands);
              }

              // Save the updated brandData to local storage
              chrome.storage.local.set({ brandData }, () => {
                resolve(brandData);
              });
            } else {
              resolve(brandData);
            }
          },
        );
      });
      });
    })
    .catch((error) => console.error("Error:", error));
}

function fetchDefaultBrandDataFromGithub() {
  return fetch("https://raw.githubusercontent.com/vadykoo/russianBrandsInUkraine/master/defaultBrandDataSettings.json")
    .then((response) => response.json())
    .catch((error) => console.error("Error:", error));
}


// Get userSettings from local storage
chrome.storage.local.get({ userSettings: null }, ({ userSettings }) => {
  // If userSettings doesn't exist
  if (!userSettings) {
    // Fetch the default brand data from GitHub
    fetchDefaultBrandDataFromGithub().then((defaultBrandData) => {
      // Initialize userSettings with the default brand data
      userSettings = defaultBrandData.map(brand => ({
        name: brand.name,
        enabled: brand.enabled
      }));

      // Save userSettings to local storage
      chrome.storage.local.set({ userSettings });
    });
  }
  console.log(userSettings);
});

function updateBrandDataWithUserSettings() {
  // Get userSettings and brandData from local storage
  chrome.storage.local.get({ userSettings: null, brandData: null }, ({ userSettings, brandData }) => {
    if(brandData) {
    // Iterate over brandData
    for (let brand of brandData) {
      // If brand exists in userSettings, update its enabled property
      const userSetting = userSettings.find(setting => setting.name === brand.name);
      if (userSetting) {
        brand.enabled = userSetting.enabled;
      }
    }

      console.log('updateBrandDataWithUserSettings', brandData);

      // Save the updated brandData to local storage
      chrome.storage.local.set({ brandData });
    }
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "updateUserSettings") {
    //Update brandData with userSettings
    updateBrandDataWithUserSettings();
  }
});