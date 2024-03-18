const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const fs = require("fs");

app.use(bodyParser.json());
app.use(cors());

// const OpenAI = require("openai");

// const openai = new OpenAI({ apiKey: process.env.OPEN_AI_SECRET_KEY });

app.post("/generate_questions", async (req, res) => {
  const jobDescription = req.body.jobDescription;
  try {
    const prompt = `You are the interviewr for a position at a company. You are interviewing a candidate who applies for the following job description: ${jobDescription}. You are tasked with coming up with an questions to ask the candidate. The question should be open-ended and should help you understand the candidate's experience and skills. The questions should also help you understand the candidate's problem-solving abilities and how they would fit into the company's culture. The questions should be relevant to the job description and should help you understand the candidate's experience and skills. Note : return an array of those 10 questions.`;
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an interviewr." },
        {
          role: "user",
          content: prompt,
        },
        {
          role: "assistant",
          content:
            "Provide an example of a challenging software development project you worked on and how you overcame obstacles to successfully complete it?",
        },
        {
          role: "user",
          content:
            "What is the question you would ask the interviewee? even question on the technologies, technical words, etc for a one-two minute response (make the question short and effective and don;t wrap the question with quotes).",
        },
      ],
      model: "gpt-3.5-turbo",
    });
    return res.json({
      question: completion.choices[0].message.content,
      question_id: uuidv4(),
    });
  } catch (e) {
    console.log(e);
    res.send({ error: e });
  }
});

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + ".mp4");
  },
});

const upload = multer({ storage });

async function generate_feedback(question, transcription) {
  try {
    const prompt = `You are the interviewr for a position at a company. You are interviewing a candidate whose response to the following question: ${question}. is as follows: ${transcription}. you are tasked with providing feedback on the candidate's response. The feedback should be constructive and should help the candidate understand how they can improve their response. The feedback should also help the candidate understand how they can improve their problem-solving abilities and how they would fit into the company's culture. The feedback should be relevant to the user response with the question and should help the candidate understand how they can improve their experience and skills.`;
    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: "You are an interviewr." },
        {
          role: "user",
          content: prompt,
        },
      ],
      model: "gpt-3.5-turbo",
    });
    return completion.choices[0].message.content;
  } catch (e) {
    console.log(e);
  }
}

app.post("/generate_response", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const transcription = await openai.audio.transcriptions.create({
      file: fs.createReadStream(req.file.path),
      model: "whisper-1",
      response_format: "text",
    });

    const feedback = await generate_feedback(req.body.question, transcription);
    res.json({ transcription, feedback });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error during transcription" });
  }
});

app.listen(8001 || process.env.PORT);
