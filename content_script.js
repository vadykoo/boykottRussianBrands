// Function to check if the text node already contains an emoji
function hasEmoji(textNode) {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  return emojiRegex.test(textNode.nodeValue);
}

// Function to create a tooltip
function createTooltip(brand) {
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
  span.style.cursor = 'pointer';
  span.style.position = 'relative';

  const tooltip = createTooltip(brand);

  span.addEventListener('mouseover', () => {
    tooltip.style.display = 'block';
  });

  span.addEventListener('mouseout', () => {
    tooltip.style.display = 'none';
  });

  span.appendChild(tooltip);

  return span;
}

// Function to add emojis to the text node
function addEmojisToTextNode(textNode, brandData) {
  if (hasEmoji(textNode)) return;

  brandData.forEach((brandCategory) => {
    if (brandCategory.enabled) {
      brandCategory.names.forEach((brand) => {
        if (brand.names) {
          brand.names.forEach((brandName) => {
            const brandRegex = new RegExp(`(^|[^\\p{L}])${brandName}($|[^\\p{L}])`, "giu");
            if (brandRegex.test(textNode.nodeValue)) {
              const parent = textNode.parentNode;
              const text = textNode.nodeValue;
              const matchIndex = text.search(brandRegex);
              const match = text.match(brandRegex)[0];

              const span = createBrandSpan(match, brandCategory, brand);

              if (matchIndex > 0) {
                textNode.nodeValue = text.substring(0, matchIndex);
                parent.insertBefore(span, textNode.nextSibling);
              } else {
                textNode.nodeValue = text.substring(match.length);
                parent.insertBefore(span, textNode);
              }

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
    node.childNodes.forEach((childNode) => {
      traverseAndAddEmojis(childNode, brandData);
    });
  }
}

// Retrieve brandData from local storage or use default values
chrome.storage.local.get({ brandData: null }, ({ brandData }) => {
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