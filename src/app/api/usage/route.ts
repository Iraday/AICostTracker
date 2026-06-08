import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const getAppDataPath = () => process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : '/var/local');
const getHomePath = () => process.env.USERPROFILE || process.env.HOME || '';

export async function GET() {
  const usageData = {
    openai: { 
      limits: [
        { label: '5h', usedPercentage: 2, resetText: '11:09 PM' }, // 98% remaining = 2% used
        { label: 'Weekly', usedPercentage: 94, resetText: 'Jun 11' } // 6% remaining = 94% used
      ]
    },
    claude: { 
      limits: [
        { label: 'Current session', usedPercentage: 100, resetText: 'Resets in 3 hr 40 min' },
        { label: 'Weekly limits (All models)', usedPercentage: 49, resetText: 'Resets in 8 hr 50 min' }
      ]
    },
    antigravity: { 
      limits: [
        { label: 'Daily', usedPercentage: 15, resetText: 'Resets in 5 hr' }
      ]
    },
  };

  // We can inject logic here to read from local files and dynamically update these percentages
  // For now, these default structures match the user's expected formats for testing.

  return NextResponse.json(usageData);
}
