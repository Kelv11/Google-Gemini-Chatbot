// DOM Elements with null checks
const typingForm = document.querySelector(".typing-form");
const ChatList = document.querySelector(".chat-list");
const suggestion = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

if (!typingForm || !ChatList || !toggleThemeButton || !deleteChatButton) {
  console.error("Required DOM elements not found");
  throw new Error("Required DOM elements not found");
}

let userMessage = null;
let isResponseGenerating = false;

// Utility function to scroll chat to bottom
const scrollToBottom = () => {
  ChatList.scrollTop = ChatList.scrollHeight;
};

// API configuration
const API_KEY = "Add Your API key here";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

// Function to clear chats
const clearChats = () => {
  ChatList.innerHTML = ""; // Clear the chat list directly
  document.body.classList.remove("hide-header");
  try {
    localStorage.removeItem("savedChats");
  } catch (error) {
    console.error("Failed to clear saved chats:", error);
  }
};

const loadLocalstorageData = () => {
  try {
    const savedChats = localStorage.getItem("savedChats");
    const theme = localStorage.getItem("themecolor");
    const isLightMode = theme === "light-mode"; // Changed to match CSS class

    // Apply the stored theme
    document.body.classList.toggle("light-mode", isLightMode); // Changed to match CSS class
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

    // Restore saved chats
    if (savedChats) {
      ChatList.innerHTML = savedChats;
      scrollToBottom();
    }
    document.body.classList.toggle("hide-header", savedChats);
  } catch (error) {
    console.error("Failed to load data from localStorage:", error);
  }
};

// Creates a new message element and returns it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};

// Shows typing effect by displaying characters one by one
const showTypingEffect = (text, textElement) => {
  textElement.innerText = "";
  const characters = Array.from(text);
  let currentIndex = 0;

  const typingInterval = setInterval(() => {
    if (currentIndex < characters.length) {
      textElement.textContent += characters[currentIndex];
      currentIndex++;
      scrollToBottom();
    } else {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      try {
        localStorage.setItem("savedChats", ChatList.innerHTML);
      } catch (error) {
        console.error("Failed to save chats:", error);
      }
      scrollToBottom();
    }
  }, 75);
};

// Fetching response from the API based on the user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text");

  if (!textElement) {
    console.error("Text element not found");
    return;
  }

  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded with status: ${response.status}`);
    }

    const data = await response.json();
    const apiResponse = data?.candidates[0]?.content?.parts[0]?.text;

    if (apiResponse) {
      showTypingEffect(apiResponse, textElement);
    } else {
      textElement.textContent =
        "I couldn't process that request. Please try again.";
      scrollToBottom();
    }
  } catch (error) {
    isResponseGenerating = false;
    console.error("API Error:", error);
    textElement.textContent =
      "Sorry, I encountered an error. Please try again.";
    scrollToBottom();
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

// Showing a loading animation while waiting for the API response
const showLoadingAnimation = () => {
  const html = `
    <div class="message-content">
      <img src="images/gemini.jpg" alt="bot image" class="avatar" />
      <div class="text">
        <div class="loader-section">
          <h3 class="loader-title"></h3>
          <div class="loading-dots">
            <div class="dot"></div>
            <div class="dot"></div>
            <div class="dot"></div>
          </div>
        </div>
      </div>
    </div>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  ChatList.appendChild(incomingMessageDiv);
  scrollToBottom();
  generateAPIResponse(incomingMessageDiv);
};

// Handling sending outgoing chat messages
const handleOutgoingChar = () => {
  userMessage =
    typingForm.querySelector(".typing-input")?.value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return; //exits if there is no message

  isResponseGenerating = true;

  const html = `
    <div class="message-content">
      <img src="images/user.jpg" alt="user image" class="avatar" />
      <p class="text"></p>
    </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  const textElement = outgoingMessageDiv.querySelector(".text");
  if (textElement) {
    textElement.innerText = userMessage;
  }
  ChatList.appendChild(outgoingMessageDiv);
  scrollToBottom();

  typingForm.reset(); //clear input field
  document.body.classList.add("hide-header"); //hide the header once chat starts
  setTimeout(showLoadingAnimation, 600); //show loading animation after a delay
};
//set userMessage and handle outgoing chat when a suggestion is clicked
suggestion.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChar();
  });
});

// Theme toggle handler
const handleThemeToggle = () => {
  const isLightMode = document.body.classList.toggle("light-mode");
  try {
    localStorage.setItem(
      "themecolor",
      isLightMode ? "light-mode" : "dark-mode"
    );
    toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
  } catch (error) {
    console.error("Failed to save theme preference:", error);
  }
};

// Delete chat handler
const handleDeleteChat = () => {
  if (confirm("Are you sure you want to delete all messages?")) {
    clearChats();
  }
};

// Event listeners
toggleThemeButton.addEventListener("click", handleThemeToggle);
deleteChatButton.addEventListener("click", handleDeleteChat);
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();
  handleOutgoingChar();
});

// Initialize
document.addEventListener("DOMContentLoaded", loadLocalstorageData);
