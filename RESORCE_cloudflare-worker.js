/* Function to fetch API information from the provided endpoint */
async function fetchAPIInfo() {
  try {
    // Show loading message in console for debugging
    console.log("Fetching API information...");

    // Make a request to the API endpoint
    const response = await fetch(
      "https://fragrant-snowflake-0588.whatsupajay25.workers.dev/"
    );

    // Check if the request was successful
    if (!response.ok) {
      throw new Error(
        `API request failed: ${response.status} ${response.statusText}`
      );
    }

    // Get the JSON data from the response
    const apiData = await response.json();

    // Log the API information to console for debugging
    console.log("API Information received:", apiData);

    // Return the data so other functions can use it
    return apiData;
  } catch (error) {
    // Log any errors that occur
    console.error("Error fetching API information:", error);

    // Return null if there was an error
    return null;
  }
}

/* Function to display API information in the chat */
async function showAPIInfo() {
  // Add user message to chat
  addMessageToChat("user", "Show API information");

  // Add loading message
  addMessageToChat("assistant", "Fetching API information...");

  // Fetch the API data
  const apiInfo = await fetchAPIInfo();

  // Remove loading message
  const messages = document.querySelectorAll(".assistant-message");
  const lastMessage = messages[messages.length - 1];
  if (
    lastMessage &&
    lastMessage.textContent.includes("Fetching API information...")
  ) {
    lastMessage.remove();
  }

  // Check if we got data
  if (apiInfo) {
    // Format the API information for display
    let infoMessage = "📡 **API Information:**\n\n";

    // Loop through all the properties in the API response
    for (const [key, value] of Object.entries(apiInfo)) {
      infoMessage += `**${key}:** ${value}\n`;
    }

    // Add the API info to chat
    addMessageToChat("assistant", infoMessage);
  } else {
    // Show error message if API fetch failed
    addMessageToChat(
      "assistant",
      "Sorry, I couldn't fetch the API information right now. Please try again later."
    );
  }
}

/* Function to use API info with OpenAI for enhanced responses */
async function callOpenAIWithAPIInfo(userMessage) {
  try {
    // Check if the OpenAI API key is available
    if (typeof OPENAI_API_KEY === "undefined") {
      throw new Error(
        "OpenAI API key not found. Make sure secrets.js is loaded."
      );
    }

    // Fetch additional API information
    const apiInfo = await fetchAPIInfo();

    // Create enhanced system message with API information
    let systemMessage = `You are a specialized L'Oréal beauty advisor chatbot. You ONLY answer questions about:
- L'Oréal products and brands (L'Oréal Paris, Maybelline, Garnier, etc.)
- Beauty, skincare, haircare, and makeup advice
- The specific products the user has selected
- How to use L'Oréal products together in routines

If someone asks about anything else, politely redirect them back to L'Oréal beauty topics.`;

    // Add API information to the system message if available
    if (apiInfo) {
      systemMessage += `\n\nAdditional API Information: ${JSON.stringify(
        apiInfo
      )}`;
    }

    // Add selected products information
    if (selectedProducts.length > 0) {
      const productInfo = selectedProducts
        .map(
          (product) =>
            `${product.name} by ${product.brand} (${product.category}) - ${product.description}`
        )
        .join(", ");

      systemMessage += `\n\nThe user has currently selected these L'Oréal products: ${productInfo}. Focus especially on these products when giving advice.`;
    }

    // Make request to OpenAI API using gpt-4o model
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: systemMessage,
          },
          {
            role: "user",
            content: userMessage,
          },
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    // Check if the response is successful
    if (!response.ok) {
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Check for valid response from OpenAI
    if (data.choices && data.choices[0] && data.choices[0].message.content) {
      return data.choices[0].message.content;
    } else {
      throw new Error("No valid response from OpenAI");
    }
  } catch (error) {
    console.error("Error calling OpenAI API with API info:", error);
    return "Sorry, I'm having trouble connecting right now. Please try again later.";
  }
}

/* Update the chat form submission handler to use API info */
chatForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const userInput = document.getElementById("userInput");
  const message = userInput.value.trim();

  if (message === "") return;

  // Check if user is asking for API information
  if (
    message.toLowerCase().includes("api info") ||
    message.toLowerCase().includes("api information")
  ) {
    userInput.value = "";
    await showAPIInfo();
    return;
  }

  // Add user message to chat
  addMessageToChat("user", message);

  // Clear input field
  userInput.value = "";

  // Add loading message
  addMessageToChat("assistant", "Thinking...");

  // Call OpenAI API with enhanced API information
  const aiResponse = await callOpenAIWithAPIInfo(message);

  // Remove loading message
  const messages = document.querySelectorAll(".assistant-message");
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.textContent.includes("Thinking...")) {
    lastMessage.remove();
  }

  // Add AI response to chat
  addMessageToChat("assistant", aiResponse);
});

/* Initialize API info on page load */
document.addEventListener("DOMContentLoaded", async () => {
  // Load products from JSON file first
  await loadProducts();

  // Fetch API information on startup
  await fetchAPIInfo();

  // Initialize selected products display
  updateSelectedProductsDisplay();

  // Show initial chat message
  chatWindow.innerHTML = `
    <div class="placeholder-message">
      👋 Hi! I'm your L'Oréal beauty advisor. Select products from the categories above, and I'll help you create the perfect routine!
      <br><br>
      💡 Type "API info" to see additional information from our API.
    </div>
  `;
});
