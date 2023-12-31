let observer;
class TrieNode {
  constructor() {
    this.children = {};
    this.endOfWord = null;
  }
}

class Trie {
  constructor() {
    this.root = new TrieNode();
  }

  insert(word, brand) {
    if (typeof word !== 'string') {
      return null;
    }

    let node = this.root;
    for (let char of word) {
      if (!node.children[char]) {
        node.children[char] = new TrieNode();
      }
      node = node.children[char];
    }
    node.endOfWord = brand;
  }

  search(word) {
    let node = this.root;
    for (let char of word) {
      if (!node.children[char]) {
        return null;
      }
      node = node.children[char];
    }

    return node.endOfWord;
  }
}

function addEmojisToTextNode(textNode, brandData) {
  if (hasEmoji(textNode)) return;

  const trie = new Trie();
  brandData.forEach((brandCategory) => {
    if (brandCategory.enabled) {
      brandCategory.names.forEach((brand) => {
        if (brand.names) {
          brand.names.forEach((brandName) => {
            // Split brand name into words
            const brandWords = brandName.split(' ');

            // Insert each word into the trie
            brandWords.forEach((word) => {
              trie.insert(word, { name: brandName, category: brandCategory, brand: brand });
            });
          });
        } else if (brandCategory.name === "Custom Brands") {
          trie.insert(brand.name, {
            name: brand.name,
            category: brandCategory,
            brand: brand,
          });
        }
      });
    }
  });

  const words = textNode.nodeValue.split(' ').filter(word => {
    // Filter out prices, empty strings, and strings smaller than 4 characters
    return !hasNumbers(word) && word.trim().length >= 4;
  });
  
  let matchedBrandWords = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const matchedBrand = trie.search(word.toLowerCase());
    if (matchedBrand) {
      matchedBrandWords.push(word);
      if (matchedBrandWords.join(' ').toLowerCase() === matchedBrand.name) {
        const parent = textNode.parentNode;
        if (!parent) {
          break;
        }

        const wordIndex = textNode.nodeValue.indexOf(matchedBrandWords.join(' '));
        const preMatchTextNode = document.createTextNode(textNode.nodeValue.slice(0, wordIndex));
        const postMatchTextNode = document.createTextNode(textNode.nodeValue.slice(wordIndex + matchedBrandWords.join(' ').length));

        if (parent && matchedBrand) {
          parent.insertBefore(preMatchTextNode, textNode);
          const span = createBrandSpan(matchedBrandWords.join(' '), matchedBrand.category, matchedBrand.brand);
          parent.insertBefore(span, textNode);

          const remainingText = textNode.nodeValue.slice(wordIndex + matchedBrandWords.join(' ').length);
          if (remainingText) {
            const remainingTextNode = document.createTextNode(remainingText);
            parent.insertBefore(remainingTextNode, textNode);
          }

          parent.removeChild(textNode);
        }

        textNode = postMatchTextNode;
        matchedBrandWords = [];
      }
    } else {
      matchedBrandWords = [];
    }
  }
}

// Function to check if a string has numbers
function hasNumbers(word) {
  return /\d/.test(word);
}
// Function to check if the text node already contains an emoji
function hasEmoji(textNode) {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  return emojiRegex.test(textNode.nodeValue);
}

// Function to create a tooltip
function createTooltip(brand) {
  if (!brand.description || !brand.linkSource) {
    return null;
  }
  const tooltip = document.createElement("div");
  tooltip.style.all = "initial"; // Reset all inherited styles
  tooltip.style.display = "none";
  tooltip.style.position = "fixed"; // Change this line
  tooltip.style.top = "100%";
  tooltip.style.left = "0";
  tooltip.style.width = "240px";
  tooltip.style.padding = "16px";
  tooltip.style.background = "#e2f8ee";
  tooltip.style.color = "#414141";
  tooltip.style.fontSize = "14px";
  tooltip.style.borderRadius = "8px";
  tooltip.style.zIndex = "9999";

  let tooltipHTML = "";
  if (brand.description) {
    tooltipHTML += `<p>${brand.description}</p>`;
  }
  if (brand.linkSource) {
    tooltipHTML += `<a href="${brand.linkSource}" target="_blank">Дізнатись більше</a>`;
  }
  tooltip.innerHTML = tooltipHTML;

  tooltip.classList.add("brand-tooltip"); // Add a class to the tooltip

  // Create a close button
  const closeButton = document.createElement("button");
  closeButton.textContent = "X";
  closeButton.style.position = "absolute";
  closeButton.style.top = "0";
  closeButton.style.right = "0";
  closeButton.style.background = "none";
  closeButton.style.border = "none";
  closeButton.style.fontSize = "16px";
  closeButton.style.cursor = "pointer";

  // Add an event listener to the close button to hide the tooltip when clicked
  closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    tooltip.style.display = "none";
  });

  // Add the close button to the tooltip
  tooltip.appendChild(closeButton);

  return tooltip;
}

// Function to create a span element for the brand name and emoji
function createBrandSpan(match, brandCategory, brand) {
  const span = document.createElement("span");
  span.textContent = `${match} ${brandCategory.emoji}`;
  span.style.position = "relative";
  span.classList.add("brand-span"); // Add a class to the span for identification
  span.dataset.brand = JSON.stringify(brand); // Store the brand data in the dataset

  return span;
}

// Function to traverse and add emojis to all text nodes on the page
function traverseAndAddEmojis(node, brandData) {
  if (node.nodeType === Node.TEXT_NODE) {
    addEmojisToTextNode(node, brandData);
  } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('brand-tooltip')) {
    let i = 0;
    function processNextChild() {
      if (i < node.childNodes.length) {
        traverseAndAddEmojis(node.childNodes[i], brandData);
        i++;
        processNextChild();
      }
    }
    requestIdleCallback(processNextChild);
  }
}

// Retrieve brandData from local storage or use default values
chrome.storage.local.get(
  { brandData: null, extensionEnabled: true },
  ({ brandData, extensionEnabled }) => {
    if (!extensionEnabled) {
      console.log("Extension is disabled");
      return;
    }

    let observer;
    function processPage() {
      // Disconnect the old observer, if it exists
      if (observer) {
        observer.disconnect();
      }
      let isProcessing = false;
      let pendingMutations = false;

      requestIdleCallback(() => {
        traverseAndAddEmojis(document.body, brandData);
      });

      observer = new MutationObserver((mutationsList) => {
        if (isProcessing) {
          pendingMutations = true;
          return;
        }

        isProcessing = true;

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

        isProcessing = false;

        if (pendingMutations) {
          pendingMutations = false;
          observer.takeRecords().forEach((mutation) => {
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
        }
      });

      observer.observe(document, { childList: true, subtree: true });
    }

    // Call processPage when the page loads
    window.addEventListener("load", processPage);

    // Also call processPage when the URL changes
    window.addEventListener("hashchange", processPage);
    window.addEventListener("popstate", processPage);
  },
);

let hideTooltipTimeout;
function addTooltipEventListeners(tooltip, brandSpan) {
  let isTooltipHovered = false;
  let isBrandSpanHovered = false;

  // Mouseover event listener for the tooltip
  tooltip.addEventListener('mouseover', () => {
    isTooltipHovered = true;
    clearTimeout(hideTooltipTimeout); // Cancel the tooltip hide timeout
  });

  // Mouseout event listener for the tooltip
  tooltip.addEventListener('mouseout', () => {
    isTooltipHovered = false;
    checkAndHideTooltip();
  });

  // Mouseover event listener for the brand span
  brandSpan.addEventListener('mouseover', () => {
    isBrandSpanHovered = true;
    clearTimeout(hideTooltipTimeout); // Cancel the tooltip hide timeout
  });

  // Mouseout event listener for the brand span
  brandSpan.addEventListener('mouseout', () => {
    isBrandSpanHovered = false;
    checkAndHideTooltip();
  });

  // Prevent click events from propagating to underlying elements
  tooltip.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  // Add click event listener to open the link in a new tab/window
  const link = tooltip.querySelector('a');
  if (link) {
    link.addEventListener('click', (event) => {
      event.stopPropagation(); // Prevent click event from reaching underlying elements
      window.open(link.href, '_blank'); // Open the link in a new tab/window
    });
  }

  function checkAndHideTooltip() {
    if (!isTooltipHovered && !isBrandSpanHovered) {
      hideTooltipTimeout = setTimeout(() => {
        tooltip.style.display = 'none';
      }, 500); // 500ms delay before hiding the tooltip
    }
  }
}
document.body.addEventListener('mouseover', (event) => {
  if (event.target.classList.contains('brand-span')) {
    // Check if a tooltip is already displayed
    const existingTooltip = event.target.querySelector("div");
    if (existingTooltip && existingTooltip.style.display === "block") {
      return;
    }

    // If not, create a new tooltip
    const brand = JSON.parse(event.target.dataset.brand);
    const tooltip = createTooltip(brand);
    if (tooltip) {
      // Calculate the position of the tooltip
      const rect = event.target.getBoundingClientRect();
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom}px`;

      event.target.appendChild(tooltip);
      addTooltipEventListeners(tooltip, event.target); // Add event listeners to the tooltip and brand span
      clearTimeout(hideTooltipTimeout);
      tooltip.style.display = "block";
    }
  }
});
