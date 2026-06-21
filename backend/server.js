const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
const downloadRoute = require('./routes/download');
const convertRoute = require('./routes/convert');
const uploadRoute = require('./routes/upload');
const jobManager = require('./jobManager');
const { exec } = require('child_process');
const path = require('path');

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Set up routes
app.use('/api/download', downloadRoute);
app.use('/api/convert', convertRoute);
app.use('/api/upload', uploadRoute);

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Backend is running' });
});

app.get('/api/progress', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    // Send initial jobs list
    res.write(`data: ${JSON.stringify({ type: 'init', jobs: jobManager.getAllJobs() })}\n\n`);

    const onProgress = (data) => {
        res.write(`data: ${JSON.stringify({ type: 'update', job: data })}\n\n`);
    };

    const onJobRemoved = (data) => {
        res.write(`data: ${JSON.stringify({ type: 'remove', jobId: data.jobId })}\n\n`);
    };

    jobManager.on('progress', onProgress);
    jobManager.on('jobRemoved', onJobRemoved);

    req.on('close', () => {
        jobManager.off('progress', onProgress);
        jobManager.off('jobRemoved', onJobRemoved);
    });
});

app.get('/api/jobs', (req, res) => {
    res.json(jobManager.getAllJobs());
});

app.delete('/api/jobs/:jobId', (req, res) => {
    jobManager.removeJob(req.params.jobId);
    res.json({ success: true });
});

app.get('/api/download/:jobId', (req, res) => {
    const job = jobManager.jobs.get(req.params.jobId);
    if (!job || job.status !== 'completed' || !job.outputPath) {
        return res.status(404).json({ error: 'File not found or not ready' });
    }
    
    res.download(job.outputPath, `converted_media.${job.format}`, (err) => {
        if (err) console.error("Download send error:", err);
    });
});

app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

