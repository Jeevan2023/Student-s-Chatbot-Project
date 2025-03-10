document.addEventListener('DOMContentLoaded', () => {
    const chatMessages = document.getElementById('chat-messages');
    const userInput = document.getElementById('user-input');
    const sendButton = document.getElementById('send-button');
    
    // Get the base URL of the current page, but ensure it uses port 5001
    const baseUrl = window.location.protocol + '//' + window.location.hostname + ':5001';
    console.log('Base URL:', baseUrl);

    // Function to add a message to the chat
    function addMessage(message, isUser = false) {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('message');
        messageDiv.classList.add(isUser ? 'user-message' : 'bot-message');

        const messageContent = document.createElement('div');
        messageContent.classList.add('message-content');

        // Check if the message contains structured information
        if (!isUser && (message.includes("Current date and time:") || 
                        message.includes("Knowledge Graph Information:") || 
                        message.includes("Latest Search Results:") || 
                        message.includes("Latest News:") || 
                        message.includes("Information from Wikipedia:"))) {
            
            // Split the message into sections
            const sections = [];
            let currentSection = "";
            let currentTitle = "";
            
            // Split by double newlines to separate sections
            const lines = message.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Check if this is a section header
                if (line.includes("Current date and time:")) {
                    if (currentTitle) {
                        sections.push({ title: currentTitle, content: currentSection });
                    }
                    currentTitle = "time";
                    currentSection = line;
                } else if (line.includes("Knowledge Graph Information:")) {
                    if (currentTitle) {
                        sections.push({ title: currentTitle, content: currentSection });
                    }
                    currentTitle = "knowledge";
                    currentSection = line;
                } else if (line.includes("Latest Search Results:")) {
                    if (currentTitle) {
                        sections.push({ title: currentTitle, content: currentSection });
                    }
                    currentTitle = "search";
                    currentSection = line;
                } else if (line.includes("Latest News:")) {
                    if (currentTitle) {
                        sections.push({ title: currentTitle, content: currentSection });
                    }
                    currentTitle = "news";
                    currentSection = line;
                } else if (line.includes("Information from Wikipedia:")) {
                    if (currentTitle) {
                        sections.push({ title: currentTitle, content: currentSection });
                    }
                    currentTitle = "wiki";
                    currentSection = line;
                } else if (line.includes("For the most up-to-date information")) {
                    if (currentTitle) {
                        sections.push({ title: currentTitle, content: currentSection });
                    }
                    currentTitle = "links";
                    currentSection = line;
                } else {
                    currentSection += '\n' + line;
                }
            }
            
            // Add the last section
            if (currentTitle) {
                sections.push({ title: currentTitle, content: currentSection });
            }
            
            // Process each section
            sections.forEach(section => {
                if (section.title === "time") {
                    const timeDiv = document.createElement('div');
                    timeDiv.classList.add('current-time');
                    timeDiv.innerHTML = `<strong>🕒 ${section.content.trim()}</strong>`;
                    messageContent.appendChild(timeDiv);
                } else if (section.title === "knowledge") {
                    const knowledgeDiv = document.createElement('div');
                    knowledgeDiv.classList.add('knowledge-graph');
                    
                    const knowledgeHeader = document.createElement('p');
                    knowledgeHeader.innerHTML = '<strong>📊 Knowledge Graph:</strong>';
                    knowledgeDiv.appendChild(knowledgeHeader);
                    
                    const knowledgeContent = document.createElement('div');
                    knowledgeContent.classList.add('knowledge-content');
                    
                    // Format the knowledge graph content
                    const lines = section.content.split('\n');
                    lines.forEach((line, index) => {
                        if (index > 0 && line.trim()) { // Skip the header line
                            const p = document.createElement('p');
                            p.textContent = line.trim();
                            knowledgeContent.appendChild(p);
                        }
                    });
                    
                    knowledgeDiv.appendChild(knowledgeContent);
                    messageContent.appendChild(knowledgeDiv);
                } else if (section.title === "search") {
                    const searchDiv = document.createElement('div');
                    searchDiv.classList.add('search-results');
                    
                    const searchHeader = document.createElement('p');
                    searchHeader.innerHTML = '<strong>🔍 Latest Search Results:</strong>';
                    searchDiv.appendChild(searchHeader);
                    
                    const searchList = document.createElement('ul');
                    
                    // Format the search results
                    const lines = section.content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.startsWith('-') && index > 0) { // Skip the header line
                            const li = document.createElement('li');
                            li.textContent = line.substring(1).trim();
                            searchList.appendChild(li);
                        }
                    });
                    
                    searchDiv.appendChild(searchList);
                    messageContent.appendChild(searchDiv);
                } else if (section.title === "news") {
                    const newsDiv = document.createElement('div');
                    newsDiv.classList.add('news-results');
                    
                    const newsHeader = document.createElement('p');
                    newsHeader.innerHTML = '<strong>📰 Latest News:</strong>';
                    newsDiv.appendChild(newsHeader);
                    
                    const newsList = document.createElement('ul');
                    
                    // Format the news results
                    const lines = section.content.split('\n');
                    lines.forEach((line, index) => {
                        if (line.startsWith('-') && index > 0) { // Skip the header line
                            const li = document.createElement('li');
                            li.textContent = line.substring(1).trim();
                            newsList.appendChild(li);
                        }
                    });
                    
                    newsDiv.appendChild(newsList);
                    messageContent.appendChild(newsDiv);
                } else if (section.title === "wiki") {
                    const wikiDiv = document.createElement('div');
                    wikiDiv.classList.add('wiki-info');
                    
                    const wikiHeader = document.createElement('p');
                    wikiHeader.innerHTML = '<strong>📚 Wikipedia Information:</strong>';
                    wikiDiv.appendChild(wikiHeader);
                    
                    const wikiContent = document.createElement('p');
                    wikiContent.textContent = section.content.replace("Information from Wikipedia:", "").trim();
                    wikiDiv.appendChild(wikiContent);
                    
                    messageContent.appendChild(wikiDiv);
                } else if (section.title === "links") {
                    const linksDiv = document.createElement('div');
                    linksDiv.classList.add('search-links');
                    
                    const linksHeader = document.createElement('p');
                    linksHeader.innerHTML = '<strong>🔗 Search Resources:</strong>';
                    linksDiv.appendChild(linksHeader);
                    
                    // Convert links to clickable HTML
                    const linkLines = section.content.split('\n');
                    
                    const linksList = document.createElement('ul');
                    linkLines.forEach(line => {
                        if (line.includes('http')) {
                            const listItem = document.createElement('li');
                            // Extract the link text and URL
                            const linkMatch = line.match(/- (.*?): (https:\/\/.*)/);
                            if (linkMatch && linkMatch.length >= 3) {
                                const linkText = linkMatch[1];
                                const linkUrl = linkMatch[2];
                                listItem.innerHTML = `<a href="${linkUrl}" target="_blank">${linkText}</a>`;
                                linksList.appendChild(listItem);
                            } else {
                                listItem.textContent = line;
                                linksList.appendChild(listItem);
                            }
                        }
                    });
                    
                    linksDiv.appendChild(linksList);
                    messageContent.appendChild(linksDiv);
                }
            });
        } else {
            // Regular message
            const messageParagraph = document.createElement('p');
            messageParagraph.textContent = message;
            messageContent.appendChild(messageParagraph);
        }

        messageDiv.appendChild(messageContent);
        chatMessages.appendChild(messageDiv);

        // Scroll to the bottom of the chat
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to show typing indicator
    function showTypingIndicator() {
        const typingDiv = document.createElement('div');
        typingDiv.classList.add('typing-indicator');
        typingDiv.id = 'typing-indicator';

        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            typingDiv.appendChild(dot);
        }

        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    // Function to remove typing indicator
    function removeTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    // Function to send message to the backend
    async function sendMessage(message) {
        try {
            showTypingIndicator();
            
            // Check if the message might need current information
            const needsCurrentInfo = /latest|current|recent|news|today|update|now|2023|2024|this year|this month|this week/i.test(message);
            
            // If it needs current info, show a searching message
            if (needsCurrentInfo) {
                const searchingDiv = document.createElement('div');
                searchingDiv.id = 'searching-indicator';
                searchingDiv.classList.add('searching-indicator');
                searchingDiv.innerHTML = '<i class="fas fa-search"></i> Searching for up-to-date information...';
                chatMessages.appendChild(searchingDiv);
                chatMessages.scrollTop = chatMessages.scrollHeight;
            }
            
            console.log('Sending message to API:', message);
            const apiUrl = `${baseUrl}/api/chat`;
            console.log('API URL:', apiUrl);
            
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ message }),
            });

            console.log('Response status:', response.status);
            
            // Remove searching indicator if it exists
            const searchingIndicator = document.getElementById('searching-indicator');
            if (searchingIndicator) {
                searchingIndicator.remove();
            }
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error response:', errorText);
                throw new Error(`Server responded with status ${response.status}: ${errorText}`);
            }

            const data = await response.json();
            console.log('Response data:', data);
            
            removeTypingIndicator();
            
            if (data.error) {
                addMessage(`Error from server: ${data.error}`, false);
            } else {
                addMessage(data.response, false);
            }
        } catch (error) {
            console.error('Error in sendMessage:', error);
            removeTypingIndicator();
            
            // Remove searching indicator if it exists
            const searchingIndicator = document.getElementById('searching-indicator');
            if (searchingIndicator) {
                searchingIndicator.remove();
            }
            
            addMessage(`Sorry, there was an error: ${error.message}`, false);
        }
    }

    // Event listener for send button
    sendButton.addEventListener('click', () => {
        const message = userInput.value.trim();
        if (message) {
            addMessage(message, true);
            userInput.value = '';
            sendMessage(message);
        }
    });

    // Event listener for Enter key
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            const message = userInput.value.trim();
            if (message) {
                addMessage(message, true);
                userInput.value = '';
                sendMessage(message);
            }
        }
    });

    // Focus the input field when the page loads
    userInput.focus();
}); 