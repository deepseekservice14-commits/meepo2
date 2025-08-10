// Configuration
const YOUTUBE_API_KEYS = [

  
    'AIzaSyA1_s4dwAPtbLhN77codCf-cDK6ZMd_sxM',
    'AIzaSyCOevhCHf1xHkZCmjpOiQPPNhukHYqEkeU',
    'AIzaSyBlnZ4qrPgecLmM-WmjOWbd4aUdX2e_elE'
];
const CHANNEL_ID = 'UCyRkQSJ9IZupewB-yPN2W4g'; // Meepoku's verified channel ID
const VIDEO_COUNT = 4;
const REFRESH_INTERVAL = 60 * 60 * 1000; // 1 hour

// DOM elements
const videoDisplay = document.getElementById('videoDisplay');
const refreshBtn = document.getElementById('refreshBtn');
const lastUpdatedEl = document.getElementById('lastUpdated');

// Format date
function formatDate(dateString) {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
}

// Update last updated time
function updateLastUpdated() {
    const now = new Date();
    lastUpdatedEl.textContent = `Last updated: ${now.toLocaleTimeString()}`;
}

// Create video card HTML
function createVideoCard(video) {
    return `
        <div class="video-container">
            <div class="video-wrapper">
                <iframe src="https://www.youtube.com/embed/${video.id}" 
                        frameborder="0" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                        allowfullscreen></iframe>
            </div>
            <div class="video-info">
                <h2>${video.title}</h2>
                <p class="video-channel">Channel: Meepoku</p>
                <p class="video-date">Uploaded: ${formatDate(video.publishedAt)}</p>
                <div class="video-description">${video.description || ''}</div>
            </div>
        </div>
    `;
}

// Show loading state
function showLoading() {
    videoDisplay.innerHTML = '<div class="loading">Loading latest Meepo games...</div>';
}

// Show error message
function showError(message) {
    videoDisplay.innerHTML = `<div class="error">${message}</div>`;
}

// Render videos in 2x2 grid
function renderVideos(videos) {
    if (!videos || videos.length < 4) {
        showError('Could not load enough videos. Please refresh.');
        return;
    }
    
    let html = `
        <div class="videos-grid">
            <div class="video-row">
                ${createVideoCard(videos[0])}
                ${createVideoCard(videos[1])}
            </div>
            <div class="video-row">
                ${createVideoCard(videos[2])}
                ${createVideoCard(videos[3])}
            </div>
        </div>
    `;
    
    videoDisplay.innerHTML = html;
    updateLastUpdated();
}

// Try API request with multiple keys
async function tryApiRequest(url) {
    for (const apiKey of YOUTUBE_API_KEYS) {
        try {
            const response = await fetch(`${url}&key=${apiKey}`);
            if (!response.ok) continue;
            return await response.json();
        } catch (error) {
            console.warn(`API key failed: ${error.message}`);
        }
    }
    throw new Error('All API keys failed');
}

// Fetch latest videos from channel
async function fetchLatestVideos() {
    try {
        showLoading();
        
        // First get the uploads playlist ID
        const channelResponse = await tryApiRequest(
            `https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=${CHANNEL_ID}`
        );
        
        const uploadsPlaylistId = channelResponse.items[0].contentDetails.relatedPlaylists.uploads;
        
        // Then get videos from uploads playlist
        const videosResponse = await tryApiRequest(
            `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=${VIDEO_COUNT}&playlistId=${uploadsPlaylistId}`
        );
        
        return videosResponse.items.map(item => ({
            id: item.snippet.resourceId.videoId,
            title: item.snippet.title,
            publishedAt: item.snippet.publishedAt,
            description: item.snippet.description
        }));
    } catch (error) {
        console.error('Error fetching videos:', error);
        return null;
    }
}

// Main load function
async function loadVideos() {
    const videos = await fetchLatestVideos();
    if (videos) {
        renderVideos(videos);
    } else {
        showError('Failed to load videos. Please try again.');
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadVideos();
    setInterval(loadVideos, REFRESH_INTERVAL);
});

refreshBtn.addEventListener('click', loadVideos);
