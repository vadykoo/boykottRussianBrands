// Function to check if the text node already contains an emoji
function hasEmoji(textNode) {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  return emojiRegex.test(textNode.nodeValue);
}

function addEmojisToTextNode(textNode, brandData) {
  if (hasEmoji(textNode)) return; // Skip if the text node already contains an emoji

  brandData.forEach((brandCategory) => {
    if (brandCategory.enabled) {
      brandCategory.names.forEach((brand) => {
        // Check if brand.names is defined
        if (brand.names) {
          brand.names.forEach((brandName) => { // brand.names is now an array of brand names
            // Replace all occurrences of the brand name with the brand name and corresponding emoji
            const brandRegex = new RegExp(`\\b${brandName}\\b`, "gi");
            if (brandRegex.test(textNode.nodeValue)) {
              const parent = textNode.parentNode;
              const text = textNode.nodeValue;
              const matchIndex = text.search(brandRegex);
              const match = text.match(brandRegex)[0];

              // Create a new span element for the brand name and emoji
              const span = document.createElement('span');
              span.textContent = `${match} ${brandCategory.emoji}`;
              span.style.cursor = 'pointer'; // Change the cursor to a pointer when hovering over the span

              // Create a tooltip
              const tooltip = document.createElement('div');
              tooltip.style.display = 'none';
              tooltip.style.position = 'absolute';
              tooltip.style.width = '240px';
              tooltip.style.padding = '16px';
              tooltip.style.background = '#e2f8ee';
              tooltip.style.color = '#414141';
              tooltip.style.fontSize = '14px';
              tooltip.style.borderRadius = '8px';
              tooltip.style.flexDirection = 'column';
              tooltip.style.alignItems = 'flex-start';
              tooltip.style.zIndex = 99;
            

              // Add the brand description and source link to the tooltip
              let tooltipHTML = '';
              if (brand.description) {
                tooltipHTML += `<p>${brand.description}</p>`;
              }
              if (brand.linkSource) {
                tooltipHTML += `<a href="${brand.linkSource}" target="_blank">Дізнатись більше</a>`;
              }
              tooltip.innerHTML = tooltipHTML;

              // Show the tooltip when the mouse hovers over the span
              span.addEventListener('mouseover', () => {
                tooltip.style.display = 'flex';
              });

              // Hide the tooltip when the mouse leaves the span
              span.addEventListener('mouseout', () => {
                tooltip.style.display = 'none';
              });

              // Append the tooltip to the span
              span.appendChild(tooltip);

              // Split the text node and insert the span
              if (matchIndex > 0) {
                textNode.nodeValue = text.substring(0, matchIndex);
                parent.insertBefore(span, textNode.nextSibling);
              } else {
                textNode.nodeValue = text.substring(match.length);
                parent.insertBefore(span, textNode);
              }

              // Create a new text node for the remaining text and insert it after the span
              if (textNode.nodeValue.length > 0) {
                const remainingTextNode = document.createTextNode(textNode.nodeValue);
                parent.insertBefore(remainingTextNode, span.nextSibling);
                textNode.nodeValue = text.substring(0, matchIndex);
              }
            }
          });
        }
      });
    }
  });
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
