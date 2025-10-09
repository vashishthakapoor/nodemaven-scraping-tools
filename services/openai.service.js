const OpenAI = require('openai');

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Summarize transcript using OpenAI with streaming
async function summarizeTranscript(transcript, res) {
    try {
        console.log("Starting OpenAI summarization with streaming...");
        console.log(`Transcript length: ${transcript.length} characters`);
        
        // Create the completion with streaming
        const stream = await openai.chat.completions.create({
            model: "gpt-4o-mini", // Using the latest cost-effective model
            messages: [
                {
                    role: "system",
                    content: "You are an expert at summarizing transcripts. Create concise, well-structured summaries that capture the key points and main ideas. Format your response with clear sections: Overview, Key Points (as bullet points), and Conclusion."
                },
                {
                    role: "user",
                    content: `Please summarize the following transcript:\n\n${transcript}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000,
            stream: true
        });
        
        // Stream the response
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
                res.write(`data: ${JSON.stringify({ type: 'summary', content })}\n\n`);
            }
        }
        
        console.log("Summary streamed successfully");
        
    } catch (error) {
        console.error("Error generating summary:", error.message);
        
        // Handle specific OpenAI errors
        if (error.status === 401) {
            throw new Error("Invalid OpenAI API key. Please check your configuration.");
        } else if (error.status === 429) {
            throw new Error("OpenAI API rate limit exceeded. Please try again later.");
        } else if (error.status === 500) {
            throw new Error("OpenAI service error. Please try again later.");
        } else {
            throw new Error(`Failed to generate summary: ${error.message}`);
        }
    }
}

module.exports = {
    summarizeTranscript
};
