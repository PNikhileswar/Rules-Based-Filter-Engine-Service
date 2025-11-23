// Main application entry point

import express from 'express';
import { MemoryRepository } from './repository/memory-repository';
import { RuleService } from './service/rule-service';
import { RuleHandler } from './handler/rule-handler';

const app = express();
const port = process.env.PORT || 8080;

// Middleware
app.use(express.json());

// CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  
  next();
});

// Dependency Injection
const repository = new MemoryRepository();
const service = new RuleService(repository);
const handler = new RuleHandler(service);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    cacheSize: service.getCacheSize(),
  });
});

// Routes
app.post('/rules', handler.createRule);
app.get('/rules', handler.getAllRules);
app.get('/rules/:id', handler.getRule);
app.put('/rules/:id', handler.updateRule);
app.delete('/rules/:id', handler.deleteRule);
app.post('/rules/:id/evaluate', handler.evaluateRule);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Route ${req.method} ${req.path} not found`,
  });
});

// Start server
const server = app.listen(port, () => {
  console.log('🚀 Rules-Based Filter Engine Service starting');
  console.log('📖 API Documentation:');
  console.log('   GET    /health             - Health check');
  console.log('   POST   /rules              - Create a new rule');
  console.log('   GET    /rules              - List all rules');
  console.log('   GET    /rules/:id          - Get a rule by ID');
  console.log('   PUT    /rules/:id          - Update a rule');
  console.log('   DELETE /rules/:id          - Delete a rule');
  console.log('   POST   /rules/:id/evaluate - Evaluate data against a rule');
  console.log('');
  console.log(`Server listening on http://localhost:${port}`);
});

// Graceful shutdown
const shutdown = () => {
  console.log('\n⚠️  Shutting down gracefully...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    console.error('❌ Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
