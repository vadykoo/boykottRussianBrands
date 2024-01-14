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
  if (hasBrandNameWithoutEmoji(textNode)) return;

  const trie = new Trie();
  brandData.forEach((brandCategory) => {
    if (brandCategory.enabled) {
      brandCategory.names.forEach((brand) => {
        if (brand.names) {
          brand.names.forEach((brandName) => {
            // Split brand name into words
            const brandWords = brandName.split(' ');

            // Insert the entire brand name as a single entity into the trie
            trie.insert(brandName.toLowerCase(), { name: brandName, category: brandCategory, brand: brand });
          });
        } else if (brandCategory.name === "Custom Brands") {
          trie.insert(brand.name.toLowerCase(), {
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
// Function to check if the parent contains a brand name span without any descendant emoji span
function hasBrandNameWithoutEmoji(node) {
  let currentNode = node;

  // Traverse ancestors until the root
  while (currentNode && currentNode !== document) {
    if (currentNode.nodeType === 1 && currentNode.classList.contains('brand-span')) {
      const hasEmojiDescendant = currentNode.querySelector('.emoji-span');
      if (hasEmojiDescendant) {
        return true;
      }
    }
    
    currentNode = currentNode.parentNode;
  }

  return false;
}
}


// Function to check if a string has numbers
function hasNumbers(word) {
  return /\d/.test(word);
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
  tooltip.style.background = "#3498DB";
  // tooltip.style.color = "#ffffff !important";
  tooltip.style.fontSize = "14px";
  tooltip.style.borderRadius = "8px";
  tooltip.style.zIndex = "9999"; 
  tooltip.style.fontFamily = "Montserrat"; 

  let tooltipHTML = "";
  if (brand.description) {
    tooltipHTML += `<p style="padding-bottom: 20px;color: #fff">${brand.description}</p>`;
  }
  if (brand.linkSource) {
    tooltipHTML += `<a href="${brand.linkSource}" style="text-decoration:underline;color: #fff; padding-top: 20px important!" target="_blank">Дізнатись більше</a>`;
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
  closeButton.style.color = "#ffffff !important";

  // Add an event listener to the close button to hide the tooltip when clicked
  closeButton.addEventListener("click", (event) => {
    event.stopPropagation();
    tooltip.style.display = "none";
  });

  // Add the close button to the tooltip
  tooltip.appendChild(closeButton);

  return tooltip;
}

function createBrandSpan(match, brandCategory, brand) {
  // Create a span for the container
  const containerSpan = document.createElement("span");
  containerSpan.style.position = "relative";
  containerSpan.classList.add("brand-span"); // Add a class to the span for identification
  containerSpan.dataset.brand = JSON.stringify(brand); // Store the brand data in the dataset

  // Create a span for the brand name
  const brandNameSpan = document.createElement("span");
  brandNameSpan.textContent = match;
  brandNameSpan.style.position = "relative";
  brandNameSpan.classList.add("brand-name-span"); // Add a class to the span for identification
  brandNameSpan.dataset.brand = JSON.stringify(brand); // Store the brand data in the dataset

  // Create a span for the emoji
  const emojiSpan = document.createElement("span");
  emojiSpan.textContent = brandCategory.emoji;
  emojiSpan.style.position = "relative";
  emojiSpan.classList.add("emoji-span"); // Add a class to the span for identification

  // Append both spans to the container span
  containerSpan.appendChild(brandNameSpan);
  containerSpan.appendChild(emojiSpan);

  return containerSpan;
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
      removeEventListeners(); // Remove event listeners if extension is disabled
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

let hideTooltipTimeout = 5;

let activeTooltip = null;

document.body.addEventListener('mouseover', (event) => {
  const target = event.target;

  if (target.classList.contains('emoji-span')) {
    const brandSpan = target.closest('.brand-span');

    if (brandSpan) {
      const brandNameSpan = brandSpan.querySelector('.brand-name-span');
      const existingTooltip = brandSpan.querySelector("div");

      // Check if there is an active tooltip
      if (activeTooltip && activeTooltip !== existingTooltip) {
        activeTooltip.style.display = 'none';
        activeTooltip = null;
      }

      // Toggle the display of the tooltip
      const brand = JSON.parse(brandSpan.dataset.brand);
      let tooltip = existingTooltip;

      if (tooltip) {
        // Update the position of the existing tooltip
        const rect = target.getBoundingClientRect(); // Use the target (emoji-span) for positioning
        tooltip.style.left = `${rect.left}px`;
        tooltip.style.top = `${rect.bottom}px`; // Position the tooltip under the emoji-span
      } else {
        // If tooltip doesn't exist, create and append a new one
        tooltip = createTooltip(brand);

        if (tooltip) {
          const rect = target.getBoundingClientRect();
          tooltip.style.left = `${rect.left}px`;
          tooltip.style.top = `${rect.bottom}px`;

          brandSpan.appendChild(tooltip);
          addTooltipEventListeners(tooltip, brandSpan);
        }
      }

      // Toggle the display based on the current state
      const isTooltipVisible = tooltip.style.display === "block";
      tooltip.style.display = isTooltipVisible ? "none" : "block";

      clearTimeout(hideTooltipTimeout);
      if (tooltip.style.display === "block") {
        activeTooltip = tooltip; // Set the active tooltip
      }
    }
  }
});


function addTooltipEventListeners(tooltip, brandSpan) {
  let isTooltipHovered = false;
  let isBrandSpanHovered = false;

  tooltip.addEventListener('mouseover', () => {
    isTooltipHovered = true;
    clearTimeout(hideTooltipTimeout);
  });

  tooltip.addEventListener('mouseout', () => {
    isTooltipHovered = false;
    checkAndHideTooltip();
  });

  brandSpan.addEventListener('mouseover', () => {
    isBrandSpanHovered = true;
    clearTimeout(hideTooltipTimeout);
  });

  brandSpan.addEventListener('mouseout', () => {
    isBrandSpanHovered = false;
    checkAndHideTooltip();
  });

  tooltip.addEventListener('click', (event) => {
    event.stopPropagation();
  });

  const link = tooltip.querySelector('a');
  if (link) {
    link.addEventListener('click', (event) => {
      event.stopPropagation();
      window.open(link.href, '_blank');
    });
  }

  function checkAndHideTooltip() {
    if (!isTooltipHovered && !isBrandSpanHovered) {
      hideTooltipTimeout = setTimeout(() => {
        tooltip.style.display = 'none';
        activeTooltip = null; // Clear the active tooltip
      }, 0);
    }
  }
}

// Add a function to remove event listeners
function removeEventListeners() {
  window.removeEventListener("load", processPage);
  window.removeEventListener("hashchange", processPage);
  window.removeEventListener("popstate", processPage);
}