const express = require('express');
const router = express.Router();
const Task = require('../models/Task');
const authMiddleware = require('../middleware/auth');

router.get('/:channelId', authMiddleware, async (req, res) => {
  try {
    const tasks = await Task.find({ channelId: req.params.channelId })
      .populate('assignedUser', 'username email');
    res.json({ tasks });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/create', authMiddleware, async (req, res) => {
  try {
    const { title, description, channelId, assignedTo } = req.body;

    const task = new Task({
      title,
      description,
      channelId,
      assignedUser: assignedTo,
      status: 'todo'
    });

    await task.save();
    await task.populate('assignedUser', 'username email');
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put('/update/:id', authMiddleware, async (req, res) => {
  try {
    const { status, assignedTo } = req.body;

    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status, assignedUser: assignedTo },
      { new: true }
    ).populate('assignedUser', 'username email');

    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task updated', task });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
