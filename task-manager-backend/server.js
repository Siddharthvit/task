const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const cors = require('cors');

// Initialize Express App
const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Initialize SQLite database
const db = new sqlite3.Database('./tasks.db', (err) => {
    if (err) {
        console.error('❌ Error opening database:', err);
    } else {
        console.log('✅ Connected to SQLite database');
        // Drop the existing table if it exists
        db.run('DROP TABLE IF EXISTS tasks', (err) => {
            if (err) {
                console.error('Error dropping table:', err);
            } else {
                console.log('Table dropped successfully');
                // Create tasks table with new fields
                db.run(`CREATE TABLE tasks (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    description TEXT,
                    completed INTEGER DEFAULT 0,
                    due_date TEXT,
                    priority TEXT DEFAULT 'medium',
                    completion_date TEXT
                )`, (err) => {
                    if (err) {
                        console.error('Error creating table:', err);
                    } else {
                        console.log('Table created successfully');
                    }
                });
            }
        });
    }
});

// Routes
app.post('/tasks', (req, res) => {
    const { title, description, due_date, priority } = req.body;
    console.log('Received task data:', { title, description, due_date, priority });
    
    const sql = 'INSERT INTO tasks (title, description, due_date, priority) VALUES (?, ?, ?, ?)';
    
    db.run(sql, [title, description, due_date, priority], function(err) {
        if (err) {
            console.error('Error inserting task:', err);
            res.status(400).json({ error: 'Failed to create task' });
        } else {
            console.log('Task inserted successfully');
            res.status(201).json({
                id: this.lastID,
                title,
                description,
                completed: false,
                due_date,
                priority,
                completion_date: null
            });
        }
    });
});

app.get('/', (req, res) => {
    res.send("✅ API is running");
});

app.get('/tasks', (req, res) => {
    const sql = 'SELECT * FROM tasks';
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching tasks:', err);
            res.status(400).json({ error: 'Failed to fetch tasks' });
        } else {
            console.log('Fetched tasks:', rows);
            res.status(200).json(rows);
        }
    });
});

app.put('/tasks/:id', (req, res) => {
    const sql = 'UPDATE tasks SET completed = 1, completion_date = DATETIME("now") WHERE id = ?';
    
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            console.error('Error updating task:', err);
            res.status(400).json({ error: 'Failed to update task' });
        } else {
            // Get the updated task
            db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id], (err, task) => {
                if (err) {
                    console.error('Error fetching updated task:', err);
                    res.status(400).json({ error: 'Failed to fetch updated task' });
                } else {
                    console.log('Task updated successfully:', task);
                    res.status(200).json(task);
                }
            });
        }
    });
});

app.delete('/tasks/:id', (req, res) => {
    const sql = 'DELETE FROM tasks WHERE id = ?';
    
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            console.error('Error deleting task:', err);
            res.status(400).json({ error: 'Failed to delete task' });
        } else {
            console.log('Task deleted successfully');
            res.status(200).json({ 
                message: 'Task deleted successfully',
                id: req.params.id 
            });
        }
    });
});

// Start Server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
});
