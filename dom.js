import { agent } from './index.js'

export function renderNewMessage(text, role) {
    const conversationContainer = document.getElementById("conversation")
    const newArticle = document.createElement("article")
    newArticle.classList.add(role === "assistant" ? "ai-message" : "user-message")
    const newParagraph = document.createElement("p")
    newParagraph.textContent = text
    newArticle.append(newParagraph)
    conversationContainer.append(newArticle)
    scrollToBottom()
}

function scrollToBottom() {
    requestAnimationFrame(() => {
        document.body.scrollIntoView({ behavior: "smooth", block: "end" })
    });
}

// Add loading indicator
function setLoading(isLoading) {
    const button = document.querySelector('#chat-form button');
    const input = document.getElementById('user-input');
    
    button.disabled = isLoading;
    input.disabled = isLoading;
    button.textContent = isLoading ? 'Waiting...' : 'Send';
}

document.getElementById('chat-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = document.getElementById('user-input');
    const userInput = input.value.trim();
    
    if (userInput) {
        try {
            setLoading(true);
            await agent(userInput);
            input.value = ''; // Clear input after sending
        } catch (error) {
            console.error('Error processing message:', error);
            renderNewMessage("Sorry, there was an error processing your message. Please try again in a moment.", "assistant");
        } finally {
            setLoading(false);
        }
    }
});