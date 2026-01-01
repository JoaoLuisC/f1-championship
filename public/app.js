const API_URL = 'http://localhost:3000/api';

let drivers = [];
let races = [];
let editingDriverId = null;
let championships = [];
let currentChampionshipId = null;
let championshipDrivers = [];
let championshipCircuits = [];
let circuits = [];

// ========== INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
});

function setupEventListeners() {
    const driverForm = document.getElementById('driverForm');
    const raceForm = document.getElementById('raceForm');
    
    if (driverForm) {
        driverForm.addEventListener('submit', addDriver);
    }
    
    if (raceForm) {
        raceForm.addEventListener('submit', addRace);
    }
}

async function loadData() {
    await loadChampionships();
    if (currentChampionshipId) {
        await Promise.all([
            loadDrivers(),
            loadRaces(),
            loadCircuits(),
            loadStats()
        ]);
        updateUI();
    }
}

// ========== PILOTOS ==========
async function loadDrivers() {
    if (!currentChampionshipId) {
        drivers = [];
        return;
    }
    try {
        const response = await fetch(`${API_URL}/championships/${currentChampionshipId}/drivers`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        drivers = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Erro ao carregar pilotos:', error);
        drivers = [];
    }
}

async function addDriver(e) {
    e.preventDefault();
    
    if (!currentChampionshipId) {
        return;
    }
    
    const name = document.getElementById('driverName').value;
    const team = document.getElementById('driverTeam').value;
    const number = document.getElementById('driverNumber').value;
    
    try {
        if (editingDriverId) {
            // Modo edição
            const response = await fetch(`${API_URL}/drivers/${editingDriverId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, team, number })
            });
            
            if (response.ok) {
                cancelEdit();
                await loadData();
            }
        } else {
            // Modo adicionar
            const response = await fetch(`${API_URL}/drivers`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, team, number, championshipId: currentChampionshipId })
            });
            
            if (response.ok) {
                e.target.reset();
                await loadData();
            }
        }
    } catch (error) {
        console.error('Erro ao salvar piloto:', error);
    }
}

function editDriver(id) {
    const driver = drivers.find(d => d.id === id);
    if (!driver) return;
    
    editingDriverId = id;
    document.getElementById('driverName').value = driver.name;
    document.getElementById('driverTeam').value = driver.team;
    document.getElementById('driverNumber').value = driver.number;
    
    const form = document.getElementById('driverForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = '✏️ Atualizar Piloto';
    
    // Adicionar botão cancelar se não existir
    let cancelBtn = document.getElementById('cancelEditBtn');
    if (!cancelBtn) {
        cancelBtn = document.createElement('button');
        cancelBtn.id = 'cancelEditBtn';
        cancelBtn.type = 'button';
        cancelBtn.textContent = '❌ Cancelar';
        cancelBtn.className = 'cancel-btn';
        cancelBtn.onclick = cancelEdit;
        submitBtn.after(cancelBtn);
    }
    
    // Scroll para o formulário
    form.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function cancelEdit() {
    editingDriverId = null;
    document.getElementById('driverForm').reset();
    
    const submitBtn = document.querySelector('#driverForm button[type="submit"]');
    submitBtn.textContent = '➕ Adicionar Piloto';
    
    const cancelBtn = document.getElementById('cancelEditBtn');
    if (cancelBtn) {
        cancelBtn.remove();
    }
}

async function deleteDriver(id) {
    
    try {
        await fetch(`${API_URL}/drivers/${id}`, { method: 'DELETE' });
        await loadData();
    } catch (error) {
        console.error('Erro ao remover piloto:', error);
    }
}

// ========== CORRIDAS ==========
async function loadRaces() {
    if (!currentChampionshipId) {
        races = [];
        return;
    }
    try {
        const response = await fetch(`${API_URL}/championships/${currentChampionshipId}/races`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        races = Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Erro ao carregar corridas:', error);
        races = [];
    }
}

async function addRace(e) {
    e.preventDefault();
    
    if (!currentChampionshipId) {
        return;
    }
    
    const circuitSelect = document.getElementById('raceCircuit');
    const circuitId = circuitSelect.value;
    
    if (!circuitId) {
        alert('Selecione um circuito!');
        return;
    }
    
    const circuit = circuits.find(c => c.id === circuitId);
    if (!circuit) {
        return;
    }
    
    const date = document.getElementById('raceDate').value;
    
    const resultsContainer = document.getElementById('raceResults');
    const resultItems = resultsContainer.querySelectorAll('.result-item');
    const results = Array.from(resultItems).map(item => ({
        driverId: item.dataset.driverId,
        dnf: item.querySelector('.dnf-checkbox').checked
    }));
    
    if (results.length === 0) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/races`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                circuitId, 
                circuitName: circuit.name,
                circuitLocation: circuit.location,
                date, 
                results, 
                championshipId: currentChampionshipId 
            })
        });
        
        if (response.ok) {
            e.target.reset();
            document.getElementById('raceResults').innerHTML = '';
            await loadData();
        } else {
            const errorData = await response.json();
            console.error('Erro ao registrar corrida:', errorData.error);
        }
    } catch (error) {
        console.error('Erro ao adicionar corrida:', error);
    }
}

async function deleteRace(id) {
    
    try {
        await fetch(`${API_URL}/races/${id}`, { method: 'DELETE' });
        await loadData();
    } catch (error) {
        console.error('Erro ao remover corrida:', error);
    }
}

// ========== ESTATÍSTICAS ==========
async function loadStats() {
    try {
        const response = await fetch(`${API_URL}/stats`);
        const stats = await response.json();
        
        // Atualizar apenas se os elementos existirem
        const totalDriversEl = document.getElementById('totalDrivers');
        const totalRacesEl = document.getElementById('totalRaces');
        
        if (totalDriversEl) totalDriversEl.textContent = stats.totalDrivers;
        if (totalRacesEl) totalRacesEl.textContent = stats.totalRaces;
    } catch (error) {
        console.error('Erro ao carregar estatísticas:', error);
    }
}

// ========== UI ==========
function updateUI() {
    renderStandings();
    renderDriversList();
    renderRacesList();
    renderRaceResults();
}

function renderStandings() {
    const container = document.getElementById('standingsList');
    
    // Se o elemento não existir, sair silenciosamente
    if (!container) return;
    
    if (!Array.isArray(drivers) || drivers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum piloto cadastrado ainda.</p>';
        return;
    }
    
    container.innerHTML = drivers.map((driver, index) => {
        let className = 'standing-item';
        if (index === 0) className += ' first';
        else if (index === 1) className += ' second';
        else if (index === 2) className += ' third';
        
        return `
            <div class="${className}">
                <div class="position">${index + 1}º</div>
                <div class="driver-info">
                    <h3>${driver.name} #${driver.number}</h3>
                    <p>${driver.team}</p>
                </div>
                <div class="points">${driver.points} pts</div>
                <div class="wins">🏆 ${driver.wins}</div>
                <div class="podiums">🏅 ${driver.podiums}</div>
            </div>
        `;
    }).join('');
}

function renderDriversList() {
    const container = document.getElementById('driversList');
    
    // Se o elemento não existir, sair silenciosamente
    if (!container) return;
    
    if (!Array.isArray(drivers) || drivers.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhum piloto cadastrado.</p>';
        return;
    }
    
    container.innerHTML = drivers.map(driver => `
        <div class="list-item">
            <div>
                <strong>${driver.name}</strong> #${driver.number} - ${driver.team}
                <br>
                <small>${driver.points} pontos | ${driver.wins} vitórias | ${driver.podiums} pódios</small>
            </div>
            <div class="button-group">
                <button class="edit-btn" onclick="editDriver('${driver.id}')">✏️ Editar</button>
                <button class="delete-btn" onclick="deleteDriver('${driver.id}')">🗑️ Remover</button>
            </div>
        </div>
    `).join('');
}

function renderRaceResults() {
    const container = document.getElementById('raceResults');
    
    // Se o elemento não existir, sair silenciosamente
    if (!container) return;
    
    if (!Array.isArray(drivers) || drivers.length === 0) {
        container.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Cadastre pilotos primeiro!</p>';
        return;
    }
    
    if (container.children.length === 0) {
        container.innerHTML = drivers.map((driver, index) => `
            <div class="result-item ${index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : ''}" 
                 data-driver-id="${driver.id}">
                <div class="result-position">${index + 1}</div>
                <div class="result-driver-name">${driver.name} - ${driver.team}</div>
                <div class="result-controls">
                    <label class="dnf-label">
                        <input type="checkbox" class="dnf-checkbox" onchange="toggleDNF(this)">
                        <span>DNF</span>
                    </label>
                    <div class="result-arrows">
                        <button class="arrow-btn" onclick="moveResult(${index}, -1)" ${index === 0 ? 'disabled' : ''}>▲</button>
                        <button class="arrow-btn" onclick="moveResult(${index}, 1)" ${index === drivers.length - 1 ? 'disabled' : ''}>▼</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

function toggleDNF(checkbox) {
    const item = checkbox.closest('.result-item');
    if (checkbox.checked) {
        item.classList.add('dnf-item');
    } else {
        item.classList.remove('dnf-item');
    }
}

function renderRacesList() {
    const container = document.getElementById('racesList');
    
    // Se o elemento não existir, sair silenciosamente
    if (!container) return;
    
    if (!Array.isArray(races) || races.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #666;">Nenhuma corrida registrada ainda.</p>';
        return;
    }
    
    container.innerHTML = races.map(race => {
        const podium = race.results.slice(0, 3).map(result => {
            const driverId = typeof result === 'string' ? result : result.driverId;
            const driver = drivers.find(d => d.id === driverId);
            return driver ? driver.name : 'Desconhecido';
        });
        
        const raceName = race.circuitName || race.name || 'Corrida';
        const raceLocation = race.circuitLocation || race.location || '-';
        
        return `
            <div class="race-item" onclick="showRaceDetails('${race.id}')" style="cursor: pointer;">
                <div class="race-header">
                    <div>
                        <h3>🏁 ${raceName}</h3>
                        <p>📍 ${raceLocation} | 📅 ${new Date(race.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <button class="delete-btn" onclick="event.stopPropagation(); deleteRace('${race.id}')">🗑️</button>
                </div>
                <div class="race-podium">
                    <div class="podium-item podium-1">🥇 ${podium[0] || '-'}</div>
                    <div class="podium-item podium-2">🥈 ${podium[1] || '-'}</div>
                    <div class="podium-item podium-3">🥉 ${podium[2] || '-'}</div>
                </div>
                <p style="text-align: center; margin-top: 10px; color: #667eea; font-size: 0.9em;">👆 Clique para ver todos os resultados</p>
            </div>
        `;
    }).join('');
}

// ========== ORDENAÇÃO COM SETAS ==========
function moveResult(index, direction) {
    const container = document.getElementById('raceResults');
    if (!container) return;
    
    const items = Array.from(container.children);
    if (items.length === 0) {
        return;
    }
    
    const newIndex = index + direction;
    
    if (newIndex < 0 || newIndex >= items.length) return;
    
    // Trocar elementos
    if (direction === -1) {
        items[newIndex].before(items[index]);
    } else {
        items[newIndex].after(items[index]);
    }
    
    updatePositions();
}

function updatePositions() {
    const container = document.getElementById('raceResults');
    if (!container) return;
    
    const items = container.querySelectorAll('.result-item');
    if (items.length === 0) return;
    
    items.forEach((item, index) => {
        const positionEl = item.querySelector('.result-position');
        if (positionEl) {
            positionEl.textContent = index + 1;
        }
        
        item.classList.remove('gold', 'silver', 'bronze');
        if (index === 0) item.classList.add('gold');
        else if (index === 1) item.classList.add('silver');
        else if (index === 2) item.classList.add('bronze');
        
        // Atualizar botões
        const upBtn = item.querySelectorAll('.arrow-btn')[0];
        const downBtn = item.querySelectorAll('.arrow-btn')[1];
        
        if (upBtn && downBtn) {
            upBtn.disabled = index === 0;
            downBtn.disabled = index === items.length - 1;
            upBtn.onclick = () => moveResult(index, -1);
            downBtn.onclick = () => moveResult(index, 1);
        }
    });
}

// ========== MODAL DETALHES DA CORRIDA ==========
function showRaceDetails(raceId) {
    const race = races.find(r => r.id === raceId);
    if (!race) return;
    
    const modalRaceName = document.getElementById('modalRaceName');
    const modalRaceInfo = document.getElementById('modalRaceInfo');
    const modalRaceResults = document.getElementById('modalRaceResults');
    const raceModal = document.getElementById('raceModal');
    
    if (!modalRaceName || !modalRaceInfo || !modalRaceResults || !raceModal) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    const raceName = race.circuitName || race.name || 'Corrida';
    const raceLocation = race.circuitLocation || race.location || '-';
    
    modalRaceName.textContent = `🏁 ${raceName}`;
    modalRaceInfo.textContent = `📍 ${raceLocation} | 📅 ${new Date(race.date).toLocaleDateString('pt-BR')}`;
    
    const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    const resultsHTML = race.results.map((result, index) => {
        const driverId = typeof result === 'string' ? result : result.driverId;
        const isDNF = result.dnf || false;
        const driver = drivers.find(d => d.id === driverId);
        const points = isDNF ? 0 : (pointsSystem[index] || 0);
        const medal = !isDNF && index === 0 ? '🥇' : !isDNF && index === 1 ? '🥈' : !isDNF && index === 2 ? '🥉' : '';
        
        return `
            <div class="modal-result-item ${!isDNF && index < 3 ? 'podium-position' : ''} ${isDNF ? 'dnf-result' : ''}">
                <div class="modal-position">${medal} ${index + 1}º</div>
                <div class="modal-driver">
                    <strong>${driver ? driver.name : 'Desconhecido'}</strong>
                    <span>${driver ? driver.team : '-'}</span>
                    ${isDNF ? '<span class="dnf-badge">DNF</span>' : ''}
                </div>
                <div class="modal-points">${isDNF ? 'DNF' : points + ' pts'}</div>
            </div>
        `;
    }).join('');
    
    modalRaceResults.innerHTML = resultsHTML;
    raceModal.style.display = 'block';
}

function closeRaceModal() {
    const raceModal = document.getElementById('raceModal');
    if (raceModal) {
        raceModal.style.display = 'none';
    }
}

// Fechar modal ao clicar fora
window.onclick = function(event) {
    const modal = document.getElementById('raceModal');
    if (event.target === modal) {
        closeRaceModal();
    }
}

// ========== TABS ==========
function showTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    
    event.target.classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// ========== CAMPEONATOS ==========
async function loadChampionships() {
    try {
        const response = await fetch(`${API_URL}/championships`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        championships = await response.json();
        renderChampionshipSelect();
        
        if (championships.length > 0 && !currentChampionshipId) {
            currentChampionshipId = championships[0].id;
            document.getElementById('championshipSelect').value = currentChampionshipId;
        }
    } catch (error) {
        console.error('Erro ao carregar campeonatos:', error);
        championships = [];
        renderChampionshipSelect();
    }
}

function renderChampionshipSelect() {
    const select = document.getElementById('championshipSelect');
    select.innerHTML = '<option value="">Selecione um campeonato...</option>' +
        championships.map(c => `<option value="${c.id}" ${c.id === currentChampionshipId ? 'selected' : ''}>${c.name}</option>`).join('');
}

function changeChampionship() {
    const select = document.getElementById('championshipSelect');
    currentChampionshipId = select.value || null;
    
    if (currentChampionshipId) {
        loadData();
    } else {
        drivers = [];
        races = [];
        circuits = [];
        updateUI();
    }
}

async function loadCircuits() {
    if (!currentChampionshipId) {
        circuits = [];
        return;
    }
    try {
        const response = await fetch(`${API_URL}/championships/${currentChampionshipId}/circuits`);
        if (!response.ok) {
            console.warn('Nenhum circuito encontrado ou erro ao carregar');
            circuits = [];
            return;
        }
        const data = await response.json();
        circuits = Array.isArray(data) ? data : [];
        renderCircuitSelect();
    } catch (error) {
        console.error('Erro ao carregar circuitos:', error);
        circuits = [];
    }
}

function renderCircuitSelect() {
    const raceCircuit = document.getElementById('raceCircuit');
    
    if (!raceCircuit) return;
    
    if (!Array.isArray(circuits) || circuits.length === 0) {
        raceCircuit.innerHTML = '<option value="">⚠️ Cadastre circuitos no campeonato primeiro</option>';
        raceCircuit.disabled = true;
        return;
    }
    
    raceCircuit.disabled = false;
    raceCircuit.innerHTML = '<option value="">Selecione um circuito...</option>' +
        circuits.map(c => `<option value="${c.id}" data-name="${c.name}" data-location="${c.location}">${c.name} - ${c.location}</option>`).join('');
}

function showNewChampionshipForm() {
    championshipDrivers = [];
    championshipCircuits = [];
    
    const form = document.getElementById('newChampionshipForm');
    const nameInput = document.getElementById('championshipName');
    const driversListEl = document.getElementById('championshipDriversList');
    const circuitsListEl = document.getElementById('championshipCircuitsList');
    
    if (!form || !nameInput || !driversListEl || !circuitsListEl) {
        console.error('Elementos do formulário de campeonato não encontrados');
        return;
    }
    
    form.style.display = 'block';
    nameInput.value = '';
    driversListEl.innerHTML = '';
    circuitsListEl.innerHTML = '';
    nameInput.focus();
    
    // Adicionar campos iniciais
    addChampionshipDriver();
    addChampionshipCircuit();
}

// Alias para a função do botão no HTML
function showNewChampionshipModal() {
    showNewChampionshipForm();
}

function cancelNewChampionship() {
    const form = document.getElementById('newChampionshipForm');
    const nameInput = document.getElementById('championshipName');
    
    if (form) form.style.display = 'none';
    if (nameInput) nameInput.value = '';
    
    championshipDrivers = [];
    championshipCircuits = [];
}

function addChampionshipDriver() {
    const container = document.getElementById('championshipDriversList');
    
    if (!container) {
        console.error('Container championshipDriversList não encontrado');
        return;
    }
    
    const index = championshipDrivers.length;
    
    const driverItem = document.createElement('div');
    driverItem.className = 'dynamic-item';
    driverItem.innerHTML = `
        <input type="text" placeholder="Nome do Piloto" class="driver-name" required>
        <input type="text" placeholder="Equipe" class="driver-team" required>
        <input type="number" placeholder="Número" class="driver-number" min="1" max="999" required>
        <button type="button" onclick="removeChampionshipDriver(${index})" class="btn-remove">❌</button>
    `;
    
    container.appendChild(driverItem);
    championshipDrivers.push({ index });
}

function removeChampionshipDriver(index) {
    const container = document.getElementById('championshipDriversList');
    const items = container.querySelectorAll('.dynamic-item');
    if (items.length > 1) {
        items[index].remove();
        championshipDrivers.splice(index, 1);
        updateDriverIndices();
    }
}

function updateDriverIndices() {
    const container = document.getElementById('championshipDriversList');
    const items = container.querySelectorAll('.dynamic-item');
    championshipDrivers = [];
    items.forEach((item, index) => {
        championshipDrivers.push({ index });
        const btn = item.querySelector('.btn-remove');
        btn.onclick = () => removeChampionshipDriver(index);
    });
}

function addChampionshipCircuit() {
    const container = document.getElementById('championshipCircuitsList');
    
    if (!container) {
        console.error('Container championshipCircuitsList não encontrado');
        return;
    }
    
    const index = championshipCircuits.length;
    
    const circuitItem = document.createElement('div');
    circuitItem.className = 'dynamic-item';
    circuitItem.innerHTML = `
        <input type="text" placeholder="Nome do Circuito" class="circuit-name" required>
        <input type="text" placeholder="Localização" class="circuit-location" required>
        <button type="button" onclick="removeChampionshipCircuit(${index})" class="btn-remove">❌</button>
    `;
    
    container.appendChild(circuitItem);
    championshipCircuits.push({ index });
}

function removeChampionshipCircuit(index) {
    const container = document.getElementById('championshipCircuitsList');
    const items = container.querySelectorAll('.dynamic-item');
    if (items.length > 1) {
        items[index].remove();
        championshipCircuits.splice(index, 1);
        updateCircuitIndices();
    }
}

function updateCircuitIndices() {
    const container = document.getElementById('championshipCircuitsList');
    const items = container.querySelectorAll('.dynamic-item');
    championshipCircuits = [];
    items.forEach((item, index) => {
        championshipCircuits.push({ index });
        const btn = item.querySelector('.btn-remove');
        btn.onclick = () => removeChampionshipCircuit(index);
    });
}

async function createChampionship() {
    console.log('createChampionship chamada');
    const name = document.getElementById('championshipName').value.trim();
    
    if (!name) {
        alert('Digite um nome para o campeonato!');
        return;
    }
    
    console.log('Nome do campeonato:', name);
    
    // Coletar pilotos
    const driversContainer = document.getElementById('championshipDriversList');
    const driverItems = driversContainer.querySelectorAll('.dynamic-item');
    const drivers = [];
    
    for (const item of driverItems) {
        const driverName = item.querySelector('.driver-name').value.trim();
        const team = item.querySelector('.driver-team').value.trim();
        const number = item.querySelector('.driver-number').value;
        
        if (driverName && team && number) {
            drivers.push({ name: driverName, team, number: parseInt(number) });
        }
    }
    
    console.log('Pilotos coletados:', drivers);
    
    // Coletar circuitos
    const circuitsContainer = document.getElementById('championshipCircuitsList');
    const circuitItems = circuitsContainer.querySelectorAll('.dynamic-item');
    const circuits = [];
    
    for (const item of circuitItems) {
        const circuitName = item.querySelector('.circuit-name').value.trim();
        const location = item.querySelector('.circuit-location').value.trim();
        
        if (circuitName && location) {
            circuits.push({ name: circuitName, location });
        }
    }
    
    console.log('Circuitos coletados:', circuits);
    console.log('Enviando para API:', { name, drivers, circuits });
    
    try {
        const response = await fetch(`${API_URL}/championships`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, drivers, circuits })
        });
        
        if (response.ok) {
            const result = await response.json();
            currentChampionshipId = result.id;
            await loadChampionships();
            cancelNewChampionship();
            await loadData();
        } else {
            const errorData = await response.json();
            console.error('Erro do servidor:', errorData);
        }
    } catch (error) {
        console.error('Erro ao criar campeonato:', error);
    }
}
