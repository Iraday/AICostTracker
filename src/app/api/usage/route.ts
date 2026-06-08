import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Target times based on the exact limits from your real Claude account
const SESSION_RESET_TIME = new Date(Date.now() + (3 * 3600000) + (12 * 60000));
const WEEKLY_RESET_TIME = new Date(Date.now() + (8 * 3600000) + (22 * 60000));

function getTimeRemaining(targetDate: Date): string {
  const now = new Date();
  const diffMs = targetDate.getTime() - now.getTime();
  
  if (diffMs <= 0) return 'Resets now';
  
  const diffMins = Math.floor(diffMs / 60000);
  const hrs = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  
  if (hrs > 0) return `Resets in ${hrs} hr ${mins} min`;
  return `Resets in ${mins} min`;
}

const DATA_FILE = path.join(process.cwd(), 'claude_data.json');

export async function GET() {
  const usageData = {
    openai: { 
      limits: [
        { label: '5h', usedPercentage: 2, resetText: '11:09 PM' },
        { label: 'Weekly', usedPercentage: 94, resetText: 'Jun 11' }
      ]
    },
    claude: { 
      limits: [
        { label: 'Current session', usedPercentage: 100, resetText: getTimeRemaining(SESSION_RESET_TIME) },
        { label: 'All models', usedPercentage: 49, resetText: getTimeRemaining(WEEKLY_RESET_TIME) }
      ]
    },
    antigravity: { 
      limits: [
        { label: 'Daily', usedPercentage: 15, resetText: 'Resets in 5 hr' }
      ]
    },
  };

  // Check if we have live data from the extension!
  if (fs.existsSync(DATA_FILE)) {
    try {
      const stats = fs.statSync(DATA_FILE);
      const fileMtime = stats.mtimeMs;
      
      const fileContent = fs.readFileSync(DATA_FILE, 'utf-8');
      const lines = fileContent.split('\n').filter(Boolean);
      // Read backwards to get the most recent scrape
      for (let i = lines.length - 1; i >= 0; i--) {
        const payload = JSON.parse(lines[i]);
        
        // 1. Precise API Intercept parsing (Anthropic's exact schema)
        if (payload.five_hour && payload.seven_day) {
          usageData.claude.limits[0].resetText = getTimeRemaining(new Date(payload.five_hour.resets_at));
          usageData.claude.limits[0].usedPercentage = payload.five_hour.utilization;
          usageData.claude.limits[1].resetText = getTimeRemaining(new Date(payload.seven_day.resets_at));
          usageData.claude.limits[1].usedPercentage = payload.seven_day.utilization;
          break; // Found the perfect payload!
        }
        
        // 2. Fallback: DOM Scrape parsing
        if (payload.type === "DOM_SCRAPE") {
          const receivedAt = payload.receivedAt || fileMtime;
          
          const parseTimeStr = (str: string) => {
             let hrs = 0, mins = 0;
             const hrMatch = str.match(/(\d+)\s*hr/);
             const minMatch = str.match(/(\d+)\s*min/);
             if (hrMatch) hrs = parseInt(hrMatch[1], 10);
             if (minMatch) mins = parseInt(minMatch[1], 10);
             return (hrs * 3600000) + (mins * 60000);
          };
          
          const sessionTarget = new Date(receivedAt + parseTimeStr(payload.session.resetText));
          const weeklyTarget = new Date(receivedAt + parseTimeStr(payload.weekly.resetText));
          
          usageData.claude.limits[0].resetText = getTimeRemaining(sessionTarget);
          usageData.claude.limits[0].usedPercentage = payload.session.usedPercentage;
          usageData.claude.limits[1].resetText = getTimeRemaining(weeklyTarget);
          usageData.claude.limits[1].usedPercentage = payload.weekly.usedPercentage;
          break;
        }
      }
    } catch(e) {
      console.log("Error parsing claude_data.json:", e);
    }
  }

  return NextResponse.json(usageData, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}

export async function POST(req: Request) {
  try {
    const data = await req.json();
    data.receivedAt = Date.now(); // Record exact time we received the scrape
    // Append the raw intercepted payload to claude_data.json so we don't overwrite previous ones
    fs.appendFileSync(DATA_FILE, JSON.stringify(data) + '\n');
    console.log("✅ Intercepted Claude data:", JSON.stringify(data).substring(0, 100) + "...");
    
    return NextResponse.json({ success: true }, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
      }
    });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to process' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
