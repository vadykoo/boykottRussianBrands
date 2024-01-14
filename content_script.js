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
    if (typeof word !== 'string' || word.trim() === '') {
      // Handle the error: word is not a non-empty string
      console.error('Invalid word:', word);
      return;
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

// Function to initialize the trie with brand data
function initializeTrie(brandData) {
  const trie = new Trie();
  brandData.forEach((brandCategory) => {
    if (brandCategory.enabled) {
      brandCategory.names.forEach((brand) => {
        if (brand.names) {
          brand.names.forEach((brandName) => {
            insertBrandIntoTrie(trie, brandName.toLowerCase(), { name: brandName, category: brandCategory, brand: brand });
          });
        } else if (brandCategory.name === "Custom Brands") {
          insertBrandIntoTrie(trie, brand.name.toLowerCase(), {
            name: brand.name,
            category: brandCategory,
            brand: brand,
          });
        }
      });
    }
  });
  return trie;
}

// Helper function to insert a brand into the trie
function insertBrandIntoTrie(trie, word, brand) {
  if (typeof word !== 'string' || word.trim() === '') {
    console.error('Invalid word:', word);
    return;
  }

  trie.insert(word, brand);
}

// Function to process text nodes and add emojis
function processTextNode(textNode, trie) {
  if (hasEmoji(textNode)) return;

  const words = textNode.nodeValue.split(' ').filter(word => {
    return !hasNumbers(word) && word.trim().length >= 4;
  });

  let matchedBrandWords = [];
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const matchedBrand = trie.search(word.toLowerCase());
    if (matchedBrand) {
      matchedBrandWords.push(word);
      if (matchedBrandWords.join(' ').toLowerCase() === matchedBrand.name) {
        handleMatchedBrand(textNode, matchedBrandWords, matchedBrand);
        resetMatchedBrand(matchedBrandWords);
      }
    } else {
      resetMatchedBrand(matchedBrandWords);
    }
  }
}

// Helper function to handle matched brand
function handleMatchedBrand(textNode, matchedBrandWords, matchedBrand) {
  const parent = textNode.parentNode;
  if (!parent) {
    return;
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
}

// Helper function to reset matched brand state
function resetMatchedBrand(matchedBrandWords) {
  matchedBrandWords = [];
}

// Refactored addEmojisToTextNode function
function addEmojisToTextNode(textNode, brandData) {
  const trie = initializeTrie(brandData);
  processTextNode(textNode, trie);
}

// Refactored traverseAndAddEmojis function
function traverseAndAddEmojis(node, brandData) {
  if (node.nodeType === Node.TEXT_NODE) {
    addEmojisToTextNode(node, brandData);
  } else if (node.nodeType === Node.ELEMENT_NODE && !node.classList.contains('brand-tooltip')) {
    processChildNodes(node.childNodes, brandData);
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
  tooltip.style.background = "#3498DB";
  tooltip.style.color = "#fff";
  tooltip.style.fontSize = "14px";
  tooltip.style.borderRadius = "8px";
  tooltip.style.zIndex = "9999"; 
  tooltip.style.fontFamily = "Montserrat"; 

  let tooltipHTML = "";
  if (brand.description) {
    tooltipHTML += `<p style="padding-bottom: 20px">${brand.description}</p>`;
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

function processChildNodes(childNodes, brandData) {
  for (let i = 0; i < childNodes.length; i++) {
    const node = childNodes[i];

    if (node.nodeType === Node.TEXT_NODE) {
      addEmojisToTextNode(node, brandData);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      traverseAndAddEmojis(node, brandData);
    }
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
  if (target.classList.contains('brand-span')) {
    const existingTooltip = target.querySelector("div");

    // Check if there is an active tooltip
    if (activeTooltip && activeTooltip !== existingTooltip) {
      activeTooltip.style.display = 'none';
      activeTooltip = null;
    }

    if (existingTooltip && existingTooltip.style.display === "block") {
      return;
    }

    const brand = JSON.parse(target.dataset.brand);
    const tooltip = createTooltip(brand);

    if (tooltip) {
      const rect = target.getBoundingClientRect();
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.top = `${rect.bottom}px`;

      target.appendChild(tooltip);
      addTooltipEventListeners(tooltip, target);
      clearTimeout(hideTooltipTimeout);
      tooltip.style.display = "block";
      activeTooltip = tooltip; // Set the active tooltip
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
      }, 500);
    }
  }
}




// Add a function to remove event listeners
function removeEventListeners() {
  window.removeEventListener("load", processPage);
  window.removeEventListener("hashchange", processPage);
  window.removeEventListener("popstate", processPage);
}