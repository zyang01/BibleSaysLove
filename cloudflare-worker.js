export default {
  async fetch(request, env) {
    if (request.method === "OPTIONS") {
      // Handle CORS preflight requests
      const corsHeaders = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET,HEAD,POST,OPTIONS",
        "Access-Control-Max-Age": "86400",
      };

      if (
        request.headers.get("Origin") !== null &&
        request.headers.get("Access-Control-Request-Method") !== null &&
        request.headers.get("Access-Control-Request-Headers") !== null
      ) {
        // Handle CORS preflight requests.
        return new Response(null, {
          headers: {
            ...corsHeaders,
            "Access-Control-Allow-Headers": request.headers.get(
              "Access-Control-Request-Headers"
            ),
          },
        });
      } else {
        // Handle standard OPTIONS request.
        return new Response(null, {
          headers: {
            Allow: "GET, HEAD, POST, OPTIONS",
          },
        });
      }
    }

    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({ error: "Only POST requests are allowed." }),
        {
          status: 405,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    try {
      // Retrieve parameters from worker environment configs
      const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";
      const OPENAI_API_KEY = env.OPENAI_API_KEY;
      const OPENAI_API_MODEL = env.OPENAI_API_MODEL;
      const MAX_WORD_COUNT = env.MAX_WORD_COUNT || 15;

      if (!OPENAI_API_KEY) {
        return new Response(
          JSON.stringify({ error: "OpenAI API key is not configured." }),
          {
            status: 500,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Parse the incoming request JSON body
      const { message, cn } = await request.json();

      if (!message) {
        return new Response(
          JSON.stringify({ error: "The 'message' field is required." }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Check if the message contains the allowed number of words or less
      const wordCount = message.split(/\s+/).length;
      if (wordCount > MAX_WORD_COUNT) {
        return new Response(
          JSON.stringify({
            error: `The 'message' field must contain ${MAX_WORD_COUNT} words or less.`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Create the payload for the OpenAI API
      const openAiPayload = {
        model: OPENAI_API_MODEL,
        messages: [
          {
            role: "user",
            content: cn
              ? `圣经怎么说${message}`
              : `what does the Bible say about ${message}`,
          },
        ],
      };

      // Forward the request to the OpenAI API
      const openAiResponse = await fetch(OPENAI_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify(openAiPayload),
      });

      // Handle the OpenAI API response
      const openAiData = await openAiResponse.json();

      if (!openAiResponse.ok) {
        return new Response(
          JSON.stringify({
            error: openAiData.error || "OpenAI API request failed.",
          }),
          {
            status: openAiResponse.status,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Extract and return only the message content from the OpenAI response
      const content = openAiData.choices?.[0]?.message?.content || "";
      return new Response(JSON.stringify({ content }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: error.message || "An unexpected error occurred.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
  },
};
