const API_URL = 'http://localhost:3000/api';

let championships = [];
let currentChampionshipId = null;
let participants = [];
let editingParticipantId = null;

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    loadChampionships();
    setupEventListeners();
});

function setupEventListeners() {
    const championshipForm = document.getElementById('championshipForm');
    const participantForm = document.getElementById('participantForm');
    
    if (championshipForm) {
        championshipForm.addEventListener('submit', createChampionship);
    }
    
    if (participantForm) {
        participantForm.addEventListener('submit', addParticipant);
    }
}

// ========== CAMPEONATOS ==========
async function loadChampionships() {
    try {
        const response = await fetch(`${API_URL}/nofap-championships`);
        if (response.ok) {
            championships = await response.json();
            renderChampionshipSelect();
            
            if (championships.length > 0 && !currentChampionshipId) {
                currentChampionshipId = championships[0].id;
                document.getElementById('championshipSelect').value = currentChampionshipId;
                loadParticipants();
            }
        }
    } catch (error) {
        console.error('Erro ao carregar desafios:', error);
    }
}

function renderChampionshipSelect() {
    const select = document.getElementById('championshipSelect');
    select.innerHTML = '<option value="">Selecione um desafio...</option>' +
        championships.map(c => `<option value="${c.id}" ${c.id === currentChampionshipId ? 'selected' : ''}>${c.name}</option>`).join('');
}

function changeChampionship() {
    const select = document.getElementById('championshipSelect');
    currentChampionshipId = select.value || null;
    
    if (currentChampionshipId) {
        loadParticipants();
    } else {
        participants = [];
        updateUI();
    }
}

function showNewChampionshipModal() {
    const modal = new bootstrap.Modal(document.getElementById('newChampionshipModal'));
    document.getElementById('championshipName').value = '';
    modal.show();
}

async function createChampionship(e) {
    e.preventDefault();
    
    const name = document.getElementById('championshipName').value.trim();
    
    if (!name) {
        alert('Digite um nome para o desafio!');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/nofap-championships`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, type: 'nofap' })
        });
        
        if (response.ok) {
            const result = await response.json();
            currentChampionshipId = result.id;
            await loadChampionships();
            bootstrap.Modal.getInstance(document.getElementById('newChampionshipModal')).hide();
            alert(`Desafio "${name}" criado com sucesso!`);
        } else {
            const errorData = await response.json();
            alert('Erro ao criar desafio: ' + (errorData.error || 'Erro desconhecido'));
        }
    } catch (error) {
        console.error('Erro ao criar desafio:', error);
        alert('Erro ao criar desafio!');
    }
}

// ========== PARTICIPANTES ==========
async function loadParticipants() {
    if (!currentChampionshipId) {
        participants = [];
        updateUI();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/nofap-championships/${currentChampionshipId}/participants`);
        if (response.ok) {
            participants = await response.json();
            // Ordenar por pontuação (maior para menor)
            participants.sort((a, b) => b.score - a.score);
            updateUI();
        }
    } catch (error) {
        console.error('Erro ao carregar participantes:', error);
        participants = [];
        updateUI();
    }
}

async function addParticipant(e) {
    e.preventDefault();
    
    if (!currentChampionshipId) {
        alert('Selecione um desafio primeiro!');
        return;
    }
    
    const name = document.getElementById('participantName').value.trim();
    const score = parseInt(document.getElementById('participantScore').value) || 0;
    
    if (!name) {
        alert('Digite o nome do participante!');
        return;
    }
    
    if (score > 30) {
        alert('O desafio é de 30 dias no máximo!');
        return;
    }
    
    try {
        if (editingParticipantId) {
            // Editar
            const response = await fetch(`${API_URL}/nofap-participants/${editingParticipantId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score })
            });
            
            if (response.ok) {
                cancelEdit();
                await loadParticipants();
            }
        } else {
            // Adicionar
            const response = await fetch(`${API_URL}/nofap-participants`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score, championshipId: currentChampionshipId })
            });
            
            if (response.ok) {
                e.target.reset();
                document.getElementById('participantScore').value = 0;
                await loadParticipants();
            }
        }
    } catch (error) {
        console.error('Erro ao salvar participante:', error);
        alert('Erro ao salvar participante!');
    }
}

function editParticipant(id) {
    const participant = participants.find(p => p.id === id);
    if (!participant) return;
    
    editingParticipantId = id;
    document.getElementById('participantName').value = participant.name;
    document.getElementById('participantScore').value = participant.score;
    
    const submitBtn = document.querySelector('#participantForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="bi bi-pencil me-2"></i>Atualizar Participante';
    
    // Scroll para o formulário
    document.getElementById('participants-tab').click();
    document.getElementById('participantForm').scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEdit() {
    editingParticipantId = null;
    document.getElementById('participantForm').reset();
    document.getElementById('participantScore').value = 0;
    
    const submitBtn = document.querySelector('#participantForm button[type="submit"]');
    submitBtn.innerHTML = '<i class="bi bi-plus-circle me-2"></i>Adicionar Participante';
}

async function deleteParticipant(id) {
    if (!confirm('Tem certeza que deseja remover este participante?')) return;
    
    try {
        const response = await fetch(`${API_URL}/nofap-participants/${id}`, { method: 'DELETE' });
        if (response.ok) {
            await loadParticipants();
        }
    } catch (error) {
        console.error('Erro ao remover participante:', error);
        alert('Erro ao remover participante!');
    }
}

// ========== UI ==========
function updateUI() {
    renderRanking();
    renderParticipantsList();
}

function renderRanking() {
    const container = document.getElementById('rankingList');
    
    if (!container) return;
    
    if (!participants || participants.length === 0) {
        container.innerHTML = '<p class="text-center text-white-50">Nenhum participante cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = participants.map((participant, index) => {
        let rankClass = '';
        let medal = '';
        let badge = '';
        
        if (index === 0) {
            rankClass = 'rank-1';
            medal = '';
        } else if (index === 1) {
            rankClass = 'rank-2';
            medal = '';
        } else if (index === 2) {
            rankClass = 'rank-3';
            medal = '';
        }
        
        // Badge de conquista
        if (participant.score === 30) {
            badge = '<span class="badge bg-success ms-2">COMPLETOU!</span>';
        } else if (participant.score >= 20) {
            badge = '<span class="badge bg-warning ms-2">Quase lá!</span>';
        } else if (participant.score >= 10) {
            badge = '<span class="badge bg-info ms-2">Firme!</span>';
        }
        
        return `
            <div class="ranking-item ${rankClass}">
                <div class="d-flex align-items-center justify-content-between">
                    <div class="d-flex align-items-center gap-3">
                        <span class="fs-4 fw-bold" style="min-width: 50px;">${index + 1}º</span>
                        <div>
                            <h5 class="mb-0 text-white">${participant.name} ${badge}</h5>
                        </div>
                    </div>
                    <div class="text-end">
                        <span class="fs-3 fw-bold text-warning">${participant.score}</span>
                        <small class="d-block text-white-50">dias</small>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function renderParticipantsList() {
    const container = document.getElementById('participantsList');
    
    if (!container) return;
    
    if (!participants || participants.length === 0) {
        container.innerHTML = '<p class="text-center text-white-50">Nenhum participante cadastrado.</p>';
        return;
    }
    
    container.innerHTML = participants.map(participant => `
        <div class="ranking-item">
            <div class="d-flex align-items-center justify-content-between">
                <div>
                    <h5 class="mb-1 text-white">${participant.name}</h5>
                    <small class="text-white-50">${participant.score} dias</small>
                </div>
                <div class="btn-group">
                    <button class="btn btn-sm btn-outline-warning" onclick="editParticipant('${participant.id}')">
                        <i class="bi bi-pencil"></i> Editar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" onclick="deleteParticipant('${participant.id}')">
                        <i class="bi bi-trash"></i> Remover
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}
