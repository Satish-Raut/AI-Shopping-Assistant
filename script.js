const GEMINI_API_KEY = "AIzaSyBlH08SpIF3tOghE3BonkC594mNPqzxfVo";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";
const OPENAI_API_KEY = "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"; // Replace with your OpenAI API key
const OPENAI_API_URL = "https://api.openai.com/v1/images/generations";
const FAKE_STORE_API = "https://fakestoreapi.com/products";

// Add currency conversion constant and function
const USD_TO_INR_RATE = 83.12; // Example fixed rate, you might want to use a real-time API

function convertToINR(usdPrice) {
    return (usdPrice * USD_TO_INR_RATE).toFixed(2);
}

async function testGemini() {
    const prompt = "Say hello!";
    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        console.log(data);
        alert(JSON.stringify(data));
    } catch (e) {
        alert("Error: " + e.message);
    }
}
testGemini();

document.addEventListener("DOMContentLoaded", () => {
    // Dark mode toggle functionality
    const darkModeToggle = document.getElementById('darkModeToggle');
    const body = document.body;
    
    // Function to check system preference
    function checkSystemPreference() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    // Function to set dark mode
    function setDarkMode(isDark) {
        if (isDark) {
            body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        } else {
            body.classList.remove('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-moon"></i> Dark Mode';
        }
        localStorage.setItem('darkMode', isDark);
    }

    // Check for saved preference or system preference
    const savedPreference = localStorage.getItem('darkMode');
    if (savedPreference !== null) {
        setDarkMode(savedPreference === 'true');
    } else {
        setDarkMode(checkSystemPreference());
    }

    // Listen for system preference changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (localStorage.getItem('darkMode') === null) {
            setDarkMode(e.matches);
        }
    });

    // Toggle dark mode on button click
    darkModeToggle.addEventListener('click', () => {
        const isDark = !body.classList.contains('dark-mode');
        setDarkMode(isDark);
    });

    const input = document.querySelector("#user-input");
    const sendBtn = document.querySelector("#send-btn");
    const voiceBtn = document.querySelector("#voice-btn");
    const chatContainer = document.querySelector("#chat-container");

    // Voice recognition setup
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition = null;

    if (SpeechRecognition) {
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onstart = () => {
            voiceBtn.classList.add('listening');
            voiceBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        };

        recognition.onend = () => {
            voiceBtn.classList.remove('listening');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };

        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            input.value = transcript;
            sendBtn.click();
        };

        recognition.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            voiceBtn.classList.remove('listening');
            voiceBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        };

        voiceBtn.addEventListener('click', () => {
            if (voiceBtn.classList.contains('listening')) {
                recognition.stop();
            } else {
                recognition.start();
            }
        });
    } else {
        voiceBtn.style.display = 'none';
        console.log('Speech recognition not supported in this browser.');
    }

    sendBtn.addEventListener("click", () => {
        const message = input.value.trim();
        if (message !== "") {
            addUserMessage(message);
            input.value = "";
            showTyping();
            getGeminiResponse(message);
        }
    });

    input.addEventListener("keypress", (e) => {
        if (e.key === "Enter") sendBtn.click();
    });

    // Add chat history management functions
    function saveChatHistory(message, isUser) {
        const chatHistory = JSON.parse(localStorage.getItem('chatHistory') || '[]');
        chatHistory.push({
            message,
            isUser,
            timestamp: new Date().toISOString(),
            recommendedProducts: !isUser ? window.lastRecommendedProducts || [] : null
        });
        localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
    }

    function loadChatHistory() {
        // Clear existing chat container
        chatContainer.innerHTML = '';
        
        // Clear chat history from localStorage
        localStorage.removeItem('chatHistory');
    }

    // Update addUserMessage function to include timestamp parameter and saving
    function addUserMessage(message, timestamp = new Date(), shouldSave = true) {
        const userBox = document.createElement("div");
        userBox.className = "user-chat-box";
        userBox.innerHTML = `
            <div class="avatar">👤</div>
            <div class="chat-content">
                <div class="user-chat-content">${message}</div>
                <div class="chat-meta">You • ${timestamp.toLocaleTimeString()}</div>
            </div>
        `;
        chatContainer.insertBefore(userBox, chatContainer.firstChild);
        if (shouldSave) {
            saveChatHistory(message, true);
        }
        scrollChatToBottom();
    }

    // Update addAiMessage function to include timestamp parameter and saving
    function addAiMessage(message, imageUrl = null, recommendedProducts = null, timestamp = new Date(), shouldSave = true) {
        removeTyping();

        const aiBox = document.createElement("div");
        aiBox.className = "ai-chat-box";

        // Clean and format the message
        const cleanMessage = message
            .replace(/[*•-]/g, '') // Remove bullets and stars
            .replace(/\n\s*\n/g, '\n\n') // Normalize multiple line breaks
            .replace(/([.!?])\s*\n/g, '$1\n\n') // Add extra line break after sentences
            .trim();
        
        const chatContentDiv = document.createElement("div");
        chatContentDiv.className = "ai-chat-content";
        chatContentDiv.innerHTML = cleanMessage.split('\n\n').map(paragraph => 
            `<p>${paragraph.trim()}</p>`
        ).join('');

        aiBox.innerHTML = `
            <div class="avatar">🛒</div>
            <div class="chat-content"></div>
            <div class="chat-meta">ShopBot • ${timestamp.toLocaleTimeString()}</div>
        `;

        aiBox.querySelector(".chat-content").prepend(chatContentDiv);
        
        if (imageUrl) {
            const imageContainer = addProductImage(imageUrl);
            aiBox.querySelector(".chat-content").appendChild(imageContainer);
        }

        if (recommendedProducts && recommendedProducts.length > 0) {
            window.lastRecommendedProducts = recommendedProducts;
            const productsContainer = document.createElement("div");
            productsContainer.className = "recommended-products";
            productsContainer.innerHTML = `
                <h4>Recommended Products:</h4>
                <div class="products-grid">
                    ${recommendedProducts.map(product => `
                        <div class="product-card">
                            <img src="${product.image}" alt="${product.title}" 
                                onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'"
                                style="cursor: pointer; transition: transform 0.2s;"
                                onmouseover="this.style.transform='scale(1.05)'"
                                onmouseout="this.style.transform='scale(1)'">
                            <h4>${product.title}</h4>
                            <p class="price">₹${convertToINR(product.price)}</p>
                            <p class="rating">Rating: ${product.rating.rate} (${product.rating.count} reviews)</p>
                            <button class="view-btn">View Details</button>
                        </div>
                    `).join('')}
                </div>
            `;
            aiBox.querySelector(".chat-content").appendChild(productsContainer);
        }

        chatContainer.insertBefore(aiBox, chatContainer.firstChild);
        if (shouldSave) {
            saveChatHistory(message, false);
        }
        scrollChatToBottom();
    }

    function showTyping() {
        const typingBox = document.createElement("div");
        typingBox.id = "typing-indicator";
        typingBox.className = "ai-chat-box";
        typingBox.innerHTML = `
            <div class="avatar">🛒</div>
            <div class="chat-content">
                <div class="ai-chat-content">ShopBot is thinking...</div>
            </div>
        `;
        chatContainer.insertBefore(typingBox, chatContainer.firstChild);
        scrollChatToBottom();
    }

    function removeTyping() {
        const typing = document.querySelector("#typing-indicator");
        if (typing) typing.remove();
    }

    async function getGeminiResponse(userMessage) {
        const prompt = `
You are ShopBot, an expert AI shopping assistant with deep knowledge of products, prices, and shopping trends.

Your primary goal is to help users make informed purchase decisions through detailed and helpful responses. Follow these guidelines:

1. UNDERSTAND THE REQUEST:
   - For general questions: Provide comprehensive, informative answers
   - For product recommendations: Analyze preferences and suggest multiple options
   - For price inquiries: Give detailed price breakdowns in INR
   - For comparisons: Offer thorough feature-by-feature analysis

2. RESPONSE STYLE:
   - If the user asks for recommendations, provide detailed explanations for each product
   - Include pros and cons for recommended items
   - Explain your reasoning for suggestions
   - Feel free to be conversational and elaborate when needed
   - Use bullet points for better readability when listing features or comparisons

3. PRODUCT RECOMMENDATIONS:
   When recommending products:
   • Start with a brief understanding of the user's needs
   • List each recommended product with:
     - Product name and price in INR
     - Key features and benefits
     - Why it's suitable for the user
     - Any current deals or discounts
   • End with personalized advice or next steps

4. PRICE INFORMATION:
   • Always convert and show prices in INR
   • Include any applicable discounts
   • Mention price comparisons when relevant
   • Suggest budget alternatives when appropriate

5. ADDITIONAL INFORMATION:
   • Mention relevant shopping trends
   • Suggest complementary products when appropriate
   • Include maintenance or usage tips if relevant
   • Provide context about product categories or features

Format your response based on the type of query:

For Product Recommendations:
• Understanding Your Needs: [Brief analysis of the request]
• Recommended Products:
  1. [Product Name] - ₹[Price]
     - Key Features: [List main features]
     - Why This: [Explanation]
     - Best For: [Use case]
  2. [Continue for each recommendation]
• Additional Advice: [Shopping tips, timing, alternatives]
• Next Steps: [Clear action items]

For General Queries:
• Main Response: [Detailed answer]
• Additional Context: [Related information]
• Helpful Tips: [Relevant advice]
• Next Steps: [If applicable]

Remember to be helpful, informative, and thorough while maintaining clarity and structure.

User question: "${userMessage}"
`;

        try {
            // Check if the message is asking for product recommendations
            const recommendationMatch = userMessage.match(/recommend\s+(\d+)\s+products?|show\s+me\s+(\d+)\s+products?|suggest\s+(\d+)\s+products?/i);
            let recommendedProducts = [];
            let numProducts = 3; // Default number of products
            
            if (recommendationMatch) {
                // Extract number from any of the capturing groups
                numProducts = parseInt(recommendationMatch[1] || recommendationMatch[2] || recommendationMatch[3]);
            }
            
            // Check for recommendation-related keywords
            const isRecommendationQuery = userMessage.toLowerCase().includes('recommend') || 
                                        userMessage.toLowerCase().includes('suggest') ||
                                        userMessage.toLowerCase().includes('show me') ||
                                        userMessage.toLowerCase().includes('what products') ||
                                        userMessage.toLowerCase().includes('which products');

            if (isRecommendationQuery) {
                const products = await fetchProducts();
                console.log('Fetched products for recommendation:', products); // Debug log
                
                // Extract price range if mentioned
                const priceMatch = userMessage.match(/under\s+(\d+)/i);
                const maxPrice = priceMatch ? parseFloat(priceMatch[1]) / USD_TO_INR_RATE : null;
                
                // Extract category if mentioned
                const categories = ['electronics', 'jewelry', 'men\'s clothing', 'women\'s clothing'];
                const categoryMatch = categories.find(cat => userMessage.toLowerCase().includes(cat));
                
                // Filter products based on criteria
                let filteredProducts = products;
                if (maxPrice) {
                    filteredProducts = filteredProducts.filter(p => p.price <= maxPrice);
                }
                if (categoryMatch) {
                    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === categoryMatch);
                }
                
                // Sort by rating and select top N products
                recommendedProducts = filteredProducts
                    .sort((a, b) => b.rating.rate - a.rating.rate)
                    .slice(0, numProducts);

                console.log('Recommended products:', recommendedProducts); // Debug log
            }

            const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    contents: [{
                        parts: [{
                            text: prompt
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.7,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 1024,
                    },
                    safetySettings: [
                        {
                            category: "HARM_CATEGORY_HARASSMENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_HATE_SPEECH",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        },
                        {
                            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                            threshold: "BLOCK_MEDIUM_AND_ABOVE"
                        }
                    ]
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                console.error("API Error Response:", errorData);
                throw new Error(`API Error: ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            console.log("API Success Response:", data);

            const aiText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (aiText && aiText.trim().length > 0) {
                if (userMessage.toLowerCase().includes("show") || 
                    userMessage.toLowerCase().includes("image") || 
                    userMessage.toLowerCase().includes("picture")) {
                    console.log("Generating image for product query");
                    const imagePrompt = `High quality product image of ${userMessage}, professional product photography, clean background, detailed product view`;
                    const imageUrl = await generateProductImage(imagePrompt);
                    if (imageUrl) {
                        console.log("Image generated successfully:", imageUrl);
                        addAiMessage(aiText.trim(), imageUrl, recommendedProducts);
                    } else {
                        console.log("Failed to generate image, showing text only");
                        addAiMessage(aiText.trim(), null, recommendedProducts);
                    }
                } else {
                    addAiMessage(aiText.trim(), null, recommendedProducts);
                }
            } else {
                throw new Error('No valid response from API');
            }
        } catch (error) {
            console.error("Error in API call:", error);
            addAiMessage(`I apologize, but I'm having trouble connecting to the AI service. Please try again in a moment. Error: ${error.message}`);
        }
    }

    // Initialize quick question buttons
    document.querySelectorAll('.quick-question').forEach(button => {
        button.addEventListener('click', () => {
            input.value = button.textContent;
            sendBtn.click();
        });
    });

    // Tab switching logic
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', async function() {
            // Remove active from all
            document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            
            // Show the selected tab and load its content
            if (this.id === 'chatBtn') {
                document.getElementById('chatTab').style.display = 'block';
            }
            if (this.id === 'productsBtn') {
                document.getElementById('productsTab').style.display = 'block';
                // Clear previous search results
                document.getElementById('product-results').innerHTML = '';
            }
            if (this.id === 'dealsBtn') {
                document.getElementById('dealsTab').style.display = 'block';
                const deals = await fetchDeals();
                renderDeals(deals);
            }
            if (this.id === 'compareBtn') {
                document.getElementById('compareTab').style.display = 'block';
                const comparisonProducts = await fetchProductsForComparison();
                renderComparison(comparisonProducts);
            }
            if (this.id === 'trendsBtn') {
                document.getElementById('trendsTab').style.display = 'block';
                const trendingProducts = await fetchTrendingProducts();
                renderTrends(trendingProducts);
            }
        });
    });

    // Fetch products from Fake Store API with filtering
    async function fetchProducts(category = '', maxPrice = null) {
        try {
            let url = FAKE_STORE_API;
            
            // Add category filter if specified
            if (category) {
                url = `${FAKE_STORE_API}/category/${category.toLowerCase()}`;
                console.log(`Fetching products from URL: ${url}`);
            } else {
                console.log(`Fetching all products from URL: ${url}`);
            }

            const response = await fetch(url);
            if (!response.ok) {
                console.error(`Error: API returned status code ${response.status}`);
                throw new Error('Failed to fetch products');
            }

            let products = await response.json();
            console.log('Fetched products:', products); // Debug log

            // Apply price filter if specified
            if (maxPrice !== null) {
                console.log(`Applying price filter: max_price <= ${maxPrice}`);
                products = products.filter(product => product.price <= maxPrice);
            }

            // Format products to include only required fields and ensure price is a number
            return products.map(product => ({
                id: product.id,
                title: product.title || 'N/A',
                price: parseFloat(product.price) || 0.0,
                image: product.image || '',
                description: product.description || '',
                rating: product.rating || { rate: 0, count: 0 },
                category: product.category || 'uncategorized'
            }));
        } catch (error) {
            console.error('Error fetching products:', error);
            return [];
        }
    }

    // Get unique categories from products
    async function getCategories() {
        try {
            const response = await fetch(`${FAKE_STORE_API}/categories`);
            if (!response.ok) {
                console.error(`Error: API returned status code ${response.status_code}`);
                throw new Error('Failed to fetch categories');
            }
            return await response.json();
        } catch (error) {
            console.error('Error fetching categories:', error);
            return [];
        }
    }

    // Add image viewing functionality
    function createImageModal() {
        const modal = document.createElement('div');
        modal.className = 'image-modal';
        modal.style.display = 'none';
        modal.style.position = 'fixed';
        modal.style.top = '0';
        modal.style.left = '0';
        modal.style.width = '100%';
        modal.style.height = '100%';
        modal.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
        modal.style.zIndex = '1000';
        modal.style.cursor = 'pointer';
        
        const modalContent = document.createElement('div');
        modalContent.style.position = 'relative';
        modalContent.style.width = '100%';
        modalContent.style.height = '100%';
        modalContent.style.display = 'flex';
        modalContent.style.justifyContent = 'center';
        modalContent.style.alignItems = 'center';
        
        const closeBtn = document.createElement('span');
        closeBtn.innerHTML = '&times;';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '15px';
        closeBtn.style.right = '35px';
        closeBtn.style.color = '#f1f1f1';
        closeBtn.style.fontSize = '40px';
        closeBtn.style.fontWeight = 'bold';
        closeBtn.style.cursor = 'pointer';
        
        const modalImage = document.createElement('img');
        modalImage.style.maxWidth = '90%';
        modalImage.style.maxHeight = '90%';
        modalImage.style.objectFit = 'contain';
        
        modalContent.appendChild(closeBtn);
        modalContent.appendChild(modalImage);
        modal.appendChild(modalContent);
        document.body.appendChild(modal);
        
        return { modal, modalImage, closeBtn };
    }

    // Initialize image modal
    const { modal, modalImage, closeBtn } = createImageModal();

    // Add click handlers for the modal
    closeBtn.onclick = () => {
        modal.style.display = 'none';
    };

    modal.onclick = (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    };

    // Update renderProducts function to show prices in INR
    function renderProducts(products) {
        const productsGrid = document.querySelector('.products-grid');
        if (!productsGrid) return;

        if (products.length === 0) {
            productsGrid.innerHTML = '<p class="no-products">No products found matching your criteria.</p>';
            return;
        }

        productsGrid.innerHTML = products.map(product => `
            <div class="product-card">
                <img src="${product.image}" alt="${product.title}" 
                    onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'"
                    style="cursor: pointer; transition: transform 0.2s;"
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                    onclick="showProductImage('${product.image}', '${product.title}')">
                <h4>${product.title}</h4>
                <p class="price">₹${convertToINR(product.price)}</p>
                <p class="rating">Rating: ${product.rating.rate} (${product.rating.count} reviews)</p>
                <button class="view-btn">View Details</button>
            </div>
        `).join('');
    }

    // Update renderDeals function to add image click handlers
    function renderDeals(products) {
        const dealsGrid = document.querySelector('.deals-grid');
        if (!dealsGrid) return;

        // Filter products with rating > 4 for deals
        const deals = products.filter(product => product.rating.rate > 4);
        
        if (deals.length === 0) {
            dealsGrid.innerHTML = '<p class="no-deals">No special deals available at the moment.</p>';
            return;
        }

        dealsGrid.innerHTML = deals.map(product => `
            <div class="deal-card">
                <div class="deal-badge">-${Math.floor(Math.random() * 30 + 10)}%</div>
                <img src="${product.image}" alt="${product.title}" 
                    onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'"
                    style="cursor: pointer; transition: transform 0.2s;"
                    onmouseover="this.style.transform='scale(1.05)'"
                    onmouseout="this.style.transform='scale(1)'"
                    onclick="showProductImage('${product.image}', '${product.title}')">
                <h3>${product.title}</h3>
                <p class="original-price">$${(product.price * 1.2).toFixed(2)}</p>
                <p class="deal-price">$${product.price.toFixed(2)}</p>
                <button class="deal-btn">View Deal</button>
            </div>
        `).join('');
    }

    // Add global function to show product image
    window.showProductImage = function(imageUrl, title) {
        modalImage.src = imageUrl;
        modalImage.alt = title;
        modal.style.display = 'block';
    };

    // Initialize products and deals
    async function initializeProductsAndDeals() {
        try {
            // Get categories and update category buttons
            const categories = await getCategories();
            const categoryContainer = document.querySelector('.product-categories');
            if (categoryContainer) {
                categoryContainer.innerHTML = `
                    <button class="category-btn active">All</button>
                    ${categories.map(category => `
                        <button class="category-btn">${category}</button>
                    `).join('')}
                `;
            }

            // Get products and render them
            const products = await fetchProducts();
            renderProducts(products);
            renderDeals(products);
        } catch (error) {
            console.error('Error initializing products and deals:', error);
        }
    }

    // Initialize everything when DOM is loaded
    document.addEventListener('DOMContentLoaded', () => {
        // Category filter functionality
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', async () => {
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                const category = btn.textContent.toLowerCase();
                const products = await fetchProducts(category === 'all' ? '' : category);
                renderProducts(products);
            });
        });

        // Initialize products and deals
        initializeProductsAndDeals();

        // Product search functionality
        const searchForm = document.getElementById('product-search-form');
        if (searchForm) {
            searchForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const searchInput = document.getElementById('product-search-input');
                const query = searchInput.value.toLowerCase();
                const products = await fetchProducts();
                const filteredProducts = products.filter(product => 
                    product.title.toLowerCase().includes(query) ||
                    product.description.toLowerCase().includes(query)
                );
                renderProducts(filteredProducts);
            });
        }
    });

    function scrollChatToBottom() {
        const chatContainer = document.getElementById('chat-container');
        if (chatContainer) {
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
    }

    // Product and Deal functionality
    document.addEventListener('DOMContentLoaded', () => {
        // Category buttons
        const categoryButtons = document.querySelectorAll('.category-btn');
        categoryButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                categoryButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Add category filtering logic here
            });
        });

        // Deal filter buttons
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                // Add deal filtering logic here
            });
        });

        // Product search form
        const productSearchForm = document.getElementById('product-search-form');
        if (productSearchForm) {
            productSearchForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const query = document.getElementById('product-search-input').value.trim();
                if (query) {
                    const products = await fetchProducts(query.toLowerCase());
                    renderProducts(products);
                }
            });
        }

        // Deal buttons
        const dealButtons = document.querySelectorAll('.deal-btn');
        dealButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                const dealCard = btn.closest('.deal-card');
                const productName = dealCard.querySelector('h3').textContent;
                const dealPrice = dealCard.querySelector('.deal-price').textContent;
                // Add deal click handling logic here
                console.log(`Deal clicked: ${productName} at ${dealPrice}`);
            });
        });
    });

    // Product search using Fake Store API
    async function searchProducts(query) {
        const url = `${FAKE_STORE_API}`;
        try {
            const res = await fetch(url);
            const products = await res.json();
            
            // Filter products based on search query
            const filteredProducts = products.filter(product => 
                product.title.toLowerCase().includes(query.toLowerCase()) ||
                product.description.toLowerCase().includes(query.toLowerCase())
            );
            
            return filteredProducts;
        } catch (err) {
            console.error('Error searching products:', err);
            return [];
        }
    }

    // Deals data
    async function fetchDeals() {
        try {
            const response = await fetch(`${FAKE_STORE_API}?limit=6`);
            const products = await response.json();
            
            // Add discount to products to create deals
            const deals = products.map(product => ({
                ...product,
                discount: Math.floor(Math.random() * 50) + 10, // Random discount between 10-60%
                originalPrice: (product.price * (1 + Math.random() * 0.5)).toFixed(2) // Random original price
            }));
            
            return deals;
        } catch (error) {
            console.error('Error fetching deals:', error);
            return [];
        }
    }

    // Compare data
    async function fetchProductsForComparison() {
        try {
            const response = await fetch(`${FAKE_STORE_API}`);
            const products = await response.json();
            return products.map(product => ({
                id: product.id,
                title: product.title,
                price: product.price,
                image: product.image,
                description: product.description,
                rating: product.rating,
                category: product.category
            }));
        } catch (error) {
            console.error('Error fetching products for comparison:', error);
            return [];
        }
    }

    // Shopping Trends data
    async function fetchTrendingProducts() {
        try {
            const response = await fetch(`${FAKE_STORE_API}`);
            const products = await response.json();
            
            // Calculate trend data based on rating and price
            return products.map(product => ({
                ...product,
                trend: product.rating.rate > 4 ? 'up' : 'down',
                trendPercentage: ((product.rating.rate / 5) * 100).toFixed(1)
            }));
        } catch (error) {
            console.error('Error fetching trending products:', error);
            return [];
        }
    }

    // Update the tab switching logic to use the new functions
    document.querySelectorAll('.menu-item').forEach(btn => {
        btn.addEventListener('click', async function() {
            // Remove active from all
            document.querySelectorAll('.menu-item').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            // Hide all tab contents
            document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');
            
            // Show the selected tab and load its content
            if (this.id === 'chatBtn') {
                document.getElementById('chatTab').style.display = 'block';
            }
            if (this.id === 'productsBtn') {
                document.getElementById('productsTab').style.display = 'block';
                // Clear previous search results
                document.getElementById('product-results').innerHTML = '';
            }
            if (this.id === 'dealsBtn') {
                document.getElementById('dealsTab').style.display = 'block';
                const deals = await fetchDeals();
                renderDeals(deals);
            }
            if (this.id === 'compareBtn') {
                document.getElementById('compareTab').style.display = 'block';
                const comparisonProducts = await fetchProductsForComparison();
                renderComparison(comparisonProducts);
            }
            if (this.id === 'trendsBtn') {
                document.getElementById('trendsTab').style.display = 'block';
                const trendingProducts = await fetchTrendingProducts();
                renderTrends(trendingProducts);
            }
        });
    });

    // Update the product search form event listener
    document.getElementById('product-search-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const query = document.getElementById('product-search-input').value.trim();
        if (query) {
            const products = await searchProducts(query);
            renderProducts(products);
        }
    });

    // Initialize all tabs when DOM is loaded
    document.addEventListener('DOMContentLoaded', async () => {
        // Initialize deals tab
        const deals = await fetchDeals();
        renderDeals(deals);

        // Initialize compare tab
        const comparisonProducts = await fetchProductsForComparison();
        renderComparison(comparisonProducts);

        // Initialize trends tab
        const trendingProducts = await fetchTrendingProducts();
        renderTrends(trendingProducts);

        // Set initial active tab
        document.getElementById('chatBtn').click();
    });

    // Add CSS styles for the chat container
    const style = document.createElement('style');
    style.textContent = `
        .chat-container {
            display: flex;
            flex-direction: column-reverse;
            height: calc(100vh - 200px);
            overflow-y: auto;
            padding: 20px;
        }

        .user-chat-box, .ai-chat-box {
            margin-bottom: 15px;
            display: flex;
            align-items: flex-start;
            gap: 10px;
            opacity: 0;
            transform: translateY(20px);
            animation: fadeInUp 0.3s ease forwards;
        }

        @keyframes fadeInUp {
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .chat-content {
            flex: 1;
            padding: 15px;
            position: relative;
        }

        .user-chat-box .chat-content {
            color: #333;
        }

        .ai-chat-box .chat-content {
            color: #333;
        }

        .chat-meta {
            font-size: 0.8rem;
            color: #666;
            margin-top: 5px;
            opacity: 0.7;
        }

        .avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            background: #f0f0f0;
            transition: transform 0.2s ease;
        }

        .avatar:hover {
            transform: scale(1.1);
        }

        .user-chat-box .avatar {
            background: #e0e0e0;
            color: #333;
        }

        .ai-chat-box .avatar {
            background: #f0f0f0;
            color: #333;
        }

        .ai-chat-content {
            line-height: 1.5;
        }

        .ai-chat-content ul {
            margin: 10px 0;
        }

        .ai-chat-content li {
            margin: 5px 0;
        }

        .product-image-container {
            margin-top: 10px;
            border-radius: 8px;
            overflow: hidden;
            transition: transform 0.2s ease;
        }

        .product-image-container:hover {
            transform: scale(1.02);
        }

        .product-image {
            width: 100%;
            height: auto;
            border-radius: 8px;
        }

        .image-loading {
            padding: 20px;
            text-align: center;
            color: #666;
        }
    `;
    document.head.appendChild(style);

    // Add CSS styles for the sliding sidebar with toggle
    const sidebarStyle = document.createElement('style');
    sidebarStyle.textContent = `
        .sidebar {
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: fixed;
            left: 0;
            top: 0;
            height: 100vh;
            z-index: 1000;
            background: var(--bg-color);
            width: 280px;
            box-shadow: 2px 0 10px rgba(0,0,0,0.1);
            display: flex;
            flex-direction: column;
            transform: translateX(0);
        }
        .sidebar-header {
            padding: 20px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 15px;
            border-bottom: 1px solid rgba(0,0,0,0.1);
            position: relative;
        }
        .logo {
            width: 50px;
            height: 50px;
            border-radius: 12px;
            background: var(--primary-color);
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 24px;
        }
        .sidebar-header h1 {
            font-size: 1.5rem;
            font-weight: 600;
            color: var(--text-color);
            margin: 0;
        }
        .menu-toggle {
            position: absolute;
            right: 20px;
            top: 50%;
            transform: translateY(-50%);
            background: transparent;
            border: none;
            color: var(--text-color);
            cursor: pointer;
            padding: 5px;
            transition: transform 0.3s ease;
        }
        .menu-toggle:hover {
            color: var(--primary-color);
        }
        .menu-toggle.rotated {
            transform: translateY(-50%) rotate(180deg);
        }
        .sidebar-menu {
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            transition: all 0.3s ease;
            overflow: hidden;
        }
        .sidebar-menu.collapsed {
            height: 0;
            padding: 0;
            opacity: 0;
        }
        .menu-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 16px;
            border-radius: 12px;
            border: none;
            background: transparent;
            color: var(--text-color);
            font-size: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;
            white-space: nowrap;
        }
        .menu-item:hover {
            background: rgba(0,0,0,0.05);
        }
        .menu-item.active {
            background: var(--primary-color);
            color: white;
        }
        .menu-item i {
            font-size: 1.2rem;
            width: 24px;
            text-align: center;
        }
        .sidebar.collapsed {
            transform: translateX(-100%);
        }
        .sidebar-toggle {
            position: fixed;
            left: 20px;
            top: 20px;
            z-index: 1001;
            background: var(--primary-color);
            color: white;
            border: none;
            border-radius: 12px;
            width: 40px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            transition: all 0.3s ease;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        }
        .sidebar-toggle:hover {
            transform: scale(1.05);
            background: var(--secondary-color);
        }
        .main-content {
            transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            margin-left: 280px;
            padding: 20px;
        }
        @media (max-width: 768px) {
            .sidebar {
                transform: translateX(-100%);
            }
            .sidebar.expanded {
                transform: translateX(0);
            }
            .main-content {
                margin-left: 0;
            }
            .sidebar-toggle {
                left: 20px;
            }
        }
        /* Dark mode adjustments */
        .dark-mode .sidebar {
            background: var(--dark-bg);
            box-shadow: 2px 0 10px rgba(0,0,0,0.3);
        }
        .dark-mode .menu-item {
            color: var(--dark-text);
        }
        .dark-mode .menu-item:hover {
            background: rgba(255,255,255,0.1);
        }
        .dark-mode .sidebar-header {
            border-bottom-color: rgba(255,255,255,0.1);
        }
        .dark-mode .menu-toggle {
            color: var(--dark-text);
        }
    `;
    document.head.appendChild(sidebarStyle);

    // Restore sidebar toggle functionality
    document.addEventListener('DOMContentLoaded', () => {
        const sidebar = document.querySelector('.sidebar');
        const mainContent = document.querySelector('.main-content');
        const sidebarMenu = document.querySelector('.sidebar-menu');
        
        // Create toggle button for sidebar
        const toggleBtn = document.createElement('button');
        toggleBtn.className = 'sidebar-toggle';
        toggleBtn.innerHTML = '<i class="fas fa-bars"></i>';
        document.body.appendChild(toggleBtn);

        // Create menu toggle button
        const menuToggleBtn = document.createElement('button');
        menuToggleBtn.className = 'menu-toggle';
        menuToggleBtn.innerHTML = '<i class="fas fa-chevron-down"></i>';
        document.querySelector('.sidebar-header').appendChild(menuToggleBtn);

        // Toggle sidebar function
        function toggleSidebar() {
            sidebar.classList.toggle('collapsed');
            const isCollapsed = sidebar.classList.contains('collapsed');
            toggleBtn.innerHTML = isCollapsed ? '<i class="fas fa-bars"></i>' : '<i class="fas fa-times"></i>';
            toggleBtn.style.left = isCollapsed ? '20px' : '300px';
            // Save state to localStorage
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }

        // Toggle menu items function
        function toggleMenu() {
            sidebarMenu.classList.toggle('collapsed');
            menuToggleBtn.classList.toggle('rotated');
            // Save menu state to localStorage
            localStorage.setItem('menuCollapsed', sidebarMenu.classList.contains('collapsed'));
        }

        // Add click events
        toggleBtn.addEventListener('click', toggleSidebar);
        menuToggleBtn.addEventListener('click', toggleMenu);

        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.add('collapsed');
                toggleBtn.style.left = '20px';
            }
        });

        // Initialize sidebar and menu state based on saved preferences
        const savedSidebarState = localStorage.getItem('sidebarCollapsed');
        const savedMenuState = localStorage.getItem('menuCollapsed');
        
        if (savedSidebarState === 'true') {
            sidebar.classList.add('collapsed');
            toggleBtn.style.left = '20px';
        }
        
        if (savedMenuState === 'true') {
            sidebarMenu.classList.add('collapsed');
            menuToggleBtn.classList.add('rotated');
        }

        // Add hover effect to menu items
        const menuItems = document.querySelectorAll('.menu-item');
        menuItems.forEach(item => {
            item.addEventListener('mouseenter', () => {
                if (!item.classList.contains('active')) {
                    item.style.transform = 'translateX(5px)';
                }
            });
            item.addEventListener('mouseleave', () => {
                item.style.transform = 'translateX(0)';
            });
        });
    });

    // Load chat history when the page loads
    loadChatHistory();

    // Add styles for chat controls
    const chatControlsStyle = document.createElement('style');
    chatControlsStyle.textContent = `
        .chat-controls {
            padding: 10px;
            display: flex;
            justify-content: flex-end;
            background: var(--bg-color);
        }

        .clear-chat-btn {
            padding: 8px 16px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: background 0.2s;
        }

        .clear-chat-btn:hover {
            background: #c82333;
        }

        .clear-chat-btn i {
            font-size: 14px;
        }
    `;
    document.head.appendChild(chatControlsStyle);

    // Add styles for better paragraph formatting
    const messageStyle = document.createElement('style');
    messageStyle.textContent = `
        .ai-chat-content p {
            margin: 0 0 1em 0;
            line-height: 1.6;
        }

        .ai-chat-content p:last-child {
            margin-bottom: 0;
        }
    `;
    document.head.appendChild(messageStyle);
});