# 🏎️ Campeonato de Fórmula 1 - Resenha entre Amigos

Sistema completo para gerenciar campeonatos de F1 entre amigos com banco de dados Firebase gratuito.

## 🚀 Como Configurar

### 1. Criar conta no Firebase (GRATUITO)

1. Acesse https://console.firebase.google.com/
2. Clique em "Adicionar projeto"
3. Dê um nome (ex: "f1-campeonato")
4. Desabilite o Google Analytics (não é necessário)
5. Clique em "Criar projeto"

### 2. Configurar Firestore

1. No menu lateral, clique em "Firestore Database"
2. Clique em "Criar banco de dados"
3. Escolha "Iniciar no modo de produção"
4. Escolha a localização (ex: southamerica-east1)
5. Clique em "Ativar"

### 3. Obter credenciais

1. Clique no ícone de engrenagem ⚙️ > "Configurações do projeto"
2. Vá na aba "Contas de serviço"
3. Clique em "Gerar nova chave privada"
4. Salve o arquivo JSON baixado

### 4. Configurar regras do Firestore (IMPORTANTE)

1. No Firestore, clique em "Regras"
2. Cole estas regras:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Clique em "Publicar"

**⚠️ ATENÇÃO**: Estas regras permitem acesso total. Para produção real, configure regras mais seguras!

### 5. Instalar dependências

```bash
cd f1-championship
npm install
```

### 6. Configurar variáveis de ambiente

1. Copie o arquivo `.env.example` para `.env`:
```bash
copy .env.example .env
```

2. Abra o arquivo JSON que você baixou do Firebase
3. Edite o arquivo `.env` com os dados:

```env
PORT=3000
FIREBASE_PROJECT_ID=seu-projeto-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@seu-projeto.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nSUA_CHAVE_AQUI\n-----END PRIVATE KEY-----\n"
```

### 7. Iniciar o servidor

```bash
npm start
```

Acesse: http://localhost:3000

## 📋 Funcionalidades

✅ **Gerenciar Pilotos**
- Adicionar pilotos com nome, equipe e número
- Visualizar estatísticas (pontos, vitórias, pódios)
- Remover pilotos

✅ **Registrar Corridas**
- Adicionar corridas com nome, local e data
- Definir resultado com drag-and-drop
- Sistema de pontuação oficial da F1
- Histórico de todas as corridas

✅ **Classificação**
- Ranking atualizado automaticamente
- Destaque para top 3
- Visualização de pontos, vitórias e pódios

## 🏆 Sistema de Pontuação F1

- 1º lugar: 25 pontos
- 2º lugar: 18 pontos
- 3º lugar: 15 pontos
- 4º lugar: 12 pontos
- 5º lugar: 10 pontos
- 6º lugar: 8 pontos
- 7º lugar: 6 pontos
- 8º lugar: 4 pontos
- 9º lugar: 2 pontos
- 10º lugar: 1 ponto

## 🎮 Como Usar

1. **Primeiro**: Cadastre os pilotos na aba "Pilotos"
2. **Depois**: Registre as corridas na aba "Corridas"
   - Arraste os pilotos para ordenar o resultado
   - Sistema calcula pontos automaticamente
3. **Acompanhe**: Veja a classificação na aba "Classificação"

## 💾 Banco de Dados

Os dados são salvos automaticamente no Firebase Firestore (gratuito):
- ✅ Persistente (dados não se perdem)
- ✅ Grátis até 1GB de dados
- ✅ Acesso de qualquer lugar
- ✅ Backup automático

## 🔧 Scripts Disponíveis

```bash
npm start     # Inicia o servidor
npm run dev   # Inicia com auto-reload (nodemon)
```

## 📱 Responsivo

Interface adaptada para celular e desktop!

## 🆘 Problemas Comuns

**Erro de conexão com Firebase:**
- Verifique se copiou corretamente as credenciais
- Confirme que as regras do Firestore estão publicadas
- Verifique se o projeto está ativo no console

**Pilotos não aparecem:**
- Certifique-se de cadastrar pilotos antes de registrar corridas
- Verifique o console do navegador (F12) para erros

## 📄 Licença

MIT - Use à vontade! 🏎️💨
