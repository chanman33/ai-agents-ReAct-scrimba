import OpenAI from "openai"
import { getCurrentWeather, getLocation } from "./tools"
import { renderNewMessage } from "./dom"
import { rateLimiter } from "./rateLimiter"


// Configuration
const OPENAI_CONFIG = {
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
}


const SYSTEM_PROMPT = `You are a helpful AI agent. Give highly specific answers based on the information you're provided. 
Prefer to gather information with the tools provided to you rather than giving basic, generic answers.`

const MODEL_CONFIG = {
    model: "gpt-3.5-turbo",
    temperature: 0.7, // Added for more controlled responses
    max_tokens: 500 // Added to limit response length
}

// Initialize OpenAI client
export const openai = new OpenAI(OPENAI_CONFIG)

// Available function definitions with metadata
const AVAILABLE_TOOLS = [
    {
        type: "function",
        function: {
            name: "getCurrentWeather",
            description: "Get the current weather for a location",
            parameters: {
                type: "object",
                properties: {
                    location: {
                        type: "string",
                        description: "The location to get weather for"
                    },
                    unit: {
                        type: "string",
                        enum: ["celsius", "fahrenheit"],
                        description: "Temperature unit to return (celsius or fahrenheit)"
                    }
                },
                required: ["location"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "getLocation",
            description: "Get the user's current location",
            parameters: {
                type: "object",
                properties: {}
            }
        }
    }
]

// Function mapping
const functionMap = {
    getCurrentWeather,
    getLocation
}

// Initialize messages array outside the agent function to maintain context
const messages = [
    { role: "system", content: SYSTEM_PROMPT }
];

// Add query constant
const USER_QUERY = "What's the current weather like in my location? Please suggest some activities."

/**
 * Processes a user query using the OpenAI agent
 * @param {string} query - The user's input query
 * @returns {Promise<string>} The agent's final response
 */
async function agent(query) {
    try {
        // Add user message to existing messages array
        messages.push({ role: "user", content: query })
        renderNewMessage(query, "user")
        
        const MAX_ITERATIONS = 5
        let finalResponse = null
        
        for (let i = 0; i < MAX_ITERATIONS; i++) {
            console.log(`Iteration #${i + 1}`)
            
            // Wait for rate limiter before making API call
            await rateLimiter.waitForToken()
            
            const response = await openai.chat.completions.create({
                ...MODEL_CONFIG,
                messages,
                tools: AVAILABLE_TOOLS
            })

            const message = response.choices[0].message
            messages.push(message)

            // Handle function calls if present
            if (message.tool_calls) {
                const toolResults = await Promise.all(
                    message.tool_calls.map(async (toolCall) => {
                        const functionName = toolCall.function.name
                        const functionArgs = JSON.parse(toolCall.function.arguments)
                        const result = await functionMap[functionName](functionArgs)
                        return {
                            tool_call_id: toolCall.id,
                            role: "tool",
                            content: JSON.stringify(result)
                        }
                    })
                )
                messages.push(...toolResults)
                continue
            }

            // If no function calls, we have our final response
            finalResponse = message.content
            renderNewMessage(finalResponse, "assistant")
            break
        }

        return finalResponse || "Maximum iterations reached without a final response"
    } catch (error) {
        console.error("Error in agent function:", error)
        renderNewMessage("An error occurred while processing your request. Please try again in a moment.", "assistant")
        throw new Error(`Failed to process query: ${error.message}`)
    }
}

// Export the agent function only
export { agent }
