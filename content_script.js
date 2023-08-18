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
            trie.insert(brandName.toLowerCase(), { name: brandName, category: brandCategory, brand: brand });
          });
        }
      });
    }
  });

  const words = textNode.nodeValue.split(' ');
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const matchedBrand = trie.search(word.toLowerCase());
    if (matchedBrand) {
      const parent = textNode.parentNode;
      if (!parent) {
        break;
      }

      const wordIndex = textNode.nodeValue.indexOf(word);
      const preMatchTextNode = document.createTextNode(textNode.nodeValue.slice(0, wordIndex));
      const postMatchTextNode = document.createTextNode(textNode.nodeValue.slice(wordIndex + word.length));

      if (parent && matchedBrand) {
        parent.insertBefore(preMatchTextNode, textNode);
        const span = createBrandSpan(word, matchedBrand.category, matchedBrand.brand);
        parent.insertBefore(span, textNode);

        const remainingText = textNode.nodeValue.slice(wordIndex + word.length);
        if (remainingText) {
          const remainingTextNode = document.createTextNode(remainingText);
          parent.insertBefore(remainingTextNode, textNode);
        }

        parent.removeChild(textNode);
      }

      textNode = postMatchTextNode;
    }
  }
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

  const tooltip = document.createElement('div');
  tooltip.style.display = 'none';
  tooltip.style.position = 'absolute';
  tooltip.style.top = '100%';
  tooltip.style.left = '0';
  tooltip.style.width = '240px';
  tooltip.style.padding = '16px';
  tooltip.style.background = '#e2f8ee';
  tooltip.style.color = '#414141';
  tooltip.style.fontSize = '14px';
  tooltip.style.borderRadius = '8px';
  tooltip.style.zIndex = '9999';

  let tooltipHTML = '';
  if (brand.description) {
    tooltipHTML += `<p>${brand.description}</p>`;
  }
  if (brand.linkSource) {
    tooltipHTML += `<a href="${brand.linkSource}" target="_blank">Дізнатись більше</a>`;
  }
  tooltip.innerHTML = tooltipHTML;

  return tooltip;
}

// Function to create a span element for the brand name and emoji
function createBrandSpan(match, brandCategory, brand) {
  const span = document.createElement('span');
  span.textContent = `${match} ${brandCategory.emoji}`;
  span.style.position = 'relative';
  span.classList.add('brand-span'); // Add a class to the span for identification

  const tooltip = createTooltip(brand);
  if (tooltip) {
    span.appendChild(tooltip);
  }

  return span;
}

// Function to traverse and add emojis to all text nodes on the page
function traverseAndAddEmojis(node, brandData) {
  if (node.nodeType === Node.TEXT_NODE) {
    addEmojisToTextNode(node, brandData);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    node.childNodes.forEach((childNode) => {
      traverseAndAddEmojis(childNode, brandData);
    });
  }
}

// Retrieve brandData from local storage or use default values
chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
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
            requestIdleCallback(() => {
              if (node.nodeType === Node.TEXT_NODE) {
                addEmojisToTextNode(node, brandData);
              } else if (node.nodeType === Node.ELEMENT_NODE) {
                traverseAndAddEmojis(node, brandData);
              }
            });
          });
        }
      });
  
      isProcessing = false;
  
      if (pendingMutations) {
        pendingMutations = false;
        observer.takeRecords().forEach(mutation => {
          if (mutation.type === "childList") {
            mutation.addedNodes.forEach((node) => {
              requestIdleCallback(() => {
                if (node.nodeType === Node.TEXT_NODE) {
                  addEmojisToTextNode(node, brandData);
                } else if (node.nodeType === Node.ELEMENT_NODE) {
                  traverseAndAddEmojis(node, brandData);
                }
              });
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
});

document.body.addEventListener('mouseover', (event) => {
  if (event.target.classList.contains('brand-span')) {
    const tooltip = event.target.querySelector('div');
    if (tooltip) {
      tooltip.style.display = 'block';
    }
  }
});

document.body.addEventListener('mouseout', (event) => {
  if (event.target.classList.contains('brand-span')) {
    const tooltip = event.target.querySelector('div');
    if (tooltip) {
      tooltip.style.display = 'none';
    }
  }
});