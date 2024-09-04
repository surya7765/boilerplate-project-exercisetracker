import express from "express";
const router = express.Router();
import User from "../models/User.js";
import Exercise from "../models/Exersice.js";

router.get("/users", async (req, res) => {
  try {
    const users = await User.find({}, "username _id");
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const newUser = new User({ username: req.body.username });
    await newUser.save();
    res.json({ username: newUser.username, _id: newUser._id });
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.post("/users/:_id/exercises", async (req, res) => {
  try {
    const userId = req.params._id;
    const { description, duration, date } = req.body;

    const exerciseDate = date ? new Date(date) : new Date();
    const newExercise = new Exercise({
      userId,
      description,
      duration: parseInt(duration),
      date: exerciseDate,
    });

    const exercise = await newExercise.save();
    const user = await User.findById(userId);
    user.exercises.push(exercise._id);
    await user.save();

    res.json({
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
      _id: user._id,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to add exercise" });
  }
});

router.get("/users/:_id/logs", async (req, res) => {
  try {
    const userId = req.params._id;
    const { from, to, limit } = req.query;

    let user = await User.findById(userId).populate("exercises");
    if (!user) return res.status(404).json({ error: "User not found" });

    let log = user.exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),
    }));

    if (from) {
      const fromDate = new Date(from);
      log = log.filter((exercise) => new Date(exercise.date) >= fromDate);
    }

    if (to) {
      const toDate = new Date(to);
      log = log.filter((exercise) => new Date(exercise.date) <= toDate);
    }

    if (limit) {
      log = log.slice(0, parseInt(limit));
    }

    res.json({
      username: user.username,
      count: log.length,
      _id: user._id,
      log,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to retrieve logs" });
  }
});

export default router;
