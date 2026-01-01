/* ================================
   Music Player Component - Auto Injection
   ================================ */

const MusicPlayerComponent = {
    template: `
        <div class="music-player-container">
            <div class="container">
                <div class="music-player">
                    <div class="player-controls">
                        <button id="playPauseBtn" class="control-btn" onclick="togglePlay()">
                            <i class="bi bi-play-fill" id="playIcon"></i>
                        </button>
                        
                        <div class="track-info">
                            <select id="musicSelect" class="music-selector" onchange="changeMusic()">
                                <option value="">🎵 Escolha uma música...</option>
                                <option value="lofi">Mengo</option>
                                <option value="jazz">ERIKA</option>
                                <option value="ambient">Ai Se Eu Te Pego</option>
                                <option value="electronic">Red Sun</option>
                                <option value="minha_ex">Minha Ex</option>
                                <option value="parangole">Perna Bamba</option>
                            </select>
                        </div>
                        
                        <div class="volume-control">
                            <i class="bi bi-volume-up-fill"></i>
                            <input type="range" id="volumeSlider" min="0" max="100" value="30" class="volume-slider" oninput="changeVolume(this.value)">
                            <span id="volumeValue">30%</span>
                        </div>
                    </div>
                    
                    <audio id="audioPlayer" preload="metadata"></audio>
                </div>
            </div>
        </div>
    `,

    render() {
        const navbar = document.querySelector('.navbar');
        if (!navbar) {
            // Retry once after a tick if navbar not ready
            requestAnimationFrame(() => this.render());
            return;
        }
        
        const playerContainer = document.createElement('div');
        playerContainer.innerHTML = this.template;
        
        // Insert player right after navbar
        if (navbar.nextSibling) {
            navbar.parentNode.insertBefore(playerContainer.firstElementChild, navbar.nextSibling);
        } else {
            navbar.parentNode.appendChild(playerContainer.firstElementChild);
        }
    }
};

// Auto-inject music player when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for navbar to be injected first
    setTimeout(() => {
        MusicPlayerComponent.render();
    }, 100);
});
