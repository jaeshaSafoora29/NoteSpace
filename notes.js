const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Note = require('../models/Note');

// Get all notes for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.find({ user: req.user.id }).sort({ pinned: -1, updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Add a note
router.post('/', auth, async (req, res) => {
  try {
    const { text, color, category, pinned, reminder } = req.body;
    if (!text) return res.status(400).json({ msg: 'Note text is required' });

    const note = new Note({
      user: req.user.id,
      text,
      color: color || '#ffffff',
      category: category || 'General',
      pinned: pinned || false,
      reminder: reminder || null
    });

    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Update a note
router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    if (note.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    const { text, color, category, pinned, reminder } = req.body;
    note.text = text !== undefined ? text : note.text;
    note.color = color !== undefined ? color : note.color;
    note.category = category !== undefined ? category : note.category;
    note.pinned = pinned !== undefined ? pinned : note.pinned;
    note.reminder = reminder !== undefined ? reminder : note.reminder;
    note.updatedAt = Date.now();

    await note.save();
    res.json(note);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Delete a note
router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ msg: 'Note not found' });
    if (note.user.toString() !== req.user.id) return res.status(401).json({ msg: 'User not authorized' });

    await note.remove();
    res.json({ msg: 'Note removed' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Get notes with upcoming reminders within a time window (for notification polling)
router.get('/reminders/upcoming', auth, async (req, res) => {
  try {
    const now = new Date();
    const windowEnd = new Date(now.getTime() + 5 * 60 * 1000); // next 5 minutes
    const notes = await Note.find({
      user: req.user.id,
      reminder: { $ne: null, $gte: now, $lte: windowEnd }
    }).sort({ reminder: 1 });
    res.json(notes);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
