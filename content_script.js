// Function to check if the text node already contains an emoji
function hasEmoji(textNode) {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  return emojiRegex.test(textNode.nodeValue);
}

// Helper function to add emojis to a given text node
function addEmojisToTextNode(textNode, brandData) {
  if (hasEmoji(textNode)) return; // Skip if the text node already contains an emoji

  let text = textNode.nodeValue;

  brandData.forEach((brandCategory) => {
    if (brandCategory.enabled) {
      brandCategory.names.forEach((brand) => {
        // Check if brand.names is defined
        if (brand.names) {
          brand.names.forEach((brandName) => { // brand.names is now an array of brand names
            // Replace all occurrences of the brand name with the brand name and corresponding emoji
            const brandRegex = new RegExp(`\\b${brandName}\\b`, "gi");
            text = text.replace(brandRegex, (match) => {
              // Create a new span element for the brand name and emoji
              const span = document.createElement('span');
              span.textContent = `${match} ${brandCategory.emoji}`;
              span.title = brand.description; // Set the hover text to the brand description
              span.style.cursor = 'pointer'; // Change the cursor to a pointer when hovering over the span

              // Add a click event listener to the span
              span.addEventListener('click', () => {
                // Open the brand source link in a new tab when the span is clicked
                window.open(brand.linkSource, '_blank');
              });

              // Return the outer HTML of the span
              return span.outerHTML;
            });
          });
        }
      });
    }
  });

  // Apply the modified text back to the text node
  textNode.nodeValue = text;
}

// Function to traverse and add emojis to all text nodes on the page
function traverseAndAddEmojis(node, brandData) {
  if (node.nodeType === Node.TEXT_NODE) {
    addEmojisToTextNode(node, brandData);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Recursively traverse child nodes for element nodes
    node.childNodes.forEach((childNode) => {
      traverseAndAddEmojis(childNode, brandData);
    });
  }
}

// Retrieve brandData from local storage or use default values
chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
  // Execute the function when the page is loaded and start observing DOM changes
  function processPage() {
    traverseAndAddEmojis(document.body, brandData);

    const observer = new MutationObserver((mutationsList) => {
      mutationsList.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.TEXT_NODE) {
              addEmojisToTextNode(node, brandData);
            } else if (node.nodeType === Node.ELEMENT_NODE) {
              traverseAndAddEmojis(node, brandData);
            }
          });
        }
      });
    });

    observer.observe(document, { childList: true, subtree: true });
  }

  window.addEventListener("load", processPage);
});
