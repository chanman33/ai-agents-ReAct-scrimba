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


const weather = await getCurrentWeather()
const location = await getLocation()

const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo",
    messages: [
        {
            role: "user",
            content: `Give me a list of activity ideas based on my current location of ${location} and weather of ${weather}`
        }
    ]
})

console.log(response.choices[0].message.content)
// As an AI, I'm unable to access your current location or weather details...