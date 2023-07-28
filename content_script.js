
const brandData = [
  {
    names: ["Чумак", "Prestigio", "Brand3"], // Add more Ukrainian brands here
    emoji: "🇺🇦",
  },
  {
    names: ["Demix", "Барʼєр", "Барьер"], // Add more Russian brands here
    emoji: "☠️",
  },
  // Add more brand categories and their corresponding emojis here
];

// Function to check if the text node already contains an emoji
function hasEmoji(textNode) {
  const emojiRegex = /(\p{Emoji_Presentation}|\p{Emoji}\uFE0F)/gu;
  return emojiRegex.test(textNode.nodeValue);
}

// Helper function to add emojis to a given text node
function addEmojisToTextNode(textNode) {
  if (hasEmoji(textNode)) return; // Skip if the text node already contains an emoji

  let text = textNode.nodeValue;

  brandData.forEach((brandCategory) => {
    brandCategory.names.forEach((brandName) => {
      // Replace all occurrences of the brand name with the brand name and corresponding emoji
      const brandRegex = new RegExp(`\\b${brandName}\\b`, "gi");
      text = text.replace(brandRegex, `${brandName} ${brandCategory.emoji}`);
    });
  });

  // Apply the modified text back to the text node
  textNode.nodeValue = text;
}

// Function to traverse and add emojis to all text nodes on the page
function traverseAndAddEmojis(node) {
  if (node.nodeType === Node.TEXT_NODE) {
    addEmojisToTextNode(node);
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    // Recursively traverse child nodes for element nodes
    node.childNodes.forEach(traverseAndAddEmojis);
  }
}

// Execute the function when the page is loaded and start observing DOM changes
window.addEventListener("load", () => {
  traverseAndAddEmojis(document.body);

  const observer = new MutationObserver((mutationsList) => {
    mutationsList.forEach((mutation) => {
      if (mutation.type === "childList") {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            addEmojisToTextNode(node);
          } else if (node.nodeType === Node.ELEMENT_NODE) {
            traverseAndAddEmojis(node);
          }
        });
      }
    });
  });

  observer.observe(document, { childList: true, subtree: true });
});
