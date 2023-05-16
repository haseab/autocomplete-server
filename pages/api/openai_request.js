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
      res.status(200).json({ response });
    } catch (error) {
      console.log(error);
      res.status(500).json({ error });
    }
  } else {
    res.status(400).json({ error: "Wrong request method" });
  }
}
