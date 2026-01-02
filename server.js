require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Configurar Firebase
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
  })
});

const db = admin.firestore();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// ========== ROTAS DE CAMPEONATOS ==========
app.get('/api/championships', async (req, res) => {
  try {
    const snapshot = await db.collection('championships').get();
    const championships = [];
    snapshot.forEach(doc => {
      championships.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar no backend
    championships.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    res.json(championships);
  } catch (error) {
    console.error('Erro ao buscar championships:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/championships', async (req, res) => {
  try {
    const { name, drivers, circuits } = req.body;
    
    // Criar campeonato
    const championshipRef = await db.collection('championships').add({
      name,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    const championshipId = championshipRef.id;
    
    // Adicionar pilotos se fornecidos
    if (drivers && drivers.length > 0) {
      const batch = db.batch();
      drivers.forEach(driver => {
        const driverRef = db.collection('drivers').doc();
        batch.set(driverRef, {
          name: driver.name,
          team: driver.team,
          number: parseInt(driver.number),
          championshipId: championshipId,
          points: 0,
          wins: 0,
          podiums: 0,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
    }
    
    // Adicionar circuitos se fornecidos
    if (circuits && circuits.length > 0) {
      const batch = db.batch();
      circuits.forEach(circuit => {
        const circuitRef = db.collection('circuits').doc();
        batch.set(circuitRef, {
          name: circuit.name,
          location: circuit.location,
          championshipId: championshipId,
          createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
      });
      await batch.commit();
    }
    
    res.json({ 
      id: championshipId, 
      message: 'Campeonato criado!',
      driversCount: drivers?.length || 0,
      circuitsCount: circuits?.length || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ROTAS DE CIRCUITOS ==========
app.get('/api/championships/:championshipId/circuits', async (req, res) => {
  try {
    const snapshot = await db.collection('circuits')
      .where('championshipId', '==', req.params.championshipId)
      .get();
    const circuits = [];
    snapshot.forEach(doc => {
      circuits.push({ id: doc.id, ...doc.data() });
    });
    res.json(circuits);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ROTAS DE PILOTOS ==========
app.get('/api/championships/:championshipId/drivers', async (req, res) => {
  try {
    const snapshot = await db.collection('drivers')
      .where('championshipId', '==', req.params.championshipId)
      .get();
    const drivers = [];
    snapshot.forEach(doc => {
      drivers.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar no backend
    drivers.sort((a, b) => (b.points || 0) - (a.points || 0));
    res.json(drivers);
  } catch (error) {
    console.error('Erro ao buscar drivers:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/drivers', async (req, res) => {
  try {
    const snapshot = await db.collection('drivers').orderBy('points', 'desc').get();
    const drivers = [];
    snapshot.forEach(doc => {
      drivers.push({ id: doc.id, ...doc.data() });
    });
    res.json(drivers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/drivers', async (req, res) => {
  try {
    const { name, team, number, championshipId } = req.body;
    const driverRef = await db.collection('drivers').add({
      name,
      team,
      number: parseInt(number),
      championshipId,
      points: 0,
      wins: 0,
      podiums: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: driverRef.id, message: 'Piloto adicionado!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/drivers/:id', async (req, res) => {
  try {
    const { name, team, number } = req.body;
    await db.collection('drivers').doc(req.params.id).update({
      name,
      team,
      number: parseInt(number),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ message: 'Piloto atualizado!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/drivers/:id', async (req, res) => {
  try {
    await db.collection('drivers').doc(req.params.id).delete();
    res.json({ message: 'Piloto removido!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ROTAS DE CORRIDAS ==========
app.get('/api/championships/:championshipId/races', async (req, res) => {
  try {
    const snapshot = await db.collection('races')
      .where('championshipId', '==', req.params.championshipId)
      .get();
    const races = [];
    snapshot.forEach(doc => {
      races.push({ id: doc.id, ...doc.data() });
    });
    // Ordenar no backend
    races.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json(races);
  } catch (error) {
    console.error('Erro ao buscar races:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/races', async (req, res) => {
  try {
    const snapshot = await db.collection('races').orderBy('date', 'desc').get();
    const races = [];
    snapshot.forEach(doc => {
      races.push({ id: doc.id, ...doc.data() });
    });
    res.json(races);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/races', async (req, res) => {
  try {
    const { circuitId, circuitName, circuitLocation, date, results, championshipId } = req.body;
    
    // Sistema de pontuação F1
    const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
    
    // Atualizar pontos dos pilotos
    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const driverId = typeof result === 'string' ? result : result.driverId;
      const isDNF = result.dnf || false;
      const points = isDNF ? 0 : (pointsSystem[i] || 0);
      
      const driverRef = db.collection('drivers').doc(driverId);
      const driverDoc = await driverRef.get();
      
      if (driverDoc.exists) {
        const currentData = driverDoc.data();
        await driverRef.update({
          points: (currentData.points || 0) + points,
          wins: !isDNF && i === 0 ? (currentData.wins || 0) + 1 : (currentData.wins || 0),
          podiums: !isDNF && i < 3 ? (currentData.podiums || 0) + 1 : (currentData.podiums || 0)
        });
      }
    }
    
    // Salvar corrida
    const raceRef = await db.collection('races').add({
      circuitId,
      circuitName,
      circuitLocation,
      date,
      results,
      championshipId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    res.json({ id: raceRef.id, message: 'Corrida registrada!' });
  } catch (error) {
    console.error('Erro ao registrar corrida:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/races/:id', async (req, res) => {
  try {
    const raceDoc = await db.collection('races').doc(req.params.id).get();
    
    if (raceDoc.exists) {
      const race = raceDoc.data();
      const pointsSystem = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];
      
      // Reverter pontos
      for (let i = 0; i < race.results.length; i++) {
        const result = race.results[i];
        const driverId = typeof result === 'string' ? result : result.driverId;
        const isDNF = result.dnf || false;
        const points = isDNF ? 0 : (pointsSystem[i] || 0);
        
        const driverRef = db.collection('drivers').doc(driverId);
        const driverDoc = await driverRef.get();
        
        if (driverDoc.exists) {
          const currentData = driverDoc.data();
          await driverRef.update({
            points: Math.max(0, (currentData.points || 0) - points),
            wins: !isDNF && i === 0 ? Math.max(0, (currentData.wins || 0) - 1) : (currentData.wins || 0),
            podiums: !isDNF && i < 3 ? Math.max(0, (currentData.podiums || 0) - 1) : (currentData.podiums || 0)
          });
        }
      }
    }
    
    await db.collection('races').doc(req.params.id).delete();
    res.json({ message: 'Corrida removida!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ESTATÍSTICAS ==========
app.get('/api/stats', async (req, res) => {
  try {
    const driversSnapshot = await db.collection('drivers').get();
    const racesSnapshot = await db.collection('races').get();
    
    res.json({
      totalDrivers: driversSnapshot.size,
      totalRaces: racesSnapshot.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CAMPEONATOS DE COCO ==========
app.get('/api/coco-championships', async (req, res) => {
  try {
    const snapshot = await db.collection('coco-championships').get();
    const championships = [];
    snapshot.forEach(doc => {
      championships.push({ id: doc.id, ...doc.data() });
    });
    championships.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    res.json(championships);
  } catch (error) {
    console.error('Erro ao buscar campeonatos de coco:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coco-championships', async (req, res) => {
  try {
    const { name, type } = req.body;
    const championshipRef = await db.collection('coco-championships').add({
      name,
      type: type || 'coco',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: championshipRef.id, message: 'Campeonato de coco criado!' });
  } catch (error) {
    console.error('Erro ao criar campeonato de coco:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/coco-championships/:championshipId/participants', async (req, res) => {
  try {
    const snapshot = await db.collection('coco-participants')
      .where('championshipId', '==', req.params.championshipId)
      .get();
    const participants = [];
    snapshot.forEach(doc => {
      participants.push({ id: doc.id, ...doc.data() });
    });
    participants.sort((a, b) => (b.score || 0) - (a.score || 0));
    res.json(participants);
  } catch (error) {
    console.error('Erro ao buscar participantes de coco:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coco-participants', async (req, res) => {
  try {
    const { name, score, championshipId } = req.body;
    const participantRef = await db.collection('coco-participants').add({
      name,
      score: parseInt(score) || 0,
      championshipId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: participantRef.id, message: 'Participante adicionado!' });
  } catch (error) {
    console.error('Erro ao adicionar participante de coco:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/coco-participants/:id', async (req, res) => {
  try {
    const { name, score } = req.body;
    await db.collection('coco-participants').doc(req.params.id).update({
      name,
      score: parseInt(score) || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ message: 'Participante atualizado!' });
  } catch (error) {
    console.error('Erro ao atualizar participante de coco:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/coco-participants/:id', async (req, res) => {
  try {
    await db.collection('coco-participants').doc(req.params.id).delete();
    res.json({ message: 'Participante removido!' });
  } catch (error) {
    console.error('Erro ao remover participante de coco:', error);
    res.status(500).json({ error: error.message });
  }
});

// ========== CAMPEONATOS DE NOFAP ==========
app.get('/api/nofap-championships', async (req, res) => {
  try {
    const snapshot = await db.collection('nofap-championships').get();
    const championships = [];
    snapshot.forEach(doc => {
      championships.push({ id: doc.id, ...doc.data() });
    });
    championships.sort((a, b) => {
      const dateA = a.createdAt?.toDate?.() || new Date(0);
      const dateB = b.createdAt?.toDate?.() || new Date(0);
      return dateB - dateA;
    });
    res.json(championships);
  } catch (error) {
    console.error('Erro ao buscar desafios de nofap:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nofap-championships', async (req, res) => {
  try {
    const { name, type } = req.body;
    const championshipRef = await db.collection('nofap-championships').add({
      name,
      type: type || 'nofap',
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: championshipRef.id, message: 'Desafio NoFap criado!' });
  } catch (error) {
    console.error('Erro ao criar desafio de nofap:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/nofap-championships/:championshipId/participants', async (req, res) => {
  try {
    const snapshot = await db.collection('nofap-participants')
      .where('championshipId', '==', req.params.championshipId)
      .get();
    const participants = [];
    snapshot.forEach(doc => {
      participants.push({ id: doc.id, ...doc.data() });
    });
    participants.sort((a, b) => (b.score || 0) - (a.score || 0));
    res.json(participants);
  } catch (error) {
    console.error('Erro ao buscar participantes de nofap:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/nofap-participants', async (req, res) => {
  try {
    const { name, score, championshipId } = req.body;
    const participantRef = await db.collection('nofap-participants').add({
      name,
      score: parseInt(score) || 0,
      championshipId,
      createdAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ id: participantRef.id, message: 'Participante adicionado!' });
  } catch (error) {
    console.error('Erro ao adicionar participante de nofap:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/nofap-participants/:id', async (req, res) => {
  try {
    const { name, score } = req.body;
    await db.collection('nofap-participants').doc(req.params.id).update({
      name,
      score: parseInt(score) || 0,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    res.json({ message: 'Participante atualizado!' });
  } catch (error) {
    console.error('Erro ao atualizar participante de nofap:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/nofap-participants/:id', async (req, res) => {
  try {
    await db.collection('nofap-participants').doc(req.params.id).delete();
    res.json({ message: 'Participante removido!' });
  } catch (error) {
    console.error('Erro ao remover participante de nofap:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🏎️  Servidor rodando em http://localhost:${PORT}`);
});
