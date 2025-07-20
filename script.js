/* Get references to DOM elements */
const categoryFilter = document.getElementById("categoryFilter");
const productsContainer = document.getElementById("productsContainer");
const selectedProductsList = document.getElementById("selectedProductsList");
const generateBtn = document.getElementById("generateRoutine");
const chatForm = document.getElementById("chatForm");
const chatWindow = document.getElementById("chatWindow");

/* Array to store selected products */
let selectedProducts = [];

/* Array to store all products loaded from JSON file */
let allProducts = [];

/* Show initial placeholder message */
productsContainer.innerHTML = `
  <div class="placeholder-message">
    Select a category above to view products
  </div>
`;

/* Function to load products from the JSON file */
async function loadProducts() {
  try {
    // Fetch the products from the JSON file
    const response = await fetch("products.json");
    const data = await response.json();

    // Store the products array from the JSON data
    allProducts = data.products;

    console.log(`Loaded ${allProducts.length} products from JSON file`);
  } catch (error) {
    console.error("Error loading products:", error);

    // Show error message if products can't be loaded
    productsContainer.innerHTML = `
      <div class="placeholder-message" style="color: #ff003b;">
        Sorry, products could not be loaded. Please try again later.
      </div>
    `;
  }
}

/* Function to fetch API information from the Cloudflare Worker endpoint */
async function fetchAPIInfo() {
  try {
    // Show loading message in console for debugging
    console.log("Fetching API information...");

    // Make a request to the Cloudflare Worker API endpoint
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

/* Function to create and display product cards as clickable buttons */
function displayProducts(productsToShow) {
  // Clear the container first
  productsContainer.innerHTML = "";

  // Check if we have products to show
  if (productsToShow.length === 0) {
    productsContainer.innerHTML = `
      <div class="placeholder-message">
        No products found in this category
      </div>
    `;
    return;
  }

  // Loop through each product and create a clickable card
  productsToShow.forEach((product) => {
    // Create a button element for the product card
    const productCard = document.createElement("button");
    productCard.className = "product-card";
    productCard.type = "button";

    // Add a data attribute to store the product ID
    productCard.dataset.productId = product.id;

    // Check if this product is already selected
    const isSelected = selectedProducts.some(
      (selected) => selected.id === product.id
    );
    if (isSelected) {
      productCard.classList.add("selected");
    }

    // Set the HTML content of the product card button with real image URLs
    productCard.innerHTML = `
      <img src="${product.image}" alt="${product.name}" loading="lazy">
      <div class="product-info">
        <h3>${product.name}</h3>
        <p class="brand">${product.brand}</p>
        <p class="description">${product.description}</p>
      </div>
    `;

    // Add click event listener to toggle selection when button is clicked
    productCard.addEventListener("click", () => {
      toggleProductSelection(product);
    });

    // Add the product card button to the container
    productsContainer.appendChild(productCard);
  });
}

/* Function to select or deselect a product when its button is clicked */
function toggleProductSelection(product) {
  // Check if the product is already selected
  const existingIndex = selectedProducts.findIndex(
    (selected) => selected.id === product.id
  );

  if (existingIndex !== -1) {
    // Product is already selected, so remove it from the array
    selectedProducts.splice(existingIndex, 1);
    console.log(`Removed ${product.name} from selection`);
  } else {
    // Product is not selected, so add it to the array
    selectedProducts.push(product);
    console.log(`Added ${product.name} to selection`);
  }

  // Update both displays after changing selection
  updateSelectedProductsDisplay();
  updateProductCardStyles();
}

/* Function to update the selected products box */
function updateSelectedProductsDisplay() {
  // Clear the selected products list
  selectedProductsList.innerHTML = "";

  if (selectedProducts.length === 0) {
    // Show message when no products are selected
    selectedProductsList.innerHTML = `
      <p style="color: #666; text-align: center; padding: 20px;">
        No products selected yet. Click on products above to add them.
      </p>
    `;
    // Disable the generate routine button
    generateBtn.disabled = true;
  } else {
    // Show each selected product in the box
    selectedProducts.forEach((product) => {
      const productItem = document.createElement("div");
      productItem.className = "selected-product-item";

      productItem.innerHTML = `
        <div>
          <div class="product-name">${product.name}</div>
          <div class="product-brand">${product.brand}</div>
        </div>
        <button class="remove-btn" onclick="removeProduct(${product.id})">Remove</button>
      `;

      selectedProductsList.appendChild(productItem);
    });

    // Enable the generate routine button when products are selected
    generateBtn.disabled = false;
  }
}

/* Function to remove a product from selection */
function removeProduct(productId) {
  // Filter out the product with the matching ID
  selectedProducts = selectedProducts.filter(
    (product) => product.id !== productId
  );
  console.log(`Removed product ID ${productId} from selection`);

  // Update both displays after removal
  updateSelectedProductsDisplay();
  updateProductCardStyles();
}

/* Function to update product card button visual styles */
function updateProductCardStyles() {
  // Get all product card buttons on the page
  const productCards = document.querySelectorAll(".product-card");

  productCards.forEach((card) => {
    // Get the product ID from the button
    const productId = parseInt(card.dataset.productId);

    // Check if this product is selected
    const isSelected = selectedProducts.some(
      (product) => product.id === productId
    );

    // Add or remove the 'selected' class to highlight the button
    if (isSelected) {
      card.classList.add("selected");
    } else {
      card.classList.remove("selected");
    }
  });
}

/* Function to call OpenAI API with enhanced API information */
async function callOpenAI(userMessage) {
  try {
    // Check if the OpenAI API key is available
    if (typeof OPENAI_API_KEY === "undefined") {
      throw new Error(
        "OpenAI API key not found. Make sure secrets.js is loaded."
      );
    }

    // Fetch additional API information from Cloudflare Worker
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

/* Function to add messages to the chat window */
function addMessageToChat(sender, message) {
  // Remove placeholder message if it exists
  const placeholder = chatWindow.querySelector(".placeholder-message");
  if (placeholder) {
    placeholder.remove();
  }

  // Create message element
  const messageDiv = document.createElement("div");
  messageDiv.className = `message ${sender}-message`;
  messageDiv.innerHTML = `
    <strong>${sender === "user" ? "You" : "L'Oréal Advisor"}:</strong>
    <div class="message-content">${message}</div>
  `;

  // Add message to chat window
  chatWindow.appendChild(messageDiv);

  // Scroll to bottom of chat
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* Event listener for category filter dropdown */
categoryFilter.addEventListener("change", (e) => {
  const selectedCategory = e.target.value;

  // Filter products by the selected category from our loaded products
  const filteredProducts = allProducts.filter(
    (product) => product.category === selectedCategory
  );

  console.log(
    `Showing ${filteredProducts.length} products for category: ${selectedCategory}`
  );

  // Display the filtered products as clickable buttons
  displayProducts(filteredProducts);
});

/* Event listener for generate routine button */
generateBtn.addEventListener("click", async () => {
  if (selectedProducts.length === 0) {
    alert("Please select at least one L'Oréal product to generate a routine.");
    return;
  }

  // Create detailed product information for the AI
  const productDetails = selectedProducts
    .map((product) => {
      return `${product.name} by ${product.brand} (Category: ${product.category}) - ${product.description}`;
    })
    .join("\n");

  // Create a comprehensive message for generating a L'Oréal skincare plan
  const routineMessage = `As a L'Oréal beauty expert, create a detailed skincare/beauty routine using ONLY these selected L'Oréal products:

${productDetails}

Please provide:
1. Step-by-step order of application (morning and evening routines)
2. How often to use each L'Oréal product
3. Specific tips for using these L'Oréal products together
4. Expected benefits from this L'Oréal routine
5. Timeline for seeing results with these products

Focus ONLY on the selected L'Oréal products. Make it beginner-friendly and specific to these exact products.`;

  // Add user message to chat showing what we're generating
  const productNames = selectedProducts
    .map((product) => product.name)
    .join(", ");

  addMessageToChat("user", `Generate L'Oréal routine for: ${productNames}`);

  // Add loading message with more specific text
  addMessageToChat(
    "assistant",
    "🧴 Creating your personalized L'Oréal routine plan... This may take a moment!"
  );

  // Call OpenAI API to generate detailed routine
  const aiResponse = await callOpenAI(routineMessage);

  // Remove loading message
  const messages = document.querySelectorAll(".assistant-message");
  const lastMessage = messages[messages.length - 1];
  if (
    lastMessage &&
    lastMessage.textContent.includes(
      "Creating your personalized L'Oréal routine plan"
    )
  ) {
    lastMessage.remove();
  }

  // Add AI response to chat with a special header
  addMessageToChat(
    "assistant",
    `✨ **Your Personalized L'Oréal Routine Plan** ✨\n\n${aiResponse}`
  );
});

/* Chat form submission handler with API integration */
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
  const aiResponse = await callOpenAI(message);

  // Remove loading message
  const messages = document.querySelectorAll(".assistant-message");
  const lastMessage = messages[messages.length - 1];
  if (lastMessage && lastMessage.textContent.includes("Thinking...")) {
    lastMessage.remove();
  }

  // Add AI response to chat
  addMessageToChat("assistant", aiResponse);
});

/* Initialize the page when it loads */
document.addEventListener("DOMContentLoaded", async () => {
  // Load products from JSON file first
  await loadProducts();

  // Fetch API information on startup
  const apiInfo = await fetchAPIInfo();
  if (apiInfo) {
    console.log("API successfully connected on startup");
  }

  // Initialize selected products display
  updateSelectedProductsDisplay();

  // Show initial chat message with API info option
  chatWindow.innerHTML = `
    <div class="placeholder-message">
      👋 Hi! I'm your L'Oréal beauty advisor. Select products from the categories above, and I'll help you create the perfect routine!
      <br><br>
      💡 Type "API info" to see additional information from our API.
      <br><br>
      🧴 Click "Generate Routine" after selecting products for a personalized plan!
    </div>
  `;
});
