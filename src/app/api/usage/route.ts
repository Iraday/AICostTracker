import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper to get appdata
const getAppDataPath = () => process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
const getHomePath = () => process.env.USERPROFILE || process.env.HOME || '';

export async function GET() {
  const usageData = {
    openai: { limit: 0, used: 0, refreshTime: 'Unknown' },
    claude: { limit: 45, used: 0, refreshTime: 'Unknown' }, // Claude Pro default limit
    antigravity: { limit: 1000000, used: 0, refreshTime: 'Daily' }, // Gemini API typical quota
  };

  // 1. OpenAI (Codex / API)
  // To test this properly, we try to fetch usage using the OPENAI_API_KEY if present.
  if (process.env.OPENAI_API_KEY) {
    try {
      // Mocking or fetching real usage limits
      // We will make a dummy request to get rate limit headers
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
      });
      const limit = res.headers.get('x-ratelimit-limit-requests');
      const remaining = res.headers.get('x-ratelimit-remaining-requests');
      const reset = res.headers.get('x-ratelimit-reset-requests');
      if (limit) usageData.openai.limit = parseInt(limit, 10);
      if (remaining && limit) usageData.openai.used = parseInt(limit, 10) - parseInt(remaining, 10);
      if (reset) usageData.openai.refreshTime = reset;
    } catch (e) {
      console.error('OpenAI Error:', e);
    }
  } else {
    // Dummy fallback for testing
    usageData.openai = { limit: 10000, used: 1200, refreshTime: '12h 30m' };
  }

  // 2. Claude Desktop Logs
  const claudeLogPath = path.join(getAppDataPath(), 'Claude', 'logs', 'claude.ai-web.log');
  if (fs.existsSync(claudeLogPath)) {
    try {
      const claudeLogs = fs.readFileSync(claudeLogPath, 'utf8');
      // Look for custom tracking (e.g. limit reached, rate limit headers logged)
      // Usually, when 429 occurs, it logs an error with 'resetsAt'.
      const resetMatch = claudeLogs.match(/resetsAt["': ]+(\d{10,13})/);
      if (resetMatch) {
        const resetDate = new Date(parseInt(resetMatch[1]));
        usageData.claude.refreshTime = resetDate.toLocaleTimeString();
        usageData.claude.used = usageData.claude.limit; // Assuming we hit the limit
      } else {
        // Just a mock increment based on lines in log
        const lines = claudeLogs.split('\n').length;
        usageData.claude.used = Math.min(lines, usageData.claude.limit);
        usageData.claude.refreshTime = '5 Hours (Rolling)';
      }
    } catch (e) {
      console.error('Claude Log Error:', e);
    }
  }

  // 3. Google Antigravity
  // Count transcript files in the brain folder as proxy for 'usage'
  const antigravityPath = path.join(getHomePath(), '.gemini', 'antigravity', 'brain');
  if (fs.existsSync(antigravityPath)) {
    try {
      const dirs = fs.readdirSync(antigravityPath);
      let stepCount = 0;
      for (const dir of dirs) {
        const transcriptPath = path.join(antigravityPath, dir, '.system_generated', 'logs', 'transcript.jsonl');
        if (fs.existsSync(transcriptPath)) {
           const transcript = fs.readFileSync(transcriptPath, 'utf8');
           stepCount += transcript.split('\n').filter(l => l.trim().length > 0).length;
        }
      }
      usageData.antigravity.used = stepCount; // 1 step = 1 usage proxy
      // Assuming a mock limit for demo purposes since Antigravity has no hard local limit
      usageData.antigravity.limit = 50000;
      usageData.antigravity.refreshTime = 'Never (Local)';
    } catch (e) {
      console.error('Antigravity Error:', e);
    }
  }

  return NextResponse.json(usageData);
}
