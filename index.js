const express = require('express');
const cors = require('cors');
const sharp = require('sharp');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3000;
const layerOrder = ["Background", "Body", "Cloth", "Eyes", "Mouth", "Hair", "Accessories"];

// Endpoint untuk mendapatkan daftar traits pada tiap layer
app.get('/get-traits', (req, res) => {
  const traits = {};
  layerOrder.forEach(layer => {
    const layerPath = path.join(__dirname, 'assets', layer);
    if (fs.existsSync(layerPath)) {
      traits[layer] = fs.readdirSync(layerPath)
        .filter(file => /\.(png|jpg|jpeg)$/.test(file))
        .map(file => `/${layer}/${file}`);
    }
  });
  res.json(traits);
});

// Endpoint untuk mengenerate NFT dan mengirimkan URL sementara untuk preview
app.post('/generate-nft', async (req, res) => {
  const { selectedTraits } = req.body;
  const layers = layerOrder.map(layer => ({
    input: path.join(__dirname, 'assets', selectedTraits[layer])
  }));

  try {
    // Menggunakan sharp untuk membuat gambar dan menyimpannya sebagai buffer
    const imageBuffer = await sharp(layers[0].input)
      .composite(layers.slice(1))
      .toBuffer();

    // Mengonversi buffer menjadi URL blob sementara untuk di-preview
    const base64Image = imageBuffer.toString('base64');
    const dataUrl = `data:image/png;base64,${base64Image}`;

    res.json({ previewUrl: dataUrl }); // Mengirim URL blob ke frontend untuk preview
  } catch (error) {
    console.error('Error generating NFT:', error);
    res.status(500).json({ error: 'Error generating NFT' });
  }
});

// Endpoint khusus untuk mendownload gambar NFT
app.post('/download-nft', async (req, res) => {
  const { selectedTraits } = req.body;
  const layers = layerOrder.map(layer => ({
    input: path.join(__dirname, 'assets', selectedTraits[layer])
  }));

  try {
    const imageBuffer = await sharp(layers[0].input)
      .composite(layers.slice(1))
      .toBuffer();

    res.set('Content-Disposition', 'attachment; filename="generated-nft.png"');
    res.set('Content-Type', 'image/png');
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error downloading NFT:', error);
    res.status(500).json({ error: 'Error downloading NFT' });
  }
});

// Menyediakan assets sebagai folder statis
app.use('/assets', express.static(path.join(__dirname, 'assets')));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
