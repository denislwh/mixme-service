const express = require('express');
const fetch = require('node-fetch');
const FormData = require('form-data');

const app = express();
const port = process.env.PORT || 3000;

const removeBgApiKey = '9PmhSWzF5ghiuFptY5eYD2qg';
const stableDiffusionApiKey = 'xBJacULxPof4Hmk5YFdGjHKoK3P4YJIf7wemcsBqpMt4tAVMEtplrwrRhOTm';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
    res.send('Welcome to the Image Processing App');
});

app.post('/process-image', async (req, res) => {
    const imageUrl = req.body.imageUrl;
    const prompt = req.body.prompt;

    if (!imageUrl || !prompt) {
        res.status(400).send('Missing required parameters: imageUrl and prompt');
        return;
    }

    try {
        // Remove background from image
        const removeBgUrl = 'https://api.remove.bg/v1.0/removebg';
        const response = await fetch(removeBgUrl, {
            method: 'POST',
            headers: {
                'X-Api-Key': removeBgApiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                image_url: imageUrl,
                size: 'auto',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Error removing background. Status: ${response.status}. Response text: ${errorText}`);
        }

        const removedBgImageBuffer = await response.buffer();

        // Use the Stable Diffusion API to mix the image
        const stableDiffusionUrl = 'https://api.stablediffusion.com/v1/image';
        const formData = new FormData();
        formData.append('image', removedBgImageBuffer, { filename: 'image.png', contentType: 'image/png' });
        formData.append('prompt', prompt);
        formData.append('num_images', 1);
        formData.append('api_key', stableDiffusionApiKey);

        const mixedImageResponse = await fetch(stableDiffusionUrl, {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders(),
        });

        if (!mixedImageResponse.ok) {
            const errorText = await mixedImageResponse.text();
            throw new Error(`Error mixing image. Status: ${mixedImageResponse.status}. Response text: ${errorText}`);
        }

        const mixedImageBuffer = await mixedImageResponse.buffer();
        res.set('Content-Type', 'image/png').send(mixedImageBuffer);
    } catch (error) {
        console.error(error);
        res.status(500).send('Error processing the image.');
    }
});


app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});
