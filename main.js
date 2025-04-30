import {GoogleGenerativeAI, HarmBlockThreshold, HarmCategory} from '@google/generative-ai'
import Base64 from 'base64-js'
// MarkdownIt is no longer needed as we'll handle raw JSON
// import MarkdownIt from 'markdown-it'
import {maybeShowApiKeyBanner} from './gemini-api-banner'
import './style.css'

// 🔥🔥 FILL THIS OUT FIRST! 🔥🔥
// Get your Gemini API key by:
// - Selecting "Add Gemini API" in the "Firebase Studio" panel in the sidebar
// - Or by visiting https://g.co/ai/idxGetGeminiKey
let API_KEY = '' // Replace with your actual API key

let form = document.querySelector('form')
let promptInput = document.querySelector('input[name="prompt"]')
let output = document.querySelector('.output') // Ensure this element exists in your HTML

form.onsubmit = async ev => {
  ev.preventDefault()
  output.textContent = 'Generating...'
  output.style.display = 'block'; // Make sure the output area is visible

  try {
    // Define the system instruction
    const systemInstruction = {
        role: 'system',
        content: '자연어 견적 설명에서 항목별로 품목, 수량(기본 1), 단가(원 단위)를 추출해서 JSON 배열로 응답해줘', // Added instruction for JSON only
      };

    // Assemble the prompt contents (user role only)
    let contents = [
      {
        role: 'user',
        parts: [
          {text: promptInput.value},
        ],
      },
    ]

    // Call the multimodal model, and get a stream of results
    const genAI = new GoogleGenerativeAI(API_KEY)
    const model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      // Pass the system instruction here
      systemInstruction: systemInstruction.content,
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
          threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        },
      ],
       responseMimeType: "application/json", // Request JSON output directly
    })

    // Generate content (use generateContent for potentially non-streaming JSON)
    // const result = await model.generateContentStream({contents}) // Use generateContent for single JSON response
    const result = await model.generateContent({contents});
    const response = await result.response;
    const text = response.text();


    // Directly set the raw text content (should be JSON)
    output.textContent = text;

     // Attempt to parse the JSON immediately to validate
     try {
        JSON.parse(text);
        console.log("Valid JSON received from API.");
     } catch (jsonError) {
        console.error("Received text is not valid JSON:", jsonError);
        output.textContent = `Error: Received non-JSON response from API.
${text}`;
     }


    /* // Original streaming code - keep for reference or if switching back
    // Read from the stream and set the output as raw text
    let buffer = []
    for await (let response of result.stream) {
      buffer.push(response.text())
    }
    // Clean up potential markdown formatting (like ```json ... ```)
    let rawJson = buffer.join('');
    if (rawJson.startsWith('```json')) {
        rawJson = rawJson.substring(7, rawJson.length - 3).trim();
    } else if (rawJson.startsWith('```')) {
         rawJson = rawJson.substring(3, rawJson.length - 3).trim();
    } else {
      // Assume it's already plain JSON or handle other cases
      rawJson = rawJson.trim();
    }
    output.textContent = rawJson; // Use textContent to avoid HTML interpretation
    */

  } catch (e) {
    output.textContent = 'Error: ' + e // Display error directly
    // Also log the error to the console for more details
    console.error("API Call Error:", e);
  }
}

// You can delete this once you've filled out an API key
maybeShowApiKeyBanner(API_KEY)
