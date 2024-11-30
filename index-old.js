import OpenAI from "openai"
import { getCurrentWeather, getLocation } from "./tools"

export const openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true
})

/**
 * Goal - build an agent that can get the current weather at my current location
 * and give me some localized ideas of activities I can do.
 */

/**
 PLAN:
 1. Design a well-written ReAct prompt
 2. Build a loop for my agent to run in.
 3. Parse any actions that the LLM determines are necessary
 4. End condition - final Answer is given
 
 */

 const availableFunctions = {
    getCurrentWeather,
    getLocation
}

const systemPrompt = `
You cycle through Thought, Action, PAUSE, Observation. At the end of the loop you output a final Answer. Your final answer should be highly specific to the observations you have from running
the actions.
1. Thought: Describe your thoughts about the question you have been asked.
2. Action: run one of the actions available to you - then return PAUSE.
3. PAUSE
4. Observation: will be the result of running those actions.

Available actions:
- getCurrentWeather: 
    E.g. getCurrentWeather: Salt Lake City
    Returns the current weather of the location specified.
- getLocation:
    E.g. getLocation: null
    Returns user's location details. No arguments needed.

Example session:
Question: Please give me some ideas for activities to do this afternoon.
Thought: I should look up the user's location so I can give location-specific activity ideas.
Action: getLocation: null
PAUSE

You will be called again with something like this:
Observation: "New York City, NY"

Then you loop again:
Thought: To get even more specific activity ideas, I should get the current weather at the user's location.
Action: getCurrentWeather: New York City
PAUSE

You'll then be called again with something like this:
Observation: { location: "New York City, NY", forecast: ["sunny"] }

You then output:
Answer: <Suggested activities based on sunny weather that are highly specific to New York City and surrounding areas.>
`

async function agent(query) {
    const messages = [
        { role: "system", content: systemPrompt },
        { role: "user", content: query }
    ]
    
    const MAX_ITERATIONS = 5  // Prevent infinite loops
    const actionRegex = /^Action: (\w+): (.*)$/ // Regex to match the action and its argument
    
    for (let i = 0; i < MAX_ITERATIONS; i++) {
        try {
            console.log(`Iteration #${i + 1}`)
            
            // 1. Get AI Response
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages
            })

            const responseText = response.choices[0].message.content
            console.log("AI Response:", responseText)
            messages.push({ role: "assistant", content: responseText }) // Add the AI's response to the message history
            
            // 2. Parse Response for Actions
            const responseLines = responseText.split("\n")
            const foundActionStr = responseLines.find(str => actionRegex.test(str))
            
            // If no action is found, assume we're done and return the response
            if (!foundActionStr) {
                console.log("Agent finished with task")
                return responseText
            }
            
            // 3. Execute Action
            const actions = actionRegex.exec(foundActionStr)
            if (!actions) {
                throw new Error("Failed to parse action string")
            }
            
            const [_, action, actionArg] = actions
            
            // Validate action exists
            if (!availableFunctions.hasOwnProperty(action)) {
                throw new Error(`Unknown action: ${action}`)
            }
            
            console.log(`Executing: ${action} with argument: ${actionArg}`)
            const observation = await availableFunctions[action](actionArg)
            
            // 4. Add observation to message history
            messages.push({ 
                role: "assistant", 
                content: `Observation: ${JSON.stringify(observation)}`
            })
            
        } catch (error) {
            console.error("Error in agent loop:", error)
            return `Error: ${error.message}`
        }
    }
    
    return "Max iterations reached without completion"
}

// Test the agent
async function testAgent() {
    try {
        const query = "What are some activity ideas that I can do this afternoon based on my location and weather?"
        console.log("Query:", query)
        const result = await agent(query)
        console.log("Final Result:", result)
    } catch (error) {
        console.error("Test failed:", error)
    }
}

// Run the test
testAgent()

