const express = require('express');
const http = require('http');
const path = require('path');
const supabase = require('@supabase/supabase-js');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const PORT = process.env.PORT || 3000;
app.use(express.json())

const db = supabase.createClient('https://acocwcprlozdmncljkpq.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFjb2N3Y3BybG96ZG1uY2xqa3BxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjgwNTEwNDksImV4cCI6MjA0MzYyNzA0OX0.WO--W6OE9pP-YRY5oXOpDBdQZhvBHp3CgPC_7EUk1cA')

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'ejs');

// Socket.io connection
io.on('connection', (socket) => {
    console.log('User connected');

    db.from('member').select('*').then(({ data, error }) => {
        if (data && !error) {
            data.forEach(message => {
                if (message.nama && message.pesan) {  // Ensure that name and message exist
                    socket.emit('updateData', { name: message.nama, message: message.pesan });
                }
            });
        } else {
            console.error("Error fetching data from Supabase:", error);
        }    
    });

    socket.on('newMessage', async ({ name, message }) => {
        if (name && message) {  // Check if name and message are valid
            const { data, error } = await db.from('member').insert([{ nama: name, pesan: message }]);
            if (!error) {
                io.emit('updateData', { name, message });
            } else {
                console.error("Error saving message to Supabase:", error);
            }
        } else {
            console.error("Invalid name or message:", name, message);
        }
    });
});    

// Routes
app.get('/', async (req, res) => {
    const { data, error } = await db.from('member').select('*');
    res.render('index', { data });
});

// Start server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});