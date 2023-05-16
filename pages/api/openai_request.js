const chatGptRequest = async (
  mainMessageList,
  token,
  stream,
  maxTokens = 30
) => {
  const headers = { Authorization: `Bearer ${token}` };
  let stop = stream ? "." : null;
  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: mainMessageList,
        max_tokens: maxTokens,
        temperature: 0,
        stop: stop,
        top_p: 1,
        stream: stream,
      }),
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*"); // or the specific origin you want to allow
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }
  const { mainMessageList, stream, maxTokens } = req.body;

  if (req.method === "POST") {
    console.log("\n");
    console.log("PASSED Variables:");
    console.log("mainMessageList: ", mainMessageList);
    console.log("stream: ", stream);
    console.log("maxTokens: ", maxTokens);
    console.log("\n");
    console.log(process.env.OPENAI_API_KEY);
    console.log("\n");

    try {
      const response = await chatGptRequest(
        mainMessageList,
        process.env.OPENAI_API_KEY,
        stream,
        maxTokens
      );

      if (stream) {
        // Set up SSE headers
        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");
        res.setHeader("Connection", "keep-alive");
        res.flushHeaders();

        // Get a reader from the response body
        const reader = response.body.getReader();
        let textDecoder = new TextDecoder("utf-8");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Decode and send chunks to the client
          const decodedChunk = textDecoder.decode(value);
          const lines = decodedChunk.split("\n");
          const parsedLines = lines
            .map((line) => line.replace(/^data: /, "").trim())
            .filter((line) => line !== "" && line !== "[DONE]")
            .map((line) => JSON.parse(line));
          parsedLines.forEach((parsedLine) => {
            const content = parsedLine.choices[0].delta.content;
            if (content) {
              res.write(content);
            }
          });
        }

        // Close the connection when done
        res.end();
      } else {
        const data = await response.json();
        res.status(200).json(data);
      }
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  } else {
    res.status(400).json({ error: "Wrong request method" });
  }
}
