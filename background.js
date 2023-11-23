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
    emoji: "❌ ",
  },
  // {
  //   name: "Бренди досі активно працюють в росії",
  //   enabled: false,
  //   names: [], // Add more Russian brands here
  //   emoji: "🟨",
  // },
  // Add more brand categories and their corresponding emojis here
];

const defaultCustomBrands = {
  name: "Custom Brands",
  enabled: true,
  names: [], // Custom brands will be added here
  emoji: "🚩",
};

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
  return fetch("https://raw.githubusercontent.com/vadykoo/russianBrandsInUkraine/master/russianInternationalBrandsNew.json")
    .then((response) => response.json())
    .then((fetchedBrandData) => {
      return new Promise((resolve, reject) => {
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
    })
    .catch((error) => console.error("Error:", error));
}
