/* ================================
   Music Player Module
   ================================ */

class MusicPlayer {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playPauseBtn = document.getElementById('playPauseBtn');
        this.playIcon = document.getElementById('playIcon');
        this.musicSelect = document.getElementById('musicSelect');
        this.volumeSlider = document.getElementById('volumeSlider');
        this.volumeValue = document.getElementById('volumeValue');
        
        this.musicTracks = {
            lofi: {
                url: 'music/Em dezembro de 81(Pra Cima Deles Flamengo 3x0 no Liverpool)Funk 150bpm Deejay Lucca - Deejay Lucca o Genio  Dos Hits (youtube) (1).mp3',
                name: 'Pra Cima Deles Flamengo 🔴⚫'
            },
            jazz: {
                url: 'music/ERIKA - FR traduction - (Vidéo pédagogique) - Julien de la Krieg (youtube).mp3',
                name: 'ERIKA'
            },
            ambient: {
                url: 'music/IF I CATCH YOU - VIDEO OFICIAL - MICHEL TELÓ (AI SE EU TE PEGO) - Michel Teló (youtube) (1).mp3',
                name: 'Ai Se Eu Te Pego - Michel Teló'
            },
            electronic: {
                url: 'music/mao zedong propaganda music Red Sun in the Sky - Meheandus Revolution (youtube) (1).mp3',
                name: 'Red Sun in the Sky ☭'
            },
            minha_ex: {
                url: 'music/Minha Ex - Zé Felipe  FitDance (Coreografia) - FitDance (youtube).mp3',
                name: 'Minha Ex - Zé Felipe'
            },
            parangole: {
                url: 'music/Parangolé e Léo Santana - Perna Bamba [Clipe Oficial] - Banda Parangolé (youtube).mp3',
                name: 'Perna Bamba - Parangolé 💃'
            }
        };

        this.init();
    }

    init() {
        // Set initial volume
        this.audioPlayer.volume = 0.3;

        // Setup event listeners
        this.setupEventListeners();

        // Restore player state from localStorage
        this.restorePlayerState();

        // Save state periodically
        this.startAutoSave();
    }

    setupEventListeners() {
        // Loop automático
        this.audioPlayer.addEventListener('ended', () => {
            this.audioPlayer.currentTime = 0;
            this.audioPlayer.play().catch(error => {
                console.error('Erro ao repetir música:', error);
            });
        });

        // Tratar erros de carregamento
        this.audioPlayer.addEventListener('error', () => {
            this.playIcon.classList.remove('bi-pause-fill');
            this.playIcon.classList.add('bi-play-fill');
        });
    }

    togglePlay() {
        if (!this.musicSelect.value) {
            alert('Por favor, selecione uma música primeiro!');
            return;
        }

        if (this.audioPlayer.paused) {
            this.audioPlayer.play().catch(error => {
                console.error('Erro ao tocar:', error);
                alert('Não foi possível tocar a música. Verifique se o arquivo existe.');
            });
            this.playIcon.classList.remove('bi-play-fill');
            this.playIcon.classList.add('bi-pause-fill');
        } else {
            this.audioPlayer.pause();
            this.playIcon.classList.remove('bi-pause-fill');
            this.playIcon.classList.add('bi-play-fill');
        }
    }

    changeMusic() {
        const selectedMusic = this.musicSelect.value;
        
        if (!selectedMusic) {
            this.audioPlayer.pause();
            this.audioPlayer.src = '';
            this.playIcon.classList.remove('bi-pause-fill');
            this.playIcon.classList.add('bi-play-fill');
            localStorage.removeItem('musicPlayerState');
            return;
        }

        const track = this.musicTracks[selectedMusic];
        
        this.audioPlayer.pause();
        this.audioPlayer.src = track.url;
        
        // Reset icon to play
        this.playIcon.classList.remove('bi-pause-fill');
        this.playIcon.classList.add('bi-play-fill');
        
        // Load audio
        this.audioPlayer.load();
        
        // Save state
        this.savePlayerState();
    }

    changeVolume(value) {
        this.audioPlayer.volume = value / 100;
        this.volumeValue.textContent = value + '%';
        this.savePlayerState();
    }

    savePlayerState() {
        const state = {
            currentMusic: this.musicSelect.value,
            currentTime: this.audioPlayer.currentTime,
            volume: this.audioPlayer.volume,
            isPlaying: !this.audioPlayer.paused
        };
        localStorage.setItem('musicPlayerState', JSON.stringify(state));
    }

    restorePlayerState() {
        const savedState = localStorage.getItem('musicPlayerState');
        if (!savedState) return;

        try {
            const state = JSON.parse(savedState);
            
            if (state.currentMusic) {
                this.musicSelect.value = state.currentMusic;
                const track = this.musicTracks[state.currentMusic];
                
                // Set volume first
                this.audioPlayer.volume = state.volume || 0.3;
                this.volumeSlider.value = (state.volume || 0.3) * 100;
                this.volumeValue.textContent = Math.round((state.volume || 0.3) * 100) + '%';
                
                // Load audio with preload for faster playback
                this.audioPlayer.preload = 'auto';
                this.audioPlayer.src = track.url;
                
                this.audioPlayer.addEventListener('loadedmetadata', () => {
                    this.audioPlayer.currentTime = state.currentTime || 0;
                    
                    if (state.isPlaying) {
                        // Try to play immediately
                        const playPromise = this.audioPlayer.play();
                        if (playPromise !== undefined) {
                            playPromise.then(() => {
                                this.playIcon.classList.remove('bi-play-fill');
                                this.playIcon.classList.add('bi-pause-fill');
                            }).catch(err => {
                                // Autoplay blocked - just update UI
                                console.log('Click no play para continuar a música');
                            });
                        }
                    }
                }, { once: true });
                
                // Start loading immediately
                this.audioPlayer.load();
            }
        } catch (error) {
            console.error('Erro ao restaurar estado do player:', error);
        }
    }

    startAutoSave() {
        setInterval(() => {
            if (!this.audioPlayer.paused && this.musicSelect.value) {
                this.savePlayerState();
            }
        }, 1000);
    }
}

// Initialize music player when DOM is loaded
let musicPlayer;

// Wait for music player component to be rendered - OPTIMIZED
function initMusicPlayer() {
    const audioPlayer = document.getElementById('audioPlayer');
    if (audioPlayer) {
        musicPlayer = new MusicPlayer();
    } else {
        // Retry with requestAnimationFrame for better performance
        requestAnimationFrame(initMusicPlayer);
    }
}

// Start checking for player after DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        requestAnimationFrame(initMusicPlayer);
    });
} else {
    requestAnimationFrame(initMusicPlayer);
}

// Global functions for HTML onclick handlers
function togglePlay() {
    if (musicPlayer) musicPlayer.togglePlay();
}

function changeMusic() {
    if (musicPlayer) musicPlayer.changeMusic();
}

function changeVolume(value) {
    if (musicPlayer) musicPlayer.changeVolume(value);
}
