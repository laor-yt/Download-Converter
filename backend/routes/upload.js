const express = require('express');
const router = express.Router();
const multer = require('multer');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const jobManager = require('../jobManager');

const upload = multer({ dest: os.tmpdir() });

router.post('/', upload.single('file'), (req, res) => {
    let { format, resolution, orientation, audioOnly, jobId, title } = req.body;

    if (!req.file || !jobId) {
        return res.status(400).json({ error: 'File and jobId are required' });
    }

    format = format || 'mp4';
    audioOnly = audioOnly === 'true';
    title = title || req.file.originalname || 'Uploaded File';

    const tempFileName = `out_${jobId}_${Date.now()}.${format}`;
    const outputPath = path.join(os.tmpdir(), tempFileName);

    // Create the background job immediately
    jobManager.createJob(jobId, { 
        title, 
        format, 
        outputPath,
        inputFile: req.file.path, // So we can clean it up later
        originalSize: req.file.size || 0
    });

    // Respond immediately so client doesn't block
    res.json({ success: true, jobId, message: 'Upload received, processing in background' });

    try {
        let command = ffmpeg(req.file.path);

        if (audioOnly) {
            command.noVideo();
            if (format === 'mp3') command.audioCodec('libmp3lame');
        } else {
            let targetSize = resolution;

            if (orientation === 'portrait') {
                targetSize = targetSize || '1920x1080';
                const parts = targetSize.split('x');
                if (parts.length === 2 && parseInt(parts[0]) > parseInt(parts[1])) {
                    targetSize = `${parts[1]}x${parts[0]}`; // Swap to Portrait
                }
            } else if (orientation === 'landscape') {
                targetSize = targetSize || '1920x1080';
                const parts = targetSize.split('x');
                if (parts.length === 2 && parseInt(parts[1]) > parseInt(parts[0])) {
                    targetSize = `${parts[1]}x${parts[0]}`; // Swap to Landscape
                }
            }

            if (targetSize) {
                if (orientation) {
                    const [w, h] = targetSize.split('x');
                    // Fit within target size and crop the excess to fill screen completely (no black bars)
                    command.videoFilters(`scale=${w}:${h}:force_original_aspect_ratio=increase,crop=${w}:${h}`);
                } else {
                    command.size(targetSize);
                }
            }
            if (format === 'mp4') command.videoCodec('libx264');
        }

        command.on('progress', (progress) => {
            jobManager.updateProgress(jobId, progress.percent, progress.currentKbps, progress.targetSize, progress.timemark);
        });

        command.on('error', (err) => {
            console.error('Upload FFmpeg error:', err.message);
            jobManager.failJob(jobId, 'Conversion error: ' + err.message);
        });

        command.on('end', () => {
            jobManager.completeJob(jobId);
        });

        command.save(outputPath);
        
        jobManager.setJobProcess(jobId, command, null);

    } catch (error) {
        console.error("Upload Route Error:", error);
        jobManager.failJob(jobId, 'Failed to start processing.');
    }
});

module.exports = router;
