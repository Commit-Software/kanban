import { knex, initializeDb } from '../src/db/index.js';
import { randomUUID } from 'crypto';

const agents = ['nick', 'aria', 'zen', 'bolt'];
const models = ['claude-sonnet-4', 'claude-opus-4.5', 'claude-haiku-4.5', 'gpt-4o'];

// Cost per 1K tokens
const modelCosts: Record<string, { input: number; output: number }> = {
  'claude-opus-4.5': { input: 0.015, output: 0.075 },
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
  'claude-haiku-4.5': { input: 0.0008, output: 0.004 },
  'gpt-4o': { input: 0.005, output: 0.015 },
};

const taskTitles = [
  'Implement user authentication',
  'Fix pagination bug',
  'Add dark mode support',
  'Refactor database queries',
  'Write API documentation',
  'Set up CI/CD pipeline',
  'Optimize image loading',
  'Add email notifications',
  'Create admin dashboard',
  'Implement search feature',
  'Fix memory leak',
  'Add unit tests',
  'Update dependencies',
  'Implement caching layer',
  'Add analytics tracking',
];

const seed = async () => {
  await initializeDb();
  
  console.log('🌱 Seeding usage data...');
  
  // Generate 20 completed tasks with usage data over the last 14 days
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  
  for (let i = 0; i < 20; i++) {
    const agent = agents[Math.floor(Math.random() * agents.length)];
    const model = models[Math.floor(Math.random() * models.length)];
    const title = taskTitles[Math.floor(Math.random() * taskTitles.length)];
    
    // Random usage (realistic ranges)
    const inputTokens = Math.floor(Math.random() * 15000) + 500;
    const outputTokens = Math.floor(Math.random() * 5000) + 200;
    const costs = modelCosts[model];
    const costUsd = (inputTokens / 1000) * costs.input + (outputTokens / 1000) * costs.output;
    
    // Random date in last 14 days
    const daysAgo = Math.floor(Math.random() * 14);
    const taskDate = new Date(now - daysAgo * day);
    const isoDate = taskDate.toISOString();
    
    await knex('tasks').insert({
      id: randomUUID(),
      title: `${title} #${i + 1}`,
      description: `Task completed by ${agent} using ${model}`,
      status: 'done',
      priority: Math.floor(Math.random() * 5) + 1,
      skills_required: JSON.stringify(['coding']),
      claimed_by: agent,
      claimed_at: isoDate,
      timeout_minutes: 30,
      parent_task_id: null,
      output: JSON.stringify({ result: 'success' }),
      blocked_reason: null,
      due_date: null,
      usage_input_tokens: inputTokens,
      usage_output_tokens: outputTokens,
      usage_model: model,
      usage_cost_usd: Math.round(costUsd * 1000) / 1000,
      created_by: 'system',
      created_at: isoDate,
      updated_at: isoDate,
    });
    
    // Also log an activity
    await knex('activities').insert({
      id: randomUUID(),
      type: 'task_completed',
      agent_id: agent,
      task_id: null,
      task_title: `${title} #${i + 1}`,
      details: JSON.stringify({ has_output: true }),
      created_at: isoDate,
    });
    
    console.log(`  ✅ ${title} #${i + 1} (${agent}, ${model})`);
  }
  
  // Add agent settings
  for (const agent of agents) {
    const model = models[Math.floor(Math.random() * models.length)];
    await knex('agent_settings')
      .insert({
        agent_id: agent,
        model,
        budget_limit_usd: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .onConflict('agent_id')
      .merge();
    console.log(`  🤖 ${agent} → ${model}`);
  }
  
  console.log('\n✨ Done! 20 tasks with usage data seeded.');
  await knex.destroy();
};

seed().catch(console.error);
