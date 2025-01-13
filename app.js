const express = require("express");
const nodeloggerg = require("nodeloggerg");
const path = require("path");
const axios = require("axios");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const logger = new nodeloggerg({
  startWebServer: true,
  logFile: "logs.txt",
});

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info("Connected to MongoDB");
  })
  .catch((error) => {
    logger.error("Failed to connect to MongoDB: " + error);
  });

const skillShema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  content: {
    type: String,
    required: true,
  },
});

const Skill = mongoose.model("Skill", skillShema);

app.use(async (req, res, next) => {
  const urlParams = new URLSearchParams(req.originalUrl.split("?")[1] || "");

  const analyticsData = {
    utm_source: urlParams.get("utm_source") || null,
    utm_medium: urlParams.get("utm_medium") || null,
    utm_campaign: urlParams.get("utm_campaign") || null,
    utm_term: urlParams.get("utm_term") || null,
    utm_content: urlParams.get("utm_content") || null,
    ip: req.ip, // Capture IP address
    userAgent: req.headers["user-agent"], // Capture user agent
    timestamp: new Date(), // Add timestamp
    path: req.path, // Track the path being visited
  };

  logger.info("Received analytics data:" + analyticsData);

  next();
});

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

async function fetchGitHubRepos(username) {
  let allRepos = [];
  let page = 1;
  const perPage = 100; // Maximum allowed by GitHub API

  while (true) {
    try {
      const response = await axios.get(
        `https://api.github.com/users/${username}/repos`,
        {
          params: {
            per_page: perPage,
            page: page,
          },
        }
      );

      const repos = response.data;
      allRepos = allRepos.concat(repos);

      if (repos.length < perPage) {
        // We've reached the last page
        break;
      }

      page++;
    } catch (error) {
      logger.error("Error fetching GitHub repos:" + error);
      break;
    }
  }

  return allRepos;
}

app.use((req, res, next) => {
  logger.info(`Received ${req.method} request at ${req.url}`);
  next();
});

app.get("/", async (req, res) => {
  const username = "Grizak";
  const repos = await fetchGitHubRepos(username);

  // Set the reference date (January 29, 2011)
  const referenceDate = new Date("2011-01-29");
  const currentDate = new Date();

  // Calculate the difference in years
  let yearsDifference = currentDate.getFullYear() - referenceDate.getFullYear();
  const monthsDifference = currentDate.getMonth() - referenceDate.getMonth();

  // Adjust if the current month and day are earlier than the reference date
  if (
    monthsDifference < 0 ||
    (monthsDifference === 0 && currentDate.getDate() < referenceDate.getDate())
  ) {
    yearsDifference -= 1;
  }

  res.render("index", { repos, years: yearsDifference });
});

app.get("/skills/:name", async (req, res) => {
  try {
    const skill = await Skill.findOne({ name: req.params.name });
    res.render("skill", { skill });
  } catch (error) {
    logger.error("Error fetching skill:" + error);
    next();
  }
});

app.post("/skills/new", async (req, res) => {
  try {
    const { name, content } = req.body;
    const skill = new Skill({ name, content });
    await skill.save();
    res.redirect(`/skills/${name}`);
  } catch (error) {
    logger.error("Error saving skill:" + error);
    res.status(400).send("Invalid skill data");
  }
});

app.all("*", (req, res) => {
  res.render("404", { url: req.url });
});

app.use((err, req, res, next) => {
  logger.error(`Error: ${err}`);
  res.status(500).send("Something broke!");
});

app.listen(PORT, () => {
  logger.info(`Server is running on port ${PORT}`);
});
