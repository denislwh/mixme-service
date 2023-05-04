const express = require('express');
const multer = require('multer');
const fetch = require('node-fetch');
const FormData = require('form-data');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const upload = multer();

const REMOVE_BG_API_KEY = '9PmhSWzF5ghiuFptY5eYD2qg';
const STABLE_DIFFUSION_API_KEY = 'xBJacULxPof4Hmk5YFdGjHKoK3P4YJIf7wemcsBqpMt4tAVMEtplrwrRhOTm';

app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));

app.use(express.static('public'));

app.post('/api/remove-bg', upload.single('image_file'), async (req, res) => {
    try {
        const formData = new FormData();
        formData.append('image_file', req.file.buffer, { filename: 'image.png', contentType: 'image/png' });
        formData.append('size', 'auto');

        const response = await fetch('https://api.remove.bg/v1.0/removebg', {
            method: 'POST',
            headers: {
                'X-Api-Key': REMOVE_BG_API_KEY,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error('Error removing background.');
        }

        const blob = await response.buffer();
        res.type('image/png').send(blob);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error processing the image.' });
    }
});

app.post('/api/mix-style', async (req, res) => {
    try {
        const response = await fetch('https://stablediffusion.com/api/v2/mix', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Api-Key': STABLE_DIFFUSION_API_KEY,
            },
            body: JSON.stringify({
                image: Buffer.from(req.body.image).toString('base64'),
                prompt: req.body.prompt,
            }),
        });

        if (!response.ok) {
            throw new Error('Error mixing style.');
        }

        const result = await response.json();
        const resultBuffer = Buffer.from(result.image, 'base64');
        res.type('image/png').send(resultBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send({ message: 'Error processing the image.' });
    }
});

const path = require('path');

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});