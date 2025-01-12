const typingForm = document.querySelector(".typing-form");
const ChatList = document.querySelector(".chat-list");

let userMessage = null;

//API configuration
const API_KEY = "Enter your API key";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;

//Creates a new message element and return it
const createMessageElement = (content, ...classes) => {
  const div = document.createElement("div");
  div.classList.add("message", ...classes);
  div.innerHTML = content;
  return div;
};
//shows typing effect by displaying words one by
const showTypingEffect = (text, textElement) => {
  const words = text.split("");
  let currentWordIndex = 0;
  const typingInterval = setInterval(() => {
    //appending each word to the text element with a space
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : "") + words[currentWordIndex++];
    //if all words are displayed
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
    }
  }, 75);
};

//Fetching response from the API based on the user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); //getting text element
  //Sending a POST request to the API with the User's message
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

    const data = await response.json();
    //getting the API response text
    const apiResponse = data?.candidates[0].content.parts[0].text;
    showTypingEffect(apiResponse, textElement);

    //textElement.innerText = apiResponse;
  } catch (error) {
    console.log(error);
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

//Showing a loading animation while waiting for the API response
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
        </div>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  ChatList.appendChild(incomingMessageDiv);

  generateAPIResponse(incomingMessageDiv);
};

//handling sending outgoing chat messages
const handleOutgoingChar = () => {
  userMessage = typingForm.querySelector(".typing-input").value.trim();
  if (!userMessage) return; //Exits if there is no message

  const html = `<div class="message-content">
          <img src="images/user.jpg" alt="user image" class="avatar" />
          <p class="text">
          </p>
        </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerText = userMessage;
  ChatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); //Clears the input field
  setTimeout(showLoadingAnimation, 600); //Showing loading animation after delay
};

//Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  handleOutgoingChar();
});
