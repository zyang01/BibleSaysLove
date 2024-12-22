const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Allow-Methods": "OPTIONS,POST",
};

export const handler = async (event) => {
  try {
    // Respond to CORS preflight request
    if (event?.requestContext?.http?.method === "OPTIONS") {
      return {
        statusCode: 204,
        headers,
      };
    }

    // Forward the request
    const response = await fetch("https://biblesays.love/api", {
      method: "POST",
      headers,
      body: event.body,
    });

    // Return the response
    return {
      statusCode: response.status,
      headers,
      body: await response.text(),
    };
  } catch (error) {
    console.error("Error forwarding request:", error);

    return {
      statusCode: error.response ? error.response.status : 500,
      headers,
      body: JSON.stringify({
        message: "Error forwarding request",
        error: error.message,
      }),
    };
  }
};
