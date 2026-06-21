const express = require('express');
const router = express.Router();
const youtubedl = require('youtube-dl-exec');
const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const os = require('os');
const jobManager = require('../jobManager');

router.get('/', (req, res) => {
    let { url, format, resolution, orientation, audioOnly, jobId, title, duration, originalSize } = req.query;

    if (!url || !jobId) return res.status(400).json({ error: 'URL and jobId are required' });

    format = format || 'mp4';
    audioOnly = audioOnly === 'true';
    title = title || 'URL Conversion';
    duration = parseFloat(duration) || 0;
    originalSize = parseFloat(originalSize) || 0;

    const tempFileName = `out_${jobId}_${Date.now()}.${format}`;
    const outputPath = path.join(os.tmpdir(), tempFileName);

    // Create the background job immediately
    jobManager.createJob(jobId, { title, format, outputPath, duration, originalSize });

    // Respond to the client right away so they don't block
    res.json({ success: true, jobId, message: 'Job started in background' });

    try {
        const ytdlProcess = youtubedl.exec(url, {
            o: '-',
            f: audioOnly ? 'bestaudio' : 'best',
            noWarnings: true
        }, {
            stdio: ['ignore', 'pipe', 'ignore']
        });
        
        ytdlProcess.catch(err => {
            console.error('youtube-dl-exec error:', err.message || err);
            jobManager.failJob(jobId, 'Failed to fetch media from source.');
        });

        let command = ffmpeg(ytdlProcess.stdout);

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
            console.error('FFmpeg error:', err.message);
            jobManager.failJob(jobId, 'Conversion error: ' + err.message);
        });

        command.on('end', () => {
            jobManager.completeJob(jobId);
        });

        command.save(outputPath);
        
        // Save references for cancellation
        jobManager.setJobProcess(jobId, command, ytdlProcess);

    } catch (error) {
        console.error("Conversion Route Error:", error);
        jobManager.failJob(jobId, 'Failed to start conversion process.');
    }
});

module.exports = router;
