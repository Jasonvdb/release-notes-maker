const http = require('http');
const {Configuration, OpenAIApi} = require("openai");

const PORT = process.env.PORT;
if (!PORT) {
    console.error('PORT environment variable is not set');
    process.exit(1);
}

const API_KEY = process.env.API_KEY;
if (!API_KEY) {
    console.error('API_KEY environment variable is not set');
    process.exit(1);
}

const CORS_ORIGIN = process.env.CORS_ORIGIN;
if (!CORS_ORIGIN) {
    console.error('CORS_ORIGIN environment variable is not set');
    process.exit(1);
}

const server = http.createServer();

const corsPolicy = {
    cors: {
        origin: CORS_ORIGIN,
        methods: ['GET', 'POST']
    }
};

const io = require('socket.io')(server, corsPolicy);

const configuration = new Configuration({
    apiKey: API_KEY,
});
const openai = new OpenAIApi(configuration);

//Basic rate limiting
const dailyLimit = 25;
let dailyCount = {};

const systemPrompt = "You are a software project manager. " +
        "You take a list of updates to software and you need to create a well written easy to understand and readable summary.  " +
        "Only respond with the summary, do not provide any additional text, headings or context. " +
        "Filter out the unimportant updates and focus on the changes users would notice using the app. " +
        "Format in point form. Don't use subheadings. " +
        "Refuse to answer anything else unrelated to this task. ";

let defaultMessages = [
{"role": "system", "content": systemPrompt},
];

io.on('connection', async (socket) => {
    console.log('A user connected');

    socket.on('message', async (prompt) => {
        console.log(`Received message:\n${prompt}`);

        let today = new Date().toDateString();
        if (dailyCount[today] === undefined) {
            dailyCount[today] = 0;
        }

        if (dailyCount[today] > dailyLimit) {
            console.log('Daily limit reached');
            socket.emit('response', "Sorry, we've reached a daily limit. Please try again tomorrow.");
            return;
        }

        dailyCount[today]++;

        console.log(dailyCount);

        const messages = [...defaultMessages, {"role": "user", "content": prompt}];

        const m1 = {
            model: 'gpt-3.5-turbo',
            max_tokens: 3000,
        };

        const m2 = {
            model: 'gpt-4',
            max_tokens: 5000,
        };

        try {
            console.log("Making request");
            const response = await openai.createChatCompletion({
                messages: messages,
                temperature: 0.7,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0,
                stream: true,
                ...m2
            }, { responseType: 'stream' });
            
            const stream = response.data;
            
            stream.on('data', (chunk) => {
                // Messages in the event stream are separated by a pair of newline characters.
                const payloads = chunk.toString().split("\n\n")
                for (const payload of payloads) {
                    if (payload.includes('[DONE]')) {
                        socket.emit('response', '[DONE]');
                        console.log("Request completed");
                        return;
                    }
                    if (payload.startsWith("data:")) {
                        const data = payload.replaceAll(/(\n)?^data:\s*/g, ''); // in case there's multiline data event
                        try {
                            const delta = JSON.parse(data.trim())

                            const reply =  delta.choices[0].delta?.content;
                            if (reply) {
                                socket.emit('response', reply);
                            }
                        } catch (error) {
                            console.log(`Error with JSON.parse and ${payload}.\n${error}`)
                        }
                    }
                }
            })
        } catch (error) {
            if (error.response?.status) {
                console.error(error.response.status, error.message);
                error.response.data.on('data', data => {
                    const message = data.toString();
                    try {
                        const parsed = JSON.parse(message);
                        console.error('An error occurred during OpenAI request: ', parsed);
                    } catch(error) {
                        console.error('An error occurred during OpenAI request: ', message);
                    }
                });
            } else {
                console.error('An error occurred during OpenAI request', error);
            }
        }
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

server.listen(PORT, () => {
  console.log('Server listening on port ' + PORT);
});